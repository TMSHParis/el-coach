// Habillage ECM des composants Clerk (<SignIn />, <UserProfile />) via
// l'Appearance API — noir #080808, champs #1a1a1a / bordure #444 / focus
// jaune, bouton principal jaune Bebas Neue, aucun branding Clerk visible.
// Le pied de carte Clerk ("Secured by Clerk", "Development mode", lien
// d'inscription en anglais) est masqué : les liens utiles (inscription, mot de
// passe oublié) sont rendus par nos pages, en français.

const ACCENT = "var(--c-e8ff00)";

export const clerkEcmAppearance = {
  variables: {
    colorPrimary: ACCENT,
    colorBackground: "var(--c-080808)",
    colorText: "var(--c-f0ede8)",
    colorTextSecondary: "var(--c-8a8a8a)",
    colorInputBackground: "var(--c-1a1a1a)",
    colorInputText: "var(--c-ffffff)",
    colorNeutral: "var(--c-f0ede8)",
    // Noms actuels de l'UI Clerk (chargée depuis leur CDN) — les anciens
    // ci-dessus restent pour les versions qui les lisent encore.
    colorForeground: "var(--c-f0ede8)",
    colorMutedForeground: "var(--c-8a8a8a)",
    colorInput: "var(--c-1a1a1a)",
    colorInputForeground: "var(--c-ffffff)",
    borderRadius: "4px",
    fontFamily: "var(--font-barlow, sans-serif)",
  },
  elements: {
    rootBox: { width: "100%", maxWidth: 420 },
    cardBox: { width: "100%", boxShadow: "none", border: "none" },
    card: { background: "var(--c-080808)", border: "none", boxShadow: "none", width: "100%" },
    formFieldLabel: { color: "var(--c-8a8a8a)" },
    formFieldInput: {
      background: "var(--c-1a1a1a)",
      border: "1px solid var(--c-444444)",
      color: "var(--c-ffffff)",
      fontSize: "16px",
      padding: "14px 16px",
      borderRadius: "4px",
      "&:focus": { borderColor: ACCENT, boxShadow: "none" },
      "&::placeholder": { color: "var(--c-888888)" },
    },
    formButtonPrimary: {
      background: ACCENT,
      color: "var(--on-accent)",
      fontFamily: "var(--font-bebas, sans-serif)",
      fontSize: "1.1rem",
      letterSpacing: "3px",
      borderRadius: "4px",
      textTransform: "uppercase" as const,
      boxShadow: "none",
      "&:hover": { background: ACCENT, opacity: 0.9 },
    },
    footer: { display: "none" },
    // <UserProfile /> : "Secured by Clerk" / "Development mode" sont dans la navbar.
    footerItem: { display: "none" },
    navbar: { background: "var(--c-0d0d0d)", borderColor: "var(--c-222222)" },
    scrollBox: { background: "var(--c-080808)" },
    profileSectionTitleText: { color: "var(--c-f0ede8)" },
    headerTitle: { color: "var(--c-f0ede8)", fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "1px" },
  },
};

/** <SignIn /> : en-tête Clerk ("Sign in to …") et connexion Google masqués — aucun compte Google existant. */
export const clerkSignInAppearance = {
  ...clerkEcmAppearance,
  elements: {
    ...clerkEcmAppearance.elements,
    header: { display: "none" },
    headerTitle: { display: "none" },
    headerSubtitle: { display: "none" },
    socialButtons: { display: "none" },
    socialButtonsBlockButton: { display: "none" },
    dividerRow: { display: "none" },
  },
};
