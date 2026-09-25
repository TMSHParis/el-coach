-- Analyse Claude de la photo de séance (calories/durée/BPM détectés + retour
-- narratif comparé à l'historique) — remplace l'extraction "calories only".
ALTER TABLE "sessions" ADD COLUMN "photo_analysis" JSONB;
