-- Partie 3 : détails d'objectifs (axes, fiche événement) et alternance de semaines A/B (additif).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "objectif_1_details" JSONB;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "objectif_2_details" JSONB;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "week_alternance" JSONB;
