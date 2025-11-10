"use server";

import { prisma } from "@/lib/prisma";

export async function getAllStockDisponible() {
  try {
    const stock = await prisma.stockDisponible.findMany({
      include: {
        voitureModel: {
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
        createdAt: 'desc',
      },
    });

    return { success: true, data: stock };
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
        voitureModel: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: stock };
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
        },
      });
      return { success: true, data: updatedStock };
    } else {
      // Create new stock entry
      const stock = await prisma.stockDisponible.create({
        data: {
          voitureModelId: data.voitureModelId,
          couleur: data.couleur,
          motorisation: data.motorisation,
          transmission: data.transmission,
          quantity: data.quantity,
          acquisitionDate: data.acquisitionDate || new Date(),
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
      data: { quantity },
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
      by: ['voitureModelId'],
      _sum: {
        quantity: true,
      },
    });

    const stockByColor = await prisma.stockDisponible.groupBy({
      by: ['couleur'],
      _sum: {
        quantity: true,
      },
    });

    const stockByMotorisation = await prisma.stockDisponible.groupBy({
      by: ['motorisation'],
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

