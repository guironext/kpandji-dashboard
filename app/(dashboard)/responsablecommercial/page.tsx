import { AlertCircle } from "lucide-react";
import ResponsableCommercialDashboardClient from "@/components/responsablecommercial/ResponsableCommercialDashboardClient";
import { Card, CardContent } from "@/components/ui/card";
import { getResponsableDashboard } from "@/lib/actions/responsable-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Responsable Commercial",
  description:
    "Tableau de bord responsable commercial — équipe, objectifs, performances et statistiques",
};

export default async function ResponsableCommercialDashboardPage() {
  const result = await getResponsableDashboard();

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="max-w-md border-red-200 bg-red-50/50">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold text-red-900">Impossible de charger le tableau de bord</p>
              <p className="mt-1 text-sm text-red-700">
                {result.error ?? "Une erreur inattendue s'est produite."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ResponsableCommercialDashboardClient data={result.data} />;
}
