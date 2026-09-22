-- Compte rendu de séance : note en étoiles et meilleure série du jour.
ALTER TABLE "sessions" ADD COLUMN "session_rating" INTEGER;
ALTER TABLE "sessions" ADD COLUMN "best_result" JSONB;
