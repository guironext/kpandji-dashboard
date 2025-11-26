"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createConteneur, getAllConteneurs, updateConteneur, deleteConteneur } from "@/lib/actions/conteneur";
import { 
  Loader2, 
  Container, 
  Package, 
  Weight, 
  Calendar,
  Search,
  Plus,
  MapPin,
  Ship,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const conteneurSchema = z.object({
  conteneurNumber: z.string().min(1, "Le numéro de conteneur est obligatoire"),
  sealNumber: z.string().min(1, "Le numéro de scellé est obligatoire"),
  totalPackages: z.string().optional(),
  grossWeight: z.string().optional(),
  netWeight: z.string().optional(),
  stuffingMap: z.string().optional(),
  etapeConteneur: z.enum(["EN_ATTENTE", "CHARGE", "TRANSITE", "RENSEIGNE", "ARRIVE", "DECHERGE", "VERIFIE"]),
  dateEmbarquement: z.string().optional(),
  dateArriveProbable: z.string().optional(),
});

type ConteneurFormValues = z.infer<typeof conteneurSchema>;

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
};

const etapeLabels = {
  EN_ATTENTE: "En Attente",
  CHARGE: "Chargé",
  TRANSITE: "En Transit",
  RENSEIGNE: "Renseigné",
  ARRIVE: "Arrivé",
  DECHERGE: "Déchargé",
  VERIFIE: "Vérifié",
};

const etapeColors = {
  EN_ATTENTE: "bg-gray-100 text-gray-700",
  CHARGE: "bg-blue-100 text-blue-700",
  TRANSITE: "bg-yellow-100 text-yellow-700",
  RENSEIGNE: "bg-purple-100 text-purple-700",
  ARRIVE: "bg-green-100 text-green-700",
  DECHERGE: "bg-orange-100 text-orange-700",
  VERIFIE: "bg-emerald-100 text-emerald-700",
};

export default function AjouterConteneurPage() {
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [isLoadingConteneurs, setIsLoadingConteneurs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingConteneur, setEditingConteneur] = useState<Conteneur | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const form = useForm<ConteneurFormValues>({
    resolver: zodResolver(conteneurSchema),
    defaultValues: {
      conteneurNumber: "",
      sealNumber: "",
      totalPackages: "",
      grossWeight: "",
      netWeight: "",
      stuffingMap: "",
      etapeConteneur: "EN_ATTENTE",
      dateEmbarquement: "",
      dateArriveProbable: "",
    },
  });

  useEffect(() => {
    loadConteneurs();
  }, []);

  const loadConteneurs = async () => {
    try {
      setIsLoadingConteneurs(true);
      const result = await getAllConteneurs();
      if (result.success) {
        setConteneurs(result.data?.map(c => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
          dateEmbarquement: c.dateEmbarquement?.toISOString() || null,
          dateArriveProbable: c.dateArriveProbable?.toISOString() || null,
        })) || []);
      } else {
        toast.error("Erreur lors du chargement des conteneurs");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des conteneurs");
    } finally {
      setIsLoadingConteneurs(false);
    }
  };

  const onSubmit = async (data: ConteneurFormValues) => {
    if (!user) {
      toast.error("Vous devez être connecté pour ajouter un conteneur");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingConteneur) {
        // Update existing conteneur
        const result = await updateConteneur(editingConteneur.id, {
          conteneurNumber: data.conteneurNumber,
          sealNumber: data.sealNumber,
          totalPackages: data.totalPackages || undefined,
          grossWeight: data.grossWeight || undefined,
          netWeight: data.netWeight || undefined,
          stuffingMap: data.stuffingMap || undefined,
          etapeConteneur: data.etapeConteneur,
          dateEmbarquement: data.dateEmbarquement ? new Date(data.dateEmbarquement) : undefined,
          dateArriveProbable: data.dateArriveProbable ? new Date(data.dateArriveProbable) : undefined,
        });

        if (result.success) {
          toast.success("Conteneur modifié avec succès");
          setEditingConteneur(null);
        } else {
          toast.error(result.error || "Erreur lors de la modification du conteneur");
        }
      } else {
        // Create new conteneur
        const result = await createConteneur({
          conteneurNumber: data.conteneurNumber,
          sealNumber: data.sealNumber,
          totalPackages: data.totalPackages || undefined,
          grossWeight: data.grossWeight || undefined,
          netWeight: data.netWeight || undefined,
          stuffingMap: data.stuffingMap || undefined,
          etapeConteneur: data.etapeConteneur,
          dateEmbarquement: data.dateEmbarquement ? new Date(data.dateEmbarquement) : undefined,
          dateArriveProbable: data.dateArriveProbable ? new Date(data.dateArriveProbable) : undefined,
        });

        if (result.success) {
          toast.success("Conteneur ajouté avec succès");
        } else {
          toast.error(result.error || "Erreur lors de l'ajout du conteneur");
        }
      }

      form.reset();
      setShowForm(false);
      loadConteneurs();
    } catch (error) {
      toast.error("Erreur lors de l'opération");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (conteneur: Conteneur) => {
    setEditingConteneur(conteneur);
    form.reset({
      conteneurNumber: conteneur.conteneurNumber,
      sealNumber: conteneur.sealNumber,
      totalPackages: conteneur.totalPackages || "",
      grossWeight: conteneur.grossWeight || "",
      netWeight: conteneur.netWeight || "",
      stuffingMap: conteneur.stuffingMap || "",
      etapeConteneur: conteneur.etapeConteneur as "EN_ATTENTE" | "CHARGE" | "TRANSITE" | "RENSEIGNE" | "ARRIVE" | "DECHERGE" | "VERIFIE",
      dateEmbarquement: conteneur.dateEmbarquement ? new Date(conteneur.dateEmbarquement).toISOString().slice(0, 16) : "",
      dateArriveProbable: conteneur.dateArriveProbable ? new Date(conteneur.dateArriveProbable).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (conteneurId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce conteneur ?")) {
      return;
    }

    setIsDeleting(conteneurId);
    try {
      const result = await deleteConteneur(conteneurId);
      if (result.success) {
        toast.success("Conteneur supprimé avec succès");
        loadConteneurs();
      } else {
        toast.error(result.error || "Erreur lors de la suppression du conteneur");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression du conteneur");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    form.reset();
    setShowForm(false);
    setEditingConteneur(null);
  };

  const filteredConteneurs = conteneurs.filter(conteneur =>
    conteneur.conteneurNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conteneur.sealNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client-side protection
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Accès non autorisé</h2>
          <p className="text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Container className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">Gestion des Conteneurs</h1>
                    <p className="text-blue-100 text-lg">
                      Gérez vos conteneurs et leur suivi
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold">{conteneurs.length}</div>
                  <div className="text-blue-100">Conteneurs</div>
                </div>
                <Button 
                  onClick={() => setShowForm(!showForm)} 
                  className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  {showForm ? "Annuler" : "Nouveau Conteneur"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Conteneurs</p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{conteneurs.length}</p>
                </div>
                <div className="p-3 bg-emerald-500 rounded-full">
                  <Container className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">En Transit</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {conteneurs.filter(c => c.etapeConteneur === "TRANSITE").length}
                  </p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full">
                  <Ship className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Arrivés</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {conteneurs.filter(c => c.etapeConteneur === "ARRIVE").length}
                  </p>
                </div>
                <div className="p-3 bg-green-500 rounded-full">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">En Attente</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {conteneurs.filter(c => c.etapeConteneur === "EN_ATTENTE").length}
                  </p>
                </div>
                <div className="p-3 bg-orange-500 rounded-full">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Conteneur Form */}
        {showForm && (
          <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Container className="h-5 w-5 text-white" />
                </div>
                {editingConteneur ? "Modifier le Conteneur" : "Nouveau Conteneur"}
              </CardTitle>
              <CardDescription className="text-base">
                {editingConteneur ? "Modifiez les informations du conteneur" : "Remplissez les informations du conteneur"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Numéro de conteneur */}
                    <FormField
                      control={form.control}
                      name="conteneurNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Container className="h-4 w-4 text-blue-500" />
                            Numéro de conteneur *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="CONT1234567" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Numéro de scellé */}
                    <FormField
                      control={form.control}
                      name="sealNumber"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Package className="h-4 w-4 text-blue-500" />
                            Numéro de scellé *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="SEAL123456" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nombre total de colis */}
                    <FormField
                      control={form.control}
                      name="totalPackages"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Package className="h-4 w-4 text-blue-500" />
                            Nombre total de colis
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="150" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Poids brut */}
                    <FormField
                      control={form.control}
                      name="grossWeight"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Weight className="h-4 w-4 text-blue-500" />
                            Poids brut (kg)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="25000" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Poids net */}
                    <FormField
                      control={form.control}
                      name="netWeight"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Weight className="h-4 w-4 text-blue-500" />
                            Poids net (kg)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="22000" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Plan de chargement */}
                    <FormField
                      control={form.control}
                      name="stuffingMap"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Plan de chargement
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Référence du plan" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Étape du conteneur */}
                    <FormField
                      control={form.control}
                      name="etapeConteneur"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Étape du conteneur
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Sélectionner une étape" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(etapeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date d'embarquement */}
                    <FormField
                      control={form.control}
                      name="dateEmbarquement"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Date d&apos;embarquement
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date d'arrivée probable */}
                    <FormField
                      control={form.control}
                      name="dateArriveProbable"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Date d&apos;arrivée probable
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local"
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-8" />

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleCancel}
                      className="px-8"
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="gap-2 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                      {isSubmitting 
                        ? (editingConteneur ? "Modification en cours..." : "Ajout en cours...") 
                        : (editingConteneur ? "Modifier le conteneur" : "Ajouter le conteneur")
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Conteneurs List */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 bg-slate-500 rounded-lg">
                    <Container className="h-6 w-6 text-white" />
                  </div>
                  Liste des Conteneurs
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {conteneurs.length} conteneur{conteneurs.length > 1 ? "s" : ""} enregistré{conteneurs.length > 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Rechercher un conteneur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 w-80 h-12 border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingConteneurs ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium">Chargement des conteneurs...</p>
                </div>
              </div>
            ) : filteredConteneurs.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Container className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  {searchTerm ? "Aucun conteneur trouvé" : "Aucun conteneur"}
                </h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  {searchTerm 
                    ? "Essayez de modifier votre recherche"
                    : "Commencez par ajouter votre premier conteneur"
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowForm(true)} 
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Plus className="h-5 w-5" />
                    Ajouter un conteneur
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredConteneurs.map((conteneur) => (
                  <Card 
                    key={conteneur.id}
                    className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:scale-105"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                            <Container className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">
                              {conteneur.conteneurNumber}
                            </h3>
                            <Badge 
                              className={`mt-1 text-sm ${etapeColors[conteneur.etapeConteneur as keyof typeof etapeColors]}`}
                            >
                              {etapeLabels[conteneur.etapeConteneur as keyof typeof etapeLabels]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Package className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">
                            Scellé: {conteneur.sealNumber}
                          </span>
                        </div>
                        {conteneur.totalPackages && (
                          <div className="flex items-center gap-3 text-sm">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {conteneur.totalPackages} colis
                            </span>
                          </div>
                        )}
                        {conteneur.grossWeight && (
                          <div className="flex items-center gap-3 text-sm">
                            <Weight className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {conteneur.grossWeight} kg (brut)
                            </span>
                          </div>
                        )}
                        {conteneur.dateEmbarquement && (
                          <div className="flex items-center gap-3 text-sm">
                            <Ship className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              Emb: {new Date(conteneur.dateEmbarquement).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                        {conteneur.dateArriveProbable && (
                          <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              Arr: {new Date(conteneur.dateArriveProbable).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Créé le {new Date(conteneur.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(conteneur)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDelete(conteneur.id)}
                            disabled={isDeleting === conteneur.id}
                          >
                            {isDeleting === conteneur.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}