"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { EtapeTool } from "@prisma/client";

// Type guard for objects with toNumber method
interface HasToNumber {
  toNumber: () => number;
}

// Type guard for objects with toString method
interface HasToString {
  toString: () => string;
}

// Helper function to safely convert Decimal to number
function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  // Handle Prisma Decimal object - check for Decimal instance
  if (value && typeof value === "object") {
    // Check if it's a Decimal object by checking for toString method and constructor name
    if (
      "constructor" in value &&
      value.constructor &&
      typeof value.constructor === "function" &&
      value.constructor.name === "Decimal"
    ) {
      try {
        const str = String(value);
        return parseFloat(str);
      } catch {
        return null;
      }
    }
    // Also check for Prisma Decimal by checking if it has a toNumber method
    if (
      "toNumber" in value &&
      typeof (value as HasToNumber).toNumber === "function"
    ) {
      try {
        return (value as HasToNumber).toNumber();
      } catch {
        return null;
      }
    }
    // Fallback: try toString method
    if (
      "toString" in value &&
      typeof (value as HasToString).toString === "function"
    ) {
      try {
        const str = (value as HasToString).toString();
        return parseFloat(str);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function createSubcase(data: {
  subcaseNumber: string;
  conteneurId: string;
}) {
  try {
    const subcase = await prisma.subcase.create({
      data: {
        id: crypto.randomUUID(),
        subcaseNumber: data.subcaseNumber,
        conteneurId: data.conteneurId,
        updatedAt: new Date(),
      },
      include: {
        Conteneur: true,
        SparePart: true,
        Tool: true,
      },
    });

    // Remap for frontend compatibility
    const serializedSubcase = {
      ...subcase,
      conteneur: subcase.Conteneur,
      spareParts: subcase.SparePart,
      tools: subcase.Tool,
    };

    revalidatePath("/magasinier/piecesencoursenvoies");
    return { success: true, data: serializedSubcase };
  } catch (error) {
    console.error("Error creating subcase:", error);
    return { success: false, error: "Failed to create subcase" };
  }
}

export async function getSubcasesByConteneur(conteneurId: string) {
  try {
    const subcases = await prisma.subcase.findMany({
      where: { conteneurId },
      include: {
        Conteneur: true,
        SparePart: true,
        Tool: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Date objects in subcases and nested conteneur
    const serializedSubcases = (subcases as unknown[]).map((subcase: unknown) => {
      const s = subcase as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
        Conteneur?: Record<string, unknown> & {
          createdAt: Date;
          updatedAt: Date;
          dateEmbarquement: Date | null;
          dateArriveProbable: Date | null;
        };
        SparePart?: unknown[];
        Tool?: unknown[];
      };
      return {
        ...s,
        createdAt: (s.createdAt as Date).toISOString(),
        updatedAt: (s.updatedAt as Date).toISOString(),
        conteneur: s.Conteneur
          ? {
              ...s.Conteneur,
              createdAt: (s.Conteneur.createdAt as Date).toISOString(),
              updatedAt: (s.Conteneur.updatedAt as Date).toISOString(),
              dateEmbarquement:
                (s.Conteneur.dateEmbarquement as Date | null)?.toISOString() || null,
              dateArriveProbable:
                (s.Conteneur.dateArriveProbable as Date | null)?.toISOString() || null,
            }
          : null,
        spareParts: s.SparePart,
        tools: s.Tool,
      };
    });

    return { success: true, data: serializedSubcases };
  } catch (error) {
    console.error("Error fetching subcases:", error);
    return { success: false, error: "Failed to fetch subcases" };
  }
}

export async function getSubcase(id: string) {
  try {
    const subcase = await prisma.subcase.findUnique({
      where: { id },
      include: {
        Conteneur: true,
        SparePart: true,
        Tool: true,
      },
    });

    if (!subcase) {
      return { success: false, error: "Subcase not found" };
    }

    // Serialize Date objects
    const serializedSubcase = {
      ...subcase,
      createdAt: (subcase.createdAt as Date).toISOString(),
      updatedAt: (subcase.updatedAt as Date).toISOString(),
      conteneur: subcase.Conteneur
        ? {
            ...subcase.Conteneur,
            createdAt: (subcase.Conteneur.createdAt as Date).toISOString(),
            updatedAt: (subcase.Conteneur.updatedAt as Date).toISOString(),
            dateEmbarquement:
              (subcase.Conteneur.dateEmbarquement as Date | null)?.toISOString() || null,
            dateArriveProbable:
              (subcase.Conteneur.dateArriveProbable as Date | null)?.toISOString() || null,
          }
        : null,
      spareParts: ((subcase as Record<string, unknown>).SparePart as unknown[] || []).map((sparePart: unknown) => {
        const sp = sparePart as Record<string, unknown> & {
          createdAt: Date;
          updatedAt: Date;
        };
        return {
          ...sp,
          createdAt: (sp.createdAt as Date).toISOString(),
          updatedAt: (sp.updatedAt as Date).toISOString(),
        };
      }),
      tools: ((subcase as Record<string, unknown>).Tool as unknown[] || []).map((tool: unknown) => {
        const t = tool as Record<string, unknown> & {
          createdAt: Date;
          updatedAt: Date;
        };
        return {
          ...t,
          createdAt: (t.createdAt as Date).toISOString(),
          updatedAt: (t.updatedAt as Date).toISOString(),
        };
      }),
    };

    return { success: true, data: serializedSubcase };
  } catch (error) {
    console.error("Error fetching subcase:", error);
    return { success: false, error: "Failed to fetch subcase" };
  }
}

export async function updateSubcase(
  id: string,
  data: {
    subcaseNumber?: string;
    isVerified?: boolean;
  },
) {
  try {
    const subcase = await prisma.subcase.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        Conteneur: true,
        SparePart: true,
        Tool: true,
      },
    });

    revalidatePath("/magasinier/piecesencoursenvoies");
    revalidatePath("/magasinier/verification");
    revalidatePath(`/magasinier/verification/${id}/verify`);
    return { success: true, data: subcase };
  } catch (error) {
    console.error("Error updating subcase:", error);
    return { success: false, error: "Failed to update subcase" };
  }
}

export async function deleteSubcase(id: string) {
  try {
    await prisma.subcase.delete({
      where: { id },
    });

    revalidatePath("/magasinier/piecesencoursenvoies");
    return { success: true };
  } catch (error) {
    console.error("Error deleting subcase:", error);
    return { success: false, error: "Failed to delete subcase" };
  }
}

export async function addToolToSubcase(
  subcaseId: string,
  data: {
    toolCode: string;
    toolName: string;
    quantity: number;
  },
) {
  try {
    const tool = await prisma.tool.create({
      data: {
        id: crypto.randomUUID(),
        toolCode: data.toolCode,
        toolName: data.toolName,
        quantity: data.quantity,
        subcaseId: subcaseId,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/magasinier/subcase/${subcaseId}`);
    return { success: true, data: tool };
  } catch (error) {
    console.error("Error adding tool to subcase:", error);
    return { success: false, error: "Failed to add tool" };
  }
}

export async function getCommandesWithModelsForSubcase(subcaseId: string) {
  try {
    const subcase = await prisma.subcase.findUnique({
      where: { id: subcaseId },
      include: {
        Conteneur: {
          include: {
            Commande: {
              include: {
                VoitureModel: true,
              },
            },
          },
        },
      },
    });

    if (!subcase) {
      return { success: false, error: "Subcase not found" };
    }

    // Remap for internal logic
    const conteneur = (subcase as Record<string, unknown>).Conteneur as Record<string, unknown>;
    const commandes = (conteneur?.Commande || []) as unknown[];

    // Serialize Decimal values and Date objects
    const serializedCommandes = commandes.map((commande: unknown) => {
      const cmd = commande as Record<string, unknown> & {
        prix_unitaire: unknown;
        createdAt: Date;
        updatedAt: Date;
        date_livraison: Date | null;
        VoitureModel?: Record<string, unknown> & {
          createdAt: Date | string;
          updatedAt: Date | string;
        };
      };
      const { prix_unitaire, createdAt, updatedAt, date_livraison, ...rest } =
        cmd;
      return {
        ...rest,
        prix_unitaire: decimalToNumber(prix_unitaire),
        createdAt: (createdAt as Date).toISOString(),
        updatedAt: (updatedAt as Date).toISOString(),
        date_livraison: (date_livraison as Date | null)?.toISOString() || null,
        // Ensure nested objects are plain objects
        voitureModel: cmd.VoitureModel
          ? {
              ...cmd.VoitureModel,
              createdAt:
                cmd.VoitureModel.createdAt instanceof Date
                  ? (cmd.VoitureModel.createdAt as Date).toISOString()
                  : cmd.VoitureModel.createdAt,
              updatedAt:
                cmd.VoitureModel.updatedAt instanceof Date
                  ? (cmd.VoitureModel.updatedAt as Date).toISOString()
                  : cmd.VoitureModel.updatedAt,
            }
          : null,
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching commandes with models:", error);
    return { success: false, error: "Failed to fetch commandes" };
  }
}

export async function getVoitureModelsForConteneur(conteneurId: string) {
  try {
    const conteneur = await prisma.conteneur.findUnique({
      where: { id: conteneurId },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
          },
        },
      },
    });

    if (!conteneur) {
      return { success: false, error: "Conteneur not found" };
    }

    // Remap for internal logic
    const commandes = ((conteneur as unknown) as { Commande: unknown[] }).Commande || [];

    // Get unique voiture models from commandes
    const modelMap = new Map<string, { id: string; model: string }>();

    commandes.forEach((commande: unknown) => {
      const cmd = commande as { VoitureModel?: { id: string; model: string } };
      if (cmd.VoitureModel && !modelMap.has(cmd.VoitureModel.id)) {
        modelMap.set(cmd.VoitureModel.id, {
          id: cmd.VoitureModel.id,
          model: cmd.VoitureModel.model,
        });
      }
    });

    const uniqueModels = Array.from(modelMap.values());

    return { success: true, data: uniqueModels };
  } catch (error) {
    console.error("Error fetching voiture models for conteneur:", error);
    return { success: false, error: "Failed to fetch voiture models" };
  }
}

export async function createSparePart(data: {
  partCode: string;
  partName: string;
  partNameFrench?: string;
  verificationName?: string;
  quantity: number;
  subcaseId?: string;
  commandeId?: string;
  voitureId?: string;
  commandeLocalId?: string;
  verificationConteneurId?: string;
  storageId?: string;
}) {
  try {
    const sparePart = await prisma.sparePart.create({
      data: {
        id: crypto.randomUUID(),
        partCode: data.partCode,
        partName: data.partName,
        partNameFrench: data.partNameFrench,
        verificationName: data.verificationName,
        quantity: data.quantity,
        subcaseId: data.subcaseId,
        commandeId: data.commandeId,
        voitureId: data.voitureId,
        commandeLocalId: data.commandeLocalId,
        verificationConteneurId: data.verificationConteneurId,
        storageId: data.storageId,
        updatedAt: new Date(),
      },
    });

    // Revalidate relevant paths
    if (data.subcaseId) {
      revalidatePath(`/magasinier/subcase/${data.subcaseId}`);
    }
    revalidatePath("/magasinier");

    return { success: true, data: sparePart };
  } catch (error) {
    console.error("Error creating spare part:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create spare part";
    return { success: false, error: errorMessage };
  }
}

export async function addSparePartToSubcase(
  subcaseId: string,
  data: {
    partCode: string;
    partName: string;
    partNameFrench?: string;
    quantity: number;
    commandeId?: string;
  },
) {
  try {
    const sparePart = await prisma.sparePart.create({
      data: {
        id: crypto.randomUUID(),
        partCode: data.partCode,
        partName: data.partName,
        partNameFrench: data.partNameFrench,
        quantity: data.quantity,
        subcaseId: subcaseId,
        commandeId: data.commandeId,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/magasinier/subcase/${subcaseId}`);
    return { success: true, data: sparePart };
  } catch (error) {
    console.error("Error adding spare part to subcase:", error);
    return { success: false, error: "Failed to add spare part" };
  }
}

// ... existing code ...

export async function updateSparePart(
  sparePartId: string,
  data: {
    partCode?: string;
    partName?: string;
    partNameFrench?: string;
    verificationName?: string;
    quantity?: number;
    statusVerification?: "EN_ATTENTE" | "RETROUVE" | "MODIFIE" | "NON_RETROUVE";
  },
) {
  try {
    const sparePart = await prisma.sparePart.update({
      where: { id: sparePartId },
      data,
    });

    revalidatePath(`/magasinier/subcase/${sparePart.subcaseId}`);
    revalidatePath(`/magasinier/verification`);
    if (sparePart.subcaseId) {
      revalidatePath(`/magasinier/verification/${sparePart.subcaseId}/verify`);
    }

    // Serialize the response to ensure it's JSON-serializable
    return {
      success: true,
      data: {
        id: sparePart.id,
        partCode: sparePart.partCode,
        partName: sparePart.partName,
        partNameFrench: sparePart.partNameFrench,
        quantity: sparePart.quantity,
        etapeSparePart: sparePart.etapeSparePart,
        statusVerification: sparePart.statusVerification,
        subcaseId: sparePart.subcaseId,
        createdAt: sparePart.createdAt.toISOString(),
        updatedAt: sparePart.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error updating spare part:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update spare part";
    return { success: false, error: errorMessage };
  }
}

export async function deleteSparePart(sparePartId: string) {
  try {
    const sparePart = await prisma.sparePart.findUnique({
      where: { id: sparePartId },
      select: { subcaseId: true },
    });

    if (!sparePart) {
      return { success: false, error: "Spare part not found" };
    }

    await prisma.sparePart.delete({
      where: { id: sparePartId },
    });

    revalidatePath(`/magasinier/subcase/${sparePart.subcaseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting spare part:", error);
    return { success: false, error: "Failed to delete spare part" };
  }
}

// ... existing code ...

export async function updateTool(
  toolId: string,
  data: {
    toolCode?: string;
    toolName?: string;
    quantity?: number;
    etapeTool?: EtapeTool;
    check?: boolean;
  },
) {
  try {
    const tool = await prisma.tool.update({
      where: { id: toolId },
      data,
    });

    revalidatePath(`/magasinier/subcase/${tool.subcaseId}`);
    return { success: true, data: tool };
  } catch (error) {
    console.error("Error updating tool:", error);
    return { success: false, error: "Failed to update tool" };
  }
}

export async function deleteTool(toolId: string) {
  try {
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      select: { subcaseId: true },
    });

    if (!tool) {
      return { success: false, error: "Tool not found" };
    }

    await prisma.tool.delete({
      where: { id: toolId },
    });

    revalidatePath(`/magasinier/subcase/${tool.subcaseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting tool:", error);
    return { success: false, error: "Failed to delete tool" };
  }
}

// ... existing code ...

export async function validateConteneur(conteneurId: string) {
  try {
    // Update all spare parts in subcases of this conteneur
    await prisma.sparePart.updateMany({
      where: {
        Subcase: {
          conteneurId: conteneurId,
        },
      },
      data: {
        etapeSparePart: "RENSEIGNE",
        updatedAt: new Date(),
      },
    });

    // Update conteneur status
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: "RENSEIGNE",
        updatedAt: new Date(),
      },
    });

    // Update all commandes in this conteneur
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId,
      },
      data: {
        etapeCommande: "RENSEIGNEE",
        updatedAt: new Date(),
      },
    });

    revalidatePath("/magasinier/piecesencoursenvoies");
    return { success: true };
  } catch (error) {
    console.error("Error validating conteneur:", error);
    return { success: false, error: "Failed to validate conteneur" };
  }
}

export async function updateSparePartVerificationStatus(
  sparePartId: string,
  statusVerification: "RETROUVE" | "MODIFIE" | "NON_RETROUVE",
) {
  try {
    const sparePart = await prisma.sparePart.update({
      where: { id: sparePartId },
      data: { 
        statusVerification,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/magasinier/subcase/${sparePart.subcaseId}`);
    revalidatePath(`/magasinier/verification`);
    if (sparePart.subcaseId) {
      revalidatePath(`/magasinier/verification/${sparePart.subcaseId}/verify`);
    }
    return { success: true, data: sparePart };
  } catch (error) {
    console.error("Error updating spare part verification status:", error);
    return { success: false, error: "Failed to update verification status" };
  }
}
