"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";
import type { CommunicationProjectListItem } from "./communication-project";
import type { PlanActionItem } from "./communication-plan-action";
import type { PlanActionTaskWithContext } from "./communication-plan-action-task";
import { getTasksForActionIds } from "./communication-plan-action-task";

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Pass clerkUserId from the client (useAuth().userId) when auth() is unavailable in server actions. */
async function resolveClerkId(clerkUserId?: string): Promise<string | undefined> {
  if (clerkUserId) return clerkUserId;

  const { userId } = await auth();
  if (userId) return userId;

  const clerkUser = await currentUser();
  if (clerkUser?.id) return clerkUser.id;

  if (process.env.NODE_ENV === "development") {
    try {
      const cookieStore = await cookies();
      if (cookieStore.get("__clerk_dev_bypass")?.value === "1") {
        const fromEnv = process.env.DEV_BYPASS_CLERK_ID?.trim();
        if (fromEnv) return fromEnv;

        const infographieUser = await prisma.user.findFirst({
          where: { role: "INFOGRAPHIE" },
          select: { clerkId: true },
          orderBy: { updatedAt: "desc" },
        });
        if (infographieUser?.clerkId) return infographieUser.clerkId;
      }
    } catch {
      // cookies() unavailable outside a request
    }
  }

  return undefined;
}

async function resolveCurrentUserDisplayName(
  clerkUserId?: string
): Promise<
  | { success: true; actorName: string; userId: string }
  | { success: false; error: string }
> {
  const clerkId = await resolveClerkId(clerkUserId);
  if (!clerkId) {
    return { success: false, error: "Vous devez être connecté." };
  }

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { success: false, error: userResult.error ?? "Utilisateur introuvable." };
  }

  const user = userResult.data;
  const actorName = `${user.firstName} ${user.lastName}`.trim();
  if (!actorName) {
    return { success: false, error: "Nom d'utilisateur incomplet." };
  }

  return { success: true, actorName, userId: user.id };
}

async function getActorIdsForCurrentUser(
  actorName: string,
  projectId?: string
): Promise<string[]> {
  const normalized = normalizeName(actorName);
  const actors = await prisma.communicationProjectActor.findMany({
    where: projectId ? { projectId } : undefined,
    select: { id: true, name: true },
  });

  return actors
    .filter((a) => normalizeName(a.name) === normalized)
    .map((a) => a.id);
}

export async function getProjectsWhereCurrentUserIsActor(
  clerkUserId?: string
): Promise<
  | { success: true; projects: CommunicationProjectListItem[]; actorName: string }
  | { success: false; error: string; projects: [] }
> {
  try {
    const userRes = await resolveCurrentUserDisplayName(clerkUserId);
    if (!userRes.success) {
      return { success: false, error: userRes.error, projects: [] };
    }

    const actorIds = await getActorIdsForCurrentUser(userRes.actorName);
    if (actorIds.length === 0) {
      return { success: true, projects: [], actorName: userRes.actorName };
    }

    const actorProjectRows = await prisma.communicationProjectActor.findMany({
      where: { id: { in: actorIds } },
      select: { projectId: true },
    });

    const projectIds = [...new Set(actorProjectRows.map((row) => row.projectId))];

    if (projectIds.length === 0) {
      return { success: true, projects: [], actorName: userRes.actorName };
    }

    const projects = await prisma.communicationProject.findMany({
      where: { id: { in: projectIds } },
      orderBy: { updatedAt: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });

    return {
      success: true,
      projects,
      actorName: userRes.actorName,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getProjectsWhereCurrentUserIsActor error:", error);
    return { success: false, error: message || "Erreur lors du chargement des projets.", projects: [] };
  }
}

export async function getPlanActionsForCurrentUserInProject(
  projectId: string,
  clerkUserId?: string
): Promise<
  | { success: true; actions: PlanActionItem[] }
  | { success: false; error: string; actions: [] }
> {
  try {
    const userRes = await resolveCurrentUserDisplayName(clerkUserId);
    if (!userRes.success) {
      return { success: false, error: userRes.error, actions: [] };
    }

    const actorIds = await getActorIdsForCurrentUser(userRes.actorName, projectId);
    if (actorIds.length === 0) {
      return { success: true, actions: [] };
    }

    const assignments = await prisma.communicationPlanActionActor.findMany({
      where: {
        actorId: { in: actorIds },
        action: { projectId },
      },
      select: { actionId: true },
    });

    const actionIds = [...new Set(assignments.map((a) => a.actionId))];
    if (actionIds.length === 0) {
      return { success: true, actions: [] };
    }

    const actions = await prisma.communicationPlanAction.findMany({
      where: { id: { in: actionIds }, projectId },
      orderBy: { orderIndex: "asc" },
    });

    return { success: true, actions };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getPlanActionsForCurrentUserInProject error:", error);
    return { success: false, error: message || "Erreur lors du chargement des actions.", actions: [] };
  }
}

export async function getAllPlanActionsForCurrentUser(
  clerkUserId?: string
): Promise<
  | { success: true; actions: (PlanActionItem & { projectName: string })[] }
  | { success: false; error: string; actions: [] }
> {
  try {
    const userRes = await resolveCurrentUserDisplayName(clerkUserId);
    if (!userRes.success) {
      return { success: false, error: userRes.error, actions: [] };
    }

    const actorIds = await getActorIdsForCurrentUser(userRes.actorName);
    if (actorIds.length === 0) {
      return { success: true, actions: [] };
    }

    const assignments = await prisma.communicationPlanActionActor.findMany({
      where: { actorId: { in: actorIds } },
      include: {
        action: {
          include: { project: { select: { name: true } } },
        },
      },
    });

    const seen = new Set<string>();
    const actions: (PlanActionItem & { projectName: string })[] = [];

    for (const row of assignments) {
      if (seen.has(row.action.id)) continue;
      seen.add(row.action.id);
      actions.push({
        ...row.action,
        projectName: row.action.project.name,
      });
    }

    actions.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return { success: true, actions };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getAllPlanActionsForCurrentUser error:", error);
    return { success: false, error: message || "Erreur lors du chargement.", actions: [] };
  }
}

export async function getAllTasksForCurrentUser(
  clerkUserId?: string
): Promise<
  | { success: true; tasks: PlanActionTaskWithContext[] }
  | { success: false; error: string; tasks: [] }
> {
  try {
    const actionsResult = await getAllPlanActionsForCurrentUser(clerkUserId);
    if (!actionsResult.success) {
      return { success: false, error: actionsResult.error, tasks: [] };
    }

    const actionIds = actionsResult.actions.map((a) => a.id);
    const tasksResult = await getTasksForActionIds(actionIds);
    if (!tasksResult.success) {
      return { success: false, error: "Erreur lors du chargement des tâches.", tasks: [] };
    }

    return { success: true, tasks: tasksResult.tasks };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getAllTasksForCurrentUser error:", error);
    return { success: false, error: message || "Erreur lors du chargement des tâches.", tasks: [] };
  }
}
