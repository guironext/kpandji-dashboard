"use server";

import { prisma } from "../prisma";
import type { PlanActionTaskStage } from "./communication-plan-action-task";

export type SerializedPlanActionTask = {
  id: string;
  actionId: string;
  title: string;
  startDate: string;
  endDate: string;
  stage: PlanActionTaskStage;
  orderIndex: number;
};

export type MiseEnOeuvreActionGroup = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  completed: boolean;
  orderIndex: number;
  assignedActors: {
    id: string;
    name: string;
    department: string;
    job: string;
  }[];
  tasks: SerializedPlanActionTask[];
};

export type MiseEnOeuvreActorGroup = {
  actor: {
    id: string;
    name: string;
    department: string;
    job: string;
  };
  actions: {
    id: string;
    title: string;
    tasks: SerializedPlanActionTask[];
  }[];
};

export type MiseEnOeuvreProjectData = {
  byAction: MiseEnOeuvreActionGroup[];
  byActor: MiseEnOeuvreActorGroup[];
};

function serializeDate(d: Date): string {
  return d instanceof Date ? d.toISOString() : String(d);
}

function serializeTask(task: {
  id: string;
  actionId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  stage: string;
  orderIndex: number;
}): SerializedPlanActionTask {
  return {
    id: task.id,
    actionId: task.actionId,
    title: task.title,
    startDate: serializeDate(task.startDate),
    endDate: serializeDate(task.endDate),
    stage: task.stage as PlanActionTaskStage,
    orderIndex: task.orderIndex,
  };
}

export async function getMiseEnOeuvreDataByProjectId(
  projectId: string
): Promise<
  | { success: true; data: MiseEnOeuvreProjectData }
  | { success: false; data: null; error?: string }
> {
  try {
    const [actions, actors] = await Promise.all([
      prisma.communicationPlanAction.findMany({
        where: { projectId },
        orderBy: { orderIndex: "asc" },
        include: {
          tasks: { orderBy: { orderIndex: "asc" } },
          assignedActors: {
            include: {
              actor: {
                select: { id: true, name: true, department: true, job: true },
              },
            },
          },
        },
      }),
      prisma.communicationProjectActor.findMany({
        where: { projectId },
        orderBy: { name: "asc" },
        include: {
          assignedActions: {
            include: {
              action: {
                include: { tasks: { orderBy: { orderIndex: "asc" } } },
              },
            },
          },
        },
      }),
    ]);

    const byAction: MiseEnOeuvreActionGroup[] = actions.map((action) => ({
      id: action.id,
      title: action.title,
      startDate: serializeDate(action.startDate),
      endDate: serializeDate(action.endDate),
      completed: action.completed,
      orderIndex: action.orderIndex,
      assignedActors: action.assignedActors.map(({ actor }) => actor),
      tasks: action.tasks.map(serializeTask),
    }));

    const byActor: MiseEnOeuvreActorGroup[] = actors.map((row) => ({
      actor: {
        id: row.id,
        name: row.name,
        department: row.department,
        job: row.job,
      },
      actions: row.assignedActions
        .map(({ action }) => action)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((action) => ({
          id: action.id,
          title: action.title,
          tasks: action.tasks.map(serializeTask),
        })),
    }));

    return { success: true, data: { byAction, byActor } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getMiseEnOeuvreDataByProjectId error:", error);
    return { success: false, data: null, error: message };
  }
}
