import React from "react";
import { getMontagesWithExecutionStatus } from "@/lib/actions/equipe";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wrench, Users, Car, ClipboardList } from "lucide-react";
import AttributionEquipesClient from "./AttributionEquipesClient";

const page = async () => {
  const result = await getMontagesWithExecutionStatus();

  const montages = (result.success && result.data ? result.data : []) as Parameters<typeof AttributionEquipesClient>[0]["montages"];

  // Calculate stats
  const totalEquipes = montages.reduce(
    (sum, montage) => sum + montage.equipes.length,
    0,
  );
  const totalMontages = montages.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Wrench className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Attribution des Pièces aux Équipes
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-1">
                Gérez l&apos;attribution des pièces de rechange aux équipes de
                montage en cours d&apos;exécution
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Montages en Cours
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMontages}</div>
            <p className="text-xs text-muted-foreground">
              Montages avec statut EXECUTION
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Équipes Actives
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipes}</div>
            <p className="text-xs text-muted-foreground">
              Équipes disponibles pour attribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ordres de Montage
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {montages.reduce(
                (sum, montage) => sum + (montage.ordreMontage ? 1 : 0),
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ordres de montage en EXECUTION
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <AttributionEquipesClient montages={montages} />
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
