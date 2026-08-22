import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js charge .env.local automatiquement, mais le CLI Prisma non — on le
// charge explicitement ici (le CLI ne lit que .env par défaut).
loadEnv({ path: ".env.local" });

// Migrate/CLI utilisent la connexion directe (non poolée) — recommandé par Neon
// pour les opérations de schema. Le PrismaClient runtime (src/lib/prisma.ts)
// utilise lui la connexion poolée via l'adapter Neon.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
