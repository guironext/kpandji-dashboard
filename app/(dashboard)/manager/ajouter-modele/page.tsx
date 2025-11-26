"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createModel, getAllModele, deleteModele, getModele, updateModele } from "@/lib/actions/modele";
import { 
  Loader2, 
  Car, 
  FileText, 
  Upload, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Sparkles,
  TrendingUp,
  Shield,
  Star,
  Save,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Schema for form validation
const createModelSchema = z.object({
  model: z.string().min(1, "Le nom du modèle est requis"),
  fiche_technique: z.string().optional(),
});

type CreateModelForm = z.infer<typeof createModelSchema>;

// Type for model data
type ModeleData = {
  id: string;
  model: string;
  fiche_technique: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function AjouterModelePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<ModeleData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // New states for details and edit functionality
  const [selectedModel, setSelectedModel] = useState<ModeleData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModeleData | null>(null);
  const [editFiles, setEditFiles] = useState<File[]>([]);

  const form = useForm<CreateModelForm>({
    resolver: zodResolver(createModelSchema),
    defaultValues: {
      model: "",
      fiche_technique: "",
    },
  });

  // Edit form
  const editForm = useForm<CreateModelForm>({
    resolver: zodResolver(createModelSchema),
    defaultValues: {
      model: "",
      fiche_technique: "",
    },
  });

  // Load models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const result = await getAllModele();
      if (result.success && result.data) {
        setModels(result.data);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des modèles");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CreateModelForm) => {
    if (selectedFiles.length === 0) {
      toast.error("Veuillez sélectionner au moins un fichier");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createModel(data, selectedFiles);
      
      if (result.success) {
        toast.success(result.message);
        form.reset();
        setSelectedFiles([]);
        loadModels(); // Reload the list
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la création du modèle");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view details
  const handleViewDetails = async (modelId: string) => {
    try {
      const result = await getModele(modelId);
      if (result.success && result.data) {
        setSelectedModel(result.data);
        setIsDetailsOpen(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des détails");
    }
  };

  // Handle edit model
  const handleEditModel = async (modelId: string) => {
    try {
      const result = await getModele(modelId);
      if (result.success && result.data) {
        setEditingModel(result.data);
        editForm.reset({
          model: result.data.model,
          fiche_technique: result.data.fiche_technique || "",
        });
        setEditFiles([]);
        setIsEditOpen(true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du modèle");
    }
  };

  // Handle update model
  const handleUpdateModel = async (data: CreateModelForm) => {
    if (!editingModel) return;

    setIsSubmitting(true);
    try {
      const result = await updateModele(editingModel.id, data, editFiles.length > 0 ? editFiles : undefined);
      
      if (result.success) {
        toast.success(result.message);
        setIsEditOpen(false);
        setEditingModel(null);
        setEditFiles([]);
        editForm.reset();
        loadModels(); // Reload the list
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du modèle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setEditFiles(prev => [...prev, ...files]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditFile = (index: number) => {
    setEditFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      return;
    }

    try {
      const result = await deleteModele(modelId);
      if (result.success) {
        toast.success(result.message);
        loadModels();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression du modèle");
    }
  };

  const filteredModels = models.filter(model =>
    model.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header with Stats */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Gestion des Modèles
                  </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Créez et gérez votre catalogue de modèles de voitures
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {models.length}
                  </div>
                  <div className="text-sm text-slate-500">Modèles</div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Add Model Form - Enhanced */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Nouveau Modèle</CardTitle>
                    <CardDescription>
                      Ajoutez un modèle avec ses spécifications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            Nom du Modèle *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: DJETRAN"
                              className="border-2 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fiche_technique"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Spécifications Techniques
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez les spécifications techniques du modèle..."
                              className="min-h-[100px] border-2 focus:border-blue-500 transition-colors resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Enhanced File Upload */}
                    <div className="space-y-3">
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-500" />
                        Documents Techniques *
                      </FormLabel>
                      <div 
                        className={cn(
                          "border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer",
                          dragActive 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                            : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className={cn(
                            "p-3 rounded-full transition-colors",
                            dragActive 
                              ? "bg-blue-100 dark:bg-blue-900/30" 
                              : "bg-slate-100 dark:bg-slate-700"
                          )}>
                            <Upload className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Glissez-déposez vos fichiers
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              ou{' '}
                              <label className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium">
                                cliquez pour sélectionner
                                <input
                                  type="file"
                                  multiple
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                  onChange={handleFileChange}
                                  className="hidden"
                                />
                              </label>
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                          </p>
                        </div>
                      </div>
                      
                      {/* Selected Files - Enhanced */}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Fichiers sélectionnés ({selectedFiles.length})
                          </p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                      {file.name}
                                    </span>
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 font-semibold" 
                      disabled={isSubmitting || selectedFiles.length === 0}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Créer le Modèle
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Models List - Enhanced */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Modèles Existants</CardTitle>
                      <CardDescription>
                        {filteredModels.length} modèle{filteredModels.length !== 1 ? 's' : ''} trouvé{filteredModels.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un modèle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Models List */}
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                        <p className="text-slate-500">Chargement des modèles...</p>
                      </div>
                    </div>
                  ) : filteredModels.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full w-fit mx-auto mb-4">
                        <Car className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Aucun modèle trouvé
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        {searchTerm ? "Essayez avec d'autres mots-clés" : "Commencez par créer votre premier modèle"}
                      </p>
                    </div>
                  ) : (
                    filteredModels.map((model) => (
                      <div key={model.id} className="group border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 bg-white dark:bg-slate-800/50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                                <Car className="h-4 w-4 text-white" />
                              </div>
                              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                                {model.model}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                Modèle
                              </Badge>
                            </div>
                            
                            {model.fiche_technique && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 pl-8">
                                {model.fiche_technique}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 pl-8">
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <Calendar className="h-3 w-3" />
                                <span>Créé le {new Date(model.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span>Actif</span>
                              </div>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleViewDetails(model.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer"
                                onClick={() => handleEditModel(model.id)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteModel(model.id)}
                                className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 dark:focus:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Détails du Modèle
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur le modèle sélectionné
            </DialogDescription>
          </DialogHeader>
          
          {selectedModel && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nom du Modèle
                  </label>
                  <p className="text-lg font-medium text-slate-900 dark:text-white">
                    {selectedModel.model}
                  </p>
                </div>
                
                {selectedModel.fiche_technique && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Spécifications Techniques
                    </label>
                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {selectedModel.fiche_technique}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Date de Création
                    </label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(selectedModel.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Dernière Mise à Jour
                    </label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(selectedModel.updatedAt).toLocaleDateString('fr-FR', {
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Modifier le Modèle
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations du modèle sélectionné
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateModel)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Nom du Modèle *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: DJETRAN"
                        className="border-2 focus:border-blue-500 transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="fiche_technique"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      Spécifications Techniques
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez les spécifications techniques du modèle..."
                        className="min-h-[100px] border-2 focus:border-blue-500 transition-colors resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload for Edit */}
              <div className="space-y-3">
                <FormLabel className="text-sm font-semibold">
                  Nouveaux Documents (optionnel)
                </FormLabel>
                <div 
                  className="border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">
                      <Upload className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Ajouter de nouveaux fichiers
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ou{' '}
                        <label className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline font-medium">
                          cliquez pour sélectionner
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            onChange={handleEditFileChange}
                            className="hidden"
                          />
                        </label>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Selected Edit Files */}
                {editFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Nouveaux fichiers ({editFiles.length})
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {editFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {file.name}
                              </span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </Badge>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEditFile(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingModel(null);
                    setEditFiles([]);
                    editForm.reset();
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}