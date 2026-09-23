// Sons, voix et vibrations de la page /session.
//
// iPhone en mode silencieux ou écran verrouillé : de vrais fichiers audio
// (<audio>) plutôt que des sons synthétisés, plus un silence joué en boucle
// dès le démarrage de la séance. Ce silence garde la session audio iOS
// ouverte — sans lui, le système coupe l'audio dès que l'écran se verrouille.
// La MediaSession déclare la séance comme un média en cours de lecture, ce qui
// évite qu'iOS reprenne la main. C'est la technique des apps de chrono type
// Interval Timer / Seconds Pro.

export type SoundName = "tick" | "go" | "transition" | "end" | "work" | "rest" | "count" | "triple";

const FILES: Record<SoundName, string> = {
  tick: "/sounds/beep-tick.mp3",
  go: "/sounds/beep-go.mp3",
  transition: "/sounds/beep-transition.mp3",
  end: "/sounds/beep-end.mp3",
  work: "/sounds/beep-work.mp3",
  rest: "/sounds/beep-rest.mp3",
  count: "/sounds/beep-count.mp3",
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
  unlockSpeech();

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
/** Décompte 3 · 2 · 1 : aigu et court (880 Hz, 0,15 s) — "ça va partir". */
export const soundCount = () => play("count");
/** Les 3 bips de fin de chrono (300 Hz × 3). */
export const soundTriple = () => play("triple");
/** Tabata : début de phase travail (aigu) / repos (grave). */
export const soundWork = () => play("work");
export const soundRest = () => play("rest");

// --- Synthèse vocale ---------------------------------------------------
//
// Safari iOS ne laisse parler la synthèse que si une première énonciation a
// été lancée depuis un vrai geste utilisateur. Sans ce déblocage, toutes les
// annonces déclenchées par le chrono (qui n'est pas un geste) sont ignorées
// en silence : on entend les bips mais aucune voix. C'est pour ça que
// `unlockSpeech()` est appelé depuis `unlockAudio()`, lui-même appelé dans le
// handler du bouton "Démarrer".

let speechUnlocked = false;
let voices: SpeechSynthesisVoice[] = [];

function loadVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  voices = window.speechSynthesis.getVoices();
}

/** Meilleure voix disponible pour une langue — null si la liste est vide. */
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (voices.length === 0) loadVoices();
  const prefix = lang.slice(0, 2).toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

/**
 * À appeler depuis un handler de clic. Énonce un blanc inaudible : c'est ce
 * qui autorise iOS à parler ensuite depuis un timer.
 */
export function unlockSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  loadVoices();
  // La liste de voix arrive de façon asynchrone sur Chrome et Safari.
  window.speechSynthesis.onvoiceschanged = loadVoices;
  if (speechUnlocked) return;
  try {
    const primer = new SpeechSynthesisUtterance(" ");
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
    speechUnlocked = true;
  } catch {
    // Synthèse indisponible — les bips et vibrations restent.
  }
}

/** Annonce vocale — ignorée si le navigateur ne sait pas parler. */
export function speak(text: string, lang = "fr-FR"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const synth = window.speechSynthesis;
    // iOS laisse parfois la synthèse en pause après un passage en arrière-plan.
    if (synth.paused) synth.resume();
    // `cancel()` systématique tue l'énoncé qu'on vient d'ajouter sur iOS : on
    // ne coupe que s'il y a vraiment une annonce en cours à remplacer.
    if (synth.speaking || synth.pending) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.rate = 1.1;
    // Volume plein : la voix doit passer par-dessus la musique de l'athlète.
    utterance.volume = 1;
    synth.speak(utterance);
  } catch {
    // Synthèse vocale indisponible — les bips et vibrations suffisent.
  }
}

/** Annonces en anglais du cahier des charges ("Let's Go!", "Ten seconds!"...). */
export const speakEn = (text: string) => speak(text, "en-US");

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}
