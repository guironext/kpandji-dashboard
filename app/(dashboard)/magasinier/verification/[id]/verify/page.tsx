"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSubcase, updateSubcase } from "@/lib/actions/subcase";
import { updateSparePartVerificationStatus, updateSparePart } from "@/lib/actions/subcase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Package,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  QrCode,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import VerificationScanner from "@/components/VerificationScanner";

type Subcase = {
  id: string;
  subcaseNumber: string;
  isVerified: boolean;
  spareParts: Array<{
    id: string;
    partCode: string;
    partName: string;
    partNameFrench: string | null;
    verificationName: string | null;
    quantity: number;
    etapeSparePart: string;
    statusVerification: string;
    createdAt: string;
    updatedAt: string;
  }>;
};

type VerificationStatus = "RETROUVE" | "MODIFIE" | "NON_RETROUVE" | "EN_ATTENTE";

export default function SubcaseVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const subcaseId = params.id as string;

  const [subcase, setSubcase] = useState<Subcase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSparePartIds, setSelectedSparePartIds] = useState<Set<string>>(new Set());
  const [verificationStatuses, setVerificationStatuses] = useState<Record<string, VerificationStatus>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingQuantity, setEditingQuantity] = useState<Record<string, number>>({});

  const fetchSubcase = useCallback(async () => {
    if (!subcaseId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getSubcase(subcaseId);

      if (result.success && result.data) {
        const subcaseData = result.data as unknown as Subcase;
        setSubcase(subcaseData);
        // Initialize verification statuses
        const initialStatuses: Record<string, VerificationStatus> = {};
        subcaseData.spareParts.forEach((sp) => {
          initialStatuses[sp.id] = sp.statusVerification as VerificationStatus;
        });
        setVerificationStatuses(initialStatuses);
      } else {
        setError(result.error || "Failed to fetch subcase");
        toast.error(result.error || "Failed to fetch subcase");
      }
    } catch (err) {
      setError("An error occurred while fetching subcase");
      toast.error("An error occurred while fetching subcase");
      console.error("Error fetching subcase:", err);
    } finally {
      setLoading(false);
    }
  }, [subcaseId]);

  useEffect(() => {
    fetchSubcase();
  }, [fetchSubcase]);

  const parseQRCodeData = (qrData: string): { verificationName?: string; quantity?: number } => {
    // Try to parse JSON first
    try {
      const parsed = JSON.parse(qrData);
      return {
        verificationName: parsed.verificationName || parsed.name || parsed.partName,
        quantity: parsed.quantity ? parseInt(parsed.quantity) : undefined,
      };
    } catch {
      // If not JSON, try to extract verificationName and quantity from string
      // Format might be: "verificationName|quantity" or just "verificationName"
      const parts = qrData.split("|");
      const result: { verificationName?: string; quantity?: number } = {};
      
      if (parts.length >= 1) {
        result.verificationName = parts[0].trim();
      }
      if (parts.length >= 2) {
        const qty = parseInt(parts[1].trim());
        if (!isNaN(qty)) {
          result.quantity = qty;
        }
      }
      
      // If no separator, assume the whole string is verificationName
      if (parts.length === 1 && !result.verificationName) {
        result.verificationName = qrData.trim();
      }
      
      return result;
    }
  };

  const handleQRScan = async (qrData: string) => {
    if (selectedSparePartIds.size === 0 || !subcase) {
      toast.error("Veuillez sélectionner au moins une pièce à vérifier");
      return;
    }

    const qrParsed = parseQRCodeData(qrData);
    let matchedPart: typeof subcase.spareParts[0] | null = null;
    let bestMatch: { part: typeof subcase.spareParts[0]; matchScore: number } | null = null;

    // Try to find a match among ALL selected parts (regardless of their current status)
    for (const sparePartId of selectedSparePartIds) {
      const sparePart = subcase.spareParts.find((sp) => sp.id === sparePartId);
      if (!sparePart) continue;

      // Compare verificationName
      const verificationNameMatch = sparePart.verificationName 
        ? sparePart.verificationName.trim().toLowerCase() === (qrParsed.verificationName || "").trim().toLowerCase()
        : false;

      // Compare quantity if both are available
      let quantityMatch = false;
      if (qrParsed.quantity !== undefined && sparePart.quantity !== undefined) {
        quantityMatch = sparePart.quantity === qrParsed.quantity;
      }

      // Calculate match score (2 = both match, 1 = name only, 0 = no match)
      const matchScore = verificationNameMatch ? (quantityMatch ? 2 : 1) : 0;

      if (matchScore === 2) {
        // Perfect match found
        matchedPart = sparePart;
        break;
      } else if (matchScore === 1 && (!bestMatch || bestMatch.matchScore < 1)) {
        bestMatch = { part: sparePart, matchScore: 1 };
      }
    }

    // Use perfect match or best partial match
    const targetPart = matchedPart || bestMatch?.part;
    
    if (!targetPart) {
      toast.error("Aucune correspondance trouvée parmi les pièces sélectionnées");
      return;
    }

    const qrParsedForMatch = parseQRCodeData(qrData);
    const verificationNameMatch = targetPart.verificationName 
      ? targetPart.verificationName.trim().toLowerCase() === (qrParsedForMatch.verificationName || "").trim().toLowerCase()
      : false;

    let quantityMatch = false;
    if (qrParsedForMatch.quantity !== undefined && targetPart.quantity !== undefined) {
      quantityMatch = targetPart.quantity === qrParsedForMatch.quantity;
    }

    let newStatus: VerificationStatus;
    let message: string;

    if (verificationNameMatch && quantityMatch) {
      // Both match: "Retrouvé" (green)
      newStatus = "RETROUVE";
      message = "Retrouvé";
    } else if (verificationNameMatch && !quantityMatch) {
      // Name matches but quantity differs: "modifié" (yellow)
      newStatus = "MODIFIE";
      message = "modifié";
    } else {
      // Name doesn't match: "non retrouvé" (red)
      newStatus = "NON_RETROUVE";
      message = "non retrouvé";
    }

    // Update status in database
    try {
      const result = await updateSparePartVerificationStatus(targetPart.id, newStatus);
      if (result.success) {
        // Update local state
        setVerificationStatuses((prev) => ({
          ...prev,
          [targetPart.id]: newStatus,
        }));
        
        // Update subcase data
        setSubcase((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            spareParts: prev.spareParts.map((sp) =>
              sp.id === targetPart.id
                ? { ...sp, statusVerification: newStatus }
                : sp
            ),
          };
        });

        toast.success(`Pièce vérifiée: ${message}`, {
          description: `Code: ${targetPart.partCode} - ${message}`,
        });
        
        // Remove from selection after verification
        setSelectedSparePartIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(targetPart.id);
          return newSet;
        });
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour du statut");
      }
    } catch (err) {
      console.error("Error updating verification status:", err);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleQuantityUpdate = async (sparePartId: string, newQuantity: number) => {
    if (!subcase) return;

    const sparePart = subcase.spareParts.find((sp) => sp.id === sparePartId);
    if (!sparePart) return;

    if (newQuantity === sparePart.quantity) {
      // No change, just clear editing state
      setEditingQuantity((prev) => {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
        const newState = { ...prev };
        delete newState[sparePartId];
        return newState;
      });
      return;
    }

    try {
      // Update quantity and set status to MODIFIE
      const result = await updateSparePart(sparePartId, {
        quantity: newQuantity,
        statusVerification: "MODIFIE",
      });

      if (result.success) {
        // Update local state
        setVerificationStatuses((prev) => ({
          ...prev,
          [sparePartId]: "MODIFIE",
        }));

        // Update subcase data
        setSubcase((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            spareParts: prev.spareParts.map((sp) =>
              sp.id === sparePartId
                ? { ...sp, quantity: newQuantity, statusVerification: "MODIFIE" }
                : sp
            ),
          };
        });

        // Clear editing state
        setEditingQuantity((prev) => {
          const newState = { ...prev };
          delete newState[sparePartId];
          return newState;
        });

        toast.success("Quantité mise à jour", {
          description: `Code: ${sparePart.partCode} - Nouvelle quantité: ${newQuantity}`,
        });
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour de la quantité");
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast.error("Erreur lors de la mise à jour de la quantité");
    }
  };

  const toggleSparePartSelection = (sparePartId: string) => {
    setSelectedSparePartIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sparePartId)) {
        newSet.delete(sparePartId);
      } else {
        newSet.add(sparePartId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!subcase) return;
    
    const filteredParts = getFilteredSpareParts();
    // Exclude parts with status RETROUVE
    const selectableParts = filteredParts.filter((sp) => {
      const status = verificationStatuses[sp.id] || (sp.statusVerification as VerificationStatus);
      return status !== "RETROUVE";
    });
    
    // Check if all selectable parts are already selected
    const allSelectableSelected = selectableParts.every((sp) => selectedSparePartIds.has(sp.id));
    
    if (allSelectableSelected) {
      // Deselect all
      setSelectedSparePartIds(new Set());
    } else {
      // Select all selectable parts (excluding RETROUVE)
      setSelectedSparePartIds(new Set(selectableParts.map((sp) => sp.id)));
    }
  };

  const handleVerifySubcase = async () => {
    if (!subcase) return;

    try {
      const result = await updateSubcase(subcase.id, { isVerified: true });
      if (result.success) {
        // Update local state
        setSubcase((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            isVerified: true,
          };
        });
        toast.success("Sous-caisse vérifiée avec succès");
      } else {
        toast.error(result.error || "Erreur lors de la vérification de la sous-caisse");
      }
    } catch (err) {
      console.error("Error verifying subcase:", err);
      toast.error("Erreur lors de la vérification de la sous-caisse");
    }
  };

  const getFilteredSpareParts = () => {
    if (!subcase) return [];
    
    if (!searchQuery.trim()) {
      return subcase.spareParts;
    }

    const query = searchQuery.toLowerCase().trim();
    return subcase.spareParts.filter((sp) => {
      return (
        sp.partCode.toLowerCase().includes(query) ||
        sp.partName.toLowerCase().includes(query) ||
        (sp.partNameFrench && sp.partNameFrench.toLowerCase().includes(query)) ||
        (sp.verificationName && sp.verificationName.toLowerCase().includes(query)) ||
        sp.quantity.toString().includes(query)
      );
    });
  };

  const getStatusColor = (status: VerificationStatus): string => {
    switch (status) {
      case "RETROUVE":
        return "bg-gradient-to-r from-green-500 to-emerald-600";
      case "MODIFIE":
        return "bg-gradient-to-r from-yellow-500 to-amber-600";
      case "NON_RETROUVE":
        return "bg-gradient-to-r from-red-500 to-rose-600";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const getStatusLabel = (status: VerificationStatus): string => {
    switch (status) {
      case "RETROUVE":
        return "Retrouvé";
      case "MODIFIE":
        return "modifié";
      case "NON_RETROUVE":
        return "non retrouvé";
      default:
        return "EN_ATTENTE";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Chargement des données de la sous-caisse...</p>
        </div>
      </div>
    );
  }

  if (error || !subcase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error || "Sous-caisse introuvable"}</p>
            <Button onClick={() => router.push("/magasinier/verification")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredSpareParts = getFilteredSpareParts();
  const selectedSpareParts = subcase
    ? subcase.spareParts.filter((sp) => selectedSparePartIds.has(sp.id))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/magasinier/verification")}
            className="bg-white/80 backdrop-blur-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Vérification QR Code - Sous-caisse {subcase.subcaseNumber}
            </h1>
            <p className="text-gray-600 mt-1">Scannez le QR code de chaque pièce pour vérification</p>
          </div>
          <Button
            onClick={handleVerifySubcase}
            disabled={subcase.isVerified}
            className={`${
              subcase.isVerified
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {subcase.isVerified ? "Déjà Vérifié" : "vérification en cours"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spare Parts List */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md">
              <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Package className="h-6 w-6" />
                    Pièces de Rechange ({subcase.spareParts.length})
                  </CardTitle>
                  {filteredSpareParts.length > 0 && (() => {
                    const selectableParts = filteredSpareParts.filter((sp) => {
                      const status = verificationStatuses[sp.id] || (sp.statusVerification as VerificationStatus);
                      return status !== "RETROUVE";
                    });
                    const allSelectableSelected = selectableParts.every((sp) => selectedSparePartIds.has(sp.id));
                    
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleSelectAll}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      >
                        {allSelectableSelected ? (
                          <>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Tout désélectionner
                          </>
                        ) : (
                          <>
                            <Square className="h-4 w-4 mr-2" />
                            Tout sélectionner ({selectableParts.length})
                          </>
                        )}
                      </Button>
                    );
                  })()}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Rechercher par code, nom, nom français, nom vérification ou quantité..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  {searchQuery && (
                    <p className="text-sm text-gray-600 mt-2">
                      {filteredSpareParts.length} résultat(s) trouvé(s)
                    </p>
                  )}
                </div>

                {filteredSpareParts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
                          <TableHead className="font-extrabold w-12">Sélection</TableHead>
                          <TableHead className="font-extrabold">Code Pièce</TableHead>
                          <TableHead className="font-extrabold">Nom Pièce</TableHead>
                          <TableHead className="font-extrabold">Nom Vérification</TableHead>
                          <TableHead className="font-extrabold text-center">Quantité</TableHead>
                          <TableHead className="font-extrabold text-center">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSpareParts.map((sparePart) => {
                          const status = verificationStatuses[sparePart.id] || (sparePart.statusVerification as VerificationStatus);
                          const isSelected = selectedSparePartIds.has(sparePart.id);
                          
                          return (
                            <TableRow
                              key={sparePart.id}
                              className={`hover:bg-indigo-50/50 cursor-pointer transition-all ${
                                isSelected ? "bg-blue-100 border-2 border-blue-500" : ""
                              }`}
                              onClick={() => toggleSparePartSelection(sparePart.id)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center">
                                  {isSelected ? (
                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <Square className="h-5 w-5 text-gray-400 border-2 border-gray-300 rounded" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono font-bold">{sparePart.partCode}</TableCell>
                              <TableCell className="font-medium">{sparePart.partName}</TableCell>
                              <TableCell className="font-mono text-sm">{sparePart.verificationName || "N/A"}</TableCell>
                              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                {editingQuantity[sparePart.id] !== undefined ? (
                                  <div className="flex items-center gap-2 justify-center">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={editingQuantity[sparePart.id]}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setEditingQuantity((prev) => ({
                                          ...prev,
                                          [sparePart.id]: value,
                                        }));
                                      }}
                                      onBlur={() => {
                                        const newQty = editingQuantity[sparePart.id];
                                        if (newQty !== undefined && newQty >= 0) {
                                          handleQuantityUpdate(sparePart.id, newQty);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          const newQty = editingQuantity[sparePart.id];
                                          if (newQty !== undefined && newQty >= 0) {
                                            handleQuantityUpdate(sparePart.id, newQty);
                                          }
                                        } else if (e.key === "Escape") {
                                          setEditingQuantity((prev) => {
                                            const newState = { ...prev };
                                            delete newState[sparePart.id];
                                            return newState;
                                          });
                                        }
                                      }}
                                      className="w-20 text-center font-bold"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const newQty = editingQuantity[sparePart.id];
                                        if (newQty !== undefined && newQty >= 0) {
                                          handleQuantityUpdate(sparePart.id, newQty);
                                        }
                                      }}
                                      className="h-7 px-2"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 justify-center group">
                                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold cursor-pointer hover:opacity-80 transition-opacity">
                                      {sparePart.quantity}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingQuantity((prev) => ({
                                          ...prev,
                                          [sparePart.id]: sparePart.quantity,
                                        }));
                                      }}
                                      className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Modifier la quantité"
                                    >
                                      <Edit className="h-3 w-3 text-gray-500" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={`${getStatusColor(status)} text-white font-semibold`}>
                                  <div className="flex items-center gap-1.5">
                                    {status === "RETROUVE" && <CheckCircle className="h-3 w-3" />}
                                    {status === "MODIFIE" && <Edit className="h-3 w-3" />}
                                    {status === "NON_RETROUVE" && <XCircle className="h-3 w-3" />}
                                    {status === "EN_ATTENTE" && <AlertCircle className="h-3 w-3" />}
                                    {getStatusLabel(status)}
                                  </div>
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">
                      {searchQuery
                        ? "Aucun résultat trouvé pour votre recherche"
                        : "Aucune pièce de rechange dans cette sous-caisse"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* QR Scanner Panel */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <QrCode className="h-6 w-6" />
                  Scanner QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedSpareParts.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        {selectedSpareParts.length} pièce(s) sélectionnée(s):
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedSpareParts.map((sparePart) => (
                          <div key={sparePart.id} className="text-xs border-b border-blue-200 pb-2 last:border-0">
                            <p className="font-mono text-blue-700 font-semibold">{sparePart.partCode}</p>
                            <p className="text-blue-600">{sparePart.partName}</p>
                            <p className="text-blue-500">
                              Vérification: {sparePart.verificationName || "N/A"} | Qty: {sparePart.quantity}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <VerificationScanner onScan={handleQRScan} />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedSparePartIds(new Set())}
                    >
                      Tout désélectionner
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-2">Aucune pièce sélectionnée</p>
                    <p className="text-sm text-gray-500">
                      Sélectionnez une ou plusieurs pièces dans le tableau pour commencer la vérification
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
