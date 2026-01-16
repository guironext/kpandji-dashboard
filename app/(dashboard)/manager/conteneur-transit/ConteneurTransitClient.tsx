"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Ship,
  Calendar,
  Weight,
  Hash,
  Truck,
  MapPin,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { markConteneurAsArrive } from "@/lib/actions/conteneur";
import { useRouter } from "next/navigation";

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
  sealNumber: string | null;
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

type Props = {
  conteneursNonRenseigne: ConteneurType[];
  conteneursDejaRenseigne: ConteneurType[];
};

const ConteneurTransitClient: React.FC<Props> = ({
  conteneursNonRenseigne,
  conteneursDejaRenseigne,
}) => {
  const router = useRouter();
  const [loadingConteneurId, setLoadingConteneurId] = useState<string | null>(null);

  const handleDispatchArrive = async (conteneur: ConteneurType) => {
    // Check if all commandes have the same etapeCommande
    const allCommandesNonRenseigne = conteneur.commandes.every(
      (cmd) => cmd.etapeCommande === "TRANSITE_NON_RENSEIGNE"
    );
    const allCommandesDejaRenseigne = conteneur.commandes.every(
      (cmd) => cmd.etapeCommande === "TRANSITE_DEJA_RENSEIGNE"
    );

    // Check if conteneur is TRANSITE_NON_RENSEIGNE and all commandes are TRANSITE_NON_RENSEIGNE
    if (
      conteneur.etapeConteneur === "TRANSITE_NON_RENSEIGNE" &&
      allCommandesNonRenseigne
    ) {
      toast.error(
        "Ce conteneur n'est pas encore renseigné. Veuillez donner la liste des pièces au magasinier pour renseignement."
      );
      return;
    }

    // Check if conteneur is TRANSITE_DEJA_RENSEIGNE and all commandes are TRANSITE_DEJA_RENSEIGNE
    if (
      conteneur.etapeConteneur === "TRANSITE_DEJA_RENSEIGNE" &&
      allCommandesDejaRenseigne
    ) {
      setLoadingConteneurId(conteneur.id);
      try {
        const result = await markConteneurAsArrive(conteneur.id);
        if (result.success) {
          toast.success("Conteneur marqué comme arrivé avec succès");
          router.refresh();
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour");
        }
      } catch (error) {
        toast.error("Erreur lors de la mise à jour du conteneur");
        console.error(error);
      } finally {
        setLoadingConteneurId(null);
      }
    }
  };
  const statsNonRenseigne = useMemo(() => {
    const totalCommandes = conteneursNonRenseigne.reduce(
      (sum, c) => sum + c.commandes.length,
      0
    );
    const totalVendues = conteneursNonRenseigne.reduce(
      (sum, c) =>
        sum + c.commandes.filter((cmd) => cmd.commandeFlag === "VENDUE").length,
      0
    );
    const totalDisponibles = conteneursNonRenseigne.reduce(
      (sum, c) =>
        sum +
        c.commandes.filter((cmd) => cmd.commandeFlag === "DISPONIBLE").length,
      0
    );
    return {
      totalConteneurs: conteneursNonRenseigne.length,
      totalCommandes,
      totalVendues,
      totalDisponibles,
    };
  }, [conteneursNonRenseigne]);

  const statsDejaRenseigne = useMemo(() => {
    const totalCommandes = conteneursDejaRenseigne.reduce(
      (sum, c) => sum + c.commandes.length,
      0
    );
    const totalVendues = conteneursDejaRenseigne.reduce(
      (sum, c) =>
        sum + c.commandes.filter((cmd) => cmd.commandeFlag === "VENDUE").length,
      0
    );
    const totalDisponibles = conteneursDejaRenseigne.reduce(
      (sum, c) =>
        sum +
        c.commandes.filter((cmd) => cmd.commandeFlag === "DISPONIBLE").length,
      0
    );
    return {
      totalConteneurs: conteneursDejaRenseigne.length,
      totalCommandes,
      totalVendues,
      totalDisponibles,
    };
  }, [conteneursDejaRenseigne]);

  const renderConteneur = (
    conteneur: ConteneurType,
    index: number,
    sectionType: "nonRenseigne" | "dejaRenseigne" = "nonRenseigne"
  ) => {
    const isNonRenseigne = sectionType === "nonRenseigne";
    const borderColor = isNonRenseigne
      ? "border-amber-200/60 hover:border-amber-400/80"
      : "border-emerald-200/60 hover:border-emerald-400/80";
    const gradientOverlay = isNonRenseigne
      ? "from-amber-200/20 to-orange-200/20"
      : "from-emerald-200/20 to-green-200/20";
    const iconBg = isNonRenseigne
      ? "from-amber-100 via-orange-100 to-red-100 border-amber-200/50"
      : "from-emerald-100 via-green-100 to-teal-100 border-emerald-200/50";
    const iconColor = isNonRenseigne ? "text-amber-600" : "text-emerald-600";
    const badgeColor = isNonRenseigne
      ? "from-amber-500 to-orange-600"
      : "from-emerald-500 to-teal-600";
    const infoBg = isNonRenseigne
      ? "from-amber-50 to-orange-100 border-amber-200/50"
      : "from-emerald-50 to-green-100 border-emerald-200/50";
    const infoText = isNonRenseigne ? "text-amber-700" : "text-emerald-700";

    return (
      <div
        key={conteneur.id}
        className={`group relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/20 border-2 ${borderColor} p-6 md:p-8 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 backdrop-blur-sm`}
        style={{
          animationDelay: `${index * 100}ms`,
          animationName: "fadeInUp",
          animationDuration: "0.6s",
          animationTimingFunction: "ease-out",
          animationFillMode: "forwards",
        }}
      >
        {/* Decorative gradient overlay */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${gradientOverlay} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        ></div>

        {/* Conteneur Header */}
        <div className="mb-6 pb-6 border-b border-purple-200/60 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-5 flex-1">
              <div className="relative">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    isNonRenseigne
                      ? "from-amber-400 to-orange-400"
                      : "from-emerald-400 to-green-400"
                  } rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity`}
                ></div>
                <div
                  className={`relative bg-gradient-to-br ${iconBg} p-5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 border-2`}
                >
                  <Ship className={`h-8 w-8 ${iconColor}`} />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-extrabold text-gray-900 text-2xl md:text-3xl">
                    {conteneur.conteneurNumber}
                  </h3>
                  <Badge
                    className={`bg-gradient-to-r ${badgeColor} text-white text-xs px-4 py-1.5 shadow-lg font-semibold`}
                  >
                    {conteneur.etapeConteneur}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <div
                    className={`flex items-center gap-2 bg-gradient-to-r ${infoBg} px-4 py-2 rounded-xl border shadow-sm`}
                  >
                    <Hash className={`h-4 w-4 ${iconColor}`} />
                    <span className="text-sm font-semibold text-gray-900">
                      Scellé:{" "}
                      <span className={infoText}>
                        {conteneur.sealNumber || "N/A"}
                      </span>
                    </span>
                  </div>
                  {conteneur.dateEmbarquement && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-xl border border-blue-200/50 shadow-sm">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Embarquement:{" "}
                        <span className="text-blue-700">
                          {new Date(
                            conteneur.dateEmbarquement
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                  {conteneur.dateArriveProbable && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-2 rounded-xl border border-green-200/50 shadow-sm">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Arrivée prévue:{" "}
                        <span className="text-green-700">
                          {new Date(
                            conteneur.dateArriveProbable
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-purple-100/50">
                  <div className="flex flex-wrap items-center gap-3">
                    {conteneur.totalPackages && (
                      <div className="group/badge relative overflow-hidden bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 px-4 py-2.5 rounded-xl border border-purple-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-blue-200/20 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-2.5">
                          <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-1.5 rounded-lg border border-purple-200/50">
                            <Package className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Colis
                            </span>
                            <span className="text-sm font-extrabold text-gray-900">
                              {conteneur.totalPackages}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {(conteneur.grossWeight || conteneur.netWeight) && (
                      <div className="group/badge relative overflow-hidden bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 px-4 py-2.5 rounded-xl border border-emerald-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 to-green-200/20 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-2.5">
                          <div className="bg-gradient-to-br from-emerald-100 to-green-100 p-1.5 rounded-lg border border-emerald-200/50">
                            <Weight className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Poids
                            </span>
                            <span className="text-sm font-extrabold text-gray-900">
                              {conteneur.grossWeight && (
                                <span className="text-emerald-700">
                                  Brut: {conteneur.grossWeight}
                                </span>
                              )}
                              {conteneur.grossWeight &&
                                conteneur.netWeight &&
                                " / "}
                              {conteneur.netWeight && (
                                <span className="text-teal-700">
                                  Net: {conteneur.netWeight}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleDispatchArrive(conteneur)}
                    disabled={loadingConteneurId === conteneur.id}
                    className={`group/btn relative overflow-hidden bg-gradient-to-r ${
                      isNonRenseigne
                        ? "from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600"
                        : "from-amber-500 via-amber-500 to-orange-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600"
                    } text-white shadow-lg hover:shadow-xl px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105 border-0 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-2">
                      <Edit className="h-4 w-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                      <span className="text-lg md:text-xl  px-2 py-3">
                        {loadingConteneurId === conteneur.id ? "Traitement..." : "Dispatch Arrivé"}
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commandes List */}
        <div className="space-y-5 relative z-10">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-bold text-gray-900 text-xl md:text-2xl flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-2 rounded-xl">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              Commandes
              <Badge
                variant="secondary"
                className="ml-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 text-sm px-4 py-1 font-semibold"
              >
                {conteneur.commandes.length}
              </Badge>
            </h4>
          </div>
          {conteneur.commandes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {conteneur.commandes.map((commande, cmdIndex) => (
                <div
                  key={commande.id}
                  className="group/commande relative overflow-hidden bg-gradient-to-br from-white via-blue-50/40 to-purple-50/30 rounded-2xl p-5 md:p-6 border-2 border-blue-100/60 hover:border-purple-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    animationDelay: `${cmdIndex * 50}ms`,
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-2xl opacity-0 group-hover/commande:opacity-100 transition-opacity duration-300"></div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 p-3 rounded-xl group-hover/commande:scale-110 transition-transform duration-300 border border-blue-200/50">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-gray-900 text-lg mb-1.5 truncate">
                          {commande.voitureModel?.model || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="font-semibold">Client:</span>
                          <span className="truncate">
                            {commande.client?.nom ||
                              commande.clientEntreprise?.nom_entreprise ||
                              "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-3">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1 shadow-md font-semibold">
                        {commande.etapeCommande}
                      </Badge>
                      <Badge
                        className={`text-xs px-3 py-1 shadow-md font-semibold ${
                          commande.commandeFlag === "VENDUE"
                            ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                            : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        }`}
                      >
                        {commande.commandeFlag}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50/60 via-blue-50/40 to-indigo-50/30 rounded-xl p-4 border border-purple-100/60 relative z-10">
                    <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-semibold">
                          Couleur:
                        </span>
                        <span className="font-bold text-gray-900">
                          {commande.couleur || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-semibold">
                          Moteur:
                        </span>
                        <span className="font-bold text-gray-900">
                          {commande.motorisation || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-semibold">
                          Transmission:
                        </span>
                        <span className="font-bold text-gray-900">
                          {commande.transmission || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-semibold">
                          Portes:
                        </span>
                        <span className="font-bold text-gray-900">
                          {commande.nbr_portes || "N/A"}
                        </span>
                      </div>
                      {commande.prix_unitaire && (
                        <div className="flex items-center gap-2 col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg border border-green-200/50">
                          <span className="text-gray-600 font-semibold">
                            Prix unitaire:
                          </span>
                          <span className="font-extrabold text-green-700 text-base">
                            {commande.prix_unitaire.toLocaleString("fr-FR")}{" "}
                            FCFA
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 col-span-2 pt-2 border-t border-purple-100/50">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500 font-semibold">
                          Livraison:
                        </span>
                        <span className="font-bold text-gray-900">
                          {new Date(commande.date_livraison).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/20 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-inner">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-semibold text-lg">
                Aucune commande dans ce conteneur
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Les commandes apparaîtront ici une fois ajoutées
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Enhanced Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 md:p-5 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Truck className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
                Conteneurs en Transit
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm md:text-base font-medium">
                  Gestion des conteneurs en transit
                </p>
              </div>
            </div>
          </div>
          {(statsNonRenseigne.totalConteneurs > 0 ||
            statsDejaRenseigne.totalConteneurs > 0) && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-purple-200/50">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-gray-700">
                {statsNonRenseigne.totalConteneurs +
                  statsDejaRenseigne.totalConteneurs}{" "}
                conteneur
                {statsNonRenseigne.totalConteneurs +
                  statsDejaRenseigne.totalConteneurs !==
                1
                  ? "s"
                  : ""}{" "}
                en transit
              </span>
            </div>
          )}
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Non Renseigné Conteneurs */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-amber-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Non Renseigné
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {statsNonRenseigne.totalConteneurs}
              </p>
              <p className="text-amber-200 text-xs">Conteneurs en attente</p>
            </CardContent>
          </Card>

          {/* Déjà Renseigné Conteneurs */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-green-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Déjà Renseigné
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {statsDejaRenseigne.totalConteneurs}
              </p>
              <p className="text-green-200 text-xs">Conteneurs complétés</p>
            </CardContent>
          </Card>

          {/* Total Commandes */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-purple-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Total Commandes
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {statsNonRenseigne.totalCommandes +
                  statsDejaRenseigne.totalCommandes}
              </p>
              <p className="text-purple-200 text-xs">Toutes les commandes</p>
            </CardContent>
          </Card>

          {/* Commandes Vendues */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-red-500 via-rose-600 to-pink-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-red-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Commandes Vendues
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {statsNonRenseigne.totalVendues +
                  statsDejaRenseigne.totalVendues}
              </p>
              <p className="text-red-200 text-xs">Statut: VENDUE</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Section: Conteneurs Non Renseignés */}
        <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl transform transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white border-0 pb-8 pt-8 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <AlertCircle className="h-7 w-7 md:h-8 md:w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 flex items-center gap-3">
                      <Layers className="h-6 w-6 md:h-7 md:w-7" />
                      Transit Non Renseigné
                      <Badge className="ml-3 bg-white/20 text-white border-white/30 text-xs px-3 py-1">
                        En attente
                      </Badge>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                        <div className="h-2 w-2 bg-yellow-300 rounded-full animate-pulse"></div>
                        <p className="text-white text-sm md:text-base font-semibold">
                          <span className="text-white/90 font-bold text-lg">
                            {statsNonRenseigne.totalConteneurs}
                          </span>{" "}
                          <span className="text-orange-100">
                            conteneur
                            {statsNonRenseigne.totalConteneurs !== 1 ? "s" : ""}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                        <Package className="h-4 w-4 text-white/80" />
                        <p className="text-white text-sm md:text-base font-semibold">
                          <span className="text-white/90 font-bold text-lg">
                            {statsNonRenseigne.totalCommandes}
                          </span>{" "}
                          <span className="text-orange-100">
                            commande
                            {statsNonRenseigne.totalCommandes !== 1 ? "s" : ""}
                          </span>
                        </p>
                      </div>
                      {statsNonRenseigne.totalVendues > 0 && (
                        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                          <TrendingUp className="h-4 w-4 text-white/80" />
                          <p className="text-white text-sm md:text-base font-semibold">
                            <span className="text-white/90 font-bold text-lg">
                              {statsNonRenseigne.totalVendues}
                            </span>{" "}
                            <span className="text-orange-100">
                              vendue
                              {statsNonRenseigne.totalVendues !== 1 ? "s" : ""}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6 md:space-y-8">
              {conteneursNonRenseigne.length > 0 ? (
                conteneursNonRenseigne.map((conteneur, index) =>
                  renderConteneur(conteneur, index, "nonRenseigne")
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-24 md:py-32">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 p-10 rounded-full shadow-inner border-2 border-amber-200/50">
                      <AlertCircle className="h-24 w-24 text-amber-400" />
                    </div>
                  </div>
                  <p className="text-center font-extrabold text-2xl md:text-3xl mb-3 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Aucun conteneur trouvé
                  </p>
                  <p className="text-center text-base md:text-lg text-gray-500 max-w-md">
                    Aucun conteneur avec transit non renseigné pour le moment.
                  </p>
                  <div className="mt-6 px-6 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-700 font-medium">
                      Les conteneurs apparaîtront ici une fois qu&apos;ils
                      seront marqués comme &quot;Transit Non Renseigné&quot;.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visual Divider */}
        <div className="relative flex items-center justify-center py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 px-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-purple-200/50">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-lg md:text-2xl font-semibold text-gray-600">
                Section suivante
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Conteneurs Déjà Renseignés */}
        <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl transform transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="relative bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white border-0 pb-8 pt-8 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle2 className="h-7 w-7 md:h-8 md:w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 flex items-center gap-3">
                      <Layers className="h-6 w-6 md:h-7 md:w-7" />
                      Transit Déjà Renseigné 
                      <Badge className="ml-3 bg-white/20 text-white border-white/30 text-xs px-3 py-1">
                        Complété
                      </Badge>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                        <div className="h-2 w-2 bg-green-300 rounded-full animate-pulse"></div>
                        <p className="text-white text-sm md:text-base font-semibold">
                          <span className="text-white/90 font-bold text-lg">
                            {statsDejaRenseigne.totalConteneurs}
                          </span>{" "}
                          <span className="text-green-100">
                            conteneur
                            {statsDejaRenseigne.totalConteneurs !== 1
                              ? "s"
                              : ""}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                        <Package className="h-4 w-4 text-white/80" />
                        <p className="text-white text-sm md:text-base font-semibold">
                          <span className="text-white/90 font-bold text-lg">
                            {statsDejaRenseigne.totalCommandes}
                          </span>{" "}
                          <span className="text-green-100">
                            commande
                            {statsDejaRenseigne.totalCommandes !== 1 ? "s" : ""}
                          </span>
                        </p>
                      </div>
                      {statsDejaRenseigne.totalVendues > 0 && (
                        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                          <TrendingUp className="h-4 w-4 text-white/80" />
                          <p className="text-white text-sm md:text-base font-semibold">
                            <span className="text-white/90 font-bold text-lg">
                              {statsDejaRenseigne.totalVendues}
                            </span>{" "}
                            <span className="text-green-100">
                              vendues
                              {statsDejaRenseigne.totalVendues !== 1 ? "s" : ""}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6 md:space-y-8">
              {conteneursDejaRenseigne.length > 0 ? (
                conteneursDejaRenseigne.map((conteneur, index) =>
                  renderConteneur(conteneur, index, "dejaRenseigne")
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-24 md:py-32">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 to-green-200/30 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 p-10 rounded-full shadow-inner border-2 border-emerald-200/50">
                      <CheckCircle2 className="h-24 w-24 text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-center font-extrabold text-2xl md:text-3xl mb-3 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Aucun conteneur trouvé
                  </p>
                  <p className="text-center text-base md:text-lg text-gray-500 max-w-md">
                    Aucun conteneur avec transit déjà renseigné pour le moment.
                  </p>
                  <div className="mt-6 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-sm text-emerald-700 font-medium">
                      Les conteneurs apparaîtront ici une fois qu&apos;ils
                      seront marqués comme &quot;Transit Déjà Renseigné&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ConteneurTransitClient;
