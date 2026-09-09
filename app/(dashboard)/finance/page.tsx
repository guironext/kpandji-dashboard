import type { Metadata } from "next";

import FinanceDashboardClient from "@/components/finance/FinanceDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Finance",
  description:
    "Tableau de bord finance — projets, tâches, planning et rapports",
};

export default function FinancePage() {
  return <FinanceDashboardClient />;
}
