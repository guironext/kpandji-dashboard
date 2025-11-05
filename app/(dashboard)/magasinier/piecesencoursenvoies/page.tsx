"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getCommandesTransites } from "@/lib/actions/commande";
import { getSubcasesByConteneur, validateConteneur } from "@/lib/actions/subcase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Car,
  User,
  Settings,
  Clock,
  Truck,
  Package,
  Container,
  MapPin,
  Archive,
  Box,
  ExternalLink,
} from "lucide-react";
import SubCaseDialog from "@/components/SubCaseDialog";

interface Commande {
  id: string;
  nbr_portes: string;
  transmission: string;
  motorisation: string;
  couleur: string;
  date_livraison: Date;
  client: {
    id: string;
    nom: string;
    email: string | null;
    telephone: string;
  };
  voitureModel?: {
    id: string;
    model: string;
  } | null;
  fournisseurs: Fournisseur[];
  conteneur?: {
    id: string;
    conteneurNumber: string;
    sealNumber: string;
  } | null;
}

interface Fournisseur {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  type_Activite?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface GroupedCommandes {
  [sealNumber: string]: {
    conteneur: {
      id: string;
      conteneurNumber: string;
      sealNumber: string;
    };
    commandes: Commande[];
  };
}

interface Subcase {
  id: string;
  subcaseNumber: string;
  createdAt: Date;
  conteneurId: string;
  spareParts: unknown[];
  tools: unknown[];
}

const Page = () => {
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConteneur, setSelectedConteneur] = useState<{
    id: string;
    conteneurNumber: string;
    sealNumber: string;
  } | null>(null);
  const [isSubCaseDialogOpen, setIsSubCaseDialogOpen] = useState(false);
  const [subcases, setSubcases] = useState<{
    [conteneurId: string]: Subcase[];
  }>({});
  const [isValidating, setIsValidating] = useState<{ [conteneurId: string]: boolean }>({});

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCommandesTransites();

        if (result.success) {
          setCommandes(result.data || []);

          // Fetch subcases for each container
          const conteneurIds = [
            ...new Set(
              result.data?.map((c) => c.conteneur?.id).filter(Boolean) || []
            ),
          ];
          const subcasesData: { [conteneurId: string]: Subcase[] } = {};

          for (const conteneurId of conteneurIds) {
            if (conteneurId) {
              const subcaseResult = await getSubcasesByConteneur(conteneurId);
              if (subcaseResult.success) {
                subcasesData[conteneurId] = subcaseResult.data || [];
              }
            }
          }

          setSubcases(subcasesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group commandes by conteneur sealNumber
  const groupedCommandes: GroupedCommandes = commandes.reduce(
    (acc, commande) => {
      if (commande.conteneur) {
        const sealNumber = commande.conteneur.sealNumber;
        if (!acc[sealNumber]) {
          acc[sealNumber] = {
            conteneur: commande.conteneur,
            commandes: [],
          };
        }
        acc[sealNumber].commandes.push(commande);
      } else {
        // Commandes without conteneur go to a special group
        if (!acc["no-conteneur"]) {
          acc["no-conteneur"] = {
            conteneur: {
              id: "no-conteneur",
              conteneurNumber: "Non assigné",
              sealNumber: "N/A",
            },
            commandes: [],
          };
        }
        acc["no-conteneur"].commandes.push(commande);
      }
      return acc;
    },
    {} as GroupedCommandes
  );

  const handleSubCase = (conteneur: {
    id: string;
    conteneurNumber: string;
    sealNumber: string;
  }) => {
    setSelectedConteneur(conteneur);
    setIsSubCaseDialogOpen(true);
  };

  const handleSubCaseSuccess = async () => {
    // Refresh subcases for the selected container
    if (selectedConteneur) {
      const subcaseResult = await getSubcasesByConteneur(selectedConteneur.id);
      if (subcaseResult.success) {
        setSubcases((prev) => ({
          ...prev,
          [selectedConteneur.id]: subcaseResult.data || [],
        }));
      }
    }
    console.log("SubCase created successfully");
  };

  const handleValidate = async (conteneurId: string) => {
    setIsValidating(prev => ({ ...prev, [conteneurId]: true }));
    try {
      const result = await validateConteneur(conteneurId);
      if (result.success) {
        // Refresh data after validation
        const commandesResult = await getCommandesTransites();
        if (commandesResult.success) {
          setCommandes(commandesResult.data || []);
        }
      }
    } catch (error) {
      console.error("Error validating conteneur:", error);
    } finally {
      setIsValidating(prev => ({ ...prev, [conteneurId]: false }));
    }
  };

  const handleSubcaseClick = (subcaseId: string) => {
    router.push(`/magasinier/subcase/${subcaseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold mb-2">Chargement...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Pièces en Cours d&apos;Envoi
            </h1>
            <p className="text-gray-600 mt-2">
              Suivi des commandes en transit organisées par sceau de conteneur
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(groupedCommandes).length}
              </div>
              <div className="text-sm text-gray-500">
                Sceau{Object.keys(groupedCommandes).length !== 1 ? "x" : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                {commandes.length}
              </div>
              <div className="text-sm text-gray-500">
                Commande{commandes.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {commandes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Aucune commande en transit
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Il n&apos;y a actuellement aucune commande en transit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCommandes).map(([sealNumber, group]) => (
            <Card
              key={sealNumber}
              className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
            >
              {/* Conteneur Header */}
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Container className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        Conteneur: {group.conteneur.conteneurNumber}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        Sceau: {group.conteneur.sealNumber}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {group.commandes.length} commande
                      {group.commandes.length !== 1 ? "s" : ""}
                    </Badge>
                    <Button
                      onClick={() => handleSubCase(group.conteneur)}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Sub Case
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleValidate(group.conteneur.id)}
                      disabled={isValidating[group.conteneur.id]}
                    >
                      {isValidating[group.conteneur.id] ? (
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4 mr-2" />
                      )}
                      Valider
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Subcases Section */}
              {subcases[group.conteneur.id] &&
                subcases[group.conteneur.id].length > 0 && (
                  <div className="bg-orange-50 border-b border-orange-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Box className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-900">
                        Sub Cases ({subcases[group.conteneur.id].length})
                      </h3>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {subcases[group.conteneur.id].map((subcase) => (
                        <div
                          key={subcase.id}
                          className="bg-white rounded-lg p-3 border border-orange-200 hover:border-orange-400 cursor-pointer transition-all duration-200 hover:shadow-md"
                          onClick={() => handleSubcaseClick(subcase.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-orange-900">
                                  #{subcase.subcaseNumber}
                                </p>
                                <ExternalLink className="h-3 w-3 text-orange-600" />
                              </div>
                              <p className="text-xs text-orange-600">
                                Créé le{" "}
                                {new Date(subcase.createdAt).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-100 text-orange-700 border-orange-300"
                              >
                                {subcase.spareParts.length} pièces
                              </Badge>
                              {subcase.tools.length > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-orange-100 text-orange-700 border-orange-300 ml-1"
                                >
                                  {subcase.tools.length} outils
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Commandes in this conteneur */}
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.commandes.map((commande) => (
                    <div
                      key={commande.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            #{commande.id.slice(0, 8)}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {commande.client.nom}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-xs"
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          En Transit
                        </Badge>
                      </div>

                      {/* Vehicle Details */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm text-gray-900">
                            {commande.voitureModel?.model ||
                              "Modèle non spécifié"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded border">
                            <span className="text-gray-500">Portes</span>
                            <div className="font-medium">
                              {commande.nbr_portes}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <span className="text-gray-500">Transmission</span>
                            <div className="font-medium">
                              {commande.transmission}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <span className="text-gray-500">Motorisation</span>
                            <div className="font-medium">
                              {commande.motorisation}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <span className="text-gray-500">Couleur</span>
                            <div className="font-medium">
                              {commande.couleur}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Date */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-300">
                        <Calendar className="h-3 w-3 text-orange-600" />
                        <span className="text-xs text-gray-600">
                          Livraison:
                        </span>
                        <span className="text-xs font-semibold text-gray-900">
                          {new Date(commande.date_livraison).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>

                      {/* Suppliers */}
                      {commande.fournisseurs &&
                        commande.fournisseurs.length > 0 && (
                          <div className="pt-2 border-t border-gray-300 mt-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Settings className="h-3 w-3 text-purple-600" />
                              <span className="text-xs text-gray-600">
                                Fournisseurs
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {commande.fournisseurs.map((fournisseur) => (
                                <Badge
                                  key={fournisseur.id}
                                  variant="secondary"
                                  className="text-xs bg-purple-50 text-purple-700 px-1 py-0"
                                >
                                  {fournisseur.nom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SubCase Dialog */}
      {selectedConteneur && (
        <SubCaseDialog
          open={isSubCaseDialogOpen}
          onOpenChange={setIsSubCaseDialogOpen}
          conteneurId={selectedConteneur.id}
          conteneurNumber={selectedConteneur.conteneurNumber}
          sealNumber={selectedConteneur.sealNumber}
          onSuccess={handleSubCaseSuccess}
        />
      )}
    </div>
  );
};

export default Page;
