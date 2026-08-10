"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "./user";

export type ChartDatum = {
  label: string;
  value: number;
  color: string;
};

export type MonthlyClientTrend = {
  monthKey: string;
  monthLabel: string;
  monthShort: string;
  clients: number;
  clientEntreprises: number;
  rendezVous: number;
};

export type UpcomingRendezVous = {
  id: string;
  date: string;
  clientName: string;
  statut: string;
};

export type RecentProspect = {
  id: string;
  name: string;
  type: "particulier" | "entreprise";
  secteur: string;
  createdAt: string;
};

export type ObjectifProgress = {
  label: string;
  cible: number;
  atteint: number;
  pourcentage: number;
};

export type CommercialDashboardStats = {
  prospectsTotal: number;
  clientsTotal: number;
  favorableTotal: number;
  rendezVousTotal: number;
  rendezVousAvenir: number;
  rendezVousMois: number;
  rapportsTotal: number;
  chutesTotal: number;
  proformasEnAttente: number;
  proformasValidees: number;
  facturesEnAttente: number;
  caMois: number;
  caTotal: number;
  messagesNonLus: number;
  currentPeriodLabel: string | null;
};

export type CommercialDashboardData = {
  userLabel: string;
  stats: CommercialDashboardStats;
  monthlyTrends: MonthlyClientTrend[];
  secteurChart: ChartDatum[];
  facturesByStatus: ChartDatum[];
  objectifProgress: ObjectifProgress[];
  upcomingRendezVous: UpcomingRendezVous[];
  recentProspects: RecentProspect[];
};

const CHART_COLORS = [
  "#f59e0b",
  "#ea580c",
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#db2777",
  "#0284c7",
  "#059669",
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

function userClientFilter(userId: string) {
  return {
    OR: [{ client: { userId } }, { Client_entreprise: { userId } }],
  };
}

function userRapportFilter(userId: string) {
  return {
    OR: [{ Client: { userId } }, { Client_entreprise: { userId } }],
  };
}

function parseObjectiveNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === "number" ? value : parseFloat(String(value).replace(/\s/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getCommercialDashboardData(): Promise<{
  success: boolean;
  data?: CommercialDashboardData;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: userResult.error || "Utilisateur non trouvé" };
    }

    const userId = userResult.data.id;
    const userLabel =
      userResult.data.firstName?.trim() ||
      `${userResult.data.firstName ?? ""} ${userResult.data.lastName ?? ""}`.trim() ||
      userResult.data.email?.split("@")[0] ||
      "Commercial";
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthlyKeys = buildMonthlyKeys(6);
    const earliestMonth = monthlyKeys[0].start;
    const clientOrFilter = userClientFilter(userId);
    const rapportOrFilter = userRapportFilter(userId);

    const [
      prospectsParticuliers,
      prospectsEntreprises,
      clientsParticuliers,
      clientsEntreprises,
      favorableParticuliers,
      favorableEntreprises,
      rendezVousTotal,
      rendezVousAvenir,
      rendezVousMois,
      rapportsTotal,
      chutesTotal,
      proformasEnAttente,
      proformasValidees,
      facturesEnAttente,
      messagesNonLus,
      clientsRaw,
      clientEntreprisesRaw,
      rendezVousMonthlyRaw,
      facturesRaw,
      facturesByStatusRaw,
      objectifsFinanciers,
      objectifsVehicules,
      currentPeriod,
      upcomingRendezVousRaw,
      recentClientsRaw,
      recentEntreprisesRaw,
    ] = await Promise.all([
      prisma.client.count({ where: { userId, status_client: "PROSPECT" } }),
      prisma.client_entreprise.count({ where: { userId, status_client: "PROSPECT" } }),
      prisma.client.count({ where: { userId, status_client: "CLIENT" } }),
      prisma.client_entreprise.count({ where: { userId, status_client: "CLIENT" } }),
      prisma.client.count({ where: { userId, status_client: "FAVORABLE" } }),
      prisma.client_entreprise.count({ where: { userId, status_client: "FAVORABLE" } }),
      prisma.rendezVous.count({ where: clientOrFilter }),
      prisma.rendezVous.count({
        where: {
          ...clientOrFilter,
          date: { gte: now },
          statut: { in: ["CONFIRME", "EN_ATTENTE"] },
        },
      }),
      prisma.rendezVous.count({
        where: {
          ...clientOrFilter,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.rapportRendezVous.count({ where: rapportOrFilter }),
      prisma.tableau_chute.count({ where: { userId } }),
      prisma.facture.count({ where: { userId, status_facture: { in: ["EN_ATTENTE", "PROFORMA"] } } }),
      prisma.facture.count({ where: { userId, status_facture: "FACTURE" } }),
      prisma.facture.count({ where: { userId, status_facture: "EN_ATTENTE" } }),
      prisma.message.count({ where: { receiverId: userId, readAt: null } }),
      prisma.client.findMany({
        where: { userId, status_client: { in: ["PROSPECT", "CLIENT"] } },
        select: { createdAt: true, secteur_activite: true },
      }),
      prisma.client_entreprise.findMany({
        where: { userId, status_client: { in: ["PROSPECT", "CLIENT"] } },
        select: { createdAt: true, secteur_activite: true },
      }),
      prisma.rendezVous.findMany({
        where: { ...clientOrFilter, date: { gte: earliestMonth } },
        select: { date: true },
      }),
      prisma.facture.findMany({
        where: { userId },
        select: { status_facture: true, total_ttc: true, date_facture: true },
      }),
      prisma.facture.groupBy({
        by: ["status_facture"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.objectifsfinancieres.findMany({
        where: { userId, objectifPeriodId: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          pole: true,
          objectif_cible: true,
          objectif_reel_atteint: true,
          objectif_pourcentage_atteint: true,
        },
      }),
      prisma.objectifsvehicules.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          objectif_cible: true,
          objectif_reel_atteint: true,
          objectif_pourcentage_atteint: true,
        },
      }),
      prisma.objectifPeriod.findFirst({
        orderBy: { objectif_start: "desc" },
        select: { objectif_start: true, objectif_end: true },
      }),
      prisma.rendezVous.findMany({
        where: {
          ...clientOrFilter,
          date: { gte: now },
        },
        orderBy: { date: "asc" },
        take: 5,
        select: {
          id: true,
          date: true,
          statut: true,
          client: { select: { nom: true } },
          Client_entreprise: { select: { nom_entreprise: true } },
        },
      }),
      prisma.client.findMany({
        where: { userId, status_client: "PROSPECT" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          nom: true,
          secteur_activite: true,
          createdAt: true,
        },
      }),
      prisma.client_entreprise.findMany({
        where: { userId, status_client: "PROSPECT" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          nom_entreprise: true,
          secteur_activite: true,
          createdAt: true,
        },
      }),
    ]);

    const monthlyTrends: MonthlyClientTrend[] = monthlyKeys.map(
      ({ monthKey, monthLabel, monthShort, start, end }) => ({
        monthKey,
        monthLabel,
        monthShort,
        clients: clientsRaw.filter((c) => c.createdAt >= start && c.createdAt <= end).length,
        clientEntreprises: clientEntreprisesRaw.filter(
          (c) => c.createdAt >= start && c.createdAt <= end
        ).length,
        rendezVous: rendezVousMonthlyRaw.filter((r) => r.date >= start && r.date <= end).length,
      })
    );

    const secteurMap = new Map<string, number>();
    const addSecteur = (secteur: string | null) => {
      const key = secteur?.trim() || "Non renseigné";
      secteurMap.set(key, (secteurMap.get(key) ?? 0) + 1);
    };
    for (const c of clientsRaw) addSecteur(c.secteur_activite);
    for (const c of clientEntreprisesRaw) addSecteur(c.secteur_activite);

    const secteurChart: ChartDatum[] = Array.from(secteurMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({
        label,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

    const facturesByStatus: ChartDatum[] = facturesByStatusRaw
      .filter((g) => g._count._all > 0)
      .map((g, index) => ({
        label: FACTURE_STATUS_LABELS[g.status_facture] ?? g.status_facture,
        value: g._count._all,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));

    const facturesValidees = facturesRaw.filter((f) => f.status_facture === "FACTURE");
    const caTotal = facturesValidees.reduce((sum, f) => sum + Number(f.total_ttc), 0);
    const caMois = facturesValidees
      .filter((f) => f.date_facture >= startOfMonth && f.date_facture <= endOfMonth)
      .reduce((sum, f) => sum + Number(f.total_ttc), 0);

    const objectifProgress: ObjectifProgress[] = [
      ...objectifsFinanciers.map((o) => {
        const cible = parseObjectiveNumber(o.objectif_cible);
        const atteint = parseObjectiveNumber(o.objectif_reel_atteint);
        const pourcentage =
          o.objectif_pourcentage_atteint ??
          (cible > 0 ? Math.round((atteint / cible) * 100) : 0);
        return {
          label: o.pole || "Objectif financier",
          cible,
          atteint,
          pourcentage,
        };
      }),
      ...objectifsVehicules.map((o, i) => {
        const cible = parseObjectiveNumber(o.objectif_cible);
        const atteint = parseObjectiveNumber(o.objectif_reel_atteint);
        const pourcentage =
          o.objectif_pourcentage_atteint ??
          (cible > 0 ? Math.round((atteint / cible) * 100) : 0);
        return {
          label: `Véhicules ${i + 1}`,
          cible,
          atteint,
          pourcentage,
        };
      }),
    ].slice(0, 4);

    let currentPeriodLabel: string | null = null;
    if (currentPeriod) {
      const startStr = currentPeriod.objectif_start.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const endStr = currentPeriod.objectif_end.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      currentPeriodLabel = `${startStr} — ${endStr}`;
    }

    const upcomingRendezVous: UpcomingRendezVous[] = upcomingRendezVousRaw.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      clientName: r.client?.nom ?? r.Client_entreprise?.nom_entreprise ?? "Client",
      statut: r.statut.replace(/_/g, " ").toLowerCase(),
    }));

    const recentProspects: RecentProspect[] = [
      ...recentClientsRaw.map((c) => ({
        id: c.id,
        name: c.nom,
        type: "particulier" as const,
        secteur: c.secteur_activite?.trim() || "Non renseigné",
        createdAt: c.createdAt.toISOString(),
      })),
      ...recentEntreprisesRaw.map((c) => ({
        id: c.id,
        name: c.nom_entreprise,
        type: "entreprise" as const,
        secteur: c.secteur_activite?.trim() || "Non renseigné",
        createdAt: c.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      success: true,
      data: {
        userLabel,
        stats: {
          prospectsTotal: prospectsParticuliers + prospectsEntreprises,
          clientsTotal: clientsParticuliers + clientsEntreprises,
          favorableTotal: favorableParticuliers + favorableEntreprises,
          rendezVousTotal,
          rendezVousAvenir,
          rendezVousMois,
          rapportsTotal,
          chutesTotal,
          proformasEnAttente,
          proformasValidees,
          facturesEnAttente,
          caMois,
          caTotal,
          messagesNonLus,
          currentPeriodLabel,
        },
        monthlyTrends,
        secteurChart,
        facturesByStatus,
        objectifProgress,
        upcomingRendezVous,
        recentProspects,
      },
    };
  } catch (error) {
    console.error("getCommercialDashboardData:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement",
    };
  }
}
