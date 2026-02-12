"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getConteneur,
  updateConteneurToTransiteDejaRenseigne,
} from "@/lib/actions/conteneur";
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
  TrendingUp,
  Info,
  Edit,
  Trash2,
} from "lucide-react";
import SubCaseDialog from "@/components/SubCaseDialog";
import AddSparePartDialog from "@/components/AddSparePartDialog";
import EditSparePartDialog from "@/components/EditSparePartDialog";
import { deleteSparePart } from "@/lib/actions/subcase";

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
      verificationName: string | null;
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

export default function ConteneurRenseignerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conteneurId = params.id as string;

  const [conteneur, setConteneur] = useState<Conteneur | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcaseDialogOpen, setSubcaseDialogOpen] = useState(false);
  const [sparePartDialogOpen, setSparePartDialogOpen] = useState<string | null>(
    null
  );
  const [isClosingConteneur, setIsClosingConteneur] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<{
    id: string;
    partCode: string;
    partName: string;
    partNameFrench: string | null;
    verificationName: string | null;
    quantity: number;
    subcaseId: string;
  } | null>(null);
  const [deletingSparePartId, setDeletingSparePartId] = useState<string | null>(
    null
  );

  const fetchConteneur = useCallback(async () => {
    if (!conteneurId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getConteneur(conteneurId);

      if (result.success && result.data) {
        setConteneur(result.data as unknown as Conteneur);
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

  const handleEditSparePart = (
    sparePart: {
      id: string;
      partCode: string;
      partName: string;
      partNameFrench: string | null;
      verificationName: string | null;
      quantity: number;
    },
    subcaseId: string
  ) => {
    setEditingSparePart({
      id: sparePart.id,
      partCode: sparePart.partCode,
      partName: sparePart.partName,
      partNameFrench: sparePart.partNameFrench,
      verificationName: sparePart.verificationName,
      quantity: sparePart.quantity,
      subcaseId,
    });
  };

  const handleDeleteSparePart = async (sparePartId: string) => {
    if (
      !confirm("Êtes-vous sûr de vouloir supprimer cette pièce de rechange ?")
    ) {
      return;
    }

    setDeletingSparePartId(sparePartId);
    try {
      const result = await deleteSparePart(sparePartId);
      if (result.success) {
        toast.success("Pièce de rechange supprimée avec succès");
        fetchConteneur();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting spare part:", error);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setDeletingSparePartId(null);
    }
  };



  const handleCloseConteneur1 = useCallback(async () => {
    if (!conteneurId) {
      toast.error("ID du conteneur manquant");
      return;
    }
    
    setIsClosingConteneur(true);
    try {
      toast.loading("Mise à jour en cours...", {
        id: "updating-conteneur",
      });
      
      const result = await updateConteneurToTransiteDejaRenseigne(conteneurId);
      
      toast.dismiss("updating-conteneur");
      
      if (result.success) {
        toast.success(`Le conteneur et les commandes ont été marqués comme "transite déjà renseigné" avec succès!`, {
          duration: 3000,
        });
        setTimeout(() => {
          router.push("/magasinier/Conteneurs-renseigner");
        }, 1500);
      } else {
        console.error("Update failed:", result.error);
        toast.error(result.error || "Erreur lors de la clôture du conteneur");
      }
    } catch (error) {
      console.error("Error closing conteneur:", error);
      toast.dismiss("updating-conteneur");
      toast.error(`Une erreur est survenue lors de la clôture du conteneur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsClosingConteneur(false);
    }
  }, [conteneurId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="text-center space-y-6 relative z-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-100 to-indigo-100 p-6 rounded-full shadow-inner">
              <Loader2 className="h-12 w-12 md:h-16 md:w-16 animate-spin text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
              Chargement des informations...
            </p>
            <p className="text-sm md:text-base text-gray-500 mt-2">
              Veuillez patienter
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !conteneur) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30 relative overflow-hidden p-4">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-red-300/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-orange-300/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <Card className="max-w-md w-full shadow-2xl border-0 bg-white/95 backdrop-blur-xl relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
          <CardHeader className="relative bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-b-2 border-red-200/60">
            <CardTitle className="text-red-600 flex items-center gap-3 text-xl md:text-2xl font-bold">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6 relative z-10">
            <p className="text-gray-700 text-base">
              {error || "Conteneur non trouvé"}
            </p>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSpareParts = conteneur.subcases.reduce(
    (sum, subcase) => sum + subcase.spareParts.length,
    0
  );
  const totalSparePartsQuantity = conteneur.subcases.reduce(
    (sum, subcase) =>
      sum + subcase.spareParts.reduce((s, p) => s + p.quantity, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Fixed Action Button - Mobile Only (Floating Action Button) */}
      <div className="fixed bottom-6 right-6 z-[200] lg:hidden">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          <button
            type="button"
            onClick={handleCloseConteneur1}
            disabled={isClosingConteneur}
            className="relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isClosingConteneur ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mise à jour...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Fermer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fixed Close Button - Desktop Only */}
      <div className="hidden lg:block fixed top-24 right-8 z-[200]">
        <button
          type="button"
          onClick={handleCloseConteneur1}
          disabled={isClosingConteneur}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 h-10 px-6 py-2"
        >
          {isClosingConteneur ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Fermer le conteneur
            </>
          )}
        </button>
      </div>

      <div className="relative z-10 p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Enhanced Header */}
        <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl ring-1 ring-purple-100/50 hover:ring-purple-200/70 transition-all duration-300 overflow-hidden relative">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
              {/* Left Section - Back Button & Title */}
              <div className="flex items-start gap-4 flex-1">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all shrink-0 shadow-sm hover:shadow-md hover:scale-105"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Retour</span>
                </Button>

                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative p-4 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-xl shadow-purple-500/30 transform group-hover:scale-110 transition-transform duration-300">
                      <Ship className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent mb-3 leading-tight">
                      Renseigner Conteneur
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-300 font-semibold px-3 py-1.5 shadow-sm hover:shadow-md transition-shadow">
                        <Package className="w-3.5 h-3.5 mr-1.5" />
                        {conteneur.conteneurNumber}
                      </Badge>
                      <span className="text-slate-300 text-sm hidden sm:inline">
                        •
                      </span>
                      <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold px-3 py-1.5 shadow-md">
                        {conteneur.etapeConteneur}
                      </Badge>
                      <span className="text-slate-300 text-sm hidden sm:inline">
                        •
                      </span>
                      <span className="text-slate-600 text-sm font-medium bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                        {conteneur.subcases.length} sub case
                        {conteneur.subcases.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Box className="w-6 h-6" />
                </div>
              </div>
              <p className="text-purple-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Sub Cases
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {conteneur.subcases.length}
              </p>
              <p className="text-purple-200 text-xs">Total créés</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Package className="w-6 h-6" />
                </div>
              </div>
              <p className="text-indigo-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Pièces Total
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {totalSpareParts}
              </p>
              <p className="text-indigo-200 text-xs">Types différents</p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-green-100 text-sm font-semibold mb-2 uppercase tracking-wide">
                Quantité Total
              </p>
              <p className="text-4xl md:text-5xl font-extrabold mb-1">
                {totalSparePartsQuantity}
              </p>
              <p className="text-green-200 text-xs">Unités totales</p>
            </CardContent>
          </Card>
        </div>

        {/* Conteneur Information Card */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-0 ring-1 ring-purple-100/50 hover:ring-purple-200/70 transition-all duration-300 overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl opacity-50"></div>

          <CardHeader className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white border-0 pb-6 pt-6 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                  <Ship className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <span>Informations du Conteneur</span>
              </CardTitle>
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 font-semibold px-4 py-1.5 text-sm shadow-lg">
                {conteneur.etapeConteneur}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100/50 to-indigo-50/50 rounded-xl p-5 border-2 border-purple-200/60 hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Ship className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                      Numéro Conteneur
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                      {conteneur.conteneurNumber}
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 via-indigo-100/50 to-blue-50/50 rounded-xl p-5 border-2 border-indigo-200/60 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                      Numéro Scellé
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                      {conteneur.sealNumber}
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100/50 to-cyan-50/50 rounded-xl p-5 border-2 border-blue-200/60 hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                      Colis Total
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {conteneur.totalPackages || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100/50 to-pink-50/50 rounded-xl p-5 border-2 border-purple-200/60 hover:border-purple-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                      Date Embarquement
                    </p>
                    <p className="text-lg md:text-xl font-bold text-gray-900">
                      {formatDate(conteneur.dateEmbarquement)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-100/50 to-teal-50/50 rounded-xl p-5 border-2 border-green-200/60 hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                      Date Arrivée Probable
                    </p>
                    <p className="text-lg md:text-xl font-bold text-gray-900">
                      {formatDate(conteneur.dateArriveProbable)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Subcase Section */}
        <Card className="bg-gradient-to-r from-purple-50 via-indigo-50/60 to-blue-50/40 border-2 border-purple-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl blur-lg opacity-50 group-hover/icon:opacity-75 transition-opacity"></div>
                  <div className="relative p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg group-hover/icon:scale-110 transition-transform duration-300">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    Créer un nouveau Sub Case
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">
                    Ajoutez un sub case pour organiser les pièces de rechange
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setSubcaseDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2.5 transform hover:scale-105 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Ajouter Subcase</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subcases Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                  <Box className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent">
                  Sub Cases
                </h2>
                <p className="text-sm md:text-base text-gray-600 mt-1.5">
                  <span className="font-semibold text-gray-700">
                    {conteneur.subcases.length}
                  </span>{" "}
                  sub case{conteneur.subcases.length !== 1 ? "s" : ""} •{" "}
                  <span className="font-semibold text-gray-700">
                    {totalSpareParts}
                  </span>{" "}
                  pièce{totalSpareParts !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {conteneur.subcases.length === 0 ? (
            <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border-2 border-dashed border-purple-300/60 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-indigo-50/50"></div>
              <CardContent className="p-16 md:p-20 text-center relative z-10">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-purple-100 to-indigo-100 p-6 rounded-full shadow-inner">
                    <Box className="w-16 h-16 md:w-20 md:h-20 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent mb-3">
                  Aucun Sub Case
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-base">
                  Commencez par créer votre premier sub case pour organiser les
                  pièces de rechange de ce conteneur.
                </p>
                <Button
                  onClick={() => setSubcaseDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-2.5 transform hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Créer le premier Sub Case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {conteneur.subcases.map((subcase, index) => (
                <Card
                  key={subcase.id}
                  className="bg-white/95 backdrop-blur-xl shadow-xl border-2 border-gray-200/60 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 group overflow-hidden"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: "fadeInUp 0.6s ease-out forwards",
                  }}
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-indigo-200/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <CardHeader className="relative bg-gradient-to-r from-purple-50/80 via-indigo-50/60 to-blue-50/40 border-b-2 border-purple-100/60 pb-4 pt-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative group/icon">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl blur-lg opacity-50 group-hover/icon:opacity-75 transition-opacity"></div>
                          <div className="relative p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-md group-hover/icon:scale-110 transition-transform duration-300">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                            {subcase.subcaseNumber}
                          </CardTitle>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Créé le {formatDate(subcase.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold px-4 py-1.5 shadow-lg">
                        {subcase.spareParts.length} pièce
                        {subcase.spareParts.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4 relative z-10">
                    {/* Spare Parts List */}
                    {subcase.spareParts.length > 0 ? (
                      <div className="space-y-3">
                        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {subcase.spareParts.map((sparePart) => (
                            <div
                              key={sparePart.id}
                              className="group/part relative overflow-hidden bg-gradient-to-r from-gray-50 via-gray-100/50 to-gray-50 rounded-xl p-4 border-2 border-gray-200/60 hover:border-purple-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/10 rounded-full blur-xl opacity-0 group-hover/part:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <p className="font-bold text-gray-900 text-sm md:text-base">
                                      {sparePart.partCode}
                                    </p>
                                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-xs shadow-sm">
                                      Qty: {sparePart.quantity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm md:text-base text-gray-700 font-medium mb-1">
                                    {sparePart.partName}
                                  </p>
                                  {sparePart.partNameFrench && (
                                    <p className="text-xs text-gray-500 italic mt-1">
                                      {sparePart.partNameFrench}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    onClick={() =>
                                      handleEditSparePart(sparePart, subcase.id)
                                    }
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
                                    title="Modifier"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleDeleteSparePart(sparePart.id)
                                    }
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      deletingSparePartId === sparePart.id
                                    }
                                    className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50"
                                    title="Supprimer"
                                  >
                                    {deletingSparePartId === sparePart.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="relative inline-block mb-4">
                          <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl opacity-50"></div>
                          <Package className="w-12 h-12 text-gray-400 relative z-10 mx-auto" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          Aucune pièce de rechange
                        </p>
                        <p className="text-xs text-gray-500">
                          Ajoutez des pièces pour commencer
                        </p>
                      </div>
                    )}

                    {/* Add Spare Parts Button */}
                    <Button
                      onClick={() => setSparePartDialogOpen(subcase.id)}
                      className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 mt-4 transform hover:scale-[1.02]"
                    >
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      Ajouter Pièces de Rechange
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
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
          conteneurId={conteneur.id}
          onSuccess={handleSparePartSuccess}
        />
      )}

      {editingSparePart && (
        <EditSparePartDialog
          open={!!editingSparePart}
          onOpenChange={(open) => !open && setEditingSparePart(null)}
          sparePart={{
            id: editingSparePart.id,
            partCode: editingSparePart.partCode,
            partName: editingSparePart.partName,
            partNameFrench: editingSparePart.partNameFrench,
            verificationName: editingSparePart.verificationName,
            quantity: editingSparePart.quantity,
            etapeSparePart: "RENSEIGNE",
            createdAt: new Date(),
          }}
          subcaseId={editingSparePart.subcaseId}
          onSuccess={handleSparePartSuccess}
        />
      )}

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #c084fc 0%, #a855f7 100%);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #a855f7 0%, #9333ea 100%);
        }
      `}</style>
    </div>
  );
}
