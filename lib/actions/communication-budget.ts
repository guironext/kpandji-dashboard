"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

// Guard: model may be missing until "npx prisma generate" is run after schema change
function getCommunicationBudgetItemModel() {
  return (prisma as unknown as Record<string, unknown>).communicationBudgetItem as
    | {
        findMany: (args: object) => Promise<unknown[]>;
        findUnique: (args: object) => Promise<unknown | null>;
        create: (args: object) => Promise<unknown>;
        update: (args: object) => Promise<unknown>;
        delete: (args: object) => Promise<unknown>;
      }
    | undefined;
}

export type CommunicationBudgetItem = {
  id: string;
  projectId: string;
  designation: string;
  prixUnitaire: number;
  quantite: number;
  montant: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateBudgetItemInput = {
  projectId: string;
  designation: string;
  prixUnitaire: number;
  quantite: number;
};

export type UpdateBudgetItemInput = {
  designation?: string;
  prixUnitaire?: number;
  quantite?: number;
};

export type GetBudgetItemsByProjectResult =
  | { success: true; items: CommunicationBudgetItem[] }
  | { success: false; error: string };

export type CreateBudgetItemResult =
  | { success: true; item: CommunicationBudgetItem }
  | { success: false; error: string };

export type UpdateBudgetItemResult =
  | { success: true; item: CommunicationBudgetItem }
  | { success: false; error: string };

export type DeleteBudgetItemResult =
  | { success: true }
  | { success: false; error: string };

export async function getBudgetItemsByProjectId(
  projectId: string
): Promise<GetBudgetItemsByProjectResult> {
  try {
    const model = getCommunicationBudgetItemModel();
    if (!model) {
      return { success: false, error: "Modèle CommunicationBudgetItem non disponible. Exécutez « npx prisma generate » puis « npx prisma migrate dev »." };
    }
    const items = (await model.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })) as CommunicationBudgetItem[];
    return { success: true, items };
  } catch (error) {
    console.error("getBudgetItemsByProjectId error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Check for database connection errors
    if (errorMessage.includes("Can't reach database") || errorMessage.includes("connection") || errorMessage.includes("P1001")) {
      return {
        success: false,
        error: "Erreur de connexion à la base de données. Veuillez vérifier que le serveur de base de données est accessible.",
      };
    }
    return {
      success: false,
      error: errorMessage || "Erreur lors de la récupération des éléments de budget",
    };
  }
}

export async function createBudgetItem(
  data: CreateBudgetItemInput
): Promise<CreateBudgetItemResult> {
  try {
    const model = getCommunicationBudgetItemModel();
    if (!model) {
      return {
        success: false,
        error: "Modèle CommunicationBudgetItem non disponible. Exécutez « npx prisma generate » puis « npx prisma migrate dev ».",
      };
    }
    const montant = data.prixUnitaire * data.quantite;
    const item = (await model.create({
      data: {
        projectId: data.projectId,
        designation: data.designation.trim(),
        prixUnitaire: data.prixUnitaire,
        quantite: data.quantite,
        montant,
      },
    })) as CommunicationBudgetItem;
    try {
      revalidatePath("/communication/budget");
    } catch {
      // ignore revalidate errors
    }
    return { success: true, item };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createBudgetItem error:", error);
    // Check for database connection errors
    if (message.includes("Can't reach database") || message.includes("connection") || message.includes("P1001")) {
      return {
        success: false,
        error: "Erreur de connexion à la base de données. Veuillez vérifier que le serveur de base de données est accessible.",
      };
    }
    return {
      success: false,
      error: message || "Erreur lors de la création de l'élément de budget",
    };
  }
}

export async function updateBudgetItem(
  id: string,
  data: UpdateBudgetItemInput
): Promise<UpdateBudgetItemResult> {
  try {
    const model = getCommunicationBudgetItemModel();
    if (!model) {
      return {
        success: false,
        error: "Modèle CommunicationBudgetItem non disponible.",
      };
    }
    const existing = (await model.findUnique({
      where: { id },
    })) as CommunicationBudgetItem | null;
    if (!existing) {
      return { success: false, error: "Élément de budget introuvable." };
    }
    const prixUnitaire = data.prixUnitaire ?? existing.prixUnitaire;
    const quantite = data.quantite ?? existing.quantite;
    const montant = prixUnitaire * quantite;
    const item = (await model.update({
      where: { id },
      data: {
        ...(data.designation !== undefined && { designation: data.designation.trim() }),
        ...(data.prixUnitaire !== undefined && { prixUnitaire }),
        ...(data.quantite !== undefined && { quantite }),
        montant,
      },
    })) as CommunicationBudgetItem;
    try {
      revalidatePath("/communication/budget");
    } catch {
      // ignore revalidate errors
    }
    return { success: true, item };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateBudgetItem error:", error);
    // Check for database connection errors
    if (message.includes("Can't reach database") || message.includes("connection") || message.includes("P1001")) {
      return {
        success: false,
        error: "Erreur de connexion à la base de données. Veuillez vérifier que le serveur de base de données est accessible.",
      };
    }
    return {
      success: false,
      error: message || "Erreur lors de la mise à jour de l'élément de budget",
    };
  }
}

export async function deleteBudgetItem(id: string): Promise<DeleteBudgetItemResult> {
  try {
    const model = getCommunicationBudgetItemModel();
    if (!model) {
      return {
        success: false,
        error: "Modèle CommunicationBudgetItem non disponible.",
      };
    }
    await model.delete({ where: { id } });
    try {
      revalidatePath("/communication/budget");
    } catch {
      // ignore revalidate errors
    }
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deleteBudgetItem error:", error);
    // Check for database connection errors
    if (message.includes("Can't reach database") || message.includes("connection") || message.includes("P1001")) {
      return {
        success: false,
        error: "Erreur de connexion à la base de données. Veuillez vérifier que le serveur de base de données est accessible.",
      };
    }
    return {
      success: false,
      error: message || "Erreur lors de la suppression de l'élément de budget",
    };
  }
}
