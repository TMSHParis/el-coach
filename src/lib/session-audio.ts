// Sons, voix et vibrations de la page /session.
//
// iPhone en mode silencieux ou écran verrouillé : de vrais fichiers audio
// (<audio>) plutôt que des sons synthétisés, plus un silence joué en boucle
// dès le démarrage de la séance. Ce silence garde la session audio iOS
// ouverte — sans lui, le système coupe l'audio dès que l'écran se verrouille.
// La MediaSession déclare la séance comme un média en cours de lecture, ce qui
// évite qu'iOS reprenne la main. C'est la technique des apps de chrono type
// Interval Timer / Seconds Pro.

export type SoundName = "tick" | "go" | "transition" | "end" | "work" | "rest" | "strong" | "triple";

const FILES: Record<SoundName, string> = {
  tick: "/sounds/beep-tick.mp3",
  go: "/sounds/beep-go.mp3",
  transition: "/sounds/beep-transition.mp3",
  end: "/sounds/beep-end.mp3",
  work: "/sounds/beep-work.mp3",
  rest: "/sounds/beep-rest.mp3",
  strong: "/sounds/beep-strong.mp3",
  triple: "/sounds/beep-triple.mp3",
};

const VOLUME_KEY = "elc_session_volume";

let pool: Partial<Record<SoundName, HTMLAudioElement[]>> = {};
let silence: HTMLAudioElement | null = null;
let volume = 0.8;
let unlocked = false;

export function getVolume(): number {
  if (typeof window === "undefined") return volume;
  try {
    const saved = localStorage.getItem(VOLUME_KEY);
    if (saved !== null) volume = Math.min(1, Math.max(0, Number(saved)));
  } catch {
    // Stockage indisponible — volume par défaut.
  }
  return volume;
}

export function setVolume(value: number): void {
  volume = Math.min(1, Math.max(0, value));
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    // Sans persistance, le réglage vaut pour la séance en cours.
  }
  Object.values(pool).forEach((clips) => clips?.forEach((a) => (a.volume = volume)));
}

/**
 * À appeler dans un handler de clic (iOS n'autorise le son que là) : précharge
 * les sons, lance le silence en boucle et déclare la MediaSession.
 */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  getVolume();

  if (!unlocked) {
    pool = {};
    (Object.keys(FILES) as SoundName[]).forEach((name) => {
      // 3 exemplaires par son : deux bips rapprochés ne se coupent pas l'un l'autre.
      pool[name] = Array.from({ length: 3 }, () => {
        const audio = new Audio(FILES[name]);
        audio.preload = "auto";
        audio.volume = volume;
        return audio;
      });
    });
    unlocked = true;
  }

  if (!silence) {
    silence = new Audio("/sounds/silence.mp3");
    silence.loop = true;
    silence.volume = 0.001;
  }
  void silence.play().catch(() => {
    // Lecture refusée (pas de geste utilisateur) — réessayée au prochain clic.
  });

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "EL COACH METHOD",
        artist: "Séance en cours",
      });
      navigator.mediaSession.playbackState = "playing";
    } catch {
      // MediaSession indisponible — le silence en boucle suffit dans la plupart des cas.
    }
  }
}

/** Coupe le silence de fond (fin de séance ou sortie de la page). */
export function releaseAudio(): void {
  silence?.pause();
  if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
    try {
      navigator.mediaSession.playbackState = "none";
    } catch {
      // Sans importance.
    }
  }
}

function play(name: SoundName): void {
  const clips = pool[name];
  if (!clips) return;
  const clip = clips.find((a) => a.paused || a.ended) ?? clips[0];
  try {
    clip.currentTime = 0;
    clip.volume = volume;
    void clip.play().catch(() => {});
  } catch {
    // Lecture impossible — les vibrations et la voix restent.
  }
}

/** Bip sec du compte à rebours (3 dernières secondes, transitions courtes). */
export const soundTick = () => play("tick");
/** GO : 3 bips montants. */
export const soundStart = () => play("go");
/** Transition (changement de round/minute). */
export const soundTransition = () => play("transition");
/** Fin de bloc : grave et long. */
export const soundEnd = () => play("end");
/** Bip imposant (240 Hz + sub 120 Hz, 0,3 s) — compte à rebours 3 · 2 · 1. */
export const soundStrong = () => play("strong");
/** Les 3 bips imposants du départ et de la fin de chaque chrono. */
export const soundTriple = () => play("triple");
/** Tabata : début de phase travail (aigu) / repos (grave). */
export const soundWork = () => play("work");
export const soundRest = () => play("rest");

/** Annonce vocale — ignorée si le navigateur ne sait pas parler. */
export function speak(text: string, lang = "fr-FR"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.05;
    utterance.volume = Math.max(0.1, volume);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Synthèse vocale indisponible — les bips et vibrations suffisent.
  }
}

/** Annonces en anglais du cahier des charges ("Let's Go !", "Half Time !"...). */
export const speakEn = (text: string) => speak(text, "en-US");

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}
