"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Car, Wrench, Package, ArrowRight, User } from "lucide-react";

type EquipeMemberType = {
  id: string;
  qualite: string;
  fonction: string;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    nom: string;
    prenoms: string;
    poste?: string;
  };
};

type OrdreMontageType = {
  id: string;
  ordreMontageFlag: string;
  createdAt: string;
  updatedAt: string;
  commandeId: string;
  commande: {
    id: string;
    couleur: string | null;
    motorisation: string | null;
    transmission: string | null;
    nbr_portes: string | null;
    createdAt: string;
    updatedAt: string;
    client: {
      nom: string;
    } | null;
    voitureModel: {
      model: string;
    } | null;
  } | null;
  voiture: {
    id: string;
    couleur: string | null;
    motorisation: string | null;
    transmission: string | null;
    nbr_portes: string | null;
    createdAt: string;
    updatedAt: string;
    voitureModel: {
      model: string;
    } | null;
  } | null;
  numeroChassis: {
    id: string;
    chassisNumber: string;
  } | null;
};

type EquipeType = {
  id: string;
  nomEquipe: string;
  mission: string;
  taches_accomplies: string;
  activite: string;
  stautsEquipe: string;
  createdAt: string;
  updatedAt: string;
  chefEquipe: {
    id: string;
    email: string | null;
    nom: string;
    userId: string;
    prenoms: string;
    contact: string;
    adresse: string | null;
    image: string | null;
    bloodType: string | null;
    specialite: string;
  } | null;
  membres: EquipeMemberType[];
};

type MontageType = {
  id: string;
  no_chassis: string | null;
  etapeMontage: string;
  createdAt: string;
  updatedAt: string;
  ordreMontage: OrdreMontageType | null;
  equipes: EquipeType[];
};

type Props = {
  montages: MontageType[];
};

const AttributionEquipesClient = ({ montages }: Props) => {
  const router = useRouter();

  const handleAttribuerPieces = (equipeId: string) => {
    router.push(`/magasinier/attributionpieces/${equipeId}`);
  };

  if (montages.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-br from-gray-50 via-amber-50/30 to-orange-50/20 rounded-3xl border-2 border-dashed border-gray-300">
        <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-semibold text-2xl mb-2">
          Aucune donnée à afficher
        </p>
        <p className="text-gray-400 text-lg">
          Aucun montage en cours d&apos;exécution avec équipe active
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {montages.map((montage) => (
        <div
          key={montage.id}
          className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 rounded-3xl p-6 border-2 border-amber-200/60"
        >
          {/* Montage Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3 rounded-xl border border-amber-200/50">
                <Car className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-extrabold text-gray-900 text-xl">
                    {montage.ordreMontage?.commande?.voitureModel?.model ||
                      "Montage"}
                  </h3>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    {montage.etapeMontage}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  {montage.ordreMontage?.numeroChassis && (
                    <span>
                      Chassis:{" "}
                      {montage.ordreMontage.numeroChassis.chassisNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* equipes Section */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              Équipes ({montage.equipes.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {montage.equipes.map((equipe) => (
                <Card
                  key={equipe.id}
                  className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 border-2 border-green-200/60 hover:border-green-400/80 transition-all duration-300"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {equipe.nomEquipe}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200"
                      >
                        {equipe.stautsEquipe}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Mission: {equipe.mission}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Chef d'équipe */}
                    <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Chef:{" "}
                        {equipe.chefEquipe
                          ? `${equipe.chefEquipe.nom} ${equipe.chefEquipe.prenoms}`
                          : "Non assigné"}
                      </span>
                    </div>

                    {/* Membres */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">
                        Membres ({equipe.membres.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {equipe.membres.slice(0, 3).map((membre) => (
                          <Badge
                            key={membre.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {membre.employee.nom} {membre.employee.prenoms}
                          </Badge>
                        ))}
                        {equipe.membres.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{equipe.membres.length - 3} autres
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Activity */}
                    <div className="text-xs text-gray-500">
                      Activité: {equipe.activite}
                    </div>

                    {/* Attribution Button */}
                    <Button
                      onClick={() => handleAttribuerPieces(equipe.id)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Attribuer Pièces
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button 
                    
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Pièces Retournées
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AttributionEquipesClient;
