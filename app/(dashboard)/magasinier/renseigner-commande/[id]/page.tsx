"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getConteneur, markConteneurAsRenseigne } from "@/lib/actions/conteneur";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Package,
  Calendar,
  Ship,
  ArrowLeft,
  Plus,
  Box,
  AlertCircle,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Info,
  CheckCircle2,
} from "lucide-react";
import SubCaseDialog from "@/components/SubCaseDialog";
import AddSparePartDialog from "@/components/AddSparePartDialog";

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
  commandes: Array<{
    id: string;
    prix_unitaire: number | null;
    createdAt: string;
    updatedAt: string;
    date_livraison: string | null;
    client: {
      id: string;
      nom: string;
      email: string | null;
      createdAt: Date | string;
      updatedAt: Date | string;
      telephone: string;
      [key: string]: unknown;
    } | null;
    voitureModel: {
      id: string;
      model: string;
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  }>;
  subcases: Array<{
    id: string;
    subcaseNumber: string;
    createdAt: string;
    updatedAt: string;
    spareParts: Array<{
      id: string;
      partCode: string;
      partName: string;
      partNameFrench: string | null;
      quantity: number;
    }>;
  }>;
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


export default function RenseignerCommandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conteneurId = params.id as string;

  const [conteneur, setConteneur] = useState<Conteneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcaseDialogOpen, setSubcaseDialogOpen] = useState(false);
  const [sparePartDialogOpen, setSparePartDialogOpen] = useState<string | null>(null);
  const [isClosingConteneur, setIsClosingConteneur] = useState(false);

  const fetchConteneur = useCallback(async () => {
    if (!conteneurId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getConteneur(conteneurId);

      if (result.success && result.data) {
        setConteneur(result.data as Conteneur);
      } else {
        setError(result.error || "Failed to fetch conteneur");
      }
    } catch (err) {
      setError("An error occurred while fetching conteneur");
      console.error("Error fetching conteneur:", err);
    } finally {
      setLoading(false);
    }
  }, [conteneurId]);

  useEffect(() => {
    fetchConteneur();
  }, [fetchConteneur]);

  const handleSubcaseSuccess = () => {
    fetchConteneur();
  };

  const handleSparePartSuccess = () => {
    fetchConteneur();
  };

  const handleCloseConteneur = async () => {
    if (!conteneur) return;
    
    // Check if there are subcases
    if (conteneur.subcases.length === 0) {
      toast.error("Veuillez créer au moins un sub case avant de clôturer le conteneur");
      return;
    }

    // Check if all subcases have spare parts
    const subcasesWithoutParts = conteneur.subcases.filter(subcase => subcase.spareParts.length === 0);
    if (subcasesWithoutParts.length > 0) {
      toast.error(`Veuillez ajouter des pièces de rechange aux sub cases suivants: ${subcasesWithoutParts.map(s => s.subcaseNumber).join(", ")}`);
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir clôturer le conteneur ${conteneur.conteneurNumber} ? Cette action marquera le conteneur comme renseigné.`)) {
      return;
    }

    setIsClosingConteneur(true);
    try {
      const result = await markConteneurAsRenseigne(conteneur.id);
      if (result.success) {
        toast.success(`Le conteneur ${conteneur.conteneurNumber} a été clôturé avec succès!`);
        router.push("/magasinier/renseigner-commande");
      } else {
        toast.error(result.error || "Erreur lors de la clôture du conteneur");
      }
    } catch (error) {
      console.error("Error closing conteneur:", error);
      toast.error("Une erreur est survenue lors de la clôture du conteneur");
    } finally {
      setIsClosingConteneur(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Loader2 className="h-16 w-16 animate-spin text-purple-600 relative z-10 mx-auto" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-700">Chargement des informations...</p>
            <p className="text-sm text-gray-500 mt-1">Veuillez patienter</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !conteneur) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30">
        <Card className="max-w-md w-full shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2 border-red-200">
            <CardTitle className="text-red-600 flex items-center gap-2 text-xl">
              <AlertCircle className="w-6 h-6" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-700">{error || "Conteneur non trouvé"}</p>
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSpareParts = conteneur.subcases.reduce((sum, subcase) => sum + subcase.spareParts.length, 0);
  const totalSparePartsQuantity = conteneur.subcases.reduce(
    (sum, subcase) => sum + subcase.spareParts.reduce((s, p) => s + p.quantity, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30 p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-r from-white via-purple-50/30 to-indigo-50/20 border-2 border-purple-200/50 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Section - Back Button & Title */}
            <div className="flex items-start gap-4 flex-1">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
              
              <div className="flex items-center gap-4 flex-1">
                <div className="relative p-3 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-transform">
                  <Ship className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent mb-2">
                    Renseigner Conteneur en Transit
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-300 font-semibold px-3 py-1">
                      <Package className="w-3 h-3 mr-1.5" />
                      {conteneur.conteneurNumber}
                    </Badge>
                    <span className="text-slate-400 text-sm">•</span>
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold px-3 py-1">
                      TRANSITE
                    </Badge>
                    <span className="text-slate-400 text-sm">•</span>
                    <span className="text-slate-600 text-sm font-medium">
                      {conteneur.subcases.length} sub case{conteneur.subcases.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={handleCloseConteneur}
                disabled={isClosingConteneur || conteneur.subcases.length === 0}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClosingConteneur ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Clôture en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Clôturer le Conteneur
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Sub Cases</p>
                <p className="text-3xl font-bold text-purple-900">{conteneur.subcases.length}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-lg">
                <Box className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Commandes</p>
                <p className="text-3xl font-bold text-blue-900">{conteneur.commandes.length}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-lg">
                <FileText className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700 mb-1">Pièces Total</p>
                <p className="text-3xl font-bold text-indigo-900">{totalSpareParts}</p>
              </div>
              <div className="p-3 bg-indigo-200 rounded-lg">
                <Package className="w-6 h-6 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Quantité Total</p>
                <p className="text-3xl font-bold text-green-900">{totalSparePartsQuantity}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteneur Information Card */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 ring-2 ring-purple-100/50 hover:ring-purple-200/70 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50/60 to-blue-50/40 border-b-2 border-purple-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
                <Ship className="w-6 h-6 text-white" />
              </div>
              Informations du Conteneur
            </CardTitle>
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold px-4 py-1 text-sm">
              {conteneur.etapeConteneur}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Ship className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Numéro Conteneur</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{conteneur.conteneurNumber}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Info className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Numéro Scellé</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{conteneur.sealNumber}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Colis Total</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{conteneur.totalPackages || "N/A"}</p>
                </div>
              </div>
            </div>

            

            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-200 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Date Embarquement</p>
                  <p className="text-lg font-bold text-purple-900 mt-1">{formatDate(conteneur.dateEmbarquement)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-200 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-700" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Date Arrivée Probable</p>
                  <p className="text-lg font-bold text-green-900 mt-1">{formatDate(conteneur.dateArriveProbable)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Subcase Section */}
      <Card className="bg-gradient-to-r from-purple-50 via-indigo-50/60 to-blue-50/40 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Créer un nouveau Sub Case</h3>
                <p className="text-sm text-gray-600">Ajoutez un sub case pour organiser les pièces de rechange</p>
              </div>
            </div>
            <Button
              onClick={() => setSubcaseDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Subcase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subcases Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Sub Cases
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {conteneur.subcases.length} sub case{conteneur.subcases.length !== 1 ? "s" : ""} • {totalSpareParts} pièce{totalSpareParts !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {conteneur.subcases.length === 0 ? (
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-dashed border-gray-300">
            <CardContent className="p-16 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full blur-2xl opacity-20"></div>
                <Box className="w-20 h-20 text-gray-400 relative z-10 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                Aucun Sub Case
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Commencez par créer votre premier sub case pour organiser les pièces de rechange de ce conteneur.
              </p>
              <Button
                onClick={() => setSubcaseDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer le premier Sub Case
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {conteneur.subcases.map((subcase) => (
              <Card
                key={subcase.id}
                className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 group"
              >
                <CardHeader className="bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-blue-50/20 border-b-2 border-gray-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {subcase.subcaseNumber}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Créé le {formatDate(subcase.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold px-3 py-1 shadow-md">
                      {subcase.spareParts.length} pièce{subcase.spareParts.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Spare Parts List */}
                  {subcase.spareParts.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pièces de rechange</p>
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          {subcase.spareParts.reduce((sum, p) => sum + p.quantity, 0)} unités
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {subcase.spareParts.map((sparePart) => (
                          <div
                            key={sparePart.id}
                            className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-bold text-gray-900 text-sm">{sparePart.partCode}</p>
                                  <Badge className="bg-blue-100 text-blue-700 font-semibold text-xs">
                                    Qty: {sparePart.quantity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 font-medium">{sparePart.partName}</p>
                                {sparePart.partNameFrench && (
                                  <p className="text-xs text-gray-500 italic mt-1">
                                    {sparePart.partNameFrench}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-600 mb-1">Aucune pièce de rechange</p>
                      <p className="text-xs text-gray-500">Ajoutez des détails pour commencer</p>
                    </div>
                  )}

                  {/* Add Details Button */}
                  <Button
                    onClick={() => setSparePartDialogOpen(subcase.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 mt-4"
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    Ajouter Détails
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {conteneur && (
        <SubCaseDialog
          open={subcaseDialogOpen}
          onOpenChange={setSubcaseDialogOpen}
          conteneurId={conteneur.id}
          conteneurNumber={conteneur.conteneurNumber}
          sealNumber={conteneur.sealNumber}
          onSuccess={handleSubcaseSuccess}
        />
      )}

      {sparePartDialogOpen && conteneur && (
        <AddSparePartDialog
          open={!!sparePartDialogOpen}
          onOpenChange={(open) => !open && setSparePartDialogOpen(null)}
          subcaseId={sparePartDialogOpen}
          subcaseNumber={
            conteneur.subcases.find((s) => s.id === sparePartDialogOpen)?.subcaseNumber || ""
          }
          onSuccess={handleSparePartSuccess}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c084fc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a855f7;
        }
      `}</style>
    </div>
  );
}
