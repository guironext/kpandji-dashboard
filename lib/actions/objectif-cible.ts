"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "../prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

export async function getObjectifsCibles() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé", data: [] };

    const objectifs = await executeWithRetry(() =>
      prisma.objectifCible.findMany({
      where: { user: { role: "COMMERCIAL" } },
      orderBy: [{ period: { objectif_start: "desc" } }, { user: { firstName: "asc" } }],
      include: {
        period: { select: { id: true, objectif_start: true, objectif_end: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })
    );

    return {
      success: true,
      data: objectifs.map((o) => ({
        id: o.id,
        periodId: o.periodId,
        userId: o.userId,
        commercialName: `${o.user.firstName} ${o.user.lastName}`.trim(),
        periodStart: o.period.objectif_start,
        periodEnd: o.period.objectif_end,
        prospectCible: o.prospectCible,
        prospectReel: o.prospectReel,
        tauxAtteint: Number(o.tauxAtteint),
      })),
    };
  } catch (error) {
    console.error("Error fetching ObjectifsCibles:", error);
    return { success: false, error: "Échec du chargement", data: [] };
  }
}

export async function createObjectifCible(data: {
  periodId: string;
  userId: string;
  prospectCible: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    const existing = await executeWithRetry(() =>
      prisma.objectifCible.findUnique({
      where: { periodId_userId: { periodId: data.periodId, userId: data.userId } },
    })
    );
    if (existing) {
      return {
        success: false,
        error: "Un objectif existe déjà pour ce commercial sur cette période.",
      };
    }

    await executeWithRetry(() =>
      prisma.objectifCible.create({
      data: {
        periodId: data.periodId,
        userId: data.userId,
        prospectCible: data.prospectCible,
        prospectReel: 0,
        tauxAtteint: new Decimal(0),
      },
    })
    );
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true };
  } catch (error) {
    console.error("Error creating ObjectifCible:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec de la création",
    };
  }
}
