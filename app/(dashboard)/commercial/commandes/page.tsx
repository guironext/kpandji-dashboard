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

import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { createCommande, getCommandesProposees,  updateCommande, deleteCommande } from "@/lib/actions/commande";
import { getAllClients } from "@/lib/actions/client";
import { getAllFournisseurs } from "@/lib/actions/fournisseur";
import { getAllModele } from "@/lib/actions/modele";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Save, 
  Car, 
  Settings,
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  Sparkles,
  TrendingUp,
  Package,
  Search,
  Clock,
  CheckCircle2
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
        <FormLabel className="text-sm font-bold text-teal-900">
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
      } catch{
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
    } catch{
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
    } catch{
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



 

  const filteredCommandes = commandes.filter(commande =>
    commande.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commande.couleur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commande.nbr_portes.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 p-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Stunning Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/manager")}
            className="mb-4 text-teal-700 hover:text-teal-900 hover:bg-teal-100 font-semibold rounded-xl"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 rounded-3xl blur-2xl opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-teal-200/50">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                      <div className="relative p-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
                        <Car className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-5xl font-black bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                          Commandes en Proposition
                        </h1>
                        <Sparkles className="w-8 h-8 text-cyan-500 animate-pulse" />
                      </div>
                      <p className="text-teal-700/70 text-lg font-medium flex items-center gap-2 mt-2">
                        <Package className="w-5 h-5" />
                        Gérer les commandes en attente de validation
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-50"></div>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="relative h-14 px-8 text-lg font-bold shadow-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 hover:from-teal-600 hover:via-cyan-600 hover:to-emerald-600 text-white border-0 rounded-2xl"
                  >
                    <Car className="w-5 h-5 mr-2" />
                    Nouvelle Commande
                  </Button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="mt-6 pt-6 border-t-2 border-teal-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-2xl border-2 border-teal-200/50">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        {commandes.length}
                      </div>
                      <div className="text-sm font-bold text-teal-700">Total Commandes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-cyan-50 to-emerald-50 p-4 rounded-2xl border-2 border-cyan-200/50">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl shadow-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                        {filteredCommandes.length}
                      </div>
                      <div className="text-sm font-bold text-cyan-700">En Attente</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border-2 border-emerald-200/50">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {clients.length}
                      </div>
                      <div className="text-sm font-bold text-emerald-700">Clients</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stunning Commandes List */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-3xl blur-xl opacity-20"></div>
              <Card className="relative shadow-2xl border-2 border-teal-200/50 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500"></div>
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-200 p-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    <Package className="h-6 w-6 text-teal-600" />
                    Commandes en Proposition
                  </CardTitle>
                  <CardDescription className="text-teal-700/70 font-semibold text-base mt-2">
                    🚀 {filteredCommandes.length} commande{filteredCommandes.length !== 1 ? 's' : ''} en proposition trouvée{filteredCommandes.length !== 1 ? 's' : ''}
                  </CardDescription>
                  <div className="relative mt-4">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-teal-500" />
                    <Input
                      placeholder="🔍 Rechercher une commande..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-14 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-2xl text-base font-medium"
                    />
                  </div>
                </CardHeader>
              <CardContent className="p-6">
                {filteredCommandes.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full blur-2xl opacity-30"></div>
                      <div className="relative w-24 h-24 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-teal-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      Aucune commande trouvée
                    </h3>
                    <p className="text-base text-teal-700/70 font-medium">
                      Commencez par créer votre première commande
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredCommandes.map((commande) => (
                      <div key={commande.id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-2xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        <div className="relative border-2 border-teal-200/50 rounded-2xl p-5 hover:shadow-2xl hover:border-teal-300 transition-all duration-300 bg-gradient-to-br from-white to-teal-50/30">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 px-4 py-1 font-bold shadow-md">
                                  {commande.etapeCommande}
                                </Badge>
                                <span className="text-sm text-teal-700 font-semibold bg-teal-50 px-3 py-1 rounded-lg">
                                  📅 {new Date(commande.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <h3 className="font-bold text-xl bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent mb-3">
                                {commande.client.nom}
                              </h3>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
                                  <span className="font-bold text-teal-900">Modèle:</span>
                                  <span className="text-teal-700 ml-2">{commande.voitureModel?.model || 'N/A'}</span>
                                </div>
                                <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200">
                                  <span className="font-bold text-cyan-900">Couleur:</span>
                                  <span className="text-cyan-700 ml-2">{commande.couleur}</span>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                  <span className="font-bold text-emerald-900">Portes:</span>
                                  <span className="text-emerald-700 ml-2">{commande.nbr_portes}</span>
                                </div>
                                <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
                                  <span className="font-bold text-teal-900">Transmission:</span>
                                  <span className="text-teal-700 ml-2">{commande.transmission}</span>
                                </div>
                                <div className="bg-cyan-50 p-3 rounded-xl border border-cyan-200">
                                  <span className="font-bold text-cyan-900">Motorisation:</span>
                                  <span className="text-cyan-700 ml-2">{commande.motorisation}</span>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                  <span className="font-bold text-emerald-900">Livraison:</span>
                                  <span className="text-emerald-700 ml-2">{new Date(commande.date_livraison).toLocaleDateString('fr-FR')}</span>
                                </div>
                              </div>
                              {commande.fournisseurs.length > 0 && (
                                <div className="mt-4 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200">
                                  <span className="text-sm font-bold text-teal-900">📦 Fournisseurs:</span>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {commande.fournisseurs.map((fournisseur) => (
                                      <Badge key={fournisseur.id} className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white border-0 px-3 py-1 font-bold">
                                        {fournisseur.nom}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl hover:bg-teal-100">
                                  <MoreVertical className="h-5 w-5 text-teal-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="border-2 border-teal-200">
                                <DropdownMenuItem onClick={() => handleEdit(commande)} className="font-semibold">
                                  <Edit className="h-4 w-4 mr-2 text-teal-600" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(commande.id)}
                                  className="text-red-600 font-semibold"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Stunning Form Sidebar */}
          {showForm && (
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-3xl blur-xl opacity-20"></div>
                <Card className="relative shadow-2xl border-2 border-teal-200/50 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500"></div>
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-200 p-6">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                      {editingCommande ? <Edit className="h-6 w-6 text-teal-600" /> : <Settings className="h-6 w-6 text-teal-600" />}
                      {editingCommande ? "Modifier la Commande" : "Nouvelle Commande"}
                    </CardTitle>
                    <CardDescription className="text-teal-700/70 font-semibold mt-2">
                      {editingCommande ? "✨ Modifiez les informations de la commande" : "🚀 Remplissez les informations pour la nouvelle commande"}
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
                            <SelectTrigger className="h-12 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl">
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
                            <SelectTrigger className="h-12 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl">
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
                              className="h-12 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
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
                              <SelectTrigger className="h-12 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl">
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
                              <SelectTrigger className="h-12 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl">
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
                              className="h-12 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
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
                              className="h-12 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
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
                              <SelectTrigger className="h-12 border-2 border-teal-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl">
                                <SelectValue placeholder="Sélectionner une étape" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PROPOSITION">Proposition</SelectItem>
                                <SelectItem value="VALIDE">Validé</SelectItem>
                                <SelectItem value="TRANSITE">Transité</SelectItem>
                                <SelectItem value="RENSEIGNEE">Renseignée</SelectItem>
                                <SelectItem value="ARRIVE">Arrivé</SelectItem>
                                <SelectItem value="VERIFIER">Vérifié</SelectItem>
                                <SelectItem value="MONTAGE">Montage</SelectItem>
                                <SelectItem value="TESTE">Testé</SelectItem>
                                <SelectItem value="PARKING">Parking</SelectItem>
                                <SelectItem value="CORRECTION">Correction</SelectItem>
                                <SelectItem value="VENTE">Vente</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </ComposableFormItem>
                      </div>

                      

                      <div className="flex gap-3 pt-6 border-t-2 border-teal-200">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          className="flex-1 h-12 border-2 border-teal-300 hover:bg-teal-50 text-teal-700 font-bold rounded-xl"
                        >
                          Annuler
                        </Button>
                        <div className="relative flex-1">
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl blur-md opacity-50"></div>
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="relative w-full h-12 font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 rounded-xl shadow-lg"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {editingCommande ? "Modification..." : "Création..."}
                              </>
                            ) : (
                              <>
                                {editingCommande ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                                {editingCommande ? "✨ Modifier" : "🚀 Créer"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}