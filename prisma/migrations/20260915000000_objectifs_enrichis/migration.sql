-- Objectifs enrichis (sous-catégorie/deadline/priorité, ou événement pour
-- "Je prépare mon corps à..."). Additif, nullable — les colonnes objectif_1/
-- objectif_2 existantes restent inchangées pour compatibilité.
ALTER TABLE "profiles" ADD COLUMN "objectif_1_type" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_1_sous_cat" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_1_deadline" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_1_priorite" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_1_event" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_2_type" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_2_sous_cat" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_2_deadline" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_2_priorite" TEXT;
ALTER TABLE "profiles" ADD COLUMN "objectif_2_event" TEXT;
