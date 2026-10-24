"use client";

// Carte « Activité du jour » (partie 4, mission 1). Trois situations :
// A = séance ECM terminée, B = autre activité terminée, C = jour de repos sans activité.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./activity-card.module.css";
import { useT } from "@/lib/i18n/provider";

export type ActivityCardData = {
  situation: "A" | "B" | "C";
  /** « Ven. 23 oct. » */
  dateLabel: string;
  durationSec?: number;
  icon?: string;
  name?: string;
  detail?: string;
  /** Pourcentage de la séance réalisée — situation A seulement. */
  percent?: number;
  /** Énergie du check-in sur 10, ou null. */
  energy?: number | null;
  feeling?: { emoji: string; label: string } | null;
  coachMessage?: string | null;
  detailHref: string;
  /** Page de fin d'activité : pastille « Mental … » à la place du ressenti, anneau de 60 px, ni coach ni actions. */
  recap?: { mental: string | null };
};

const STATUS_KEY = { A: "dash.act.statusA", B: "dash.act.statusB", C: "dash.act.statusC" } as const;

/** « 1H59 » dès une heure ; sinon « 41 » + « MIN ». */
function Duration({ sec }: { sec: number }) {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h > 0) return <>{`${h}H${String(m).padStart(2, "0")}`}</>;
  return (
    <>
      {Math.max(1, m)}
      <span className={styles.bigUnit}>MIN</span>
    </>
  );
}

function Ring({ percent, size = 56 }: { percent: number; size?: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg viewBox="0 0 56 56" width={size} height={size} aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--c-2a2e35)" strokeWidth="5" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--accent, var(--c-e8ff00))"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, percent / 100)))}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className={styles.ringText}>{percent}%</div>
    </div>
  );
}

/** Message du coach limité à 2 lignes ; « Lire la suite » seulement s'il dépasse. */
function CoachMessage({ text }: { text: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // Mesuré seulement quand le texte est replié : la hauteur utile dépasse alors la hauteur affichée.
      if (!el.classList.contains(styles.clamp)) return;
      setOverflow(el.scrollHeight > el.clientHeight + 1);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div className={styles.coachBody}>
      <div className={styles.coachName}>{t("dash.act.coach")}</div>
      <p ref={ref} className={`${styles.coachText} ${open ? "" : styles.clamp}`}>
        {text}
      </p>
      {(overflow || open) && (
        <button type="button" className={styles.more} onClick={() => setOpen((v) => !v)}>
          {open ? t("dash.act.less") : t("dash.act.more")}
        </button>
      )}
    </div>
  );
}

export function ActivityCard({ data, showPlus }: { data: ActivityCardData; showPlus: boolean }) {
  const t = useT();
  const { situation: s } = data;
  return (
    <div className={`${styles.card} ${styles[s]}`}>
      <div className={styles.statusRow}>
        <span className={styles.status}>
          <span className={styles.dot} />
          {t(STATUS_KEY[s])}
        </span>
        <span className={styles.date}>{data.dateLabel}</span>
      </div>

      {s === "C" ? (
        <>
          <div className={styles.restRow}>
            <div className={styles.restIcon}>🛏️</div>
            <div>
              <div className={styles.restTitle}>{t("dash.act.restDay")}</div>
              <div className={styles.restSub}>{t("dash.act.restSub")}</div>
            </div>
          </div>
          <div className={styles.sep} />
          <p className={styles.restText}>
            {t("dash.act.restText")}
          </p>
        </>
      ) : (
        <>
          <div className={styles.main}>
            <div className={styles.big}>
              <Duration sec={data.durationSec ?? 0} />
            </div>
            <div className={styles.act}>
              <div className={styles.actName}>
                {data.icon} {data.name}
              </div>
              {data.detail && <div className={styles.actDetail}>{data.detail}</div>}
            </div>
          </div>
          <div className={styles.sep} />
          <div className={styles.stats}>
            {s === "A" && typeof data.percent === "number" && <Ring percent={data.percent} size={data.recap ? 60 : 56} />}
            {typeof data.energy === "number" && (
              <div className={styles.energy}>
                <span className={styles.energyLabel}>{t("dash.act.energy")}</span>
                <div className={styles.bars}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} className={`${styles.bar} ${i < (data.energy ?? 0) ? styles.barOn : ""}`} />
                  ))}
                </div>
                <span className={styles.energyVal}>{t("dash.act.energyVal", { n: data.energy })}</span>
              </div>
            )}
            {data.recap?.mental && (
              <span className={styles.feeling}>
                <span className={styles.feelingLabel}>{data.recap.mental}</span>
              </span>
            )}
            {!data.recap && data.feeling && (
              <span className={styles.feeling}>
                <span className={styles.feelingEmoji}>{data.feeling.emoji}</span>
                <span className={styles.feelingLabel}>{data.feeling.label}</span>
              </span>
            )}
          </div>
          {!data.recap && data.coachMessage && (
            <>
              <div className={styles.sep} />
              <div className={styles.coach}>
                <div className={styles.ec}>EC</div>
                <CoachMessage text={data.coachMessage} />
              </div>
            </>
          )}
        </>
      )}

      {!data.recap && (
      <div className={styles.actions}>
        <Link href={data.detailHref} className={s === "C" ? styles.primaryGhost : styles.primary}>
          {s === "C" ? t("dash.act.seeRecovery") : t("dash.act.seeDetail")}
        </Link>
        {showPlus && (
          <Link href="/session/add" className={styles.plus} aria-label={t("dash.act.addAria")}>
            ＋
          </Link>
        )}
      </div>
      )}
    </div>
  );
}

export function ActivitySectionTitle() {
  const t = useT();
  return <h2 className={styles.sectionTitle}>{t("dash.act.sectionTitle")}</h2>;
}

export function AddActivityLink() {
  const t = useT();
  return (
    <Link href="/session/add" className={styles.addLink}>
      {t("dash.act.addLink")}
    </Link>
  );
}
