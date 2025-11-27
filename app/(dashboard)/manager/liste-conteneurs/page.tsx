"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getAllConteneurs } from "@/lib/actions/conteneur";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container, Loader2, Package, Calendar, Ship } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusUpdateButton } from "./ListeConteneursClient";

type Conteneur = {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  totalPackages: string | null;
  grossWeight: string | null;
  netWeight: string | null;
  stuffingMap: string | null;
  etapeConteneur: string;
  dateEmbarquement: Date | string | null;
  dateArriveProbable: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  commandes: unknown[];
  subcases: unknown[];
  verifications: unknown[];
  voitures: unknown[];
};

const ETAPE_LABELS: Record<string, string> = {
  EN_ATTENTE: "En Attente",
  CHARGE: "Chargé",
  TRANSITE: "En Transit",
  RENSEIGNE: "Renseigné",
  ARRIVE: "Arrivé",
  DECHARGE: "Déchargé",
  VERIFIE: "Vérifié",
};

const ETAPE_COLORS: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-100 border-yellow-500 text-yellow-800",
  CHARGE: "bg-blue-100 border-blue-500 text-blue-800",
  TRANSITE: "bg-purple-100 border-purple-500 text-purple-800",
  RENSEIGNE: "bg-indigo-100 border-indigo-500 text-indigo-800",
  ARRIVE: "bg-green-100 border-green-500 text-green-800",
  DECHARGE: "bg-orange-100 border-orange-500 text-orange-800",
  VERIFIE: "bg-emerald-100 border-emerald-500 text-emerald-800",
};

export default function ListeConteneursPage() {
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConteneurs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllConteneurs();
      
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

  // Group conteneurs by etapeConteneur
  const groupedByEtape = useMemo(() => {
    const grouped: Record<string, Conteneur[]> = {};
    conteneurs.forEach((conteneur) => {
      const etape = conteneur.etapeConteneur;
      if (!grouped[etape]) {
        grouped[etape] = [];
      }
      grouped[etape].push(conteneur);
    });
    return grouped;
  }, [conteneurs]);

  // Sort etapes in a logical order
  const sortedEtapes = useMemo(() => {
    const order = [
      "EN_ATTENTE",
      "CHARGE",
      "TRANSITE",
      "RENSEIGNE",
      "ARRIVE",
      "DECHARGE",
      "VERIFIE",
    ];
    return Object.keys(groupedByEtape).sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      return (
        (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      );
    });
  }, [groupedByEtape]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">
            Chargement des conteneurs...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
        <Card className="bg-white shadow-xl border-2 border-red-200">
          <CardContent className="text-center py-16">
            <p className="text-red-600 font-semibold">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="relative p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/30 transform transition-transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            <Container className="w-8 h-8 text-white relative z-10" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
              Liste des Conteneurs
            </h1>
            <p className="text-gray-600 text-sm md:text-base mt-1 font-medium">
              Vue d&apos;ensemble de tous les conteneurs classés par étape
            </p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="mb-8">
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 ring-2 ring-blue-100/50 hover:ring-blue-200/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Conteneurs</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">
                    {conteneurs.length}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Étapes actives</p>
                <p className="text-3xl font-extrabold text-gray-800 mt-1">
                  {sortedEtapes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Conteneurs */}
      {conteneurs.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 ring-2 ring-blue-100/50">
          <CardContent className="text-center py-20">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl w-fit mx-auto mb-6">
              <Container className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Aucun conteneur
            </h3>
            <p className="text-gray-500 font-medium">
              Les conteneurs apparaîtront ici une fois créés
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sortedEtapes.map((etape) => {
            const conteneursInEtape = groupedByEtape[etape];
            const etapeLabel = ETAPE_LABELS[etape] || etape;
            const etapeColor = ETAPE_COLORS[etape] || "bg-gray-100 border-gray-500 text-gray-800";
            const [bgColor, borderColor, textColor] = etapeColor.split(' ');

            return (
              <div key={etape} className="space-y-5">
                <Card className={`shadow-xl border-l-[6px] ${borderColor} bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300`}>
                  <CardHeader className={`bg-gradient-to-r ${bgColor} to-white/50 border-b-2 ${borderColor}/30`}>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${bgColor} shadow-lg transform transition-transform hover:scale-110`}>
                          <Ship className={`h-6 w-6 ${textColor}`} />
                        </div>
                        <div>
                          <span className="text-lg">{etapeLabel}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${etapeColor} font-bold px-4 py-1.5 text-sm shadow-md`}>
                        {conteneursInEtape.length}{" "}
                        {conteneursInEtape.length === 1 ? "conteneur" : "conteneurs"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <div className="-mt-6">
                  <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 ring-2 ring-gray-100/50 hover:ring-gray-200/70 transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-gray-50 via-blue-50/60 to-indigo-50/40 border-b-2 border-gray-200">
                              <TableHead className="font-extrabold text-gray-900 py-5 text-sm uppercase tracking-wide">
                                Numéro Conteneur
                              </TableHead>
                              <TableHead className="font-extrabold text-gray-900 py-5 text-sm uppercase tracking-wide">
                                Numéro Scellé
                              </TableHead>
                              <TableHead className="font-extrabold text-gray-900 py-5 text-center text-sm uppercase tracking-wide">
                                Colis Total
                              </TableHead>
                              <TableHead className="font-extrabold text-gray-900 py-5 text-center text-sm uppercase tracking-wide">
                                Date Embarquement
                              </TableHead>
                              <TableHead className="font-extrabold text-gray-900 py-5 text-center text-sm uppercase tracking-wide">
                                Date Arrivée Probable
                              </TableHead>
                              <TableHead className="font-extrabold text-gray-900 py-5 text-center text-sm uppercase tracking-wide">
                                Commandes
                              </TableHead>
                              <TableHead className="font-extrabold text-gray-900 py-5 text-center text-sm uppercase tracking-wide">
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {conteneursInEtape.map((conteneur, index) => (
                              <TableRow
                                key={conteneur.id}
                                className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                }`}
                              >
                                <TableCell className="font-bold text-gray-900 py-4">
                                  <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 font-semibold px-3 py-1 shadow-sm">
                                    {conteneur.conteneurNumber}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-700 font-medium">
                                  {conteneur.sealNumber}
                                </TableCell>
                                <TableCell className="text-center">
                                  {conteneur.totalPackages ? (
                                    <Badge className="bg-gray-100 text-gray-700 font-semibold">
                                      {conteneur.totalPackages}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400 italic">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1.5 text-sm">
                                    <Calendar className="w-4 h-4 text-purple-600" />
                                    <span className="font-medium text-gray-700">{formatDate(conteneur.dateEmbarquement)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1.5 text-sm">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-gray-700">{formatDate(conteneur.dateArriveProbable)}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold shadow-md px-3 py-1">
                                    {conteneur.commandes?.length || 0}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <StatusUpdateButton
                                    conteneur={conteneur}
                                    onUpdate={fetchConteneurs}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
