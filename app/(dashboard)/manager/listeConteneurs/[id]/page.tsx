"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Ship,
  Calendar,
  Weight,
  Hash,
  Clock,
  MapPin,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import { getConteneur } from "@/lib/actions/conteneur";
import { toast } from "sonner";

type CommandeType = {
  id: string;
  couleur: string | null;
  motorisation: string | null;
  transmission: string | null;
  nbr_portes: string | null;
  prix_unitaire: number | null;
  date_livraison: string;
  createdAt: string;
  updatedAt: string;
  etapeCommande: string;
  commandeFlag: string;
  voitureModel: {
    model: string;
  } | null;
  client: {
    nom: string;
  } | null;
  clientEntreprise: {
    nom_entreprise: string;
  } | null;
};

type ConteneurType = {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  totalPackages: string | null;
  grossWeight: string | null;
  netWeight: string | null;
  stuffingMap: string | null;
  etapeConteneur: string;
  createdAt: string;
  updatedAt: string;
  dateEmbarquement: string | null;
  dateArriveProbable: string | null;
  commandes: CommandeType[];
};

export default function ConteneurDetailPage() {
  const router = useRouter();
  const params = useParams();
  const conteneurId = params.id as string;

  const [conteneur, setConteneur] = useState<ConteneurType | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchConteneur = async () => {
      try {
        setLoading(true);
        const result = await getConteneur(conteneurId);

        if (result.success && result.data) {
          setConteneur(result.data as ConteneurType);
        } else {
          toast.error(result.error || "Erreur lors du chargement du conteneur");
          router.push("/manager/listeConteneurs");
        }
      } catch (error) {
        console.error("Error fetching conteneur:", error);
        toast.error("Une erreur est survenue lors du chargement");
        router.push("/manager/listeConteneurs");
      } finally {
        setLoading(false);
      }
    };

    if (conteneurId) {
      fetchConteneur();
    }
  }, [conteneurId, router]);

  const handleDownloadLetter = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/conteneur/${conteneurId}/letter`);
      
      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Courrier_${conteneur?.conteneurNumber || conteneurId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Courrier téléchargé avec succès");
    } catch (error) {
      console.error("Error downloading letter:", error);
      toast.error("Erreur lors du téléchargement du courrier");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Chargement du conteneur...</p>
        </div>
      </div>
    );
  }

  if (!conteneur) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Conteneur non trouvé</p>
          <Button onClick={() => router.push("/manager/listeConteneurs")}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/manager/listeConteneurs")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Conteneur {conteneur.conteneurNumber}
              </h1>
              <p className="text-gray-600 mt-1">Détails du conteneur</p>
            </div>
          </div>
          <Button
            onClick={handleDownloadLetter}
            disabled={downloading}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Créer le courrier
              </>
            )}
          </Button>
        </div>

        {/* Conteneur Info Card */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardHeader className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white border-0 pb-8 pt-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30">
                  <Ship className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl md:text-3xl font-bold mb-2">
                    Informations du Conteneur
                  </CardTitle>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {conteneur.etapeConteneur}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 rounded-xl border border-purple-200/50">
                <Hash className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-600">Numéro de scellé</p>
                  <p className="text-lg font-bold text-gray-900">{conteneur.sealNumber}</p>
                </div>
              </div>

              {conteneur.dateEmbarquement && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-xl border border-blue-200/50">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Date d&apos;embarquement</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(conteneur.dateEmbarquement).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {conteneur.dateArriveProbable && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-3 rounded-xl border border-green-200/50">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Arrivée prévue</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(conteneur.dateArriveProbable).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {conteneur.totalPackages && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200/50">
                  <Package className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Nombre de colis</p>
                    <p className="text-lg font-bold text-gray-900">{conteneur.totalPackages}</p>
                  </div>
                </div>
              )}

              {(conteneur.grossWeight || conteneur.netWeight) && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-xl border border-gray-200/50">
                  <Weight className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Poids</p>
                    <p className="text-lg font-bold text-gray-900">
                      {conteneur.grossWeight && `Brut: ${conteneur.grossWeight}`}
                      {conteneur.grossWeight && conteneur.netWeight && " / "}
                      {conteneur.netWeight && `Net: ${conteneur.netWeight}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Commandes List */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
            <CardTitle className="text-white text-xl md:text-2xl font-bold flex items-center gap-3">
              <Package className="h-6 w-6" />
              Commandes ({conteneur.commandes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {conteneur.commandes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {conteneur.commandes.map((commande) => (
                  <div
                    key={commande.id}
                    className="bg-gradient-to-br from-white via-blue-50/40 to-purple-50/30 rounded-2xl p-5 md:p-6 border-2 border-blue-100/60 hover:border-purple-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-extrabold text-gray-900 text-lg mb-1.5">
                          {commande.voitureModel?.model || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Client: </span>
                          {commande.client?.nom ||
                            commande.clientEntreprise?.nom_entreprise ||
                            "N/A"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-3">
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1">
                          {commande.etapeCommande}
                        </Badge>
                        <Badge
                          className={`text-xs px-3 py-1 ${
                            commande.commandeFlag === "VENDUE"
                              ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          }`}
                        >
                          {commande.commandeFlag}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50/60 via-blue-50/40 to-indigo-50/30 rounded-xl p-4 border border-purple-100/60">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 font-semibold">Couleur: </span>
                          <span className="font-bold text-gray-900">{commande.couleur || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Moteur: </span>
                          <span className="font-bold text-gray-900">{commande.motorisation || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Transmission: </span>
                          <span className="font-bold text-gray-900">{commande.transmission || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold">Portes: </span>
                          <span className="font-bold text-gray-900">{commande.nbr_portes || "N/A"}</span>
                        </div>
                        {commande.prix_unitaire && (
                          <div className="col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg border border-green-200/50">
                            <span className="text-gray-600 font-semibold">Prix unitaire: </span>
                            <span className="font-extrabold text-green-700">
                              {commande.prix_unitaire.toLocaleString("fr-FR")} FCFA
                            </span>
                          </div>
                        )}
                        <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-purple-100/50">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500 font-semibold">Livraison: </span>
                          <span className="font-bold text-gray-900">
                            {new Date(commande.date_livraison).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/20 rounded-2xl border-2 border-dashed border-gray-300">
                <Package className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-semibold text-lg">
                  Aucune commande dans ce conteneur
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
