ALTER TABLE "push_subscriptions" ADD COLUMN "device" TEXT, ADD COLUMN "last_used_at" TIMESTAMP(3);
ALTER TABLE "notification_logs" ADD COLUMN "day" TEXT NOT NULL DEFAULT '', ADD COLUMN "result" TEXT NOT NULL DEFAULT 'ok', ADD COLUMN "detail" TEXT, ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 1;
UPDATE "notification_logs" SET "day" = to_char("sent_at", 'YYYY-MM-DD') WHERE "day" = '';
CREATE INDEX "notification_logs_user_id_day_idx" ON "notification_logs"("user_id", "day");
CREATE TABLE "session_starts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_starts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "session_starts_user_id_started_at_idx" ON "session_starts"("user_id", "started_at");
ALTER TABLE "session_starts" ADD CONSTRAINT "session_starts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
