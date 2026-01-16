"use client";

import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Ship,
  Calendar,
  Weight,
  Hash,
  MapPin,
  Clock,
  Layers,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

type SparePartType = {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  etapeSparePart: string;
};

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
  spareParts: SparePartType[];
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
  subcases: {
    id: string;
    subcaseNumber: string;
    spareParts: SparePartType[];
  }[];
};

type Props = {
  conteneurs: ConteneurType[];
};

const DepotageClient: React.FC<Props> = ({ conteneurs }) => {
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
    const totalSpareParts = conteneurs.reduce(
      (sum, c) =>
        sum +
        c.commandes.reduce((cmdSum, cmd) => cmdSum + cmd.spareParts.length, 0) +
        c.subcases.reduce(
          (subSum, sub) => subSum + sub.spareParts.length,
          0
        ),
      0
    );
    return {
      totalConteneurs: conteneurs.length,
      totalCommandes,
      totalVendues,
      totalDisponibles,
      totalSpareParts,
    };
  }, [conteneurs]);

  const renderConteneur = (conteneur: ConteneurType, index: number) => {
    return (
      <div
        key={conteneur.id}
        className={`group relative overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 border-2 border-orange-200/60 hover:border-orange-400/80 p-6 md:p-8 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 backdrop-blur-sm`}
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
          className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        ></div>

        {/* Conteneur Header */}
        <div className="mb-6 pb-6 border-b border-orange-200/60 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-center gap-5 justify-between flex-1">
              <div className="relative">
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity`}
                ></div>
                <div
                  className={`relative bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 p-5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-orange-200/50`}
                >
                  <Ship className={`h-8 w-8 text-orange-600`} />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-extrabold text-gray-900 text-2xl md:text-3xl">
                    {conteneur.conteneurNumber}
                  </h3>
                  <Badge
                    className={`bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs px-4 py-1.5 shadow-lg font-semibold`}
                  >
                    {conteneur.etapeConteneur}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <div
                    className={`flex items-center gap-2 bg-gradient-to-r from-orange-50 to-amber-100 px-4 py-2 rounded-xl border border-orange-200/50 shadow-sm`}
                  >
                    <Hash className={`h-4 w-4 text-orange-600`} />
                    <span className="text-sm font-semibold text-gray-900">
                      Scellé:{" "}
                      <span className="text-orange-700">
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-orange-100/50">
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
              Commandes en Dépotage
              <Badge
                variant="secondary"
                className="ml-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200 text-sm px-4 py-1 font-semibold"
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
                  className="group/commande relative overflow-hidden bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 rounded-2xl p-5 md:p-6 border-2 border-orange-100/60 hover:border-orange-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  style={{
                    animationDelay: `${cmdIndex * 50}ms`,
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-2xl opacity-0 group-hover/commande:opacity-100 transition-opacity duration-300"></div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100 p-3 rounded-xl group-hover/commande:scale-110 transition-transform duration-300 border border-orange-200/50">
                        <Package className="h-5 w-5 text-orange-600" />
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
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs px-3 py-1 shadow-md font-semibold">
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
                  <div className="bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-yellow-50/30 rounded-xl p-4 border border-orange-100/60 relative z-10">
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
                      <div className="flex items-center gap-2 col-span-2 pt-2 border-t border-orange-100/50">
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
                      {commande.spareParts.length > 0 && (
                        <div className="col-span-2 pt-2 border-t border-orange-100/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-orange-600" />
                            <span className="text-gray-600 font-semibold">
                              Pièces en Dépotage ({commande.spareParts.length}):
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {commande.spareParts.map((sp) => (
                              <Badge
                                key={sp.id}
                                className="bg-orange-100 text-orange-700 border-orange-200 text-xs"
                              >
                                {sp.partCode} ({sp.quantity})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/20 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-inner">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-semibold text-lg">
                Aucune commande en dépotage dans ce conteneur
              </p>
            </div>
          )}
        </div>

        {/* Subcases with SpareParts */}
        {conteneur.subcases.some((sub) => sub.spareParts.length > 0) && (
          <div className="mt-6 space-y-5 relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-bold text-gray-900 text-xl md:text-2xl flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-2 rounded-xl">
                  <Layers className="h-5 w-5 text-indigo-600" />
                </div>
                Sous-caisses avec Pièces en Dépotage
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conteneur.subcases
                .filter((sub) => sub.spareParts.length > 0)
                .map((subcase) => (
                  <div
                    key={subcase.id}
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200"
                  >
                    <div className="font-semibold text-gray-900 mb-2">
                      {subcase.subcaseNumber}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subcase.spareParts.map((sp) => (
                        <Badge
                          key={sp.id}
                          className="bg-indigo-100 text-indigo-700 border-indigo-200 text-xs"
                        >
                          {sp.partCode} ({sp.quantity})
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/40 to-amber-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-amber-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-yellow-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Enhanced Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 p-4 md:p-5 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <CheckCircle2 className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-orange-800 to-amber-800 bg-clip-text text-transparent tracking-tight">
                Conteneurs en Dépotage
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                <p className="text-sm md:text-base font-medium">
                  Conteneurs, commandes et pièces avec statut DEPOTAGE_EN_COURS
                </p>
              </div>
            </div>
          </div>
          {stats.totalConteneurs > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-orange-200/50">
              <Sparkles className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-semibold text-gray-700">
                {stats.totalConteneurs} conteneur
                {stats.totalConteneurs !== 1 ? "s" : ""} en dépotage
              </span>
            </div>
          )}
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Conteneurs */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Ship className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-orange-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Conteneurs
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {stats.totalConteneurs}
              </p>
              <p className="text-orange-200 text-xs">En dépotage</p>
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
                Commandes
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {stats.totalCommandes}
              </p>
              <p className="text-purple-200 text-xs">En dépotage</p>
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
                Vendues
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {stats.totalVendues}
              </p>
              <p className="text-red-200 text-xs">Commandes</p>
            </CardContent>
          </Card>

          {/* Total SpareParts */}
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Layers className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <p className="text-indigo-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Pièces
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {stats.totalSpareParts}
              </p>
              <p className="text-indigo-200 text-xs">En dépotage</p>
            </CardContent>
          </Card>
        </div>

        {/* Conteneurs List */}
        {conteneurs.length > 0 ? (
          <div className="space-y-6 md:space-y-8">
            {conteneurs.map((conteneur, index) => renderConteneur(conteneur, index))}
          </div>
        ) : (
          <div className="text-center py-24 bg-gradient-to-br from-white via-orange-50/50 to-amber-50/30 rounded-3xl border-2 border-dashed border-orange-300 shadow-xl">
            <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-8 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center shadow-inner">
              <Ship className="h-16 w-16 text-orange-400" />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
              Aucun conteneur en dépotage
            </h3>
            <p className="text-gray-600 font-medium text-lg">
              Tous les conteneurs ont été traités ou aucun n'est actuellement en cours de dépotage
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepotageClient;
