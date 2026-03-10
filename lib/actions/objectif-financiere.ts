"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "../prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

export async function updateObjectifFinanciere(
  id: string,
  data: {
    nomDuCommercial: string;
    pole: string;
    duree: string;
    chiffreAffaire: number;
    finObjectif?: string | null;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    const finObjectifDate = data.finObjectif ? new Date(data.finObjectif) : null;
    await executeWithRetry(() =>
      prisma.objectifsfinancieres.update({
      where: { id },
      data: {
        nomDuCommercial: data.nomDuCommercial,
        pole: data.pole,
        duree: data.duree,
        chiffreAffaire: new Decimal(data.chiffreAffaire),
        finObjectif: finObjectifDate,
      },
    })
    );
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true };
  } catch (error) {
    console.error("Error updating ObjectifFinanciere:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec de la modification",
    };
  }
}

export async function deleteObjectifFinanciere(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    await executeWithRetry(() => prisma.objectifsfinancieres.delete({ where: { id } }));
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true };
  } catch (error) {
    console.error("Error deleting ObjectifFinanciere:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec de la suppression",
    };
  }
}

export async function createObjectifFinanciere(data: {
  nomDuCommercial: string;
  pole: string;
  duree: string;
  chiffreAffaire: number;
  finObjectif?: string | null;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    const finObjectifDate = data.finObjectif ? new Date(data.finObjectif) : null;
    const objectif = await executeWithRetry(() =>
      prisma.objectifsfinancieres.create({
      data: {
        nomDuCommercial: data.nomDuCommercial,
        pole: data.pole,
        duree: data.duree,
        chiffreAffaire: new Decimal(data.chiffreAffaire),
        finObjectif: finObjectifDate,
        pourcentageAtteint: new Decimal(0),
      },
    })
    );
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true, data: { id: objectif.id } };
  } catch (error) {
    console.error("Error creating ObjectifFinanciere:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Échec de la création" };
  }
}

export async function getObjectifsFinancieres() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé", data: [] };

    const objectifs = await executeWithRetry(() =>
      prisma.objectifsfinancieres.findMany({
      orderBy: [{ duree: "desc" }, { nomDuCommercial: "asc" }],
      select: {
        id: true,
        nomDuCommercial: true,
        pole: true,
        duree: true,
        chiffreAffaire: true,
        finObjectif: true,
        pourcentageAtteint: true,
        ecartCible: true,
      },
    })
    );
    return {
      success: true,
      data: objectifs.map((o) => ({
        id: o.id,
        nomDuCommercial: o.nomDuCommercial,
        pole: o.pole,
        duree: o.duree,
        chiffreAffaire: Number(o.chiffreAffaire),
        finObjectif: o.finObjectif ? o.finObjectif.toISOString() : null,
        pourcentageAtteint: Number(o.pourcentageAtteint),
        ecartCible: o.ecartCible != null ? Number(o.ecartCible) : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching ObjectifsFinancieres:", error);
    return { success: false, error: "Échec du chargement", data: [] };
  }
}

export type ObjectifFinanciereByPeriod = {
  objectifPeriodId: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  /** Sum of total_ttc of factures with status_facture=FACTURE created by current user, within period */
  factureSumReelAtteint: number;
  objectifs: Array<{
    id: string;
    objectifCible: string | null;
    objectifReelAtteint: string | null;
    objectifPourcentageAtteint: number | null;
    chiffreAffaire: number;
    pourcentageAtteint: number;
    ecartCible: number | null;
  }>;
};

/**
 * Fetches all Objectifsfinancieres for the current commercial, grouped by objectifPeriod.
 */
export async function getObjectifsFinancieresByCurrentCommercial(): Promise<{
  success: boolean;
  data?: ObjectifFinanciereByPeriod[];
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const [objectifs, factures] = await Promise.all([
      executeWithRetry(() =>
        prisma.objectifsfinancieres.findMany({
          where: { userId: user.id, objectifPeriodId: { not: null } },
          orderBy: [{ objectifPeriodId: "asc" }, { createdAt: "desc" }],
          select: {
            id: true,
            objectif_cible: true,
            objectif_reel_atteint: true,
            objectif_pourcentage_atteint: true,
            chiffreAffaire: true,
            pourcentageAtteint: true,
            ecartCible: true,
            objectifPeriodId: true,
            ObjectifPeriod: {
              select: { id: true, objectif_start: true, objectif_end: true },
            },
          },
        })
      ),
      prisma.facture.findMany({
        where: {
          userId: user.id,
          status_facture: "FACTURE",
        },
        select: { date_facture: true, total_ttc: true },
      }),
    ]);

    const factureSumByPeriodId = new Map<string, number>();

    const byPeriod = new Map<
      string,
      {
        periodLabel: string;
        periodStart: string;
        periodEnd: string;
        objectifs: ObjectifFinanciereByPeriod["objectifs"];
      }
    >();

    for (const o of objectifs) {
      const periodId = o.objectifPeriodId!;
      const period = o.ObjectifPeriod;
      if (!period) continue;

      const startStr = period.objectif_start.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const endStr = period.objectif_end.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const periodLabel = `${startStr} – ${endStr}`;

      if (!byPeriod.has(periodId)) {
        const sum = factures
          .filter((f) => {
            const d = f.date_facture;
            return d >= period.objectif_start && d <= period.objectif_end;
          })
          .reduce((s, f) => s + Number(f.total_ttc), 0);
        factureSumByPeriodId.set(periodId, sum);

        byPeriod.set(periodId, {
          periodLabel,
          periodStart: period.objectif_start.toISOString(),
          periodEnd: period.objectif_end.toISOString(),
          objectifs: [],
        });
      }

      const entry = byPeriod.get(periodId)!;
      entry.objectifs.push({
        id: o.id,
        objectifCible: o.objectif_cible,
        objectifReelAtteint: o.objectif_reel_atteint,
        objectifPourcentageAtteint: o.objectif_pourcentage_atteint,
        chiffreAffaire: Number(o.chiffreAffaire),
        pourcentageAtteint: Number(o.pourcentageAtteint),
        ecartCible: o.ecartCible != null ? Number(o.ecartCible) : null,
      });
    }

    const data: ObjectifFinanciereByPeriod[] = Array.from(byPeriod.entries()).map(
      ([objectifPeriodId, { periodLabel, periodStart, periodEnd, objectifs }]) => ({
        objectifPeriodId,
        periodLabel,
        periodStart,
        periodEnd,
        factureSumReelAtteint: factureSumByPeriodId.get(objectifPeriodId) ?? 0,
        objectifs,
      })
    );

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching ObjectifsFinancieres by current commercial:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec du chargement",
    };
  }
}
