-- Origine des calories : saisie à la main ou lue automatiquement sur la photo
-- de la montre par Claude (vision).
ALTER TABLE "sessions" ADD COLUMN "calories_source" TEXT;
UPDATE "sessions" SET "calories_source" = 'manuel' WHERE "calories_brulees" IS NOT NULL;
