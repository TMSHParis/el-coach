import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { enUS, esES, frFR } from "@clerk/localizations";
import { clerkEnabled } from "@/lib/clerk";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ChromeGate } from "@/components/chrome-gate";
import { NavigationTracker } from "@/components/back-home-button";
import { SupportChat } from "@/components/support-chat";
import { ScrollTopButton } from "@/components/scroll-top-button";
import { LangProvider } from "@/lib/i18n/provider";
import { getPrefs } from "@/lib/prefs-server";
import { PrefsSync } from "@/components/prefs-sync";
import { getT } from "@/lib/i18n/server";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import "./theme-palette.css";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    // PWA : sur iPhone, les notifications web ne fonctionnent que si l'app est ajoutée à l'écran d'accueil.
    manifest: "/manifest.webmanifest",
    icons: { apple: "/icons/apple-touch-icon.png" },
    appleWebApp: { capable: true, title: "EL COACH", statusBarStyle: "black-translucent" },
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

// Clerk dans la langue de l'app, avec les libellés ECM de la page /signin (français).
const clerkFr = {
  ...frFR,
  formButtonPrimary: "Se connecter",
  signIn: {
    ...frFR.signIn,
    start: { ...frFR.signIn?.start, title: "", subtitle: "", actionText: "Pas encore inscrit ?", actionLink: "Je m'inscris" },
  },
};
const clerkLocalizations = { fr: clerkFr, en: enUS, es: esES };

const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ?? "";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, theme, fromProfile } = await getPrefs();
  const shell = (
    <html lang={lang} data-theme={theme} className={`${geistSans.variable} ${geistMono.variable} ${ecmFontVariables}`}>
      <body className="min-h-screen antialiased">
        <LangProvider initial={lang}>
        {fromProfile && <PrefsSync lang={lang} theme={theme} />}
        <NavigationTracker />
        <ChromeGate>
          <Nav />
        </ChromeGate>
        <main className="min-h-[70vh]">{children}</main>
        <ChromeGate>
          <Footer />
        </ChromeGate>
        {/* Tchat de support : abonnés connectés seulement, et rien tant que
            l'ID Crisp n'est pas renseigné. */}
        {clerkEnabled && crispWebsiteId && <SupportChat websiteId={crispWebsiteId} />}
        <ScrollTopButton />
        </LangProvider>
      </body>
    </html>
  );
  if (!clerkEnabled) return shell;
  return <ClerkProvider localization={clerkLocalizations[lang]}>{shell}</ClerkProvider>;
}
