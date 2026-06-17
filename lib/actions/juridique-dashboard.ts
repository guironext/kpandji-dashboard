"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "./user";
import type {
  StatutDossierContentieux,
  TypeContrat,
  TypeDossierContentieux,
} from "@prisma/client";

const CLOSED_STATUSES: StatutDossierContentieux[] = ["TERMINEE", "ANNULE"];

export type ChartDatum = {
  label: string;
  value: number;
  color: string;
};

export type MonthlyTrend = {
  monthKey: string;
  monthLabel: string;
  dossiers: number;
  courriers: number;
};

export type RecentDossier = {
  id: string;
  numeroDossier: string;
  typeDossier: string;
  statutDossier: string;
  objet: string;
  dateOuverture: string;
};

export type UpcomingAudience = {
  id: string;
  dateAudience: string;
  heureAudience: string;
  tribunalAudience: string;
  dossierNumero: string;
  statutAudience: string;
};

export type JuridiqueDashboardStats = {
  dossiersTotal: number;
  dossiersActifs: number;
  dossiersTermines: number;
  contratsTotal: number;
  veilleDossiers: number;
  nonConformites: number;
  nouvellesLois: number;
  courriersTotal: number;
  courriersMois: number;
  messagesNonLus: number;
  audiencesProchaines: number;
};

export type JuridiqueDashboardData = {
  stats: JuridiqueDashboardStats;
  contentieuxByStatut: ChartDatum[];
  contentieuxByType: ChartDatum[];
  contratsByType: ChartDatum[];
  monthlyTrends: MonthlyTrend[];
  recentDossiers: RecentDossier[];
  upcomingAudiences: UpcomingAudience[];
};

const CHART_COLORS = [
  "#7c3aed",
  "#6366f1",
  "#0284c7",
  "#059669",
  "#d97706",
  "#db2777",
  "#4f46e5",
  "#0d9488",
  "#ea580c",
  "#475569",
] as const;

const TYPE_DOSSIER_LABELS: Record<TypeDossierContentieux, string> = {
  CIVIL: "Civil",
  COMMERCIAL: "Commercial",
  SOCIAL: "Social",
  ADMINISTRATIF: "Administratif",
  FISCAL: "Fiscal",
  PENAL: "Pénal",
};

const STATUT_DOSSIER_LABELS: Record<StatutDossierContentieux, string> = {
  RECLAMATION: "Réclamation",
  MISE_EN_DEMEURE: "Mise en demeure",
  CONCILIATION: "Conciliation",
  MEDIATION: "Médiation",
  ASSIGNATION: "Assignation",
  AUDIENCE: "Audience",
  JUGEMENT: "Jugement",
  APPEL: "Appel",
  EXECUTION: "Exécution",
  EN_ATTENTE: "En attente",
  EN_TRAITEMENT: "En traitement",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULE: "Annulée",
};

const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  CONTRAT: "Contrat",
  PARTENARIAT: "Partenariat",
  DELEGATION: "Délégation",
  AGREMENT: "Agrément",
  CONVENTION: "Convention",
  CONTRAT_DE_LOCATION: "Location",
  CONTRAT_DE_LOCATION_VENTE: "Location-vente",
  CONTRAT_DE_LOCATION_VENTE_MISE_EN_LOCATION: "Loc.-vente (mise en loc.)",
  CONTRAT_DE_LOCATION_VENTE_MISE_EN_LOCATION_VENTE: "Loc.-vente complète",
};

function buildMonthlyKeys(months: number): { monthKey: string; monthLabel: string; start: Date; end: Date }[] {
  const result: { monthKey: string; monthLabel: string; start: Date; end: Date }[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
    result.push({ monthKey, monthLabel, start, end });
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

export async function getJuridiqueDashboardData(): Promise<{
  success: boolean;
  data?: JuridiqueDashboardData;
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
    const userId = userResult.data.id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    const monthlyKeys = buildMonthlyKeys(6);
    const earliestMonth = monthlyKeys[0].start;

    const [
      dossiersTotal,
      dossiersActifs,
      dossiersTermines,
      contratsTotal,
      veilleDossiers,
      nonConformites,
      nouvellesLois,
      courriersTotal,
      courriersMois,
      messagesNonLus,
      audiencesProchaines,
      contentieuxByStatutRaw,
      contentieuxByTypeRaw,
      contratsByTypeRaw,
      dossiersMonthlyRaw,
      courriersMonthlyRaw,
      recentDossiersRaw,
      upcomingAudiencesRaw,
    ] = await Promise.all([
      prisma.dossierContentieux.count(),
      prisma.dossierContentieux.count({
        where: { statutDossier: { notIn: CLOSED_STATUSES } },
      }),
      prisma.dossierContentieux.count({
        where: { statutDossier: { in: CLOSED_STATUSES } },
      }),
      prisma.contratsEtPartenariats.count(),
      prisma.dossierVeilleJuridique.count(),
      prisma.nonConformiteJuridique.count(),
      prisma.nouvelleLoi.count(),
      prisma.numeroCourrier.count(),
      prisma.numeroCourrier.count({
        where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
      }),
      prisma.message.count({
        where: { receiverId: userId, readAt: null },
      }),
      prisma.gestionAudiences.count({
        where: { dateAudience: { gte: now, lte: in30Days } },
      }),
      prisma.dossierContentieux.groupBy({
        by: ["statutDossier"],
        _count: { _all: true },
      }),
      prisma.dossierContentieux.groupBy({
        by: ["typeDossier"],
        _count: { _all: true },
      }),
      prisma.contratsEtPartenariats.groupBy({
        by: ["typeContrat"],
        _count: { _all: true },
      }),
      prisma.dossierContentieux.findMany({
        where: { dateOuverture: { gte: earliestMonth } },
        select: { dateOuverture: true },
      }),
      prisma.numeroCourrier.findMany({
        where: { createdAt: { gte: earliestMonth } },
        select: { createdAt: true },
      }),
      prisma.dossierContentieux.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          numeroDossier: true,
          typeDossier: true,
          statutDossier: true,
          objet: true,
          dateOuverture: true,
        },
      }),
      prisma.gestionAudiences.findMany({
        where: { dateAudience: { gte: now } },
        orderBy: { dateAudience: "asc" },
        take: 5,
        select: {
          id: true,
          dateAudience: true,
          heureAudience: true,
          tribunalAudience: true,
          statutAudience: true,
          dossierContentieux: { select: { numeroDossier: true } },
        },
      }),
    ]);

    const monthlyTrends: MonthlyTrend[] = monthlyKeys.map(({ monthKey, monthLabel, start, end }) => ({
      monthKey,
      monthLabel,
      dossiers: dossiersMonthlyRaw.filter(
        (d) => d.dateOuverture >= start && d.dateOuverture <= end
      ).length,
      courriers: courriersMonthlyRaw.filter(
        (c) => c.createdAt >= start && c.createdAt <= end
      ).length,
    }));

    const contentieuxByStatut = toChartData(
      contentieuxByStatutRaw.map((g) => ({
        key: g.statutDossier,
        count: g._count._all,
      })),
      STATUT_DOSSIER_LABELS
    );

    const contentieuxByType = toChartData(
      contentieuxByTypeRaw.map((g) => ({
        key: g.typeDossier,
        count: g._count._all,
      })),
      TYPE_DOSSIER_LABELS
    );

    const contratsByType = toChartData(
      contratsByTypeRaw.map((g) => ({
        key: g.typeContrat,
        count: g._count._all,
      })),
      TYPE_CONTRAT_LABELS
    );

    const recentDossiers: RecentDossier[] = recentDossiersRaw.map((d) => ({
      id: d.id,
      numeroDossier: d.numeroDossier,
      typeDossier: TYPE_DOSSIER_LABELS[d.typeDossier],
      statutDossier: STATUT_DOSSIER_LABELS[d.statutDossier],
      objet: d.objet,
      dateOuverture: d.dateOuverture.toISOString(),
    }));

    const upcomingAudiences: UpcomingAudience[] = upcomingAudiencesRaw.map((a) => ({
      id: a.id,
      dateAudience: a.dateAudience.toISOString(),
      heureAudience: a.heureAudience,
      tribunalAudience: a.tribunalAudience,
      dossierNumero: a.dossierContentieux.numeroDossier,
      statutAudience: a.statutAudience.replace(/_/g, " ").toLowerCase(),
    }));

    return {
      success: true,
      data: {
        stats: {
          dossiersTotal,
          dossiersActifs,
          dossiersTermines,
          contratsTotal,
          veilleDossiers,
          nonConformites,
          nouvellesLois,
          courriersTotal,
          courriersMois,
          messagesNonLus,
          audiencesProchaines,
        },
        contentieuxByStatut,
        contentieuxByType,
        contratsByType,
        monthlyTrends,
        recentDossiers,
        upcomingAudiences,
      },
    };
  } catch (error) {
    console.error("getJuridiqueDashboardData:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement",
    };
  }
}
