-- CreateTable

CREATE TABLE "CommunicationPlanActionTask" (

    "id" TEXT NOT NULL,

    "actionId" TEXT NOT NULL,

    "title" TEXT NOT NULL,

    "startDate" TIMESTAMP(3) NOT NULL,

    "endDate" TIMESTAMP(3) NOT NULL,

    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "updatedAt" TIMESTAMP(3) NOT NULL,



    CONSTRAINT "CommunicationPlanActionTask_pkey" PRIMARY KEY ("id")

);



-- CreateIndex

CREATE INDEX "CommunicationPlanActionTask_actionId_idx" ON "CommunicationPlanActionTask"("actionId");



-- AddForeignKey

ALTER TABLE "CommunicationPlanActionTask" ADD CONSTRAINT "CommunicationPlanActionTask_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CommunicationPlanAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

