"use server";

import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "./user";
import { getActivitesForCurrentResponsable } from "./projet-ponctuel-activite";
import { getTachesForCurrentResponsable } from "./tache-activite-projet-routine";
import {
  getActiviteStatutConfig,
  type StatutProjetPonctuelActivite,
} from "../projet-ponctuel-activite-statut";
import {
  getTacheStatutConfig,
  type StatutTacheActiviteProjetRoutine,
} from "../tache-activite-projet-routine-statut";

export type DesignerChartDatum = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type DesignerMonthlyTrend = {
  monthKey: string;
  monthLabel: string;
  monthShort: string;
  ponctuelCompleted: number;
  permanentCompleted: number;
  ponctuelAssigned: number;
  permanentAssigned: number;
};

export type DesignerRecentItem = {
  id: string;
  titre: string;
  type: "ponctuel" | "permanent";
  statut: string;
  statutLabel: string;
  projetLabel: string;
  updatedAt: string;
  href: string;
};

export type DesignerDashboardStats = {
  totalAssigned: number;
  totalCompleted: number;
  totalInProgress: number;
  totalAwaitingValidation: number;
  totalOverdue: number;
  completionRate: number;
  ponctuelTotal: number;
  ponctuelCompleted: number;
  permanentTotal: number;
  permanentCompleted: number;
};

export type DesignerDashboardData = {
  userLabel: string;
  stats: DesignerDashboardStats;
  statusDistribution: DesignerChartDatum[];
  workloadByType: DesignerChartDatum[];
  monthlyTrends: DesignerMonthlyTrend[];
  recentItems: DesignerRecentItem[];
};

const COMPLETED = new Set(["TERMINEE", "VALIDEE"]);
const IN_PROGRESS = new Set(["EN_COURS", "NON_VALIDEE", "TRANSFEREE"]);
const AWAITING = new Set(["EN_ATTENTE", "EN_ATTENTE_VALIDATION", "NOUVEAU"]);

const STATUS_COLORS: Record<string, string> = {
  NOUVEAU: "#6366f1",
  EN_ATTENTE: "#94a3b8",
  EN_COURS: "#0ea5e9",
  EN_ATTENTE_VALIDATION: "#f59e0b",
  VALIDEE: "#10b981",
  NON_VALIDEE: "#f43f5e",
  TRANSFEREE: "#8b5cf6",
  TERMINEE: "#14b8a6",
  ANNULE: "#cbd5e1",
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
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
    }).format(d);
    const monthShort = new Intl.DateTimeFormat("fr-FR", {
      month: "short",
    }).format(d);
    result.push({ monthKey, monthLabel, monthShort, start, end });
  }

  return result;
}

function isOverdue(dateCloture: string | null, statut: string): boolean {
  if (!dateCloture || COMPLETED.has(statut) || statut === "ANNULE") return false;
  const end = new Date(dateCloture).getTime();
  if (Number.isNaN(end)) return false;
  return end < Date.now();
}

function emptyData(userLabel = "Designer"): DesignerDashboardData {
  return {
    userLabel,
    stats: {
      totalAssigned: 0,
      totalCompleted: 0,
      totalInProgress: 0,
      totalAwaitingValidation: 0,
      totalOverdue: 0,
      completionRate: 0,
      ponctuelTotal: 0,
      ponctuelCompleted: 0,
      permanentTotal: 0,
      permanentCompleted: 0,
    },
    statusDistribution: [],
    workloadByType: [
      { key: "ponctuel", label: "Projet ponctuel", value: 0, color: "#8b5cf6" },
      { key: "permanent", label: "Projet permanent", value: 0, color: "#d946ef" },
    ],
    monthlyTrends: buildMonthlyKeys(6).map((m) => ({
      monthKey: m.monthKey,
      monthLabel: m.monthLabel,
      monthShort: m.monthShort,
      ponctuelCompleted: 0,
      permanentCompleted: 0,
      ponctuelAssigned: 0,
      permanentAssigned: 0,
    })),
    recentItems: [],
  };
}

export async function getDesignerDashboardData(
  clerkUserId?: string
): Promise<
  | { success: true; data: DesignerDashboardData }
  | { success: false; error: string; data: DesignerDashboardData }
> {
  try {
    const authResult = await auth();
    const clerkId = clerkUserId ?? authResult.userId;
    if (!clerkId) {
      return {
        success: false,
        error: "Vous devez être connecté.",
        data: emptyData(),
      };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error ?? "Utilisateur introuvable.",
        data: emptyData(),
      };
    }

    const user = userResult.data;
    const userLabel =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email ||
      "Designer";

    const [activitesResult, tachesResult] = await Promise.all([
      getActivitesForCurrentResponsable(clerkId),
      getTachesForCurrentResponsable(clerkId),
    ]);

    const activites = activitesResult.success ? activitesResult.activites : [];
    const taches = tachesResult.success ? tachesResult.taches : [];

    const statusCounts = new Map<string, number>();
    const bumpStatus = (statut: string) => {
      statusCounts.set(statut, (statusCounts.get(statut) ?? 0) + 1);
    };

    let totalCompleted = 0;
    let totalInProgress = 0;
    let totalAwaitingValidation = 0;
    let totalOverdue = 0;
    let ponctuelCompleted = 0;
    let permanentCompleted = 0;

    for (const a of activites) {
      bumpStatus(a.statutActivite);
      if (COMPLETED.has(a.statutActivite)) {
        totalCompleted += 1;
        ponctuelCompleted += 1;
      } else if (IN_PROGRESS.has(a.statutActivite)) {
        totalInProgress += 1;
      } else if (AWAITING.has(a.statutActivite)) {
        totalAwaitingValidation += 1;
      }
      if (isOverdue(a.dateCloture, a.statutActivite)) totalOverdue += 1;
    }

    for (const t of taches) {
      bumpStatus(t.statutTache);
      if (COMPLETED.has(t.statutTache)) {
        totalCompleted += 1;
        permanentCompleted += 1;
      } else if (IN_PROGRESS.has(t.statutTache)) {
        totalInProgress += 1;
      } else if (AWAITING.has(t.statutTache)) {
        totalAwaitingValidation += 1;
      }
      if (isOverdue(t.dateCloture, t.statutTache)) totalOverdue += 1;
    }

    const totalAssigned = activites.length + taches.length;
    const completionRate =
      totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    const statusDistribution: DesignerChartDatum[] = [...statusCounts.entries()]
      .map(([key, value]) => {
        const label =
          getActiviteStatutConfig(key as StatutProjetPonctuelActivite).label ||
          getTacheStatutConfig(key as StatutTacheActiviteProjetRoutine).label ||
          key;
        return {
          key,
          label,
          value,
          color: STATUS_COLORS[key] ?? "#94a3b8",
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    const workloadByType: DesignerChartDatum[] = [
      {
        key: "ponctuel",
        label: "Projet ponctuel",
        value: activites.length,
        color: "#8b5cf6",
      },
      {
        key: "permanent",
        label: "Projet permanent",
        value: taches.length,
        color: "#d946ef",
      },
    ];

    const months = buildMonthlyKeys(6);
    const monthlyTrends: DesignerMonthlyTrend[] = months.map((m) => {
      let ponctuelCompletedCount = 0;
      let permanentCompletedCount = 0;
      let ponctuelAssigned = 0;
      let permanentAssigned = 0;

      for (const a of activites) {
        const created = new Date(a.createdAt).getTime();
        if (created >= m.start.getTime() && created < m.end.getTime()) {
          ponctuelAssigned += 1;
        }
        if (COMPLETED.has(a.statutActivite)) {
          const doneAt = new Date(a.updatedAt).getTime();
          if (doneAt >= m.start.getTime() && doneAt < m.end.getTime()) {
            ponctuelCompletedCount += 1;
          }
        }
      }

      for (const t of taches) {
        const created = new Date(t.dateDebut).getTime();
        if (created >= m.start.getTime() && created < m.end.getTime()) {
          permanentAssigned += 1;
        }
        if (COMPLETED.has(t.statutTache)) {
          const doneAt = t.dateCloture
            ? new Date(t.dateCloture).getTime()
            : new Date(t.dateDebut).getTime();
          if (doneAt >= m.start.getTime() && doneAt < m.end.getTime()) {
            permanentCompletedCount += 1;
          }
        }
      }

      return {
        monthKey: m.monthKey,
        monthLabel: m.monthLabel,
        monthShort: m.monthShort,
        ponctuelCompleted: ponctuelCompletedCount,
        permanentCompleted: permanentCompletedCount,
        ponctuelAssigned,
        permanentAssigned,
      };
    });

    const recentActivites: DesignerRecentItem[] = activites.map((a) => ({
      id: a.id,
      titre: a.titre,
      type: "ponctuel" as const,
      statut: a.statutActivite,
      statutLabel: getActiviteStatutConfig(a.statutActivite).label,
      projetLabel: a.projet.titre,
      updatedAt: a.updatedAt,
      href: "/designer/projet-ponctuel",
    }));

    const recentTaches: DesignerRecentItem[] = taches.map((t) => ({
      id: t.id,
      titre: t.libelle,
      type: "permanent" as const,
      statut: t.statutTache,
      statutLabel: getTacheStatutConfig(t.statutTache).label,
      projetLabel: t.activiteLibelle || t.roleMissionLibelle,
      updatedAt: t.dateCloture ?? t.dateDebut,
      href: "/designer/projet-permanent",
    }));

    const recentItems = [...recentActivites, ...recentTaches]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 8);

    return {
      success: true,
      data: {
        userLabel,
        stats: {
          totalAssigned,
          totalCompleted,
          totalInProgress,
          totalAwaitingValidation,
          totalOverdue,
          completionRate,
          ponctuelTotal: activites.length,
          ponctuelCompleted,
          permanentTotal: taches.length,
          permanentCompleted,
        },
        statusDistribution,
        workloadByType,
        monthlyTrends,
        recentItems,
      },
    };
  } catch (error) {
    console.error("getDesignerDashboardData error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement du tableau de bord.",
      data: emptyData(),
    };
  }
}
