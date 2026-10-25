import "server-only";
// Lecture de la bibliothèque de mouvements, WODs et séances modèles (partie 6, mission 2).
// Les tables lib_* sont alimentées par scripts/import-library.ts à partir de data/library/*.txt ; ce module
// ne fait que les lire. Les noms de mouvements, de WODs et de séances ne sont jamais traduits ; seuls les
// libellés de catégories et de types le sont (dict/library.ts).

import { prisma } from "./prisma";
import { DICT, type DictKey } from "./i18n/dict";
import type { Translate } from "./i18n";

/** Libellé d'une catégorie (clé = titre de la liste) dans la langue de l'utilisateur. */
export function categoryLabel(t: Translate, category: string): string {
  const key = `lib.cat.${category}`;
  return key in DICT ? t(key as DictKey) : category;
}

export function typeLabel(t: Translate, type: string): string {
  const key = `lib.type.${type}`;
  return key in DICT ? t(key as DictKey) : type;
}

export function listLibraryMovements(opts: { category?: string; type?: string } = {}) {
  return prisma.libMovement.findMany({
    where: { ...(opts.category ? { categories: { has: opts.category } } : {}), ...(opts.type ? { type: opts.type } : {}) },
    orderBy: { name: "asc" },
  });
}

export function getLibraryWod(name: string) {
  return prisma.libWod.findMany({
    where: { name: { equals: name, mode: "insensitive" } },
    include: { lines: { orderBy: { position: "asc" }, include: { movement: true, altMovement: true, combo: true } } },
  });
}

export function getLibraryTemplate(name: string) {
  return prisma.libTemplate.findMany({
    where: { name: { equals: name, mode: "insensitive" } },
    include: { lines: { orderBy: { position: "asc" }, include: { movement: true, altMovement: true, combo: true } } },
  });
}
