-- CreateTable
CREATE TABLE "extra_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "seance" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "completion_rate" DOUBLE PRECISION,
    "duration_sec" INTEGER,
    "session_feeling" TEXT,
    "session_note" TEXT,
    "calories_brulees" INTEGER,
    "calories_source" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "best_result" JSONB,
    "photo_analysis" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extra_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extra_activities_user_id_date_idx" ON "extra_activities"("user_id", "date");

-- AddForeignKey
ALTER TABLE "extra_activities" ADD CONSTRAINT "extra_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
