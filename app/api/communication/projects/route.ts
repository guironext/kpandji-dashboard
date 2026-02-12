import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getCommunicationProjectModel() {
  return (prisma as Record<string, unknown>).communicationProject as
    | {
        create: (args: object) => Promise<unknown>;
      }
    | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      createdById,
      diagnosticContext,
      diagnosticTarget,
      diagnosticEnvironment,
      diagnosticForces,
      objectives,
      strategyPositioning,
      strategyTargets,
      strategyChannels,
      actionPlan,
      actionSupports,
      actionCalendar,
      actionBudget,
      implementationContent,
      implementationLaunch,
      implementationTeams,
      evaluationMetrics,
      evaluationComparison,
      evaluationAdjustments,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom du projet est obligatoire." },
        { status: 400 }
      );
    }

    const model = getCommunicationProjectModel();
    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Modèle Communication non disponible. Exécutez « npx prisma generate » puis « npx prisma migrate dev ».",
        },
        { status: 503 }
      );
    }

    const raw = await model.create({
      data: {
        name: name.trim(),
        createdById: createdById ?? undefined,
        diagnosticContext: diagnosticContext ?? undefined,
        diagnosticTarget: diagnosticTarget ?? undefined,
        diagnosticEnvironment: diagnosticEnvironment ?? undefined,
        diagnosticForces: diagnosticForces ?? undefined,
        objectives: objectives ?? undefined,
        strategyPositioning: strategyPositioning ?? undefined,
        strategyTargets: strategyTargets ?? undefined,
        strategyChannels: strategyChannels ?? undefined,
        actionPlan: actionPlan ?? undefined,
        actionSupports: actionSupports ?? undefined,
        actionCalendar: actionCalendar ?? undefined,
        actionBudget: actionBudget ?? undefined,
        implementationContent: implementationContent ?? undefined,
        implementationLaunch: implementationLaunch ?? undefined,
        implementationTeams: implementationTeams ?? undefined,
        evaluationMetrics: evaluationMetrics ?? undefined,
        evaluationComparison: evaluationComparison ?? undefined,
        evaluationAdjustments: evaluationAdjustments ?? undefined,
      },
    });

    try {
      revalidatePath("/communication/projets");
      revalidatePath("/communication");
    } catch {
      // ignore
    }

    const row = raw as {
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
      createdBy?: { firstName: string; lastName: string } | null;
    };
    const project = {
      id: row.id,
      name: row.name,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      createdBy: row.createdBy ?? null,
    };

    return NextResponse.json({ success: true, project });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/communication/projects error:", error);
    return NextResponse.json(
      { success: false, error: message || "Erreur lors de la création du projet" },
      { status: 500 }
    );
  }
}
