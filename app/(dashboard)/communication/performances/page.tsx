import { getInactivePublicationsPerformanceData } from "@/lib/actions/publication-objectif-global-rubrique";
import PerformancesPageClient from "./PerformancesPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performances | Communication",
  description: "Publications terminées par acteur et par mois",
};

export default async function PerformancesPage() {
  const result = await getInactivePublicationsPerformanceData();
  const initialData = result.success
    ? result.data
    : { totalCount: 0, byActeur: [], byMonth: [] };

  return (
    <PerformancesPageClient
      initialData={initialData}
      initialError={result.success ? null : result.error}
    />
  );
}
