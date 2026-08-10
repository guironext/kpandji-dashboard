"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "../prisma";
import { getOrCreateUser } from "./user";
import { revalidatePath } from "next/cache";

function formatDuree(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 31) return `${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  const months = Math.round(diffDays / 30);
  return `${months} mois`;
}

export async function getObjectifPeriods() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé", data: [] };

    const periods = await executeWithRetry(() =>
      prisma.objectifPeriod.findMany({
        orderBy: { objectif_start: "desc" },
        select: { id: true, objectif_start: true, objectif_end: true },
      })
    );

    return {
      success: true,
      data: periods.map((p) => ({
        id: p.id,
        start: p.objectif_start,
        end: p.objectif_end,
      })),
    };
  } catch (error) {
    console.error("Error fetching ObjectifPeriods:", error);
    return { success: false, error: "Échec du chargement", data: [] };
  }
}

export async function createObjectifPeriod(data: {
  start: Date | string;
  end: Date | string;
  duree?: string;
  objectifFinanciere?: string;
  objectifClients?: string;
  volumeVehicule?: string;
}) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Non autorisé" };

    const startDate = typeof data.start === "string" ? new Date(data.start) : data.start;
    const endDate = typeof data.end === "string" ? new Date(data.end) : data.end;

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const objectif_duree =
      typeof data.duree === "string" && data.duree.trim()
        ? data.duree.trim()
        : formatDuree(startDate, endDate);

    const period = await executeWithRetry(() =>
      prisma.objectifPeriod.create({
        data: {
          objectif_start: startDate,
          objectif_end: endDate,
          objectif_duree,
          objectifs_financieres: typeof data.objectifFinanciere === "string" ? data.objectifFinanciere : "",
          objectifs_vehicules: typeof data.volumeVehicule === "string" ? data.volumeVehicule : "",
          objectifs_clients: typeof data.objectifClients === "string" ? data.objectifClients : "",
          userId: userResult.data.id,
        },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return {
      success: true,
      data: {
        id: period.id,
        start: period.objectif_start,
        end: period.objectif_end,
      },
    };
  } catch (error) {
    console.error("Error creating ObjectifPeriod:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isDbError =
      msg.includes("P1001") ||
      msg.includes("Can't reach") ||
      msg.includes("E57P01") ||
      msg.includes("administrator command") ||
      msg.includes("terminating connection");
    if (isDbError) {
      return { success: false, error: "Base de données inaccessible. Vérifiez votre connexion et réessayez." };
    }
    if (msg.includes("does not exist") || msg.includes("P2021")) {
      return { success: false, error: "Table manquante. Exécutez: npx prisma migrate deploy" };
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
