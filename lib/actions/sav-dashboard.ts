"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "./user";
import type {
  StatutMaintenance,
  StatutReparation,
  StatutVoitureSAV,
  StatusFacture,
} from "@prisma/client";

export type ChartDatum = {
  label: string;
  value: number;
  color: string;
};

export type MonthlySavTrend = {
  monthKey: string;
  monthLabel: string;
  monthShort: string;
  voitures: number;
  diagnostics: number;
  reparations: number;
};

export type RecentVoitureSav = {
  id: string;
  model: string;
  immatriculation: string;
  statut: string;
  clientName: string;
  createdAt: string;
};

export type RecentMaintenance = {
  id: string;
  nom: string;
  statut: string;
  voitureModel: string;
  immatriculation: string;
  createdAt: string;
};

export type SavDashboardStats = {
  clientsTotal: number;
  voituresTotal: number;
  voituresEnAtelier: number;
  voituresTerminees: number;
  diagnosticsTotal: number;
  reparationsTotal: number;
  reparationsEnCours: number;
  maintenancesTotal: number;
  maintenancesEnCours: number;
  piecesTotal: number;
  piecesStockFaible: number;
  facturesTotal: number;
  facturesEnAttente: number;
  caMois: number;
  caTotal: number;
  personnelTotal: number;
};

export type SavDashboardData = {
  stats: SavDashboardStats;
  monthlyTrends: MonthlySavTrend[];
  voituresByStatut: ChartDatum[];
  reparationsByStatut: ChartDatum[];
  facturesByStatus: ChartDatum[];
  recentVoitures: RecentVoitureSav[];
  recentMaintenances: RecentMaintenance[];
};

const CHART_COLORS = [
  "#0d9488",
  "#0891b2",
  "#0284c7",
  "#059669",
  "#d97706",
  "#db2777",
  "#6366f1",
  "#475569",
  "#14b8a6",
  "#f97316",
] as const;

const VOITURE_STATUT_LABELS: Record<StatutVoitureSAV, string> = {
  ARRIVE: "Arrivée",
  EN_TRAITEMENT: "En traitement",
  TESTE: "Testée",
  TERMINE: "Terminée",
  ANNULE: "Annulée",
};

const REPARATION_STATUT_LABELS: Record<StatutReparation, string> = {
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  TESTE: "Testée",
  TERMINE: "Terminée",
  ANNULE: "Annulée",
  EN_MAINTENANCE: "En maintenance",
};

const MAINTENANCE_STATUT_LABELS: Record<StatutMaintenance, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULE: "Annulée",
};

const FACTURE_STATUS_LABELS: Record<StatusFacture, string> = {
  EN_ATTENTE: "En attente",
  PROFORMA: "Proforma",
  FACTURE: "Facture",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};

const VOITURES_EN_ATELIER: StatutVoitureSAV[] = ["ARRIVE", "EN_TRAITEMENT", "TESTE"];
const REPARATIONS_EN_COURS: StatutReparation[] = [
  "EN_ATTENTE",
  "EN_TRAITEMENT",
  "TESTE",
  "EN_MAINTENANCE",
];
const MAINTENANCES_EN_COURS: StatutMaintenance[] = ["EN_ATTENTE", "EN_COURS"];
const FACTURES_EN_ATTENTE: StatusFacture[] = ["EN_ATTENTE", "PROFORMA"];

function buildMonthlyKeys(months: number) {
  const result: { monthKey: string; monthLabel: string; monthShort: string; start: Date; end: Date }[] =
    [];
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

function toChartData<T extends string>(
  groups: { key: T; count: number }[],
  labels: Record<T, string>
): ChartDatum[] {
  return groups
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((g, index) => ({
      label: labels[g.key] ?? g.key.replace(/_/g, " ").toLowerCase(),
      value: g.count,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
}

function decimalToNumber(value: { toNumber(): number } | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

export async function getSavDashboardData(): Promise<{
  success: boolean;
  data?: SavDashboardData;
  error?: string;
}> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkUser.id);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: userResult.error || "Utilisateur non trouvé" };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthlyKeys = buildMonthlyKeys(6);
    const earliestMonth = monthlyKeys[0].start;

    const [
      clientsTotal,
      voituresTotal,
      voituresEnAtelier,
      voituresTerminees,
      diagnosticsTotal,
      reparationsTotal,
      reparationsEnCours,
      maintenancesTotal,
      maintenancesEnCours,
      piecesTotal,
      piecesStockFaible,
      facturesTotal,
      facturesEnAttente,
      personnelTotal,
      voituresByStatutRaw,
      reparationsByStatutRaw,
      facturesByStatusRaw,
      voituresMonthlyRaw,
      diagnosticsMonthlyRaw,
      reparationsMonthlyRaw,
      facturesMoisRaw,
      facturesTotalRaw,
      recentVoituresRaw,
      recentMaintenancesRaw,
    ] = await Promise.all([
      prisma.clientSAV.count(),
      prisma.voitureSAV.count(),
      prisma.voitureSAV.count({ where: { statut: { in: VOITURES_EN_ATELIER } } }),
      prisma.voitureSAV.count({ where: { statut: "TERMINE" } }),
      prisma.diagnosticArrivee.count(),
      prisma.reparation.count(),
      prisma.reparation.count({ where: { statut: { in: REPARATIONS_EN_COURS } } }),
      prisma.maintenance.count(),
      prisma.maintenance.count({ where: { statut: { in: MAINTENANCES_EN_COURS } } }),
      prisma.pieceSAV.count(),
      prisma.pieceSAV.count({ where: { quantite_restante: { lte: 5 } } }),
      prisma.factureProformaSAV.count(),
      prisma.factureProformaSAV.count({
        where: { statut_facture: { in: FACTURES_EN_ATTENTE } },
      }),
      prisma.personnelSAV.count(),
      prisma.voitureSAV.groupBy({ by: ["statut"], _count: { _all: true } }),
      prisma.reparation.groupBy({ by: ["statut"], _count: { _all: true } }),
      prisma.factureProformaSAV.groupBy({ by: ["statut_facture"], _count: { _all: true } }),
      prisma.voitureSAV.findMany({
        where: { createdAt: { gte: earliestMonth } },
        select: { createdAt: true },
      }),
      prisma.diagnosticArrivee.findMany({
        where: { createdAt: { gte: earliestMonth } },
        select: { createdAt: true },
      }),
      prisma.reparation.findMany({
        where: { createdAt: { gte: earliestMonth } },
        select: { createdAt: true },
      }),
      prisma.factureProformaSAV.findMany({
        where: { date_facture: { gte: startOfMonth, lte: endOfMonth } },
        select: { total_ttc: true },
      }),
      prisma.factureProformaSAV.findMany({ select: { total_ttc: true } }),
      prisma.voitureSAV.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          model: true,
          immatriculation: true,
          statut: true,
          createdAt: true,
          ClientSAV: { select: { nom: true, prenom: true } },
        },
      }),
      prisma.maintenance.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          nom: true,
          statut: true,
          createdAt: true,
          reparation: {
            select: {
              voitureSAV: { select: { model: true, immatriculation: true } },
            },
          },
        },
      }),
    ]);

    const monthlyTrends: MonthlySavTrend[] = monthlyKeys.map(
      ({ monthKey, monthLabel, monthShort, start, end }) => ({
        monthKey,
        monthLabel,
        monthShort,
        voitures: voituresMonthlyRaw.filter((v) => v.createdAt >= start && v.createdAt <= end).length,
        diagnostics: diagnosticsMonthlyRaw.filter((d) => d.createdAt >= start && d.createdAt <= end)
          .length,
        reparations: reparationsMonthlyRaw.filter((r) => r.createdAt >= start && r.createdAt <= end)
          .length,
      })
    );

    const voituresByStatut = toChartData(
      voituresByStatutRaw.map((g) => ({ key: g.statut, count: g._count._all })),
      VOITURE_STATUT_LABELS
    );

    const reparationsByStatut = toChartData(
      reparationsByStatutRaw.map((g) => ({ key: g.statut, count: g._count._all })),
      REPARATION_STATUT_LABELS
    );

    const facturesByStatus = toChartData(
      facturesByStatusRaw.map((g) => ({ key: g.statut_facture, count: g._count._all })),
      FACTURE_STATUS_LABELS
    );

    const recentVoitures: RecentVoitureSav[] = recentVoituresRaw.map((v) => ({
      id: v.id,
      model: v.model,
      immatriculation: v.immatriculation,
      statut: VOITURE_STATUT_LABELS[v.statut],
      clientName: `${v.ClientSAV.prenom} ${v.ClientSAV.nom}`.trim(),
      createdAt: v.createdAt.toISOString(),
    }));

    const recentMaintenances: RecentMaintenance[] = recentMaintenancesRaw.map((m) => ({
      id: m.id,
      nom: m.nom,
      statut: MAINTENANCE_STATUT_LABELS[m.statut],
      voitureModel: m.reparation.voitureSAV.model,
      immatriculation: m.reparation.voitureSAV.immatriculation,
      createdAt: m.createdAt.toISOString(),
    }));

    const caMois = facturesMoisRaw.reduce((sum, f) => sum + decimalToNumber(f.total_ttc), 0);
    const caTotal = facturesTotalRaw.reduce((sum, f) => sum + decimalToNumber(f.total_ttc), 0);

    return {
      success: true,
      data: {
        stats: {
          clientsTotal,
          voituresTotal,
          voituresEnAtelier,
          voituresTerminees,
          diagnosticsTotal,
          reparationsTotal,
          reparationsEnCours,
          maintenancesTotal,
          maintenancesEnCours,
          piecesTotal,
          piecesStockFaible,
          facturesTotal,
          facturesEnAttente,
          caMois,
          caTotal,
          personnelTotal,
        },
        monthlyTrends,
        voituresByStatut,
        reparationsByStatut,
        facturesByStatus,
        recentVoitures,
        recentMaintenances,
      },
    };
  } catch (error) {
    console.error("getSavDashboardData:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement",
    };
  }
}
