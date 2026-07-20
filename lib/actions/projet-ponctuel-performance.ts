"use server";

import type { StatutProjetPonctuel } from "@prisma/client";
import { prisma } from "../prisma";
import {
  getActiviteStatutConfig,
  getActiviteStatutProgress,
  type StatutProjetPonctuelActivite,
} from "../projet-ponctuel-activite-statut";

export type ResponsableActiviteCompletionItem = {
  activiteId: string;
  activiteTitre: string;
  projetId: string;
  projetTitre: string;
  assignedAt: string;
  completedAt: string | null;
  durationMs: number;
  isCompleted: boolean;
};

export type ResponsablePerformanceItem = {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  completedCount: number;
  inProgressCount: number;
  avgDurationMs: number;
  minDurationMs: number | null;
  maxDurationMs: number | null;
  completions: ResponsableActiviteCompletionItem[];
};

export type ResponsablePerformanceChartPoint = {
  name: string;
  fullName: string;
  avgDays: number;
  completedCount: number;
  inProgressCount: number;
};

export type ActiviteProgressionItem = {
  id: string;
  titre: string;
  statutActivite: StatutProjetPonctuelActivite;
  statutLabel: string;
  progress: number;
  barClass: string;
};

export type ProjetProgressionItem = {
  id: string;
  titre: string;
  statutProjet: StatutProjetPonctuel;
  statutLabel: string;
  progress: number;
  completedCount: number;
  totalCount: number;
  activites: ActiviteProgressionItem[];
};

export type ProjetPonctuelPerformanceResult = {
  responsables: ResponsablePerformanceItem[];
  chartData: ResponsablePerformanceChartPoint[];
  progression: ProjetProgressionItem[];
  summary: {
    totalCompleted: number;
    totalInProgress: number;
    globalAvgDurationDays: number;
    responsableCount: number;
  };
};

const PROJET_STATUT_LABELS: Record<StatutProjetPonctuel, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULE: "Annulée",
};

function computeDurationMs(start: Date, end: Date): number {
  return Math.max(0, end.getTime() - start.getTime());
}

function shortName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const lastInitial = lastName.trim().charAt(0);
  if (!first) return lastName.trim() || "—";
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

function buildPerformanceResult(
  rows: Array<{
    createdAt: Date;
    user: { id: string; firstName: string; lastName: string };
    projetPonctuelActivite: {
      id: string;
      titre: string;
      statutActivite: string;
      updatedAt: Date;
      projetPonctuelId: string;
      projetPonctuel: { id: string; titre: string };
    };
  }>
): ProjetPonctuelPerformanceResult {
  const now = new Date();
  const byUser = new Map<
    string,
    {
      user: { id: string; firstName: string; lastName: string };
      completions: ResponsableActiviteCompletionItem[];
    }
  >();

  for (const row of rows) {
    const activite = row.projetPonctuelActivite;
    const isCompleted = activite.statutActivite === "TERMINEE";
    const endDate = isCompleted ? activite.updatedAt : now;
    const durationMs = computeDurationMs(row.createdAt, endDate);

    const completion: ResponsableActiviteCompletionItem = {
      activiteId: activite.id,
      activiteTitre: activite.titre,
      projetId: activite.projetPonctuel.id,
      projetTitre: activite.projetPonctuel.titre,
      assignedAt: row.createdAt.toISOString(),
      completedAt: isCompleted ? activite.updatedAt.toISOString() : null,
      durationMs,
      isCompleted,
    };

    const existing = byUser.get(row.user.id);
    if (existing) {
      existing.completions.push(completion);
    } else {
      byUser.set(row.user.id, { user: row.user, completions: [completion] });
    }
  }

  const responsables: ResponsablePerformanceItem[] = [...byUser.values()].map(
    ({ user, completions }) => {
      const completed = completions.filter((c) => c.isCompleted);
      const inProgress = completions.filter((c) => !c.isCompleted);
      const completedDurations = completed.map((c) => c.durationMs);

      const avgDurationMs =
        completedDurations.length > 0
          ? completedDurations.reduce((sum, ms) => sum + ms, 0) /
            completedDurations.length
          : inProgress.length > 0
            ? inProgress.reduce((sum, c) => sum + c.durationMs, 0) / inProgress.length
            : 0;

      return {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        completedCount: completed.length,
        inProgressCount: inProgress.length,
        avgDurationMs,
        minDurationMs:
          completedDurations.length > 0 ? Math.min(...completedDurations) : null,
        maxDurationMs:
          completedDurations.length > 0 ? Math.max(...completedDurations) : null,
        completions: completions.sort(
          (a, b) =>
            new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        ),
      };
    }
  );

  responsables.sort((a, b) => {
    if (b.completedCount !== a.completedCount) {
      return b.completedCount - a.completedCount;
    }
    return a.fullName.localeCompare(b.fullName, "fr");
  });

  const MS_PER_DAY = 86_400_000;
  const totalCompleted = responsables.reduce((sum, r) => sum + r.completedCount, 0);
  const totalInProgress = responsables.reduce((sum, r) => sum + r.inProgressCount, 0);
  const completedWithAvg = responsables.filter((r) => r.completedCount > 0);
  const globalAvgDurationDays =
    completedWithAvg.length > 0
      ? completedWithAvg.reduce(
          (sum, r) => sum + r.avgDurationMs / MS_PER_DAY,
          0
        ) / completedWithAvg.length
      : 0;

  const chartData: ResponsablePerformanceChartPoint[] = responsables
    .filter((r) => r.completedCount > 0 || r.inProgressCount > 0)
    .map((r) => ({
      name: shortName(r.firstName, r.lastName),
      fullName: r.fullName,
      avgDays: Math.round((r.avgDurationMs / MS_PER_DAY) * 10) / 10,
      completedCount: r.completedCount,
      inProgressCount: r.inProgressCount,
    }));

  return {
    responsables,
    chartData,
    progression: [],
    summary: {
      totalCompleted,
      totalInProgress,
      globalAvgDurationDays: Math.round(globalAvgDurationDays * 10) / 10,
      responsableCount: responsables.length,
    },
  };
}

async function fetchProgression(
  projetPonctuelId?: string | null
): Promise<ProjetProgressionItem[]> {
  const projects = await prisma.projetPonctuel.findMany({
    where: projetPonctuelId ? { id: projetPonctuelId } : undefined,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      titre: true,
      statutProjet: true,
      activite: {
        orderBy: { dateDebut: "asc" },
        select: {
          id: true,
          titre: true,
          statutActivite: true,
        },
      },
    },
  });

  return projects.map((project) => {
    const activites: ActiviteProgressionItem[] = project.activite.map((activite) => {
      const statut = activite.statutActivite as StatutProjetPonctuelActivite;
      const config = getActiviteStatutConfig(statut);
      return {
        id: activite.id,
        titre: activite.titre,
        statutActivite: statut,
        statutLabel: config.label,
        progress: getActiviteStatutProgress(statut),
        barClass: config.barClass,
      };
    });

    const totalCount = activites.length;
    const completedCount = activites.filter((a) => a.statutActivite === "TERMINEE").length;
    const progress =
      totalCount > 0
        ? Math.round(
            activites.reduce((sum, activite) => sum + activite.progress, 0) / totalCount
          )
        : project.statutProjet === "TERMINEE"
          ? 100
          : 0;

    return {
      id: project.id,
      titre: project.titre,
      statutProjet: project.statutProjet,
      statutLabel: PROJET_STATUT_LABELS[project.statutProjet],
      progress,
      completedCount,
      totalCount,
      activites,
    };
  });
}

export async function getProjetPonctuelResponsablesPerformance(
  projetPonctuelId?: string | null
): Promise<
  | { success: true; data: ProjetPonctuelPerformanceResult }
  | { success: false; error: string }
> {
  try {
    const [rows, progression] = await Promise.all([
      prisma.projetPonctuelResponsable.findMany({
        where: projetPonctuelId ? { projetPonctuelId } : undefined,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          projetPonctuelActivite: {
            select: {
              id: true,
              titre: true,
              statutActivite: true,
              updatedAt: true,
              projetPonctuelId: true,
              projetPonctuel: { select: { id: true, titre: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      fetchProgression(projetPonctuelId),
    ]);

    return {
      success: true,
      data: { ...buildPerformanceResult(rows), progression },
    };
  } catch (error) {
    console.error("getProjetPonctuelResponsablesPerformance error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des performances.",
    };
  }
}
