"use client";

import { useState, useEffect, useRef } from "react";
import { uploadSignature, getUserSignature, deleteSignature } from "@/lib/actions/signature";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Upload, Pen, Trash2, Check, X, ImageIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Signature {
  id: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function SignaturePage() {
  const { user, isLoaded } = useUser();
  const [signature, setSignature] = useState<Signature | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded) {
      loadSignature();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [imageFile]);

  const loadSignature = async () => {
    setLoadingData(true);
    const result = await getUserSignature();
    if (result.success && result.data) {
      setSignature(result.data);
    }
    setLoadingData(false);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if image is too large
          const maxDimension = 1500;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.8 // Quality 80%
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image");
        return;
      }
      
      try {
        // Compress the image to reduce size
        toast.info("Compression de l'image...");
        const compressedFile = await compressImage(file);
        
        // Check compressed size
        if (compressedFile.size > 1 * 1024 * 1024) {
          toast.warning("L'image est grande, nouvelle tentative de compression...");
          // Try higher compression
          const canvas = document.createElement('canvas');
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0);
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    const finalFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    setImageFile(finalFile);
                    toast.success("Image compressée avec succès!");
                  }
                },
                'image/jpeg',
                0.6 // Lower quality for smaller size
              );
            };
          };
        } else {
          setImageFile(compressedFile);
          toast.success("Image prête pour l'upload!");
        }
      } catch (error) {
        console.error("Compression error:", error);
        toast.error("Erreur lors de la compression de l'image");
      }
    }
  };

  const handleUpload = async () => {
    if (!imageFile) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    setLoading(true);
    const result = await uploadSignature(imageFile);

    if (result.success) {
      toast.success(result.message);
      setImageFile(null);
      setPreview(null);
      loadSignature();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre signature ?")) return;

    setLoading(true);
    const result = await deleteSignature();

    if (result.success) {
      toast.success(result.message);
      setSignature(null);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setImageFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isLoaded || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto p-6 lg:p-8 max-w-5xl relative z-10">
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
                      <Pen className="w-10 h-10 text-white" />
                    </div>
                  </div>
    <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      Ma Signature
                    </h1>
                    <p className="text-gray-600 mt-1 text-lg">
                      Téléchargez votre signature électronique
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Utilisateur</p>
                  <p className="font-semibold text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="relative overflow-hidden border-2 border-orange-200/50 bg-white/80 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-amber-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Upload className="w-6 h-6 text-orange-500" />
                Télécharger une signature
              </CardTitle>
              <CardDescription>
                Formats acceptés: JPG, PNG, GIF. L&apos;image sera automatiquement compressée pour l&apos;upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="signature-file" className="text-base font-medium">
                  Choisir une image
                </Label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    id="signature-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-600
                      file:mr-4 file:py-3 file:px-6
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-gradient-to-r file:from-orange-500 file:to-amber-500
                      file:text-white
                      file:cursor-pointer file:transition-all file:duration-300
                      hover:file:from-orange-600 hover:file:to-amber-600
                      hover:file:shadow-lg
                      cursor-pointer
                      border-2 border-dashed border-orange-300 rounded-xl p-4
                      bg-orange-50/50 hover:bg-orange-50 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Preview */}
              {preview && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Aperçu</Label>
                  <div className="relative rounded-xl overflow-hidden border-2 border-orange-200 bg-white p-4">
                    <div className="relative h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                      <Image
                        src={preview}
                        alt="Aperçu de la signature"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {imageFile && (
                  <>
                    <Button
                      onClick={handleUpload}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={loading}
                      variant="outline"
                      className="px-6 py-6 rounded-xl border-2 border-orange-200 hover:bg-orange-50 transition-all duration-300"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Help Text */}
              <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <p className="text-sm text-gray-600">
                  <strong className="text-orange-600">Conseil:</strong> Utilisez une image claire de votre signature sur fond blanc pour un meilleur résultat. L&apos;image sera automatiquement optimisée et compressée avant l&apos;upload. La signature sera utilisée pour signer vos documents commerciaux.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Signature Section */}
          <Card className="relative overflow-hidden border-2 border-orange-200/50 bg-white/80 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-amber-500"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ImageIcon className="w-6 h-6 text-orange-500" />
                Signature actuelle
              </CardTitle>
              <CardDescription>
                Votre signature enregistrée dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signature ? (
                <div className="space-y-6">
                  {/* Signature Display */}
                  <div className="relative rounded-xl overflow-hidden border-2 border-orange-200 bg-white">
                    <div className="relative h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50 p-6">
                      <div className="relative w-full h-full">
                        <Image
                          src={signature.image}
                          alt="Signature actuelle"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signature Info */}
                  <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Date de création:</span>
                      <span className="text-sm text-gray-800 font-semibold">
                        {new Date(signature.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Dernière modification:</span>
                      <span className="text-sm text-gray-800 font-semibold">
                        {new Date(signature.updatedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    onClick={handleDelete}
                    disabled={loading}
                    variant="destructive"
                    className="w-full py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5 mr-2" />
                        Supprimer la signature
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-orange-200 rounded-full blur-2xl opacity-30"></div>
                    <div className="relative p-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full">
                      <Pen className="w-16 h-16 text-orange-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Aucune signature
                  </h3>
                  <p className="text-gray-500">
                    Vous n&apos;avez pas encore téléchargé de signature.
                    <br />
                    Utilisez le formulaire à gauche pour en ajouter une.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Card */}
        <Card className="mt-8 relative overflow-hidden border-2 border-blue-200/50 bg-white/80 backdrop-blur-xl shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">À propos de votre signature</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Votre signature sera utilisée sur les documents commerciaux (factures, bons de commande, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Pour une meilleure qualité, utilisez une image haute résolution sur fond blanc</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Vous pouvez remplacer votre signature à tout moment en téléchargeant une nouvelle image</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>La signature est liée à votre compte et sera automatiquement appliquée à vos documents</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
