-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "taille" INTEGER NOT NULL,
    "poids" DOUBLE PRECISION NOT NULL,
    "objectif" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "sport_principal" TEXT NOT NULL,
    "sport_secondaire" TEXT,
    "jours_s1" TEXT[],
    "heure_s1" TEXT NOT NULL,
    "duree_s1" TEXT NOT NULL,
    "niveau_s1" TEXT NOT NULL,
    "jours_s2" TEXT[],
    "heure_s2" TEXT,
    "duree_s2" TEXT,
    "niveau_s2" TEXT,
    "equipement" TEXT NOT NULL,
    "jeune" BOOLEAN NOT NULL,
    "type_jeune" TEXT,
    "debut_fenetre" TEXT,
    "fin_fenetre" TEXT,
    "restrictions" TEXT[],
    "hydratation" TEXT NOT NULL,
    "blessures" BOOLEAN NOT NULL,
    "blessures_detail" TEXT,
    "complements" TEXT[],
    "complements_autres" TEXT,
    "qualite_sommeil" TEXT NOT NULL,
    "duree_sommeil" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "energie" INTEGER,
    "motivation" INTEGER,
    "mental" TEXT,
    "stress" TEXT,
    "libido" TEXT,
    "jambes" TEXT,
    "douleur" BOOLEAN,
    "douleur_detail" TEXT,
    "sleep_photo" BOOLEAN NOT NULL DEFAULT false,
    "sleep_coucher" TEXT,
    "sleep_reveil" TEXT,
    "sleep_duree" TEXT,
    "sleep_fc" TEXT,
    "sleep_hrv" TEXT,
    "sleep_recup" TEXT,
    "poids" TEXT,
    "seance" TEXT,
    "travail" BOOLEAN,
    "soir_performance" BOOLEAN,
    "cycle" BOOLEAN,
    "cycle_douleur" TEXT,
    "cycle_jour" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_outputs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "output" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "variant" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkins_user_id_date_key" ON "checkins"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_outputs_user_id_date_key" ON "dashboard_outputs"("user_id", "date");

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_outputs" ADD CONSTRAINT "dashboard_outputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
