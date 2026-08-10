import { getCommunicationDashboardPageData } from "@/lib/actions/communication-dashboard";
import CommunicationDashboardClient from "./CommunicationDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Communication",
  description: "Tableau de bord communication — publications, objectifs et performances",
};

export default async function CommunicationDashboardPage() {
  const result = await getCommunicationDashboardPageData();

  if (!result.success) {
    return (
      <CommunicationDashboardClient
        initialPerformanceData={{ totalCount: 0, byActeur: [], byMonth: [] }}
        initialActeurs={[]}
        objectifsCount={0}
        rubriquesCount={0}
        projectsCount={0}
        initialError={result.error}
      />
    );
  }

  const { data } = result;

  return (
    <CommunicationDashboardClient
      initialPerformanceData={data.performanceData}
      initialActeurs={data.acteurs}
      objectifsCount={data.objectifsCount}
      rubriquesCount={data.rubriquesCount}
      projectsCount={data.projectsCount}
      initialError={null}
    />
  );
}
