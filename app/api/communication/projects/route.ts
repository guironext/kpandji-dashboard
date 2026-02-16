import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getCommunicationProjectModel() {
  return (prisma as unknown as Record<string, unknown>).communicationProject as
    | {
        create: (args: object) => Promise<unknown>;
        update: (args: object) => Promise<unknown>;
        delete: (args: object) => Promise<unknown>;
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...formData } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "ID du projet manquant." },
        { status: 400 }
      );
    }

    const { name } = formData;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom du projet est obligatoire." },
        { status: 400 }
      );
    }

    const model = getCommunicationProjectModel();
    if (!model) {
      return NextResponse.json(
        { success: false, error: "Modèle Communication non disponible." },
        { status: 503 }
      );
    }

    const updateData: Record<string, unknown> = {
      name: name.trim(),
      diagnosticContext: formData.diagnosticContext ?? null,
      diagnosticTarget: formData.diagnosticTarget ?? null,
      diagnosticEnvironment: formData.diagnosticEnvironment ?? null,
      diagnosticForces: formData.diagnosticForces ?? null,
      objectives: formData.objectives ?? null,
      strategyPositioning: formData.strategyPositioning ?? null,
      strategyTargets: formData.strategyTargets ?? null,
      strategyChannels: formData.strategyChannels ?? null,
      actionPlan: formData.actionPlan ?? null,
      actionSupports: formData.actionSupports ?? null,
      actionCalendar: formData.actionCalendar ?? null,
      actionBudget: formData.actionBudget ?? null,
      implementationContent: formData.implementationContent ?? null,
      implementationLaunch: formData.implementationLaunch ?? null,
      implementationTeams: formData.implementationTeams ?? null,
      evaluationMetrics: formData.evaluationMetrics ?? null,
      evaluationComparison: formData.evaluationComparison ?? null,
      evaluationAdjustments: formData.evaluationAdjustments ?? null,
    };

    await model.update({
      where: { id },
      data: updateData,
    });

    try {
      revalidatePath("/communication/projets");
      revalidatePath(`/communication/projets/${id}`);
      revalidatePath("/communication");
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("PATCH /api/communication/projects error:", error);
    return NextResponse.json(
      { success: false, error: message || "Erreur lors de la mise à jour du projet" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body?.id ?? new URL(request.url).searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "ID du projet manquant." },
        { status: 400 }
      );
    }

    const model = getCommunicationProjectModel();
    if (!model) {
      return NextResponse.json(
        { success: false, error: "Modèle Communication non disponible." },
        { status: 503 }
      );
    }

    await model.delete({ where: { id } });

    try {
      revalidatePath("/communication/projets");
      revalidatePath(`/communication/projets/${id}`);
      revalidatePath("/communication/resume-projet");
      revalidatePath("/communication");
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("DELETE /api/communication/projects error:", error);
    return NextResponse.json(
      { success: false, error: message || "Erreur lors de la suppression du projet" },
      { status: 500 }
    );
  }
}
