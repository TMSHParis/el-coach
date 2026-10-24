/** Un texte = [français, English, Español]. Les trois langues sont obligatoires pour chaque clé. */
export type Entry = readonly [string, string, string];
export type Entries = Record<string, Entry>;
