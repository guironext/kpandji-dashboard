"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Mail,
  Package,
  Truck,
  Save,
  Loader2,
} from "lucide-react";
import { createCourrier, getCommandesForCourrier } from "@/lib/actions/courrier";
import { createConteneur } from "@/lib/actions/conteneur";
import { toast } from "sonner";

type ConteneurType = {
  id: string;
  conteneurNumber: string;
  sealNumber: string | null;
};

type CommandeType = {
  id: string;
  motorisation: string;
  date_livraison: string;
  etapeCommande: string;
  voitureModel: {
    model: string;
  } | null;
  client: {
    nom: string;
  } | null;
  clientEntreprise: {
    nom_entreprise: string;
  } | null;
  conteneur: {
    id: string;
    conteneurNumber: string;
  } | null;
};

type ConteneurLine = {
  id: string;
  conteneurId: string;
  conteneurNumber: string;
  commandeLines: CommandeLine[];
};

type CommandeLine = {
  id: string;
  commandeId: string;
  motorisation: string;
  vin: string;
};

type Props = {
  conteneurs: ConteneurType[];
  commandes: CommandeType[];
};

const NouveauCourrierClient: React.FC<Props> = ({ conteneurs: initialConteneurs, commandes: initialCommandes }) => {
  const router = useRouter();
  const [conteneurs, setConteneurs] = useState<ConteneurType[]>(initialConteneurs);
  const [commandes, setCommandes] = useState<CommandeType[]>(initialCommandes);
  const [conteneurLines, setConteneurLines] = useState<ConteneurLine[]>([
    {
      id: `conteneur-${Date.now()}`,
      conteneurId: "",
      conteneurNumber: "",
      commandeLines: [
        {
          id: `commande-${Date.now()}`,
          commandeId: "",
          motorisation: "",
          vin: "",
        },
      ],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [newConteneurNumber, setNewConteneurNumber] = useState("");
  const [showNewConteneurInput, setShowNewConteneurInput] = useState(false);

  const handleConteneurChange = async (lineIndex: number, conteneurId: string) => {
    const selectedConteneur = conteneurs.find((c) => c.id === conteneurId);
    if (!selectedConteneur) return;

    const updatedLines = [...conteneurLines];
    updatedLines[lineIndex].conteneurId = conteneurId;
    updatedLines[lineIndex].conteneurNumber = selectedConteneur.conteneurNumber;

    // Fetch commandes for this conteneur
    const commandesResult = await getCommandesForCourrier(conteneurId);
    if (commandesResult.success && commandesResult.data && Array.isArray(commandesResult.data)) {
      const newCommandesData = commandesResult.data;
      setCommandes((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newCommandes = newCommandesData.filter(
          (c: CommandeType) => !existingIds.has(c.id)
        );
        return [...prev, ...newCommandes];
      });
    }

    // Reset commande lines for this conteneur
    updatedLines[lineIndex].commandeLines = [
      {
        id: `commande-${Date.now()}`,
        commandeId: "",
        motorisation: "",
        vin: "",
      },
    ];

    setConteneurLines(updatedLines);
  };

  const handleCommandeChange = (conteneurIndex: number, commandeIndex: number, commandeId: string) => {
    const selectedCommande = commandes.find((c) => c.id === commandeId);
    if (!selectedCommande) return;

    const updatedLines = [...conteneurLines];
    updatedLines[conteneurIndex].commandeLines[commandeIndex].commandeId = commandeId;
    updatedLines[conteneurIndex].commandeLines[commandeIndex].motorisation = selectedCommande.motorisation;

    setConteneurLines(updatedLines);
  };

  const handleVinChange = (conteneurIndex: number, commandeIndex: number, vin: string) => {
    const updatedLines = [...conteneurLines];
    updatedLines[conteneurIndex].commandeLines[commandeIndex].vin = vin;
    setConteneurLines(updatedLines);
  };

  const addCommandeLine = (conteneurIndex: number) => {
    const updatedLines = [...conteneurLines];
    updatedLines[conteneurIndex].commandeLines.push({
      id: `commande-${Date.now()}`,
      commandeId: "",
      motorisation: "",
      vin: "",
    });
    setConteneurLines(updatedLines);
  };

  const removeCommandeLine = (conteneurIndex: number, commandeIndex: number) => {
    const updatedLines = [...conteneurLines];
    if (updatedLines[conteneurIndex].commandeLines.length > 1) {
      updatedLines[conteneurIndex].commandeLines.splice(commandeIndex, 1);
      setConteneurLines(updatedLines);
    }
  };

  const addConteneurLine = () => {
    setConteneurLines([
      ...conteneurLines,
      {
        id: `conteneur-${Date.now()}`,
        conteneurId: "",
        conteneurNumber: "",
        commandeLines: [
          {
            id: `commande-${Date.now()}`,
            commandeId: "",
            motorisation: "",
            vin: "",
          },
        ],
      },
    ]);
  };

  const removeConteneurLine = (conteneurIndex: number) => {
    if (conteneurLines.length > 1) {
      const updatedLines = conteneurLines.filter((_, index) => index !== conteneurIndex);
      setConteneurLines(updatedLines);
    }
  };

  const handleAddNewConteneur = async () => {
    if (!newConteneurNumber.trim()) {
      toast.error("Veuillez entrer un numéro de conteneur");
      return;
    }

    try {
      const result = await createConteneur({
        conteneurNumber: newConteneurNumber.trim(),
        sealNumber: "", // Optional field
      });

      if (result.success && result.data) {
        const newConteneur: ConteneurType = {
          id: result.data.id,
          conteneurNumber: result.data.conteneurNumber,
          sealNumber: result.data.sealNumber,
        };

        setConteneurs([...conteneurs, newConteneur]);
        setNewConteneurNumber("");
        setShowNewConteneurInput(false);
        toast.success("Conteneur ajouté avec succès");
      } else {
        toast.error(result.error || "Erreur lors de la création du conteneur");
      }
    } catch (error) {
      console.error("Error creating conteneur:", error);
      toast.error("Une erreur est survenue lors de la création du conteneur");
    }
  };

  const getCommandesForConteneur = (conteneurId: string) => {
    if (!conteneurId) return [];
    // Show only commandes that belong to this conteneur
    return commandes.filter((c) => c.conteneur?.id === conteneurId);
  };

  const generateReference = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `COUR-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Collect all data from all conteneur lines and commande lines
      const vins: string[] = [];
      const moteurs: string[] = [];
      const conteneurNumbers: string[] = [];
      const conteneurIds: string[] = [];
      let firstDateLivraison: Date | null = null;
      let firstCommandeId: string | null = null;

      for (const conteneurLine of conteneurLines) {
        if (!conteneurLine.conteneurId) {
          toast.error("Veuillez sélectionner un conteneur pour toutes les lignes");
          setIsLoading(false);
          return;
        }

        // Add conteneur info if not already added
        if (!conteneurIds.includes(conteneurLine.conteneurId)) {
          conteneurIds.push(conteneurLine.conteneurId);
          conteneurNumbers.push(conteneurLine.conteneurNumber);
        }

        for (const commandeLine of conteneurLine.commandeLines) {
          if (!commandeLine.commandeId || !commandeLine.vin.trim()) {
            toast.error("Veuillez remplir tous les champs (commande et VIN)");
            setIsLoading(false);
            return;
          }

          const commande = commandes.find((c) => c.id === commandeLine.commandeId);
          if (!commande) continue;

          // Add VIN and motorisation
          vins.push(commandeLine.vin.trim());
          moteurs.push(commandeLine.motorisation);

          // Set first date_livraison if not set
          if (!firstDateLivraison) {
            firstDateLivraison = new Date(commande.date_livraison);
            firstCommandeId = commandeLine.commandeId;
          }
        }
      }

      if (vins.length === 0) {
        toast.error("Veuillez ajouter au moins un courrier");
        setIsLoading(false);
        return;
      }

      if (!firstDateLivraison || conteneurIds.length === 0) {
        toast.error("Données incomplètes");
        setIsLoading(false);
        return;
      }

      // Format data with conteneur-VIN associations
      const conteneurVinMap: { [key: string]: string[] } = {};
      const conteneurMoteurMap: { [key: string]: string[] } = {};
      
      for (const conteneurLine of conteneurLines) {
        if (!conteneurLine.conteneurId) continue;
        
        const conteneurNum = conteneurLine.conteneurNumber;
        if (!conteneurVinMap[conteneurNum]) {
          conteneurVinMap[conteneurNum] = [];
          conteneurMoteurMap[conteneurNum] = [];
        }
        
        for (const commandeLine of conteneurLine.commandeLines) {
          if (commandeLine.vin.trim()) {
            conteneurVinMap[conteneurNum].push(commandeLine.vin.trim());
            conteneurMoteurMap[conteneurNum].push(commandeLine.motorisation);
          }
        }
      }
      
      // Format as "Conteneur1: VIN1, VIN2 | Conteneur2: VIN3, VIN4"
      const combinedVin = Object.entries(conteneurVinMap)
        .map(([conteneur, vins]) => `${conteneur}: ${vins.join(", ")}`)
        .join(" | ");
      
      const combinedMoteur = Object.entries(conteneurMoteurMap)
        .map(([conteneur, moteurs]) => `${conteneur}: ${moteurs.join(", ")}`)
        .join(" | ");
      
      const combinedNumeroConteneur = conteneurNumbers.join(", ");

      // Use the first conteneur ID (or we could use the first one)
      const primaryConteneurId = conteneurIds[0];

      // Create a single courrier with all combined data
      const result = await createCourrier({
        date_livraison: firstDateLivraison,
        reference: generateReference(),
        numero_conteneur: combinedNumeroConteneur,
        vin: combinedVin,
        moteur: combinedMoteur,
        conteneurId: primaryConteneurId,
        commandeId: firstCommandeId || undefined,
      });

      if (result.success) {
        toast.success("Courrier créé avec succès");
        router.push("/manager/listeConteneurs/courriers");
      } else {
        toast.error(result.error || "Erreur lors de la création du courrier");
      }
    } catch (error) {
      console.error("Error creating courrier:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeInUp">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/manager/listeConteneurs/courriers")}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-md hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-purple-200 hover:border-purple-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight">
                Créer un Courrier
              </h1>
              <p className="text-sm md:text-base text-gray-600 font-medium">
                Sélectionnez un conteneur et ajoutez les commandes avec leurs VIN
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-0 overflow-hidden bg-white/95 backdrop-blur-xl animate-fadeInUp animation-delay-100">
          <CardHeader className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white border-0 pb-8 pt-8">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-lg hover:scale-105 transition-transform duration-300">
                  <Mail className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl md:text-3xl lg:text-4xl font-extrabold mb-3">
                    Nouveau Courrier
                  </CardTitle>
                  <p className="text-purple-100 text-sm md:text-base">
                    Remplissez les informations ci-dessous pour créer un nouveau tableau de courrier
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="space-y-8">
              {conteneurLines.map((conteneurLine, conteneurIndex) => (
                <Card
                  key={conteneurLine.id}
                  className="border-2 border-purple-200/60 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300/80 animate-fadeInUp"
                  style={{ animationDelay: `${conteneurIndex * 100}ms` }}
                >
                  <CardHeader className="bg-gradient-to-r from-purple-100 via-purple-50 to-blue-100 border-b border-purple-200/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-md">
                          <Truck className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          Conteneur {conteneurIndex + 1}
                        </CardTitle>
                      </div>
                      {conteneurLines.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeConteneurLine(conteneurIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Conteneur Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-purple-600" />
                        Numéro de Conteneur *
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={conteneurLine.conteneurId}
                          onValueChange={(value) => handleConteneurChange(conteneurIndex, value)}
                        >
                          <SelectTrigger className="flex-1 h-12 border-2 border-purple-200 focus:border-purple-500 rounded-xl transition-all duration-200 hover:border-purple-300 shadow-sm">
                            <SelectValue placeholder="Sélectionner un conteneur" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {conteneurs
                              .filter((conteneur) => {
                                // Only show conteneurs that have at least one commande with etapeCommande === 'CHARGE' or 'TRANSITE'
                                return commandes.some(
                                  (commande) =>
                                    commande.conteneur?.id === conteneur.id &&
                                    (commande.etapeCommande === 'CHARGE' || commande.etapeCommande === 'TRANSITE')
                                );
                              })
                              .map((conteneur) => (
                                <SelectItem key={conteneur.id} value={conteneur.id} className="cursor-pointer hover:bg-purple-50">
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-3 w-3 text-purple-600" />
                                    <span className="font-medium">{conteneur.conteneurNumber}</span>
                                    {conteneur.sealNumber && (
                                      <span className="text-xs text-gray-500">- Scellé: {conteneur.sealNumber}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        {conteneurIndex === 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewConteneurInput(!showNewConteneurInput)}
                            className="h-12 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 shadow-sm font-medium"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau
                          </Button>
                        )}
                      </div>
                      {showNewConteneurInput && conteneurIndex === 0 && (
                        <div className="flex gap-2 mt-2 animate-fadeInUp">
                          <Input
                            placeholder="Numéro de conteneur"
                            value={newConteneurNumber}
                            onChange={(e) => setNewConteneurNumber(e.target.value)}
                            className="flex-1 h-12 border-2 border-purple-200 focus:border-purple-500 rounded-xl transition-all duration-200 shadow-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddNewConteneur();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={handleAddNewConteneur}
                            className="h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                          >
                            Ajouter
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Commande Lines */}
                    <div className="space-y-4">
                      <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-600" />
                        Commandes
                      </Label>
                      {conteneurLine.commandeLines.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Aucune commande ajoutée. Sélectionnez d&apos;abord un conteneur.</p>
                        </div>
                      ) : (
                        conteneurLine.commandeLines.map((commandeLine, commandeIndex) => (
                          <Card
                            key={commandeLine.id}
                            className="bg-white/90 border border-purple-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-purple-200 animate-fadeInUp"
                            style={{ animationDelay: `${commandeIndex * 50}ms` }}
                          >
                            <CardContent className="p-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Commande Selection */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                    <Package className="h-3 w-3 text-purple-600" />
                                    Commande *
                                  </Label>
                                  <Select
                                    value={commandeLine.commandeId}
                                    onValueChange={(value) =>
                                      handleCommandeChange(conteneurIndex, commandeIndex, value)
                                    }
                                  >
                                    <SelectTrigger className="h-11 border-2 border-purple-200 focus:border-purple-500 rounded-xl transition-all duration-200 hover:border-purple-300 shadow-sm">
                                      <SelectValue placeholder="Sélectionner une commande" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                      {getCommandesForConteneur(conteneurLine.conteneurId).length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                          Aucune commande disponible pour ce conteneur
                                        </div>
                                      ) : (
                                        getCommandesForConteneur(conteneurLine.conteneurId).map(
                                          (commande) => (
                                            <SelectItem key={commande.id} value={commande.id} className="cursor-pointer hover:bg-purple-50">
                                              <div className="flex flex-col py-1">
                                                <span className="font-medium text-gray-900">
                                                  {commande.voitureModel?.model || "N/A"}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-0.5">
                                                  {commande.client?.nom ||
                                                    commande.clientEntreprise?.nom_entreprise ||
                                                    "N/A"}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          )
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Motorisation Display */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                    <Package className="h-3 w-3 text-purple-600" />
                                    Motorisation
                                  </Label>
                                  <div className="h-11 flex items-center px-4 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl shadow-sm">
                                    <span className="font-semibold text-purple-700">
                                      {commandeLine.motorisation || "—"}
                                    </span>
                                  </div>
                                </div>

                                {/* VIN Input */}
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                    <Package className="h-3 w-3 text-purple-600" />
                                    Vehicle Identification Number (VIN) *
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Entrez le VIN (ex: 1HGBH41JXMN109186)"
                                      value={commandeLine.vin}
                                      onChange={(e) =>
                                        handleVinChange(conteneurIndex, commandeIndex, e.target.value)
                                      }
                                      className="flex-1 h-11 border-2 border-purple-200 focus:border-purple-500 rounded-xl transition-all duration-200 hover:border-purple-300 shadow-sm font-mono text-sm"
                                    />
                                    {conteneurLine.commandeLines.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeCommandeLine(conteneurIndex, commandeIndex)
                                        }
                                        className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}

                      {/* Add Commande Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addCommandeLine(conteneurIndex)}
                        className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 h-12 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!conteneurLine.conteneurId}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une autre commande
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Conteneur Button */}
              <Button
                type="button"
                variant="outline"
                onClick={addConteneurLine}
                className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 h-14 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <Plus className="h-5 w-5 mr-2" />
                Ajouter un autre conteneur
              </Button>

              {/* Summary Section - Display Conteneurs with their VINs */}
              {conteneurLines.some((line) => line.conteneurId && line.commandeLines.some((cl) => cl.vin.trim())) && (
                <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-blue-50/20 shadow-xl animate-fadeInUp">
                  <CardHeader className="bg-gradient-to-r from-indigo-100 via-purple-100 to-blue-100 border-b border-indigo-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-md">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      Résumé du Tableau du courrier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {conteneurLines
                        .filter((line) => line.conteneurId && line.commandeLines.some((cl) => cl.vin.trim()))
                        .map((conteneurLine, index) => {
                          const vinsForConteneur = conteneurLine.commandeLines
                            .filter((cl) => cl.vin.trim())
                            .map((cl) => cl.vin.trim());
                          
                          return (
                            <div
                              key={conteneurLine.id}
                              className="bg-white/90 border border-indigo-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 animate-fadeInUp"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <div className="flex items-start gap-4">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-md">
                                  <Truck className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-bold text-gray-900 mb-3 text-lg">
                                    Conteneur: <span className="text-indigo-700">{conteneurLine.conteneurNumber}</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-sm text-gray-600 font-semibold">VINs associés:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {vinsForConteneur.map((vin, vinIndex) => (
                                        <span
                                          key={vinIndex}
                                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 text-sm font-semibold border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200 font-mono"
                                        >
                                          {vin}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-indigo-200">
                      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-500 p-1.5 rounded-lg">
                            <Mail className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold text-gray-900">Note:</span> Tous les conteneurs et VINs ci-dessus seront enregistrés dans un seul courrier.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-purple-200">
                <Button
                  variant="outline"
                  onClick={() => router.push("/manager/listeConteneurs/courriers")}
                  className="h-12 px-8 border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="h-12 px-8 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 hover:from-purple-600 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Créer Tableau du courrier
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
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
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animation-delay-100 {
          animation-delay: 100ms;
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

export default NouveauCourrierClient;

