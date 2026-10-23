"use client";

// Choix de l'événement par familles et fiche par sport (partie 3, missions 2 à 5).
// Utilisé par la carte « Je prépare mon corps à… » et, quand la priorité est
// Compétition, par « Améliorer mes performances sportives ».

import { useState } from "react";
import type { EcmObjectifDetail } from "./actions";
import {
  EVENT_FAMILIES,
  EVENT_ICONS,
  FICHE_FIELDS,
  SPORT_PROGRAM,
  crossfitStageDate,
  familyOf,
  sportTitle,
  type EventFamilyId,
  type FicheField,
} from "@/lib/competition-params";
import { planFor, weeksLeftLabel } from "@/lib/competition-plan";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { todayKey } from "@/lib/date-key";
import { PhasePath } from "@/components/phase-path";
import styles from "./event-fiche.module.css";

const FAMILY_LABEL: Record<EventFamilyId, string> = { course: "Course", hybride: "Hybride", combat: "Combat", autre: "Autre" };

/** Champs de la fiche d'un objectif : valeur lue sur l'objectif (date, niveau, catégorie ou fiche libre). */
export function ficheValue(entry: EcmObjectifDetail, key: string): string {
  if (key === "date") return entry.dateExacte ?? "";
  if (key === "niveau") return entry.priorite ?? "";
  if (key === "categorie") return entry.categorie ?? "";
  return entry.fiche?.[key] ?? "";
}

export function ficheMissing(entry: EcmObjectifDetail): string[] {
  const fields = FICHE_FIELDS[entry.event] ?? [];
  return fields.filter((f) => !f.optional && !ficheValue(entry, f.key)).map((f) => f.label);
}

function isFuture(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date > todayKey();
}

export function EventSection({
  entry,
  patch,
  heading,
  programme,
  onProgramme,
  onPickOtherProgramme,
}: {
  entry: EcmObjectifDetail;
  patch: (fields: Partial<EcmObjectifDetail>) => void;
  /** « Quelle compétition ? » pour la priorité Compétition, « Quel événement ? » sinon. */
  heading: string;
  programme?: string;
  onProgramme?: (label: string) => void;
  onPickOtherProgramme?: () => void;
}) {
  const [tab, setTab] = useState<EventFamilyId>(entry.event ? familyOf(entry.event) : "course");
  const [dateError, setDateError] = useState<string | null>(null);
  const family = EVENT_FAMILIES.find((f) => f.id === tab) ?? EVENT_FAMILIES[0];
  const event = entry.event;

  function choose(sport: string) {
    // Un seul sport coché à la fois ; changer de sport efface la fiche du précédent.
    if (sport === event) return;
    setDateError(null);
    patch({ sousCat: sport === "Autre" ? "Autre" : sport, event: sport, dateExacte: "", categorie: "", priorite: "", fiche: {} });
  }

  function setField(f: FicheField, value: string) {
    if (f.key === "date") {
      if (value && !isFuture(value)) {
        setDateError("La date doit être dans le futur.");
        return;
      }
      setDateError(null);
      // Jour de saisie : sert à raccourcir le plan si la date est proche.
      patch({ dateExacte: value, fiche: { ...(entry.fiche ?? {}), _saisie: todayKey(), _approx: "" } });
      return;
    }
    if (f.key === "niveau") return patch({ priorite: value });
    if (f.key === "categorie") return patch({ categorie: value });
    const fiche = { ...(entry.fiche ?? {}), [f.key]: value };
    // CrossFit : la date de l'étape est préremplie depuis le calendrier (modifiable).
    if (event === "CrossFit Games" && f.key === "etape") {
      const d = crossfitStageDate(value, todayKey());
      patch({ fiche: { ...fiche, _saisie: d ? todayKey() : (entry.fiche?._saisie ?? "") }, dateExacte: d ?? entry.dateExacte ?? "" });
      return;
    }
    patch({ fiche });
  }

  const plan =
    event && entry.dateExacte
      ? planFor({
          event,
          dateExacte: entry.dateExacte,
          todayKey: todayKey(),
          fiche: entry.fiche,
          niveau: entry.priorite,
          savedKey: entry.fiche?._saisie,
        })
      : null;

  const mapping = event ? SPORT_PROGRAM[event] : null;
  const programName = mapping?.program ?? null;
  const programLabel = programName ? Object.keys(SPORT_LABEL_TO_SLUG).find((l) => l.endsWith(programName)) ?? null : null;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <span className={styles.heading}>{heading}</span>
      <div className={styles.tabs} role="tablist">
        {EVENT_FAMILIES.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={tab === f.id}
            className={tab === f.id ? styles.tabOn : styles.tab}
            onClick={() => setTab(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className={styles.list}>
        {family.sports.map((s) => (
          <div key={s} className={event === s ? styles.rowOn : styles.row} onClick={() => choose(s)} role="radio" aria-checked={event === s}>
            <span className={styles.rowIcon}>{EVENT_ICONS[s] ?? "•"}</span>
            <span className={styles.rowName}>{s}</span>
            <span className={event === s ? styles.radioOn : styles.radio} />
          </div>
        ))}
      </div>

      {event && (
        <div className={styles.fiche}>
          <div className={styles.familyTag}>{FAMILY_LABEL[familyOf(event)]}</div>
          <div className={styles.sportName}>{sportTitle(event)}</div>
          {(FICHE_FIELDS[event] ?? []).map((f) => (
            <div key={f.key} className={styles.field}>
              <div className={styles.fieldLabel}>{f.label}</div>
              {f.kind === "date" && (
                <>
                  <div className={styles.dateRow}>
                    <input
                      type="date"
                      className={styles.dateInput}
                      min={todayKey()}
                      value={entry.dateExacte ?? ""}
                      onChange={(e) => setField(f, e.target.value)}
                    />
                    {plan && <span className={styles.remaining}>{weeksLeftLabel(plan.daysToEvent)}</span>}
                  </div>
                  {dateError && <div className={styles.error}>{dateError}</div>}
                  {entry.fiche?._approx === "1" && !dateError && (
                    <div className={styles.note}>Date approximative d&apos;après ton ancienne réponse : confirme-la.</div>
                  )}
                  {event === "CrossFit Games" && !entry.dateExacte && entry.fiche?.etape && (
                    <div className={styles.note}>Dates de la prochaine saison pas encore annoncées : saisis la date de l&apos;étape.</div>
                  )}
                </>
              )}
              {f.kind === "text" && (
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder={f.placeholder}
                  value={ficheValue(entry, f.key)}
                  onChange={(e) => setField(f, e.target.value)}
                />
              )}
              {f.kind === "number" && (
                <div className={styles.numRow}>
                  <input
                    type="number"
                    inputMode="decimal"
                    className={styles.textInput}
                    value={ficheValue(entry, f.key)}
                    onChange={(e) => setField(f, e.target.value)}
                  />
                  {f.unit && <span className={styles.unit}>{f.unit}</span>}
                </div>
              )}
              {f.kind === "choice" && f.options && f.options.length > 8 && (
                <select className={styles.textInput} value={ficheValue(entry, f.key)} onChange={(e) => setField(f, e.target.value)}>
                  <option value="">Choisir…</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {f.kind === "choice" && f.options && f.options.length <= 8 && (
                <div className={styles.pills}>
                  {f.options.map((o) => (
                    <button
                      key={o}
                      type="button"
                      className={ficheValue(entry, f.key) === o ? styles.pillOn : styles.pill}
                      onClick={() => setField(f, o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
              {f.kind === "yesno" && (
                <div className={styles.pills}>
                  {["oui", "non"].map((o) => (
                    <button
                      key={o}
                      type="button"
                      className={ficheValue(entry, f.key) === o ? styles.pillOn : styles.pill}
                      onClick={() => setField(f, o)}
                    >
                      {o === "oui" ? "Oui" : "Non"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {plan && (
            <>
              {plan.shortened && <div className={styles.shortNote}>Date proche : ton plan est raccourci.</div>}
              <PhasePath plan={plan} />
            </>
          )}

          {mapping && (
            <div className={styles.program}>
              {programName ? (
                <>
                  <div className={styles.programTitle}>
                    Programme conseillé : {programName}
                    {mapping.theme ? `, thème ${mapping.theme}` : ""}
                  </div>
                  {mapping.note && <div className={styles.note}>{mapping.note}</div>}
                  {mapping.competitionMode && (
                    <div className={styles.note}>
                      Mode compétition : les thèmes Force, Endurance, Capacité et Haltérophilie ne s&apos;appliquent plus pendant la préparation.
                    </div>
                  )}
                  <div className={styles.programActions}>
                    {programLabel && onProgramme && (
                      <button
                        type="button"
                        className={programme === programLabel ? styles.pillOn : styles.programBtn}
                        onClick={() => onProgramme(programLabel)}
                      >
                        {programme === programLabel ? "Programme actuel" : "Adopter ce programme"}
                      </button>
                    )}
                    {onPickOtherProgramme && (
                      <button type="button" className={styles.programBtnGhost} onClick={onPickOtherProgramme}>
                        Choisir un autre
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.programTitle}>Programme conseillé : aucun imposé</div>
                  {mapping.note && <div className={styles.note}>{mapping.note}</div>}
                  {onPickOtherProgramme && (
                    <div className={styles.programActions}>
                      <button type="button" className={styles.programBtnGhost} onClick={onPickOtherProgramme}>
                        Choisir un autre
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
