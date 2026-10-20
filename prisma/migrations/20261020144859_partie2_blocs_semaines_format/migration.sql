-- AlterTable
ALTER TABLE "checkins" ADD COLUMN     "seance_format" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "objectif_1_categorie" TEXT,
ADD COLUMN     "objectif_1_date_exacte" TEXT,
ADD COLUMN     "objectif_2_categorie" TEXT,
ADD COLUMN     "objectif_2_date_exacte" TEXT;

-- CreateTable
CREATE TABLE "training_blocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'equilibre',
    "weeks" INTEGER NOT NULL DEFAULT 5,
    "start_date" TEXT NOT NULL,
    "weak_points" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "week_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TEXT NOT NULL,
    "cycle" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "week_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_positions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "program_slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chain_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_blocks_user_id_programme_active_idx" ON "training_blocks"("user_id", "programme", "active");

-- CreateIndex
CREATE UNIQUE INDEX "week_overrides_user_id_week_start_key" ON "week_overrides"("user_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "program_positions_user_id_program_slug_key" ON "program_positions"("user_id", "program_slug");

-- CreateIndex
CREATE UNIQUE INDEX "chain_progress_user_id_chain_key" ON "chain_progress"("user_id", "chain");

-- AddForeignKey
ALTER TABLE "training_blocks" ADD CONSTRAINT "training_blocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "week_overrides" ADD CONSTRAINT "week_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_positions" ADD CONSTRAINT "program_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chain_progress" ADD CONSTRAINT "chain_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
