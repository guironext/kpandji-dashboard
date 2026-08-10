DO $$ BEGIN
    CREATE TYPE "PlanActionTaskStage" AS ENUM ('DEBUT', 'EN_COURS', 'EN_ATTENTE_VALIDATION');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CommunicationPlanActionTask" ADD COLUMN IF NOT EXISTS "stage" "PlanActionTaskStage" NOT NULL DEFAULT 'DEBUT';
