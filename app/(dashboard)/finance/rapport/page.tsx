import type { Metadata } from "next";

import FinanceModuleShell from "@/components/finance/FinanceModuleShell";

export const metadata: Metadata = {
  title: "Rapports | Finance",
  description: "Rapports et synthèses du département finance",
};

export default function FinanceRapportPage() {
  return (
    <FinanceModuleShell
      eyebrow="Finance"
      title="Rapports"
      description="Centralisez les synthèses, indicateurs et restitutions pour la direction."
      icon="rapport"
      accent="from-emerald-600 to-cyan-700"
      iconBg="bg-emerald-50 text-emerald-700"
      emptyTitle="Aucun rapport publié"
      emptyHint="Les rapports financiers et tableaux de synthèse seront listés ici une fois générés."
    />
  );
}
