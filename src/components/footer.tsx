import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="hairline-t mt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-16 md:grid-cols-4">
        <div className="col-span-2">
          <div className="flex items-center gap-3 text-white">
            <Logo size={32} />
            <div className="mono text-lg font-semibold tracking-[0.25em]">
              EL COACH <span className="text-[color:var(--color-gold)]">METHOD</span>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-[color:var(--color-mute)]">
            Pas une app de programmes. Ton Coaching Adaptatif quotidien.
            <br />
            <span className="mono text-xs tracking-[0.2em] text-white">
              EL COACH METHOD · by El Coach
            </span>
          </p>
        </div>
        <div>
          <div className="label mb-4">Plateforme</div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/marketplace">Marketplace</Link>
            </li>
            <li>
              <Link href="/coaches">Coachs</Link>
            </li>
            <li>
              <Link href="/dashboard">Dashboard</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="label mb-4">Entreprise</div>
          <ul className="space-y-2 text-sm text-[color:var(--color-mute)]">
            <li>À propos</li>
            <li>
              <Link href="/coach/apply" className="hover:text-white">Devenir coach</Link>
            </li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="hairline-t">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-[color:var(--color-mute)] mono">
          <span>© {new Date().getFullYear()} EL COACH METHOD</span>
          <span className="pulse-dot">SYSTEM ONLINE</span>
        </div>
      </div>
    </footer>
  );
}
