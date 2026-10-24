"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DisplayBlock } from "@/lib/session-format";
import type { BlockType, WodFormat } from "@/lib/programming";
import styles from "./session.module.css";
import { SessionItemRow } from "../dashboard/session-item-row";
import { VideoModal } from "../dashboard/session/video-modal";
import { REPLACE_REASONS, type EquivalentOption } from "@/lib/movement-equivalents";
import { CARDIO_ZONES, cardioLine, paceText } from "@/lib/cardio";
import { saveSessionResult, updateSessionRecap, type BlocSummary, type ResultKind, type SessionBlocResult } from "./actions";
import { SessionPhotos, type PhotoAnalysisContext } from "@/components/session-photos";
import type { PhotoExtraction } from "@/app/api/extract-photo-data/route";
import type { LastResult } from "@/lib/last-results";
import { useLongPress } from "@/lib/use-long-press";
import {
  getVolume,
  releaseAudio,
  setVolume,
  soundCount,
  soundCountAccent,
  soundDouble,
  soundRest,
  soundTick,
  soundTransition,
  soundTriple,
  soundWork,
  announce,
  prepareVoices,
  unlockAudio,
  vibrate,
} from "@/lib/session-audio";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

type RuntimeFormat = "nft" | "ft" | "amrap" | "emom" | "tabata";

const FORMAT_LABELS: Record<RuntimeFormat, string> = {
  nft: "Not For Time",
  ft: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  tabata: "Tabata",
};

const COUNTDOWN_SEC = 10;

/** Couleur pleine du format — cohérente sur le sélecteur, le champ durée et le chrono plein écran. */
const FS_COLOR: Record<RuntimeFormat, string> = {
  nft: "#9CA3AF",
  ft: "#EF4444",
  amrap: "#F97316",
  emom: "#3B82F6",
  tabata: "#EF4444",
};
/** Tabata en repos : vert plutôt que la couleur rouge de base du format. */
const TABATA_REST_COLOR = "#22C55E";
/** Couleur du halo du chrono plein écran selon le type de bloc (mission A, paramétrable). */
const BLOCK_HALO_COLOR: Record<string, string> = {
  warmup: "#3B82F6",
  strength: "#EF4444",
  skill: "#EF4444",
  wod: "#F97316",
  accessory: "#F97316",
  conditioning: "#F97316",
  endurance: "#F97316",
  finisher: "#A855F7",
  cooldown: "#22C55E",
};
function haloColorFor(block: DisplayBlock): string {
  if (/finisher/i.test(block.titre)) return BLOCK_HALO_COLOR.finisher;
  return BLOCK_HALO_COLOR[block.type] ?? "#C9A84C";
}
const TICK_MS = 200;

/** "#F97316" + 0.12 → "rgba(249,115,22,0.12)". */
function hexAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Mélange opaque de `hex` à `pct` sur `baseHex` — jamais de canal alpha, donc
 * jamais de transparence qui laisserait deviner ce qu'il y a derrière (bug du
 * chrono plein écran pas vraiment opaque : un gradient rgba(...,0.12) → opaque
 * a un centre réellement translucide, pas juste "teinté"). */
function mixOpaque(hex: string, baseHex: string, pct: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(baseHex.slice(1), 16);
  const mix = (shift: number) => {
    const ca = (a >> shift) & 255;
    const cb = (b >> shift) & 255;
    return Math.round(cb + (ca - cb) * pct);
  };
  return `rgb(${mix(16)},${mix(8)},${mix(0)})`;
}

/** Blocs où la saisie se fait par exercice (charge × reps, plusieurs séries). */
const SERIES_RESULT_TYPES: BlockType[] = ["strength", "accessory", "skill"];
/** Blocs où la saisie se fait une fois pour tout le bloc (temps/rounds/reps bonus). */
const WOD_RESULT_TYPES: BlockType[] = ["wod", "conditioning"];
/** Blocs cardio : un temps par exercice. */
const TIME_RESULT_TYPES: BlockType[] = ["endurance"];

/**
 * Filet de sécurité côté rendu (doc H.13) : un bloc wod/conditioning/endurance
 * sans format de metcon, dont tous les mouvements affichent un "N×M" (sets ×
 * reps numériques) classique, est presque sûrement un bloc de musculation mal
 * catégorisé par la génération (voir aussi reclassifyMisplacedStrengthBlocks,
 * session-adapt.ts — le même filet côté génération, pour les jours à venir).
 * Protège l'affichage des jours déjà générés avant ce correctif.
 */
function looksLikeMisplacedStrengthBlock(block: DisplayBlock): boolean {
  if (!WOD_RESULT_TYPES.includes(block.type) && block.type !== "endurance") return false;
  if (block.format) return false;
  if (block.items.length === 0) return false;
  return block.items.every((it) => /^\d+×\d+(-\d+)?$/.test(it.qty));
}

/** Superset (2 mouvements) ou Circuit (3 et plus) de musculation : le mode vient du plan de séance, jamais de l'utilisateur. */
function isCircuitBlock(block: DisplayBlock): boolean {
  if (!SERIES_RESULT_TYPES.includes(block.type)) return false;
  if (block.format !== "Superset" && block.format !== "Circuit") return false;
  return block.items.filter((i) => !i.noVideo).length >= 2;
}

/** Repos entre tours par défaut (secondes), paramétrable par bloc dans le plan via le repos du mouvement. */
const CIRCUIT_REST_DEFAULT = 90;

/** Gainage/isométrie (doc H.14) : sets + temps tenu, sans reps — ex. "3×30s"
 * de plank. Distingué d'un mouvement de musculation classique (sets+reps)
 * uniquement par les champs réellement renseignés sur l'Exercise. */
function isHoldItem(it: DisplayBlock["items"][number]): boolean {
  return it.sets !== undefined && !!it.time && it.reps === undefined;
}

/** Portés (Farmer's Carry…) : distance au lieu de reps, avec unité (m par défaut). */
function isCarryItem(it: DisplayBlock["items"][number]): boolean {
  if (/carry|farmer|porté|suitcase|yoke/i.test(it.movementName)) return true;
  return !!it.distance && it.reps === undefined && it.time === undefined;
}

function resultKindFor(block: DisplayBlock, it: DisplayBlock["items"][number]): ResultKind {
  if (block.type === "warmup" || block.type === "cooldown") return "warmup";
  if (block.type === "endurance") return "endurance";
  if (isHoldItem(it)) return "hold";
  if (isCarryItem(it)) return "carry";
  if (WOD_RESULT_TYPES.includes(block.type) && block.format) return "wod";
  return it.load?.toLowerCase() === "bw" ? "bodyweight" : "strength";
}

/** Tag de format en haut à droite de la fiche WOD (doc H.11). */
const WOD_FORMAT_TAG: Partial<Record<WodFormat, string>> = {
  ForTime: "🏆 For Time",
  RFT: "🏆 For Time",
  Chipper: "🏆 For Time",
  Simulation: "🏆 For Time",
  AMRAP: "🔁 AMRAP",
  EMOM: "⏱️ EMOM",
  E2MOM: "⏱️ EMOM",
  E3MOM: "⏱️ EMOM",
  Tabata: "🔥 Tabata",
  Intervals: "⏱️ Intervalles",
  Circuit: "🔁 Circuit",
  Superset: "🔁 Superset",
  StraightSets: "🏋️ Sets",
};

/** Ligne de format ("10 Rounds for Time", "Every 2:00 × 4 Sets"...) — doc H.11. */
function wodFormatLine(block: DisplayBlock): string {
  const { format, rounds, duration } = block;
  if (format === "ForTime" || format === "RFT" || format === "Chipper" || format === "Simulation") {
    return rounds ? `${rounds} Rounds for Time` : "For Time";
  }
  if (format === "AMRAP") return duration ? `AMRAP ${duration}` : "AMRAP";
  if (format === "EMOM") return duration ? `EMOM · ${duration}` : "EMOM";
  if (format === "E2MOM") return `Every 2:00 × ${rounds ?? "?"} Sets`;
  if (format === "E3MOM") return `Every 3:00 × ${rounds ?? "?"} Sets`;
  if (format === "Tabata") return duration ? `Tabata · ${duration}` : "Tabata";
  if (format) return duration ? `${format} · ${duration}` : format;
  return "";
}

/** Time cap affiché sur sa propre ligne (doc H.11) — uniquement pour les
 * formats chronométrés où `duration` représente un plafond, pas une cible. */
function wodTimeCap(block: DisplayBlock): string | null {
  const { format, duration } = block;
  if (!duration) return null;
  if (format === "ForTime" || format === "RFT" || format === "Chipper" || format === "Simulation") return duration;
  return null;
}

/** `time` (doc H.14) : temps tenu, pour une série de gainage/isométrie — en
 * plus de `reps`, jamais à la place, pour garder un seul tableau de séries
 * partagé par musculation et gainage.
 * `done` (doc H.10/H.13, Étape 0 point 1) : série validée par l'athlète —
 * grise la ligne et déclenche le repos, reste modifiable. */
type ExerciseSerie = { charge: string; reps: string; rpe?: string; time?: string; /** Gainage « par côté » : temps du côté droit (time = gauche). */ timeD?: string; done?: boolean; unit?: "m" | "km" };

/** Chrono de repos actif (doc H.10) — null quand aucun repos n'est en cours. */
type RestTimerState = { blocIdx: number; exIdx: number; endsAt: number; totalSec: number; label: string } | null;

/** Mouvement remplacé pendant la séance (mission 11) — pour cette séance seulement. */
type Replacement = { id: string; name: string; videoUrl?: string; reason: string; equipmentLabel: string };

/** Séries déjà saisies sous un mouvement qui a été remplacé ou rétabli : elles restent enregistrées pour lui. */
type ArchivedSeries = { exIdx: number; name: string; replacedFrom?: string; series: ExerciseSerie[] };

/** Un tour d'un bloc Superset / Circuit : kg et reps de chaque mouvement, et le mouvement réellement réalisé. */
type CircuitTour = { cells: { charge: string; reps: string }[]; names: string[]; done: boolean };
type CircuitState = { tours: CircuitTour[]; restSec: number };

type BlocState = {
  /** Instant du dernier démarrage (ms epoch) — le chrono se recalcule depuis l'horloge,
   * il continue donc à tourner quand l'app passe en arrière-plan. */
  startedAt: number | null;
  /** Temps déjà écoulé avant la pause en cours (ms). */
  accumulatedMs: number;
  running: boolean;
  done: boolean;
  finalSec: number;
  format: RuntimeFormat;
  /** Durée totale (AMRAP, For Time) ou durée par round × nb de rounds (EMOM) — en secondes. */
  durationSec: number;
  workSec: number;
  restSec: number;
  tabataRounds: number;
  /** Fin du compte à rebours de départ (ms epoch), null hors compte à rebours. */
  countdownEndsAt: number | null;
  open: boolean;
  /** Mouvements cochés du bloc. */
  checked: boolean[];
  /** Rounds comptés en direct pendant un AMRAP (bouton "+ Round"). */
  amrapRounds: number;
  exerciseSeries: ExerciseSerie[][];
  /** Déplié manuellement (doc H.13, Étape 0 point 3) — indépendant de `checked`,
   * qui devient automatique pour les mouvements à séries (coché + replié quand
   * toutes les séries sont validées). Le dépliage reste toujours accessible. */
  expanded: boolean[];
  exerciseTimes: string[];
  /** Cardio / endurance : distance (km) et zone FC par mouvement (partie 2, 1.10). */
  exerciseCardio?: { distance: string; zone: string }[];
  /** Préréglage de repos par mouvement (secondes) — null = valeur par défaut
   * (`parseRestSeconds`). Modifiable avant de lancer la série (doc B.3.a). */
  restOverrides: (number | null)[];
  /** Mouvement de remplacement par mouvement du bloc (null = mouvement prévu). */
  replaced?: (Replacement | null)[];
  archived?: ArchivedSeries[];
  /** Bloc Superset / Circuit (mission 11) : un seul repos à la fin de chaque tour. */
  circuit?: CircuitState;
  temps: string;
  rounds: string;
  score: string;
  /** Version réellement réalisée du Metcon/Finisher (doc H.11). */
  rxScaled: "rx" | "scaled";
  /** Formats à intervalles : un temps par série. */
  roundTimes?: string[];
};

function fmtMS(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Affichage du champ durée réglable : "0:05" sous la minute, "1:05" au-delà. */
function fmtDurationAdjust(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** +/− du champ durée réglable, par pas de `step` secondes. */
function stepDuration(current: number, direction: "+" | "-", step: number, min: number, max: number): number {
  const next = direction === "+" ? current + step : current - step;
  return Math.min(max, Math.max(min, next));
}

function fmtHMS(totalSec: number): string {
  const t = Math.max(0, totalSec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Temps écoulé du bloc, calculé depuis l'horloge (pas un compteur incrémenté). */
function elapsedSec(b: BlocState, now: number): number {
  const runningMs = b.running && b.startedAt ? now - b.startedAt : 0;
  return Math.max(0, Math.floor((b.accumulatedMs + runningMs) / 1000));
}

/** Repos suggéré par Claude ("90s", "2min"...) → secondes. Repli par type de bloc sinon. */
function parseRestSeconds(rest: string | undefined, blockType: BlockType): number {
  if (rest) {
    const min = rest.match(/(\d+)\s*min/i);
    if (min) return parseInt(min[1], 10) * 60;
    const num = rest.match(/(\d+)/);
    if (num) return parseInt(num[1], 10);
  }
  return blockType === "strength" ? 90 : 60;
}

type TabataView = { round: number; phase: "work" | "rest"; remaining: number; finished: boolean };

function tabataView(b: BlocState, elapsed: number): TabataView {
  const cycle = Math.max(1, b.workSec + b.restSec);
  const round = Math.floor(elapsed / cycle) + 1;
  const inCycle = elapsed % cycle;
  const phase: "work" | "rest" = inCycle < b.workSec ? "work" : "rest";
  const remaining = phase === "work" ? b.workSec - inCycle : cycle - inCycle;
  return { round, phase, remaining, finished: round > b.tabataRounds };
}

export type SessionKind = "ecm" | "sportHorsEcm" | "repos" | "recuperationActive";

const SESSION_KIND_ICON: Record<SessionKind, string> = {
  ecm: "⚡",
  sportHorsEcm: "🥊",
  repos: "🛌",
  recuperationActive: "💤",
};

/** Met de côté les séries saisies d'un mouvement avant qu'il soit remplacé ou rétabli. */
function archiveSeries(x: BlocState, exIdx: number, name: string, replacedFrom?: string): ArchivedSeries[] {
  const series = (x.exerciseSeries[exIdx] ?? []).filter((s) => s.charge.trim() || s.reps.trim() || s.time?.trim() || s.timeD?.trim());
  return series.length > 0 ? [...(x.archived ?? []), { exIdx, name, replacedFrom, series }] : (x.archived ?? []);
}

function makeCircuit(block: DisplayBlock, lastResults: Record<string, LastResult>): CircuitState {
  const tours = Math.max(1, ...block.items.map((it) => it.sets ?? 1), block.rounds ?? 1);
  const restFromPlan = block.items.map((it) => parseRestSeconds(it.rest, block.type)).find((n) => n > 0);
  const cells = block.items.map((it) => {
    const last = lastResults[it.name] ?? lastResults[it.movementName];
    return { charge: last && last.charge > 0 ? String(last.suggestion) : "", reps: "" };
  });
  return {
    tours: Array.from({ length: tours }, () => ({ cells: cells.map((c) => ({ ...c })), names: block.items.map((it) => it.name), done: false })),
    restSec: block.items.some((it) => it.rest) ? (restFromPlan ?? CIRCUIT_REST_DEFAULT) : CIRCUIT_REST_DEFAULT,
  };
}

export function SessionRunnerV2({
  sessionName,
  sessionMeta,
  blocks: baseBlocks,
  initial,
  date,
  variant,
  programSlug,
  programDay,
  equivalents = {},
  lastResults = {},
  initialPhotos = [],
  photosEnabled = false,
  analysisContext,
  sessionKind = "ecm",
  recuperationDefaultMinutes,
  onSaveResult = saveSessionResult,
  onUpdateRecap = updateSessionRecap,
  doneRedirect = "/session/recap",
}: {
  sessionName: string;
  sessionMeta: string;
  blocks: DisplayBlock[];
  initial: { format: RuntimeFormat; durationMin: number; tabataRounds: number }[];
  date: string;
  variant: "A" | "B";
  /** Suite ordonnée (1.4) : programme et séance du modèle faite, pour avancer la position. */
  programSlug?: string;
  programDay?: number;
  /** Équivalents proposés par id de mouvement prévu (mission 11) — absent = pas de bouton « Remplacer ». */
  equivalents?: Record<string, EquivalentOption[]>;
  /** Dernier résultat connu par mouvement — rappel et charge suggérée. */
  lastResults?: Record<string, LastResult>;
  /** Photos déjà enregistrées pour la séance du jour. */
  initialPhotos?: string[];
  /** Vercel Blob configuré — sinon le bouton photo reste masqué. */
  photosEnabled?: boolean;
  /** Contexte transmis à l'analyse Claude d'une photo ajoutée en fin de séance. */
  analysisContext?: PhotoAnalysisContext;
  /** ECM (défaut) = chrono par bloc inchangé. Les 3 autres kinds masquent le
   * chrono par bloc — le chrono général du bandeau du haut suffit (ou aucun
   * chrono pour "repos") — au profit d'une simple checklist par bloc. */
  sessionKind?: SessionKind;
  /** Récupération active seulement : durée par défaut (min) du chrono général, ajustable. */
  recuperationDefaultMinutes?: number;
  /** Cible de l'enregistrement — par défaut la séance principale du jour
   * (Session). Une 2e activité du même jour (doc G.3) passe ses propres
   * actions, pointant vers ExtraActivity plutôt que Session. */
  onSaveResult?: typeof saveSessionResult;
  onUpdateRecap?: typeof updateSessionRecap;
  /** Page affichée une fois la séance terminée — /session/recap par défaut
   * (lit Session par date ; une 2e activité n'y correspond pas). */
  doneRedirect?: string;
}) {
  const router = useRouter();
  const storageKey = `elc_session_${date}`;

  const makeInitial = useCallback(
    (): BlocState[] =>
      initial.map((cfg, i) => {
        const type = baseBlocks[i]?.type;
        const items = baseBlocks[i]?.items ?? [];
        return {
          startedAt: null,
          accumulatedMs: 0,
          running: false,
          done: false,
          finalSec: 0,
          format: cfg.format,
          durationSec: cfg.durationMin * 60,
          workSec: 20,
          restSec: 10,
          tabataRounds: cfg.tabataRounds,
          countdownEndsAt: null,
          open: i === 0,
          checked: items.map(() => false),
          amrapRounds: 0,
          circuit: isCircuitBlock(baseBlocks[i]) ? makeCircuit(baseBlocks[i], lastResults) : undefined,
          exerciseSeries:
            isCircuitBlock(baseBlocks[i])
              ? items.map(() => [])
              : type && (SERIES_RESULT_TYPES.includes(type) || looksLikeMisplacedStrengthBlock(baseBlocks[i]))
              ? items.map((it) => {
                  // Une ligne par série prévue (doc H.13, Étape 0 point 2) — 5 lignes
                  // pour un 5×5, pas seulement 1. Repli à 1 ligne si `sets` est inconnu.
                  const n = Math.max(1, it.sets ?? 1);
                  // Charge préremplie avec la charge suggérée d'après la dernière séance (musculation seulement).
                  const last = lastResults[it.name] ?? lastResults[it.movementName];
                  const charge = last && last.charge > 0 && !isHoldItem(it) && !isCarryItem(it) ? String(last.suggestion) : "";
                  return Array.from({ length: n }, () => ({ charge, reps: "", done: false }));
                })
              : [],
          expanded: items.map(() => false),
          exerciseTimes: items.map(() => ""),
          exerciseCardio: items.map(() => ({ distance: "", zone: "" })),
          restOverrides: items.map(() => null),
          replaced: items.map(() => null),
          archived: [],
          temps: "",
          rounds: "",
          score: "",
          rxScaled: "rx",
        };
      }),
    [baseBlocks, initial, lastResults],
  );

  const [blocks, setBlocks] = useState<BlocState[]>(makeInitial);
  // Blocs tels que vus par l'athlète : les mouvements remplacés prennent le nom du remplaçant (mission 11).
  const blockData = useMemo(
    () =>
      baseBlocks.map((b, i) => ({
        ...b,
        items: b.items.map((it, j) => {
          const rep = blocks[i]?.replaced?.[j];
          return rep
            ? { ...it, name: rep.name, movementName: rep.name, movementId: rep.id, videoUrl: rep.videoUrl, replacedFrom: it.name, replacedReason: rep.reason, plannedMovementId: it.movementId }
            : { ...it, plannedMovementId: it.movementId };
        }),
      })),
    [baseBlocks, blocks],
  );
  const [replaceSheet, setReplaceSheet] = useState<{ blocIdx: number; exIdx: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(() => Date.now());
  // Récupération active seulement : objectif de durée du chrono général,
  // ajustable par [−]/[+] avant/pendant la séance — purement indicatif, ne
  // gate rien (le chrono général reste l'écoulé réel, sessionStartedAt→now).
  const [recupTargetSec, setRecupTargetSec] = useState<number>(() => (recuperationDefaultMinutes ?? 30) * 60);
  const [now, setNow] = useState<number>(() => Date.now());
  const [restored, setRestored] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  /** Vrai dès "Démarrer la séance" — masque ce bouton, qui serait sinon
   * incohérent affiché à côté de "Fermer" pendant une séance déjà en cours
   * (doc H.8). Ne redevient jamais faux : la fin de séance se fait via
   * "Terminer la séance", pas en revenant sur ce bouton. */
  const [sessionStarted, setSessionStarted] = useState(false);
  /** Bloc affiché en chrono plein écran (null = liste des mouvements). */
  const [fullscreen, setFullscreen] = useState<number | null>(null);
  /** Aperçu en lecture seule du déroulé — jamais affiché par défaut (doc G.4). */
  const [showPreview, setShowPreview] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  /** Chrono de repos entre deux séries — rendu in situ à l'emplacement du
   * réglage "Repos entre séries" du mouvement concerné (doc H.10, remplace
   * l'ancien overlay plein écran + mini-barre flottante qui chevauchait la
   * barre de stats en bas d'écran). */
  const [restTimer, setRestTimer] = useState<RestTimerState>(null);
  /** Flash + "C'est reparti !" au même emplacement, quelques instants après la
   * fin naturelle du repos (doc H.10) — jamais déclenché par une annulation. */
  const [restJustEnded, setRestJustEnded] = useState<{ blocIdx: number; exIdx: number } | null>(null);
  const restTickRef = useRef<number>(-1);
  const restTenRef = useRef(false);
  const blocRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const savedRef = useRef(false);

  useEffect(() => {
    setVolumeState(getVolume());
    return () => releaseAudio();
  }, []);

  // Filet de sécurité iOS : le son et la voix ne se débloquent que depuis un
  // vrai geste. "Démarrer" le fait déjà, mais pas une séance reprise après un
  // rechargement (le chrono tournait déjà) — d'où ce déblocage au premier tap,
  // où qu'il tombe sur la page.
  useEffect(() => {
    const onFirstTap = () => unlockAudio();
    window.addEventListener("pointerdown", onFirstTap, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstTap);
  }, []);

  // Reprise après un retour dans l'app (ou un rechargement) : tout l'état du
  // chrono est relu depuis localStorage, les timestamps font le reste.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { sessionStartedAt: number; blocks: BlocState[]; sessionStarted?: boolean };
        if (saved.blocks?.length === initial.length && typeof saved.sessionStartedAt === "number") {
          // Rétrocompatible avec une séance sauvegardée avant l'ajout du
          // préréglage de repos par mouvement (restOverrides absent), ou avant
          // le dépliage manuel séparé du coché automatique (expanded absent,
          // doc H.13 Étape 0 point 3).
          setBlocks(
            saved.blocks.map((b) => ({
              ...b,
              restOverrides: b.restOverrides ?? b.exerciseTimes.map(() => null),
              expanded: b.expanded ?? b.checked,
              replaced: b.replaced ?? b.exerciseTimes.map(() => null),
              archived: b.archived ?? [],
              circuit: b.circuit,
            })),
          );
          setSessionStartedAt(saved.sessionStartedAt);
          // Rétrocompatible avec une séance sauvegardée avant sessionStarted
          // (doc H.8) : on déduit l'état depuis les blocs déjà actifs.
          setSessionStarted(saved.sessionStarted ?? saved.blocks.some((b) => b.running || b.done));
        }
      }
    } catch {
      // Stockage indisponible — la séance démarre simplement à zéro.
    }
    setRestored(true);
  }, [storageKey, initial.length]);

  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ sessionStartedAt, blocks, sessionStarted }));
    } catch {
      // Quota/mode privé — sans persistance, le chrono reste juste tant que l'onglet vit.
    }
  }, [blocks, sessionStartedAt, sessionStarted, restored, storageKey]);

  // Horloge unique : tous les affichages dérivent de `now`.
  useEffect(() => {
    if (sessionDone) return;
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [sessionDone]);

  // Wake lock — écran allumé pendant toute la séance, réactivé au retour dans l'app.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let released = false;

    async function request() {
      try {
        if ("wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
      } catch {
        // Wake Lock non supporté ou refusé — pas bloquant.
      }
    }
    void request();

    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  const finishBloc = useCallback((i: number, endSec?: number) => {
    setBlocks((prev) =>
      prev.map((x, idx) => {
        if (idx !== i) return x;
        const sec = endSec ?? elapsedSec(x, Date.now());
        return { ...x, running: false, startedAt: null, accumulatedMs: sec * 1000, done: true, finalSec: sec };
      }),
    );
  }, []);

  // Compte à rebours, transitions sonores et fins automatiques.
  const tickRef = useRef<Record<number, number>>({});
  const minuteRef = useRef<Record<number, number>>({});
  const tabataRef = useRef<Record<number, string>>({});
  /** Annonces déjà passées (mi-temps, 10 s...) — une seule fois par bloc. */
  const spokenRef = useRef<Record<number, Set<string>>>({});

  useEffect(() => {
    blocks.forEach((b, i) => {
      const spoken = (spokenRef.current[i] ??= new Set<string>());
      const once = (key: string, fn: () => void) => {
        if (spoken.has(key)) return;
        spoken.add(key);
        fn();
      };
      /** Décompte : un bip aigu par seconde restante (3 · 2 · 1). */
      const beepSecond = (secondsLeft: number) => {
        if (tickRef.current[i] === secondsLeft) return;
        tickRef.current[i] = secondsLeft;
        soundCount();
        vibrate([60]);
      };
      /** Alerte des 10 dernières secondes — une fois par `key` (par minute sur l'EMOM). */
      const tenSeconds = (key: string) => once(key, () => announce("ten-seconds"));
      /** Fin d'un chrono : 3 bips imposants, vibration longue et annonce. */
      const finish = () => {
        soundTriple();
        vibrate([600]);
      };

      if (b.countdownEndsAt) {
        const remaining = Math.ceil((b.countdownEndsAt - now) / 1000);
        if (remaining <= 0) {
          tickRef.current[i] = -1;
          // Départ réel du chrono (T=0) : bip accentué + voix, tous les deux ici,
          // pas avant — sinon l'accent tombe une seconde trop tôt (au "1").
          soundCountAccent();
          announce("lets-go", { beep: false });
          // EMOM et Tabata : le premier round est annoncé juste après « Let's Go! ».
          if (b.format === "emom") announce(b.durationSec <= 60 ? "last-round" : "round-1", { beep: false });
          if (b.format === "tabata") announce(b.tabataRounds <= 1 ? "last-round" : "round-1", { beep: false });
          vibrate([400]);
          setFullscreen(i);
          setBlocks((prev) =>
            prev.map((x, idx) =>
              idx === i ? { ...x, countdownEndsAt: null, running: true, startedAt: Date.now() } : x,
            ),
          );
          return;
        }
        if (remaining <= 3) beepSecond(remaining);
        return;
      }

      if (!b.running || b.done) return;
      const elapsed = elapsedSec(b, now);

      if (b.format === "amrap") {
        const total = b.durationSec;
        const remaining = total - elapsed;
        if (remaining <= 0) {
          finish();
          finishBloc(i, total);
          return;
        }
        if (total >= 20 && elapsed >= Math.floor(total / 2)) once("half", () => announce("halfway"));
        if (remaining <= 10) tenSeconds("ten");
        if (remaining <= 3) beepSecond(remaining);
        return;
      }

      // For Time : annonces de départ et de fin seulement (pas de fin imposée, donc ni mi-temps ni « Ten seconds! »).
      if (b.format === "ft") return;

      if (b.format === "emom") {
        const total = b.durationSec;
        if (elapsed >= total) {
          finish();
          finishBloc(i, total);
          return;
        }
        const minute = Math.floor(elapsed / 60) + 1;
        const totalMinutes = Math.max(1, Math.round(total / 60));
        const secondsLeftInMinute = 60 - (elapsed % 60);
        // "Halfway there !" une seule fois, à la moitié du temps total du bloc (doc H.12).
        if (total >= 20 && elapsed >= Math.floor(total / 2)) once("half", () => announce("halfway"));
        // "Ten seconds !" une fois par minute (doc H.12), avant les 3 bips finaux.
        if (secondsLeftInMinute <= 10) tenSeconds(`ten-${minute}`);
        // Compte à rebours des 3 dernières secondes par minute.
        if (secondsLeftInMinute <= 3) beepSecond(secondsLeftInMinute);
        if (minuteRef.current[i] === undefined) minuteRef.current[i] = minute;
        else if (minute !== minuteRef.current[i]) {
          minuteRef.current[i] = minute;
          tickRef.current[i] = -1;
          soundTransition();
          vibrate([120]);
          // "Let's Go!" seulement au tout premier départ du bloc — ici on garde
          // uniquement le numéro de tour à chaque nouvelle minute.
          announce(minute >= totalMinutes ? "last-round" : (`round-${minute}` as const), { beep: false });
          // Mouvements pas tous cochés à la fin de la minute : un bip de rappel
          // en plus, sans remplacer l'annonce du round.
          const allChecked = b.checked.length > 0 && b.checked.every(Boolean);
          if (!allChecked) soundTick();
        }
        return;
      }

      if (b.format === "tabata") {
        const view = tabataView(b, elapsed);
        if (view.finished) {
          finish();
          finishBloc(i, b.tabataRounds * (b.workSec + b.restSec));
          return;
        }
        // « Ten seconds! » avant la fin du bloc entier.
        const tabataTotal = b.tabataRounds * (b.workSec + b.restSec);
        if (tabataTotal >= 20 && tabataTotal - elapsed <= 10) tenSeconds("ten");
        // Bips sur les 3 dernières secondes, aussi bien en travail qu'en repos.
        if (view.remaining <= 3) beepSecond(view.remaining);
        // Pas de "Ten seconds!" en Tabata.
        // Mi-temps de la phase travail : double bip, pas de vocal.
        if (view.phase === "work" && view.remaining <= Math.ceil(b.workSec / 2)) {
          once(`half-${view.round}`, () => soundDouble());
        }
        const key = `${view.round}-${view.phase}`;
        if (tabataRef.current[i] === undefined) tabataRef.current[i] = key;
        else if (tabataRef.current[i] !== key) {
          tabataRef.current[i] = key;
          tickRef.current[i] = -1;
          vibrate([120]);
          if (view.phase === "work") {
            soundWork();
            // « Last round! » au début du dernier round, à la place de « Round X! ».
            announce(view.round >= b.tabataRounds ? "last-round" : (`round-${view.round}` as const), { beep: false });
          } else {
            soundRest();
            announce("rest", { beep: false });
          }
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // Décompte du repos entre séries — bips, "10 seconds!" et fin annoncée.
  useEffect(() => {
    if (!restTimer) return;
    const remaining = Math.ceil((restTimer.endsAt - now) / 1000);
    if (remaining <= 0) {
      if (restTickRef.current !== 0) {
        restTickRef.current = 0;
        soundTriple();
        vibrate([600]);
        const { blocIdx, exIdx } = restTimer;
        setRestTimer(null);
        setRestJustEnded({ blocIdx, exIdx });
        setTimeout(() => setRestJustEnded(null), 1800);
      }
      return;
    }
    if (remaining === 10 && !restTenRef.current) {
      restTenRef.current = true;
      announce("ten-seconds");
    }
    // Bips 3 · 2 · 1 classiques — l'accent (soundCountAccent) reste réservé au
    // départ réel (T=0, branche remaining <= 0 ci-dessus) pour ne pas tomber
    // une seconde trop tôt, comme pour le décompte de départ de bloc.
    if (remaining <= 3 && restTickRef.current !== remaining) {
      restTickRef.current = remaining;
      soundCount();
      vibrate([60]);
    }
  }, [now, restTimer]);

  function startTimer(i: number) {
    unlockAudio(); // geste utilisateur : seul moment où iOS autorise le son
    const cfg = blocks[i];
    prepareVoices(cfg?.format === "emom" ? Math.round(cfg.durationSec / 60) : cfg?.format === "tabata" ? cfg.tabataRounds : 0);
    setBlocks((prev) =>
      prev.map((x, idx) => {
        if (idx !== i || x.running || x.done || x.countdownEndsAt) return x;
        // Reprise après pause : pas de nouveau compte à rebours.
        if (x.accumulatedMs > 0) return { ...x, running: true, startedAt: Date.now() };
        return { ...x, countdownEndsAt: Date.now() + COUNTDOWN_SEC * 1000 };
      }),
    );
  }

  function pauseTimer(i: number) {
    setBlocks((prev) =>
      prev.map((x, idx) => {
        if (idx !== i || !x.running) return x;
        const acc = x.accumulatedMs + (x.startedAt ? Date.now() - x.startedAt : 0);
        return { ...x, running: false, startedAt: null, accumulatedMs: acc };
      }),
    );
  }

  function resetTimer(i: number) {
    tickRef.current[i] = -1;
    delete minuteRef.current[i];
    delete tabataRef.current[i];
    delete spokenRef.current[i];
    setBlocks((prev) =>
      prev.map((x, idx) =>
        idx === i
          ? { ...x, startedAt: null, accumulatedMs: 0, running: false, done: false, finalSec: 0, countdownEndsAt: null }
          : x,
      ),
    );
  }

  function doneBloc(i: number) {
    const b = blocks[i];
    const sec = elapsedSec(b, Date.now());
    if (b.format === "ft" && b.running) {
      // Fin d'un For Time : les 3 bips imposants, puis le temps réalisé.
      soundTriple();
      // Fin d'un For Time : les 3 bips suffisent (aucune annonce hors liste fermée).
      vibrate([600]);
    } else {
      soundTransition();
      vibrate([80]);
    }
    setFullscreen(null);
    finishBloc(i, sec);
  }

  function cancelCountdown(i: number) {
    tickRef.current[i] = -1;
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, countdownEndsAt: null } : x)));
  }

  function changeFormat(i: number, fmt: RuntimeFormat) {
    setBlocks((prev) =>
      prev.map((x, idx) =>
        idx === i ? { ...x, format: fmt, startedAt: null, accumulatedMs: 0, running: false, countdownEndsAt: null } : x,
      ),
    );
  }

  function patchBloc(i: number, patch: Partial<BlocState>) {
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function toggleOpen(i: number) {
    setBlocks((prev) => prev.map((x, idx) => (idx === i ? { ...x, open: !x.open } : x)));
  }

  const openBloc = useCallback((i: number) => {
    setBlocks((prev) => prev.map((x, idx) => ({ ...x, open: idx === i ? true : x.open })));
    setTimeout(() => blocRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  /** "▷ Démarrer la séance" du header (doc G.4, socle commun) — ouvre le
   * premier bloc non terminé et, en ECM, lance aussi son chrono. */
  function startSession() {
    // Déjà démarrée : ne rien refaire (sinon on rouvrirait/relancerait le chrono du premier bloc non terminé).
    if (sessionStarted) return;
    setShowPreview(false);
    setSessionStarted(true);
    const idx = blocks.findIndex((b) => !b.done);
    if (idx === -1) return;
    openBloc(idx);
    if (sessionKind === "ecm" && !blocks[idx].running && blocks[idx].accumulatedMs === 0 && !blocks[idx].countdownEndsAt) {
      startTimer(idx);
    }
  }

  /** AMRAP : un tap = un round complété (compté en direct, repris dans les résultats). */
  function addAmrapRound(i: number) {
    soundTransition();
    vibrate([60]);
    setBlocks((prev) =>
      prev.map((x, idx) =>
        idx === i ? { ...x, amrapRounds: x.amrapRounds + 1, rounds: String(x.amrapRounds + 1) } : x,
      ),
    );
  }

  /** Photos ajoutées pendant la séance — enregistrées tout de suite (upsert). */
  function changePhotos(next: string[]) {
    setPhotos(next);
    void onUpdateRecap(date, { photos: next });
  }

  /** Analyse Claude de la photo (calories, retour narratif) — l'ajout de photo ne se
   * fait qu'ici, en fin de séance ; /session/recap n'affiche plus que le résultat. */
  function handlePhotoExtracted(result: PhotoExtraction) {
    const patch: Parameters<typeof updateSessionRecap>[1] = {};
    if (typeof result.calories === "number") {
      patch.calories = result.calories;
      patch.caloriesSource = "photo_auto";
    }
    if (result.retourNarratif || result.bpmMoyen || result.heartRateZones) {
      patch.photoAnalysis = {
        donneesBrutes: result.donneesBrutes,
        retourNarratif: result.retourNarratif,
        bpmMoyen: result.bpmMoyen,
        heartRateZones: result.heartRateZones,
        caloriesActivite: result.caloriesActivite ?? null,
        caloriesTotales: result.caloriesTotales ?? null,
        dureeMontre: result.dureeMontre,
      };
    }
    if (Object.keys(patch).length > 0) void onUpdateRecap(date, patch);
  }

  function changeVolume(value: number) {
    setVolumeState(value);
    setVolume(value);
  }

  function toggleChecked(blocIdx: number, exIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx ? { ...x, checked: x.checked.map((c, j) => (j === exIdx ? !c : c)) } : x,
      ),
    );
    vibrate([30]);
  }

  /** Nouvelle série pré-remplie avec les valeurs de la précédente — ne lance
   * PAS le repos (doc H.13, Étape 0 point 1) : seule la validation d'une
   * série (✓) démarre le chrono de repos. */
  function addSerie(blocIdx: number, exIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx
          ? {
              ...x,
              exerciseSeries: x.exerciseSeries.map((es, j) => {
                if (j !== exIdx) return es;
                const last = es[es.length - 1];
                return [...es, { charge: last?.charge ?? "", reps: last?.reps ?? "", rpe: last?.rpe, done: false }];
              }),
            }
          : x,
      ),
    );
  }

  /** ✓ par série (doc H.10 point 1, H.13 points 1, 3 et 4) : valider une série
   * la grise et lance le repos — sauf si c'est la dernière série du mouvement,
   * où aucun repos ne démarre (point 4). Quand toutes les séries sont
   * validées, le mouvement se coche et se replie seul (point 3) ; il reste
   * modifiable par un dépliage manuel. */
  function toggleSerieDone(blocIdx: number, exIdx: number, serieIdx: number) {
    // Lu depuis l'état courant, pas depuis la fonction passée à setBlocks : React l'exécute plus
    // tard, le repos ne démarrait donc jamais (mission 8).
    const current = blocks[blocIdx]?.exerciseSeries[exIdx] ?? [];
    const isLast = serieIdx === current.length - 1;
    const nowDone = !current[serieIdx]?.done;
    setBlocks((prev) =>
      prev.map((x, i) => {
        if (i !== blocIdx) return x;
        const es = x.exerciseSeries[exIdx] ?? [];
        const updatedEs = es.map((s, k) => (k === serieIdx ? { ...s, done: nowDone } : s));
        const allDone = updatedEs.length > 0 && updatedEs.every((s) => s.done);
        return {
          ...x,
          exerciseSeries: x.exerciseSeries.map((row, j) => (j === exIdx ? updatedEs : row)),
          checked: x.checked.map((c, j) => (j === exIdx ? allDone : c)),
          expanded: x.expanded.map((e, j) => (j === exIdx ? (allDone ? false : e) : e)),
        };
      }),
    );
    if (nowDone && !isLast) {
      // Valider une série (même pendant un repos) relance le repos à sa durée complète.
      startRestTimer(blocIdx, exIdx);
    } else if (restTimer && restTimer.blocIdx === blocIdx && restTimer.exIdx === exIdx) {
      // Décocher pendant le repos, ou valider la dernière série : aucun décompte.
      cancelRestTimer();
    }
  }

  /** Dépliage manuel d'un mouvement à séries, indépendant du coché automatique
   * (doc H.13, Étape 0 point 3) — toujours disponible pour modifier les valeurs. */
  function toggleExpanded(blocIdx: number, exIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx ? { ...x, expanded: x.expanded.map((e, j) => (j === exIdx ? !e : e)) } : x,
      ),
    );
  }

  /** Saisie d'une case (kg ou reps) d'un mouvement dans un tour non validé. */
  function updateCircuitCell(blocIdx: number, tourIdx: number, exIdx: number, patch: Partial<{ charge: string; reps: string }>) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i !== blocIdx || !x.circuit
          ? x
          : {
              ...x,
              circuit: {
                ...x.circuit,
                tours: x.circuit.tours.map((t, ti) =>
                  ti === tourIdx ? { ...t, cells: t.cells.map((c, j) => (j === exIdx ? { ...c, ...patch } : c)) } : t,
                ),
              },
            },
      ),
    );
  }

  /** Valide le tour en cours : un seul repos démarre, sauf après le dernier tour qui termine le bloc. */
  function validateTour(blocIdx: number) {
    const st = blocks[blocIdx]?.circuit;
    if (!st) return;
    const tourIdx = st.tours.findIndex((t) => !t.done);
    if (tourIdx === -1) return;
    const isLast = tourIdx === st.tours.length - 1;
    const names = blockData[blocIdx].items.map((it) => it.name);
    unlockAudio();
    setBlocks((prev) =>
      prev.map((x, i) => {
        if (i !== blocIdx || !x.circuit) return x;
        const tours = x.circuit.tours.map((t, ti) => (ti === tourIdx ? { ...t, names, done: true } : t));
        return isLast
          ? { ...x, circuit: { ...x.circuit, tours }, checked: x.checked.map(() => true), done: true, running: false, startedAt: null }
          : { ...x, circuit: { ...x.circuit, tours } };
      }),
    );
    if (isLast) {
      cancelRestTimer();
      vibrate([80]);
      return;
    }
    restTickRef.current = -1;
    restTenRef.current = false;
    setRestJustEnded(null);
    setRestTimer({
      blocIdx,
      exIdx: -1,
      endsAt: Date.now() + st.restSec * 1000,
      totalSec: st.restSec,
      label: `Tour ${tourIdx + 1}`,
    });
  }

  function addCircuitTour(blocIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) => {
        if (i !== blocIdx || !x.circuit) return x;
        const last = x.circuit.tours[x.circuit.tours.length - 1];
        return {
          ...x,
          circuit: { ...x.circuit, tours: [...x.circuit.tours, { cells: last.cells.map((c) => ({ charge: c.charge, reps: "" })), names: last.names, done: false }] },
          // Un bloc terminé qu'on prolonge redevient actif.
          done: false,
          checked: x.checked.map(() => false),
        };
      }),
    );
  }

  function setCircuitRest(blocIdx: number, sec: number) {
    setBlocks((prev) =>
      prev.map((x, i) => (i === blocIdx && x.circuit ? { ...x, circuit: { ...x.circuit, restSec: Math.min(600, Math.max(5, sec)) } } : x)),
    );
  }

  /** Remplace un mouvement pour cette séance (mission 11) : séries et répétitions prévues conservées,
   * charges préremplies avec l'historique du nouveau mouvement s'il en a un. */
  function replaceMovement(blocIdx: number, exIdx: number, option: EquivalentOption, reason: string) {
    const planned = baseBlocks[blocIdx]?.items[exIdx];
    const current = blockData[blocIdx]?.items[exIdx];
    if (!planned || !current) return;
    const history = lastResults[option.name];
    const n = Math.max(1, planned.sets ?? 1);
    // Superset / Circuit : le remplacement vaut pour tous les tours restants ; les tours faits gardent leur mouvement.
    if (isCircuitBlock(baseBlocks[blocIdx])) {
      setBlocks((prev) =>
        prev.map((x, i) =>
          i !== blocIdx || !x.circuit
            ? x
            : {
                ...x,
                replaced: (x.replaced ?? x.checked.map(() => null)).map((r, j) =>
                  j === exIdx ? { id: option.id, name: option.name, videoUrl: option.videoUrl, reason, equipmentLabel: option.equipmentLabel } : r,
                ),
                circuit: {
                  ...x.circuit,
                  tours: x.circuit.tours.map((t) =>
                    t.done ? t : { ...t, cells: t.cells.map((c, j) => (j === exIdx ? { charge: history ? String(history.suggestion) : "", reps: "" } : c)) },
                  ),
                },
              },
        ),
      );
      setReplaceSheet(null);
      setToast(`Remplacé par ${option.name}`);
      setTimeout(() => setToast(null), 1800);
      return;
    }
    setBlocks((prev) =>
      prev.map((x, i) =>
        i !== blocIdx
          ? x
          : {
              ...x,
              archived: archiveSeries(x, exIdx, current.name, current.replacedFrom),
              replaced: (x.replaced ?? x.checked.map(() => null)).map((r, j) =>
                j === exIdx ? { id: option.id, name: option.name, videoUrl: option.videoUrl, reason, equipmentLabel: option.equipmentLabel } : r,
              ),
              exerciseSeries: x.exerciseSeries.map((row, j) =>
                j === exIdx ? Array.from({ length: n }, () => ({ charge: history ? String(history.suggestion) : "", reps: "", done: false })) : row,
              ),
              checked: x.checked.map((c, j) => (j === exIdx ? false : c)),
              expanded: x.expanded.map((e, j) => (j === exIdx ? true : e)),
            },
      ),
    );
    if (restTimer && restTimer.blocIdx === blocIdx && restTimer.exIdx === exIdx) cancelRestTimer();
    setReplaceSheet(null);
    setToast(`Remplacé par ${option.name}`);
    setTimeout(() => setToast(null), 1800);
  }

  /** « Rétablir le mouvement prévu » : les séries saisies sous le remplaçant restent enregistrées pour lui. */
  function revertMovement(blocIdx: number, exIdx: number) {
    const planned = baseBlocks[blocIdx]?.items[exIdx];
    const current = blockData[blocIdx]?.items[exIdx];
    if (!planned || !current) return;
    const n = Math.max(1, planned.sets ?? 1);
    if (isCircuitBlock(baseBlocks[blocIdx])) {
      setBlocks((prev) =>
        prev.map((x, i) =>
          i !== blocIdx || !x.circuit
            ? x
            : {
                ...x,
                replaced: (x.replaced ?? x.checked.map(() => null)).map((r, j) => (j === exIdx ? null : r)),
                circuit: { ...x.circuit, tours: x.circuit.tours.map((t) => (t.done ? t : { ...t, cells: t.cells.map((c, j) => (j === exIdx ? { charge: "", reps: "" } : c)) })) },
              },
        ),
      );
      return;
    }
    setBlocks((prev) =>
      prev.map((x, i) =>
        i !== blocIdx
          ? x
          : {
              ...x,
              archived: archiveSeries(x, exIdx, current.name, current.replacedFrom),
              replaced: (x.replaced ?? x.checked.map(() => null)).map((r, j) => (j === exIdx ? null : r)),
              exerciseSeries: x.exerciseSeries.map((row, j) =>
                j === exIdx ? Array.from({ length: n }, () => ({ charge: "", reps: "", done: false })) : row,
              ),
              checked: x.checked.map((c, j) => (j === exIdx ? false : c)),
            },
      ),
    );
    if (restTimer && restTimer.blocIdx === blocIdx && restTimer.exIdx === exIdx) cancelRestTimer();
  }

  /** Chrono de repos entre deux séries — indépendant du chrono du bloc en cours. */
  function startRestTimer(blocIdx: number, exIdx: number) {
    unlockAudio();
    const rest = blockData[blocIdx]?.items[exIdx]?.rest;
    // Préréglage défini par l'athlète (B.3.a) en priorité sur la valeur par défaut.
    const override = blocks[blocIdx]?.restOverrides[exIdx];
    const durationSec = override ?? parseRestSeconds(rest, blockData[blocIdx]?.type);
    restTickRef.current = -1;
    restTenRef.current = false;
    setRestJustEnded(null);
    setRestTimer({
      blocIdx,
      exIdx,
      endsAt: Date.now() + durationSec * 1000,
      totalSec: durationSec,
      label: blockData[blocIdx]?.items[exIdx]?.name ?? "",
    });
  }

  /** "Passer ✕" — annule le repos à tout moment, enchaîne directement sur la
   * série suivante (doc H.10, remplace l'ancienne réduction en mini-barre). */
  function cancelRestTimer() {
    setRestTimer(null);
  }

  function addRestTime(extraSec: number) {
    setRestTimer((prev) => (prev ? { ...prev, endsAt: prev.endsAt + extraSec * 1000 } : prev));
  }

  function updateSerie(blocIdx: number, exIdx: number, serieIdx: number, patch: Partial<ExerciseSerie>) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx
          ? {
              ...x,
              exerciseSeries: x.exerciseSeries.map((es, j) =>
                j === exIdx ? es.map((s, k) => (k === serieIdx ? { ...s, ...patch } : s)) : es,
              ),
            }
          : x,
      ),
    );
  }

  function removeSerie(blocIdx: number, exIdx: number, serieIdx: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx
          ? { ...x, exerciseSeries: x.exerciseSeries.map((es, j) => (j === exIdx ? es.filter((_, k) => k !== serieIdx) : es)) }
          : x,
      ),
    );
  }

  function setExerciseCardio(blocIdx: number, exIdx: number, patch: Partial<{ distance: string; zone: string }>) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx
          ? {
              ...x,
              exerciseCardio: x.exerciseTimes.map((_, j) => {
                const cur = x.exerciseCardio?.[j] ?? { distance: "", zone: "" };
                return j === exIdx ? { ...cur, ...patch } : cur;
              }),
            }
          : x,
      ),
    );
  }

  function setExerciseTime(blocIdx: number, exIdx: number, value: string) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx ? { ...x, exerciseTimes: x.exerciseTimes.map((t, j) => (j === exIdx ? value : t)) } : x,
      ),
    );
  }

  /** Préréglage de repos pour ce mouvement, avant de lancer la série suivante (doc B.3.a). */
  function setRestOverride(blocIdx: number, exIdx: number, sec: number) {
    setBlocks((prev) =>
      prev.map((x, i) =>
        i === blocIdx ? { ...x, restOverrides: x.restOverrides.map((r, j) => (j === exIdx ? sec : r)) } : x,
      ),
    );
  }

  const doneCount = blocks.filter((b) => b.done).length;
  const total = blocks.length;
  const globalSec = Math.max(0, Math.floor((now - sessionStartedAt) / 1000));

  const movementsTotal = useMemo(() => blockData.reduce((sum, b) => sum + b.items.length, 0), [blockData]);
  // Un bloc terminé compte comme entièrement réalisé : tous blocs validés = 100 %.
  const movementsDone = blocks.reduce((sum, b) => sum + (b.done ? b.checked.length : b.checked.filter(Boolean).length), 0);
  const completionRate = movementsTotal > 0 ? movementsDone / movementsTotal : 0;

  // Ouvre le bloc suivant quand un bloc se termine, et détecte la fin de séance.
  const prevDoneRef = useRef<boolean[]>(blocks.map((b) => b.done));
  useEffect(() => {
    const prevDone = prevDoneRef.current;
    blocks.forEach((b, i) => {
      if (b.done && !prevDone[i] && i + 1 < blocks.length && !blocks[i + 1].done) openBloc(i + 1);
    });
    prevDoneRef.current = blocks.map((b) => b.done);
  }, [blocks, openBloc]);

  function endSession() {
    setSessionDone(true);
  }

  function confirmBack() {
    if (sessionDone) {
      router.push("/dashboard");
      return;
    }
    if (window.confirm("Quitter la séance ?")) router.push("/dashboard");
  }

  // Enregistrement des résultats puis compte rendu — best effort : même si
  // l'enregistrement échoue, on emmène l'athlète sur la page de compte rendu.
  useEffect(() => {
    if (!sessionDone || savedRef.current) return;
    savedRef.current = true;
    const blocs: SessionBlocResult[] = [];
    blockData.forEach((b, i) => {
      const state = blocks[i];
      // Superset / Circuit : chaque mouvement avec ses tours (kg × reps par tour).
      if (state.circuit) {
        b.items.forEach((it, j) => {
          const byName = new Map<string, { charge: string; reps: string }[]>();
          for (const t of state.circuit!.tours) {
            if (!t.done) continue;
            const cell = t.cells[j];
            if (!cell || (!cell.charge.trim() && !cell.reps.trim())) continue;
            const name = t.names[j] ?? it.name;
            byName.set(name, [...(byName.get(name) ?? []), { charge: cell.charge, reps: cell.reps }]);
          }
          for (const [nom, series] of byName) {
            blocs.push({ bloc: i + 1, nom, series, kind: "strength", remplaceDe: nom !== baseBlocks[i].items[j].name ? baseBlocks[i].items[j].name : undefined });
          }
        });
        return;
      }
      b.items.forEach((it, j) => {
        const series = (state.exerciseSeries[j] ?? []).filter((x) => x.charge.trim() || x.reps.trim() || x.time?.trim() || x.timeD?.trim());
        const temps = state.exerciseTimes[j]?.trim();
        const kind = resultKindFor(b, it);
        if (series.length > 0) blocs.push({ bloc: i + 1, nom: it.name, series, kind, remplaceDe: it.replacedFrom, remplaceRaison: it.replacedReason });
        else if (temps) {
          const cardio = state.exerciseCardio?.[j];
          const detail = cardioLine(cardio?.distance ?? "", temps, cardio?.zone ?? "");
          blocs.push({ bloc: i + 1, nom: it.name, temps, kind: "endurance", detail: detail ?? undefined });
        }
      });
      // Séries saisies sous un mouvement remplacé puis changé ou rétabli : enregistrées pour lui.
      for (const a of state.archived ?? []) {
        const base = b.items[a.exIdx];
        blocs.push({ bloc: i + 1, nom: a.name, series: a.series, kind: base ? resultKindFor(b, base) : "strength", remplaceDe: a.replacedFrom });
      }
      if (state.temps || state.rounds || state.score) {
        blocs.push({
          bloc: i + 1,
          nom: b.titre,
          temps: state.temps || undefined,
          rounds: state.rounds || undefined,
          score: state.score || undefined,
          rxScaled: WOD_RESULT_TYPES.includes(b.type) ? state.rxScaled : undefined,
        });
      }
    });

    const summary: BlocSummary[] = blockData.map((b, i) => {
      const state = blocks[i];
      return {
        bloc: i + 1,
        titre: b.titre,
        type: b.type,
        format: b.format,
        done: state.done || (b.items.length > 0 && state.checked.every(Boolean)),
        items: b.items.map((it, j) => ({ name: it.name, done: !!state.checked[j] || state.done, kind: resultKindFor(b, it), replacedFrom: it.replacedFrom })),
      };
    });

    releaseAudio();
    onSaveResult({ date, variant, programSlug, programDay, blocs, summary, durationSec: globalSec, completionRate })
      .catch(() => {})
      .finally(() => router.replace(doneRedirect));
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Rien à nettoyer si le stockage est indisponible.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDone]);

  if (sessionDone) {
    // Le compte rendu complet vit sur /session/recap (généré côté serveur) —
    // ici on patiente pendant l'enregistrement et la génération du message.
    return (
      <div className={styles.sessRoot}>
        <div data-hide-scroll-top className={cx(styles.success, styles.show)}>
          <div className={styles.successIcon}>⚡</div>
          <div className={styles.successTitle}>
            Séance
            <br />
            terminée.
          </div>
          <div className={styles.successSub}>
            <strong>{sessionName}</strong>
            <br />
            {fmtHMS(globalSec)} · {movementsDone}/{movementsTotal} mouvements
          </div>
          <div className={styles.successSub}>Préparation de ton compte rendu…</div>
        </div>
      </div>
    );
  }

  const fsIndex = fullscreen !== null && blocks[fullscreen] && !blocks[fullscreen].done ? fullscreen : null;

  return (
    <div className={styles.sessRoot}>
      {fsIndex !== null && (
        <FullscreenTimer
          block={blockData[fsIndex]}
          state={blocks[fsIndex]}
          now={now}
          globalLabel={fmtHMS(globalSec)}
          onPause={() => pauseTimer(fsIndex)}
          onResume={() => startTimer(fsIndex)}
          onReset={() => resetTimer(fsIndex)}
          onAddRound={() => addAmrapRound(fsIndex)}
          onDone={() => doneBloc(fsIndex)}
          onClose={() => setFullscreen(null)}
        />
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
      {replaceSheet &&
        (() => {
          const cur = blockData[replaceSheet.blocIdx]?.items[replaceSheet.exIdx];
          const options = (cur?.plannedMovementId ? equivalents[cur.plannedMovementId] ?? [] : []).filter((o) => o.id !== cur?.movementId);
          if (!cur || options.length === 0) return null;
          return (
            <ReplaceSheet
              movementName={cur.name}
              options={options}
              onConfirm={(option, reason) => replaceMovement(replaceSheet.blocIdx, replaceSheet.exIdx, option, reason)}
              onClose={() => setReplaceSheet(null)}
            />
          );
        })()}
      {/* Le chrono de repos n'est plus un overlay global (doc H.10) — il est
          rendu in situ dans BlocCard, à l'emplacement du réglage "Repos entre
          séries" du mouvement concerné. */}
      <div className={styles.topbar}>
        <div className={styles.tbLeft}>
          <button className={styles.tbBack} onClick={confirmBack} aria-label="Retour">
            ←
          </button>
          <div>
            <div className={styles.tbTitle}>
              {sessionName.length > 28 ? sessionName.slice(0, 28) + "…" : sessionName}
            </div>
            <div className={styles.tbSub}>EL COACH METHOD</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className={styles.globalTimer}>{fmtHMS(globalSec)}</div>
          <div className={styles.globalTimerLabel}>Durée totale</div>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }} />
      </div>

      <div className={styles.content}>
        <div className={styles.sessHero}>
          {sessionStarted && (
            <div className={styles.sessLabel}>
              <span className={styles.sessLabelDot} />
              Séance en cours
            </div>
          )}
          <div className={styles.sessTitleRow}>
            <div className={styles.sessIconBadge}>{SESSION_KIND_ICON[sessionKind]}</div>
            <div>
              <div className={styles.sessName}>{sessionName}</div>
              <div className={styles.sessMeta}>{sessionMeta}</div>
            </div>
          </div>
          <label className={styles.volumeRow}>
            <span className={styles.volumeLabel}>🔊 Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => changeVolume(Number(e.target.value) / 100)}
              className={styles.volumeSlider}
              aria-label="Volume des signaux sonores"
            />
            <span className={styles.volumeValue}>{Math.round(volume * 100)}%</span>
          </label>

          <div className={styles.ctaRow}>
            <button type="button" className={styles.ctaPreview} onClick={() => setShowPreview((v) => !v)}>
              👁 {showPreview ? "FERMER" : "APERÇU"}
            </button>
            {/* Séance déjà lancée : "Démarrer" n'a plus de sens ici, la fin de
                séance se fait via "Terminer la séance" plus bas (doc H.8). */}
            {!sessionStarted && (
              <button type="button" className={styles.ctaStart} onClick={startSession}>
                ▷ DÉMARRER LA SÉANCE
              </button>
            )}
          </div>

          {showPreview && (
            <div className={styles.previewPanel}>
              {blockData.map((b, i) => (
                <div key={`${b.titre}-${i}`} className={styles.previewBlock}>
                  <div className={styles.previewBlockTitle}>{b.titre}</div>
                  {b.items.map((it, j) => (
                    <div key={j} className={styles.previewItem}>
                      <span>{it.name}</span>
                      {it.qty && <span>{it.qty}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {sessionKind === "recuperationActive" && (
          <div className={styles.timerCard}>
            <div className={styles.timerCardLabel}>Chrono général</div>
            <div className={styles.timerCardValue}>{fmtMS(globalSec)}</div>
            <div className={styles.timerCardSub}>
              Objectif {fmtMS(recupTargetSec)} · {fmtMS(globalSec)} / {fmtMS(recupTargetSec)} écoulé
            </div>
            <DurationAdjust
              label="Objectif de durée"
              seconds={recupTargetSec}
              step={5}
              min={5}
              max={7200}
              accent="#C9A84C"
              onChange={setRecupTargetSec}
            />
            <div className={styles.blocProgress}>
              <div className={styles.blocProgressTrack}>
                <div
                  className={styles.blocProgressFill}
                  style={{ width: `${recupTargetSec > 0 ? Math.min(100, (globalSec / recupTargetSec) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
        {sessionKind === "sportHorsEcm" && (
          <div className={styles.timerCard}>
            <div className={styles.timerCardLabel}>Chrono général</div>
            <div className={styles.timerCardValue}>{fmtMS(globalSec)}</div>
            <div className={styles.timerCardSub}>Un seul chrono pour toute la séance — pas de chronos intermédiaires</div>
          </div>
        )}

        <div>
          {blockData.map((b, i) => (
            <BlocCard
              key={`${b.titre}-${i}`}
              refCb={(el) => {
                blocRefs.current[i] = el;
              }}
              index={i}
              currentIndex={blocks.findIndex((x) => !x.done)}
              block={b}
              state={blocks[i]}
              now={now}
              restTimer={restTimer}
              restJustEnded={restJustEnded}
              lastResults={lastResults}
              equivalents={equivalents}
              onCircuitCell={(tourIdx, exIdx, patch) => updateCircuitCell(i, tourIdx, exIdx, patch)}
              onValidateTour={() => validateTour(i)}
              onAddTour={() => addCircuitTour(i)}
              onCircuitRest={(sec) => setCircuitRest(i, sec)}
              onSkipRest={cancelRestTimer}
              onOpenReplace={(exIdx) => setReplaceSheet({ blocIdx: i, exIdx })}
              onRevert={(exIdx) => revertMovement(i, exIdx)}
              sessionKind={sessionKind}
              onToggle={() => toggleOpen(i)}
              onChangeFormat={(fmt) => changeFormat(i, fmt)}
              onPatch={(patch) => patchBloc(i, patch)}
              onStart={() => startTimer(i)}
              onCancelCountdown={() => cancelCountdown(i)}
              onPause={() => pauseTimer(i)}
              onReset={() => resetTimer(i)}
              onDone={() => doneBloc(i)}
              onAddRound={() => addAmrapRound(i)}
              onOpenFullscreen={() => setFullscreen(i)}
              onToggleChecked={(exIdx) => toggleChecked(i, exIdx)}
              onToggleExpanded={(exIdx) => toggleExpanded(i, exIdx)}
              onAddSerie={(exIdx) => addSerie(i, exIdx)}
              onToggleSerieDone={(exIdx, serieIdx) => toggleSerieDone(i, exIdx, serieIdx)}
              onUpdateSerie={(exIdx, serieIdx, patch) => updateSerie(i, exIdx, serieIdx, patch)}
              onRemoveSerie={(exIdx, serieIdx) => removeSerie(i, exIdx, serieIdx)}
              onSetExerciseTime={(exIdx, value) => setExerciseTime(i, exIdx, value)}
              onSetExerciseCardio={(exIdx, patch) => setExerciseCardio(i, exIdx, patch)}
              onSetRestOverride={(exIdx, sec) => setRestOverride(i, exIdx, sec)}
              onAdjustRest={(sec) => addRestTime(sec)}
              onCancelRest={cancelRestTimer}
            />
          ))}
        </div>

        {photosEnabled && (
          <div className={styles.photoBar}>
            <div className={styles.photoBarLabel}>
              Photos de la séance (2 max) — les calories s&apos;y lisent toutes seules
            </div>
            <SessionPhotos
              photos={photos}
              onChange={changePhotos}
              onExtracted={handlePhotoExtracted}
              analysisContext={analysisContext}
            />
          </div>
        )}

        {/* Ajouter une 2e activité du jour (doc G.3/G.4) — disponible depuis l'écran séance aussi. */}
        <Link href="/session/add" className={styles.addActivityBtn}>
          <span>+</span> Ajouter une activité
        </Link>
      </div>

      <div data-bottom-bar className={styles.bottombar}>
        <div className={styles.bbStats}>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>{movementsDone}</div>
            <div className={styles.bbLabel}>Mouvements</div>
          </div>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>
              {doneCount}/{total}
            </div>
            <div className={styles.bbLabel}>Blocs</div>
          </div>
          <div className={styles.bbStat}>
            <div className={styles.bbVal}>{fmtMS(globalSec)}</div>
            <div className={styles.bbLabel}>Temps</div>
          </div>
        </div>
        <button className={cx(styles.bbBtn, styles.bbFinish)} onClick={endSession}>
          ⚡ Terminer la séance
        </button>
      </div>
    </div>
  );
}

function BlocCard({
  refCb,
  index,
  currentIndex,
  block,
  state,
  now,
  restTimer,
  restJustEnded,
  lastResults,
  equivalents,
  onCircuitCell,
  onValidateTour,
  onAddTour,
  onCircuitRest,
  onSkipRest,
  onOpenReplace,
  onRevert,
  sessionKind,
  onToggle,
  onChangeFormat,
  onPatch,
  onStart,
  onCancelCountdown,
  onPause,
  onReset,
  onDone,
  onAddRound,
  onOpenFullscreen,
  onToggleChecked,
  onToggleExpanded,
  onAddSerie,
  onToggleSerieDone,
  onUpdateSerie,
  onRemoveSerie,
  onSetExerciseTime,
  onSetExerciseCardio,
  onSetRestOverride,
  onAdjustRest,
  onCancelRest,
}: {
  refCb: (el: HTMLDivElement | null) => void;
  index: number;
  currentIndex: number;
  block: DisplayBlock;
  state: BlocState;
  now: number;
  restTimer: RestTimerState;
  restJustEnded: { blocIdx: number; exIdx: number } | null;
  lastResults: Record<string, LastResult>;
  equivalents: Record<string, EquivalentOption[]>;
  onCircuitCell: (tourIdx: number, exIdx: number, patch: Partial<{ charge: string; reps: string }>) => void;
  onValidateTour: () => void;
  onAddTour: () => void;
  onCircuitRest: (sec: number) => void;
  onSkipRest: () => void;
  onOpenReplace: (exIdx: number) => void;
  onRevert: (exIdx: number) => void;
  sessionKind: SessionKind;
  onToggle: () => void;
  onChangeFormat: (fmt: RuntimeFormat) => void;
  onPatch: (patch: Partial<BlocState>) => void;
  onStart: () => void;
  onCancelCountdown: () => void;
  onPause: () => void;
  onReset: () => void;
  onDone: () => void;
  onAddRound: () => void;
  onOpenFullscreen: () => void;
  onToggleChecked: (exIdx: number) => void;
  onToggleExpanded: (exIdx: number) => void;
  onAddSerie: (exIdx: number) => void;
  onToggleSerieDone: (exIdx: number, serieIdx: number) => void;
  onUpdateSerie: (exIdx: number, serieIdx: number, patch: Partial<ExerciseSerie>) => void;
  onRemoveSerie: (exIdx: number, serieIdx: number) => void;
  onSetExerciseTime: (exIdx: number, value: string) => void;
  onSetExerciseCardio: (exIdx: number, patch: Partial<{ distance: string; zone: string }>) => void;
  onSetRestOverride: (exIdx: number, sec: number) => void;
  onAdjustRest: (deltaSec: number) => void;
  onCancelRest: () => void;
}) {
  const isDone = state.done;
  const isActive = index === currentIndex && !isDone;
  const checkedCount = state.checked.filter(Boolean).length;
  const itemCount = block.items.length;
  /** Metcon/Finisher : fiche WOD écrite, jamais de checkbox par mouvement (doc H.11). */
  const isWod = WOD_RESULT_TYPES.includes(block.type) && !looksLikeMisplacedStrengthBlock(block);

  return (
    <div ref={refCb} className={cx(styles.bloc, isActive && styles.active, isDone && styles.done, state.open && styles.open)}>
      <div className={styles.blocHeader} onClick={onToggle}>
        <div className={cx(styles.blocNum, isDone ? styles.done : isActive ? styles.cur : styles.pending)}>
          {isDone ? "✓" : block.lettre}
        </div>
        <div className={styles.blocInfo}>
          <div className={styles.blocTitle}>{block.titre}</div>
          {!isDone &&
            (["ft", "amrap", "emom", "tabata"].includes(block.badgeCls) ? (
              <span className={styles.secGoal}>🏆 {block.badge}</span>
            ) : (
              <div className={cx(styles.blocBadge, styles[`badge${capitalize(block.badgeCls)}`])}>{block.badge}</div>
            ))}
        </div>
        <div>{isDone ? <div className={styles.blocCheck}>✓</div> : <div className={styles.blocChevron}>▾</div>}</div>
      </div>
      <div className={styles.blocBody}>
        <TimerZone
          index={index}
          state={state}
          now={now}
          sessionKind={sessionKind}
          onChangeFormat={onChangeFormat}
          onPatch={onPatch}
          onStart={onStart}
          onCancelCountdown={onCancelCountdown}
          onPause={onPause}
          onReset={onReset}
          onDone={onDone}
          onAddRound={onAddRound}
          onOpenFullscreen={onOpenFullscreen}
        />

        {state.circuit ? (
          <CircuitBlock
            block={block}
            circuit={state.circuit}
            blocDone={state.done}
            restTimer={restTimer && restTimer.exIdx === -1 && restTimer.blocIdx === index ? restTimer : null}
            now={now}
            lastResults={lastResults}
            equivalents={equivalents}
            onCell={onCircuitCell}
            onValidate={onValidateTour}
            onAddTour={onAddTour}
            onRest={onCircuitRest}
            onSkipRest={onSkipRest}
            onOpenReplace={onOpenReplace}
            onRevert={onRevert}
          />
        ) : isWod ? (
          <WodSheet block={block} />
        ) : (
          <>
            {itemCount > 0 && (
              <div className={styles.blocProgress}>
                <div className={styles.blocProgressLabel}>
                  {checkedCount} / {itemCount} mouvements
                </div>
                <div className={styles.blocProgressTrack}>
                  <div className={styles.blocProgressFill} style={{ width: `${(checkedCount / itemCount) * 100}%` }} />
                </div>
              </div>
            )}

            <div className={styles.blocItems}>
              {block.items.map((it, j) => {
            // Conseil/consigne (pas un mouvement à cocher) — lecture seule,
            // style "points de vigilance" (doc G.4.1 — items noVideo uniquement,
            // jamais posé sur un vrai exercice).
            if (it.noVideo) {
              return (
                <div key={`${it.movementName}-${j}`} className={styles.vigilRow}>
                  <div className={styles.vigilDot} />
                  <div className={styles.vigilText}>{it.name}</div>
                </div>
              );
            }
            const checked = state.checked[j] ?? false;
            // Mouvement à séries (doc H.13, Étape 0 point 3) : le coché devient
            // automatique (toutes les séries validées) ; tapez pour déplier/replier,
            // jamais pour cocher à la main. Les autres items gardent l'ancien comportement.
            const hasSeries = (state.exerciseSeries[j]?.length ?? 0) > 0;
            const expanded = hasSeries ? state.expanded[j] ?? false : checked;
            // « Remplacer » : mouvements à séries dont le coach a défini des équivalents (mission 11).
            const canReplace = hasSeries && !it.noVideo && !!it.plannedMovementId && (equivalents[it.plannedMovementId]?.length ?? 0) > 0;
            return (
              <div key={`${it.movementName}-${j}`} className={cx(checked && styles.itemChecked, it.replacedFrom && styles.itemReplaced)}>
                <div className={styles.itemRow}>
                  <button
                    type="button"
                    className={cx(styles.itemCheck, checked && styles.itemCheckOn)}
                    onClick={() => (hasSeries ? onToggleExpanded(j) : onToggleChecked(j))}
                    aria-label={
                      hasSeries
                        ? expanded
                          ? `Replier ${it.name}`
                          : `Déplier ${it.name}`
                        : checked
                          ? `Décocher ${it.name}`
                          : `Cocher ${it.name}`
                    }
                    aria-pressed={hasSeries ? expanded : checked}
                  >
                    {checked ? "✓" : ""}
                  </button>
                  <div style={{ flex: 1 }}>
                    {it.replacedFrom && <div className={styles.replacedTag}>REMPLACÉ</div>}
                    <SessionItemRow
                      name={it.name}
                      qty={it.qty}
                      detail={it.detail}
                      movementName={it.movementName}
                      videoUrl={it.videoUrl}
                      noVideo={it.noVideo}
                      hideVideo={canReplace}
                    />
                    {it.replacedFrom && <div className={styles.replacedFrom}>à la place de : {it.replacedFrom}</div>}
                    {canReplace && (
                      <MovementActions
                        movementName={it.movementName}
                        videoUrl={it.videoUrl}
                        replaced={!!it.replacedFrom}
                        onOpen={() => onOpenReplace(j)}
                      />
                    )}
                    {it.replacedFrom && (
                      <button type="button" className={styles.revertLink} onClick={() => onRevert(j)}>
                        Rétablir le mouvement prévu
                      </button>
                    )}
                  </div>
                </div>

                {expanded && state.exerciseSeries[j] && (
                  <>
                    <SerieInput
                      series={state.exerciseSeries[j]}
                      last={lastResults[it.name] ?? lastResults[it.movementName]}
                      isHold={isHoldItem(it)}
                      isCarry={isCarryItem(it)}
                      targetTime={it.time}
                      perSide={/par c[ôo]t[ée]|side plank|unilat/i.test(`${it.detail ?? ""} ${it.movementName}`)}
                      loaded={!!it.load && it.load.toLowerCase() !== "bw"}
                      onAdd={() => onAddSerie(j)}
                      onToggleDone={(serieIdx) => onToggleSerieDone(j, serieIdx)}
                      onUpdate={(serieIdx, patch) => onUpdateSerie(j, serieIdx, patch)}
                      onRemove={(serieIdx) => onRemoveSerie(j, serieIdx)}
                    />
                    {restTimer && restTimer.blocIdx === index && restTimer.exIdx === j ? (
                      <InlineRestTimer
                        endsAt={restTimer.endsAt}
                        totalSec={restTimer.totalSec}
                        now={now}
                        onStep={onAdjustRest}
                        onCancel={onCancelRest}
                      />
                    ) : restJustEnded && restJustEnded.blocIdx === index && restJustEnded.exIdx === j ? (
                      <div className={styles.restFlash}>C&apos;est reparti !</div>
                    ) : (
                      <Stepper
                        label="Repos entre séries"
                        value={state.restOverrides[j] ?? parseRestSeconds(it.rest, block.type)}
                        step={5}
                        min={5}
                        max={600}
                        format={fmtDurationAdjust}
                        longPressStep={60}
                        onChange={(v) => onSetRestOverride(j, v)}
                      />
                    )}
                  </>
                )}

                {checked && TIME_RESULT_TYPES.includes(block.type) && (
                  <div className={styles.seriesWrap}>
                    <div className={styles.serieRow}>
                      <span className={styles.serieLabel}>Temps</span>
                      <input
                        className={styles.serieInput}
                        type="text"
                        inputMode="numeric"
                        placeholder="MM:SS"
                        value={state.exerciseTimes[j] ?? ""}
                        onChange={(e) => onSetExerciseTime(j, e.target.value)}
                      />
                      <input
                        className={styles.serieInput}
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        value={state.exerciseCardio?.[j]?.distance ?? ""}
                        onChange={(e) => onSetExerciseCardio(j, { distance: e.target.value })}
                        aria-label="Distance en kilomètres"
                      />
                      <span className={styles.serieUnit}>km</span>
                    </div>
                    <div className={styles.serieRow}>
                      <span className={styles.serieLabel}>Zone</span>
                      {CARDIO_ZONES.map((z) => (
                        <button
                          key={z}
                          type="button"
                          className={cx(styles.serieCheckBtn, state.exerciseCardio?.[j]?.zone === z && styles.serieCheckBtnOn)}
                          onClick={() => onSetExerciseCardio(j, { zone: state.exerciseCardio?.[j]?.zone === z ? "" : z })}
                          aria-pressed={state.exerciseCardio?.[j]?.zone === z}
                        >
                          {z}
                        </button>
                      ))}
                    </div>
                    {paceText(state.exerciseCardio?.[j]?.distance ?? "", state.exerciseTimes[j] ?? "") && (
                      <div className={styles.lastResult}>
                        Allure : {paceText(state.exerciseCardio?.[j]?.distance ?? "", state.exerciseTimes[j] ?? "")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
              })}
            </div>
          </>
        )}

        {isWod && (
          <WodResult
            format={block.format}
            temps={state.temps}
            rounds={state.rounds}
            score={state.score}
            rxScaled={state.rxScaled}
            roundCount={block.rounds ?? 1}
            roundTimes={state.roundTimes ?? []}
            onPatch={onPatch}
          />
        )}
        {!isWod && block.note && <div className={styles.blocNote}>{block.note}</div>}
        {isDone && (
          <div className={styles.blocDoneOverlay}>
            <span>✅ Bloc complété</span>
            <span className={styles.bdoTime}>{fmtMS(state.finalSec)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Fiche WOD écrite (doc H.11) — remplace la checkbox par mouvement sur les
 * blocs Metcon/Finisher : tableau de coach, pas une checklist. Les
 * standards Rx/Scaled sont déjà dans `it.load` (texte libre, programming.ts),
 * affiché tel quel entre parenthèses — pas de mise en gras Homme/Femme ici,
 * le profil (genre) n'est pas remonté jusqu'à ce composant.
 */
function WodSheet({ block }: { block: DisplayBlock }) {
  const tag = (block.format && WOD_FORMAT_TAG[block.format]) || "🏆 For Time";
  const formatLine = wodFormatLine(block);
  const timeCap = wodTimeCap(block);

  return (
    <div className={styles.wodSheet}>
      <div className={styles.wodSheetHead}>
        <div className={styles.wodSheetLetter}>{block.lettre}</div>
        <div className={styles.wodSheetTitle}>{block.titre}</div>
        <div className={styles.wodSheetTag}>{tag}</div>
      </div>
      {formatLine && <div className={styles.wodSheetFormat}>{formatLine}</div>}
      <div className={styles.wodSheetBody}>
        {block.items.map((it, j) => (
          <div key={`${it.movementName}-${j}`} className={styles.wodSheetRow}>
            {it.qty && <span className={styles.wodSheetQty}>{it.qty}</span>}
            <span className={styles.wodSheetName}>
              {it.movementName}
              {it.load ? ` (${it.load})` : ""}
            </span>
          </div>
        ))}
      </div>
      {timeCap && <div className={styles.wodSheetCap}>Time cap : {timeCap}</div>}
      {block.note && <div className={styles.wodSheetNote}>{block.note}</div>}
    </div>
  );
}

/** Bloc d'enregistrement du résultat, adapté au format réel du Metcon/Finisher
 * (doc H.11) — For Time / AMRAP / EMOM, repli générique pour les autres
 * formats WOD (Tabata/Circuit/Superset/Intervals/StraightSets). */
function WodResult({
  format,
  temps,
  rounds,
  score,
  rxScaled,
  roundCount,
  roundTimes,
  onPatch,
}: {
  format?: WodFormat;
  temps: string;
  rounds: string;
  score: string;
  rxScaled: "rx" | "scaled";
  /** Formats à intervalles : nombre de séries, un temps par série. */
  roundCount: number;
  roundTimes: string[];
  onPatch: (patch: Partial<BlocState>) => void;
}) {
  const isIntervals = format === "Intervals";
  const toSec = (t: string) => {
    const m = t.trim().match(/^(\d+):(\d{2})$/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : parseFloat(t) || 0;
  };
  const total = roundTimes.reduce((sum, t) => sum + toSec(t ?? ""), 0);
  const isForTime = format === "ForTime" || format === "RFT" || format === "Chipper" || format === "Simulation";
  const isAmrap = format === "AMRAP";
  const isEmom = format === "EMOM" || format === "E2MOM" || format === "E3MOM";

  return (
    <div className={styles.wodResultWrap}>
      <div className={styles.wodResultRow}>
        {isIntervals ? (
          <>
            {Array.from({ length: Math.max(1, roundCount) }, (_, i) => (
              <div key={i} className={styles.wodResultField}>
                <label>Série {i + 1}</label>
                <input
                  type="text"
                  placeholder="MM:SS"
                  value={roundTimes[i] ?? ""}
                  onChange={(e) => {
                    const next = Array.from({ length: Math.max(1, roundCount) }, (_, j) => (j === i ? e.target.value : roundTimes[j] ?? ""));
                    const sum = next.reduce((acc, t) => acc + toSec(t), 0);
                    onPatch({ roundTimes: next, temps: sum > 0 ? `${Math.floor(sum / 60)}:${String(sum % 60).padStart(2, "0")}` : "" });
                  }}
                />
              </div>
            ))}
            <div className={styles.wodResultField}>
              <label>Total</label>
              <div className={styles.wodTotal}>{total > 0 ? `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}` : "—"}</div>
            </div>
          </>
        ) : isForTime ? (
          <>
            <div className={styles.wodResultField}>
              <label>Temps</label>
              <input type="text" placeholder="MM:SS" value={temps} onChange={(e) => onPatch({ temps: e.target.value })} />
            </div>
            <div className={styles.wodResultField}>
              <label>Reps restantes (si cap)</label>
              <input type="text" placeholder="—" value={score} onChange={(e) => onPatch({ score: e.target.value })} />
            </div>
          </>
        ) : isAmrap ? (
          <>
            <div className={styles.wodResultField}>
              <label>Rounds complets</label>
              <input type="text" placeholder="—" value={rounds} onChange={(e) => onPatch({ rounds: e.target.value })} />
            </div>
            <div className={styles.wodResultField}>
              <label>Reps supplémentaires</label>
              <input type="text" placeholder="—" value={score} onChange={(e) => onPatch({ score: e.target.value })} />
            </div>
          </>
        ) : isEmom ? (
          <>
            <div className={styles.wodResultField}>
              <label>Charge utilisée</label>
              <input type="text" placeholder="kg" value={temps} onChange={(e) => onPatch({ temps: e.target.value })} />
            </div>
            <div className={styles.wodResultField}>
              <label>Minutes réussies / total</label>
              <input type="text" placeholder="ex. 9/10 (loupée : min 4)" value={score} onChange={(e) => onPatch({ score: e.target.value })} />
            </div>
          </>
        ) : (
          <>
            <div className={styles.wodResultField}>
              <label>Temps</label>
              <input type="text" placeholder="MM:SS" value={temps} onChange={(e) => onPatch({ temps: e.target.value })} />
            </div>
            <div className={styles.wodResultField}>
              <label>Rounds</label>
              <input type="text" placeholder="—" value={rounds} onChange={(e) => onPatch({ rounds: e.target.value })} />
            </div>
            <div className={styles.wodResultField}>
              <label>Reps bonus</label>
              <input type="text" placeholder="—" value={score} onChange={(e) => onPatch({ score: e.target.value })} />
            </div>
          </>
        )}
      </div>
      <div className={styles.wodRxScaledRow}>
        <button
          type="button"
          className={cx(styles.wodRxScaledBtn, rxScaled === "rx" && styles.wodRxScaledActive)}
          onClick={() => onPatch({ rxScaled: "rx" })}
        >
          RX
        </button>
        <button
          type="button"
          className={cx(styles.wodRxScaledBtn, rxScaled === "scaled" && styles.wodRxScaledActive)}
          onClick={() => onPatch({ rxScaled: "scaled" })}
        >
          SCALED
        </button>
      </div>
    </div>
  );
}

function SerieInput({
  series,
  last,
  isHold,
  isCarry,
  targetTime,
  perSide,
  loaded,
  onAdd,
  onToggleDone,
  onUpdate,
  onRemove,
}: {
  series: ExerciseSerie[];
  last?: LastResult;
  /** Gainage : temps visé de la prescription (« 45s »). */
  targetTime?: string;
  /** Gainage « par côté » : deux temps par série, G et D. */
  perSide?: boolean;
  /** Gainage lesté : le champ charge est affiché d'office. */
  loaded?: boolean;
  /** Gainage/isométrie (doc H.14) : temps tenu par série au lieu de reps,
   * charge facultative masquée par défaut (mouvement lesté, rare). */
  isHold?: boolean;
  /** Portés : la 2e valeur est une distance, avec son unité (m par défaut). */
  isCarry?: boolean;
  onAdd: () => void;
  /** ✓ par série (doc H.10/H.13, Étape 0 point 1) : valide/dévalide une série. */
  onToggleDone: (serieIdx: number) => void;
  onUpdate: (serieIdx: number, patch: Partial<ExerciseSerie>) => void;
  onRemove: (serieIdx: number) => void;
}) {
  const [chargeEnabled, setChargeEnabled] = useState(!!loaded);
  const showCharge = !isHold || chargeEnabled;
  // Chrono d'une tenue : un seul à la fois ; à l'arrêt, le temps tenu est écrit dans le champ.
  const [holdTimer, setHoldTimer] = useState<{ k: number; side: "G" | "D"; startedAt: number } | null>(null);
  const [holdNow, setHoldNow] = useState(() => Date.now());
  useEffect(() => {
    if (!holdTimer) return;
    const id = setInterval(() => setHoldNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [holdTimer]);
  const fmtHold = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  function toggleHold(k: number, side: "G" | "D") {
    if (holdTimer) {
      const sec = Math.max(0, Math.round((Date.now() - holdTimer.startedAt) / 1000));
      onUpdate(holdTimer.k, holdTimer.side === "G" ? { time: fmtHold(sec) } : { timeD: fmtHold(sec) });
      const same = holdTimer.k === k && holdTimer.side === side;
      setHoldTimer(null);
      if (same) return;
    }
    setHoldNow(Date.now());
    setHoldTimer({ k, side, startedAt: Date.now() });
  }
  const holdValue = (k: number, side: "G" | "D", stored: string | undefined) =>
    holdTimer && holdTimer.k === k && holdTimer.side === side
      ? fmtHold(Math.max(0, Math.round((holdNow - holdTimer.startedAt) / 1000)))
      : (stored ?? "");

  return (
    <div className={styles.seriesWrap}>
      {series.map((s, k) => (
        <div key={k}>
        <div className={cx(styles.serieRow, s.done && styles.serieRowDone)}>
          <span className={styles.serieLabel}>Série {k + 1}</span>
          {showCharge && (
            <>
              <input
                className={styles.serieInput}
                type="number"
                inputMode="decimal"
                placeholder={last ? String(last.suggestion) : "—"}
                value={s.charge}
                onChange={(e) => onUpdate(k, { charge: e.target.value })}
              />
              <span className={styles.serieUnit}>kg</span>
              <span>×</span>
            </>
          )}
          {isHold ? (
            <>
              {targetTime && <span className={styles.holdTarget}>{targetTime.replace(/(\d+)s$/, "$1 s")}</span>}
              {(perSide ? (["G", "D"] as const) : (["G"] as const)).map((side) => (
                <span key={side} className={styles.holdCell}>
                  {perSide && <span className={styles.holdSide}>{side}</span>}
                  <input
                    className={styles.serieInput}
                    type="text"
                    inputMode="numeric"
                    placeholder="mm:ss"
                    value={holdValue(k, side, side === "G" ? s.time : s.timeD)}
                    onChange={(e) => onUpdate(k, side === "G" ? { time: e.target.value } : { timeD: e.target.value })}
                  />
                  <button
                    type="button"
                    className={cx(styles.holdPlay, holdTimer?.k === k && holdTimer.side === side && styles.holdPlayOn)}
                    onClick={() => toggleHold(k, side)}
                    aria-label={holdTimer?.k === k && holdTimer.side === side ? "Arrêter le chrono" : "Lancer le chrono"}
                  >
                    {holdTimer?.k === k && holdTimer.side === side ? "■" : "▶"}
                  </button>
                </span>
              ))}
            </>
          ) : (
            <input
              className={styles.serieInput}
              type="number"
              inputMode="numeric"
              placeholder="—"
              value={s.reps}
              onChange={(e) => onUpdate(k, { reps: e.target.value })}
            />
          )}
          {isCarry ? (
            <select
              className={styles.serieUnit}
              value={s.unit ?? "m"}
              onChange={(e) => onUpdate(k, { unit: e.target.value as "m" | "km" })}
              aria-label={`Unité de la série ${k + 1}`}
            >
              <option value="m">m</option>
              <option value="km">km</option>
            </select>
          ) : (
            !isHold && <span className={styles.serieUnit}>reps</span>
          )}
          {series.length > 1 && (
            <button
              type="button"
              className={styles.removeSerieBtn}
              onClick={() => {
                if (window.confirm(`Supprimer la série ${k + 1} ?`)) onRemove(k);
              }}
              aria-label={`Supprimer la série ${k + 1}`}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            className={cx(styles.serieCheckBtn, s.done && styles.serieCheckBtnOn)}
            onClick={() => onToggleDone(k)}
            aria-label={s.done ? `Dévalider la série ${k + 1}` : `Valider la série ${k + 1}`}
            aria-pressed={!!s.done}
          >
            <span className={styles.serieCheckMark}>{s.done ? "✓" : ""}</span>
          </button>
        </div>
        {!isHold && (
          <div className={styles.rpeRow}>
            <span className={styles.rpeLabel}>RPE {s.rpe || "—"}</span>
            <input
              className={styles.rpeSlider}
              type="range"
              min={1}
              max={10}
              step={1}
              value={s.rpe ? Number(s.rpe) : 5}
              onChange={(e) => onUpdate(k, { rpe: e.target.value })}
              aria-label={`RPE série ${k + 1}`}
            />
            <span className={styles.rpeHint}>facultatif</span>
          </div>
        )}
        </div>
      ))}
      {last && !isHold && last.charge > 0 && (
        <div className={styles.lastResult}>
          Dernière fois : {last.charge} kg × {last.reps || "—"} · suggéré {last.suggestion} kg
        </div>
      )}
      {last && isHold && last.time && <div className={styles.lastResult}>Dernière fois : {last.time}</div>}
      <div className={styles.seriesActionsRow}>
        <button type="button" className={styles.addSerieBtn} onClick={onAdd}>
          + Ajouter une série
        </button>
        {isHold && !chargeEnabled && (
          <button type="button" className={styles.addSerieBtn} onClick={() => setChargeEnabled(true)}>
            + Charge
          </button>
        )}
      </div>
    </div>
  );
}

/** Molette −/+ des réglages Tabata (travail, repos, tours). */
function Stepper({
  label,
  value,
  unit,
  step,
  min,
  max,
  format,
  longPressStep,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  step: number;
  min: number;
  max: number;
  /** Formatte la valeur affichée (ex. mm:ss) — prime sur `unit` si fourni. */
  format?: (v: number) => string;
  /** Pas appliqué en répétition continue à l'appui long (doc H.10) — sinon
   * l'appui long répète juste le pas normal, plus vite. */
  longPressStep?: number;
  onChange: (v: number) => void;
}) {
  const holdStep = longPressStep ?? step;
  const dec = useLongPress(
    () => onChange(Math.max(min, value - step)),
    () => onChange(Math.max(min, value - holdStep)),
  );
  const inc = useLongPress(
    () => onChange(Math.min(max, value + step)),
    () => onChange(Math.min(max, value + holdStep)),
  );
  return (
    <div className={styles.stepper}>
      <button type="button" className={styles.stepBtn} {...dec}>
        −
      </button>
      <div className={styles.stepValue}>
        {format ? format(value) : value}
        {!format && unit}
      </div>
      <button type="button" className={styles.stepBtn} {...inc}>
        +
      </button>
      <div className={styles.stepLabel}>{label}</div>
    </div>
  );
}

/** Champ durée réglable en grand format (AMRAP/EMOM/For Time) — [−] mm:ss [+],
 * pas de 5 s (60 s pour l'EMOM, un round dure toujours une minute). */
function DurationAdjust({
  label,
  seconds,
  step,
  min,
  max,
  accent,
  onChange,
}: {
  label: string;
  seconds: number;
  step: number;
  min: number;
  max: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  const dec = useLongPress(
    () => onChange(stepDuration(seconds, "-", step, min, max)),
    () => onChange(stepDuration(seconds, "-", 60, min, max)),
  );
  const inc = useLongPress(
    () => onChange(stepDuration(seconds, "+", step, min, max)),
    () => onChange(stepDuration(seconds, "+", 60, min, max)),
  );
  return (
    <div className={styles.durAdjust}>
      <div className={styles.durAdjustLabel}>{label}</div>
      <div className={styles.durAdjustRow}>
        <button type="button" className={styles.durAdjustBtn} aria-label="Diminuer la durée" {...dec}>
          −
        </button>
        <div className={styles.durAdjustValue} style={{ filter: `drop-shadow(0 0 12px ${accent}66)` }}>
          {fmtDurationAdjust(seconds)}
        </div>
        <button type="button" className={styles.durAdjustBtn} aria-label="Augmenter la durée" {...inc}>
          +
        </button>
      </div>
    </div>
  );
}

function TimerZone({
  index,
  state: t,
  now,
  sessionKind,
  onChangeFormat,
  onPatch,
  onStart,
  onCancelCountdown,
  onPause,
  onReset,
  onDone,
  onAddRound,
  onOpenFullscreen,
}: {
  index: number;
  state: BlocState;
  now: number;
  sessionKind: SessionKind;
  onChangeFormat: (fmt: RuntimeFormat) => void;
  onPatch: (patch: Partial<BlocState>) => void;
  onStart: () => void;
  onCancelCountdown: () => void;
  onPause: () => void;
  onReset: () => void;
  onDone: () => void;
  onAddRound: () => void;
  onOpenFullscreen: () => void;
}) {
  // Hors ECM (sport libre, repos, récupération active) : pas de chrono par
  // bloc — "repos" n'a aucun chrono, les deux autres s'appuient sur le chrono
  // général déjà affiché en permanence (bandeau du haut / carte dédiée) —
  // voir SessionRunnerV2. Juste la checklist du bloc (rendue par BlocCard) et
  // un bouton pour le marquer fait.
  if (sessionKind !== "ecm") {
    return (
      <div className={styles.timerZone}>
        <div className={styles.timerControls}>
          {t.done ? (
            <button className={cx(styles.tcBtn, styles.tcReset)} style={{ flex: "none", width: "100%" }} onClick={onReset}>
              ↺ Refaire
            </button>
          ) : (
            <button className={cx(styles.tcBtn, styles.tcDone)} style={{ flex: "none", width: "100%" }} onClick={onDone}>
              ✓ Terminer
            </button>
          )}
        </div>
      </div>
    );
  }

  const fmt = t.format;
  const elapsed = elapsedSec(t, now);
  const countdown = t.countdownEndsAt ? Math.max(0, Math.ceil((t.countdownEndsAt - now) / 1000)) : null;

  let displayTime = "00:00";
  let displayClass = styles.idle;
  let statusText = "⏸ EN ATTENTE";
  let infoText = FORMAT_LABELS[fmt].toUpperCase();

  if (t.done) {
    displayTime = fmtMS(t.finalSec);
    displayClass = styles.doneT;
    statusText = "✅ TERMINÉ";
  } else if (t.running) {
    statusText = "⏱ EN COURS";
    if (fmt === "ft" || fmt === "nft") {
      displayTime = fmtMS(elapsed);
      displayClass = fmt === "ft" ? styles.runningFt : styles.runningNft;
      infoText = fmt === "ft" ? "POUR LE TEMPS" : "SANS CHRONO";
    } else if (fmt === "amrap") {
      displayTime = fmtMS(t.durationSec - elapsed);
      displayClass = styles.runningAmrap;
      infoText = "TEMPS RESTANT";
    } else if (fmt === "emom") {
      const emomRounds = Math.max(1, Math.round(t.durationSec / 60));
      displayTime = fmtMS(60 - (elapsed % 60));
      displayClass = styles.runningEmom;
      infoText = `MINUTE ${Math.min(emomRounds, Math.floor(elapsed / 60) + 1)} / ${emomRounds}`;
    } else if (fmt === "tabata") {
      const view = tabataView(t, elapsed);
      displayTime = fmtMS(view.remaining);
      displayClass = view.phase === "work" ? styles.runningTabataWork : styles.runningTabataRest;
      infoText = view.phase === "work" ? "EFFORT" : "REPOS";
    }
  } else if (t.accumulatedMs > 0) {
    // Chrono en pause : on garde le temps atteint sous les yeux.
    displayTime =
      fmt === "amrap" ? fmtMS(t.durationSec - elapsed) : fmt === "emom" ? fmtMS(60 - (elapsed % 60)) : fmtMS(elapsed);
    statusText = "⏸ EN PAUSE";
    displayClass = styles.paused;
  } else if (fmt === "amrap" || fmt === "emom") {
    displayTime = fmtMS(t.durationSec);
  }

  const idle = !t.done && !t.running && countdown === null;
  const showFmtSelector = idle;
  const showDurRow = (fmt === "amrap" || fmt === "emom" || fmt === "ft") && idle;
  const showTabataConfig = fmt === "tabata" && idle;
  const tabataRunning = fmt === "tabata" && t.running ? tabataView(t, elapsed) : null;
  const emomRoundsIdle = Math.max(1, Math.round(t.durationSec / 60));

  return (
    <div className={styles.timerZone}>
      {countdown !== null && (
        <div className={styles.countdown}>
          <div className={styles.countdownNum}>{countdown}</div>
          <div className={styles.countdownLabel}>Départ dans…</div>
          <button type="button" className={styles.countdownCancel} onClick={onCancelCountdown}>
            Annuler
          </button>
        </div>
      )}

      {showFmtSelector && (
        <>
          <div className={styles.fmtSelector}>
            {(Object.keys(FORMAT_LABELS) as RuntimeFormat[]).map((k) => (
              <button
                key={k}
                type="button"
                className={cx(styles.fmtBtn, styles[`fmt${capitalize(k)}`], fmt === k && styles[`active${capitalize(k)}`])}
                onClick={() => onChangeFormat(k)}
              >
                {FORMAT_LABELS[k]}
              </button>
            ))}
          </div>
          <div className={styles.fmtAccentLine} style={{ background: FS_COLOR[fmt] }} />
        </>
      )}

      {showDurRow && (
        <DurationAdjust
          label={fmt === "emom" ? "Durée / round" : fmt === "ft" ? "Durée cible" : "Durée"}
          seconds={t.durationSec}
          // EMOM : un round dure toujours 60 s dans cette app — le pas porte donc
          // sur le nombre de rounds, pas la seconde.
          step={fmt === "emom" ? 60 : 5}
          min={fmt === "emom" ? 60 : 5}
          max={3600}
          accent={FS_COLOR[fmt]}
          onChange={(v) => onPatch({ durationSec: v })}
        />
      )}

      {showTabataConfig && (
        <div className={styles.tabataConfig}>
          <Stepper label="Travail" value={t.workSec} step={5} min={5} max={120} format={fmtDurationAdjust} longPressStep={60} onChange={(v) => onPatch({ workSec: v })} />
          <Stepper label="Repos" value={t.restSec} step={5} min={5} max={120} format={fmtDurationAdjust} longPressStep={60} onChange={(v) => onPatch({ restSec: v })} />
          <Stepper label="Tours" value={t.tabataRounds} step={1} min={1} max={30} onChange={(v) => onPatch({ tabataRounds: v })} />
        </div>
      )}

      {fmt === "emom" && t.running && (
        <div className={styles.roundCounter}>
          Round <span>{Math.min(emomRoundsIdle, Math.floor(elapsed / 60) + 1)}</span> / {emomRoundsIdle}
        </div>
      )}

      {tabataRunning && (
        <>
          <div className={cx(styles.tabataPhase, tabataRunning.phase === "work" ? styles.work : styles.rest)}>
            {tabataRunning.phase === "work" ? `⚡ EFFORT — ${t.workSec}s` : `😮‍💨 REPOS — ${t.restSec}s`}
          </div>
          <div className={styles.roundCounter}>
            Tour <span>{Math.min(tabataRunning.round, t.tabataRounds)}</span> / {t.tabataRounds}
          </div>
          <div className={styles.emomBarWrap}>
            <div
              className={cx(styles.emomBar, tabataRunning.phase === "work" ? styles.red : styles.green)}
              style={{
                width: `${
                  tabataRunning.phase === "work"
                    ? ((t.workSec - tabataRunning.remaining) / t.workSec) * 100
                    : ((t.restSec - tabataRunning.remaining) / t.restSec) * 100
                }%`,
              }}
            />
          </div>
        </>
      )}

      <div className={styles.timerDisplay}>
        <div className={cx(styles.tdTime, displayClass)}>{displayTime}</div>
        <div className={styles.tdRight}>
          <div className={styles.tdStatus}>{statusText}</div>
          <div className={styles.tdInfo}>{infoText}</div>
        </div>
      </div>

      {fmt === "emom" && t.running && (
        <div className={styles.emomBarWrap}>
          <div className={cx(styles.emomBar, styles.blue)} style={{ width: `${((elapsed % 60) / 60) * 100}%` }} />
        </div>
      )}

      {t.running && fmt === "amrap" && (
        <button type="button" className={styles.roundBtn} onClick={onAddRound}>
          + Round <span>{t.amrapRounds}</span>
        </button>
      )}

      {t.running && (
        <button type="button" className={styles.fsOpenBtn} onClick={onOpenFullscreen}>
          ⛶ Chrono plein écran
        </button>
      )}

      <div className={styles.timerControls} id={`tc-${index}`}>
        {t.done ? (
          <button className={cx(styles.tcBtn, styles.tcReset)} style={{ flex: "none", width: "100%" }} onClick={onReset}>
            ↺ Refaire
          </button>
        ) : countdown !== null ? (
          <button className={cx(styles.tcBtn, styles.tcPause)} style={{ flex: "none", width: "100%" }} onClick={onCancelCountdown}>
            ⏸ Annuler le départ
          </button>
        ) : !t.running && t.accumulatedMs === 0 ? (
          <>
            <button className={cx(styles.tcBtn, styles.tcStart)} onClick={onStart}>
              ▷ Démarrer
            </button>
            <button className={cx(styles.tcBtn, styles.tcDone)} onClick={onDone}>
              ✓ Terminer
            </button>
          </>
        ) : t.running ? (
          <>
            <button className={cx(styles.tcBtn, styles.tcPause)} onClick={onPause}>
              ⏸ Pause
            </button>
            <button className={cx(styles.tcBtn, styles.tcReset)} onClick={onReset}>
              ↺
            </button>
            <button className={cx(styles.tcBtn, styles.tcDone)} onClick={onDone}>
              ✓ Fin
            </button>
          </>
        ) : (
          <>
            <button className={cx(styles.tcBtn, styles.tcStart)} onClick={onStart}>
              ▷ Reprendre
            </button>
            <button className={cx(styles.tcBtn, styles.tcReset)} onClick={onReset}>
              ↺
            </button>
            <button className={cx(styles.tcBtn, styles.tcDone)} onClick={onDone}>
              ✓ Fin
            </button>
          </>
        )}
      </div>
    </div>
  );
}


/** Chrono plein écran pendant un bloc en cours — format, temps, infos, pause. */
function FullscreenTimer({
  block,
  state: t,
  now,
  globalLabel,
  onPause,
  onResume,
  onReset,
  onAddRound,
  onDone,
  onClose,
}: {
  block: DisplayBlock;
  state: BlocState;
  now: number;
  globalLabel: string;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onAddRound: () => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const fmt = t.format;
  const elapsed = elapsedSec(t, now);
  const countdown = t.countdownEndsAt ? Math.max(0, Math.ceil((t.countdownEndsAt - now) / 1000)) : null;
  const tabata = fmt === "tabata" ? tabataView(t, elapsed) : null;

  let time = fmtMS(elapsed);
  let info = "";
  if (fmt === "amrap") {
    time = fmtMS(t.durationSec - elapsed);
    info = `${t.amrapRounds} round${t.amrapRounds > 1 ? "s" : ""} complété${t.amrapRounds > 1 ? "s" : ""}`;
  } else if (fmt === "emom") {
    const emomRounds = Math.max(1, Math.round(t.durationSec / 60));
    time = fmtMS(60 - (elapsed % 60));
    info = `Round ${Math.min(emomRounds, Math.floor(elapsed / 60) + 1)} / ${emomRounds}`;
  } else if (tabata) {
    time = fmtMS(tabata.remaining);
    info = `${tabata.phase === "work" ? "Travail" : "Repos"} · Round ${Math.min(tabata.round, t.tabataRounds)} / ${t.tabataRounds}`;
  } else if (fmt === "ft") {
    info = "Pour le temps";
  } else {
    info = "Sans chrono";
  }

  // Couleur du format posée sur le fond radial (Tabata : verte en repos) — sert
  // au fond, à l'anneau de progression et au glow derrière le chiffre.
  const color = tabata && tabata.phase === "rest" ? TABATA_REST_COLOR : FS_COLOR[fmt];
  const halo = haloColorFor(block);

  // Progression de la phase en cours (0 → 1) — vide l'anneau à mesure que le
  // temps s'écoule. Pas d'anneau pertinent pour NFT (pas de chrono) ni pour un
  // For Time sans durée cible renseignée.
  let progress = 0;
  let hasRing = false;
  if (fmt === "amrap" && t.durationSec > 0) {
    progress = elapsed / t.durationSec;
    hasRing = true;
  } else if (fmt === "emom") {
    progress = (elapsed % 60) / 60;
    hasRing = true;
  } else if (tabata) {
    const phaseSec = tabata.phase === "work" ? t.workSec : t.restSec;
    progress = phaseSec > 0 ? (phaseSec - tabata.remaining) / phaseSec : 0;
    hasRing = true;
  } else if (fmt === "ft" && t.durationSec > 0) {
    progress = elapsed / t.durationSec;
    hasRing = true;
  }
  progress = Math.max(0, Math.min(1, progress));
  const RING_R = 90;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <div
      data-hide-scroll-top
      className={styles.fsRoot}
      style={{ background: `radial-gradient(circle at 50% 44%, ${mixOpaque(halo, "#050505", 0.3)} 0%, ${mixOpaque(halo, "#050505", 0.1)} 38%, #050505 72%)` }}
    >
      <div className={styles.fsTop}>
        <div className={styles.fsFormat} style={{ color: fmt === "nft" ? "#D1D5DB" : color }}>
          {FORMAT_LABELS[fmt]}
        </div>
        <div className={styles.fsBloc} style={{ color: halo }}>{block.titre}</div>
      </div>

      <div className={styles.fsCenter}>
        <div className={styles.fsRingWrap}>
          {countdown === null && hasRing && (
            <svg className={styles.fsRing} viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={RING_R} stroke="rgba(255,255,255,.1)" strokeWidth="8" fill="none" />
              <circle
                cx="100"
                cy="100"
                r={RING_R}
                stroke={color}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * progress}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
          )}
          <div className={styles.fsTimeRow}>
            <div key={countdown !== null ? countdown : time} className={styles.fsTime} style={{ filter: `drop-shadow(0 0 20px ${hexAlpha(color, 0.6)})` }}>
              {countdown !== null ? countdown : time}
            </div>
          </div>
        </div>
        {countdown === null && (
          <button type="button" className={styles.fsResetBtn} onClick={onReset} aria-label="Remettre le chrono à zéro">
            ↺ Reset
          </button>
        )}
        <div className={styles.fsInfo}>{countdown !== null ? "Départ dans…" : info}</div>
        {!t.running && t.accumulatedMs > 0 && countdown === null && <div className={styles.fsPaused}>⏸ En pause</div>}
        {fmt === "amrap" && t.running && (
          <button type="button" className={styles.fsRoundBtn} onClick={onAddRound}>
            + Round
          </button>
        )}
        {fmt === "ft" && t.running && (
          <button type="button" className={styles.fsRoundBtn} onClick={onDone}>
            Done !
          </button>
        )}
      </div>

      <div className={styles.fsBottom}>
        <button type="button" className={styles.fsBtn} onClick={t.running ? onPause : onResume}>
          {t.running ? "⏸ Pause" : "▷ Reprendre"}
        </button>
        <div className={styles.fsGlobal}>{globalLabel}</div>
        <button type="button" className={styles.fsBtn} onClick={onClose}>
          ← Retour
        </button>
      </div>
    </div>
  );
}

/** Chrono de repos entre deux séries — overlay teinté bleu/violet pour bien le distinguer du chrono de travail. */
/**
 * Chrono de repos rendu in situ, à la place du réglage "Repos entre séries"
 * du mouvement concerné (doc H.10) — remplace l'ancien overlay plein écran +
 * mini-barre flottante, qui chevauchait la barre de stats en bas d'écran.
 */

/** Ligne d'actions d'un mouvement de musculation : « ⇄ Remplacer » (ou « ⇄ Changer ») et la vidéo (mission 11). */
function MovementActions({
  movementName,
  videoUrl,
  replaced,
  onOpen,
}: {
  movementName: string;
  videoUrl?: string;
  replaced: boolean;
  onOpen: () => void;
}) {
  const [video, setVideo] = useState(false);
  return (
    <div className={styles.moveActions}>
      <button type="button" className={styles.replaceBtn} onClick={onOpen}>
        ⇄ {replaced ? "Changer" : "Remplacer"}
      </button>
      <button type="button" className={styles.moveVideoBtn} onClick={() => setVideo(true)} aria-label={`Vidéo ${movementName}`}>
        ▶
      </button>
      <VideoModal open={video} onClose={() => setVideo(false)} title={movementName} searchQuery={movementName} videoUrl={videoUrl} />
    </div>
  );
}

/** Feuille « Remplacer [mouvement] » : trois zones empilées — haut fixe, milieu qui défile, bas fixe (mission 7). */
function ReplaceSheet({
  movementName,
  options,
  onConfirm,
  onClose,
}: {
  movementName: string;
  options: EquivalentOption[];
  onConfirm: (option: EquivalentOption, reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string>(REPLACE_REASONS[0]);
  const [picked, setPicked] = useState(options[0]?.id ?? "");
  const [video, setVideo] = useState<EquivalentOption | null>(null);
  const chosen = options.find((o) => o.id === picked) ?? options[0];

  // La page derrière ne défile pas tant que la feuille est ouverte.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div data-hide-scroll-top className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} role="dialog" aria-label={`Remplacer ${movementName}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetTop}>
          <div className={styles.sheetTitle}>Remplacer {movementName}</div>
          <div className={styles.sheetHelp}>Pour cette séance seulement. Les séries et répétitions prévues sont gardées.</div>
        </div>

        <div className={styles.sheetMiddle}>
          <div className={styles.sheetLabel}>POURQUOI ?</div>
          <div className={styles.reasonRow}>
            {REPLACE_REASONS.map((r) => (
              <button key={r} type="button" className={reason === r ? styles.reasonOn : styles.reason} onClick={() => setReason(r)}>
                {r}
              </button>
            ))}
          </div>

          <div className={styles.sheetLabel}>ÉQUIVALENTS</div>
          <div className={styles.equivList}>
            {options.map((o) => (
              <div
                key={o.id}
                role="radio"
                aria-checked={picked === o.id}
                tabIndex={0}
                className={picked === o.id ? styles.equivOn : styles.equiv}
                onClick={() => setPicked(o.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setPicked(o.id);
                }}
              >
                <span className={picked === o.id ? styles.equivRadioOn : styles.equivRadio} />
                <span className={styles.equivText}>
                  <span className={styles.equivName}>{o.name}</span>
                  <span className={styles.equivEquip}>{o.equipmentLabel}</span>
                </span>
                <button
                  type="button"
                  className={styles.equivVideo}
                  aria-label={`Vidéo ${o.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideo(o);
                  }}
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sheetBottom}>
          <button type="button" className={styles.sheetConfirm} onClick={() => chosen && onConfirm(chosen, reason)}>
            Remplacer
          </button>
          <button type="button" className={styles.sheetCancel} onClick={onClose}>
            Annuler
          </button>
        </div>
        {video && <VideoModal open onClose={() => setVideo(null)} title={video.name} searchQuery={video.name} videoUrl={video.videoUrl} />}
      </div>
    </div>
  );
}

/** Bloc Superset / Circuit (mission 11) : une carte par tour, un seul repos à la fin de chaque tour. */
function CircuitBlock({
  block,
  circuit,
  blocDone,
  restTimer,
  now,
  lastResults,
  equivalents,
  onCell,
  onValidate,
  onAddTour,
  onRest,
  onSkipRest,
  onOpenReplace,
  onRevert,
}: {
  block: DisplayBlock;
  circuit: CircuitState;
  blocDone: boolean;
  restTimer: NonNullable<RestTimerState> | null;
  now: number;
  lastResults: Record<string, LastResult>;
  equivalents: Record<string, EquivalentOption[]>;
  onCell: (tourIdx: number, exIdx: number, patch: Partial<{ charge: string; reps: string }>) => void;
  onValidate: () => void;
  onAddTour: () => void;
  onRest: (sec: number) => void;
  onSkipRest: () => void;
  onOpenReplace: (exIdx: number) => void;
  onRevert: (exIdx: number) => void;
}) {
  const [video, setVideo] = useState<number | null>(null);
  const items = block.items;
  const total = circuit.tours.length;
  const currentIdx = circuit.tours.findIndex((t) => !t.done);
  const isCircuit = items.length >= 3;
  const tag = isCircuit ? "CIRCUIT" : "SUPERSET";
  const remaining = restTimer ? Math.max(0, Math.ceil((restTimer.endsAt - now) / 1000)) : 0;
  const restAfter = restTimer ? Number(restTimer.label.replace(/\D/g, "")) : 0;
  const fmtRest = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  const dec = useLongPress(() => onRest(circuit.restSec - 5), () => onRest(circuit.restSec - 5));
  const inc = useLongPress(() => onRest(circuit.restSec + 5), () => onRest(circuit.restSec + 5));

  return (
    <div className={styles.circuit}>
      <div className={styles.circuitHead}>
        <span className={styles.circuitLetter}>{block.lettre}</span>
        <span className={styles.circuitTitle}>{block.titre}</span>
        <span className={styles.circuitTag}>{tag}</span>
      </div>
      <div className={styles.circuitHelp}>
        {items.length} mouvements enchaînés, {total} tour{total > 1 ? "s" : ""}. Repos seulement à la fin de chaque tour.
      </div>

      {circuit.tours.map((t, ti) => {
        const current = ti === currentIdx;
        return (
          <div key={ti}>
            <div className={`${styles.tourCard} ${current ? styles.tourCurrent : ""} ${t.done ? styles.tourDone : ""}`}>
              <div className={styles.tourHead}>
                <span className={styles.tourLabel}>
                  TOUR {ti + 1} / {total}
                </span>
                <span className={current ? styles.tourState : styles.tourStateMuted}>{t.done ? "✓ FAIT" : current ? "EN COURS" : "À VENIR"}</span>
              </div>

              {t.done && (
                <div className={styles.tourSummary}>
                  {items.map((_, j) => {
                    const c = t.cells[j];
                    const parts = [c.charge.trim() ? `${c.charge} kg` : "", c.reps.trim() ? `× ${c.reps}` : ""].filter(Boolean).join(" ");
                    return (
                      <div key={j}>
                        {t.names[j] ?? items[j].name} · {parts || "non renseigné"}
                      </div>
                    );
                  })}
                </div>
              )}

              {current && (
                <>
                  <div className={styles.tourCols}>
                    <span>KG</span>
                    <span>REPS</span>
                  </div>
                  {items.map((it, j) => {
                    const last = lastResults[it.name] ?? lastResults[it.movementName];
                    const canReplace = !!it.plannedMovementId && (equivalents[it.plannedMovementId]?.length ?? 0) > 0;
                    return (
                      <div key={`${it.movementName}-${j}`} className={styles.tourRow}>
                        <div className={styles.tourRowMain}>
                          <span className={styles.tourMark}>
                            {String.fromCharCode(64 + (Number(block.lettre) || 1))}
                            {j + 1}
                          </span>
                          <div className={styles.tourName}>
                            {it.replacedFrom && <span className={styles.replacedTag}>REMPLACÉ</span>}
                            <div>{it.name}</div>
                            <div className={styles.tourPresc}>{it.reps !== undefined ? `${it.reps} reps` : it.qty}</div>
                            {it.replacedFrom && <div className={styles.replacedFrom}>à la place de : {it.replacedFrom}</div>}
                            {last && last.charge > 0 && (
                              <div className={styles.lastResult} style={{ margin: "2px 0 0" }}>
                                Dernière fois : {last.charge} kg × {last.reps || "—"}
                              </div>
                            )}
                          </div>
                          <input
                            className={styles.tourInput}
                            type="number"
                            inputMode="decimal"
                            placeholder="—"
                            value={t.cells[j]?.charge ?? ""}
                            onChange={(e) => onCell(ti, j, { charge: e.target.value })}
                            aria-label={`kg ${it.name}`}
                          />
                          <input
                            className={styles.tourInput}
                            type="number"
                            inputMode="numeric"
                            placeholder="—"
                            value={t.cells[j]?.reps ?? ""}
                            onChange={(e) => onCell(ti, j, { reps: e.target.value })}
                            aria-label={`reps ${it.name}`}
                          />
                        </div>
                        <div className={styles.tourBtns}>
                          <button type="button" className={styles.tourBtn} onClick={() => setVideo(j)}>
                            ▶️ Vidéo
                          </button>
                          {canReplace && (
                            <button type="button" className={styles.tourBtn} onClick={() => onOpenReplace(j)}>
                              ⇄ {it.replacedFrom ? "Changer" : "Remplacer"}
                            </button>
                          )}
                          {it.replacedFrom && (
                            <button type="button" className={styles.revertLink} style={{ padding: 0 }} onClick={() => onRevert(j)}>
                              Rétablir
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button type="button" className={styles.tourValidate} onClick={onValidate}>
                    {ti === total - 1 ? "VALIDER LE DERNIER TOUR" : "VALIDER LE TOUR"}
                  </button>
                </>
              )}
            </div>

            {restTimer && restAfter === ti + 1 && (
              <div className={styles.tourRest}>
                <div className={styles.tourRestLabel}>
                  REPOS · TOUR {restAfter} / {total} TERMINÉ
                </div>
                <div className={styles.tourRestTime}>{fmtRest(remaining)}</div>
                <button type="button" className={styles.tourRestSkip} onClick={onSkipRest}>
                  Passer le repos
                </button>
              </div>
            )}
          </div>
        );
      })}

      {blocDone && currentIdx === -1 && <div className={styles.circuitDone}>✓ BLOC TERMINÉ</div>}

      <div className={styles.circuitRestRow}>
        <span className={styles.sheetLabel} style={{ margin: 0 }}>
          REPOS ENTRE TOURS
        </span>
        <div className={styles.circuitRestCtl}>
          <button type="button" className={styles.roundBtn} aria-label="Moins 5 secondes" {...dec}>
            −
          </button>
          <span className={styles.circuitRestVal}>{fmtRest(circuit.restSec)}</span>
          <button type="button" className={styles.roundBtn} aria-label="Plus 5 secondes" {...inc}>
            +
          </button>
        </div>
      </div>
      <button type="button" className={styles.addSerieBtn} onClick={onAddTour}>
        + Ajouter un tour
      </button>

      {video !== null && (
        <VideoModal open onClose={() => setVideo(null)} title={items[video].movementName} searchQuery={items[video].movementName} videoUrl={items[video].videoUrl} />
      )}
    </div>
  );
}

function InlineRestTimer({
  endsAt,
  totalSec,
  now,
  onStep,
  onCancel,
}: {
  endsAt: number;
  totalSec: number;
  now: number;
  /** Ajustement fin ±5s (tap) / ±1min (appui long) — n'affecte que ce repos
   * en cours, pas la durée par défaut des repos suivants. */
  onStep: (deltaSec: number) => void;
  onCancel: () => void;
}) {
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const dec = useLongPress(() => onStep(-5), () => onStep(-60));
  const inc = useLongPress(() => onStep(5), () => onStep(60));

  return (
    <div className={styles.restInline}>
      <div className={styles.restInlineTop}>
        <span className={styles.restInlineLabel}>Repos</span>
        <button type="button" className={styles.restInlineCancel} onClick={onCancel}>
          Passer ✕
        </button>
      </div>
      <div className={styles.durAdjustRow}>
        <button type="button" className={styles.durAdjustBtn} aria-label="Diminuer le repos" {...dec}>
          −
        </button>
        <div className={styles.restInlineTime}>{fmtMS(remaining)}</div>
        <button type="button" className={styles.durAdjustBtn} aria-label="Augmenter le repos" {...inc}>
          +
        </button>
      </div>
      <div className={styles.restInlineSub}>Repos entre séries</div>
      <div className={styles.restBarWrap}>
        <div className={styles.restBar} style={{ width: `${totalSec > 0 ? ((totalSec - remaining) / totalSec) * 100 : 0}%` }} />
      </div>
    </div>
  );
}
