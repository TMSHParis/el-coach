import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ChromeGate } from "@/components/chrome-gate";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EL COACH METHOD — Ton Coaching Adaptatif personnel",
  description:
    "Un check-in chaque matin. Un plan sur mesure chaque jour. Séance adaptée, stack compléments, récupération ciblée — tout généré en moins de 5 secondes. 5 programmes en base : CrossFit Pure, Hybrid Engine, Hyrox Pure, Volume Block Hypertrophy, At Home.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shell = (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <ChromeGate>
          <Nav />
        </ChromeGate>
        <main className="min-h-[70vh]">{children}</main>
        <ChromeGate>
          <Footer />
        </ChromeGate>
      </body>
    </html>
  );
  if (!clerkEnabled) return shell;
  return <ClerkProvider>{shell}</ClerkProvider>;
}
