"use client";

import { useRef, useState } from "react";
import { MAX_SESSION_PHOTOS } from "@/lib/session-media";
import type { HistoriqueSession, PhotoExtraction } from "@/app/api/extract-photo-data/route";

/** Côté le plus long après redimensionnement — assez pour un écran de montre. */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.78;

/**
 * Redimensionne et recompresse la photo dans le navigateur avant l'envoi : une
 * photo d'iPhone fait 3 à 5 Mo, on la ramène à quelques centaines de Ko.
 */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  return blob ?? file;
}

/** Contexte transmis à l'analyse pour que le retour narratif compare à l'historique de l'athlète. */
export type PhotoAnalysisContext = {
  sport?: string;
  prenom?: string | null;
  poidsJour?: string | null;
  sessionFeeling?: string | null;
  historiqueRecent?: HistoriqueSession[];
};

/**
 * Analyse complète de la photo (Claude vision) : calories, durée, BPM et un
 * retour narratif comparé à l'historique. Silencieuse : si rien n'est lisible
 * ou si l'appel échoue, la saisie manuelle prend le relais.
 */
async function analyzePhoto(
  photoUrl: string,
  context: PhotoAnalysisContext | undefined,
  onExtracted: (result: PhotoExtraction) => void,
): Promise<void> {
  try {
    const res = await fetch("/api/extract-photo-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl, ...context }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as PhotoExtraction;
    if (typeof data.calories === "number" || data.retourNarratif) onExtracted(data);
  } catch {
    // Lecture automatique indisponible — le champ reste à remplir à la main.
  }
}

/**
 * Ajout de 1 à 2 photos de séance, envoyées sur Vercel Blob. `onChange` reçoit
 * la liste d'URLs à chaque ajout/suppression — c'est à l'appelant de la
 * persister (Server Action).
 */
export function SessionPhotos({
  photos,
  onChange,
  onExtracted,
  analysisContext,
  accent = "#E8FF00",
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  /** Résultat de l'analyse Claude de la photo — appelé seulement si une donnée exploitable est trouvée. */
  onExtracted?: (result: PhotoExtraction) => void;
  /** Contexte (sport, prénom, poids, ressenti, historique) transmis pour le retour narratif. */
  analysisContext?: PhotoAnalysisContext;
  accent?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de réessayer la même photo après une erreur
    if (!file || photos.length >= MAX_SESSION_PHOTOS) return;

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", new File([await compress(file)], "seance.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/session-photo", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Envoi impossible.");
        return;
      }
      onChange([...photos, data.url]);
      if (onExtracted) void analyzePhoto(data.url, analysisContext, onExtracted);
    } catch {
      setError("Envoi impossible — vérifie ta connexion.");
    } finally {
      setBusy(false);
    }
  }

  const full = photos.length >= MAX_SESSION_PHOTOS;

  return (
    <div>
      {photos.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          {photos.map((url) => (
            <div key={url} style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Photo de séance"
                style={{ width: 104, height: 104, objectFit: "cover", borderRadius: 6, display: "block" }}
              />
              <button
                type="button"
                aria-label="Supprimer la photo"
                onClick={() => onChange(photos.filter((p) => p !== url))}
                style={{
                  position: "absolute",
                  top: -7,
                  right: -7,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "none",
                  background: "#E05252",
                  color: "#fff",
                  fontSize: 15,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      <button
        type="button"
        disabled={busy || full}
        onClick={() => inputRef.current?.click()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          border: `1px solid ${full ? "#2a2a2a" : accent}`,
          borderRadius: 6,
          background: "none",
          padding: "10px 16px",
          color: full ? "#555" : accent,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 1,
          cursor: busy || full ? "default" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {busy ? "Envoi…" : full ? `📷 ${MAX_SESSION_PHOTOS} photos (maximum)` : "📷 Ajouter une photo"}
      </button>
      {!full && (
        <span style={{ marginLeft: 10, fontSize: 11, color: "#555" }}>
          {photos.length}/{MAX_SESSION_PHOTOS}
        </span>
      )}
      {error && <div style={{ marginTop: 8, fontSize: 12, color: "#E05252" }}>{error}</div>}
    </div>
  );
}
