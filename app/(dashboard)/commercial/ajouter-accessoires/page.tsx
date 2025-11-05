"use client";

import { useState, useEffect } from "react";
import { createAccessoire, getAllAccessoires, deleteAccessoire } from "@/lib/actions/accessoire";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { PlusCircle, Trash2, Image as ImageIcon, Package, X } from "lucide-react";

export default function AjouterAccessoiresPage() {
  const [accessoires, setAccessoires] = useState<Array<{
    id: string;
    nom: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
  });

  useEffect(() => {
    loadAccessoires();
  }, []);

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [imageFile]);

  const loadAccessoires = async () => {
    const result = await getAllAccessoires();
    if (result.success && result.data) {
      setAccessoires(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createAccessoire(formData, imageFile || undefined);

    if (result.success) {
      toast.success(result.message);
      setFormData({ nom: "" });
      setImageFile(null);
      setPreview(null);
      loadAccessoires();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet accessoire ?")) return;
    const result = await deleteAccessoire(id);
    if (result.success) {
      toast.success(result.message);
      loadAccessoires();
    } else {
      toast.error(result.message);
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
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-orange-200/50">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-50"></div>
                    <div className="relative p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg">
                      <Package className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                      Accessoires
                    </h1>
                    <p className="text-orange-700/70 mt-2 text-lg font-medium">
                      Gérez les accessoires pour véhicules
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Badge className="text-xl px-8 py-4 shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0">
                  <Package className="w-5 h-5 mr-2" />
                  {accessoires.length} {accessoires.length !== 1 ? 'accessoires' : 'accessoire'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Card */}
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
                        Nouvel Accessoire
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-orange-700/70 font-medium">
                        Ajoutez un accessoire au catalogue
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Accessory Name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-orange-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-500" />
                        Nom de l&apos;accessoire *
                      </Label>
                      <Input
                        placeholder="Ex: Tapis de sol premium"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        required
                        className="h-12 border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 bg-white rounded-xl"
                      />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-orange-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-orange-500" />
                        Image de l&apos;accessoire
                      </Label>
                      <Input
                        type="file"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        accept="image/*"
                        className="h-12 cursor-pointer border-2 border-orange-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-orange-500 file:to-amber-500 file:text-white hover:file:from-orange-600 hover:file:to-amber-600"
                      />
                    </div>

                    {/* Image Preview */}
                    {preview && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl blur-lg opacity-30"></div>
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden border-4 border-orange-200 shadow-2xl">
                          <Image src={preview} alt="Preview" fill className="object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
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
                            Création en cours...
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-6 h-6 mr-3" />
                            Créer l&apos;Accessoire
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Accessories List */}
          <div className="lg:col-span-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-3xl blur-xl opacity-20"></div>
              <Card className="relative shadow-2xl border-2 border-orange-200/50 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"></div>
                <CardHeader className="space-y-3 pb-6 pt-8 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        Catalogue des Accessoires
                      </CardTitle>
                      <CardDescription className="text-orange-700/70 font-semibold mt-2 text-base">
                        Tous vos accessoires enregistrés
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {accessoires.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full blur-2xl opacity-30"></div>
                        <div className="relative p-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full">
                          <Package className="w-20 h-20 text-orange-600" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-orange-900 mb-3">Aucun accessoire</h3>
                      <p className="text-orange-700/70 max-w-sm text-lg">
                        Commencez par ajouter votre premier accessoire
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-5">
                      {accessoires.map((accessoire) => (
                        <div key={accessoire.id} className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                          <div className="relative border-2 border-orange-200/50 rounded-2xl p-6 flex gap-6 items-start hover:shadow-2xl hover:border-orange-300 transition-all duration-300 bg-gradient-to-br from-white to-orange-50/30">
                            {/* Image */}
                            {accessoire.image ? (
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-2xl blur-md opacity-30"></div>
                                <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 ring-4 ring-orange-200/50 shadow-xl">
                                  <Image 
                                    src={accessoire.image} 
                                    alt={accessoire.nom} 
                                    fill 
                                    className="object-contain group-hover:scale-110 transition-transform duration-300" 
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Package className="w-12 h-12 text-orange-600" />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-3">
                              <div>
                                <h3 className="font-bold text-2xl bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent mb-2">
                                  {accessoire.nom}
                                </h3>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(accessoire.id)}
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
