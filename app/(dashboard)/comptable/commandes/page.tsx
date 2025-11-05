"use client";

import { useState, useEffect } from "react";
import { getCommandesProposees } from "@/lib/actions/commande";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Car, 
  Palette, 
  Cog, 
  Zap, 
  Calendar, 
  DollarSign,
  Package,
  Phone,
  Layers,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  client?: { nom: string; telephone?: string } | null;
  clientEntreprise?: { nom_entreprise: string; telephone?: string } | null;
  voitureModel?: { model: string; image?: string } | null;
  accessoires?: Array<{
    id: string;
    nom: string;
    image?: string | null;
  }>;
};

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommandes = async () => {
      try {
        const result = await getCommandesProposees();
        if (result.success && result.data) {
          setCommandes(result.data as Commande[]);
        }
      } catch (error) {
        console.error("Error fetching commandes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommandes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Commandes en Proposition
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Gérez et suivez vos commandes en attente de validation
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg px-4 py-2">
            <Layers className="w-4 h-4 mr-2" />
            {commandes.length} Commande{commandes.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Cards Grid */}
      {commandes.length === 0 ? (
        <Card className="bg-white shadow-xl border-2 border-amber-200">
          <CardContent className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucune commande en proposition
            </h3>
            <p className="text-gray-500">
              Les nouvelles commandes apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {commandes.map((cmd) => (
            <Card 
              key={cmd.id} 
              className="bg-white hover:shadow-2xl transition-all duration-300 border-2 border-amber-100 hover:border-amber-300 overflow-hidden group"
            >
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs opacity-90 mb-1">Commande #</p>
                    <p className="font-mono font-bold text-lg">{cmd.id.slice(-7).toUpperCase()}</p>
                  </div>
                  <Badge className="bg-white text-amber-700 hover:bg-white mt-1">
                    PROPOSITION
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Vehicle Image & Name */}
                <div className="flex items-center gap-4 pb-4 border-b-2 border-amber-100">
                  {cmd.voitureModel?.image ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ring-2 ring-amber-200">
                      <Image 
                        src={cmd.voitureModel.image} 
                        alt={cmd.voitureModel.model || "Véhicule"} 
                        fill
                        className="object-contain group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                      <Car className="w-10 h-10 text-amber-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="font-bold text-gray-900 text-lg truncate">
                        {cmd.voitureModel?.model || "Véhicule non spécifié"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="w-3 h-3 text-orange-500" />
                      <p className="text-sm text-gray-600 font-medium">{cmd.couleur}</p>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Client</p>
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {cmd.client?.nom || cmd.clientEntreprise?.nom_entreprise || "N/A"}
                      </p>
                      {(cmd.client?.telephone || cmd.clientEntreprise?.telephone) && (
                        <div className="flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3 text-gray-500" />
                          <p className="text-xs text-gray-600">
                            {cmd.client?.telephone || cmd.clientEntreprise?.telephone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Cog className="w-3 h-3 text-orange-600" />
                      <p className="text-xs text-orange-700 font-semibold">Transmission</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{cmd.transmission}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-green-600" />
                      <p className="text-xs text-green-700 font-semibold">Motorisation</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{cmd.motorisation}</p>
                  </div>
                </div>

                {/* Delivery Date */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-purple-700 font-semibold">Date de livraison</p>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(cmd.date_livraison).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                {cmd.prix_unitaire && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-300 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                          <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm text-gray-600 font-semibold">Prix unitaire</span>
                      </div>
                      <p className="text-xl font-bold text-amber-700">
                        {cmd.prix_unitaire.toLocaleString()} <span className="text-sm">FCFA</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Accessories */}
                {cmd.accessoires && cmd.accessoires.length > 0 && (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4 border-2 border-pink-300 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-pink-600" />
                      <h4 className="text-sm font-bold text-gray-900">Accessoires ({cmd.accessoires.length})</h4>
                    </div>
                    <div className="space-y-2">
                      {cmd.accessoires.map((acc) => (
                        <div key={acc.id} className="flex items-center gap-2 bg-white rounded-md p-2 border border-pink-200">
                          {acc.image ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image 
                                src={acc.image} 
                                alt={acc.nom} 
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded bg-pink-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-pink-600" />
                            </div>
                          )}
                          <p className="text-sm font-semibold text-gray-900 truncate flex-1">{acc.nom}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer la commande
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}