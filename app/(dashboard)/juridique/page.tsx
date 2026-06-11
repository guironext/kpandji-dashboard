import { AlertCircle } from "lucide-react";
import JuridiqueDashboardClient from "@/components/juridique/JuridiqueDashboardClient";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getManagerDashboard } from "@/lib/actions/manager-dashboard";

export default async function JuridiqueDashboardPage() {
  const result = await getManagerDashboard();

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/20 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-2xl">
          <Card className="border-red-200 bg-red-50/80 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-700">Erreur</CardTitle>
                  <CardDescription className="text-red-600">
                    {result.error || "Impossible de charger le tableau de bord juridique"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return <JuridiqueDashboardClient data={result.data} />;
}
