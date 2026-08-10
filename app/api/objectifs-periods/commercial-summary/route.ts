import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";

export const dynamic = "force-dynamic";

export interface VenteRealiseeItem {
  voitureModel: string;
  quantity: number;
  prixUnitaire: number;
  total: number;
}

export interface PeriodSummaryRow {
  periodId: string;
  periodStart: string;
  periodEnd: string;
  periodDuree: string;
  objectifPoleCible: string | null;
  objectifCible: string | null;
  objectifVehiculesCible: string | null;
  objectifFinancieresCible: string | null;
  clientProspectsCount: number;
  clientEntrepriseProspectsCount: number;
  factureCount: number;
  ventesRealisees: VenteRealiseeItem[];
  ventesRealiseesTotal: number;
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Non autorisé", data: [] },
        { status: 401 }
      );
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé", data: [] },
        { status: 404 }
      );
    }

    const dbUserId = userResult.data.id;

    // Get periods where the user owns the period OR has related data
    const periodIdsFromRelations = await executeWithRetry(async () => {
      const [poles, cibles, vehicules, financieres] = await Promise.all([
        prisma.objectifPole.findMany({
          where: { userId: dbUserId },
          select: { objectifPeriodId: true },
        }),
        prisma.objectifCible.findMany({
          where: { userId: dbUserId },
          select: { periodId: true },
        }),
        prisma.objectifsvehicules.findMany({
          where: { userId: dbUserId },
          select: { objectifPeriodId: true },
        }),
        prisma.objectifsfinancieres.findMany({
          where: { userId: dbUserId },
          select: { objectifPeriodId: true },
        }),
      ]);
      const ids = new Set<string>();
      for (const r of poles) if (r.objectifPeriodId) ids.add(r.objectifPeriodId);
      for (const r of cibles) if (r.periodId) ids.add(r.periodId);
      for (const r of vehicules) if (r.objectifPeriodId) ids.add(r.objectifPeriodId);
      for (const r of financieres) if (r.objectifPeriodId) ids.add(r.objectifPeriodId);
      return Array.from(ids);
    });

    const whereClause =
      periodIdsFromRelations.length > 0
        ? {
            OR: [
              { userId: dbUserId },
              { id: { in: periodIdsFromRelations } },
            ],
          }
        : { userId: dbUserId };

    const periods = await executeWithRetry(() =>
      prisma.objectifPeriod.findMany({
        where: whereClause,
        orderBy: { objectif_start: "desc" },
        include: {
          ObjectifPole: {
            where: { userId: dbUserId },
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { objectifPoleCible: true },
          },
          ObjectifCible: {
            where: { userId: dbUserId },
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { prospectCible: true },
          },
          Objectifsvehicules: {
            where: { userId: dbUserId },
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { objectif_cible: true },
          },
          Objectifsfinancieres: {
            where: { userId: dbUserId },
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { objectif_cible: true },
          },
        },
      })
    );

    const data: PeriodSummaryRow[] = await Promise.all(
      periods.map(async (p) => {
        const [clientCount, clientEntrepriseCount, factureCount] = await Promise.all([
          prisma.client.count({
            where: {
              userId: dbUserId,
              status_client: "PROSPECT",
              createdAt: {
                gte: p.objectif_start,
                lte: p.objectif_end,
              },
            },
          }),
          prisma.client_entreprise.count({
            where: {
              userId: dbUserId,
              status_client: "PROSPECT",
              createdAt: {
                gte: p.objectif_start,
                lte: p.objectif_end,
              },
            },
          }),
          prisma.facture.count({
            where: {
              userId: dbUserId,
              status_facture: "FACTURE",
              createdAt: {
                gte: p.objectif_start,
                lte: p.objectif_end,
              },
            },
          }),
        ]);
        return {
          periodId: p.id,
          periodStart: p.objectif_start.toISOString(),
          periodEnd: p.objectif_end.toISOString(),
          periodDuree: p.objectif_duree || "",
          objectifPoleCible: p.ObjectifPole[0]?.objectifPoleCible ?? null,
          objectifCible: p.ObjectifCible[0]?.prospectCible != null ? String(p.ObjectifCible[0].prospectCible) : null,
          objectifVehiculesCible: p.Objectifsvehicules[0]?.objectif_cible ?? null,
          objectifFinancieresCible: p.Objectifsfinancieres[0]?.objectif_cible ?? null,
          clientProspectsCount: clientCount,
          clientEntrepriseProspectsCount: clientEntrepriseCount,
          factureCount,
          ventesRealisees: [],
          ventesRealiseesTotal: 0,
        };
      })
    );

    // Fetch ventes réalisées for each period
    const factureWhere = {
      userId: dbUserId,
      status_facture: "FACTURE" as const,
    };

    for (const row of data) {
      const periodStart = new Date(row.periodStart);
      const periodEnd = new Date(row.periodEnd);

      const factures = await prisma.facture.findMany({
        where: {
          ...factureWhere,
          createdAt: { gte: periodStart, lte: periodEnd },
        },
        include: {
          FactureLigne: {
            include: { VoitureModel: { select: { model: true } } },
          },
          Voiture: {
            include: { VoitureModel: { select: { model: true } } },
          },
        },
      });

      const byModel = new Map<string, { quantity: number; total: number }>();

      for (const f of factures) {
        if (f.FactureLigne.length > 0) {
          for (const ligne of f.FactureLigne) {
            const model = ligne.VoitureModel?.model ?? "—";
            const qty = ligne.nbr_voiture;
            const total = Number(ligne.montant_ligne);
            const existing = byModel.get(model);
            if (existing) {
              existing.quantity += qty;
              existing.total += total;
            } else {
              byModel.set(model, { quantity: qty, total });
            }
          }
        } else if (f.Voiture?.VoitureModel) {
          const model = f.Voiture.VoitureModel.model;
          const qty = f.nbr_voiture_commande;
          const total = Number(f.montant_ht);
          const existing = byModel.get(model);
          if (existing) {
            existing.quantity += qty;
            existing.total += total;
          } else {
            byModel.set(model, { quantity: qty, total });
          }
        }
      }

      const items: VenteRealiseeItem[] = Array.from(byModel.entries()).map(
        ([voitureModel, { quantity, total }]) => ({
          voitureModel,
          quantity,
          prixUnitaire: quantity > 0 ? total / quantity : 0,
          total,
        })
      );

      row.ventesRealisees = items;
      row.ventesRealiseesTotal = items.reduce((s, i) => s + i.total, 0);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching commercial objectifs summary:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Échec du chargement",
        data: [],
      },
      { status: 500 }
    );
  }
}
