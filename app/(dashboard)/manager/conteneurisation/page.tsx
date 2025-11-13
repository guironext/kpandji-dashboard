"use client";

import React, { useState, useEffect } from "react";
import {
  getValidatedCommandes,
  getAllConteneurs,
  createConteneur,
  assignCommandeToConteneur,
  removeCommandeFromConteneur,
  sendConteneur,
} from "@/lib/actions/conteneurisation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Loader2, 
  Package, 
  Truck, 
  Calendar,
  Ship,
  Box,
  Weight,
  Hash,
  Plus,
  GripVertical,
  X,
  PackageCheck,
  ArrowRight,
  Send
} from "lucide-react";

type Commande = {
  id: string;
  couleur: string;
  date_livraison: Date;
  motorisation: string;
  transmission: string;
  nbr_portes: string;
  voitureModel?: {
    model: string;
  } | null;
  client?: {
    nom: string;
  } | null;
  clientEntreprise?: {
    nom_entreprise: string;
  } | null;
};

type Conteneur = {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  totalPackages?: string | null;
  grossWeight?: string | null;
  netWeight?: string | null;
  dateEmbarquement?: Date | null;
  dateArriveProbable?: Date | null;
  etapeConteneur: string;
  commandes: Commande[];
};

const ConteneurisationPage = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draggedCommande, setDraggedCommande] = useState<string | null>(null);

  // Form state for creating conteneur
  const [formData, setFormData] = useState({
    conteneurNumber: "",
    sealNumber: "",
    totalPackages: "",
    grossWeight: "",
    netWeight: "",
    stuffingMap: "",
    dateEmbarquement: "",
    dateArriveProbable: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [commandesRes, conteneursRes] = await Promise.all([
        getValidatedCommandes(),
        getAllConteneurs(),
      ]);

      if (commandesRes.success) {
        console.log("Commandes chargées:", commandesRes.data);
        setCommandes(commandesRes.data as Commande[]);
      } else {
        console.error("Erreur commandes:", commandesRes.error);
        toast.error("Erreur lors du chargement des commandes");
      }

      if (conteneursRes.success) {
        console.log("Conteneurs chargés:", conteneursRes.data);
        setConteneurs(conteneursRes.data as Conteneur[]);
      } else {
        console.error("Erreur conteneurs:", conteneursRes.error);
        toast.error("Erreur lors du chargement des conteneurs");
      }
    } catch (error) {
      console.error("Erreur globale:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConteneur = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const dataToSubmit = {
        conteneurNumber: formData.conteneurNumber,
        sealNumber: formData.sealNumber,
        totalPackages: formData.totalPackages || undefined,
        grossWeight: formData.grossWeight || undefined,
        netWeight: formData.netWeight || undefined,
        stuffingMap: formData.stuffingMap || undefined,
        dateEmbarquement: formData.dateEmbarquement
          ? new Date(formData.dateEmbarquement)
          : undefined,
        dateArriveProbable: formData.dateArriveProbable
          ? new Date(formData.dateArriveProbable)
          : undefined,
      };

      const result = await createConteneur(dataToSubmit);

      if (result.success) {
        toast.success("Conteneur créé avec succès");
        setDialogOpen(false);
        setFormData({
          conteneurNumber: "",
          sealNumber: "",
          totalPackages: "",
          grossWeight: "",
          netWeight: "",
          stuffingMap: "",
          dateEmbarquement: "",
          dateArriveProbable: "",
        });
        fetchData();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création du conteneur");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDragStart = (commandeId: string) => {
    setDraggedCommande(commandeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (conteneurId: string) => {
    if (!draggedCommande) return;

    try {
      const result = await assignCommandeToConteneur(
        draggedCommande,
        conteneurId
      );

      if (result.success) {
        toast.success("Commande assignée au conteneur");
        fetchData();
      } else {
        toast.error(result.error || "Erreur lors de l'assignation");
      }
    } catch {
      toast.error("Erreur lors de l'assignation de la commande");
    } finally {
      setDraggedCommande(null);
    }
  };

  const handleRemoveCommande = async (commandeId: string) => {
    try {
      const result = await removeCommandeFromConteneur(commandeId);

      if (result.success) {
        toast.success("Commande retirée du conteneur");
        fetchData();
      } else {
        toast.error(result.error || "Erreur lors du retrait");
      }
    } catch {
      toast.error("Erreur lors du retrait de la commande");
    }
  };

  const handleSendConteneur = async (conteneurId: string) => {
    try {
      const result = await sendConteneur(conteneurId);

      if (result.success) {
        toast.success("Conteneur envoyé avec succès");
        fetchData();
      } else {
        toast.error(result.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur lors de l'envoi du conteneur");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="relative">
          <Ship className="w-16 h-16 text-blue-500 animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
        </div>
        <p className="text-gray-600 font-medium">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
            <Ship className="w-10 h-10 text-blue-600" />
            Gestion de Conteneurisation
          </h1>
          <p className="text-gray-600 mt-2 ml-1">
            Organisez vos commandes validées dans les conteneurs
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-200">
            <div className="text-xs text-gray-500">Commandes disponibles</div>
            <div className="text-2xl font-bold text-blue-600">{commandes.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-200">
            <div className="text-xs text-gray-500">Conteneurs actifs</div>
            <div className="text-2xl font-bold text-green-600">{conteneurs.length}</div>
          </div>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        {/* Left: Validated Commandes */}
        <Card className="shadow-xl border-2 border-blue-100 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xl font-bold">Commandes Validées</div>
                  <div className="text-sm text-blue-100">Prêtes pour conteneurisation</div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white text-blue-700 text-lg px-4 py-2">
                {commandes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 max-h-[500px] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
            {commandes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <PackageCheck className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  Aucune commande validée
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Les commandes validées apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {commandes.map((commande) => (
                  <div
                    key={commande.id}
                    draggable
                    onDragStart={() => handleDragStart(commande.id)}
                    className="group relative p-4 border-2 border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-lg hover:border-blue-300 cursor-move transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="ml-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Box className="w-5 h-5 text-blue-500" />
                            {commande.voitureModel?.model || "N/A"}
                          </div>
                          <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-xs font-semibold text-gray-600">Client:</span>
                            <p className="text-sm font-medium text-gray-800">
                              {commande.client?.nom ||
                                commande.clientEntreprise?.nom_entreprise ||
                                "Non spécifié"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div
                            className="w-10 h-10 rounded-full"
                            style={{ 
                              backgroundColor: commande.couleur || '#cccccc',
                              minWidth: '40px',
                              minHeight: '40px'
                            }}
                            title={commande.couleur || 'Couleur non définie'}
                          />
                          <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full text-xs font-bold text-gray-800 border-2 border-gray-300 shadow-sm">
                            {commande.couleur || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="font-semibold">⚡</span>
                          <span>{commande.motorisation}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="font-semibold">⚙️</span>
                          <span>{commande.transmission}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="font-semibold">🚪</span>
                          <span>{commande.nbr_portes} portes</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(commande.date_livraison).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Create Conteneur Button */}
        <Card className="shadow-xl border-2 border-green-100 overflow-hidden flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-[300px]">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="h-20 text-xl px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-8 h-8 mr-3" />
                  Créer un Nouveau Conteneur
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Cliquez pour créer un conteneur et commencer le chargement
                </p>
                <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
                  <Ship className="w-16 h-16 opacity-20" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateConteneur}>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <Ship className="w-6 h-6 text-blue-600" />
                    Créer un nouveau conteneur
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Remplissez les informations du conteneur pour démarrer le processus de chargement
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-6">
                  {/* Informations principales */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Hash className="w-5 h-5 text-blue-600" />
                      Informations principales
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="conteneurNumber" className="text-sm font-medium flex items-center gap-1">
                          <Truck className="w-4 h-4" />
                          Numéro de conteneur *
                        </Label>
                        <Input
                          id="conteneurNumber"
                          required
                          value={formData.conteneurNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              conteneurNumber: e.target.value,
                            })
                          }
                          placeholder="Ex: CONT-2024-001"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sealNumber" className="text-sm font-medium flex items-center gap-1">
                          <PackageCheck className="w-4 h-4" />
                          Numéro de scellé *
                        </Label>
                        <Input
                          id="sealNumber"
                          required
                          value={formData.sealNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sealNumber: e.target.value,
                            })
                          }
                          placeholder="Ex: SEAL-001"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Détails du chargement */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Weight className="w-5 h-5 text-blue-600" />
                      Détails du chargement
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalPackages" className="text-sm font-medium">
                          Total colis
                        </Label>
                        <Input
                          id="totalPackages"
                          type="number"
                          value={formData.totalPackages}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              totalPackages: e.target.value,
                            })
                          }
                          placeholder="Ex: 50"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="grossWeight" className="text-sm font-medium">
                          Poids brut (kg)
                        </Label>
                        <Input
                          id="grossWeight"
                          type="number"
                          value={formData.grossWeight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              grossWeight: e.target.value,
                            })
                          }
                          placeholder="Ex: 1000"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="netWeight" className="text-sm font-medium">
                          Poids net (kg)
                        </Label>
                        <Input
                          id="netWeight"
                          type="number"
                          value={formData.netWeight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              netWeight: e.target.value,
                            })
                          }
                          placeholder="Ex: 950"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stuffingMap" className="text-sm font-medium">
                        Plan de chargement
                      </Label>
                      <Input
                        id="stuffingMap"
                        value={formData.stuffingMap}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stuffingMap: e.target.value,
                          })
                        }
                        placeholder="URL ou description du plan de chargement"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Dates */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Planning
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateEmbarquement" className="text-sm font-medium">
                          Date d&apos;embarquement
                        </Label>
                        <Input
                          id="dateEmbarquement"
                          type="date"
                          value={formData.dateEmbarquement}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dateEmbarquement: e.target.value,
                            })
                          }
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateArriveProbable" className="text-sm font-medium">
                          Date d&apos;arrivée probable
                        </Label>
                        <Input
                          id="dateArriveProbable"
                          type="date"
                          value={formData.dateArriveProbable}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dateArriveProbable: e.target.value,
                            })
                          }
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={formLoading}
                    className="px-6"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={formLoading}
                    className="px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Créer le conteneur
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      </div>

      {/* Bottom Section: Conteneurs */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Ship className="w-8 h-8 text-blue-600" />
              Conteneurs Actifs
            </h2>
            <p className="text-gray-600 mt-1 ml-1">
              Glissez-déposez les commandes dans les conteneurs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {conteneurs.length === 0 ? (
            <Card className="col-span-full p-12 shadow-xl border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Ship className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-xl font-medium mb-2">
                  Aucun conteneur créé
                </p>
                <p className="text-gray-400">
                  Créez votre premier conteneur pour commencer le chargement
                </p>
              </div>
            </Card>
          ) : (
            conteneurs.map((conteneur) => (
              <Card
                key={conteneur.id}
                className={`transition-all duration-300 shadow-xl border-2 ${
                  draggedCommande
                    ? "ring-4 ring-blue-400 ring-offset-2 scale-105 border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:shadow-2xl"
                }`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(conteneur.id)}
              >
                <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{conteneur.conteneurNumber}</div>
                        <div className="text-xs text-white/80 font-normal">
                          Scellé: {conteneur.sealNumber}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`text-xs px-3 py-1 ${
                        conteneur.etapeConteneur === "CHARGE"
                          ? "bg-green-500 text-white"
                          : "bg-yellow-400 text-yellow-900"
                      }`}
                    >
                      {conteneur.etapeConteneur}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Container Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg">
                    {conteneur.totalPackages && (
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">{conteneur.totalPackages} colis</span>
                      </div>
                    )}
                    {conteneur.grossWeight && (
                      <div className="flex items-center gap-1">
                        <Weight className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">{conteneur.grossWeight} kg</span>
                      </div>
                    )}
                    {conteneur.dateEmbarquement && (
                      <div className="flex items-center gap-1 col-span-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">
                          Embarquement: {new Date(conteneur.dateEmbarquement).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {conteneur.dateArriveProbable && (
                      <div className="flex items-center gap-1 col-span-2">
                        <ArrowRight className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">
                          Arrivée: {new Date(conteneur.dateArriveProbable).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Commandes Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Box className="w-4 h-4 text-blue-600" />
                        Commandes chargées
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {conteneur.commandes.length}
                      </Badge>
                    </div>
                    {conteneur.commandes.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 italic font-medium">
                          Glissez-déposez
                        </p>
                        <p className="text-xs text-gray-400">
                          des commandes ici
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {conteneur.commandes.map((cmd) => (
                          <div
                            key={cmd.id}
                            className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-xs hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <p className="font-bold text-gray-800 flex items-center gap-1 mb-1">
                                  <Box className="w-3 h-3 text-blue-600" />
                                  {cmd.voitureModel?.model || "N/A"}
                                </p>
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-[10px] font-semibold text-gray-500">Client:</span>
                                  <p className="text-xs font-medium text-gray-700">
                                    {cmd.client?.nom ||
                                      cmd.clientEntreprise?.nom_entreprise ||
                                      "Non spécifié"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div
                                    className="w-5 h-5 rounded-full border-2 border-gray-400 shadow-sm"
                                    style={{ 
                                      backgroundColor: cmd.couleur || '#cccccc',
                                      minWidth: '20px',
                                      minHeight: '20px'
                                    }}
                                    title={cmd.couleur || 'Couleur non définie'}
                                  />
                                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                    {cmd.couleur || 'N/A'}
                                  </span>
                                </div>
                                <div className="flex gap-2 text-[10px] text-gray-500">
                                  <span>{cmd.motorisation}</span>
                                  <span>•</span>
                                  <span>{cmd.transmission}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                                onClick={() => handleRemoveCommande(cmd.id)}
                              >
                                <X className="w-4 h-4" />  
                                
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Send Conteneur Button */}
                  {conteneur.commandes.length > 0 && conteneur.etapeConteneur === "CHARGE" && (
                    <>
                      <Separator className="my-3" />
                      <Button
                        onClick={() => handleSendConteneur(conteneur.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer Conteneur
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConteneurisationPage;
