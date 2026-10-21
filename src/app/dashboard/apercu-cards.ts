import type { DisplayBlock } from "@/lib/session-format";

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
