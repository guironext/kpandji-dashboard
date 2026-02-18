"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "../prisma";
import { revalidatePath } from "next/cache";

export async function getObjectifPeriods() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé", data: [] };

    const periods = await executeWithRetry(() =>
      prisma.objectifPeriod.findMany({
      orderBy: { start: "desc" },
      select: { id: true, start: true, end: true },
    })
    );

    return {
      success: true,
      data: periods.map((p) => ({
        id: p.id,
        start: p.start,
        end: p.end,
      })),
    };
  } catch (error) {
    console.error("Error fetching ObjectifPeriods:", error);
    return { success: false, error: "Échec du chargement", data: [] };
  }
}

export async function createObjectifPeriod(data: { start: Date | string; end: Date | string }) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    const start = typeof data.start === "string" ? new Date(data.start) : data.start;
    const end = typeof data.end === "string" ? new Date(data.end) : data.end;

    const period = await executeWithRetry(() =>
      prisma.objectifPeriod.create({
      data: { start, end },
    })
    );
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true, data: { id: period.id } };
  } catch (error) {
    console.error("Error creating ObjectifPeriod:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("P1001") || msg.includes("Can't reach")) {
      return { success: false, error: "Base de données inaccessible. Vérifiez votre connexion." };
    }
    if (msg.includes("does not exist") || msg.includes("P2021")) {
      return { success: false, error: "Table manquante. Exécutez: npx prisma migrate dev" };
    }
    return { success: false, error: msg || "Échec de la création" };
  }
}

export async function deleteObjectifPeriod(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    await executeWithRetry(() => prisma.objectifPeriod.delete({ where: { id } }));
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true };
  } catch (error) {
    console.error("Error deleting ObjectifPeriod:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("P1001") || msg.includes("Can't reach")) {
      return { success: false, error: "Base de données inaccessible. Vérifiez votre connexion." };
    }
    if (msg.includes("Record to delete does not exist") || msg.includes("P2025")) {
      return { success: false, error: "Cette période n'existe plus." };
    }
    return { success: false, error: msg || "Échec de la suppression" };
  }
}
