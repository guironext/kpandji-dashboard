import { AlertCircle } from "lucide-react";
import SavDashboardClient from "@/components/sav/SavDashboardClient";
import { Card, CardContent } from "@/components/ui/card";
import { getSavDashboardData } from "@/lib/actions/sav-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | SAV",
  description:
    "Tableau de bord SAV — véhicules, diagnostics, réparations, pièces et facturation",
};

export default async function SavDashboardPage() {
  const result = await getSavDashboardData();

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Card className="max-w-md border-rose-200 bg-rose-50/50">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 shrink-0 text-rose-500" />
            <div>
              <p className="font-semibold text-rose-900">
                Impossible de charger le tableau de bord
              </p>
              <p className="mt-1 text-sm text-rose-700">
                {result.error ?? "Une erreur inattendue s'est produite."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SavDashboardClient data={result.data} />;
}
