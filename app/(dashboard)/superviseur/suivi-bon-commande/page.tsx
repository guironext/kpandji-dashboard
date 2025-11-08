"use client";

import { useState, useEffect } from "react";
import { getAllBonDeCommandeGroupedByUser } from "@/lib/actions/bondecommande";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumberWithSpaces } from "@/lib/utils";
import { Loader2, User, FileText, Calendar, Car } from "lucide-react";
import Image from "next/image";

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string | null;
}

interface BonDeCommandeData {
  bonDeCommande: {
    id: string;
    numero: string;
    createdAt: Date;
    updatedAt: Date;
  };
  facture: {
    id: string;
    date_facture: Date | null;
    date_echeance: Date | null;
    status_facture: string | null;
    nbr_voiture_commande: number | null;
    total_ttc: number;
    reste_payer: number;
    client?: {
      nom: string;
      telephone?: string;
    } | null;
    clientEntreprise?: {
      nom_entreprise: string;
      telephone?: string;
    } | null;
    voiture?: {
      voitureModel: {
        model: string;
        image?: string;
        description?: string;
      } | null;
    } | null;
    lignes?: Array<{
      id: string;
      voitureModelId: string;
      couleur: string;
      nbr_voiture: number;
      prix_unitaire: number;
      montant_ligne: number;
      transmission?: string;
      motorisation?: string;
      voitureModel: {
        model: string;
        image?: string;
        description?: string;
      } | null;
    }>;
  };
}

interface GroupedData {
  userId: string;
  user: UserData;
  bonDeCommandes: BonDeCommandeData[];
}

const Page = () => {
  const [data, setData] = useState<GroupedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getAllBonDeCommandeGroupedByUser();
        
        if (response.success && response.data) {
          setData(response.data as GroupedData[]);
          // Expand all users by default
          const userIds = (response.data as GroupedData[]).map(item => item.userId);
          setExpandedUsers(new Set(userIds));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case "FACTURE":
        return "default";
      case "PROFORMA":
        return "secondary";
      case "PAYEE":
        return "default";
      case "EN_ATTENTE":
        return "secondary";
      case "ANNULEE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "FACTURE":
        return "Facture";
      case "PROFORMA":
        return "Proforma";
      case "PAYEE":
        return "Payée";
      case "EN_ATTENTE":
        return "En Attente";
      case "ANNULEE":
        return "Annulée";
      default:
        return status || "N/A";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun bon de commande trouvé</h3>
          <p className="text-muted-foreground">
            Il n&apos;y a pas encore de bons de commande dans le système.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Suivi des Bons de Commande</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble des bons de commande classés par utilisateur
        </p>
      </div>

      <div className="grid gap-6">
        {data.map((userGroup) => {
          const isExpanded = expandedUsers.has(userGroup.userId);
          const totalBonDeCommandes = userGroup.bonDeCommandes.length;
          const totalAmount = userGroup.bonDeCommandes.reduce(
            (sum, item) => sum + item.facture.total_ttc,
            0
          );

          return (
            <Card key={userGroup.userId} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleUser(userGroup.userId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {userGroup.user.firstName} {userGroup.user.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {userGroup.user.email}
                        {userGroup.user.telephone && ` • ${userGroup.user.telephone}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {totalBonDeCommandes} bon{totalBonDeCommandes > 1 ? "s" : ""} de commande
                      </div>
                      <div className="text-lg font-bold">
                        {formatNumberWithSpaces(totalAmount)} FCFA
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      {isExpanded ? "▼" : "▶"}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-6">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro BC</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Modèles de Véhicules</TableHead>
                          <TableHead>Date Facture</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Nbr Véhicules</TableHead>
                          <TableHead className="text-right">Montant TTC</TableHead>
                          <TableHead className="text-right">Reste à Payer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userGroup.bonDeCommandes.map((item) => {
                          const clientName = item.facture.client
                            ? item.facture.client.nom
                            : item.facture.clientEntreprise
                            ? item.facture.clientEntreprise.nom_entreprise
                            : "N/A";

                          const clientTelephone = item.facture.client
                            ? item.facture.client.telephone
                            : item.facture.clientEntreprise
                            ? item.facture.clientEntreprise.telephone
                            : null;

                          // Get vehicle models from lignes or single voiture
                          const vehicleModels: Array<{
                            model: string;
                            couleur?: string;
                            nbr_voiture?: number;
                            image?: string;
                          }> = [];

                          if (item.facture.lignes && item.facture.lignes.length > 0) {
                            item.facture.lignes.forEach((ligne) => {
                              if (ligne.voitureModel) {
                                vehicleModels.push({
                                  model: ligne.voitureModel.model,
                                  couleur: ligne.couleur,
                                  nbr_voiture: ligne.nbr_voiture,
                                  image: ligne.voitureModel.image,
                                });
                              }
                            });
                          } else if (item.facture.voiture?.voitureModel) {
                            vehicleModels.push({
                              model: item.facture.voiture.voitureModel.model,
                              nbr_voiture: item.facture.nbr_voiture_commande || 1,
                              image: item.facture.voiture.voitureModel.image,
                            });
                          }

                          return (
                            <TableRow key={item.bonDeCommande.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  {item.bonDeCommande.numero}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{clientName}</div>
                                  {clientTelephone && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {clientTelephone}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {vehicleModels.length > 0 ? (
                                  <div className="space-y-2">
                                    {vehicleModels.map((vehicle, index) => (
                                      <div key={index} className="flex flex-col items-center gap-2">
                                        {vehicle.image && (
                                          <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                                            <Image
                                              src={vehicle.image}
                                              alt={vehicle.model}
                                              fill
                                              className="contain"
                                            />
                                          </div>
                                        )}
                                        {!vehicle.image && (
                                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                            <Car className="h-5 w-5 text-muted-foreground" />
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">{vehicle.model}</div>
                                          {vehicle.couleur && (
                                            <div className="text-xs text-muted-foreground">
                                              {vehicle.couleur}
                                              {vehicle.nbr_voiture && ` × ${vehicle.nbr_voiture}`}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {item.facture.date_facture
                                    ? new Date(item.facture.date_facture).toLocaleDateString("fr-FR")
                                    : "N/A"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(item.facture.status_facture)}>
                                  {getStatusLabel(item.facture.status_facture)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {item.facture.nbr_voiture_commande || 0}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatNumberWithSpaces(item.facture.total_ttc)} FCFA
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={
                                    item.facture.reste_payer > 0
                                      ? "text-destructive font-medium"
                                      : "text-green-600 font-medium"
                                  }
                                >
                                  {formatNumberWithSpaces(item.facture.reste_payer)} FCFA
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Page;
