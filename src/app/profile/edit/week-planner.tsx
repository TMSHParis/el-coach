"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WeekCyclePicker, standardCycleFor } from "@/app/signup/ecm-shared";
import type { WeekCycle, WeekCycleDayKey } from "@/app/signup/actions";
import { addWeeks, mondayOf, parseKey, toKey } from "@/lib/week";
import { formatDate, type Lang, type Translate } from "@/lib/i18n";
import { useLang, useT } from "@/lib/i18n/provider";
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

const SCOPES = [
  { value: "this", label: "su.wk.scope.this", short: "su.wk.scope.this" },
  { value: "four", label: "su.wk.scope.four", short: "su.wk.scope.four" },
  { value: "ab", label: "su.wk.scope.ab", short: "su.wk.scope.abShort", sub: "su.wk.scope.abSub" },
  { value: "always", label: "su.wk.scope.always", short: "su.wk.scope.always", sub: "su.wk.scope.alwaysSub" },
] as const satisfies readonly { value: WeekChangeScope; label: string; short: string; sub?: string }[];

/** Titre long d'une semaine (« Cette semaine », « Semaine du 2 novembre »…), selon la langue. */
function weekHeadingT(weekStart: string, todayKey: string, lang: Lang, t: Translate): string {
  const current = mondayOf(todayKey);
  if (weekStart === current) return t("su.wk.thisWeek");
  if (weekStart === addWeeks(current, 1)) return t("su.wk.nextWeek");
  if (weekStart === addWeeks(current, -1)) return t("su.wk.lastWeek");
  return t("su.wk.weekOf", { date: formatDate(lang, parseKey(weekStart), { day: "numeric", month: "long" }) });
}

/** « 19 - 25 oct. » ou « 26 oct. - 1 nov. » quand la semaine chevauche deux mois, selon la langue. */
function weekRangeT(weekStart: string, lang: Lang): string {
  const start = parseKey(weekStart);
  const end = parseKey(weekStart);
  end.setDate(end.getDate() + 6);
  const month = (d: Date) => formatDate(lang, d, { month: "short" });
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} - ${end.getDate()} ${month(end)}`
    : `${start.getDate()} ${month(start)} - ${end.getDate()} ${month(end)}`;
}

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
  const t = useT();
  const { lang } = useLang();
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
  const [placeMsg, setPlaceMsg] = useState<"none" | "placed" | null>(null);
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
      setPlaceMsg("none");
      return;
    }
    // Remplace les créneaux ECM de la semaine ; le reste (sports hors ECM, repos) est conservé.
    touched.current = new Set(diffDays(shown, next));
    setDraft(next);
    setPlaceMsg("placed");
  }

  return (
    <div>
      <div className={styles.nav}>
        <button type="button" className={styles.arrow} onClick={() => void go(-1)} aria-label={t("su.wk.prev")}>
          ‹
        </button>
        <div className={styles.center}>
          <div className={styles.title}>
            {weekHeadingT(weekStart, todayKey, lang, t)}
            {letter ? ` · ${letter}` : ""}
          </div>
          <div className={styles.range}>{weekRangeT(weekStart, lang)}</div>
        </div>
        <button type="button" className={styles.arrow} onClick={() => void go(1)} aria-label={t("su.wk.next")}>
          ›
        </button>
      </div>

      <div className={styles.row}>
        {scope || weekModified ? (
          <button type="button" className={styles.personalized} onClick={() => setSheet(true)}>
            {t("su.week.custom")}
          </button>
        ) : (
          <button type="button" className={styles.personalize} onClick={() => setSheet(true)}>
            {t("su.wk.personalize")} <span aria-hidden="true">▾</span>
          </button>
        )}
        {alternance ? (
          <button type="button" className={styles.reset} onClick={() => void reset()} disabled={busy}>
            {t("su.wk.removeAb")}
          </button>
        ) : (
          <button type="button" className={override ? styles.reset : styles.resetOff} onClick={() => override && void reset()} disabled={!override || busy}>
            {t("su.week.restore")}
          </button>
        )}
      </div>

      {scope && scopeInfo && (
        <div className={styles.mode}>
          <span>
            {t("su.wk.changes")} <b>{t(scopeInfo.short)}</b>
          </span>
          <button type="button" className={styles.finish} onClick={() => void finish()}>
            {t("su.wk.done")}
          </button>
        </div>
      )}

      {alternance && (
        <>
          <div className={styles.ab} role="tablist">
            <button type="button" className={letter === "A" ? styles.abOn : styles.abBtn} onClick={() => void goToLetter("A")}>
              {t("su.wk.weekA")}
            </button>
            <button type="button" className={letter === "B" ? styles.abOn : styles.abBtn} onClick={() => void goToLetter("B")}>
              {t("su.wk.weekB")}
            </button>
          </div>
          <div className={styles.abHelp}>{t("su.wk.abHelp")}</div>
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
            ? t("su.wk.editingAb", { letter, other })
            : scopeInfo
              ? t("su.wk.willApply", { scope: t(scopeInfo.short).toLowerCase() })
              : undefined
        }
        onChange={(next) => setDraft(next)}
      />

      {hasExternalSport(shown) && (
        <>
          <button type="button" className={styles.place} onClick={place} disabled={!scope}>
            {t("su.wk.replace")}
          </button>
          {!scope && <div className={styles.placeNote}>{t("su.wk.chooseFirst")}</div>}
          {placeMsg && <div className={styles.placeNote}>{placeMsg === "none" ? t("su.wk.nothingToPlace") : t("su.wk.placed")}</div>}
        </>
      )}

      {sheet && (
        <div data-hide-scroll-top className={styles.overlay} onClick={() => setSheet(false)}>
          <div className={styles.sheet} role="dialog" aria-label={t("su.wk.sheetLabel")} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetTitle}>{t("su.wk.sheetTitle")}</div>
            <div className={styles.sheetHelp}>{t("su.wk.sheetHelp")}</div>
            {SCOPES.map((o) => (
              <button key={o.value} type="button" className={choice === o.value ? styles.choiceOn : styles.choice} onClick={() => setChoice(o.value)}>
                <span className={choice === o.value ? styles.radioOn : styles.radio} />
                <span>
                  {t(o.label)}
                  {"sub" in o && o.sub && <span className={styles.choiceSub}>{t(o.sub)}</span>}
                </span>
              </button>
            ))}
            <button type="button" className={styles.validate} onClick={() => void validateSheet()} disabled={busy}>
              {t("su.validate")}
            </button>
            <button type="button" className={styles.cancel} onClick={() => setSheet(false)}>
              {t("su.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
