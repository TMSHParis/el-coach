"use client";

import { useEffect, useMemo, useState } from "react";
import { WeekCyclePicker, cx } from "@/app/signup/ecm-shared";
import type { WeekCycle } from "@/app/signup/actions";
import { addWeeks, mondayOf, toKey, weekTitle } from "@/lib/week";
import { applyWeekChange, getWeekOverrides, resetWeekOverride, type WeekChangeScope } from "../week-actions";
import styles from "@/app/signup/ecm-signup.module.css";

const SCOPES: { value: WeekChangeScope; label: string }[] = [
  { value: "this", label: "Cette semaine seulement" },
  { value: "four", label: "Cette semaine et les 3 suivantes" },
  { value: "always", label: "Toujours (change ma semaine type)" },
];

/**
 * « Ma semaine type » avec sélecteur de semaine et portée des modifications
 * (partie 2, 2.8). Une semaine sans modification reprend la semaine type ; il
 * n'y a pas d'alternance automatique A/B.
 */
export function WeekPlanner({
  baseCycle,
  programmeLabel,
  onBaseChange,
}: {
  baseCycle: WeekCycle;
  programmeLabel: string;
  /** Mise à jour de la semaine type (portée « Toujours », ou édition tant qu'aucune modification par semaine n'existe). */
  onBaseChange: (next: WeekCycle) => void;
}) {
  const todayKey = useMemo(() => toKey(new Date()), []);
  const currentMonday = mondayOf(todayKey);
  const [weekStart, setWeekStart] = useState(currentMonday);
  const [overrides, setOverrides] = useState<Record<string, WeekCycle>>({});
  const [draft, setDraft] = useState<WeekCycle | null>(null);
  const [sheet, setSheet] = useState(false);
  const [scope, setScope] = useState<WeekChangeScope>("this");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getWeekOverrides().then(setOverrides);
  }, []);

  const override = overrides[weekStart];
  const shown = draft ?? override ?? baseCycle;
  const changedDays = override
    ? (Object.keys(override) as (keyof WeekCycle)[]).filter((k) => JSON.stringify(override[k]) !== JSON.stringify(baseCycle[k]))
    : [];

  function go(delta: number) {
    setWeekStart((w) => addWeeks(w, delta));
    setDraft(null);
    setSheet(false);
  }

  async function validate() {
    if (!draft) return;
    setBusy(true);
    const res = await applyWeekChange({ weekStart, cycle: draft, scope });
    if (res.ok) {
      if (scope === "always") onBaseChange(draft);
      setOverrides(await getWeekOverrides());
      setDraft(null);
      setSheet(false);
    }
    setBusy(false);
  }

  async function resetWeek() {
    setBusy(true);
    await resetWeekOverride(weekStart);
    setOverrides(await getWeekOverrides());
    setDraft(null);
    setBusy(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 8px" }}>
        <button type="button" className={styles.weekResetLink} onClick={() => go(-1)} aria-label="Semaine précédente">
          ‹
        </button>
        <strong style={{ letterSpacing: 1 }}>{weekTitle(weekStart, todayKey)}</strong>
        <button type="button" className={styles.weekResetLink} onClick={() => go(1)} aria-label="Semaine suivante">
          ›
        </button>
      </div>

      <WeekCyclePicker
        value={shown}
        programmeLabel={programmeLabel}
        forceCustomized={!!override}
        onReset={override ? resetWeek : undefined}
        onChange={(next) => {
          // Aucune modification par semaine et semaine courante : la semaine type reste éditable comme avant.
          setDraft(next);
        }}
      />
      {changedDays.length > 0 && !draft && (
        <p className={styles.weekHint}>Jours modifiés cette semaine : {changedDays.map((d) => String(d).toUpperCase()).join(", ")}</p>
      )}

      {draft && !sheet && (
        <button type="button" className={styles.btnAddSport} onClick={() => setSheet(true)} disabled={busy}>
          Enregistrer cette modification
        </button>
      )}

      {sheet && (
        <div className={cx(styles.qc, styles.on)} role="dialog" aria-label="Appliquer la modification">
          <div className={styles.ql}>Appliquer cette modification à :</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SCOPES.map((o) => (
              <div key={o.value} className={cx(styles.mo, scope === o.value && styles.sel)} onClick={() => setScope(o.value)}>
                <div className={styles.mc}>{scope === o.value ? "✓" : ""}</div>
                {o.label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" className={styles.btnAddSport} onClick={validate} disabled={busy}>
              VALIDER
            </button>
            <button type="button" className={styles.weekResetLink} onClick={() => setSheet(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
