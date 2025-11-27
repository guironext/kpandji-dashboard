"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getConteneursTransite } from "@/lib/actions/conteneur";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container, Loader2, Package, Calendar, Ship, ClipboardCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type Conteneur = {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  totalPackages: string | null;
  grossWeight: string | null;
  netWeight: string | null;
  stuffingMap: string | null;
  etapeConteneur: string;
  dateEmbarquement: string | null;
  dateArriveProbable: string | null;
  createdAt: string;
  updatedAt: string;
  commandes: unknown[];
  subcases: unknown[];
  verifications: unknown[];
  voitures: unknown[];
};

const formatDate = (date: string | Date | null): string => {
  if (!date) return "N/A";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export default function RenseignerCommandePage() {
  const router = useRouter();
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConteneurs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getConteneursTransite();
      
      if (result.success && result.data) {
        setConteneurs(result.data as Conteneur[]);
      } else {
        setError(result.error || "Failed to fetch conteneurs");
      }
    } catch (err) {
      setError("An error occurred while fetching conteneurs");
      console.error("Error fetching conteneurs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConteneurs();
  }, [fetchConteneurs]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Chargement des conteneurs en transit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={fetchConteneurs} className="w-full">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="relative p-4 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl shadow-purple-500/30 transform transition-transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <ClipboardCheck className="w-8 h-8 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent">
                Renseigner les Conteneurs en Transit
              </h1>
              <p className="text-slate-600 text-base md:text-lg mt-1 font-medium">
                Liste de tous les conteneurs avec statut TRANSITE
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-purple-600 border-purple-200 bg-purple-50 px-4 py-2 text-base font-semibold"
          >
            <Package className="w-5 h-5 mr-2" />
            {conteneurs.length} conteneur{conteneurs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Conteneurs Grid */}
      {conteneurs.length === 0 ? (
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="p-12 text-center">
            <Container className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun conteneur en transit
            </h3>
            <p className="text-gray-500">
              Il n&apos;y a actuellement aucun conteneur avec le statut TRANSITE.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conteneurs.map((conteneur) => {
            return (
              <Card
                key={conteneur.id}
                className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-2xl"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                     
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Ship className="w-5 h-5 text-purple-600" />
                          {conteneur.conteneurNumber}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Scellé: {conteneur.sealNumber}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold">
                      TRANSITE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Colis Total</p>
                      <p className="text-lg font-bold text-gray-900">
                        {conteneur.totalPackages || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Commandes</p>
                      <p className="text-lg font-bold text-gray-900">
                        {conteneur.commandes?.length || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-600">Embarquement:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(conteneur.dateEmbarquement)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">Arrivée probable:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(conteneur.dateArriveProbable)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push(`/magasinier/renseigner-commande/${conteneur.id}`)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    Renseigner
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
