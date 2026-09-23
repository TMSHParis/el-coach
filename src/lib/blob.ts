/** Stockage des photos de séance (Vercel Blob) configuré ?
 *  En local : BLOB_READ_WRITE_TOKEN. Sur Vercel : OIDC + BLOB_STORE_ID.
 *  Sans lui, le bouton "Ajouter une photo" reste masqué plutôt que d'échouer. */
export const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
