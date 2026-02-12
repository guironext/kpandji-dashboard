"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Ship,
  Calendar,
  Weight,
  Hash,
  MapPin,
  Layers,
  Sparkles,
  TrendingUp,
  ClipboardCheck,
  ClipboardList,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

type DataType = {
  conteneurs: ConteneurType[];
  commandes: CommandeType[];
};

type Props = {
  data: DataType;
};

const ChefusineConteneurArriveClient = ({ data }: Props) => {
  const router = useRouter();
  const { conteneurs, commandes } = data;

  const stats = useMemo(() => {
    const totalConteneurs = conteneurs.length;
    const totalCommandesInConteneurs = conteneurs.reduce(
      (sum, c) => sum + c.commandes.length,
      0
    );
    const totalStandaloneCommandes = commandes.length;
    const totalCommandes = totalCommandesInConteneurs + totalStandaloneCommandes;

    const totalVenduesInConteneurs = conteneurs.reduce(
      (sum, c) =>
        sum + c.commandes.filter((cmd) => cmd.commandeFlag === "VENDUE").length,
      0
    );
    const totalVenduesStandalone = commandes.filter(
      (cmd) => cmd.commandeFlag === "VENDUE"
    ).length;

    return {
      totalConteneurs,
      totalCommandes,
      totalStandaloneCommandes,
      totalVendues: totalVenduesInConteneurs + totalVenduesStandalone,
    };
  }, [conteneurs, commandes]);

  const renderConteneur = (conteneur: ConteneurType) => {
    return (
      <div
        key={conteneur.id}
        className="group relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 border-2 border-green-200/60 hover:border-green-400/80 p-6 md:p-8 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 backdrop-blur-sm mb-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="mb-6 pb-6 border-b border-green-200/60 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-5 flex-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 border-green-200/50 p-5 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 border-2">
                  <Ship className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-extrabold text-gray-900 text-2xl md:text-3xl">
                    {conteneur.conteneurNumber}
                  </h3>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-4 py-1.5 shadow-lg font-semibold">
                    {conteneur.etapeConteneur}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-100 border-green-200/50 px-4 py-2 rounded-xl border shadow-sm">
                    <Hash className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      Scellé: <span className="text-green-700">{conteneur.sealNumber || "N/A"}</span>
                    </span>
                  </div>
                  {conteneur.dateEmbarquement && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-xl border border-blue-200/50 shadow-sm">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        Embarquement:{" "}
                        <span className="text-blue-700">
                          {new Date(conteneur.dateEmbarquement).toLocaleDateString("fr-FR", {
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
                          {new Date(conteneur.dateArriveProbable).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    {conteneur.totalPackages && (
                      <div className="group/badge relative overflow-hidden bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 px-4 py-2.5 rounded-xl border border-green-200/60 shadow-sm">
                        <div className="relative flex items-center gap-2.5">
                          <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-1.5 rounded-lg border border-green-200/50">
                            <Package className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Colis</span>
                            <span className="text-sm font-extrabold text-gray-900">{conteneur.totalPackages}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {(conteneur.grossWeight || conteneur.netWeight) && (
                      <div className="group/badge relative overflow-hidden bg-gradient-to-r from-teal-50 via-green-50 to-emerald-50 px-4 py-2.5 rounded-xl border border-teal-200/60 shadow-sm">
                        <div className="relative flex items-center gap-2.5">
                          <div className="bg-gradient-to-br from-teal-100 to-green-100 p-1.5 rounded-lg border border-teal-200/50">
                            <Weight className="h-4 w-4 text-teal-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Poids</span>
                            <span className="text-sm font-extrabold text-gray-900">
                              {conteneur.grossWeight && <span className="text-teal-700">Brut: {conteneur.grossWeight}</span>}
                              {conteneur.grossWeight && conteneur.netWeight && " / "}
                              {conteneur.netWeight && <span className="text-emerald-700">Net: {conteneur.netWeight}</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => router.push(`/chefusine/conteneur-renseigner/${conteneur.id}`)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md"
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Dépotage
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 relative z-10">
          <h4 className="font-bold text-gray-900 text-xl md:text-2xl flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2 rounded-xl">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            Commandes
            <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200">
              {conteneur.commandes.length}
            </Badge>
          </h4>

          {conteneur.commandes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conteneur.commandes.map((commande) => (
                <div key={commande.id} className="bg-gradient-to-br from-white via-green-50/40 to-emerald-50/30 rounded-2xl p-5 border-2 border-green-100/60">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-extrabold text-gray-900 text-lg">{commande.voitureModel?.model || "N/A"}</p>
                      <p className="text-xs text-gray-600">
                        Client: {commande.client?.nom || commande.clientEntreprise?.nom_entreprise || "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white">{commande.etapeCommande}</Badge>
                      <Badge className={commande.commandeFlag === "VENDUE" ? "bg-red-500" : "bg-green-500"}>
                        {commande.commandeFlag}
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50/60 via-emerald-50/40 to-teal-50/30 rounded-xl p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>Couleur: <span className="font-bold">{commande.couleur || "N/A"}</span></div>
                      <div>Moteur: <span className="font-bold">{commande.motorisation || "N/A"}</span></div>
                      <div>Transmission: <span className="font-bold">{commande.transmission || "N/A"}</span></div>
                      <div>Portes: <span className="font-bold">{commande.nbr_portes || "N/A"}</span></div>
                      <div className="col-span-2 pt-2 border-t border-green-100">
                        Livraison: <span className="font-bold">{new Date(commande.date_livraison).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <Package className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-semibold">Aucune commande dans ce conteneur</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStandaloneCommande = (commande: CommandeType) => {
    return (
      <div key={commande.id} className="bg-gradient-to-br from-white via-teal-50/40 to-cyan-50/30 rounded-2xl p-5 border-2 border-teal-100/60">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-extrabold text-gray-900 text-lg">{commande.voitureModel?.model || "N/A"}</p>
            <p className="text-xs text-gray-600">
              Client: {commande.client?.nom || commande.clientEntreprise?.nom_entreprise || "N/A"}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">{commande.etapeCommande}</Badge>
            <Badge className={commande.commandeFlag === "VENDUE" ? "bg-red-500" : "bg-green-500"}>
              {commande.commandeFlag}
            </Badge>
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-50/60 via-cyan-50/40 to-blue-50/30 rounded-xl p-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>Couleur: <span className="font-bold">{commande.couleur || "N/A"}</span></div>
            <div>Moteur: <span className="font-bold">{commande.motorisation || "N/A"}</span></div>
            <div>Transmission: <span className="font-bold">{commande.transmission || "N/A"}</span></div>
            <div>Portes: <span className="font-bold">{commande.nbr_portes || "N/A"}</span></div>
            <div className="col-span-2 pt-2 border-t border-teal-100">
              Livraison: <span className="font-bold">{new Date(commande.date_livraison).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const hasData = stats.totalConteneurs > 0 || stats.totalStandaloneCommandes > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/40 to-emerald-50/30 relative overflow-hidden p-4 md:p-6 lg:p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-green-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl blur-xl opacity-60"></div>
              <div className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-4 rounded-3xl shadow-2xl">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent">
                Conteneurs & Commandes Arrivés
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium">Conteneurs et commandes avec statut ARRIVE</p>
              </div>
            </div>
          </div>
          {hasData && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-green-200/50">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">
                {stats.totalConteneurs} conteneur(s) et {stats.totalStandaloneCommandes} commande(s) arrivé(e)s
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Ship className="h-8 w-8" />
              </div>
              <p className="text-green-100 text-sm font-semibold uppercase">Conteneurs Arrivés</p>
              <p className="text-4xl font-extrabold">{stats.totalConteneurs}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="h-8 w-8" />
              </div>
              <p className="text-emerald-100 text-sm font-semibold uppercase">Total Commandes</p>
              <p className="text-4xl font-extrabold">{stats.totalCommandes}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <ClipboardList className="h-8 w-8" />
              </div>
              <p className="text-teal-100 text-sm font-semibold uppercase">Commandes Singles</p>
              <p className="text-4xl font-extrabold">{stats.totalStandaloneCommandes}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <p className="text-rose-100 text-sm font-semibold uppercase">Commandes Vendues</p>
              <p className="text-4xl font-extrabold">{stats.totalVendues}</p>
            </CardContent>
          </Card>
        </div>

        {!hasData ? (
          <div className="text-center py-32 bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 rounded-3xl border-2 border-dashed border-gray-300">
            <Layers className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-2xl">Aucune donnée à afficher</p>
            <p className="text-gray-400 text-lg">Aucun conteneur ou commande avec statut ARRIVE</p>
          </div>
        ) : (
          <div className="space-y-8">
            {conteneurs.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-xl border border-green-200/50">
                    <Ship className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Conteneurs Arrivés</h2>
                </div>
                {conteneurs.map((conteneur) => renderConteneur(conteneur))}
              </div>
            )}

            {commandes.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-teal-100 to-cyan-100 p-3 rounded-xl border border-teal-200/50">
                    <ClipboardList className="h-6 w-6 text-teal-600" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Commandes Singles Arrivées</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {commandes.map((commande) => renderStandaloneCommande(commande))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefusineConteneurArriveClient;
