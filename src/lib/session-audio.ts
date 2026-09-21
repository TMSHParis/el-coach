// Sons, voix et vibrations de la page /session.
//
// Web Audio (et pas un <audio> ni un son système) : sur iPhone, l'AudioContext
// continue de jouer même quand le téléphone est en mode silencieux. Le contexte
// est créé/repris au premier geste de l'athlète (bouton Démarrer), seul moment
// où les navigateurs mobiles autorisent le son.

let ctx: AudioContext | null = null;

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** À appeler dans un handler de clic — crée le contexte ou le réveille. */
export function ensureAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function beep(frequency: number, duration: number, delay = 0, volume = 0.25): void {
  const audio = ensureAudio();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

/** Son 1 — transition (changement de minute EMOM, changement de phase Tabata). */
export function soundTransition(): void {
  beep(660, 0.12);
}

/** Son 2 — GO après le compte à rebours : 3 bips montants rapides. */
export function soundStart(): void {
  beep(440, 0.1, 0);
  beep(660, 0.1, 0.12);
  beep(880, 0.22, 0.24);
}

/** Son 3 — fin de bloc (AMRAP, For Time, Tabata complet) : grave et long. */
export function soundEnd(): void {
  beep(220, 0.5, 0, 0.3);
}

/** Bip sec du compte à rebours (une fois par seconde). */
export function soundTick(): void {
  beep(880, 0.07, 0, 0.18);
}

/** Tabata : aigu au début du travail, grave au début du repos. */
export function soundWork(): void {
  beep(880, 0.15);
}

export function soundRest(): void {
  beep(330, 0.15);
}

/** Annonce vocale en français — ignorée si le navigateur ne sait pas parler. */
export function speak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Synthèse vocale indisponible — les bips et vibrations suffisent.
  }
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}
