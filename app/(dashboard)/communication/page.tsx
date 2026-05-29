import { getObjectifsPrincipauxPageData } from "@/lib/actions/communication-objectifs";
import { getCommunicationProjects } from "@/lib/actions/communication-project";
import { getInactivePublicationsPerformanceData } from "@/lib/actions/publication-objectif-global-rubrique";
import CommunicationDashboardClient from "./CommunicationDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Communication",
  description: "Tableau de bord communication — performances des acteurs",
};

export default async function CommunicationDashboardPage() {
  const [performanceResult, objectifsResult, projectsResult] = await Promise.all([
    getInactivePublicationsPerformanceData(),
    getObjectifsPrincipauxPageData(),
    getCommunicationProjects(),
  ]);

  const performanceData = performanceResult.success
    ? performanceResult.data
    : { totalCount: 0, byActeur: [], byMonth: [] };

  const objectifsData = objectifsResult.success
    ? objectifsResult.data
    : { users: [], rubriques: [], cycles: [], objectifs: [], acteurs: [] };

  const projectsCount = projectsResult.success ? projectsResult.projects.length : 0;

  const initialError = !performanceResult.success
    ? performanceResult.error
    : !objectifsResult.success
      ? objectifsResult.error
      : null;

  return (
    <CommunicationDashboardClient
      initialPerformanceData={performanceData}
      initialActeurs={objectifsData.acteurs}
      objectifsCount={objectifsData.objectifs.length}
      rubriquesCount={objectifsData.rubriques.length}
      projectsCount={projectsCount}
      initialError={initialError}
    />
  );
}
