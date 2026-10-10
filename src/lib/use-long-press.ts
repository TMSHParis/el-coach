"use client";

import { useEffect, useRef } from "react";

/**
 * Tap = une seule incrémentation ; appui long maintenu = répétition continue
 * (doc H.10 — appliqué à tous les compteurs de temps de repos de l'app).
 * `onTap`/`onHold` sont lus via une ref à chaque tick pour toujours utiliser
 * la dernière valeur de l'état parent, pas une fermeture figée au moment du
 * premier appui.
 */
export function useLongPress(onTap: () => void, onHold: () => void, opts?: { delay?: number; interval?: number }) {
  const delay = opts?.delay ?? 400;
  const interval = opts?.interval ?? 150;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedHoldRef = useRef(false);
  const onTapRef = useRef(onTap);
  const onHoldRef = useRef(onHold);
  useEffect(() => {
    onTapRef.current = onTap;
    onHoldRef.current = onHold;
  }, [onTap, onHold]);

  const clear = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  };

  useEffect(() => clear, []);

  const start = () => {
    firedHoldRef.current = false;
    clear();
    timeoutRef.current = setTimeout(() => {
      firedHoldRef.current = true;
      onHoldRef.current();
      intervalRef.current = setInterval(() => onHoldRef.current(), interval);
    }, delay);
  };

  const stop = () => clear();

  const handleClick = () => {
    if (!firedHoldRef.current) onTapRef.current();
    firedHoldRef.current = false;
  };

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onClick: handleClick,
  };
}
