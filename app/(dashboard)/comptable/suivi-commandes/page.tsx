"use client";

import { useState, useEffect } from "react";
import { getAllCommandesGrouped } from "@/lib/actions/commande";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Car, User, Phone } from "lucide-react";
import Image from "next/image";

type Commande = {
  id: string;
  couleur: string;
  nbr_portes: string;
  transmission: string;
  motorisation: string;
  date_livraison: Date;
  etapeCommande: string;
  prix_unitaire: number | null;
  createdAt: Date;
  updatedAt: Date;
  clientId: string | null;
  clientEntrepriseId: string | null;
  conteneurId: string | null;
  commandeLocalId: string | null;
  montageId: string | null;
  voitureModelId: string | null;
  factureId: string | null;
  client?: {
    id: string;
    nom: string;
    email: string | null;
    telephone: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    commercial: string | null;
    entreprise: string | null;
    localisation: string | null;
    secteur_activite: string | null;
    status_client: string;
    premiere_commande: boolean;
  } | null;
  clientEntreprise?: {
    id: string;
    nom_entreprise: string;
    email: string | null;
    telephone: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  voitureModel?: {
    id: string;
    model: string;
    image: string | null;
    fiche_technique: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  conteneur?: { id: string; conteneurNumber: string } | null;
  fournisseurs?: { id: string; nom: string }[];
};

const ETAPE_LABELS: Record<string, string> = {
  PROPOSITION: "En Proposition",
  VALIDE: "Validée",
  TRANSITE: "En Transit",
  RENSEIGNEE: "Renseignée",
  ARRIVE: "Arrivée",
  VERIFIER: "À Vérifier",
  MONTAGE: "En Montage",
  TESTE: "Testée",
  PARKING: "Parking",
  CORRECTION: "Correction",
  VENTE: "Vendue",
  DECHARGE: "Déchargée"
};

const ETAPE_COLORS: Record<string, string> = {
  PROPOSITION: "bg-blue-500",
  VALIDE: "bg-green-500",
  TRANSITE: "bg-yellow-500",
  RENSEIGNEE: "bg-purple-500",
  ARRIVE: "bg-cyan-500",
  VERIFIER: "bg-orange-500",
  MONTAGE: "bg-indigo-500",
  TESTE: "bg-pink-500",
  PARKING: "bg-teal-500",
  CORRECTION: "bg-red-500",
  VENTE: "bg-emerald-500",
  DECHARGE: "bg-gray-500"
};

export default function SuiviCommandesPage() {
  const [commandesGrouped, setCommandesGrouped] = useState<Record<string, Commande[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommandes = async () => {
      const result = await getAllCommandesGrouped();
      if (result.success && result.data) {
        setCommandesGrouped(result.data);
      }
      setLoading(false);
    };
    fetchCommandes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Suivi des Commandes
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Classification par étape et date de livraison
            </p>
          </div>
        </div>
      </div>

      {Object.keys(commandesGrouped).length === 0 ? (
        <Card className="bg-white shadow-xl border-2 border-blue-200">
          <CardContent className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucune commande
            </h3>
            <p className="text-gray-500">Les commandes apparaîtront ici</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(commandesGrouped).map(([etape, commandes]) => (
            <div key={etape}>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`${ETAPE_COLORS[etape]} text-white text-lg px-4 py-2`}>
                  {ETAPE_LABELS[etape] || etape}
                </Badge>
                <span className="text-sm text-gray-600">
                  {commandes.length} commande{commandes.length > 1 ? "s" : ""}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {commandes.map((cmd) => (
                  <Card key={cmd.id} className="bg-white hover:shadow-xl transition-all duration-300 border border-gray-400">
                    <CardHeader className={`${ETAPE_COLORS[etape]} text-white pb-3`}>
                      <CardTitle className="flex justify-between items-center text-sm">
                        <span className="font-mono">#{cmd.id.slice(-7).toUpperCase()}</span>
                        <Calendar className="w-4 h-4" />
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        {cmd.voitureModel?.image ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={cmd.voitureModel.image}
                              alt={cmd.voitureModel.model || "Véhicule"}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Car className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">
                            {cmd.voitureModel?.model || "N/A"}
                          </p>
                          <p className="text-xs text-gray-600">{cmd.couleur}</p>
                          <p className="text-xs text-gray-600">{cmd.nbr_portes}</p>
                          <p className="text-xs text-gray-600">{cmd.transmission}</p>
                          <p className="text-xs text-gray-600">{cmd.motorisation}</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="font-medium truncate">
                            {cmd.client?.nom || cmd.clientEntreprise?.nom_entreprise || "N/A"}
                          </span>
                        </div>
                        {(cmd.client?.telephone || cmd.clientEntreprise?.telephone) && (
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span>{cmd.client?.telephone || cmd.clientEntreprise?.telephone}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t">
                        <span className="text-gray-600">Livraison:</span>
                        <span className="font-semibold">
                          {new Date(cmd.date_livraison).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      
                      {cmd.prix_unitaire && (
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-gray-600">Prix:</span>
                          <span className="font-bold text-blue-600">
                            {cmd.prix_unitaire.toLocaleString()} FCFA
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}