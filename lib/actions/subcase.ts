"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function createSubcase(data: {
  subcaseNumber: string;
  conteneurId: string;
}) {
  try {
    const subcase = await prisma.subcase.create({
      data: {
        subcaseNumber: data.subcaseNumber,
        conteneurId: data.conteneurId,
      },
      include: {
        conteneur: true,
        spareParts: true,
        tools: true,
      }
    });
    
    revalidatePath("/magasinier/piecesencoursenvoies");
    return { success: true, data: subcase };
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
        conteneur: true,
        spareParts: true,
        tools: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, data: subcases };
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
        conteneur: true,
        spareParts: true,
        tools: true,
      }
    });
    
    if (!subcase) {
      return { success: false, error: "Subcase not found" };
    }
    
    return { success: true, data: subcase };
  } catch (error) {
    console.error("Error fetching subcase:", error);
    return { success: false, error: "Failed to fetch subcase" };
  }
}

export async function updateSubcase(id: string, data: {
  subcaseNumber?: string;
}) {
  try {
    const subcase = await prisma.subcase.update({
      where: { id },
      data,
      include: {
        conteneur: true,
        spareParts: true,
        tools: true,
      }
    });
    
    revalidatePath("/magasinier/piecesencoursenvoies");
    return { success: true, data: subcase };
  } catch (error) {
    console.error("Error updating subcase:", error);
    return { success: false, error: "Failed to update subcase" };
  }
}

export async function deleteSubcase(id: string) {
  try {
    await prisma.subcase.delete({
      where: { id }
    });
    
    revalidatePath("/magasinier/piecesencoursenvoies");
    return { success: true };
  } catch (error) {
    console.error("Error deleting subcase:", error);
    return { success: false, error: "Failed to delete subcase" };
  }
}

export async function addToolToSubcase(subcaseId: string, data: {
  toolCode: string;
  toolName: string;
  quantity: number;
}) {
  try {
    const tool = await prisma.tool.create({
      data: {
        toolCode: data.toolCode,
        toolName: data.toolName,
        quantity: data.quantity,
        subcaseId: subcaseId,
      }
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
        conteneur: {
          include: {
            commandes: {
              include: {
                voitureModel: true
              }
            }
          }
        }
      }
    });
    
    if (!subcase) {
      return { success: false, error: "Subcase not found" };
    }
    
    return { success: true, data: subcase.conteneur.commandes };
  } catch (error) {
    console.error("Error fetching commandes with models:", error);
    return { success: false, error: "Failed to fetch commandes" };
  }
}

export async function addSparePartToSubcase(subcaseId: string, data: {
  partCode: string;
  partName: string;
  partNameFrench?: string;
  quantity: number;
  commandeId?: string;
}) {
  try {
    const sparePart = await prisma.sparePart.create({
      data: {
        partCode: data.partCode,
        partName: data.partName,
        partNameFrench: data.partNameFrench,
        quantity: data.quantity,
        subcaseId: subcaseId,
        commandeId: data.commandeId,
      }
    });
    
    revalidatePath(`/magasinier/subcase/${subcaseId}`);
    return { success: true, data: sparePart };
  } catch (error) {
    console.error("Error adding spare part to subcase:", error);
    return { success: false, error: "Failed to add spare part" };
  }
}


// ... existing code ...

export async function updateSparePart(sparePartId: string, data: {
  partCode?: string;
  partName?: string;
  partNameFrench?: string;
  quantity?: number;
  statusVerification?: 'EN_ATTENTE' | 'RETROUVE' | 'MODIFIE' | 'NON_RETROUVE';
}) {
  try {
    const sparePart = await prisma.sparePart.update({
      where: { id: sparePartId },
      data
    });
    
    revalidatePath(`/magasinier/subcase/${sparePart.subcaseId}`);
    return { success: true, data: sparePart };
  } catch (error) {
    console.error("Error updating spare part:", error);
    return { success: false, error: "Failed to update spare part" };
  }
}

export async function deleteSparePart(sparePartId: string) {
  try {
    const sparePart = await prisma.sparePart.findUnique({
      where: { id: sparePartId },
      select: { subcaseId: true }
    });
    
    if (!sparePart) {
      return { success: false, error: "Spare part not found" };
    }
    
    await prisma.sparePart.delete({
      where: { id: sparePartId }
    });
    
    revalidatePath(`/magasinier/subcase/${sparePart.subcaseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting spare part:", error);
    return { success: false, error: "Failed to delete spare part" };
  }
}

// ... existing code ...

export async function updateTool(toolId: string, data: {
  toolCode?: string;
  toolName?: string;
  quantity?: number;
  etapeTool?: 'TRANSITE' | 'RENSEIGNE' | 'ARRIVE' | 'VERIFIE' | 'ATTRIBUE' | 'CONSOMME';
  check?: boolean;
}) {
  try {
    const tool = await prisma.tool.update({
      where: { id: toolId },
      data
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
      select: { subcaseId: true }
    });
    
    if (!tool) {
      return { success: false, error: "Tool not found" };
    }
    
    await prisma.tool.delete({
      where: { id: toolId }
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
        subcase: {
          conteneurId: conteneurId
        }
      },
      data: {
        etapeSparePart: 'RENSEIGNE'
      }
    });

    // Update conteneur status
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: 'RENSEIGNE'
      }
    });

    // Update all commandes in this conteneur
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId
      },
      data: {
        etapeCommande: 'RENSEIGNEE'
      }
    });
    
    revalidatePath("/magasinier/piecesencoursenvoies");
    return { success: true };
  } catch (error) {
    console.error("Error validating conteneur:", error);
    return { success: false, error: "Failed to validate conteneur" };
  }
}

export async function updateSparePartVerificationStatus(sparePartId: string, statusVerification: 'RETROUVE' | 'MODIFIE' | 'NON_RETROUVE') {
  try {
    const sparePart = await prisma.sparePart.update({
      where: { id: sparePartId },
      data: { statusVerification }
    });
    
    revalidatePath(`/magasinier/subcase/${sparePart.subcaseId}`);
    return { success: true, data: sparePart };
  } catch (error) {
    console.error("Error updating spare part verification status:", error);
    return { success: false, error: "Failed to update verification status" };
  }
}