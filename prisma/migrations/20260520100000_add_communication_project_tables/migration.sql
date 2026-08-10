-- Communication module tables (baseline for shadow DB / fresh environments).
-- Uses IF NOT EXISTS so this is safe when tables already exist in production.

DO $$ BEGIN
    CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CommunicationProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "diagnosticContext" TEXT,
    "diagnosticTarget" TEXT,
    "diagnosticEnvironment" TEXT,
    "diagnosticForces" TEXT,
    "objectives" TEXT,
    "strategyPositioning" TEXT,
    "strategyTargets" TEXT,
    "strategyChannels" TEXT,
    "actionPlan" TEXT,
    "actionSupports" TEXT,
    "actionCalendar" TEXT,
    "actionBudget" TEXT,
    "implementationContent" TEXT,
    "implementationLaunch" TEXT,
    "implementationTeams" TEXT,
    "evaluationMetrics" TEXT,
    "evaluationComparison" TEXT,
    "evaluationAdjustments" TEXT,
    "projectStatus" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "CommunicationProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunicationPlanAction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CommunicationPlanAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunicationProjectActor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationProjectActor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunicationPlanActionActor" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationPlanActionActor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunicationBudgetItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationBudgetItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CommunicationPlanAction_projectId_idx" ON "CommunicationPlanAction"("projectId");
CREATE INDEX IF NOT EXISTS "CommunicationProjectActor_projectId_idx" ON "CommunicationProjectActor"("projectId");
CREATE INDEX IF NOT EXISTS "CommunicationPlanActionActor_actionId_idx" ON "CommunicationPlanActionActor"("actionId");
CREATE INDEX IF NOT EXISTS "CommunicationPlanActionActor_actorId_idx" ON "CommunicationPlanActionActor"("actorId");
CREATE INDEX IF NOT EXISTS "CommunicationBudgetItem_projectId_idx" ON "CommunicationBudgetItem"("projectId");

CREATE UNIQUE INDEX IF NOT EXISTS "CommunicationPlanActionActor_actionId_actorId_key" ON "CommunicationPlanActionActor"("actionId", "actorId");

DO $$ BEGIN
    ALTER TABLE "CommunicationProject" ADD CONSTRAINT "CommunicationProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "CommunicationPlanAction" ADD CONSTRAINT "CommunicationPlanAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CommunicationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "CommunicationProjectActor" ADD CONSTRAINT "CommunicationProjectActor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CommunicationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "CommunicationPlanActionActor" ADD CONSTRAINT "CommunicationPlanActionActor_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CommunicationPlanAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "CommunicationPlanActionActor" ADD CONSTRAINT "CommunicationPlanActionActor_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "CommunicationProjectActor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "CommunicationBudgetItem" ADD CONSTRAINT "CommunicationBudgetItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CommunicationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
