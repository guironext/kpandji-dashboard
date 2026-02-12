"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

// Guard: model may be missing until "npx prisma generate" is run after schema change
function getCommunicationProjectModel() {
  return (prisma as unknown as Record<string, unknown>).communicationProject as
    | {
        findMany: (args: object) => Promise<unknown[]>;
        findUnique: (args: object) => Promise<unknown | null>;
        create: (args: object) => Promise<unknown>;
        update: (args: object) => Promise<unknown>;
        delete: (args: object) => Promise<unknown>;
      }
    | undefined;
}

export type CommunicationProjectListItem = {
  id: string;
  name: string;
  projectStatus: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
  createdBy: { firstName: string; lastName: string } | null;
};

export type CommunicationProjectInput = {
  name: string;
  createdById?: string | null;
  diagnosticContext?: string | null;
  diagnosticTarget?: string | null;
  diagnosticEnvironment?: string | null;
  diagnosticForces?: string | null;
  objectives?: string | null;
  strategyPositioning?: string | null;
  strategyTargets?: string | null;
  strategyChannels?: string | null;
  actionPlan?: string | null;
  actionSupports?: string | null;
  actionCalendar?: string | null;
  actionBudget?: string | null;
  implementationContent?: string | null;
  implementationLaunch?: string | null;
  implementationTeams?: string | null;
  evaluationMetrics?: string | null;
  evaluationComparison?: string | null;
  evaluationAdjustments?: string | null;
};

export type SerializedCommunicationProjectListItem = Omit<CommunicationProjectListItem, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

/** Project as returned by getCommunicationProjectById (with createdBy included). */
export type CommunicationProjectDetail = {
  id: string;
  name: string;
  projectStatus: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  createdBy: { firstName: string; lastName: string } | null;
  diagnosticContext: string | null;
  diagnosticTarget: string | null;
  diagnosticEnvironment: string | null;
  diagnosticForces: string | null;
  objectives: string | null;
  strategyPositioning: string | null;
  strategyTargets: string | null;
  strategyChannels: string | null;
  actionPlan: string | null;
  actionSupports: string | null;
  actionCalendar: string | null;
  actionBudget: string | null;
  implementationContent: string | null;
  implementationLaunch: string | null;
  implementationTeams: string | null;
  evaluationMetrics: string | null;
  evaluationComparison: string | null;
  evaluationAdjustments: string | null;
};

export type GetCommunicationProjectByIdResult =
  | { success: true; project: CommunicationProjectDetail | null }
  | { success: false; project: null };

export type CreateCommunicationProjectResult =
  | { success: true; project: SerializedCommunicationProjectListItem }
  | { success: false; error: string };

export async function createCommunicationProject(
  data: CommunicationProjectInput
): Promise<CreateCommunicationProjectResult> {
  const model = getCommunicationProjectModel();
  if (!model) {
    return {
      success: false,
      error: "Modèle Communication non disponible. Exécutez « npx prisma generate » puis « npx prisma migrate dev ».",
    };
  }
  try {
    const raw = await model.create({
      data: {
        name: data.name,
        createdById: data.createdById ?? undefined,
        diagnosticContext: data.diagnosticContext ?? undefined,
        diagnosticTarget: data.diagnosticTarget ?? undefined,
        diagnosticEnvironment: data.diagnosticEnvironment ?? undefined,
        diagnosticForces: data.diagnosticForces ?? undefined,
        objectives: data.objectives ?? undefined,
        strategyPositioning: data.strategyPositioning ?? undefined,
        strategyTargets: data.strategyTargets ?? undefined,
        strategyChannels: data.strategyChannels ?? undefined,
        actionPlan: data.actionPlan ?? undefined,
        actionSupports: data.actionSupports ?? undefined,
        actionCalendar: data.actionCalendar ?? undefined,
        actionBudget: data.actionBudget ?? undefined,
        implementationContent: data.implementationContent ?? undefined,
        implementationLaunch: data.implementationLaunch ?? undefined,
        implementationTeams: data.implementationTeams ?? undefined,
        evaluationMetrics: data.evaluationMetrics ?? undefined,
        evaluationComparison: data.evaluationComparison ?? undefined,
        evaluationAdjustments: data.evaluationAdjustments ?? undefined,
      },
    });
    try {
      revalidatePath("/communication/projets");
      revalidatePath("/communication");
    } catch {
      // ignore revalidate errors
    }
    const row = raw as { id: string; name: string; projectStatus: "ACTIVE" | "INACTIVE"; createdAt: Date; updatedAt: Date; createdBy?: { firstName: string; lastName: string } | null };
    const project = {
      id: row.id,
      name: row.name,
      projectStatus: row.projectStatus ?? "ACTIVE",
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      createdBy: row.createdBy ?? null,
    };
    return { success: true, project };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createCommunicationProject error:", error);
    return {
      success: false,
      error: message || "Erreur lors de la création du projet",
    };
  }
}

export async function getCommunicationProjects(): Promise<
  | { success: true; projects: CommunicationProjectListItem[] }
  | { success: false; projects: [] }
> {
  const model = getCommunicationProjectModel();
  if (!model) {
    return { success: true, projects: [] };
  }
  try {
    const projects = (await model.findMany({
      orderBy: { updatedAt: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    })) as CommunicationProjectListItem[];
    return { success: true, projects };
  } catch (error) {
    console.error("getCommunicationProjects error:", error);
    return { success: false, projects: [] };
  }
}

/** All projects for rapport-projets, ordered by newest first (createdAt desc). */
export async function getCommunicationProjectsForReport(): Promise<
  | { success: true; projects: CommunicationProjectListItem[] }
  | { success: false; projects: [] }
> {
  const model = getCommunicationProjectModel();
  if (!model) {
    return { success: true, projects: [] };
  }
  try {
    const projects = (await model.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    })) as CommunicationProjectListItem[];
    return { success: true, projects };
  } catch (error) {
    console.error("getCommunicationProjectsForReport error:", error);
    return { success: false, projects: [] };
  }
}

export async function getActiveCommunicationProjects(): Promise<
  | { success: true; projects: CommunicationProjectListItem[] }
  | { success: false; projects: [] }
> {
  const model = getCommunicationProjectModel();
  if (!model) {
    return { success: true, projects: [] };
  }
  try {
    const projects = (await model.findMany({
      where: { projectStatus: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    })) as CommunicationProjectListItem[];
    return { success: true, projects };
  } catch (error) {
    console.error("getActiveCommunicationProjects error:", error);
    return { success: false, projects: [] };
  }
}

export async function getCommunicationProjectById(
  id: string
): Promise<GetCommunicationProjectByIdResult> {
  const model = getCommunicationProjectModel();
  if (!model) {
    return { success: true, project: null };
  }
  try {
    const project = (await model.findUnique({
      where: { id },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    })) as CommunicationProjectDetail | null;
    return { success: true, project };
  } catch (error) {
    console.error("getCommunicationProjectById error:", error);
    return { success: false, project: null };
  }
}

export type DeleteCommunicationProjectResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCommunicationProject(
  id: string
): Promise<DeleteCommunicationProjectResult> {
  const model = getCommunicationProjectModel();
  if (!model) {
    return {
      success: false,
      error: "Modèle Communication non disponible. Exécutez « npx prisma generate » puis « npx prisma migrate dev ».",
    };
  }
  try {
    await model.delete({
      where: { id },
    });
    try {
      revalidatePath("/communication/projets");
      revalidatePath("/communication/resume-projet");
      revalidatePath("/communication");
    } catch {
      // ignore revalidate errors
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deleteCommunicationProject error:", error);
    return {
      success: false,
      error: message || "Erreur lors de la suppression du projet",
    };
  }
}

export type SetProjectStatusInactiveResult =
  | { success: true }
  | { success: false; error: string };

export async function setProjectStatusInactive(
  projectId: string
): Promise<SetProjectStatusInactiveResult> {
  const model = getCommunicationProjectModel();
  if (!model) {
    return {
      success: false,
      error: "Modèle Communication non disponible. Exécutez « npx prisma generate » puis « npx prisma migrate dev ».",
    };
  }
  try {
    await model.update({
      where: { id: projectId },
      data: { projectStatus: "INACTIVE" },
    });
    try {
      revalidatePath("/communication/rapport-projets");
      revalidatePath("/communication/resume-projet");
      revalidatePath("/communication");
    } catch {
      // ignore revalidate errors
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("setProjectStatusInactive error:", error);
    return {
      success: false,
      error: message || "Erreur lors du classement du projet",
    };
  }
}
