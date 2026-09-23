import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getUserId } from "@/lib/user-id";
import { blobEnabled } from "@/lib/blob";

export const runtime = "nodejs";

/** Les photos sont redimensionnées et compressées dans le navigateur avant l'envoi. */
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  if (!blobEnabled) {
    return NextResponse.json({ error: "Stockage photo pas encore configuré." }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format image non supporté." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo trop lourde (4 Mo max)." }, { status: 413 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  try {
    // addRandomSuffix : deux photos envoyées le même jour ne s'écrasent pas.
    const blob = await put(`sessions/${userId}/${Date.now()}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("session-photo: échec de l'envoi vers Blob:", err);
    return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
  }
}
