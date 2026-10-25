-- CreateTable
CREATE TABLE "lib_movements" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "type" TEXT NOT NULL,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "video_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'importe_a_completer',
    "app_movement_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lib_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lib_combos" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "movement_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lib_combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lib_wods" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "subgroup" TEXT,
    "source" TEXT NOT NULL,
    "format" TEXT,
    "scheme" TEXT,
    "time_cap" TEXT,
    "raw_title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lib_wods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lib_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "format" TEXT,
    "scheme" TEXT,
    "raw_title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lib_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lib_lines" (
    "id" TEXT NOT NULL,
    "wod_id" TEXT,
    "template_id" TEXT,
    "position" INTEGER NOT NULL,
    "part" TEXT,
    "part_format" TEXT,
    "kind" TEXT NOT NULL,
    "quantity" TEXT,
    "slot" TEXT,
    "note" TEXT,
    "raw" TEXT NOT NULL,
    "movement_id" TEXT,
    "combo_id" TEXT,
    "alt_movement_id" TEXT,

    CONSTRAINT "lib_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lib_import_runs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report" JSONB NOT NULL,

    CONSTRAINT "lib_import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lib_movements_key_key" ON "lib_movements"("key");

-- CreateIndex
CREATE UNIQUE INDEX "lib_combos_key_key" ON "lib_combos"("key");

-- CreateIndex
CREATE UNIQUE INDEX "lib_wods_key_key" ON "lib_wods"("key");

-- CreateIndex
CREATE UNIQUE INDEX "lib_templates_key_key" ON "lib_templates"("key");

-- CreateIndex
CREATE INDEX "lib_lines_wod_id_position_idx" ON "lib_lines"("wod_id", "position");

-- CreateIndex
CREATE INDEX "lib_lines_template_id_position_idx" ON "lib_lines"("template_id", "position");

-- AddForeignKey
ALTER TABLE "lib_lines" ADD CONSTRAINT "lib_lines_wod_id_fkey" FOREIGN KEY ("wod_id") REFERENCES "lib_wods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lib_lines" ADD CONSTRAINT "lib_lines_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "lib_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lib_lines" ADD CONSTRAINT "lib_lines_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "lib_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lib_lines" ADD CONSTRAINT "lib_lines_alt_movement_id_fkey" FOREIGN KEY ("alt_movement_id") REFERENCES "lib_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lib_lines" ADD CONSTRAINT "lib_lines_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "lib_combos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

