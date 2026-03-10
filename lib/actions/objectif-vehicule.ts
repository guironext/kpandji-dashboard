"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";

export type ObjectifVehiculeByPeriod = {
  objectifPeriodId: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  objectifCible: number;
  ventesRealisees: number;
  objectifs: Array<{
    id: string;
    objectifCible: string;
    objectifReelAtteint: string | null;
    ventesRealisees: number;
    pourcentageAtteint: number | null;
  }>;
};

/**
 * Fetches all Objectifsvehicules for the current commercial, grouped by objectifPeriod.
 * Ventes réalisées = sum of vehicle count from factures with status_facture=FACTURE created by current user, within period.
 */
export async function getObjectifsVehiculesByCurrentCommercial(): Promise<{
  success: boolean;
  data?: ObjectifVehiculeByPeriod[];
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
      prisma.objectifsvehicules.findMany({
        where: { userId: user.id },
        orderBy: [{ objectifPeriodId: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          objectif_cible: true,
          objectif_reel_atteint: true,
          objectifPeriodId: true,
          ObjectifPeriod: {
            select: { id: true, objectif_start: true, objectif_end: true },
          },
        },
      }),
      prisma.facture.findMany({
        where: {
          userId: user.id,
          status_facture: "FACTURE",
        },
        select: {
          createdAt: true,
          nbr_voiture_commande: true,
          FactureLigne: { select: { nbr_voiture: true } },
        },
      }),
    ]);

    const vehicleCountByPeriodId = new Map<string, number>();
    for (const f of factures) {
      const d = f.createdAt;
      for (const o of objectifs) {
        const period = o.ObjectifPeriod;
        if (!period) continue;
        if (d >= period.objectif_start && d <= period.objectif_end) {
          const vehicleCount =
            f.FactureLigne.length > 0
              ? f.FactureLigne.reduce((s, l) => s + l.nbr_voiture, 0)
              : f.nbr_voiture_commande;
          const current = vehicleCountByPeriodId.get(period.id) ?? 0;
          vehicleCountByPeriodId.set(period.id, current + vehicleCount);
          break;
        }
      }
    }

    const byPeriod = new Map<
      string,
      {
        periodLabel: string;
        periodStart: string;
        periodEnd: string;
        objectifs: ObjectifVehiculeByPeriod["objectifs"];
      }
    >();

    for (const o of objectifs) {
      const period = o.ObjectifPeriod;
      if (!period) continue;

      const periodId = period.id;
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

      const ventesRealisees = vehicleCountByPeriodId.get(periodId) ?? 0;
      const objectifCibleNum = parseFloat(String(o.objectif_cible || "0").replace(/\s/g, "")) || 0;
      const pourcentageAtteint =
        objectifCibleNum > 0
          ? Math.round((ventesRealisees / objectifCibleNum) * 1000) / 10
          : null;

      if (!byPeriod.has(periodId)) {
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
        objectifCible: o.objectif_cible || "—",
        objectifReelAtteint: o.objectif_reel_atteint,
        ventesRealisees,
        pourcentageAtteint,
      });
    }

    const data: ObjectifVehiculeByPeriod[] = Array.from(byPeriod.entries()).map(
      ([objectifPeriodId, { periodLabel, periodStart, periodEnd, objectifs }]) => {
        const totalCible = objectifs.reduce((sum, obj) => {
          const c = parseFloat(String(obj.objectifCible).replace(/\s/g, "")) || 0;
          return sum + c;
        }, 0);
        const ventesRealisees = objectifs[0]?.ventesRealisees ?? 0;
        return {
          objectifPeriodId,
          periodLabel,
          periodStart,
          periodEnd,
          objectifCible: totalCible,
          ventesRealisees,
          objectifs,
        };
      }
    );

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching Objectifsvehicules by current commercial:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec du chargement",
    };
  }
}
