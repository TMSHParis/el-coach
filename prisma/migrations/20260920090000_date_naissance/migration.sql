-- Âge (Int) remplacé par une date de naissance : l'âge est désormais calculé à
-- la volée et se met à jour tout seul chaque année.
ALTER TABLE "profiles" ADD COLUMN "date_naissance" DATE;

-- Reprise des lignes existantes : on ne connaît que l'âge, donc on place la
-- naissance au 1er janvier de l'année correspondante (approximation assumée,
-- corrigeable par l'athlète dans /profile/edit).
UPDATE "profiles"
SET "date_naissance" = make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int - "age", 1, 1)
WHERE "age" > 0;

ALTER TABLE "profiles" DROP COLUMN "age";
