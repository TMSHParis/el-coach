-- Onboarding, réglages & préférences (page /settings).
ALTER TABLE "profiles" ADD COLUMN "onboarding_done" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN "records_rm" JSONB;
ALTER TABLE "profiles" ADD COLUMN "notif_checkin_on" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "profiles" ADD COLUMN "notif_checkin_time" TEXT DEFAULT '07:30';
ALTER TABLE "profiles" ADD COLUMN "notif_seance" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "profiles" ADD COLUMN "notif_blessure" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "profiles" ADD COLUMN "notif_recap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN "langue" TEXT NOT NULL DEFAULT 'fr';

-- Personnalisation facultative de la séance du jour (check-in).
ALTER TABLE "checkins" ADD COLUMN "seance_focus" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "checkins" ADD COLUMN "seance_duree" TEXT;
ALTER TABLE "checkins" ADD COLUMN "seance_equipement" TEXT;
ALTER TABLE "checkins" ADD COLUMN "seance_intensite" TEXT;
ALTER TABLE "checkins" ADD COLUMN "seance_note" TEXT;
