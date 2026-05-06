// Logo principal EL COACH METHOD.
// Marque géométrique : trois barres horizontales en « E » stylisé,
// la barre supérieure en dégradé jaune électrique (couleur signature) ;
// point central = anchor du M.

type LogoProps = {
  size?: number;
  className?: string;
  /** Si true, anime la barre signature (subtil pulse) — sinon statique. */
  animate?: boolean;
};

export function Logo({ size = 32, className, animate = false }: LogoProps) {
  const id = "ec-method-accent";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4ff7a" />
          <stop offset="50%" stopColor="#e8ff00" />
          <stop offset="100%" stopColor="#b8cc00" />
        </linearGradient>
      </defs>
      {/* Barre supérieure jaune électrique — la signature */}
      <rect x="3" y="5" width="26" height="3.5" fill={`url(#${id})`}>
        {animate && (
          <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />
        )}
      </rect>
      {/* Barre milieu — courte (« E ») */}
      <rect x="3" y="14.25" width="17" height="3.5" fill="currentColor" />
      {/* Anchor — point méthode central */}
      <rect x="22" y="14.25" width="3.5" height="3.5" fill={`url(#${id})`} />
      {/* Barre basse */}
      <rect x="3" y="23.5" width="26" height="3.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Mark monogramme cadré — usage favicon, badge, mobile.
 */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="ec-mark-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4ff7a" />
          <stop offset="50%" stopColor="#e8ff00" />
          <stop offset="100%" stopColor="#b8cc00" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="6" y="7" width="20" height="2.5" fill="url(#ec-mark-accent)" />
      <rect x="6" y="14.75" width="13" height="2.5" fill="currentColor" />
      <rect x="6" y="22.5" width="20" height="2.5" fill="currentColor" />
    </svg>
  );
}
