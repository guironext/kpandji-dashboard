"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { markConteneurAsVerifie } from "@/lib/actions/conteneur";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Ship, 
  Layers, 
  FileCheck,
  CheckCircle
} from "lucide-react";

type SparePartType = {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  verificationName: string | null;
  quantity: number;
  etapeSparePart: string;
  statusVerification: string;
};

type CommandeType = {
  id: string;
  etapeCommande: string;
  transmission: string | null;
  voitureModel: {
    model: string;
  } | null;
  spareParts: SparePartType[];
};

type ConteneurType = {
  id: string;
  conteneurNumber: string;
  etapeConteneur: string;
  commandes: CommandeType[];
  subcases: {
    id: string;
    subcaseNumber: string;
    isVerified: boolean;
    spareParts: SparePartType[];
  }[];
};

type Props = {
  conteneurs: ConteneurType[];
};

type SparePartWithContext = SparePartType & {
  conteneurNumber: string;
  source: "commande" | "subcase";
  sourceId: string;
  sourceName?: string;
  subcaseNumber?: string | null;
  transmission?: string | null;
  voitureModel?: string | null;
  subcaseIsVerified?: boolean;
};

const VerificationClient: React.FC<Props> = ({ conteneurs }) => {
  const router = useRouter();
  const [loadingConteneurs, setLoadingConteneurs] = useState<Set<string>>(new Set());
  
  // Create mapping from conteneurNumber to conteneur data
  const conteneurMap = useMemo(() => {
    const map: Record<string, { id: string; isVerified: boolean; allSubcasesVerified: boolean }> = {};
    conteneurs.forEach((conteneur) => {
      const allSubcasesVerified = conteneur.subcases.length > 0 
        ? conteneur.subcases.every(subcase => subcase.isVerified)
        : true; // If no subcases, consider it verified
      map[conteneur.conteneurNumber] = {
        id: conteneur.id,
        isVerified: conteneur.etapeConteneur === 'VERIFIER' || conteneur.etapeConteneur === 'VERIFIE',
        allSubcasesVerified,
      };
    });
    return map;
  }, [conteneurs]);
  
  // Collect all spare parts from all conteneurs
  const allSpareParts = useMemo(() => {
    const spareParts: SparePartWithContext[] = [];

    conteneurs.forEach((conteneur) => {
      // Add spare parts from commandes
      conteneur.commandes.forEach((commande) => {
        commande.spareParts.forEach((sparePart) => {
          spareParts.push({
            ...sparePart,
            conteneurNumber: conteneur.conteneurNumber,
            source: "commande",
            sourceId: commande.id,
            transmission: commande.transmission,
            voitureModel: commande.voitureModel?.model || null,
            subcaseNumber: null,
          });
        });
      });

      // Add spare parts from subcases
      conteneur.subcases.forEach((subcase) => {
        subcase.spareParts.forEach((sparePart) => {
          spareParts.push({
            ...sparePart,
            conteneurNumber: conteneur.conteneurNumber,
            source: "subcase",
            sourceId: subcase.id,
            sourceName: subcase.subcaseNumber,
            subcaseNumber: subcase.subcaseNumber,
            transmission: null,
            voitureModel: null,
            subcaseIsVerified: subcase.isVerified,
          });
        });
      });
    });

    // Sort by conteneurNumber and subcaseNumber to group them together
    // Within the same conteneur: commandes (no subcase) first, then subcases sorted by number
    return spareParts.sort((a, b) => {
      const conteneurCompare = a.conteneurNumber.localeCompare(b.conteneurNumber);
      if (conteneurCompare !== 0) return conteneurCompare;
      
      // If both have subcaseNumber, sort by subcaseNumber
      if (a.subcaseNumber && b.subcaseNumber) {
        return a.subcaseNumber.localeCompare(b.subcaseNumber);
      }
      // If a has subcaseNumber but b doesn't, b (commande) comes first
      if (a.subcaseNumber && !b.subcaseNumber) {
        return 1;
      }
      // If b has subcaseNumber but a doesn't, a (commande) comes first
      if (!a.subcaseNumber && b.subcaseNumber) {
        return -1;
      }
      // Both are commandes (no subcase), keep original order
      return 0;
    });
  }, [conteneurs]);

  // Group spare parts by conteneur
  const sparePartsByConteneur = useMemo(() => {
    const grouped: Record<string, SparePartWithContext[]> = {};
    
    allSpareParts.forEach((sparePart) => {
      if (!grouped[sparePart.conteneurNumber]) {
        grouped[sparePart.conteneurNumber] = [];
      }
      grouped[sparePart.conteneurNumber].push(sparePart);
    });
    
    return grouped;
  }, [allSpareParts]);

  // Calculate rowSpan for spare parts within each conteneur
  const sparePartsWithRowSpanByConteneur = useMemo(() => {
    const result: Record<string, Array<SparePartWithContext & {
      subcaseRowSpan: number;
      isFirstSubcaseRow: boolean;
    }>> = {};
    
    Object.keys(sparePartsByConteneur).forEach((conteneurNumber) => {
      const spareParts = sparePartsByConteneur[conteneurNumber];
      
      result[conteneurNumber] = spareParts.map((sparePart, index) => {
        // Count how many consecutive rows have the same subcaseNumber
        // or how many consecutive rows don't have subcaseNumber (commandes)
        let subcaseRowSpan = 1;
        const currentSubcaseValue = sparePart.subcaseNumber || null;
        
        for (let i = index + 1; i < spareParts.length; i++) {
          const nextSubcaseValue = spareParts[i].subcaseNumber || null;
          // Compare both values (handles null comparison correctly)
          if (nextSubcaseValue === currentSubcaseValue || 
              (!nextSubcaseValue && !currentSubcaseValue)) {
            subcaseRowSpan++;
          } else {
            break;
          }
        }
        
        // Check if this is the first row with this subcaseNumber value
        const prevSubcaseValue = index > 0 ? (spareParts[index - 1].subcaseNumber || null) : null;
        const isFirstSubcaseRow = index === 0 || (prevSubcaseValue !== currentSubcaseValue);

        return {
          ...sparePart,
          subcaseRowSpan,
          isFirstSubcaseRow,
        };
      });
    });
    
    return result;
  }, [sparePartsByConteneur]);

  // Keep the old sparePartsWithRowSpan for statistics (backward compatibility)
  const sparePartsWithRowSpan = useMemo(() => {
    return allSpareParts.map((sparePart, index) => {
      // Count how many consecutive rows have the same conteneurNumber
      let conteneurRowSpan = 1;
      for (let i = index + 1; i < allSpareParts.length; i++) {
        if (allSpareParts[i].conteneurNumber === sparePart.conteneurNumber) {
          conteneurRowSpan++;
        } else {
          break;
        }
      }
      
      // Count how many consecutive rows have the same subcaseNumber (within the same conteneur)
      // or how many consecutive rows don't have subcaseNumber (commandes)
      let subcaseRowSpan = 1;
      const currentSubcaseValue = sparePart.subcaseNumber || null;
      
      for (let i = index + 1; i < allSpareParts.length; i++) {
        // Stop if we've moved to a different conteneur
        if (allSpareParts[i].conteneurNumber !== sparePart.conteneurNumber) {
          break;
        }
        const nextSubcaseValue = allSpareParts[i].subcaseNumber || null;
        // Compare both values (handles null comparison correctly)
        if (nextSubcaseValue === currentSubcaseValue || 
            (!nextSubcaseValue && !currentSubcaseValue)) {
          subcaseRowSpan++;
        } else {
          break;
        }
      }
      
      // Check if this is the first row with this conteneurNumber
      const isFirstConteneurRow = index === 0 || 
        allSpareParts[index - 1].conteneurNumber !== sparePart.conteneurNumber;

      // Check if this is the first row with this subcaseNumber value (within the same conteneur)
      const prevSubcaseValue = index > 0 ? (allSpareParts[index - 1].subcaseNumber || null) : null;
      const isFirstSubcaseRow = isFirstConteneurRow || 
        (allSpareParts[index - 1].conteneurNumber !== sparePart.conteneurNumber) ||
        (prevSubcaseValue !== currentSubcaseValue);

      return {
        ...sparePart,
        conteneurRowSpan,
        subcaseRowSpan,
        isFirstConteneurRow,
        isFirstSubcaseRow,
      };
    });
  }, [allSpareParts]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalConteneurs = new Set(allSpareParts.map(sp => sp.conteneurNumber)).size;
    const totalSubcases = new Set(
      allSpareParts.filter(sp => sp.subcaseNumber).map(sp => sp.subcaseNumber)
    ).size;
    const totalQuantity = allSpareParts.reduce((sum, sp) => sum + sp.quantity, 0);
    
    const statusCounts = {
      RETROUVE: allSpareParts.filter(sp => sp.statusVerification === "RETROUVE").length,
      MODIFIE: allSpareParts.filter(sp => sp.statusVerification === "MODIFIE").length,
      NON_RETROUVE: allSpareParts.filter(sp => sp.statusVerification === "NON_RETROUVE").length,
      EN_ATTENTE: allSpareParts.filter(sp => sp.statusVerification === "EN_ATTENTE").length,
    };

    return {
      totalConteneurs,
      totalSubcases,
      totalQuantity,
      totalSpareParts: allSpareParts.length,
      statusCounts,
    };
  }, [allSpareParts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Enhanced Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl blur-xl opacity-60 animate-pulse group-hover:opacity-80 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-4 md:p-5 rounded-3xl shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                  <FileCheck className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent tracking-tight">
                  Vérification des Pièces
                </h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm md:text-base font-medium">
                    Pièces en cours de dépotage - Suivi et vérification
                  </p>
                </div>
              </div>
            </div>
            {sparePartsWithRowSpan.length > 0 && (
              <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-md rounded-2xl shadow-lg border-2 border-blue-200/60">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 font-medium">Total Pièces</span>
                  <span className="text-xl font-extrabold text-gray-900">
                    {sparePartsWithRowSpan.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          {sparePartsWithRowSpan.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Conteneurs */}
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white transform hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-semibold mb-1">Conteneurs</p>
                      <p className="text-3xl font-extrabold">{stats.totalConteneurs}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <Ship className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Sous-caisses */}
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 text-white transform hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-semibold mb-1">Sous-caisses</p>
                      <p className="text-3xl font-extrabold">{stats.totalSubcases}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <Layers className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Quantité */}
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white transform hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-semibold mb-1">Quantité Totale</p>
                      <p className="text-3xl font-extrabold">{stats.totalQuantity}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <Package className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Summary */}
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white transform hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-semibold mb-1">Vérifiées</p>
                      <p className="text-3xl font-extrabold">{stats.statusCounts.RETROUVE}</p>
                      <p className="text-xs text-amber-200 mt-1">
                        {stats.statusCounts.EN_ATTENTE} en attente
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Enhanced Spare Parts Tables - One Card per Conteneur */}
        {sparePartsWithRowSpan.length > 0 ? (
          <div className="space-y-6">
            {Object.keys(sparePartsWithRowSpanByConteneur).map((conteneurNumber) => {
              const spareParts = sparePartsWithRowSpanByConteneur[conteneurNumber];
              const conteneurInfo = conteneurMap[conteneurNumber];
              const conteneurStats = {
                totalParts: spareParts.length,
                totalQuantity: spareParts.reduce((sum, sp) => sum + sp.quantity, 0),
                totalSubcases: new Set(spareParts.filter(sp => sp.subcaseNumber).map(sp => sp.subcaseNumber)).size,
              };
              
              const isVerified = conteneurInfo?.isVerified || false;
              const allSubcasesVerified = conteneurInfo?.allSubcasesVerified || false;
              const isLoading = conteneurInfo ? loadingConteneurs.has(conteneurInfo.id) : false;
              const canShowVerified = isVerified && allSubcasesVerified;
              
              const handleVerifyConteneur = async () => {
                if (!conteneurInfo || isVerified || isLoading) return;
                
                setLoadingConteneurs(prev => new Set(prev).add(conteneurInfo.id));
                
                try {
                  const result = await markConteneurAsVerifie(conteneurInfo.id);
                  if (result.success) {
                    router.refresh();
                  } else {
                    console.error("Failed to verify conteneur:", result.error);
                  }
                } catch (error) {
                  console.error("Error verifying conteneur:", error);
                } finally {
                  setLoadingConteneurs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(conteneurInfo.id);
                    return newSet;
                  });
                }
              };
              
              return (
                <Card key={conteneurNumber} className="border-0 shadow-2xl bg-white/90 backdrop-blur-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                          <Ship className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-white">
                            Conteneur {conteneurNumber}
                          </h2>
                          <p className="text-sm text-blue-100">
                            {conteneurStats.totalParts} pièce{conteneurStats.totalParts > 1 ? 's' : ''} • {conteneurStats.totalQuantity} unité{conteneurStats.totalQuantity > 1 ? 's' : ''} • {conteneurStats.totalSubcases} sous-caisse{conteneurStats.totalSubcases > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <Button 
                        type="button"
                        onClick={handleVerifyConteneur}
                        disabled={isVerified || isLoading}
                        className={`flex items-center gap-2 px-4 py-2 backdrop-blur-sm rounded-lg cursor-pointer transition-all duration-200 ${
                          canShowVerified
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                            : "bg-white/20 hover:bg-white/30 text-white"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <FileCheck className="h-4 w-4" />
                        <span className="font-semibold text-sm">
                          {isLoading ? "Vérification..." : canShowVerified ? "Déjà Vérifié" : "À vérifier"}
                        </span>
                      </Button>

                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200">
                            <TableHead className="font-extrabold text-gray-900 whitespace-nowrap px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-purple-600" />
                                Sous-caisse
                              </div>
                            </TableHead>
                            <TableHead className="font-extrabold text-gray-900 whitespace-nowrap px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-indigo-600" />
                                Code Pièce
                              </div>
                            </TableHead>
                            <TableHead className="font-extrabold text-gray-900 whitespace-nowrap px-4 py-4">
                              Nom Pièce
                            </TableHead>
                            <TableHead className="font-extrabold text-gray-900 whitespace-nowrap px-4 py-4 text-center">
                              Quantité
                            </TableHead>
                            <TableHead className="font-extrabold text-gray-900 whitespace-nowrap px-4 py-4 text-center">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {spareParts.map((sparePart, index) => (
                            <TableRow
                              key={`${sparePart.id}-${sparePart.conteneurNumber}-${sparePart.sourceId}-${sparePart.source}-${index}`}
                              className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-gray-100 group"
                            >
                              {sparePart.isFirstSubcaseRow ? (
                                <TableCell 
                                  className="font-semibold text-gray-900 align-top px-4 py-4 bg-gradient-to-br from-purple-50 to-pink-50 border-r-2 border-purple-200"
                                  rowSpan={sparePart.subcaseRowSpan}
                                >
                                  <div className="flex items-center gap-2">
                                    <Layers className="h-3 w-3 text-purple-600" />
                                    <span className="text-purple-700">
                                      {sparePart.subcaseNumber || (
                                        <span className="text-gray-400 italic">N/A</span>
                                      )}
                                    </span>
                                  </div>
                                </TableCell>
                              ) : null}
                              <TableCell className="font-mono font-bold text-gray-900 px-4 py-4">
                                <div className="bg-indigo-50 px-3 py-1.5 rounded-lg inline-block border border-indigo-200">
                                  {sparePart.partCode}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-800 font-medium px-4 py-4">
                                {sparePart.partName}
                              </TableCell>
                              <TableCell className="px-4 py-4 text-center">
                                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm px-3 py-1 shadow-md">
                                  {sparePart.quantity}
                                </Badge>
                              </TableCell>
                              {sparePart.isFirstSubcaseRow ? (
                                <TableCell 
                                  className="px-4 py-4 text-center align-top bg-gradient-to-br from-purple-50 to-pink-50 border-l-2 border-purple-200"
                                  rowSpan={sparePart.subcaseRowSpan}
                                >
                                  {sparePart.source === "subcase" && sparePart.sourceId ? (
                                    <div className="flex justify-center">
                                      <Button
                                        type="button"
                                        className={`${
                                          sparePart.subcaseIsVerified
                                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        } text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer`}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const targetUrl = `/magasinier/verification/${sparePart.sourceId}/verify`;
                                          console.log("Button clicked!", {
                                            sourceId: sparePart.sourceId,
                                            source: sparePart.source,
                                            targetUrl,
                                          });
                                          router.push(targetUrl);
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                        }}
                                      >
                                        <FileCheck className="h-4 w-4 mr-2" />
                                        {sparePart.subcaseIsVerified ? "Déjà Vérifié" : "A vérifier"}
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic text-sm">
                                      {sparePart.source === "subcase" ? "No ID" : "N/A"}
                                    </span>
                                  )}
                                </TableCell>
                              ) : null}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md">
            <CardContent className="p-16">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 p-8 rounded-full w-32 h-32 mx-auto flex items-center justify-center shadow-inner border-4 border-blue-200">
                    <Package className="h-16 w-16 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                  Aucune pièce en dépotage
                </h3>
                <p className="text-gray-600 font-medium text-lg max-w-md mx-auto">
                  Aucune pièce avec le statut DEPOTAGE_EN_COURS n&apos;a été trouvée pour le moment.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VerificationClient;
