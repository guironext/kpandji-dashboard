"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateConteneurToTransiteNonRenseigne } from "@/lib/actions/conteneur";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Ship,
  Calendar,
  Weight,
  Hash,
  Truck,
  CheckCircle2,
  TrendingUp,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  Layers,
  Mail,
  ContainerIcon,
} from "lucide-react";

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

type Props = {
  conteneurs: ConteneurType[];
};

const ListeConteneursClient: React.FC<Props> = ({ conteneurs }) => {
  const router = useRouter();
  const [loadingConteneurId, setLoadingConteneurId] = useState<string | null>(null);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalCommandes = conteneurs.reduce(
      (sum, c) => sum + c.commandes.length,
      0
    );
    const totalVendues = conteneurs.reduce(
      (sum, c) =>
        sum + c.commandes.filter((cmd) => cmd.commandeFlag === "VENDUE").length,
      0
    );
    const totalDisponibles = conteneurs.reduce(
      (sum, c) =>
        sum +
        c.commandes.filter((cmd) => cmd.commandeFlag === "DISPONIBLE").length,
      0
    );
    const totalPrix = conteneurs.reduce(
      (sum, c) =>
        sum +
        c.commandes.reduce(
          (cmdSum, cmd) => cmdSum + (cmd.prix_unitaire || 0),
          0
        ),
      0
    );

    return {
      totalConteneurs: conteneurs.length,
      totalCommandes,
      totalVendues,
      totalDisponibles,
      totalPrix,
    };
  }, [conteneurs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4 md:p-5 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Ship className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
                Liste des Conteneurs
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm md:text-base font-medium">
                  Tous les conteneurs CHARGE
                </p>
              </div>
            </div>
          </div>
          {stats.totalConteneurs > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-purple-200/50">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-gray-700">
                {stats.totalConteneurs} conteneur
                {stats.totalConteneurs !== 1 ? "s" : ""} actif
                {stats.totalConteneurs !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Conteneurs */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Ship className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-blue-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Total Conteneurs
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {stats.totalConteneurs}
              </p>
              <p className="text-blue-200 text-xs">Conteneurs CHARGE</p>
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
                {stats.totalCommandes}
              </p>
              <p className="text-purple-200 text-xs">Toutes les commandes</p>
            </CardContent>
          </Card>

          {/* Total Vendues */}
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
                {stats.totalVendues}
              </p>
              <p className="text-red-200 text-xs">Statut: VENDUE</p>
            </CardContent>
          </Card>

          {/* Total Disponibles */}
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
                Commandes Disponibles
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {stats.totalDisponibles}
              </p>
              <p className="text-green-200 text-xs">Statut: DISPONIBLE</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Conteneurs List */}
        <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl">
          <CardHeader className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white border-0 pb-8 pt-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left Section: Icon and Title */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-lg group-hover:scale-105 transition-transform duration-300">
                      <Truck className="h-7 w-7 md:h-8 md:w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3 flex items-center gap-3">
                      <Layers className="h-6 w-6 md:h-7 md:w-7" />
                      Conteneurs CHARGE
                    </CardTitle>
                    {/* Statistics Row */}
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm">
                        <div className="h-2 w-2 bg-green-300 rounded-full animate-pulse"></div>
                        <p className="text-white text-sm md:text-base font-semibold">
                          <span className="text-white/90">{conteneurs.length}</span>{" "}
                          <span className="text-purple-100">
                            conteneur{conteneurs.length !== 1 ? "s" : ""} trouvé
                            {conteneurs.length !== 1 ? "s" : ""}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20 shadow-sm">
                        <Package className="h-4 w-4 text-white/80" />
                        <p className="text-white text-sm md:text-base font-semibold">
                          <span className="text-white/90">{stats.totalCommandes}</span>{" "}
                          <span className="text-purple-100">
                            commande{stats.totalCommandes !== 1 ? "s" : ""} au total
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Section: Action Button */}
                <div className="flex items-center">
                  <Button
                    onClick={() => router.push("/manager/listeConteneurs/courriers")}
                    variant="outline"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-2 border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 h-auto font-semibold text-base md:text-lg group"
                  >
                    <Mail className="h-5 w-5 md:h-6 md:w-6 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline">Faire le courrier</span>
                    <span className="sm:hidden">Courrier</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-6 md:space-y-8">
              {conteneurs.length > 0 ? (
                conteneurs.map((conteneur, index) => (
                  <div
                    key={conteneur.id}
                    className="group relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/20 border-2 border-purple-200/60 p-6 md:p-8 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:border-purple-400/80 hover:-translate-y-2 backdrop-blur-sm"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: "fadeInUp 0.6s ease-out forwards",
                    }}
                  >
                    {/* Decorative gradient overlay */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Conteneur Header */}
                    <div className="mb-6 pb-6 border-b border-purple-200/60 relative z-10">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div className="flex items-start gap-5 flex-1">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                            <div className="relative bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 p-5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-purple-200/50">
                              <Ship className="h-8 w-8 text-purple-600" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-extrabold text-gray-900 text-2xl md:text-3xl">
                                {conteneur.conteneurNumber}
                              </h3>
                              <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-4 py-1.5 shadow-lg font-semibold">
                                {conteneur.etapeConteneur}
                              </Badge>
                            </div>
                            <div className="flex justify-between w-full">
                              <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-2 rounded-xl border border-purple-200/50 shadow-sm">
                                    <Hash className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-gray-900">
                                      Scellé:{" "}
                                      <span className="text-purple-700">
                                        {conteneur.sealNumber}
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

                                  <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-2 rounded-xl border border-green-200/50 shadow-sm ">
                                    <MapPin className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-semibold text-gray-900">
                                      Arrivée prévue:{" "}
                                      <span className="text-green-700"></span>
                                    </span>
                                  </div>
                                </div>

                                {/* Additional Info */}
                                <div className="flex flex-wrap items-center gap-3">
                                  {conteneur.totalPackages && (
                                    <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg font-semibold border border-gray-200">
                                      <Package className="h-3.5 w-3.5 text-gray-600" />
                                      <span>
                                        {conteneur.totalPackages} colis
                                      </span>
                                    </div>
                                  )}
                                  {(conteneur.grossWeight ||
                                    conteneur.netWeight) && (
                                    <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg font-semibold border border-gray-200">
                                      <Weight className="h-3.5 w-3.5 text-gray-600" />
                                      <span>
                                        {conteneur.grossWeight &&
                                          `Brut: ${conteneur.grossWeight}`}
                                        {conteneur.grossWeight &&
                                          conteneur.netWeight &&
                                          " / "}
                                        {conteneur.netWeight &&
                                          `Net: ${conteneur.netWeight}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2.5 ">
                                <Button
                                  onClick={async () => {
                                    setLoadingConteneurId(conteneur.id);
                                    const result = await updateConteneurToTransiteNonRenseigne(conteneur.id);
                                    setLoadingConteneurId(null);
                                    if (result.success) {
                                      router.refresh();
                                    } else {
                                      alert(result.error || "Erreur lors de la mise à jour");
                                    }
                                  }}
                                  disabled={loadingConteneurId === conteneur.id}
                                  variant="outline"
                                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ContainerIcon className="h-4 w-4" />
                                  {loadingConteneurId === conteneur.id ? "Mise à jour..." : "Mettre en Transite"}
                                </Button>
                              </div>
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
                                      <span className="font-semibold">
                                        Client:
                                      </span>
                                      <span className="truncate">
                                        {commande.client?.nom ||
                                          commande.clientEntreprise
                                            ?.nom_entreprise ||
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
                                        {commande.prix_unitaire.toLocaleString(
                                          "fr-FR"
                                        )}{" "}
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
                                      {new Date(
                                        commande.date_livraison
                                      ).toLocaleDateString("fr-FR", {
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
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-24 md:py-32 text-gray-400">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full blur-2xl opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 p-10 rounded-full shadow-inner">
                      <Ship className="h-24 w-24 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-center font-extrabold text-2xl md:text-3xl mb-3 text-gray-600">
                    Aucun conteneur trouvé
                  </p>
                  <p className="text-center text-base md:text-lg text-gray-500 max-w-md">
                    Aucun conteneur CHARGE pour le moment. Les conteneurs
                    apparaîtront ici une fois qu&apos;ils seront chargés.
                  </p>
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

export default ListeConteneursClient;
