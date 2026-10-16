"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { DisplayBlock } from "@/lib/session-format";
import styles from "./dashboard.module.css";
import { VideoModal } from "./session/video-modal";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Modèle unique d'aperçu (doc H.13 Mission C) — remplace les anciens aperçus
 * (cadre bleu/orange de SessionPanel, en-tête "Lecture seule" dupliquée) par
 * la mise en page de l'écran de séance en cours : en-tête "←" + titre unique,
 * pastille "APERÇU", résumé, cartes numérotées en or, pied de page.
 * Les contenus (textes, mouvements, durées, liens vidéo) sont repris tels
 * quels — seule la mise en page change.
 */
export function ApercuPanel({
  onClose,
  programTitle,
  /** "EL COACH METHOD" (programme ECM, récupération) ou "HORS PROGRAMME" (sport hors ECM). */
  subtitle,
  summaryIcon,
  summaryTitle,
  summaryLine,
  /** Masquée pour un repos (pas de durée affichée). */
  durationLabel,
  children,
}: {
  onClose: () => void;
  programTitle: string;
  subtitle: string;
  summaryIcon: string;
  summaryTitle: string;
  summaryLine: string;
  durationLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.apercuPanel}>
      <div className={styles.apercuHeader}>
        <button type="button" className={styles.apercuBackBtn} onClick={onClose} aria-label="Fermer l'aperçu">
          ←
        </button>
        <div className={styles.apercuHeaderInfo}>
          <div className={styles.apercuHeaderTitle}>{programTitle}</div>
          <div className={styles.apercuHeaderSub}>{subtitle}</div>
        </div>
        <div className={styles.apercuBadge}>APERÇU</div>
      </div>

      <div className={styles.apercuSummary}>
        <div className={styles.apercuSummaryIcon}>{summaryIcon}</div>
        <div>
          <div className={styles.apercuSummaryTitle}>{summaryTitle}</div>
          <div className={styles.apercuSummaryLine}>{summaryLine}</div>
        </div>
      </div>

      {children}

      <div className={styles.apercuFooter}>
        {durationLabel ? (
          <div>
            <div className={styles.apercuFooterDurLabel}>Durée estimée</div>
            <div className={styles.apercuFooterDur}>{durationLabel}</div>
          </div>
        ) : (
          <div />
        )}
        <button type="button" className={styles.apercuCloseBtn} onClick={onClose}>
          FERMER
        </button>
      </div>
    </div>
  );
}

/** Transforme les blocs existants (programme ECM, récupération, sport hors
 * ECM) en cartes de l'aperçu unifié — contenus repris tels quels (doc H.13
 * Mission C). Un bloc conseil écrit en un seul item sans vidéo ni quantité
 * (prévention à un point, mindset) s'affiche en paragraphe plutôt qu'en
 * ligne de mouvement. */
export function blocksToApercuCards(blocks: DisplayBlock[], idPrefix = ""): ApercuCardData[] {
  return blocks.map((b) => {
    const soleNote =
      b.items.length === 1 && b.items[0].noVideo && !b.items[0].qty ? b.items[0].name : undefined;
    return {
      id: `${idPrefix}${b.lettre}`,
      number: b.lettre,
      title: b.titre,
      label: b.badge,
      items: soleNote ? undefined : b.items,
      note: soleNote ?? b.note,
    };
  });
}

export type ApercuCardData = {
  id: string;
  /** Numéro affiché dans le cercle or (ex. "1", "B2"). */
  number: string;
  title: string;
  /** Étiquette discrète en gris sous le titre — format du bloc, FACULTATIF, CONSEILS, MENTAL... */
  label?: string;
  /** Mouvements à lister, avec bouton vidéo (▶️, lien inchangé). */
  items?: DisplayBlock["items"];
  /** Paragraphe libre (mindset, conseils) quand il n'y a pas de mouvements. */
  note?: string;
};

/** Cartes numérotées en accordéon — la première dépliée (doc H.13 Mission C). */
export function ApercuCards({ cards }: { cards: ApercuCardData[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(cards[0] ? [cards[0].id] : []));
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      {cards.map((card) => {
        const open = openIds.has(card.id);
        return (
          <div key={card.id} className={styles.apercuCard}>
            <div
              className={styles.apercuCardHead}
              onClick={() => toggle(card.id)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.apercuCardNum}>{card.number}</div>
              <div className={styles.apercuCardInfo}>
                <div className={styles.apercuCardTitle}>{card.title}</div>
                {card.label && <div className={styles.apercuCardLabel}>{card.label}</div>}
              </div>
              <div className={cx(styles.apercuChevron, open && styles.apercuChevronOpen)}>▾</div>
            </div>
            {open && (
              <div className={styles.apercuCardBody}>
                {card.items?.map((it, j) => (
                  <ApercuMovementRow
                    key={`${it.movementName}-${j}`}
                    name={it.name}
                    qty={it.qty}
                    detail={it.detail}
                    movementName={it.movementName}
                    videoUrl={it.videoUrl}
                    noVideo={it.noVideo}
                  />
                ))}
                {card.note && <div className={styles.apercuNote}>{card.note}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Ligne de mouvement de l'aperçu — hauteur minimale identique pour toutes les
 * lignes, bouton vidéo carré neutre (fond gris, icône or). Même lien/modal
 * vidéo que partout ailleurs — seul le style du bouton change. */
function ApercuMovementRow({
  name,
  qty,
  detail,
  movementName,
  videoUrl,
  noVideo,
}: {
  name: string;
  qty: string;
  detail?: string;
  movementName: string;
  videoUrl?: string;
  noVideo?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.apercuItem}>
      <div className={styles.apercuItemInfo}>
        <div className={styles.apercuItemName}>{name}</div>
        {detail && <div className={styles.apercuItemDetail}>{detail}</div>}
      </div>
      {qty && <div className={styles.apercuItemQty}>{qty}</div>}
      {!noVideo && (
        <>
          <button
            type="button"
            className={styles.apercuVideoBtn}
            onClick={() => setOpen(true)}
            aria-label={`Vidéo ${movementName}`}
          >
            ▶️
          </button>
          <VideoModal open={open} onClose={() => setOpen(false)} title={movementName} searchQuery={movementName} videoUrl={videoUrl} />
        </>
      )}
    </div>
  );
}
