// Fusion des dictionnaires par domaine. Chaque domaine vit dans son propre fichier (dict/<domaine>.ts)
// et exporte un objet { clé: [fr, en, es] }. Les clés d'un domaine commencent par son préfixe
// (core: nav./tomorrow./settings. · session: run. · sessionPages: sp. · checkin: ci. · dashboard: dash.
// · signup: su. · app: app. · legacy: lg. · server: srv.) pour qu'aucune clé ne soit écrasée.
import { core } from "./core";
import { session } from "./session";
import { sessionPages } from "./sessionPages";
import { checkin } from "./checkin";
import { dashboard } from "./dashboard";
import { signup } from "./signup";
import { app } from "./app";
import { legacy } from "./legacy";
import { server } from "./server";
import { notif } from "./notif";
import { settings } from "./settings";
import { library } from "./library";

export const DICT = {
  ...core,
  ...session,
  ...sessionPages,
  ...checkin,
  ...dashboard,
  ...signup,
  ...app,
  ...legacy,
  ...server,
  ...notif,
  ...settings,
  ...library,
} as const;

export type DictKey = keyof typeof DICT;
