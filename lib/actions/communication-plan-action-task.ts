"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import type { PlanActionTaskStage as PrismaPlanActionTaskStage } from "@prisma/client";
import type { TaskStageId } from "@/lib/plan-action-task-stage";

export type PlanActionTaskStage = TaskStageId;

export type PlanActionTaskItem = {
  id: string;
  actionId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  stage: PlanActionTaskStage;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PlanActionTaskWithContext = PlanActionTaskItem & {
  actionTitle: string;
  projectId: string;
  projectName: string;
};

export type PlanActionTaskInput = {
  title: string;
  startDate: Date;
  endDate: Date;
  stage?: PlanActionTaskStage;
  orderIndex?: number;
};

export type PlanActionTaskUpsertInput = PlanActionTaskInput & {
  id?: string;
};

function revalidateInfographiePaths() {
  for (const path of [
    "/infographie/projets",
    "/infographie/taches",
    "/communication/mise-en-oeuvre",
  ]) {
    try {
      revalidatePath(path);
    } catch {
      // ignore
    }
  }
}

export async function getTasksByActionId(
  actionId: string
): Promise<{ success: true; tasks: PlanActionTaskItem[] } | { success: false; tasks: [] }> {
  try {
    const tasks = await prisma.communicationPlanActionTask.findMany({
      where: { actionId },
      orderBy: { orderIndex: "asc" },
    });
    return { success: true, tasks };
  } catch (error) {
    console.error("getTasksByActionId error:", error);
    return { success: false, tasks: [] };
  }
}

export async function saveTasksForAction(
  actionId: string,
  tasks: PlanActionTaskInput[]
): Promise<{ success: true; tasks: PlanActionTaskItem[] } | { success: false; error: string }> {
  const validTasks = tasks.filter((t) => t.title.trim());
  for (const t of validTasks) {
    if (t.endDate < t.startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début pour chaque tâche.",
      };
    }
  }

  try {
    await prisma.communicationPlanActionTask.deleteMany({ where: { actionId } });

    if (validTasks.length === 0) {
      revalidateInfographiePaths();
      return { success: true, tasks: [] };
    }

    await prisma.communicationPlanActionTask.createMany({
      data: validTasks.map((t, index) => ({
        actionId,
        title: t.title.trim(),
        startDate: t.startDate,
        endDate: t.endDate,
        stage: (t.stage ?? "EN_ATTENTE_DEBUT") as PrismaPlanActionTaskStage,
        orderIndex: t.orderIndex ?? index,
      })),
    });

    const saved = await prisma.communicationPlanActionTask.findMany({
      where: { actionId },
      orderBy: { orderIndex: "asc" },
    });

    revalidateInfographiePaths();
    return { success: true, tasks: saved };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("saveTasksForAction error:", error);

    if (
      message.includes("communicationPlanActionTask") ||
      message.includes("does not exist") ||
      message.includes("Unknown model") ||
      message.includes("stage")
    ) {
      return {
        success: false,
        error:
          "Client Prisma obsolète : arrêtez le serveur de dev, exécutez « npx prisma generate » puis « npx prisma migrate deploy ».",
      };
    }

    return { success: false, error: message || "Erreur lors de l'enregistrement des tâches." };
  }
}

export async function updateTasksForAction(
  actionId: string,
  tasks: PlanActionTaskUpsertInput[]
): Promise<{ success: true; tasks: PlanActionTaskItem[] } | { success: false; error: string }> {
  const validTasks = tasks.filter((t) => t.title.trim());
  for (const t of validTasks) {
    if (t.endDate < t.startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début pour chaque tâche.",
      };
    }
  }

  try {
    const keptIds = validTasks.map((t) => t.id).filter((id): id is string => Boolean(id));

    await prisma.communicationPlanActionTask.deleteMany({
      where: {
        actionId,
        ...(keptIds.length > 0 ? { id: { notIn: keptIds } } : {}),
      },
    });

    for (let index = 0; index < validTasks.length; index++) {
      const t = validTasks[index];
      const data = {
        title: t.title.trim(),
        startDate: t.startDate,
        endDate: t.endDate,
        stage: (t.stage ?? "EN_ATTENTE_DEBUT") as PrismaPlanActionTaskStage,
        orderIndex: t.orderIndex ?? index,
      };

      if (t.id) {
        const existing = await prisma.communicationPlanActionTask.findFirst({
          where: { id: t.id, actionId },
        });
        if (existing) {
          await prisma.communicationPlanActionTask.update({
            where: { id: t.id },
            data,
          });
          continue;
        }
      }

      await prisma.communicationPlanActionTask.create({
        data: { actionId, ...data },
      });
    }

    const saved = await prisma.communicationPlanActionTask.findMany({
      where: { actionId },
      orderBy: { orderIndex: "asc" },
    });

    revalidateInfographiePaths();
    return { success: true, tasks: saved };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateTasksForAction error:", error);

    if (
      message.includes("communicationPlanActionTask") ||
      message.includes("does not exist") ||
      message.includes("Unknown model") ||
      message.includes("stage")
    ) {
      return {
        success: false,
        error:
          "Client Prisma obsolète : arrêtez le serveur de dev, exécutez « npx prisma generate » puis « npx prisma migrate deploy ».",
      };
    }

    return { success: false, error: message || "Erreur lors de la mise à jour des tâches." };
  }
}

export async function updatePlanActionTaskStage(
  taskId: string,
  stage: PlanActionTaskStage
): Promise<
  | { success: true; task: PlanActionTaskItem }
  | { success: false; error: string }
> {
  try {
    const task = await prisma.communicationPlanActionTask.update({
      where: { id: taskId },
      data: { stage: stage as PrismaPlanActionTaskStage },
    });
    revalidateInfographiePaths();
    return { success: true, task };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updatePlanActionTaskStage error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour de l'étape." };
  }
}

export async function getTasksForActionIds(
  actionIds: string[]
): Promise<
  | { success: true; tasks: PlanActionTaskWithContext[] }
  | { success: false; tasks: [] }
> {
  if (actionIds.length === 0) {
    return { success: true, tasks: [] };
  }

  try {
    const rows = await prisma.communicationPlanActionTask.findMany({
      where: { actionId: { in: actionIds } },
      orderBy: [{ actionId: "asc" }, { orderIndex: "asc" }],
    });

    const actions = await prisma.communicationPlanAction.findMany({
      where: { id: { in: actionIds } },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: { select: { name: true } },
      },
    });

    const actionById = new Map(actions.map((a) => [a.id, a]));

    const tasks: PlanActionTaskWithContext[] = rows.map((row) => {
      const action = actionById.get(row.actionId);
      return {
        ...row,
        actionTitle: action?.title ?? "",
        projectId: action?.projectId ?? "",
        projectName: action?.project.name ?? "",
      };
    });

    return { success: true, tasks };
  } catch (error) {
    console.error("getTasksForActionIds error:", error);
    return { success: false, tasks: [] };
  }
}
