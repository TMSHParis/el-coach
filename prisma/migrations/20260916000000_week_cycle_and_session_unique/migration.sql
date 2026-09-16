-- Semaine type enrichie (multi-jours, multi-créneaux) — additif.
ALTER TABLE "profiles" ADD COLUMN "week_cycle" JSONB;

-- Dépréciation (pas suppression) des anciennes colonnes sport_secondaire/
-- jours_s1/heure_s1/duree_s1/niveau_s1/jours_s2 — l'app ne les écrit plus,
-- elles deviennent optionnelles pour ne pas bloquer les futurs inserts.
ALTER TABLE "profiles" ALTER COLUMN "heure_s1" DROP NOT NULL;
ALTER TABLE "profiles" ALTER COLUMN "duree_s1" DROP NOT NULL;
ALTER TABLE "profiles" ALTER COLUMN "niveau_s1" DROP NOT NULL;
ALTER TABLE "profiles" ALTER COLUMN "jours_s1" SET DEFAULT '{}';
ALTER TABLE "profiles" ALTER COLUMN "jours_s2" SET DEFAULT '{}';

-- Permet un upsert propre des résultats de séance (un enregistrement par
-- utilisateur et par jour) au lieu de doublons à chaque "Terminer".
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_date_key" UNIQUE ("user_id", "date");
