import { getInfographieDashboardPageData } from "@/lib/actions/infographie-dashboard";
import InfographieDashboardClient from "./InfographieDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Infographie",
  description: "Tableau de bord infographie — performances et publications",
};

export default async function InfographieDashboardPage() {
  const result = await getInfographieDashboardPageData();

  if (!result.success) {
    return (
      <InfographieDashboardClient
        initialPerformanceData={{ totalCount: 0, byActeur: [], byMonth: [] }}
        initialActeurs={[]}
        objectifsCount={0}
        rubriquesCount={0}
        projectsCount={0}
        activePublicationsCount={0}
        initialError={result.error}
      />
    );
  }

  const { data } = result;

  return (
    <InfographieDashboardClient
      initialPerformanceData={data.performanceData}
      initialActeurs={data.acteurs}
      objectifsCount={data.objectifsCount}
      rubriquesCount={data.rubriquesCount}
      projectsCount={data.projectsCount}
      activePublicationsCount={data.activePublicationsCount}
      initialError={null}
    />
  );
}
