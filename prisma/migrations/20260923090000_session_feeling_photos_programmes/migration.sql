-- Plusieurs programmes actifs en même temps (page /settings · "Choix de programme").
ALTER TABLE "profiles" ADD COLUMN "programmes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
-- Comptes existants : le programme unique devient le premier de la liste.
UPDATE "profiles" SET "programmes" = ARRAY["programme"] WHERE "programme" <> '';

-- Compte rendu de séance : ressenti (remplace les 5 étoiles), note libre,
-- calories relevées sur la montre et photos de séance (2 max).
ALTER TABLE "sessions" ADD COLUMN "session_feeling" TEXT;
ALTER TABLE "sessions" ADD COLUMN "session_note" TEXT;
ALTER TABLE "sessions" ADD COLUMN "calories_brulees" INTEGER;
ALTER TABLE "sessions" ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Les anciennes notes 1–5 se transposent sur l'échelle de ressenti.
UPDATE "sessions" SET "session_feeling" = CASE "session_rating"
  WHEN 1 THEN 'difficile'
  WHEN 2 THEN 'moyen'
  WHEN 3 THEN 'correct'
  WHEN 4 THEN 'bon'
  WHEN 5 THEN 'excellent'
END WHERE "session_rating" IS NOT NULL;

ALTER TABLE "sessions" DROP COLUMN "session_rating";
