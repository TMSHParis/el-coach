// Habillage ECM des composants Clerk (<SignIn />, <UserProfile />) via
// l'Appearance API — noir #080808, champs #1a1a1a / bordure #444 / focus
// jaune, bouton principal jaune Bebas Neue, aucun branding Clerk visible.
// Le pied de carte Clerk ("Secured by Clerk", "Development mode", lien
// d'inscription en anglais) est masqué : les liens utiles (inscription, mot de
// passe oublié) sont rendus par nos pages, en français.

const ACCENT = "#E8FF00";

export const clerkEcmAppearance = {
  variables: {
    colorPrimary: ACCENT,
    colorBackground: "#080808",
    colorText: "#f0ede8",
    colorTextSecondary: "#8a8a8a",
    colorInputBackground: "#1a1a1a",
    colorInputText: "#ffffff",
    colorNeutral: "#f0ede8",
    // Noms actuels de l'UI Clerk (chargée depuis leur CDN) — les anciens
    // ci-dessus restent pour les versions qui les lisent encore.
    colorForeground: "#f0ede8",
    colorMutedForeground: "#8a8a8a",
    colorInput: "#1a1a1a",
    colorInputForeground: "#ffffff",
    borderRadius: "4px",
    fontFamily: "var(--font-barlow, sans-serif)",
  },
  elements: {
    rootBox: { width: "100%", maxWidth: 420 },
    cardBox: { width: "100%", boxShadow: "none", border: "none" },
    card: { background: "#080808", border: "none", boxShadow: "none", width: "100%" },
    formFieldLabel: { color: "#8a8a8a" },
    formFieldInput: {
      background: "#1a1a1a",
      border: "1px solid #444",
      color: "#ffffff",
      fontSize: "16px",
      padding: "14px 16px",
      borderRadius: "4px",
      "&:focus": { borderColor: ACCENT, boxShadow: "none" },
      "&::placeholder": { color: "#888" },
    },
    formButtonPrimary: {
      background: ACCENT,
      color: "#000000",
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
    navbar: { background: "#0d0d0d", borderColor: "#222" },
    scrollBox: { background: "#080808" },
    profileSectionTitleText: { color: "#f0ede8" },
    headerTitle: { color: "#f0ede8", fontFamily: "var(--font-bebas, sans-serif)", letterSpacing: "1px" },
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
