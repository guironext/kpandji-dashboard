"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

function getPlanActionActorModel() {
  return (prisma as unknown as Record<string, unknown>)
    .communicationPlanActionActor as
    | {
        findMany: (args: object) => Promise<unknown[]>;
        create: (args: object) => Promise<unknown>;
        createMany: (args: object) => Promise<unknown>;
        deleteMany: (args: object) => Promise<unknown>;
      }
    | undefined;
}

export type AssignActorsToActionInput = {
  actionId: string;
  actorIds: string[];
};

export async function assignActorsToAction(
  input: AssignActorsToActionInput
): Promise<{ success: true } | { success: false; error: string }> {
  const model = getPlanActionActorModel();
  if (!model) {
    return {
      success: false,
      error:
        "Modèle CommunicationPlanActionActor non disponible. Exécutez « npx prisma generate » puis « npx prisma migrate dev ».",
    };
  }

  try {
    await model.deleteMany({
      where: { actionId: input.actionId },
    });

    if (input.actorIds.length > 0) {
      await model.createMany({
        data: input.actorIds.map((actorId) => ({
          actionId: input.actionId,
          actorId,
        })),
      });
    }

    revalidatePath("/communication/acteurs-roles");
    revalidatePath("/communication/mise-oeuvre");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("assignActorsToAction error:", error);
    return {
      success: false,
      error: message || "Erreur lors de l'affectation des acteurs",
    };
  }
}

export async function getAssignedActorIdsByActionId(
  actionId: string
): Promise<{ success: true; actorIds: string[] } | { success: false; actorIds: [] }> {
  const model = getPlanActionActorModel();
  if (!model) {
    return { success: true, actorIds: [] };
  }
  try {
    const rows = (await model.findMany({
      where: { actionId },
      select: { actorId: true },
    })) as { actorId: string }[];
    return {
      success: true,
      actorIds: rows.map((r) => r.actorId),
    };
  } catch (error) {
    console.error("getAssignedActorIdsByActionId error:", error);
    return { success: false, actorIds: [] };
  }
}

export async function getAssignmentsByProjectId(
  projectId: string
): Promise<
  | { success: true; assignments: Record<string, string[]> }
  | { success: false; assignments: Record<string, string[]> }
> {
  const model = getPlanActionActorModel();
  if (!model) {
    return { success: true, assignments: {} };
  }
  try {
    const rows = (await model.findMany({
      where: {
        action: { projectId },
      },
      select: { actionId: true, actorId: true },
    })) as { actionId: string; actorId: string }[];

    const assignments: Record<string, string[]> = {};
    for (const row of rows) {
      if (!assignments[row.actionId]) {
        assignments[row.actionId] = [];
      }
      assignments[row.actionId].push(row.actorId);
    }
    return { success: true, assignments };
  } catch (error) {
    console.error("getAssignmentsByProjectId error:", error);
    return { success: true, assignments: {} };
  }
}
