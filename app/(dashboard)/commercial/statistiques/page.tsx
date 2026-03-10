import React from "react";
import {
  getClientsAndClientEntreprisesByMonthForCurrentUser,
  getClientsAndClientEntreprisesBySecteurActiviteForCurrentUser,
} from "@/lib/actions/client_entreprise";
import { getObjectifsFinancieresByCurrentCommercial } from "@/lib/actions/objectif-financiere";
import { getObjectifsVehiculesByCurrentCommercial } from "@/lib/actions/objectif-vehicule";
import { StatistiquesClient } from "./StatistiquesClient";
import { StatistiquesSecteurClient } from "./StatistiquesSecteurClient";
import { ObjectifsFinanciersTable } from "./ObjectifsFinanciersTable";
import { ObjectifsVehiculesTable } from "./ObjectifsVehiculesTable";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, AlertCircle, Loader2 } from "lucide-react";

export default async function StatistiquesPage() {
  const [result, secteurResult, objectifsResult, objectifsVehiculesResult] = await Promise.all([
    getClientsAndClientEntreprisesByMonthForCurrentUser(),
    getClientsAndClientEntreprisesBySecteurActiviteForCurrentUser(),
    getObjectifsFinancieresByCurrentCommercial(),
    getObjectifsVehiculesByCurrentCommercial(),
  ]);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50/80 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-red-700">Erreur</h2>
                  <p className="text-red-600 text-sm mt-1">
                    {result.error || "Impossible de charger les statistiques"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
            <p className="text-gray-600 mt-1">
              Vos clients et prospects par mois
            </p>
          </div>
        </div>

        <StatistiquesClient data={result.data} />

        {secteurResult.success && (
          <StatistiquesSecteurClient data={secteurResult.data ?? { chartData: [] }} />
        )}

        {objectifsResult.success && objectifsResult.data && (
          <ObjectifsFinanciersTable data={objectifsResult.data} />
        )}

        {objectifsVehiculesResult.success && objectifsVehiculesResult.data && (
          <ObjectifsVehiculesTable data={objectifsVehiculesResult.data} />
        )}

      </div>
    </div>
  );
}
