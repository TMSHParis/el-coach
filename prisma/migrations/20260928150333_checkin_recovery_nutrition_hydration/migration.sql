-- AlterTable
ALTER TABLE "checkins" ADD COLUMN     "hydratation" TEXT,
ADD COLUMN     "nutrition" TEXT,
ADD COLUMN     "recuperation_percue" TEXT,
ALTER COLUMN "seance_focus" DROP DEFAULT;
