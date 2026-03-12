"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export type PlanActionItem = {
  id: string;
  projectId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  completed: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PlanActionWithActors = PlanActionItem & {
  assignedActors: { actor: { id: string; name: string; department: string; job: string } }[];
};

export type PlanActionInput = {
  title: string;
  startDate: Date;
  endDate: Date;
  completed?: boolean;
  orderIndex?: number;
};

function getPlanActionModel() {
  return (prisma as unknown as Record<string, unknown>).communicationPlanAction as
    | {
        findMany: (args: object) => Promise<PlanActionItem[]>;
        findUnique: (args: object) => Promise<PlanActionItem | null>;
        create: (args: object) => Promise<PlanActionItem>;
        update: (args: object) => Promise<PlanActionItem>;
        delete: (args: object) => Promise<PlanActionItem>;
      }
    | undefined;
}

export async function getPlanActionsByProjectId(
  projectId: string
): Promise<{ success: true; actions: PlanActionItem[] } | { success: false; actions: [] }> {
  const model = getPlanActionModel();
  if (!model) {
    return { success: true, actions: [] };
  }
  try {
    const actions = (await model.findMany({
      where: { projectId },
      orderBy: { orderIndex: "asc" },
    })) as PlanActionItem[];
    return { success: true, actions };
  } catch (error) {
    console.error("getPlanActionsByProjectId error:", error);
    return { success: false, actions: [] };
  }
}

export async function getPlanActionsWithActorsByProjectId(
  projectId: string
): Promise<
  | { success: true; actions: PlanActionWithActors[] }
  | { success: false; actions: [] }
> {
  try {
    const actions = (await prisma.communicationPlanAction.findMany({
      where: { projectId },
      orderBy: { orderIndex: "asc" },
      include: {
        assignedActors: {
          include: {
            actor: { select: { id: true, name: true, department: true, job: true } },
          },
        },
      },
    })) as PlanActionWithActors[];
    return { success: true, actions };
  } catch (error) {
    console.error("getPlanActionsWithActorsByProjectId error:", error);
    return { success: false, actions: [] };
  }
}

export async function createPlanAction(
  projectId: string,
  data: PlanActionInput
): Promise<{ success: true; action: PlanActionItem } | { success: false; error: string }> {
  const model = getPlanActionModel();
  if (!model) {
    return { success: false, error: "Modèle plan d'action non disponible." };
  }
  if (data.endDate < data.startDate) {
    return { success: false, error: "La date de fin doit être après la date de début." };
  }
  try {
    const orderIndex =
      data.orderIndex ?? (await model.findMany({ where: { projectId } })).length;
    const action = (await model.create({
      data: {
        projectId,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        completed: data.completed ?? false,
        orderIndex,
      },
    })) as PlanActionItem;
    revalidatePath("/communication/plan-action");
    revalidatePath("/communication/mise-oeuvre");
    return { success: true, action };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createPlanAction error:", error);
    return { success: false, error: message || "Erreur lors de la création de l'action." };
  }
}

export async function updatePlanAction(
  id: string,
  data: Partial<PlanActionInput>
): Promise<{ success: true; action: PlanActionItem } | { success: false; error: string }> {
  const model = getPlanActionModel();
  if (!model) {
    return { success: false, error: "Modèle plan d'action non disponible." };
  }
  if (data.endDate != null && data.startDate != null && data.endDate < data.startDate) {
    return { success: false, error: "La date de fin doit être après la date de début." };
  }
  try {
    const action = (await model.update({
      where: { id },
      data: {
        ...(data.title != null && { title: data.title }),
        ...(data.startDate != null && { startDate: data.startDate }),
        ...(data.endDate != null && { endDate: data.endDate }),
        ...(data.completed != null && { completed: data.completed }),
        ...(data.orderIndex != null && { orderIndex: data.orderIndex }),
      },
    })) as PlanActionItem;
    revalidatePath("/communication/plan-action");
    revalidatePath("/communication/mise-oeuvre");
    return { success: true, action };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updatePlanAction error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour de l'action." };
  }
}

export async function deletePlanAction(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const model = getPlanActionModel();
  if (!model) {
    return { success: false, error: "Modèle plan d'action non disponible." };
  }
  try {
    await model.delete({ where: { id } });
    revalidatePath("/communication/plan-action");
    revalidatePath("/communication/mise-oeuvre");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deletePlanAction error:", error);
    return { success: false, error: message || "Erreur lors de la suppression de l'action." };
  }
}

export async function togglePlanActionCompleted(
  id: string,
  completed: boolean
): Promise<{ success: true; action: PlanActionItem } | { success: false; error: string }> {
  try {
    const model = getPlanActionModel();
    if (!model) {
      console.error("togglePlanActionCompleted: Model not available. Run 'npx prisma generate'");
      return { 
        success: false, 
        error: "Modèle plan d'action non disponible. Veuillez exécuter 'npx prisma generate'." 
      };
    }
    
    const action = (await model.update({
      where: { id },
      data: { completed },
    })) as PlanActionItem;
    
    revalidatePath("/communication/mise-oeuvre");
    revalidatePath("/communication/plan-action");
    return { success: true, action };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
    console.error("togglePlanActionCompleted error:", {
      message,
      errorString,
      error,
    });
    
    // Check if it's a Prisma field error (field doesn't exist)
    if (message.includes("Unknown argument") || message.includes("completed") || message.includes("Unknown field")) {
      return { 
        success: false, 
        error: "Le champ 'completed' n'existe pas. Veuillez exécuter 'npx prisma generate' puis redémarrer le serveur." 
      };
    }
    
    return { success: false, error: message || "Erreur lors de la mise à jour de l'action." };
  }
}
