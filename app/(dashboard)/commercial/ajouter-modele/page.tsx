"use client";

import { useState, useEffect } from "react";
import { createModel, getAllModele, deleteModele, updateModele } from "@/lib/actions/modele";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { PlusCircle, Trash2, Calendar, FileText, X, Image as ImageIcon, Car, Edit, Sparkles, Zap } from "lucide-react";

export default function AjouterModelePage() {
  const [models, setModels] = useState<
    Array<{
      id: string;
      model: string;
      fiche_technique: string | null;
      description?: string | null;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [ficheTechFiles, setFicheTechFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    model: "",
    fiche_technique: "",
    description: "",
  });
  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (imageFiles.length > 0) {
      const objectUrl = URL.createObjectURL(imageFiles[0]);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [imageFiles]);

  const loadModels = async () => {
    const result = await getAllModele();
    if (result.success && result.data) {
      setModels(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const allFiles = [...imageFiles, ...ficheTechFiles];
    
    const result = editingId
      ? await updateModele(editingId, formData, allFiles, ficheTechFiles.length > 0)
      : await createModel(formData, allFiles, ficheTechFiles.length > 0);

    if (result.success) {
      toast.success(result.message);
      setFormData({ model: "", fiche_technique: "", description: "" });
      setImageFiles([]);
      setFicheTechFiles([]);
      setPreview(null);
      setEditingId(null);
      loadModels();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) return;
    const result = await deleteModele(id);
    if (result.success) {
      toast.success(result.message);
      loadModels();
    } else {
      toast.error(result.message);
    }
  };

  const handleEdit = (model: {
    id: string;
    model: string;
    fiche_technique: string | null;
    description?: string | null;
    image?: string | null;
  }) => {
    setEditingId(model.id);
    setFormData({
      model: model.model,
      fiche_technique: model.fiche_technique || "",
      description: model.description || "",
    });
    if (model.image) {
      setPreview(model.image);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto p-6 lg:p-8 max-w-7xl relative z-10">
        {/* Stunning Header with gradient and animations */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-200/50">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg">
                      <Car className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-5xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                        Modèles de Véhicules
                      </h1>
                      <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                    </div>
                    <p className="text-orange-700/70 mt-2 text-lg font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Gérez et organisez votre catalogue de modèles
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Badge className="text-xl px-8 py-4 shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0">
                  <Car className="w-5 h-5 mr-2" />
                  {models.length} {models.length !== 1 ? 'modèles' : 'modèle'}
                </Badge>
                <div className="text-xs text-orange-600 text-center font-semibold">
                  Catalogue Premium
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stunning Form Card with Amber/Orange Theme */}
          <div className="lg:col-span-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl blur-xl opacity-20"></div>
              <Card className="relative shadow-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"></div>
                <CardHeader className="space-y-3 pb-6 pt-8 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl blur-md opacity-50"></div>
                      <div className="relative p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                        <PlusCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        {editingId ? "Modifier le Modèle" : "Nouveau Modèle"}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-orange-700/70 font-medium">
                        {editingId 
                          ? "✨ Modifiez les informations du modèle" 
                          : "🚀 Ajoutez un nouveau véhicule au catalogue"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Model Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-orange-900 flex items-center gap-2">
                    <Car className="w-4 h-4 text-orange-500" />
                    Nom du modèle *
                  </Label>
                  <Input
                    placeholder="Ex: Djetran Automatique"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    className="h-12 border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 bg-white rounded-xl"
                  />
                </div>

                {/* Technical File Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-orange-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    Fiche Technique
                  </Label>
                  <div className="relative">
                    <Input
                      type="file"
                      onChange={(e) => setFicheTechFiles(e.target.files ? Array.from(e.target.files) : [])}
                      accept=".pdf,.doc,.docx,.txt"
                      className="h-12 cursor-pointer border-2 border-orange-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-orange-500 file:to-amber-500 file:text-white hover:file:from-orange-600 hover:file:to-amber-600"
                    />
                  </div>
                  {ficheTechFiles.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 shadow-sm">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-semibold flex-1 truncate text-orange-900">{ficheTechFiles[0].name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFicheTechFiles([])}
                        className="h-8 w-8 p-0 hover:bg-orange-200 rounded-lg"
                      >
                        <X className="w-4 h-4 text-orange-600" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-orange-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Description
                  </Label>
                  <Textarea
                    placeholder="Ajoutez une description détaillée du modèle..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px] resize-none border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-orange-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-500" />
                    Image du modèle
                  </Label>
                  <Input
                    type="file"
                    onChange={(e) => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                    accept="image/*"
                    className="h-12 cursor-pointer border-2 border-orange-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-orange-500 file:to-amber-500 file:text-white hover:file:from-orange-600 hover:file:to-amber-600"
                  />
                </div>

                {/* Image Preview */}
                {preview && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl blur-lg opacity-30"></div>
                    <div className="relative w-full h-56 rounded-2xl overflow-hidden border-4 border-orange-200 shadow-2xl">
                      <Image src={preview} alt="Preview" fill className="object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setImageFiles([]);
                          setPreview(null);
                        }}
                        className="absolute top-3 right-3 h-10 w-10 p-0 rounded-full shadow-lg bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="relative pt-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50"></div>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="relative w-full h-14 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 text-white border-0 rounded-2xl"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        {editingId ? "Modification en cours..." : "Création en cours..."}
                      </>
                    ) : (
                      <>
                        {editingId ? <Edit className="w-6 h-6 mr-3" /> : <PlusCircle className="w-6 h-6 mr-3" />}
                        {editingId ? "✨ Mettre à jour" : "🚀 Créer le Modèle"}
                      </>
                    )}
                  </Button>
                </div>
                {editingId && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ model: "", fiche_technique: "", description: "" });
                      setImageFiles([]);
                      setFicheTechFiles([]);
                      setPreview(null);
                    }}
                    className="w-full h-12 border-2 border-orange-300 hover:bg-orange-50 text-orange-700 font-semibold rounded-xl"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Annuler la modification
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
            </div>
          </div>

          {/* Stunning Models List with Amber/Orange Theme */}
          <div className="lg:col-span-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl blur-xl opacity-20"></div>
              <Card className="relative shadow-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"></div>
                <CardHeader className="space-y-3 pb-6 pt-8 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-3">
                        🏆 Catalogue des Modèles
                      </CardTitle>
                      <CardDescription className="text-orange-700/70 font-semibold mt-2 text-base">
                        Tous vos modèles enregistrés • {models.length} {models.length !== 1 ? 'véhicules' : 'véhicule'}
                      </CardDescription>
                    </div>
                    <div className="hidden md:block">
                      <Badge className="px-6 py-3 text-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                        <Zap className="w-5 h-5 mr-2" />
                        Premium
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {models.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full blur-2xl opacity-30"></div>
                        <div className="relative p-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full">
                          <Car className="w-20 h-20 text-orange-600" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-orange-900 mb-3">Aucun modèle</h3>
                      <p className="text-orange-700/70 max-w-sm text-lg">
                        🚀 Commencez par ajouter votre premier modèle de véhicule au catalogue
                      </p>
                    </div>
                  ) : (
                <div className="grid gap-5">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <div className="relative border-2 border-orange-200/50 rounded-2xl p-6 flex gap-6 items-start hover:shadow-2xl hover:border-orange-300 transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
                        {/* Image */}
                        {model.image ? (
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl blur-md opacity-30"></div>
                            <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 ring-4 ring-orange-200/50 shadow-xl">
                              <Image 
                                src={model.image} 
                                alt={model.model} 
                                fill 
                                className="object-contain group-hover:scale-110 transition-transform duration-300" 
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Car className="w-12 h-12 text-orange-600" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <h3 className="font-bold text-2xl bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent mb-2">
                              {model.model}
                            </h3>
                            {model.description && (
                              <p className="text-sm text-orange-800/70 line-clamp-2 font-medium">
                                {model.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4">
                            {model.fiche_technique && (
                              <a
                                href={model.fiche_technique}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-md transition-all"
                              >
                                <FileText className="w-4 h-4" />
                                Fiche technique
                              </a>
                            )}
                            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm text-orange-700 bg-orange-100 rounded-lg font-semibold">
                              <Calendar className="w-4 h-4" />
                              {new Date(model.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(model)}
                            className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 text-orange-700 shadow-md hover:shadow-lg transition-all"
                          >
                            <Edit className="w-5 h-5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(model.id)}
                            className="h-12 w-12 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 shadow-md hover:shadow-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
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
        </div>
      </div>
    </div>
  );
}
