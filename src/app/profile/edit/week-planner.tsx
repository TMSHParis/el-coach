"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WeekCyclePicker, standardCycleFor } from "@/app/signup/ecm-shared";
import type { WeekCycle, WeekCycleDayKey } from "@/app/signup/actions";
import { addWeeks, mondayOf, toKey, weekHeading, weekRange } from "@/lib/week";
import { alternanceLetter, cycleForWeek, diffDays, isEmptyCycle } from "@/lib/week-cycle";
import { placeEcmAroundSports, hasExternalSport } from "@/lib/week-placement";
import {
  applyWeekChange,
  getWeekState,
  removeAlternance,
  resetWeekOverride,
  startAlternance,
  type WeekChangeScope,
  type WeekState,
} from "../week-actions";
import styles from "./week-planner.module.css";

const SCOPES: { value: WeekChangeScope; label: string; short: string; sub?: string }[] = [
  { value: "this", label: "Cette semaine seulement", short: "Cette semaine seulement" },
  { value: "four", label: "Cette semaine et les 3 suivantes", short: "Cette semaine et les 3 suivantes" },
  {
    value: "ab",
    label: "Deux semaines différentes qui alternent (A / B)",
    short: "Deux semaines qui alternent (A / B)",
    sub: "Tu programmes une semaine A et une semaine B. Elles se suivent en alternance : A, B, A, B…",
  },
  { value: "always", label: "Toujours (change ma semaine type)", short: "Toujours (change ma semaine type)", sub: "Toutes les semaines sans modification propre changent." },
];

/**
 * « Ma semaine type d'entraînement » : flèches de semaine, bouton « Personnaliser cette semaine »,
 * feuille de portée, mode de modification, alternance A/B (partie 3, mission 7).
 */
export function WeekPlanner({
  baseCycle,
  programmeLabel,
  onBaseChange,
}: {
  baseCycle: WeekCycle;
  programmeLabel: string;
  /** Mise à jour de la semaine type (portée « Toujours »). */
  onBaseChange: (next: WeekCycle) => void;
}) {
  const todayKey = useMemo(() => toKey(new Date()), []);
  const [weekStart, setWeekStart] = useState(mondayOf(todayKey));
  const [state, setState] = useState<WeekState>({ overrides: {}, alternance: null });
  const [draft, setDraft] = useState<WeekCycle | null>(null);
  const touched = useRef<Set<WeekCycleDayKey>>(new Set());
  const [scope, setScope] = useState<WeekChangeScope | null>(null);
  const [sheet, setSheet] = useState(false);
  const [choice, setChoice] = useState<WeekChangeScope>("this");
  const [busy, setBusy] = useState(false);
  const [closeKey, setCloseKey] = useState(0);
  const [placeMsg, setPlaceMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => setState(await getWeekState()), []);
  useEffect(() => {
    void getWeekState().then(setState);
  }, []);

  const { overrides, alternance } = state;
  const reference = isEmptyCycle(baseCycle) ? standardCycleFor(programmeLabel) ?? baseCycle : baseCycle;
  const saved = cycleForWeek(weekStart, baseCycle, overrides, alternance) ?? baseCycle;
  const shown = draft ?? saved;
  const override = overrides[weekStart];
  const letter = alternance ? alternanceLetter(alternance.anchor, weekStart) : null;
  const marked = isEmptyCycle(shown) ? [] : diffDays(shown, reference);
  const weekModified = !!override || marked.length > 0;

  /** Enregistre les jours touchés avec la portée courante. */
  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    if (!draft || !scope || touched.current.size === 0) return;
    const days = [...touched.current];
    touched.current = new Set();
    setBusy(true);
    const res = await applyWeekChange({ weekStart, cycle: draft, days, scope });
    if (res.ok) {
      if (scope === "always") onBaseChange(draft);
      const fresh = await getWeekState();
      setState(fresh);
      const fromServer = cycleForWeek(weekStart, scope === "always" ? draft : baseCycle, fresh.overrides, fresh.alternance);
      setDraft((d) => (d && fromServer && JSON.stringify(d) === JSON.stringify(fromServer) ? null : d));
    }
    setBusy(false);
  }, [draft, scope, weekStart, baseCycle, onBaseChange]);

  // Enregistrement après une pause de frappe.
  useEffect(() => {
    if (!draft || !scope || touched.current.size === 0) return;
    timer.current = setTimeout(() => void flush(), 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, scope, flush]);

  async function go(delta: number) {
    await flush();
    setDraft(null);
    setWeekStart((w) => addWeeks(w, delta));
    setCloseKey((k) => k + 1);
  }

  async function goToLetter(target: "A" | "B") {
    if (!alternance) return;
    await go(letter === target ? 0 : 1);
  }

  async function validateSheet() {
    setBusy(true);
    if (choice === "ab" && !alternance) {
      const start = isEmptyCycle(shown) ? standardCycleFor(programmeLabel) ?? shown : shown;
      await startAlternance({ weekStart, cycle: start });
      await refresh();
      setDraft(null);
    }
    setScope(choice);
    setSheet(false);
    setBusy(false);
  }

  async function finish() {
    await flush();
    setScope(null);
    setDraft(null);
    setCloseKey((k) => k + 1);
  }

  async function reset() {
    setBusy(true);
    if (alternance) {
      await removeAlternance();
      if (scope === "ab") setScope(null);
    } else if (override) {
      await resetWeekOverride(weekStart);
    }
    await refresh();
    setDraft(null);
    setCloseKey((k) => k + 1);
    setBusy(false);
  }

  const scopeInfo = SCOPES.find((s) => s.value === scope);
  const other = letter === "A" ? "B" : "A";

  function place() {
    const next = placeEcmAroundSports(shown, programmeLabel);
    if (!next) {
      setPlaceMsg("Rien à replacer pour cette semaine.");
      return;
    }
    // Remplace les créneaux ECM de la semaine ; le reste (sports hors ECM, repos) est conservé.
    touched.current = new Set(diffDays(shown, next));
    setDraft(next);
    setPlaceMsg("Séances ECM replacées autour de tes sports.");
  }

  return (
    <div>
      <div className={styles.nav}>
        <button type="button" className={styles.arrow} onClick={() => void go(-1)} aria-label="Semaine précédente">
          ‹
        </button>
        <div className={styles.center}>
          <div className={styles.title}>
            {weekHeading(weekStart, todayKey)}
            {letter ? ` · ${letter}` : ""}
          </div>
          <div className={styles.range}>{weekRange(weekStart)}</div>
        </div>
        <button type="button" className={styles.arrow} onClick={() => void go(1)} aria-label="Semaine suivante">
          ›
        </button>
      </div>

      <div className={styles.row}>
        {scope || weekModified ? (
          <button type="button" className={styles.personalized} onClick={() => setSheet(true)}>
            Semaine personnalisée
          </button>
        ) : (
          <button type="button" className={styles.personalize} onClick={() => setSheet(true)}>
            Personnaliser cette semaine <span aria-hidden="true">▾</span>
          </button>
        )}
        {alternance ? (
          <button type="button" className={styles.reset} onClick={() => void reset()} disabled={busy}>
            Supprimer l&apos;alternance A/B
          </button>
        ) : (
          <button type="button" className={override ? styles.reset : styles.resetOff} onClick={() => override && void reset()} disabled={!override || busy}>
            Rétablir la semaine standard
          </button>
        )}
      </div>

      {scope && scopeInfo && (
        <div className={styles.mode}>
          <span>
            Modifications : <b>{scopeInfo.short}</b>
          </span>
          <button type="button" className={styles.finish} onClick={() => void finish()}>
            Terminer
          </button>
        </div>
      )}

      {alternance && (
        <>
          <div className={styles.ab} role="tablist">
            <button type="button" className={letter === "A" ? styles.abOn : styles.abBtn} onClick={() => void goToLetter("A")}>
              Semaine A
            </button>
            <button type="button" className={letter === "B" ? styles.abOn : styles.abBtn} onClick={() => void goToLetter("B")}>
              Semaine B
            </button>
          </div>
          <div className={styles.abHelp}>Choisis la semaine A ou B, puis touche un jour pour le modifier.</div>
        </>
      )}

      <WeekCyclePicker
        key={closeKey}
        value={shown}
        programmeLabel={programmeLabel}
        hideHeader
        forceCustomized={!!override || !!alternance || !!draft}
        markedDays={marked}
        onBeforeOpen={() => {
          if (scope) return true;
          setSheet(true);
          return false;
        }}
        onTouchDay={(d) => touched.current.add(d)}
        editorNote={
          scope === "ab" && letter
            ? `Tu modifies la semaine ${letter} (affichée). Passe à l'autre semaine avec les flèches pour programmer ${other}.`
            : scopeInfo
              ? `Sera appliqué : ${scopeInfo.short.toLowerCase()}.`
              : undefined
        }
        onChange={(next) => setDraft(next)}
      />

      {hasExternalSport(shown) && (
        <>
          <button type="button" className={styles.place} onClick={place} disabled={!scope}>
            Replacer mes séances ECM autour de mes sports
          </button>
          {!scope && <div className={styles.placeNote}>Choisis d&apos;abord « Personnaliser cette semaine ».</div>}
          {placeMsg && <div className={styles.placeNote}>{placeMsg}</div>}
        </>
      )}

      {sheet && (
        <div data-hide-scroll-top className={styles.overlay} onClick={() => setSheet(false)}>
          <div className={styles.sheet} role="dialog" aria-label="Appliquer mes modifications" onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetTitle}>Appliquer mes modifications à :</div>
            <div className={styles.sheetHelp}>Ce choix vaut pour tous les jours que tu modifies ensuite.</div>
            {SCOPES.map((o) => (
              <button key={o.value} type="button" className={choice === o.value ? styles.choiceOn : styles.choice} onClick={() => setChoice(o.value)}>
                <span className={choice === o.value ? styles.radioOn : styles.radio} />
                <span>
                  {o.label}
                  {o.sub && <span className={styles.choiceSub}>{o.sub}</span>}
                </span>
              </button>
            ))}
            <button type="button" className={styles.validate} onClick={() => void validateSheet()} disabled={busy}>
              Valider
            </button>
            <button type="button" className={styles.cancel} onClick={() => setSheet(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
