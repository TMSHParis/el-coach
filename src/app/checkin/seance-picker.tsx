"use client";

// Menu « Choisir ta séance… » (partie 4, mission 6) : feuille du bas avec six groupes toujours présents,
// quel que soit le jour, la semaine enregistrée, les habitudes ou l'équipement.

import { SPORT_GROUPS, normalizeSport } from "@/lib/sports-catalog";
import { splitIconLabel } from "@/lib/standard-week";
import styles from "./checkin.module.css";

type Item = { value: string; icon: string; name: string; sub: string };
type Group = { label: string; items: Item[] };

function sportItem(value: string): Item {
  const { icon, label } = splitIconLabel(value);
  return { value, icon, name: label, sub: "Séance hors ECM" };
}

export function buildPickerGroups(programs: { value: string; icon: string; name: string; next: string }[]): Group[] {
  return [
    {
      label: "🛋️ REPOS",
      items: [
        { value: "__repos__", icon: "😴", name: "Repos complet", sub: "Journée sans entraînement" },
        { value: "__recup__", icon: "🚶", name: "Récupération active", sub: "Marche, mobilité, étirements" },
      ],
    },
    {
      label: "⚡ PROGRAMMATIONS ECM",
      items: programs.map((p) => ({ value: p.value, icon: p.icon, name: p.name, sub: p.next || "Séance suivante de la suite" })),
    },
    ...SPORT_GROUPS.map((g) => ({ label: g.label, items: g.options.map(sportItem) })),
  ];
}

/** Ligne affichée dans le champ « Séance du jour » pour la valeur courante. */
export function currentItem(groups: Group[], value: string, accordion: "repos" | "recup" | null): Item | null {
  if (accordion) return groups[0].items[accordion === "repos" ? 0 : 1];
  const v = normalizeSport(value);
  for (const g of groups) for (const it of g.items) if (it.value === v) return it;
  return v ? sportItem(v) : null;
}

export function SeancePicker({
  groups,
  value,
  accordion,
  plannedValue,
  open,
  onOpenChange,
  onPick,
}: {
  groups: Group[];
  value: string;
  accordion: "repos" | "recup" | null;
  /** Valeur prévue aujourd'hui (pastille « PRÉVU ») : programme, sport ou « __repos__ ». */
  plannedValue?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (value: string) => void;
}) {
  const current = currentItem(groups, value, accordion);
  const selected = accordion ? (accordion === "repos" ? "__repos__" : "__recup__") : normalizeSport(value);

  return (
    <>
      <button type="button" className={styles.pickerField} onClick={() => onOpenChange(true)} aria-haspopup="dialog">
        {current ? (
          <>
            <span className={styles.progIcon}>{current.icon}</span>
            <span className={styles.progText}>
              <span className={styles.progName}>{current.name}</span>
              <span className={styles.progNext}>{current.sub}</span>
            </span>
          </>
        ) : (
          <span className={styles.pickerPlaceholder}>Choisir ta séance…</span>
        )}
        <span className={styles.pickerChev}>▾</span>
      </button>

      {open && (
        <div className={styles.pickerOverlay} onClick={() => onOpenChange(false)}>
          <div className={styles.pickerSheet} role="dialog" aria-label="Choisir ta séance" onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerTitle}>Choisir ta séance…</div>
            {groups.map((g) => (
              <div key={g.label}>
                <div className={styles.pickerGroup}>{g.label}</div>
                {g.items.map((it) => (
                  <div
                    key={it.value}
                    role="radio"
                    aria-checked={selected === it.value}
                    tabIndex={0}
                    className={`${styles.progRow} ${selected === it.value ? styles.progRowOn : ""}`}
                    onClick={() => {
                      onPick(it.value);
                      onOpenChange(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        onPick(it.value);
                        onOpenChange(false);
                      }
                    }}
                  >
                    <span className={styles.progIcon}>{it.icon}</span>
                    <span className={styles.progText}>
                      <span className={styles.progName}>{it.name}</span>
                      <span className={styles.progNext}>{it.sub}</span>
                    </span>
                    {plannedValue === it.value && <span className={styles.progBadge}>PRÉVU</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
