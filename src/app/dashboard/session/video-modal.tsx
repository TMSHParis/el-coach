"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { youtubeEmbedSrc } from "@/lib/movements";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  searchQuery: string;
  videoUrl?: string;
};

export function VideoModal({ open, onClose, title, searchQuery, videoUrl }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  const src = open ? youtubeEmbedSrc({ videoUrl, searchQuery, autoplay: true }) : "";

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
          {open && (
            <iframe
              src={src}
              title={`Démo · ${title}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
        </div>
      </div>
    </dialog>
  );
}
