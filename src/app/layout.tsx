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
  title: "EL COACH METHOD — Coach IA personnel, plan du jour sur mesure",
  description:
    "Check-in matinal de 2 min. L'IA adapte ta séance, ton stack compléments et ton en-cas chaque jour selon ton énergie, ton sommeil et tes courbatures. 5 programmes en base : CrossFit Pure, Hybrid Engine, Hyrox Pure, Volume Block Hypertrophy, At Home.",
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
