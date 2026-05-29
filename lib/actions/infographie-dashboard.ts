"use server";

import { prisma } from "../prisma";
import { getCommunicationProjects } from "./communication-project";
import { getObjectifsPrincipauxPageData } from "./communication-objectifs";
import { getInactivePublicationsPerformanceData } from "./publication-objectif-global-rubrique";
import {
  filterInfographieActeurs,
  filterPerformanceForInfographie,
} from "../infographie-dashboard-utils";

const INFOGRAPHIE_ROLE = "INFOGRAPHIE";

export type InfographieDashboardPageData = {
  performanceData: ReturnType<typeof filterPerformanceForInfographie>;
  acteurs: ReturnType<typeof filterInfographieActeurs>;
  objectifsCount: number;
  rubriquesCount: number;
  projectsCount: number;
  activePublicationsCount: number;
};

export async function getInfographieDashboardPageData(): Promise<
  | { success: true; data: InfographieDashboardPageData }
  | { success: false; error: string }
> {
  try {
    const [performanceResult, objectifsResult, projectsResult, activePublicationsCount] =
      await Promise.all([
        getInactivePublicationsPerformanceData(),
        getObjectifsPrincipauxPageData(),
        getCommunicationProjects(),
        prisma.publicationObjectifGlobalRubrique.count({
          where: { status: "ACTIVE", User: { role: INFOGRAPHIE_ROLE } },
        }),
      ]);

    if (!performanceResult.success) {
      return { success: false, error: performanceResult.error };
    }
    if (!objectifsResult.success) {
      return { success: false, error: objectifsResult.error };
    }

    const acteurs = filterInfographieActeurs(objectifsResult.data.acteurs);
    const performanceData = filterPerformanceForInfographie(performanceResult.data);
    const objectifsCount = acteurs.reduce((sum, a) => sum + a.objectifs.length, 0);
    const projectsCount = projectsResult.success ? projectsResult.projects.length : 0;

    return {
      success: true,
      data: {
        performanceData,
        acteurs,
        objectifsCount,
        rubriquesCount: objectifsResult.data.rubriques.length,
        projectsCount,
        activePublicationsCount,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getInfographieDashboardPageData error:", error);
    return { success: false, error: message || "Erreur lors du chargement du tableau de bord." };
  }
}
