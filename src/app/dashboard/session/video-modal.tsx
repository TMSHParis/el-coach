"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Video as VideoIcon, X } from "lucide-react";
import { extractYoutubeId } from "@/lib/movements";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  searchQuery: string;
  videoUrl?: string;
};

export function VideoModal({ open, onClose, title, searchQuery, videoUrl }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const directId = useMemo(() => extractYoutubeId(videoUrl), [videoUrl]);
  const [searchedId, setSearchedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Synchronise l'état du <dialog> avec la prop `open`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Recherche YouTube uniquement quand pas d'URL directe.
  useEffect(() => {
    if (!open || directId) return;

    let cancelled = false;
    startTransition(() => {
      setLoading(true);
      setSearchedId(null);
    });

    fetch(`/api/movement-video?q=${encodeURIComponent(searchQuery)}`)
      .then((r) => r.json() as Promise<{ videoId: string | null }>)
      .then((data) => {
        if (cancelled) return;
        setSearchedId(data.videoId);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSearchedId(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, directId, searchQuery]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  const resolvedId = directId ?? searchedId;
  const embedSrc = resolvedId
    ? `https://www.youtube-nocookie.com/embed/${resolvedId}?rel=0&modestbranding=1&autoplay=1`
    : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-full max-w-3xl bg-transparent p-0 backdrop:bg-black/85"
    >
      <div className="card relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--color-line)] p-4">
          <div className="min-w-0">
            <div className="label">VIDÉO DÉMO</div>
            <h3 className="mt-1 truncate text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-[color:var(--color-mute)] hover:text-white"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative aspect-video w-full bg-black">
          {open && loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 size={28} className="animate-spin text-[color:var(--color-mute)]" />
              <div className="label">RECHERCHE EN COURS</div>
            </div>
          )}
          {open && !loading && embedSrc && (
            <iframe
              src={embedSrc}
              title={`Démo · ${title}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          {open && !loading && !embedSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <VideoIcon size={36} className="text-[color:var(--color-mute)]" />
              <div className="label">VIDÉO INDISPONIBLE</div>
              <p className="max-w-sm text-sm text-[color:var(--color-mute)]">
                Aucun résultat pour <span className="text-white">{title}</span>.
                Configure <span className="mono">YOUTUBE_API_KEY</span> pour activer
                la recherche YouTube intégrée.
              </p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
