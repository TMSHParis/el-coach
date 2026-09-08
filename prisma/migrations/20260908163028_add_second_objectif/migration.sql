-- Renomme objectif -> objectif_1 (préserve les données existantes) et ajoute objectif_2.
ALTER TABLE "profiles" RENAME COLUMN "objectif" TO "objectif_1";
ALTER TABLE "profiles" ADD COLUMN "objectif_2" TEXT;
