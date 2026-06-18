"use server";

import { auth } from "@clerk/nextjs/server";
import { EtapeConteneur, EtapeMontage } from "@prisma/client";
import { prisma } from "../prisma";

export type ChartDatum = {
  label: string;
  value: number;
  color: string;
};

export type MonthlyOperationsTrend = {
  monthKey: string;
  monthLabel: string;
  monthShort: string;
  commandes: number;
  conteneurs: number;
  montagesTermines: number;
};

export type ManagerDashboardData = {
  conteneursCharges: number;
  conteneursTransit: number;
  conteneursArrives: number;
  totalCommandes: number;
  agendaToday: number;
  montagesActifs: number;
  commandesDisponibles: number;
  commandesVendues: number;
  conteneurPipelineChart: ChartDatum[];
  commandesByFlag: ChartDatum[];
  montageByEtape: ChartDatum[];
  monthlyTrends: MonthlyOperationsTrend[];
};

const CHART_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#f59e0b",
  "#db2777",
  "#0284c7",
  "#ea580c",
  "#475569",
] as const;

const MONTAGE_LABELS: Record<EtapeMontage, string> = {
  CREATION: "Création",
  VALIDE: "Validé",
  EXECUTION: "Exécution",
  VERIFICATION: "Vérification",
  CORRECTION: "Correction",
  TERMINEE: "Terminé",
};

function buildMonthlyKeys(months: number) {
  const result: {
    monthKey: string;
    monthLabel: string;
    monthShort: string;
    start: Date;
    end: Date;
  }[] = [];
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

export async function getManagerDashboard(): Promise<{
  success: boolean;
  data?: ManagerDashboardData;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Non authentifié" };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const transitSteps: EtapeConteneur[] = [
      EtapeConteneur.TRANSITE,
      EtapeConteneur.TRANSITE_NON_RENSEIGNE,
      EtapeConteneur.TRANSITE_DEJA_RENSEIGNE,
      EtapeConteneur.RENSEIGNE,
    ];

    const arrivedSteps: EtapeConteneur[] = [
      EtapeConteneur.ARRIVE,
      EtapeConteneur.DEPOTAGE_EN_COURS,
      EtapeConteneur.VERIFIER,
    ];

    const activeMontageSteps: EtapeMontage[] = [
      EtapeMontage.CREATION,
      EtapeMontage.VALIDE,
      EtapeMontage.EXECUTION,
      EtapeMontage.VERIFICATION,
      EtapeMontage.CORRECTION,
    ];

    const monthKeys = buildMonthlyKeys(6);
    const trendStart = monthKeys[0].start;

    const [
      conteneursCharges,
      conteneursTransit,
      conteneursArrives,
      conteneursEnAttente,
      totalCommandes,
      agendaToday,
      montagesActifs,
      commandesDisponibles,
      commandesVendues,
      montageGroups,
      commandesForTrend,
      conteneursForTrend,
      montagesTerminesForTrend,
    ] = await Promise.all([
      prisma.conteneur.count({ where: { etapeConteneur: EtapeConteneur.CHARGE } }),
      prisma.conteneur.count({ where: { etapeConteneur: { in: transitSteps } } }),
      prisma.conteneur.count({ where: { etapeConteneur: { in: arrivedSteps } } }),
      prisma.conteneur.count({ where: { etapeConteneur: EtapeConteneur.EN_ATTENTE } }),
      prisma.commande.count(),
      prisma.agenda.count({
        where: { date: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.montage.count({ where: { etapeMontage: { in: activeMontageSteps } } }),
      prisma.commande.count({ where: { commandeFlag: "DISPONIBLE" } }),
      prisma.commande.count({ where: { commandeFlag: "VENDUE" } }),
      prisma.montage.groupBy({
        by: ["etapeMontage"],
        _count: { _all: true },
      }),
      prisma.commande.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      prisma.conteneur.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      prisma.montage.findMany({
        where: {
          etapeMontage: EtapeMontage.TERMINEE,
          updatedAt: { gte: trendStart },
        },
        select: { updatedAt: true },
      }),
    ]);

    const conteneurPipelineChart: ChartDatum[] = [
      { label: "Chargés", value: conteneursCharges, color: "#059669" },
      { label: "En transit", value: conteneursTransit, color: "#7c3aed" },
      { label: "Arrivés", value: conteneursArrives, color: "#2563eb" },
      { label: "En attente", value: conteneursEnAttente, color: "#94a3b8" },
    ].filter((d) => d.value > 0);

    const commandesByFlag: ChartDatum[] = [
      { label: "Vendues", value: commandesVendues, color: "#f59e0b" },
      { label: "Disponibles", value: commandesDisponibles, color: "#16a34a" },
    ].filter((d) => d.value > 0);

    const montageByEtape: ChartDatum[] = montageGroups
      .map((g, i) => ({
        label: MONTAGE_LABELS[g.etapeMontage],
        value: g._count._all,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    const monthlyTrends: MonthlyOperationsTrend[] = monthKeys.map((m) => ({
      monthKey: m.monthKey,
      monthLabel: m.monthLabel,
      monthShort: m.monthShort,
      commandes: commandesForTrend.filter(
        (c) => c.createdAt >= m.start && c.createdAt <= m.end
      ).length,
      conteneurs: conteneursForTrend.filter(
        (c) => c.createdAt >= m.start && c.createdAt <= m.end
      ).length,
      montagesTermines: montagesTerminesForTrend.filter(
        (c) => c.updatedAt >= m.start && c.updatedAt <= m.end
      ).length,
    }));

    return {
      success: true,
      data: {
        conteneursCharges,
        conteneursTransit,
        conteneursArrives,
        totalCommandes,
        agendaToday,
        montagesActifs,
        commandesDisponibles,
        commandesVendues,
        conteneurPipelineChart,
        commandesByFlag,
        montageByEtape,
        monthlyTrends,
      },
    };
  } catch (error) {
    console.error("Error fetching manager dashboard:", error);
    return { success: false, error: "Échec du chargement du tableau de bord" };
  }
}
