"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "./user";
import {
  buildProjectCreateData,
  type CommunicationProjectInput,
} from "../communication-project-data";

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function revalidateProjectPaths(projectId?: string) {
  const paths = [
    "/communication/projets",
    "/communication",
    "/infographie/projets",
    "/infographie",
  ];
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // ignore
    }
  }
  if (projectId) {
    for (const base of ["/communication/projets", "/infographie/projets"]) {
      try {
        revalidatePath(`${base}/${projectId}`);
      } catch {
        // ignore
      }
    }
  }
}

export type CommunicationProjectListItem = {
  id: string;
  name: string;
  projectStatus: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
  createdBy: { firstName: string; lastName: string } | null;
};

export type { CommunicationProjectInput } from "../communication-project-data";

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

/** Pass clerkUserId from the client (useUser().id) when auth() is unavailable in server actions. */
export async function createCommunicationProject(
  data: CommunicationProjectInput,
  clerkUserId?: string,
): Promise<CreateCommunicationProjectResult> {
  if (!data.name?.trim()) {
    return { success: false, error: "Le nom du projet est obligatoire." };
  }

  try {
    let clerkId = clerkUserId;
    if (!clerkId) {
      const authResult = await auth();
      clerkId = authResult?.userId ?? undefined;
    }
    if (!clerkId) {
      const clerkUser = await currentUser();
      clerkId = clerkUser?.id;
    }
    if (!clerkId) {
      return { success: false, error: "Vous devez être connecté pour créer un projet." };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error ?? "Utilisateur introuvable.",
      };
    }

    const row = await prisma.communicationProject.create({
      data: buildProjectCreateData(data, userResult.data.id),
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    revalidateProjectPaths();

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
  try {
    const projects = await prisma.communicationProject.findMany({
      orderBy: { updatedAt: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
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
  try {
    const projects = await prisma.communicationProject.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
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
  try {
    const projects = await prisma.communicationProject.findMany({
      where: { projectStatus: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return { success: true, projects };
  } catch (error) {
    console.error("getActiveCommunicationProjects error:", error);
    return { success: false, projects: [] };
  }
}

export async function getCommunicationProjectById(
  id: string
): Promise<GetCommunicationProjectByIdResult> {
  try {
    const project = await prisma.communicationProject.findUnique({
      where: { id },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return { success: true, project };
  } catch (error) {
    console.error("getCommunicationProjectById error:", error);
    return { success: false, project: null };
  }
}

export type UpdateCommunicationProjectResult =
  | { success: true }
  | { success: false; error: string };

export async function updateCommunicationProject(
  id: string,
  data: Partial<CommunicationProjectInput> & { name?: string }
): Promise<UpdateCommunicationProjectResult> {
  try {
    const updateData: Record<string, unknown> = {};
    const fields: (keyof CommunicationProjectInput)[] = [
      "name",
      "createdById",
      "diagnosticContext",
      "diagnosticTarget",
      "diagnosticEnvironment",
      "diagnosticForces",
      "objectives",
      "strategyPositioning",
      "strategyTargets",
      "strategyChannels",
      "actionPlan",
      "actionSupports",
      "actionCalendar",
      "actionBudget",
      "implementationContent",
      "implementationLaunch",
      "implementationTeams",
      "evaluationMetrics",
      "evaluationComparison",
      "evaluationAdjustments",
    ];
    for (const key of fields) {
      if (key in data) {
        const val = data[key];
        if (key === "name" && typeof val === "string") {
          updateData[key] = val.trim();
        } else {
          updateData[key] = optionalText(val);
        }
      }
    }
    if (Object.keys(updateData).length === 0) {
      return { success: true };
    }
    await prisma.communicationProject.update({
      where: { id },
      data: updateData,
    });
    revalidateProjectPaths(id);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateCommunicationProject error:", error);
    return {
      success: false,
      error: message || "Erreur lors de la mise à jour du projet",
    };
  }
}

export type DeleteCommunicationProjectResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteCommunicationProject(
  id: string
): Promise<DeleteCommunicationProjectResult> {
  try {
    await prisma.communicationProject.delete({
      where: { id },
    });
    revalidateProjectPaths(id);
    try {
      revalidatePath("/communication/resume-projet");
    } catch {
      // ignore
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
  try {
    await prisma.communicationProject.update({
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
