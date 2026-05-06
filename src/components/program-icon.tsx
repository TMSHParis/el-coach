// Icônes par programme EL COACH METHOD.
// Style : géométrique, mono, avec accent jaune électrique (la « method »).
// Chaque icône a son symbole dédié — toutes partagent le même langage visuel
// (carré 32×32, traits 1.5–2.5px, accent jaune sur le détail signature).

import type { ProgramTemplate } from "@/lib/programming";

type IconProps = { size?: number; className?: string };

export function CrossFitPureIcon({ size = 32, className }: IconProps) {
  // Anneaux croisés — gymnastique + barre.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cf-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4ff7a" />
          <stop offset="100%" stopColor="#b8cc00" />
        </linearGradient>
      </defs>
      <line x1="3" y1="16" x2="29" y2="16" stroke="url(#cf-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="6" cy="16" r="3" fill="currentColor" />
      <circle cx="26" cy="16" r="3" fill="currentColor" />
      <circle cx="13" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="19" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M14 22 L17 22 L15.5 26 L18 26 L14.5 30 L15 26 L13 26 Z" fill="url(#cf-accent)" />
    </svg>
  );
}

export function HybridEngineIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hy-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4ff7a" />
          <stop offset="100%" stopColor="#b8cc00" />
        </linearGradient>
      </defs>
      <path d="M5 5 L16 16 M16 16 L11 16 M16 16 L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 27 L16 16 M16 16 L11 16 M16 16 L16 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="16" x2="29" y2="16" stroke="url(#hy-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 13 L29 16 L27 19" stroke="url(#hy-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function HyroxPureIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hx-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4ff7a" />
          <stop offset="100%" stopColor="#b8cc00" />
        </linearGradient>
      </defs>
      <line x1="3" y1="9" x2="26" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="19" x2="26" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="26" y1="6" x2="26" y2="27" stroke="url(#hx-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="26" y="5" width="4" height="3" fill="url(#hx-accent)" />
    </svg>
  );
}

export function VolumeBlockIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="vb-accent" x1="0%" y1="0%" x2="100%" y2="1">
          <stop offset="0%" stopColor="#f4ff7a" />
          <stop offset="100%" stopColor="#b8cc00" />
        </linearGradient>
      </defs>
      <rect x="4" y="22" width="24" height="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="7" y="15" width="18" height="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="10" y="8" width="12" height="5" fill="url(#vb-accent)" />
      <path d="M16 6 L13 4 M16 6 L19 4" stroke="url(#vb-accent)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AtHomeIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ah-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4ff7a" />
          <stop offset="100%" stopColor="#b8cc00" />
        </linearGradient>
      </defs>
      <path d="M4 14 L16 4 L28 14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <path d="M7 13 L7 27 L25 27 L25 13" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <line x1="11" y1="20" x2="21" y2="20" stroke="url(#ah-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="9" y="17.5" width="2.5" height="5" fill="url(#ah-accent)" />
      <rect x="20.5" y="17.5" width="2.5" height="5" fill="url(#ah-accent)" />
    </svg>
  );
}

export function ProgramIcon({ template, size = 32, className }: { template: ProgramTemplate; size?: number; className?: string }) {
  switch (template.discipline) {
    case "crossfit":
      return <CrossFitPureIcon size={size} className={className} />;
    case "hybrid":
      return <HybridEngineIcon size={size} className={className} />;
    case "hyrox":
      return <HyroxPureIcon size={size} className={className} />;
    case "hypertrophy":
      return <VolumeBlockIcon size={size} className={className} />;
    case "home":
      return <AtHomeIcon size={size} className={className} />;
  }
}
