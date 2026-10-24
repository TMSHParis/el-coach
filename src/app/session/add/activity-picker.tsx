"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n";
import { buildSeanceGroups } from "@/app/checkin/checkin-form";
import { REPOS_SUBTYPES, RECUP_SUBTYPES, isReposSubtype, isRecupSubtype } from "@/lib/seance-kinds";
import { addExtraActivity } from "../extra-activity-actions";
import styles from "./add.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

function accordionKindOf(value: string): "repos" | "recup" | null {
  if (isReposSubtype(value)) return "repos";
  if (isRecupSubtype(value)) return "recup";
  return null;
}

/** "HH:MM" actuel, en local — pré-rempli mais modifiable (doc G.3/Dashboard mockup). */
function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Même sélecteur de séance que le check-in (select natif + accordéon
 * repos/récup, doc 12.2) mais isolé — pas de sliders d'état du jour, pas de
 * nouvelle déclaration de sommeil : seule l'activité à ajouter est demandée. */
export function ActivityPicker({ programmes = [] }: { programmes?: string[] }) {
  const t = useT();
  const router = useRouter();
  const seanceGroups = buildSeanceGroups(programmes);
  const [seance, setSeance] = useState("");
  const [accordion, setAccordion] = useState<"repos" | "recup" | null>(null);
  const [open, setOpen] = useState(false);
  const [heure, setHeure] = useState(nowHHMM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSelectChange(value: string) {
    if (value === "__repos__" || value === "__recup__") {
      setSeance("");
      setAccordion(value === "__repos__" ? "repos" : "recup");
      setOpen(true);
      return;
    }
    setSeance(value);
    setAccordion(accordionKindOf(value));
    setOpen(false);
  }

  function chooseSubtype(value: string) {
    setSeance(value);
    setOpen(false);
  }

  // Affichage seulement : la valeur stockée reste le libellé français.
  const subLabel = (value: string) => (accordionKindOf(value) ? t(`sp.sub.${value}` as DictKey) : value);
  const selectValue = accordion === "repos" ? "__repos__" : accordion === "recup" ? "__recup__" : seance;
  const showChosen = accordion !== null && Boolean(seance);

  async function handleSubmit() {
    if (!seance) {
      setError(t("sp.add.errChoose"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await addExtraActivity(seance, heure);
      if (!result.ok) {
        setSubmitting(false);
        setError(t("sp.add.errCreate"));
        return;
      }
      router.push(`/session/extra/${result.id}`);
    } catch {
      setSubmitting(false);
      setError(t("sp.add.errServer"));
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.label}>{t("sp.add.choose")}</div>
      <select className={styles.select} value={selectValue} onChange={(e) => onSelectChange(e.target.value)}>
        <option value="" disabled>
          {t("sp.add.placeholder")}
        </option>
        {seanceGroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {accordion === "repos" && open && (
        <div className={styles.accordion}>
          <p className={styles.accLabel}>{t("sp.add.reposPick")}</p>
          <div className={styles.opts}>
            {REPOS_SUBTYPES.map((o) => (
              <div key={o} className={cx(styles.opt, seance === o && styles.sel)} onClick={() => chooseSubtype(o)}>
                {subLabel(o)}
              </div>
            ))}
          </div>
        </div>
      )}
      {accordion === "recup" && open && (
        <div className={styles.accordion}>
          <p className={styles.accLabel}>{t("sp.add.recupPick")}</p>
          <div className={styles.opts}>
            {RECUP_SUBTYPES.map((o) => (
              <div key={o} className={cx(styles.opt, seance === o && styles.sel)} onClick={() => chooseSubtype(o)}>
                {subLabel(o)}
              </div>
            ))}
          </div>
        </div>
      )}
      {showChosen && (
        <div className={styles.chosen}>
          {t("sp.add.chosen")} <strong>{subLabel(seance)}</strong>
        </div>
      )}

      <div className={styles.label} style={{ marginTop: 14 }}>
        {t("sp.add.time")}
      </div>
      <input type="time" className={styles.select} value={heure} onChange={(e) => setHeure(e.target.value)} />
      <div className={styles.hint}>{t("sp.add.timeHint")}</div>

      {error && <div className={styles.error}>{error}</div>}

      <button type="button" className={styles.submit} disabled={submitting} onClick={handleSubmit}>
        {submitting ? t("sp.add.creating") : t("sp.add.start")}
      </button>
    </div>
  );
}
