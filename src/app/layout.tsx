import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/clerk";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EL COACH — Marketplace d'entraînement",
  description:
    "Programmes de coachs d'élite. Force, hybride, endurance, hypertrophie. Coaching sérieux sans bruit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shell = (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
  if (!clerkEnabled) return shell;
  return <ClerkProvider>{shell}</ClerkProvider>;
}
