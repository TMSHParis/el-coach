-- Résumé de fin de séance : part des mouvements cochés et durée totale.
ALTER TABLE "sessions" ADD COLUMN "completion_rate" DOUBLE PRECISION;
ALTER TABLE "sessions" ADD COLUMN "duration_sec" INTEGER;
