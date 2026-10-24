"use client";

// Menu « Choisir ta séance… » (partie 4, mission 6) : feuille du bas avec six groupes toujours présents,
// quel que soit le jour, la semaine enregistrée, les habitudes ou l'équipement.

import { SPORT_GROUPS, normalizeSport, sportLabel } from "@/lib/sports-catalog";
import type { Lang, Translate } from "@/lib/i18n";
import { useLang, useT } from "@/lib/i18n/provider";
import { splitIconLabel } from "@/lib/standard-week";
import styles from "./checkin.module.css";

type Item = { value: string; icon: string; name: string; sub: string };
type Group = { label: string; items: Item[] };

function sportItem(value: string, t: Translate, lang: Lang): Item {
  const { icon, label } = splitIconLabel(sportLabel(value, lang));
  return { value, icon, name: label, sub: t("ci.plan.offEcm") };
}

export function buildPickerGroups(
  programs: { value: string; icon: string; name: string; next: string }[],
  t: Translate,
  lang: Lang,
): Group[] {
  return [
    {
      label: sportLabel("🛋️ REPOS", lang),
      items: [
        { value: "__repos__", icon: "😴", name: t("ci.picker.restFull"), sub: t("ci.picker.restFullSub") },
        { value: "__recup__", icon: "🚶", name: t("ci.picker.recup"), sub: t("ci.picker.recupSub") },
      ],
    },
    {
      label: sportLabel("⚡ PROGRAMMATIONS ECM", lang),
      items: programs.map((p) => ({ value: p.value, icon: p.icon, name: p.name, sub: p.next || t("ci.plan.nextInSeries") })),
    },
    ...SPORT_GROUPS.map((g) => ({ label: sportLabel(g.label, lang), items: g.options.map((o) => sportItem(o, t, lang)) })),
  ];
}

/** Ligne affichée dans le champ « Séance du jour » pour la valeur courante. */
export function currentItem(groups: Group[], value: string, accordion: "repos" | "recup" | null, t: Translate, lang: Lang): Item | null {
  if (accordion) return groups[0].items[accordion === "repos" ? 0 : 1];
  const v = normalizeSport(value);
  for (const g of groups) for (const it of g.items) if (it.value === v) return it;
  return v ? sportItem(v, t, lang) : null;
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
  const t = useT();
  const { lang } = useLang();
  const current = currentItem(groups, value, accordion, t, lang);
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
          <span className={styles.pickerPlaceholder}>{t("ci.picker.title")}</span>
        )}
        <span className={styles.pickerChev}>▾</span>
      </button>

      {open && (
        <div data-hide-scroll-top className={styles.pickerOverlay} onClick={() => onOpenChange(false)}>
          <div className={styles.pickerSheet} role="dialog" aria-label={t("ci.picker.title")} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pickerTitle}>{t("ci.picker.title")}</div>
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
                    {plannedValue === it.value && <span className={styles.progBadge}>{t("ci.plan.planned")}</span>}
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
