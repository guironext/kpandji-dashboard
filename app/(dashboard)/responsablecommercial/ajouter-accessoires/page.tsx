"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAccessoire, getAllAccessoires, deleteAccessoire, updateAccessoire } from "@/lib/actions/accessoire";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, Package, Trash2, X, Pencil } from "lucide-react";

type AccessoireItem = {
  id: string;
  nom: string;
  description?: string | null;
  prix?: number | null;
  quantity?: number | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function AjouterAccessoiresPage() {
  const [accessoires, setAccessoires] = useState<AccessoireItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAccessoire, setEditingAccessoire] = useState<AccessoireItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    prix: "",
    quantity: "1",
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

    const result = await createAccessoire(
      {
        nom: formData.nom,
        description: formData.description || undefined,
        prix: formData.prix ? Number(formData.prix) : undefined,
        quantity: formData.quantity ? Number(formData.quantity) : undefined,
      },
      imageFile || undefined
    );

    if (result.success) {
      toast.success(result.message);
      setFormData({ nom: "", description: "", prix: "", quantity: "1" });
      setImageFile(null);
      setPreview(null);
      setDialogOpen(false);
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

  const handleEdit = (accessoire: AccessoireItem) => {
    setEditingAccessoire(accessoire);
    setFormData({
      nom: accessoire.nom,
      description: accessoire.description || "",
      prix: accessoire.prix != null ? String(accessoire.prix) : "",
      quantity: accessoire.quantity != null ? String(accessoire.quantity) : "1",
    });
    setImageFile(null);
    setPreview(accessoire.image || null);
    setEditDialogOpen(true);
  };

  const editPreview = editDialogOpen && !imageFile && editingAccessoire?.image
    ? editingAccessoire.image
    : preview;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccessoire) return;
    setLoading(true);

    const result = await updateAccessoire(
      editingAccessoire.id,
      {
        nom: formData.nom,
        description: formData.description || undefined,
        prix: formData.prix ? Number(formData.prix) : undefined,
        quantity: formData.quantity ? Number(formData.quantity) : undefined,
      },
      imageFile || undefined
    );

    if (result.success) {
      toast.success(result.message);
      setEditDialogOpen(false);
      setEditingAccessoire(null);
      resetForm();
      loadAccessoires();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ nom: "", description: "", prix: "", quantity: "1" });
    setImageFile(null);
    setPreview(null);
    setEditingAccessoire(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Top: Ajouter Accessoire button */}
      <div className="mb-8">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter Accessoire
        </Button>
      </div>

      {/* Dialog with form */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel accessoire</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire pour ajouter un accessoire au catalogue.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                placeholder="Ex: Tapis de sol premium"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de l'accessoire"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prix">Prix (FCFA)</Label>
                <Input
                  id="prix"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            {preview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                <Image src={preview} alt="Preview" fill className="object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-8 w-8"
                  onClick={() => {
                    setImageFile(null);
                    setPreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;accessoire</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l&apos;accessoire.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nom">Nom *</Label>
              <Input
                id="edit-nom"
                placeholder="Ex: Tapis de sol premium"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Description de l'accessoire"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-prix">Prix (FCFA)</Label>
                <Input
                  id="edit-prix"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantité</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Image (laisser vide pour conserver)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
            {editPreview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                <Image src={editPreview} alt="Preview" fill className="object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-8 w-8"
                  onClick={() => {
                    setImageFile(null);
                    setPreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottom: List of all accessoires */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Liste des accessoires</h2>
        {accessoires.length === 0 ? (
          <div className="border rounded-lg p-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun accessoire enregistré.</p>
            <p className="text-sm mt-1">Cliquez sur &quot;Ajouter Accessoire&quot; pour commencer.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Image</th>
                  <th className="text-left p-3 font-medium">Nom</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-right p-3 font-medium">Prix</th>
                  <th className="text-center p-3 font-medium">Qté</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessoires.map((accessoire) => (
                  <tr key={accessoire.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      {accessoire.image ? (
                        <div className="relative w-16 h-16 rounded overflow-hidden">
                          <Image
                            src={accessoire.image}
                            alt={accessoire.nom}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium">{accessoire.nom}</td>
                    <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">
                      {accessoire.description || "—"}
                    </td>
                    <td className="p-3 text-right">
                      {accessoire.prix != null
                        ? accessoire.prix.toLocaleString("fr-FR") + " FCFA"
                        : "—"}
                    </td>
                    <td className="p-3 text-center">{accessoire.quantity ?? 1}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(accessoire)}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Pencil className="w-4 h-4" />
                         
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(accessoire.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
