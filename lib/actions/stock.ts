"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllStockDisponible() {
  try {
    const stock = await prisma.stockDisponible.findMany({
      include: {
        VoitureModel: {
          select: {
            id: true,
            model: true,
            description: true,
            image: true,
            fiche_technique: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remap for frontend compatibility
    const serializedStock = (stock as unknown[]).map((s: unknown) => {
      const item = s as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
        acquisitionDate: Date;
        VoitureModel?: unknown;
      };
      return {
        ...item,
        createdAt: (item.createdAt as Date).toISOString(),
        updatedAt: (item.updatedAt as Date).toISOString(),
        acquisitionDate: (item.acquisitionDate as Date).toISOString(),
        voitureModel: item.VoitureModel,
      };
    });

    return { success: true, data: serializedStock };
  } catch (error) {
    console.error("Error fetching stock disponible:", error);
    return { success: false, error: "Failed to fetch stock" };
  }
}

export async function getStockByModel(modelId: string) {
  try {
    const stock = await prisma.stockDisponible.findMany({
      where: {
        voitureModelId: modelId,
      },
      include: {
        VoitureModel: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remap for frontend compatibility
    const serializedStock = (stock as unknown[]).map((s: unknown) => {
      const item = s as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
        acquisitionDate: Date;
        VoitureModel?: unknown;
      };
      return {
        ...item,
        createdAt: (item.createdAt as Date).toISOString(),
        updatedAt: (item.updatedAt as Date).toISOString(),
        acquisitionDate: (item.acquisitionDate as Date).toISOString(),
        voitureModel: item.VoitureModel,
      };
    });

    return { success: true, data: serializedStock };
  } catch (error) {
    console.error("Error fetching stock by model:", error);
    return { success: false, error: "Failed to fetch stock" };
  }
}

export async function createStockDisponible(data: {
  voitureModelId: string;
  couleur: string;
  motorisation: string;
  transmission: string;
  quantity: number;
  acquisitionDate?: Date;
}) {
  try {
    // Check if this exact combination already exists
    const existingStock = await prisma.stockDisponible.findFirst({
      where: {
        voitureModelId: data.voitureModelId,
        couleur: data.couleur,
        motorisation: data.motorisation,
        transmission: data.transmission,
      },
    });

    if (existingStock) {
      // Update the quantity
      const updatedStock = await prisma.stockDisponible.update({
        where: { id: existingStock.id },
        data: {
          quantity: existingStock.quantity + data.quantity,
          updatedAt: new Date(),
        },
      });
      return { success: true, data: updatedStock };
    } else {
      // Create new stock entry
      const stock = await prisma.stockDisponible.create({
        data: {
          id: crypto.randomUUID(),
          voitureModelId: data.voitureModelId,
          couleur: data.couleur,
          motorisation: data.motorisation,
          transmission: data.transmission,
          quantity: data.quantity,
          acquisitionDate: data.acquisitionDate || new Date(),
          updatedAt: new Date(),
        },
      });
      return { success: true, data: stock };
    }
  } catch (error) {
    console.error("Error creating stock:", error);
    return { success: false, error: "Failed to create stock" };
  }
}

export async function updateStockQuantity(stockId: string, quantity: number) {
  try {
    const stock = await prisma.stockDisponible.update({
      where: { id: stockId },
      data: { 
        quantity,
        updatedAt: new Date(),
      },
    });
    return { success: true, data: stock };
  } catch (error) {
    console.error("Error updating stock quantity:", error);
    return { success: false, error: "Failed to update stock" };
  }
}

export async function deleteStockDisponible(stockId: string) {
  try {
    await prisma.stockDisponible.delete({
      where: { id: stockId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting stock:", error);
    return { success: false, error: "Failed to delete stock" };
  }
}

export async function getStockStatistics() {
  try {
    const totalStock = await prisma.stockDisponible.aggregate({
      _sum: {
        quantity: true,
      },
    });

    const stockByModel = await prisma.stockDisponible.groupBy({
      by: ["voitureModelId"],
      _sum: {
        quantity: true,
      },
    });

    const stockByColor = await prisma.stockDisponible.groupBy({
      by: ["couleur"],
      _sum: {
        quantity: true,
      },
    });

    const stockByMotorisation = await prisma.stockDisponible.groupBy({
      by: ["motorisation"],
      _sum: {
        quantity: true,
      },
    });

    return {
      success: true,
      data: {
        totalVehicles: totalStock._sum.quantity || 0,
        byModel: stockByModel.length,
        byColor: stockByColor,
        byMotorisation: stockByMotorisation,
      },
    };
  } catch (error) {
    console.error("Error fetching stock statistics:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

export async function attributeSparePart(data: {
  sparePartId: string;
  equipeId: string;
  ordreMontageId: string;
  quantity: number;
}) {
  try {
    // First, find or create MontageSparePart for the ordreMontage
    // But since ordreMontage has montages, and montages have montageSpareParts,
    // For simplicity, assume we create MontageSparePartAttribution directly
    // But the model requires montageSparePartId

    // Perhaps find the montage for the ordreMontage
    const ordreMontage = await prisma.ordreMontage.findUnique({
      where: { id: data.ordreMontageId },
      include: { Montage: true },
    });

    if (!ordreMontage || ((ordreMontage as unknown) as { Montage: unknown[] }).Montage.length === 0) {
      return {
        success: false,
        error: "No montage found for this ordreMontage",
      };
    }

    const montage = ((ordreMontage as unknown) as { Montage: Array<{ id: string }> }).Montage[0]; // Assume first montage

    // Find or create MontageSparePart
    let montageSparePart = await prisma.montageSparePart.findFirst({
      where: { montageId: montage.id },
    });

    if (!montageSparePart) {
      montageSparePart = await prisma.montageSparePart.create({
        data: {
          id: crypto.randomUUID(),
          montageId: montage.id,
          qte_commandee: data.quantity.toString(),
          qte_attribue: data.quantity.toString(),
          equipe_montage: data.equipeId,
          updatedAt: new Date(),
        },
      });
    }

    // Create MontageSparePartAttribution
    const attribution = await prisma.montageSparePartAttribution.create({
      data: {
        id: crypto.randomUUID(),
        equipeId: data.equipeId,
        montageSparePartId: (montageSparePart as { id: string }).id,
        updatedAt: new Date(),
        SparePart: {
          connect: { id: data.sparePartId },
        },
      },
    });

    // Update SparePart quantity
    const sparePart = await prisma.sparePart.findUnique({
      where: { id: data.sparePartId },
    });

    if (sparePart) {
      await prisma.sparePart.update({
        where: { id: data.sparePartId },
        data: {
          quantity: sparePart.quantity - data.quantity,
          etapeSparePart: "ATTRIBUE",
          updatedAt: new Date(),
        },
      });
    }

    return { success: true, data: attribution };
  } catch (error) {
    console.error("Error attributing spare part:", error);
    return { success: false, error: "Failed to attribute spare part" };
  }
}

export async function saveSparePartAttribution(data: {
  equipeId: string;
  montageId: string;
  spareParts: { id: string; quantity: number }[];
}) {
  try {
    // Create or find MontageSparePart
    let montageSparePart = await prisma.montageSparePart.findFirst({
      where: { montageId: data.montageId },
    });

    if (!montageSparePart) {
      montageSparePart = await prisma.montageSparePart.create({
        data: {
          id: crypto.randomUUID(),
          montageId: data.montageId,
          qte_commandee: "0",
          qte_attribue: "0",
          equipe_montage: data.equipeId,
          updatedAt: new Date(),
        },
      });
    }

    // Create attributions for each spare part
    for (const sp of data.spareParts) {
      const sparePart = await prisma.sparePart.findUnique({
        where: { id: sp.id },
      });

      if (sparePart && sparePart.quantity >= sp.quantity) {
        // Create attribution
        await prisma.montageSparePartAttribution.create({
          data: {
            id: crypto.randomUUID(),
            equipeId: data.equipeId,
            montageSparePartId: montageSparePart.id,
            updatedAt: new Date(),
            SparePart: {
              connect: { id: sp.id },
            },
          },
        });

        // Update spare part quantity
        await prisma.sparePart.update({
          where: { id: sp.id },
          data: {
            quantity: sparePart.quantity - sp.quantity,
            etapeSparePart: "ATTRIBUE",
            updatedAt: new Date(),
          },
        });
      }
    }

    revalidatePath("/magasinier/attributionpieces");
    revalidatePath(`/magasinier/attributionpieces/${data.equipeId}`);
    return { success: true, message: "Attribution enregistrée avec succès" };
  } catch (error) {
    console.error("Error saving spare part attribution:", error);
    return { success: false, error: "Failed to save attribution" };
  }
}
