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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createFournisseur, getAllFournisseurs, updateFournisseur, deleteFournisseur, getFournisseur } from "@/lib/actions/fournisseur";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  Search, 
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Globe,
  Users,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const fournisseurSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  code_postal: z.string().optional(),
  pays: z.string().optional(),
  type_Activite: z.string().optional(),
});

type FournisseurFormValues = z.infer<typeof fournisseurSchema>;

type Fournisseur = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  type_Activite: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AjouterFournisseurPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [isLoadingFournisseurs, setIsLoadingFournisseurs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const form = useForm<FournisseurFormValues>({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: "",
      adresse: "",
      ville: "",
      code_postal: "",
      pays: "",
      type_Activite: "",
    },
  });

  // Load fournisseurs on component mount
  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    try {
      setIsLoadingFournisseurs(true);
      const result = await getAllFournisseurs();
      if (result.success) {
        setFournisseurs(result.data?.map(f => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString()
        })) || []);
      } else {
        toast.error("Erreur lors du chargement des fournisseurs");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des fournisseurs");
    } finally {
      setIsLoadingFournisseurs(false);
    }
  };

  const handleEdit = (fournisseur: Fournisseur) => {
    setEditingFournisseur(fournisseur);
    form.reset({
      nom: fournisseur.nom,
      email: fournisseur.email || "",
      telephone: fournisseur.telephone || "",
      adresse: fournisseur.adresse || "",
      ville: fournisseur.ville || "",
      code_postal: fournisseur.code_postal || "",
      pays: fournisseur.pays || "",
      type_Activite: fournisseur.type_Activite || "",
    });
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      const formElement = document.getElementById('fournisseur-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleViewDetails = async (fournisseurId: string) => {
    try {
      const result = await getFournisseur(fournisseurId);
      if (result.success && result.data) {
        setSelectedFournisseur({
          ...result.data,
          createdAt: result.data.createdAt.toISOString(),
          updatedAt: result.data.updatedAt.toISOString()
        });
        setShowDetailsDialog(true);
      } else {
        toast.error("Erreur lors du chargement des détails");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const handleDelete = async (fournisseurId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      return;
    }

    setIsDeleting(fournisseurId);
    try {
      const result = await deleteFournisseur(fournisseurId);
      if (result.success) {
        toast.success("Fournisseur supprimé avec succès");
        loadFournisseurs();
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(null);
    }
  };

  const onSubmit = async (data: FournisseurFormValues) => {
    if (!user) {
      toast.error("Vous devez être connecté pour ajouter un fournisseur");
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (editingFournisseur) {
        // Update existing fournisseur
        result = await updateFournisseur(editingFournisseur.id, {
          nom: data.nom,
          email: data.email || undefined,
          telephone: data.telephone || undefined,
          adresse: data.adresse || undefined,
          ville: data.ville || undefined,
          code_postal: data.code_postal || undefined,
          pays: data.pays || undefined,
          type_Activite: data.type_Activite || undefined,
        });
      } else {
        // Create new fournisseur
        result = await createFournisseur({
          nom: data.nom,
          email: data.email || undefined,
          telephone: data.telephone || undefined,
          adresse: data.adresse || undefined,
          ville: data.ville || undefined,
          code_postal: data.code_postal || undefined,
          pays: data.pays || undefined,
          type_Activite: data.type_Activite || undefined,
        });
      }

      if (result.success) {
        toast.success(editingFournisseur ? "Fournisseur modifié avec succès" : "Fournisseur ajouté avec succès");
        form.reset();
        setShowForm(false);
        setEditingFournisseur(null);
        loadFournisseurs();
      } else {
        toast.error(result.error || `Erreur lors de ${editingFournisseur ? "la modification" : "l'ajout"} du fournisseur`);
      }
    } catch (error) {
      toast.error(`Erreur lors de ${editingFournisseur ? "la modification" : "l'ajout"} du fournisseur`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    form.reset();
    setShowForm(false);
    setEditingFournisseur(null);
  };

  const filteredFournisseurs = fournisseurs.filter(fournisseur =>
    fournisseur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fournisseur.email && fournisseur.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (fournisseur.ville && fournisseur.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (fournisseur.type_Activite && fournisseur.type_Activite.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">Gestion des Fournisseurs</h1>
                    <p className="text-blue-100 text-lg">
                      Gérez votre réseau de fournisseurs et partenaires
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold">{fournisseurs.length}</div>
                  <div className="text-blue-100">Fournisseurs actifs</div>
                </div>
                <Button 
                  onClick={() => setShowForm(!showForm)} 
                  className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  {showForm ? "Annuler" : "Nouveau Fournisseur"}
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Fournisseurs</p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{fournisseurs.length}</p>
                </div>
                <div className="p-3 bg-emerald-500 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Nouveaux ce mois</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {fournisseurs.filter(f => {
                      const created = new Date(f.createdAt);
                      const now = new Date();
                      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avec Email</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {fournisseurs.filter(f => f.email).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-500 rounded-full">
                  <Mail className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Types d&apos;activité</p>
                  <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {new Set(fournisseurs.map(f => f.type_Activite).filter(Boolean)).size}
                  </p>
                </div>
                <div className="p-3 bg-orange-500 rounded-full">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Fournisseur Form */}
        {showForm && (
          <Card id="fournisseur-form" className="border-0 shadow-xl bg-white dark:bg-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                {editingFournisseur ? "Modifier le Fournisseur" : "Nouveau Fournisseur"}
              </CardTitle>
              <CardDescription className="text-base">
                {editingFournisseur 
                  ? "Modifiez les informations du fournisseur"
                  : "Remplissez les informations du fournisseur pour l'ajouter à votre réseau"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Nom */}
                    <FormField
                      control={form.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            Nom du fournisseur *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nom du fournisseur" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Mail className="h-4 w-4 text-blue-500" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="email@exemple.com" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Téléphone */}
                    <FormField
                      control={form.control}
                      name="telephone"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Phone className="h-4 w-4 text-blue-500" />
                            Téléphone
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+33 1 23 45 67 89" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Type d'activité */}
                    <FormField
                      control={form.control}
                      name="type_Activite"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            Type d&apos;activité
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Pièces détachées, Outillage..." 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Adresse */}
                    <FormField
                      control={form.control}
                      name="adresse"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Adresse
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123 Rue de l'Exemple" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ville */}
                    <FormField
                      control={form.control}
                      name="ville"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Ville
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Paris" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Code postal */}
                    <FormField
                      control={form.control}
                      name="code_postal"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Code postal
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="75001" 
                              className="h-12 border-2 focus:border-blue-500 transition-colors"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Pays */}
                    <FormField
                      control={form.control}
                      name="pays"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="flex items-center gap-2 text-sm font-semibold">
                            <Globe className="h-4 w-4 text-blue-500" />
                            Pays
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="France" 
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
                      onClick={handleCancelForm}
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
                        ? (editingFournisseur ? "Modification en cours..." : "Ajout en cours...") 
                        : (editingFournisseur ? "Modifier le fournisseur" : "Ajouter le fournisseur")
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Fournisseurs List */}
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-800">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-2 bg-slate-500 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Liste des Fournisseurs
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {fournisseurs.length} fournisseur{fournisseurs.length > 1 ? "s" : ""} enregistré{fournisseurs.length > 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Rechercher un fournisseur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 w-80 h-12 border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingFournisseurs ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium">Chargement des fournisseurs...</p>
                </div>
              </div>
            ) : filteredFournisseurs.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  {searchTerm ? "Aucun fournisseur trouvé" : "Aucun fournisseur"}
                </h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  {searchTerm 
                    ? "Essayez de modifier votre recherche"
                    : "Commencez par ajouter votre premier fournisseur"
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowForm(true)} 
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Plus className="h-5 w-5" />
                    Ajouter un fournisseur
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFournisseurs.map((fournisseur) => (
                  <Card 
                    key={fournisseur.id}
                    className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:scale-105"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">
                              {fournisseur.nom}
                            </h3>
                            {fournisseur.type_Activite && (
                              <Badge 
                                variant="secondary" 
                                className="mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                              >
                                {fournisseur.type_Activite}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(fournisseur.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                handleEdit(fournisseur);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(fournisseur.id);
                              }}
                              className="text-destructive"
                              disabled={isDeleting === fournisseur.id}
                            >
                              {isDeleting === fournisseur.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-3">
                        {fournisseur.email && (
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">{fournisseur.email}</span>
                          </div>
                        )}
                        {fournisseur.telephone && (
                          <div className="flex items-center gap-3 text-sm">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">{fournisseur.telephone}</span>
                          </div>
                        )}
                        {fournisseur.ville && (
                          <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">
                              {fournisseur.ville}{fournisseur.code_postal && ` (${fournisseur.code_postal})`}
                            </span>
                          </div>
                        )}
                        {fournisseur.pays && (
                          <div className="flex items-center gap-3 text-sm">
                            <Globe className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-300">{fournisseur.pays}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Ajouté le {new Date(fournisseur.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Actif</span>
                          </div>
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              Détails du Fournisseur
            </DialogTitle>
            <DialogDescription>
              Informations complètes du fournisseur
            </DialogDescription>
          </DialogHeader>
          
          {selectedFournisseur && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3">{selectedFournisseur.nom}</h4>
                  {selectedFournisseur.type_Activite && (
                    <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      {selectedFournisseur.type_Activite}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedFournisseur.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-slate-600 dark:text-slate-300">{selectedFournisseur.email}</p>
                    </div>
                  </div>
                )}
                
                {selectedFournisseur.telephone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-slate-600 dark:text-slate-300">{selectedFournisseur.telephone}</p>
                    </div>
                  </div>
                )}
                
                {(selectedFournisseur.adresse || selectedFournisseur.ville || selectedFournisseur.code_postal) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-1" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-slate-600 dark:text-slate-300">
                        {[selectedFournisseur.adresse, selectedFournisseur.ville, selectedFournisseur.code_postal]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedFournisseur.pays && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium">Pays</p>
                      <p className="text-slate-600 dark:text-slate-300">{selectedFournisseur.pays}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-500">Date de création</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {new Date(selectedFournisseur.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-500">Dernière modification</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {new Date(selectedFournisseur.updatedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}