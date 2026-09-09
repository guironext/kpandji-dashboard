import type { Metadata } from "next";

import FinanceModuleShell from "@/components/finance/FinanceModuleShell";

export const metadata: Metadata = {
  title: "Planning | Finance",
  description: "Calendrier et échéances du département finance",
};

export default function FinancePlanningPage() {
  return (
    <FinanceModuleShell
      eyebrow="Finance"
      title="Planning"
      description="Organisez clôtures, revues, rendez-vous et échéances financières."
      icon="planning"
      accent="from-slate-600 to-teal-700"
      iconBg="bg-slate-100 text-slate-700"
      emptyTitle="Planning encore vide"
      emptyHint="Les événements de la semaine et du mois apparaîtront ici dès qu'ils seront planifiés."
    />
  );
}
