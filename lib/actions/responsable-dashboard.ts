"use server";

import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "./user";
import { prisma } from "../prisma";
import { getTableauChuteRendezVousByObjectifPeriodAndCommercial } from "./tableau-chute";
import {
  getRapportRendezVousByObjectifPeriod,
  getObjectifsCibleByPeriodAndCommercial,
  getObjectifsFinancieresByPoleAndCommercial,
  getObjectifsVehiculesByPeriodAndCommercial,
} from "./rapport-rendez-vous-analytics";
import { getObjectifPeriods } from "./objectif-period";
import type { ChartDatum, MonthlyClientTrend } from "./commercial-dashboard";

export type ResponsableMonthlyTrend = MonthlyClientTrend & { ca: number };

export type ResponsableDashboardStats = {
  commercialsCount: number;
  periodsCount: number;
  totalChutes: number;
  totalCommercialsWithChutes: number;
  totalRapportsProspects: number;
  totalRapportsClients: number;
  totalRapports: number;
  objectifsCibleCount: number;
  objectifsFinancieresCount: number;
  objectifsVehiculesCount: number;
  prospectsCount: number;
  clientsCount: number;
  facturesEnAttenteCount: number;
  facturesValideesCount: number;
  proformasEnAttente: number;
  caMois: number;
  caTotal: number;
  currentPeriodLabel: string | null;
};

export type ResponsableDashboardData = {
  stats: ResponsableDashboardStats;
  monthlyTrends: ResponsableMonthlyTrend[];
  chutesByCommercial: ChartDatum[];
  rapportBreakdown: ChartDatum[];
  facturesByStatus: ChartDatum[];
  objectifsBreakdown: ChartDatum[];
};

/** @deprecated Use ResponsableDashboardStats via data.stats */
export type ResponsableDashboardDataLegacy = ResponsableDashboardStats;

const CHART_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#db2777",
  "#0284c7",
  "#d97706",
  "#475569",
] as const;

const FACTURE_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  PROFORMA: "Proforma",
  FACTURE: "Facture",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};

function buildMonthlyKeys(months: number) {
  const result: { monthKey: string; monthLabel: string; monthShort: string; start: Date; end: Date }[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
    const monthShort = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
    result.push({ monthKey, monthLabel, monthShort, start, end });
  }

  return result;
}

export async function getResponsableDashboard(): Promise<{
  success: boolean;
  data?: ResponsableDashboardData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const allowedRoles = ["RESPONSABLE_COMMERCIAL", "ADMIN"];
    if (!allowedRoles.includes(userResult.data.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthlyKeys = buildMonthlyKeys(6);
    const earliestMonth = monthlyKeys[0].start;

    const [
      periodsResult,
      chuteResult,
      rapportResult,
      cibleResult,
      financieresResult,
      vehiculesResult,
    ] = await Promise.all([
      getObjectifPeriods(),
      getTableauChuteRendezVousByObjectifPeriodAndCommercial(),
      getRapportRendezVousByObjectifPeriod(),
      getObjectifsCibleByPeriodAndCommercial(),
      getObjectifsFinancieresByPoleAndCommercial(),
      getObjectifsVehiculesByPeriodAndCommercial(),
    ]);

    const periodsCount = periodsResult.success && periodsResult.data ? periodsResult.data.length : 0;

    let totalChutes = 0;
    let totalCommercialsWithChutes = 0;
    const chutesByCommercial: ChartDatum[] = [];

    if (chuteResult.success && chuteResult.data?.periods?.length) {
      const currentPeriod = chuteResult.data.periods[0];
      for (const period of chuteResult.data.periods) {
        totalChutes += period.commercials.reduce(
          (sum: number, comm: { totalChutes: number }) => sum + comm.totalChutes,
          0
        );
      }
      totalCommercialsWithChutes = new Set(
        chuteResult.data.periods.flatMap((period) =>
          period.commercials.map((comm) => comm.commercialId)
        )
      ).size;

      currentPeriod.commercials
        .filter((c) => c.totalChutes > 0)
        .sort((a, b) => b.totalChutes - a.totalChutes)
        .slice(0, 8)
        .forEach((c, index) => {
          chutesByCommercial.push({
            label: c.commercialName,
            value: c.totalChutes,
            color: CHART_COLORS[index % CHART_COLORS.length],
          });
        });
    }

    let totalRapportsProspects = 0;
    let totalRapportsClients = 0;
    if (rapportResult.success && rapportResult.data?.periods) {
      for (const p of rapportResult.data.periods) {
        totalRapportsProspects += p.prospects.length;
        totalRapportsClients += p.clients.length;
      }
    }
    const totalRapports = totalRapportsProspects + totalRapportsClients;

    const objectifsCibleCount = cibleResult.success && cibleResult.data ? cibleResult.data.length : 0;
    const objectifsFinancieresCount =
      financieresResult.success && financieresResult.data ? financieresResult.data.length : 0;
    const objectifsVehiculesCount =
      vehiculesResult.success && vehiculesResult.data ? vehiculesResult.data.length : 0;

    const [
      commercialsCount,
      clientProspects,
      clientClients,
      entrepriseProspects,
      entrepriseClients,
      facturesEnAttente,
      facturesValidees,
      proformasEnAttente,
      clientsRaw,
      clientEntreprisesRaw,
      rendezVousMonthlyRaw,
      facturesRaw,
      facturesByStatusRaw,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "COMMERCIAL" } }),
      prisma.client.count({ where: { status_client: "PROSPECT" } }),
      prisma.client.count({ where: { status_client: "CLIENT" } }),
      prisma.client_entreprise.count({ where: { status_client: "PROSPECT" } }),
      prisma.client_entreprise.count({ where: { status_client: "CLIENT" } }),
      prisma.facture.count({ where: { status_facture: "EN_ATTENTE" } }),
      prisma.facture.count({ where: { status_facture: "FACTURE" } }),
      prisma.facture.count({ where: { status_facture: "PROFORMA" } }),
      prisma.client.findMany({
        where: { status_client: { in: ["PROSPECT", "CLIENT"] } },
        select: { createdAt: true },
      }),
      prisma.client_entreprise.findMany({
        where: { status_client: { in: ["PROSPECT", "CLIENT"] } },
        select: { createdAt: true },
      }),
      prisma.rendezVous.findMany({
        where: { date: { gte: earliestMonth } },
        select: { date: true },
      }),
      prisma.facture.findMany({
        select: { status_facture: true, total_ttc: true, date_facture: true },
      }),
      prisma.facture.groupBy({
        by: ["status_facture"],
        _count: { _all: true },
      }),
    ]);

    const prospectsCountTotal = clientProspects + entrepriseProspects;
    const clientsCountTotal = clientClients + entrepriseClients;

    let currentPeriodLabel: string | null = null;
    if (periodsResult.success && periodsResult.data && periodsResult.data.length > 0) {
      const p = periodsResult.data[0];
      const startStr = new Date(p.start).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const endStr = new Date(p.end).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      currentPeriodLabel = `${startStr} — ${endStr}`;
    }

    const facturesValideesList = facturesRaw.filter((f) => f.status_facture === "FACTURE");

    const monthlyTrends: ResponsableMonthlyTrend[] = monthlyKeys.map(
      ({ monthKey, monthLabel, monthShort, start, end }) => ({
        monthKey,
        monthLabel,
        monthShort,
        clients: clientsRaw.filter((c) => c.createdAt >= start && c.createdAt <= end).length,
        clientEntreprises: clientEntreprisesRaw.filter(
          (c) => c.createdAt >= start && c.createdAt <= end
        ).length,
        rendezVous: rendezVousMonthlyRaw.filter((r) => r.date >= start && r.date <= end).length,
        ca: facturesValideesList
          .filter((f) => f.date_facture >= start && f.date_facture <= end)
          .reduce((sum, f) => sum + Number(f.total_ttc), 0),
      })
    );

    const rapportBreakdown: ChartDatum[] = [
      { label: "Prospects", value: totalRapportsProspects, color: "#2563eb" },
      { label: "Clients", value: totalRapportsClients, color: "#059669" },
    ].filter((d) => d.value > 0);

    const facturesByStatus: ChartDatum[] = facturesByStatusRaw
      .filter((g) => g._count._all > 0)
      .map((g, index) => ({
        label: FACTURE_STATUS_LABELS[g.status_facture] ?? g.status_facture,
        value: g._count._all,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

    const objectifsBreakdown: ChartDatum[] = [
      { label: "Cibles", value: objectifsCibleCount, color: "#2563eb" },
      { label: "Financiers", value: objectifsFinancieresCount, color: "#7c3aed" },
      { label: "Véhicules", value: objectifsVehiculesCount, color: "#059669" },
    ].filter((d) => d.value > 0);

    const caTotal = facturesValideesList.reduce((sum, f) => sum + Number(f.total_ttc), 0);
    const caMois = facturesValideesList
      .filter((f) => f.date_facture >= startOfMonth && f.date_facture <= endOfMonth)
      .reduce((sum, f) => sum + Number(f.total_ttc), 0);

    const data: ResponsableDashboardData = {
      stats: {
        commercialsCount,
        periodsCount,
        totalChutes,
        totalCommercialsWithChutes,
        totalRapportsProspects,
        totalRapportsClients,
        totalRapports,
        objectifsCibleCount,
        objectifsFinancieresCount,
        objectifsVehiculesCount,
        prospectsCount: prospectsCountTotal,
        clientsCount: clientsCountTotal,
        facturesEnAttenteCount: facturesEnAttente,
        facturesValideesCount: facturesValidees,
        proformasEnAttente,
        caMois,
        caTotal,
        currentPeriodLabel,
      },
      monthlyTrends,
      chutesByCommercial,
      rapportBreakdown,
      facturesByStatus,
      objectifsBreakdown,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching responsable dashboard:", error);
    return {
      success: false,
      error: "Échec du chargement du tableau de bord",
    };
  }
}
