-- Partie 5 : thème, fuseau, réglages de notifications, abonnements push, journal d'envoi.
ALTER TABLE "profiles" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE "profiles" ADD COLUMN "timezone" TEXT;
ALTER TABLE "profiles" ADD COLUMN "notif_recap_time" TEXT DEFAULT '19:00';
ALTER TABLE "profiles" ADD COLUMN "notif_checkin_time_prev" TEXT;
ALTER TABLE "profiles" ADD COLUMN "notif_checkin_time_from" TEXT;
ALTER TABLE "profiles" ALTER COLUMN "notif_checkin_time" SET DEFAULT '07:00';

CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_logs_user_id_kind_key_key" ON "notification_logs"("user_id", "kind", "key");
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
