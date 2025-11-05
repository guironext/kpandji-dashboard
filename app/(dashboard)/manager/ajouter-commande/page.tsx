"use client";

import { useState, useEffect } from "react";
import { useForm, Control, FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createCommande, getCommandesProposees, getCommande, updateCommande, deleteCommande } from "@/lib/actions/commande";
import { getAllClients } from "@/lib/actions/client";
import { getAllFournisseurs } from "@/lib/actions/fournisseur";
import { getAllModele } from "@/lib/actions/modele";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Save, 
  Calendar, 
  Car, 
  Palette, 
  User, 
  Building2, 
  Settings,
  ArrowLeft,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Eye,
  MoreVertical
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  nbr_portes: z.string().min(1, "Le nombre de portes est requis"),
  transmission: z.enum(["AUTOMATIQUE", "MANUEL"]),
  etapeCommande: z.enum(["PROPOSITION", "VALIDE", "TRANSITE", "RENSEIGNEE", "ARRIVE", "VERIFIER", "MONTAGE", "TESTE", "PARKING", "CORRECTION", "VENTE"]),
  motorisation: z.enum(["ELECTRIQUE", "ESSENCE", "DIESEL", "HYBRIDE"]),
  couleur: z.string().min(1, "La couleur est requise"),
  date_livraison: z.string().min(1, "La date de livraison est requise"),
  clientId: z.string().min(1, "Le client est requis"),
  voitureModelId: z.string().optional(),
  fournisseurIds: z.array(z.string()),
});

type FormData = z.infer<typeof formSchema>;

type CommandeData = {
  id: string;
  nbr_portes: string;
  transmission: "AUTOMATIQUE" | "MANUEL";
  etapeCommande: "PROPOSITION" | "VALIDE" | "TRANSITE" | "RENSEIGNEE" | "ARRIVE" | "VERIFIER" | "MONTAGE" | "TESTE" | "PARKING" | "CORRECTION" | "VENTE";
  motorisation: "ELECTRIQUE" | "ESSENCE" | "DIESEL" | "HYBRIDE";
  couleur: string;
  date_livraison: Date;
  clientId: string;
  voitureModelId?: string | null; // Change from string | undefined to string | null
  fournisseurIds?: string[];
  client: { id: string; nom: string; telephone: string };
  voitureModel?: { id: string; model: string } | null; // Add | null
  fournisseurs: { id: string; nom: string; type_Activite?: string }[];
  conteneur?: { id: string; conteneurNumber: string } | null; // Add | null
  createdAt: Date;
  updatedAt: Date;
};

const ComposableFormItem = <TFieldValues extends FieldValues = FieldValues>({ 
  control, 
  name, 
  label, 
  required = false, 
  children, 
  className = "" 
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  required?: boolean;
  children: (field: ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>) => React.ReactNode;
  className?: string;
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className={className}>
        <FormLabel className="text-sm font-medium text-slate-700">
          {label} {required && "*"}
        </FormLabel>
        <FormControl>
          {children(field)}
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export default function AjouterCommandePage() {
  const [loading, setLoading] = useState(false);
  const [commandes, setCommandes] = useState<CommandeData[]>([]);
  const [clients, setClients] = useState<{ id: string; nom: string; telephone: string }[]>([]);
  const [fournisseurs, setFournisseurs] = useState<{ id: string; nom: string; type_Activite?: string }[]>([]);
  const [modeles, setModeles] = useState<{ id: string; model: string }[]>([]);
  const [selectedFournisseurs, setSelectedFournisseurs] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCommande, setEditingCommande] = useState<CommandeData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nbr_portes: "",
      couleur: "",
      date_livraison: "",
      clientId: "",
      voitureModelId: "",
      etapeCommande: "PROPOSITION",
      transmission: "MANUEL",
      motorisation: "ESSENCE",
      fournisseurIds: [],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, fournisseursRes, modelesRes, commandesRes] = await Promise.all([
          getAllClients(),
          getAllFournisseurs(),
          getAllModele(),
          getCommandesProposees(), // Changed from getAllCommandes()
        ]);

        if (clientsRes.success) setClients(clientsRes.data || []);
        if (fournisseursRes.success) setFournisseurs(
          fournisseursRes.data?.map(f => ({
            id: f.id,
            nom: f.nom,
            type_Activite: f.type_Activite || undefined
          })) || []
        );
        if (modelesRes.success) setModeles(modelesRes.data || []);
        if (commandesRes.success) setCommandes(commandesRes.data as CommandeData[] || []);
      } catch (error) {
        toast.error("Erreur lors du chargement des données");
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const commandeData = {
        ...data,
        date_livraison: new Date(data.date_livraison),
        fournisseurIds: selectedFournisseurs,
      };

      let result;
      if (editingCommande) {
        // Update existing commande
        result = await updateCommande(editingCommande.id, commandeData);
      } else {
        // Create new commande
        result = await createCommande(commandeData);
      }
      
      if (result.success) {
        toast.success(editingCommande ? "Commande modifiée avec succès" : "Commande créée avec succès");
        form.reset();
        setShowForm(false);
        setEditingCommande(null);
        setSelectedFournisseurs([]);
        // Reload commandes
        const commandesRes = await getCommandesProposees(); // Changed from getAllCommandes()
        if (commandesRes.success) setCommandes(commandesRes.data as CommandeData[] || []);
      } else {
        toast.error(result.error || `Erreur lors de ${editingCommande ? "la modification" : "la création"}`);
      }
    } catch (error) {
      toast.error(`Erreur lors de ${editingCommande ? "la modification" : "la création"} de la commande`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (commande: CommandeData) => {
    setEditingCommande(commande);
    form.reset({
      nbr_portes: commande.nbr_portes,
      transmission: commande.transmission,
      etapeCommande: commande.etapeCommande,
      motorisation: commande.motorisation,
      couleur: commande.couleur,
      date_livraison: new Date(commande.date_livraison).toISOString().slice(0, 10),
      clientId: commande.clientId,
      voitureModelId: commande.voitureModelId || "",
      fournisseurIds: commande.fournisseurs.map(f => f.id),
    });
    setSelectedFournisseurs(commande.fournisseurs.map(f => f.id));
    setShowForm(true);
  };

  const handleDelete = async (commandeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      return;
    }

    setIsDeleting(commandeId);
    try {
      const result = await deleteCommande(commandeId);
      if (result.success) {
        toast.success("Commande supprimée avec succès");
        // Reload commandes
        const commandesRes = await getCommandesProposees(); // Changed from getAllCommandes()
        if (commandesRes.success) setCommandes(commandesRes.data as CommandeData[] || []);
      } else {
        toast.error(result.error || "Erreur lors de la suppression de la commande");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression de la commande");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancel = () => {
    form.reset();
    setShowForm(false);
    setEditingCommande(null);
    setSelectedFournisseurs([]);
  };

  const handleFournisseurToggle = (fournisseurId: string) => {
    setSelectedFournisseurs(prev => 
      prev.includes(fournisseurId)
        ? prev.filter(id => id !== fournisseurId)
        : [...prev, fournisseurId]
    );
  };

  const removeFournisseur = (fournisseurId: string) => {
    setSelectedFournisseurs(prev => prev.filter(id => id !== fournisseurId));
  };

  const filteredCommandes = commandes.filter(commande =>
    commande.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commande.couleur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commande.nbr_portes.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/manager")}
            className="mb-4 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Car className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Commandes en Proposition</h1>
                <p className="text-slate-600">Gérer les commandes en attente de validation</p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Car className="h-4 w-4 mr-2" />
              Nouvelle Commande
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Commandes List */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Car className="h-5 w-5 text-blue-600" />
                  Commandes en Proposition
                </CardTitle>
                <CardDescription>
                  {filteredCommandes.length} commande{filteredCommandes.length !== 1 ? 's' : ''} en proposition trouvée{filteredCommandes.length !== 1 ? 's' : ''}
                </CardDescription>
                <div className="relative mt-4">
                  <Input
                    placeholder="Rechercher une commande..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {filteredCommandes.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Aucune commande en proposition trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCommandes.map((commande) => (
                      <div key={commande.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {commande.etapeCommande}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                {new Date(commande.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {commande.client.nom}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                              <div>
                                <span className="font-medium">Modèle:</span> {commande.voitureModel?.model || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Couleur:</span> {commande.couleur}
                              </div>
                              <div>
                                <span className="font-medium">Portes:</span> {commande.nbr_portes}
                              </div>
                              <div>
                                <span className="font-medium">Transmission:</span> {commande.transmission}
                              </div>
                              <div>
                                <span className="font-medium">Motorisation:</span> {commande.motorisation}
                              </div>
                              <div>
                                <span className="font-medium">Livraison:</span> {new Date(commande.date_livraison).toLocaleDateString()}
                              </div>
                            </div>
                            {commande.fournisseurs.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-slate-600">Fournisseurs:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {commande.fournisseurs.map((fournisseur) => (
                                    <Badge key={fournisseur.id} variant="secondary" className="text-xs">
                                      {fournisseur.nom}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(commande)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(commande.id)}
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

          {/* Form Sidebar */}
          {showForm && (
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0 sticky top-4">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Settings className="h-5 w-5 text-blue-600" />
                    {editingCommande ? "Modifier la Commande" : "Nouvelle Commande"}
                  </CardTitle>
                  <CardDescription>
                    {editingCommande ? "Modifiez les informations de la commande" : "Remplissez les informations pour la nouvelle commande"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Client Selection */}
                      <ComposableFormItem
                        control={form.control}
                        name="clientId"
                        label="Client"
                        required
                      >
                        {(field) => (
                          <Select onValueChange={field.onChange} value={field.value as string}>
                            <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Sélectionner un client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id} className="py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{client.nom}</span>
                                    <span className="text-sm text-slate-500">{client.telephone}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </ComposableFormItem>

                      {/* Modèle Selection */}
                      <ComposableFormItem
                        control={form.control}
                        name="voitureModelId"
                        label="Modèle de Voiture"
                      >
                        {(field) => (
                          <Select onValueChange={field.onChange} value={field.value as string}>
                            <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Sélectionner un modèle" />
                            </SelectTrigger>
                            <SelectContent>
                              {modeles.map((modele) => (
                                <SelectItem key={modele.id} value={modele.id} className="py-3">
                                  {modele.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </ComposableFormItem>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ComposableFormItem
                          control={form.control}
                          name="nbr_portes"
                          label="Nombre de Portes"
                          required
                        >
                          {(field) => (
                            <Input 
                              placeholder="4" 
                              {...field} 
                              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                          )}
                        </ComposableFormItem>

                        <ComposableFormItem
                          control={form.control}
                          name="transmission"
                          label="Transmission"
                          required
                        >
                          {(field) => (
                            <Select onValueChange={field.onChange} value={field.value as string}>
                              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MANUEL">Manuel</SelectItem>
                                <SelectItem value="AUTOMATIQUE">Automatique</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </ComposableFormItem>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ComposableFormItem
                          control={form.control}
                          name="motorisation"
                          label="Motorisation"
                          required
                        >
                          {(field) => (
                            <Select onValueChange={field.onChange} value={field.value as string}>
                              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ESSENCE">Essence</SelectItem>
                                <SelectItem value="DIESEL">Diesel</SelectItem>
                                <SelectItem value="ELECTRIQUE">Électrique</SelectItem>
                                <SelectItem value="HYBRIDE">Hybride</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </ComposableFormItem>

                        <ComposableFormItem
                          control={form.control}
                          name="couleur"
                          label="Couleur"
                          required
                        >
                          {(field) => (
                            <Input 
                              placeholder="Blanc" 
                              {...field} 
                              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                          )}
                        </ComposableFormItem>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ComposableFormItem
                          control={form.control}
                          name="date_livraison"
                          label="Date de Livraison"
                          required
                        >
                          {(field) => (
                            <Input 
                              type="date" 
                              {...field} 
                              className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                          )}
                        </ComposableFormItem>

                        <ComposableFormItem
                          control={form.control}
                          name="etapeCommande"
                          label="Étape de Commande"
                          required
                        >
                          {(field) => (
                            <Select onValueChange={field.onChange} value={field.value as string}>
                              <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Sélectionner une étape" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PROPOSITION">Proposition</SelectItem>
                               
                              </SelectContent>
                            </Select>
                          )}
                        </ComposableFormItem>
                      </div>

                      

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          className="flex-1"
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {editingCommande ? "Modification..." : "Création..."}
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              {editingCommande ? "Modifier" : "Créer"}
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
        </div>
      </div>
    </div>
  );
}