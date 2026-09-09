import type { Metadata } from "next";

import FinanceProjetPageClient from "@/components/finance/FinanceProjetPageClient";
import { getFinanceProjets } from "@/lib/actions/finance-projet";

export const metadata: Metadata = {
  title: "Projets | Finance",
  description: "Portefeuille des projets commerciaux du département finance",
};

export default async function FinanceProjetPage() {
  const result = await getFinanceProjets();
  const initialProjects = result.success ? result.projects : [];

  return <FinanceProjetPageClient initialProjects={initialProjects} />;
}
