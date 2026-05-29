import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/actions/user";
import {
  buildProjectCreateData,
  type CommunicationProjectInput,
} from "@/lib/communication-project-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CommunicationProjectInput & {
      clerkUserId?: string;
    };

    let clerkId = body.clerkUserId;
    if (!clerkId) {
      const authResult = await auth();
      clerkId = authResult?.userId ?? undefined;
    }
    if (!clerkId) {
      const clerkUser = await currentUser();
      clerkId = clerkUser?.id;
    }
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié." },
        { status: 401 }
      );
    }
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom du projet est obligatoire." },
        { status: 400 }
      );
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: userResult.error ?? "Utilisateur introuvable." },
        { status: 400 }
      );
    }

    const row = await prisma.communicationProject.create({
      data: buildProjectCreateData(body, userResult.data.id),
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    try {
      revalidatePath("/communication/projets");
      revalidatePath("/communication");
    } catch {
      // ignore
    }

    const project = {
      id: row.id,
      name: row.name,
      projectStatus: row.projectStatus ?? "ACTIVE",
      createdAt:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : String(row.createdAt),
      updatedAt:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : String(row.updatedAt),
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

    await prisma.communicationProject.update({
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

    await prisma.communicationProject.delete({ where: { id } });

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
