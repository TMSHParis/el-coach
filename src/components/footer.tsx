import Link from "next/link";

export function Footer() {
  return (
    <footer className="hairline-t mt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-16 md:grid-cols-4">
        <div className="col-span-2">
          <div className="mono text-lg font-semibold tracking-[0.3em]">EL COACH</div>
          <p className="mt-4 max-w-sm text-sm text-[color:var(--color-mute)]">
            Programmes conçus par un coach d&apos;élite.
            <br />
            CrossFit Pure, Hybrid Engine, Hyrox, At Home, Volume Block Hypertrophy.
            <br />
            Pas de promesses, des méthodes.
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
          <span>© {new Date().getFullYear()} EL COACH</span>
          <span className="pulse-dot">SYSTEM ONLINE</span>
        </div>
      </div>
    </footer>
  );
}
