import React from "react";
import { prisma } from "@/lib/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ArrowLeft, Badge } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AttributionPiecesDragDropClient from "./AttributionPiecesDragDropClient";

type EquipeType = {
  id: string;
  nomEquipe: string;
  mission: string;
  activite: string;
  stautsEquipe: string;
  createdAt: string;
  updatedAt: string;
  chefEquipe: {
    id: string;
    nom: string;
    prenoms: string;
  } | null;
  membres: {
    id: string;
    qualite: string;
    fonction: string;
    createdAt: string;
    updatedAt: string;
    employee: {
      id: string;
      nom: string;
      prenoms: string;
    };
  }[];
  montage: {
    id: string;
    etapeMontage: string;
    createdAt: string;
    updatedAt: string;
    ordreMontage: {
      id: string;
      ordreMontageFlag: string;
      createdAt: string;
      updatedAt: string;
      commande: {
        id: string;
        couleur: string | null;
        motorisation: string | null;
        voitureModel: { model: string } | null;
      } | null;
    } | null;
  } | null;
};

type SparePartType = {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  etapeSparePart: string;
  createdAt: string;
  updatedAt: string;
  voiture: {
    id: string;
    couleur: string | null;
    motorisation: string | null;
    createdAt: string;
    updatedAt: string;
    voitureModel: { model: string } | null;
  } | null;
  storage: {
    id: string;
    storageNumber: string | null;
    porte_Number: string | null;
    rayon: string | null;
    etage: string | null;
    caseNumber: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  // Fetch equipe
  const equipeData = await prisma.equipe.findUnique({
    where: { id },
    include: {
      Employee: true,
      EquipeMembre: {
        include: {
          Employee: true,
        },
      },
      Montage: {
        include: {
          OrdreMontage: {
            include: {
              Commande: {
                include: {
                  Client: true,
                  VoitureModel: true,
                },
              },
              Voiture: {
                include: {
                  VoitureModel: true,
                },
              },
              NumeroChassis: true,
            },
          },
        },
      },
    },
  });

  if (!equipeData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 font-semibold">Équipe non trouvée</p>
            <Link href="/magasinier/attributionpieces">
              <Button className="mt-4">Retour</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const equipe: EquipeType = {
    id: equipeData.id,
    nomEquipe: equipeData.nomEquipe,
    mission: equipeData.mission,
    activite: equipeData.activite,
    stautsEquipe: equipeData.stautsEquipe,
    createdAt: equipeData.createdAt.toISOString(),
    updatedAt: equipeData.updatedAt.toISOString(),
    chefEquipe: equipeData.Employee
      ? {
          id: equipeData.Employee.id,
          nom: equipeData.Employee.nom,
          prenoms: equipeData.Employee.prenoms,
        }
      : null,
    membres: equipeData.EquipeMembre.map((m) => ({
      id: m.id,
      qualite: m.qualite,
      fonction: m.fonction,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      employee: {
        id: m.Employee.id,
        nom: m.Employee.nom,
        prenoms: m.Employee.prenoms,
      },
    })),
    montage: equipeData.Montage
      ? {
          id: equipeData.Montage.id,
          etapeMontage: equipeData.Montage.etapeMontage,
          createdAt: equipeData.Montage.createdAt.toISOString(),
          updatedAt: equipeData.Montage.updatedAt.toISOString(),
          ordreMontage: equipeData.Montage.OrdreMontage
            ? {
                id: equipeData.Montage.OrdreMontage.id,
                ordreMontageFlag:
                  equipeData.Montage.OrdreMontage.ordreMontageFlag,
                createdAt:
                  equipeData.Montage.OrdreMontage.createdAt.toISOString(),
                updatedAt:
                  equipeData.Montage.OrdreMontage.updatedAt.toISOString(),
                commande: equipeData.Montage.OrdreMontage.Commande
                  ? {
                      id: equipeData.Montage.OrdreMontage.Commande.id,
                      couleur: equipeData.Montage.OrdreMontage.Commande.couleur,
                      motorisation:
                        equipeData.Montage.OrdreMontage.Commande.motorisation,
                      voitureModel: equipeData.Montage.OrdreMontage.Commande
                        .VoitureModel
                        ? {
                            model:
                              equipeData.Montage.OrdreMontage.Commande
                                .VoitureModel.model,
                          }
                        : null,
                    }
                  : null,
              }
            : null,
        }
      : null,
  };

  // Fetch spare parts in storage with quantity > 0
  const sparePartsData = await prisma.sparePart.findMany({
    where: {
      etapeSparePart: "RANGE",
      quantity: {
        gt: 0,
      },
    },
    include: {
      Voiture: {
        include: {
          VoitureModel: true,
        },
      },
      Storage: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const spareParts: SparePartType[] = sparePartsData.map((sp) => ({
    id: sp.id,
    partCode: sp.partCode,
    partName: sp.partName,
    partNameFrench: sp.partNameFrench,
    quantity: sp.quantity,
    etapeSparePart: sp.etapeSparePart,
    createdAt: sp.createdAt.toISOString(),
    updatedAt: sp.updatedAt.toISOString(),
    voiture: sp.Voiture
      ? {
          id: sp.Voiture.id,
          couleur: sp.Voiture.couleur,
          motorisation: sp.Voiture.motorisation,
          createdAt: sp.Voiture.createdAt.toISOString(),
          updatedAt: sp.Voiture.updatedAt.toISOString(),
          voitureModel: sp.Voiture.VoitureModel
            ? { model: sp.Voiture.VoitureModel.model }
            : null,
        }
      : null,
    storage: sp.Storage
      ? {
          id: sp.Storage.id,
          storageNumber: sp.Storage.storageNumber,
          porte_Number: sp.Storage.porte_Number,
          rayon: sp.Storage.rayon,
          etage: sp.Storage.etage,
          caseNumber: sp.Storage.caseNumber,
          createdAt: sp.Storage.createdAt.toISOString(),
          updatedAt: sp.Storage.updatedAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Link href="/magasinier/attributionpieces">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </Link>

      {/* Header Section */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {equipe.nomEquipe}
                </CardTitle>
                <p className="text-gray-600">Mission: {equipe.mission}</p>
              </div>
            </div>
            <Badge className="bg-green-500 text-white">
              {equipe.stautsEquipe}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-500">Chef d&apos;équipe</p>
              <p className="font-semibold">
                {equipe.chefEquipe
                  ? `${equipe.chefEquipe.nom} ${equipe.chefEquipe.prenoms}`
                  : "Non assigné"}
              </p>
            </div>
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-500">Membres</p>
              <p className="font-semibold">{equipe.membres.length}</p>
            </div>
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-gray-500">Activité</p>
              <p className="font-semibold">{equipe.activite}</p>
            </div>
          </div>
          {equipe.montage && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">Montage associé</p>
              <p className="font-semibold">
                {equipe.montage.ordreMontage?.commande?.voitureModel?.model ||
                  "Non spécifié"}{" "}
                - Statut: {equipe.montage.etapeMontage}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spare Parts Attribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            Attribution des Pièces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttributionPiecesDragDropClient
            equipe={equipe}
            spareParts={spareParts}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
