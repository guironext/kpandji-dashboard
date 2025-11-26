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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createClient, getAllClients, updateClient, deleteClient } from "@/lib/actions/client";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  UserPlus, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  Users, 
  Search, 
  Plus,
  Calendar,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const clientSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().min(1, "Le téléphone est obligatoire").max(20, "Le téléphone ne peut pas dépasser 20 caractères"),
  entreprise: z.string().optional(),
  secteur_activite: z.string().optional(),
  localisation: z.string().optional(),
  commercial: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

type Client = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string;
  entreprise: string | null;
  secteur_activite: string | null;
  localisation: string | null;
  commercial: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export default function AjouterClientPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: "",
      entreprise: "",
      secteur_activite: "",
      localisation: "",
      commercial: "",
    },
  });

  // Add edit form
  const editForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: "",
      entreprise: "",
      secteur_activite: "",
      localisation: "",
      commercial: "",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    if (!user) {
      toast.error("Vous devez être connecté pour créer un client");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const cleanedData = {
        ...data,
        email: data.email || undefined,
        entreprise: data.entreprise || undefined,
        secteur_activite: data.secteur_activite || undefined,
        localisation: data.localisation || undefined,
        commercial: data.commercial || undefined,
        userId: user.id,
      };

      const result = await createClient(cleanedData);

      if (result.success) {
        toast.success("Client créé avec succès!");
        form.reset();
        setShowForm(false);
        // Refresh clients list
        const clientsResult = await getAllClients();
        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data.map(client => ({
            ...client,
            createdAt: client.createdAt.toISOString(),
            updatedAt: client.updatedAt.toISOString()
          })));
        }
      } else {
        toast.error(result.error || "Erreur lors de la création du client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    editForm.reset({
      nom: client.nom,
      email: client.email || "",
      telephone: client.telephone,
      entreprise: client.entreprise || "",
      secteur_activite: client.secteur_activite || "",
      localisation: client.localisation || "",
      commercial: client.commercial || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const onDeleteConfirm = async () => {
    if (!clientToDelete) return;

    setIsSubmitting(true);
    
    try {
      const result = await deleteClient(clientToDelete.id);

      if (result.success) {
        toast.success("Client supprimé avec succès!");
        setIsDeleteDialogOpen(false);
        setClientToDelete(null);
        // Refresh clients list
        const clientsResult = await getAllClients();
        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data.map(client => ({
            ...client,
            createdAt: client.createdAt.toISOString(),
            updatedAt: client.updatedAt.toISOString()
          })));
        }
      } else {
        toast.error(result.error || "Erreur lors de la suppression du client");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: ClientFormValues) => {
    if (!editingClient) return;

    setIsSubmitting(true);
    
    try {
      const cleanedData = {
        ...data,
        email: data.email || undefined,
        entreprise: data.entreprise || undefined,
        secteur_activite: data.secteur_activite || undefined,
        localisation: data.localisation || undefined,
        commercial: data.commercial || undefined,
      };

      const result = await updateClient(editingClient.id, cleanedData);

      if (result.success) {
        toast.success("Client modifié avec succès!");
        setIsEditDialogOpen(false);
        setEditingClient(null);
        // Refresh clients list
        const clientsResult = await getAllClients();
        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data.map(client => ({
            ...client,
            createdAt: client.createdAt.toISOString(),
            updatedAt: client.updatedAt.toISOString()
          })));
        }
      } else {
        toast.error(result.error || "Erreur lors de la modification du client");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const result = await getAllClients();
        if (result.success && result.data) {
          setClients(result.data.map(client => ({
            ...client,
            createdAt: client.createdAt.toISOString(),
            updatedAt: client.updatedAt.toISOString()
          })));
        } else {
          toast.error("Erreur lors du chargement des clients");
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Erreur lors du chargement des clients");
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.entreprise && client.entreprise.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <Alert>
          <AlertDescription>
            Vous devez être connecté pour accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Add role check for Manager users only
  if (user.publicMetadata?.role !== "MANAGER") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertDescription>
            Accès refusé. Seuls les managers peuvent accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gestion des Clients
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                Gérez votre base de données clients avec facilité
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? "Masquer le formulaire" : "Nouveau client"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/manager")}
                className="border-slate-300 hover:bg-slate-50"
              >
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Clients</p>
                  <p className="text-3xl font-bold text-slate-900">{clients.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avec Email</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {clients.filter(c => c.email).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Entreprises</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {clients.filter(c => c.entreprise).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Recherche</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {filteredClients.length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Search className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Add Client Form - Collapsible */}
          {showForm && (
            <div className="xl:col-span-1">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Nouveau Client
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Remplissez les informations du client
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <UserPlus className="h-5 w-5 text-blue-600" />
                          Informations personnelles
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="nom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-slate-700">
                                  <UserPlus className="h-4 w-4" />
                                  Nom complet *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Entrez le nom complet du client"
                                    {...field}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="telephone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-slate-700">
                                  <Phone className="h-4 w-4" />
                                  Téléphone *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: +225 07 12 34 56 78"
                                    {...field}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-slate-700">
                                  <Mail className="h-4 w-4" />
                                  Email
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="client@exemple.com"
                                    {...field}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator className="bg-slate-200" />

                      {/* Professional Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          Informations professionnelles
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="entreprise"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-slate-700">
                                  <Building2 className="h-4 w-4" />
                                  Entreprise
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Nom de l'entreprise"
                                    {...field}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="secteur_activite"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-slate-700">
                                  <Briefcase className="h-4 w-4" />
                                  Secteur d&apos;activité
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ex: Automobile, Transport, etc."
                                    {...field}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="localisation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-slate-700">
                                  <MapPin className="h-4 w-4" />
                                  Localisation
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ville, Pays"
                                    {...field}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="commercial"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-slate-700">
                                  <UserPlus className="h-4 w-4" />
                                  Commercial assigné
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Nom du commercial"
                                    {...field}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Création...
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Créer le client
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clients List */}
          <div className={cn("xl:col-span-2", showForm ? "xl:col-span-2" : "xl:col-span-3")}>
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg mt-4">
                <div className="flex items-center justify-between">
                  <div className="mt-4">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Liste des Clients ({clients.length})
                    </CardTitle>
                    <CardDescription className="text-slate-200">
                      Tous les clients enregistrés dans la base de données
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm">Filtres</span>
                  </div>
                </div>
                <div className="relative my-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom, téléphone, email ou entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/90 border-white/20 focus:border-white/40 text-slate-900 placeholder:text-slate-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingClients ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">
                      {searchTerm ? "Aucun client trouvé pour cette recherche." : "Aucun client enregistré."}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setShowForm(true)}
                        className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter le premier client
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredClients.map((client, index) => (
                      <div
                        key={client.id}
                        className={cn(
                          "border-b border-slate-200 p-6 hover:bg-slate-50 transition-all duration-200",
                          index === 0 && "border-t-0"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {client.nom.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 text-lg">
                                  {client.nom}
                                </h3>
                                <p className="text-sm text-slate-500">
                                  Ajouté le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Phone className="h-4 w-4 text-blue-500" />
                                  <span className="font-medium">{client.telephone}</span>
                                </div>
                                {client.email && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail className="h-4 w-4 text-green-500" />
                                    <span>{client.email}</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                {client.entreprise && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Building2 className="h-4 w-4 text-purple-500" />
                                    <span>{client.entreprise}</span>
                                  </div>
                                )}
                                {client.localisation && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin className="h-4 w-4 text-orange-500" />
                                    <span>{client.localisation}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {client.secteur_activite && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                  {client.secteur_activite}
                                </Badge>
                              )}
                              {client.commercial && (
                                <Badge variant="outline" className="border-purple-200 text-purple-700">
                                  Commercial: {client.commercial}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClient(client)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Client Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <UserPlus className="h-6 w-6 text-blue-600" />
                Détails du Client
              </DialogTitle>
              <DialogDescription>
                Informations complètes du client sélectionné
              </DialogDescription>
            </DialogHeader>
            
            {selectedClient && (
              <div className="space-y-6">
                {/* Client Header */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedClient.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {selectedClient.nom}
                    </h3>
                    <p className="text-slate-600">
                      Client depuis le {new Date(selectedClient.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Informations personnelles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Phone className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-slate-600">Téléphone</p>
                          <p className="font-medium text-slate-900">{selectedClient.telephone}</p>
                        </div>
                      </div>
                      {selectedClient.email && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <Mail className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm text-slate-600">Email</p>
                            <p className="font-medium text-slate-900">{selectedClient.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {selectedClient.localisation && (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <MapPin className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-sm text-slate-600">Localisation</p>
                            <p className="font-medium text-slate-900">{selectedClient.localisation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                {(selectedClient.entreprise || selectedClient.secteur_activite || selectedClient.commercial) && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Informations professionnelles
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {selectedClient.entreprise && (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <Building2 className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="text-sm text-slate-600">Entreprise</p>
                              <p className="font-medium text-slate-900">{selectedClient.entreprise}</p>
                            </div>
                          </div>
                        )}
                        {selectedClient.secteur_activite && (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <Briefcase className="h-5 w-5 text-indigo-500" />
                            <div>
                              <p className="text-sm text-slate-600">Secteur d&apos;activité</p>
                              <p className="font-medium text-slate-900">{selectedClient.secteur_activite}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {selectedClient.commercial && (
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <UserPlus className="h-5 w-5 text-pink-500" />
                            <div>
                              <p className="text-sm text-slate-600">Commercial assigné</p>
                              <p className="font-medium text-slate-900">{selectedClient.commercial}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Informations système
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Créé le</p>
                      <p className="font-medium text-slate-900">
                        {new Date(selectedClient.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">Modifié le</p>
                      <p className="font-medium text-slate-900">
                        {new Date(selectedClient.updatedAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setIsDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Fermer
                  </Button>
                  
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Edit className="h-6 w-6 text-blue-600" />
                Modifier le Client
              </DialogTitle>
              <DialogDescription>
                Modifiez les informations du client sélectionné
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Informations personnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={editForm.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <UserPlus className="h-4 w-4" />
                            Nom complet *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Entrez le nom complet du client"
                              {...field}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="telephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <Phone className="h-4 w-4" />
                            Téléphone *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: +225 07 12 34 56 78"
                              {...field}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <Mail className="h-4 w-4" />
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="client@exemple.com"
                              {...field}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-200" />

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Informations professionnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={editForm.control}
                      name="entreprise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <Building2 className="h-4 w-4" />
                            Entreprise
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nom de l'entreprise"
                              {...field}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="secteur_activite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <Briefcase className="h-4 w-4" />
                            Secteur d&apos;activité
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Automobile, Transport, etc."
                              {...field}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="localisation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <MapPin className="h-4 w-4" />
                            Localisation
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ville, Pays"
                              {...field}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="commercial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-slate-700">
                            <UserPlus className="h-4 w-4" />
                            Commercial assigné
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nom du commercial"
                              {...field}
                              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Modification...
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier le client
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
                <Trash2 className="h-6 w-6" />
                Confirmer la suppression
              </DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            
            {clientToDelete && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {clientToDelete.nom.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {clientToDelete.nom}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {clientToDelete.telephone}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setIsDeleteDialogOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={onDeleteConfirm}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}