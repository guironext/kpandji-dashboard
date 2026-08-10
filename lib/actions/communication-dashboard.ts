"use server";

import type { ActeurWithObjectifs } from "./communication-objectifs";
import { getCommunicationProjects } from "./communication-project";
import { getObjectifsPrincipauxPageData } from "./communication-objectifs";
import {
  getInactivePublicationsPerformanceData,
  type InactivePublicationsPerformanceData,
} from "./publication-objectif-global-rubrique";

export type CommunicationDashboardPageData = {
  performanceData: InactivePublicationsPerformanceData;
  acteurs: ActeurWithObjectifs[];
  objectifsCount: number;
  rubriquesCount: number;
  projectsCount: number;
};

export async function getCommunicationDashboardPageData(): Promise<
  | { success: true; data: CommunicationDashboardPageData }
  | { success: false; error: string }
> {
  try {
    const [performanceResult, objectifsResult, projectsResult] = await Promise.all([
      getInactivePublicationsPerformanceData(),
      getObjectifsPrincipauxPageData(),
      getCommunicationProjects(),
    ]);

    if (!performanceResult.success) {
      return { success: false, error: performanceResult.error };
    }
    if (!objectifsResult.success) {
      return { success: false, error: objectifsResult.error };
    }

    const { acteurs, rubriques } = objectifsResult.data;
    const objectifsCount = acteurs.reduce((sum, a) => sum + a.objectifs.length, 0);
    const projectsCount = projectsResult.success ? projectsResult.projects.length : 0;

    return {
      success: true,
      data: {
        performanceData: performanceResult.data,
        acteurs,
        objectifsCount,
        rubriquesCount: rubriques.length,
        projectsCount,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getCommunicationDashboardPageData error:", error);
    return { success: false, error: message || "Erreur lors du chargement du tableau de bord." };
  }
}
