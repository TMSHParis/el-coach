import Link from "next/link";

/**
 * Bouton "← Accueil" — utilisé sur les pages "bare" (sans Nav du site :
 * /checkin, /dashboard) qui ont leur propre topbar. Styles en `var(--bd)` /
 * `var(--m)` : ces custom properties sont définies par le module CSS de la
 * page hôte (checkin.module.css / dashboard.module.css) et héritent
 * normalement jusqu'ici, peu importe le module qui les déclare.
 */
export function BackHomeButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <Link
      href="/"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "none",
        border: "1px solid var(--bd)",
        borderRadius: 4,
        padding: "8px 12px",
        color: "var(--m)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 1,
        textDecoration: "none",
        ...style,
      }}
    >
      ← Accueil
    </Link>
  );
}
