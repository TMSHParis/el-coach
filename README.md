# EL COACH

Marketplace de programmes d'entraînement signés par des coachs d'élite. Inspiration TrainHeroic, identité visuelle noir & blanc futuriste.

## Stack

- Next.js 16 (App Router, React 19)
- TypeScript + Tailwind v4
- Clerk (auth) — optionnel, l'app fonctionne sans
- Stripe Checkout (abonnement mensuel) — optionnel
- Lucide icons, Geist font

## Dev local

```bash
pnpm install
cp .env.example .env.local   # puis remplir les clés Clerk/Stripe
pnpm dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir `.env.example`. L'app détecte l'absence de clés :

- **Sans Clerk** : le dashboard passe en mode démo, Sign-in/Sign-up affichent un message.
- **Sans Stripe** : le bouton checkout retourne une erreur 503 claire.

## Structure

```
src/
├─ app/
│  ├─ page.tsx                    Landing
│  ├─ marketplace/                Liste programmes + filtres
│  ├─ coaches/                    Liste coachs
│  ├─ coach/[slug]/               Détail coach
│  ├─ program/[slug]/             Détail programme + checkout
│  ├─ dashboard/                  Dashboard athlète (protégé)
│  ├─ sign-in/ sign-up/           Pages Clerk
│  └─ api/
│     ├─ checkout/                POST — crée session Stripe
│     └─ webhook/stripe/          POST — met à jour publicMetadata
├─ components/                    nav, footer, program-card, coach-card
├─ lib/                           data (seed), stripe, clerk, utils
└─ middleware.ts                  protège /dashboard
```

## Déploiement Vercel

```bash
vercel link
vercel --prod
```

Ajouter ensuite les env vars via le dashboard Vercel ou `vercel env add`.

### Webhook Stripe

Dans Stripe Dashboard, créer un webhook sur `https://<domain>/api/webhook/stripe` avec l'event `checkout.session.completed` et récupérer le signing secret dans `STRIPE_WEBHOOK_SECRET`.

## Roadmap

- Persistance DB (Neon + Prisma) pour logs de séances
- Logger sets/reps/RPE dans le dashboard
- Graphes de progression (PR par exercice)
- Onboarding coach (dépôt de programme)
- Version mobile native (React Native / Expo)
