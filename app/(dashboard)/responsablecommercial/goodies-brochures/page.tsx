"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createGoodiesBrochures,
  updateGoodiesBrochures,
  createGoodiesBrochuresAttribution,
  addQuantityToGoodiesBrochures,
  deleteGoodiesBrochures,
  getAllGoodiesBrochures,
  getAllGoodiesBrochuresAttributions,
  type GoodiesBrochuresItem,
  type GoodiesBrochuresAttributionItem,
} from "@/lib/actions/goodies-brochures";
import { toast } from "sonner";
import { Plus, Package, X, Pencil, Trash2, Layers, Loader2, UserPlus, PackagePlus } from "lucide-react";

export default function GoodiesBrochuresPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GoodiesBrochuresItem | null>(null);
  const [attributionDialogOpen, setAttributionDialogOpen] = useState(false);
  const [attributionFormData, setAttributionFormData] = useState({
    goodiesBrochuresId: "",
    attribution_commercial: "",
    destination: "",
    quantite_attribuee: "",
  });
  const [addQuantityDialogOpen, setAddQuantityDialogOpen] = useState(false);
  const [addQuantityItem, setAddQuantityItem] = useState<GoodiesBrochuresItem | null>(null);
  const [addQuantityValue, setAddQuantityValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [goodies, setGoodies] = useState<GoodiesBrochuresItem[]>([]);
  const [loadingGoodies, setLoadingGoodies] = useState(true);
  const [attributions, setAttributions] = useState<GoodiesBrochuresAttributionItem[]>([]);
  const [loadingAttributions, setLoadingAttributions] = useState(true);

  const loadGoodies = useCallback(async () => {
    setLoadingGoodies(true);
    const result = await getAllGoodiesBrochures();
    if (result.success && result.data) {
      setGoodies(result.data);
    }
    setLoadingGoodies(false);
  }, []);

  const loadAttributions = useCallback(async () => {
    setLoadingAttributions(true);
    const result = await getAllGoodiesBrochuresAttributions();
    if (result.success && result.data) {
      setAttributions(result.data);
    }
    setLoadingAttributions(false);
  }, []);

  useEffect(() => {
    loadGoodies();
    loadAttributions();
  }, [loadGoodies, loadAttributions]);
  const CATEGORIES = [
    "Gadgets Grands Publics",
    "Gadgets Luxe",
    "Gadgets du Personnels",
    "Ensemble Gadgets",
  ] as const;

  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    categorie: "",
    quantite: "0",
    prix_achat: "",
    origine_artisan: "",
    contact_artisan: "",
  });

  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
      categorie: "",
      quantite: "0",
      prix_achat: "",
      origine_artisan: "",
      contact_artisan: "",
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: GoodiesBrochuresItem) => {
    setEditingItem(item);
    setFormData({
      nom: item.nom,
      description: item.description || "",
      categorie: item.categorie || "",
      quantite: String(item.quantite),
      prix_achat: item.prix_achat != null ? String(item.prix_achat) : "",
      origine_artisan: item.origine_artisan || "",
      contact_artisan: item.contact_artisan || "",
    });
    setEditDialogOpen(true);
  };

  const openAddQuantityDialog = (item: GoodiesBrochuresItem) => {
    setAddQuantityItem(item);
    setAddQuantityValue("");
    setAddQuantityDialogOpen(true);
  };

  const openAttributionDialog = (item?: GoodiesBrochuresItem) => {
    setAttributionFormData({
      goodiesBrochuresId: item?.id ?? "",
      attribution_commercial: "",
      destination: "",
      quantite_attribuee: "",
    });
    setAttributionDialogOpen(true);
  };

  const handleAddQuantitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addQuantityItem) return;

    const quantity = Number(addQuantityValue) || 0;
    if (quantity <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    setLoading(true);
    const result = await addQuantityToGoodiesBrochures(addQuantityItem.id, quantity);
    if (result.success) {
      toast.success(result.message);
      setAddQuantityDialogOpen(false);
      setAddQuantityItem(null);
      setAddQuantityValue("");
      loadGoodies();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createGoodiesBrochures({
      nom: formData.nom,
      description: formData.description || undefined,
      categorie: formData.categorie || undefined,
      quantite: formData.quantite ? Number(formData.quantite) : 0,
      prix_achat: formData.prix_achat ? Number(formData.prix_achat) : null,
      origine_artisan: formData.origine_artisan || undefined,
      contact_artisan: formData.contact_artisan || undefined,
    });

    if (result.success) {
      toast.success(result.message);
      setCreateDialogOpen(false);
      resetForm();
      loadGoodies();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setLoading(true);

    const result = await updateGoodiesBrochures(editingItem.id, {
      nom: formData.nom,
      description: formData.description || undefined,
      categorie: formData.categorie || undefined,
      quantite: formData.quantite ? Number(formData.quantite) : 0,
      prix_achat: formData.prix_achat ? Number(formData.prix_achat) : null,
      origine_artisan: formData.origine_artisan || undefined,
      contact_artisan: formData.contact_artisan || undefined,
    });

    if (result.success) {
      toast.success(result.message);
      setEditDialogOpen(false);
      resetForm();
      loadGoodies();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleAttributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributionFormData.goodiesBrochuresId) {
      toast.error("Veuillez sélectionner un goodie");
      return;
    }

    const quantiteAttribuee = Number(attributionFormData.quantite_attribuee) || 0;
    if (quantiteAttribuee <= 0) {
      toast.error("La quantité doit être supérieure à 0");
      return;
    }

    const selectedGoodie = goodies.find((g) => g.id === attributionFormData.goodiesBrochuresId);
    if (selectedGoodie && quantiteAttribuee > selectedGoodie.quantite_restante) {
      toast.error(`Quantité disponible insuffisante (restant : ${selectedGoodie.quantite_restante})`);
      return;
    }

    setLoading(true);

    const result = await createGoodiesBrochuresAttribution({
      goodiesBrochuresId: attributionFormData.goodiesBrochuresId,
      attribution_commercial: attributionFormData.attribution_commercial,
      destination: attributionFormData.destination || undefined,
      quantite_attribuee: quantiteAttribuee,
    });

    if (result.success) {
      toast.success(result.message);
      setAttributionDialogOpen(false);
      setAttributionFormData({ goodiesBrochuresId: "", attribution_commercial: "", destination: "", quantite_attribuee: "" });
      loadGoodies();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (item: GoodiesBrochuresItem) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${item.nom}" ?`)) return;

    const result = await deleteGoodiesBrochures(item.id);

    if (result.success) {
      toast.success(result.message);
      loadGoodies();
    } else {
      toast.error(result.message);
    }
  };

  const totalQuantite = goodies.reduce((s, g) => s + g.quantite, 0);
  const totalValue = goodies.reduce(
    (s, g) => s + (g.prix_achat != null ? g.prix_achat * g.quantite : 0),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative p-6 space-y-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl">
                  <Package className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-amber-900 to-orange-900 bg-clip-text text-transparent">
                  Goodies & Brochures
                </h1>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                  Gérez le catalogue et les attributions aux commerciaux
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Créer Goodies / Brochures
              </Button>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total références
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goodies.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Goodies et brochures
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quantité totale
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantite.toLocaleString("fr-FR")}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Unités en stock
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valeur totale
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalValue.toLocaleString("fr-FR")} FCFA
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Prix d&apos;achat
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Create Goodies / Brochures Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden" showCloseButton={false}>
          {/* Header with accent */}
          <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5">
            <button
              type="button"
              onClick={() => setCreateDialogOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  Créer Goodies / Brochures
                </DialogTitle>
                <DialogDescription className="text-white/90 text-sm mt-0.5">
                  Ajoutez un nouveau goodie ou une brochure au catalogue
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateSubmit}>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {/* Section: Informations principales */}
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Informations principales
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-sm font-medium">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nom"
                      placeholder="Ex: Brochure véhicule X"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Description du goodie ou brochure"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categorie" className="text-sm font-medium">
                      Catégorie
                    </Label>
                    <Select
                      value={formData.categorie}
                      onValueChange={(value) => setFormData({ ...formData, categorie: value })}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Section: Stock & Prix */}
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Stock & Prix
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantite" className="text-sm font-medium">
                      Quantité
                    </Label>
                    <Input
                      id="quantite"
                      type="number"
                      min="0"
                      value={formData.quantite}
                      onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prix_achat" className="text-sm font-medium">
                      Prix d&apos;achat (FCFA)
                    </Label>
                    <Input
                      id="prix_achat"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.prix_achat}
                      onChange={(e) => setFormData({ ...formData, prix_achat: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Section: Fournisseur */}
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fournisseur / Artisan
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="origine_artisan" className="text-sm font-medium">
                      Origine / Artisan
                    </Label>
                    <Input
                      id="origine_artisan"
                      placeholder="Origine ou nom de l&apos;artisan"
                      value={formData.origine_artisan}
                      onChange={(e) => setFormData({ ...formData, origine_artisan: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_artisan" className="text-sm font-medium">
                      Contact artisan
                    </Label>
                    <Input
                      id="contact_artisan"
                      placeholder="Téléphone ou email"
                      value={formData.contact_artisan}
                      onChange={(e) => setFormData({ ...formData, contact_artisan: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-muted/30 px-6 py-4">
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Goodies / Brochures Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden" showCloseButton={false}>
          <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5">
            <button
              type="button"
              onClick={() => setEditDialogOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Pencil className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  Modifier l&apos;article
                </DialogTitle>
                <DialogDescription className="text-white/90 text-sm mt-0.5">
                  {editingItem?.nom}
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleEditSubmit}>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Informations principales
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nom" className="text-sm font-medium">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-nom"
                      placeholder="Ex: Brochure véhicule X"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description" className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Description du goodie ou brochure"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-categorie" className="text-sm font-medium">
                      Catégorie
                    </Label>
                    <Select
                      value={formData.categorie}
                      onValueChange={(value) => setFormData({ ...formData, categorie: value })}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Stock & Prix
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-quantite" className="text-sm font-medium">
                      Quantité
                    </Label>
                    <Input
                      id="edit-quantite"
                      type="number"
                      min="0"
                      value={formData.quantite}
                      onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-prix_achat" className="text-sm font-medium">
                      Prix d&apos;achat (FCFA)
                    </Label>
                    <Input
                      id="edit-prix_achat"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={formData.prix_achat}
                      onChange={(e) => setFormData({ ...formData, prix_achat: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fournisseur / Artisan
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-origine_artisan" className="text-sm font-medium">
                      Origine / Artisan
                    </Label>
                    <Input
                      id="edit-origine_artisan"
                      placeholder="Origine ou nom de l&apos;artisan"
                      value={formData.origine_artisan}
                      onChange={(e) => setFormData({ ...formData, origine_artisan: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contact_artisan" className="text-sm font-medium">
                      Contact artisan
                    </Label>
                    <Input
                      id="edit-contact_artisan"
                      placeholder="Téléphone ou email"
                      value={formData.contact_artisan}
                      onChange={(e) => setFormData({ ...formData, contact_artisan: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t bg-muted/30 px-6 py-4">
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Quantity Dialog */}
      <Dialog
        open={addQuantityDialogOpen}
        onOpenChange={(open) => {
          setAddQuantityDialogOpen(open);
          if (!open) {
            setAddQuantityItem(null);
            setAddQuantityValue("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden" showCloseButton={false}>
          <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5">
            <button
              type="button"
              onClick={() => setAddQuantityDialogOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <PackagePlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  Ajouter au stock
                </DialogTitle>
                <DialogDescription className="text-white/90 text-sm mt-0.5">
                  {addQuantityItem?.nom}
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddQuantitySubmit}>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add_quantite" className="text-sm font-medium">
                  Quantité à ajouter
                </Label>
                <Input
                  id="add_quantite"
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                  value={addQuantityValue}
                  onChange={(e) => setAddQuantityValue(e.target.value)}
                  className="h-10"
                />
                {addQuantityItem && (
                  <p className="text-xs text-muted-foreground">
                    Stock actuel : {addQuantityItem.quantite} · Restant : {addQuantityItem.quantite_restante}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t bg-muted/30 px-6 py-4">
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddQuantityDialogOpen(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {loading ? "Enregistrement..." : "OK"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attribution Dialog */}
      <Dialog
        open={attributionDialogOpen}
        onOpenChange={(open) => {
          setAttributionDialogOpen(open);
          if (!open) {
            setAttributionFormData({ goodiesBrochuresId: "", attribution_commercial: "", destination: "", quantite_attribuee: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden" showCloseButton={false}>
          <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5">
            <button
              type="button"
              onClick={() => setAttributionDialogOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  Attribution
                </DialogTitle>
                <DialogDescription className="text-white/90 text-sm mt-0.5">
                  Attribuer des goodies à un commercial
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleAttributionSubmit}>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="attribution_goodie" className="text-sm font-medium">
                  Goodie / Brochure
                </Label>
                <Select
                  value={attributionFormData.goodiesBrochuresId}
                  onValueChange={(value) =>
                    setAttributionFormData({ ...attributionFormData, goodiesBrochuresId: value })
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Sélectionner un goodie" />
                  </SelectTrigger>
                  <SelectContent>
                    {goodies.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nom} (restant : {g.quantite_restante})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attribution_commercial" className="text-sm font-medium">
                  Raison                                                                                                       de l&apos;attribution
                </Label>
                <Input
                  id="attribution_commercial"
                  placeholder="Nom du commercial"
                  value={attributionFormData.attribution_commercial}
                  onChange={(e) =>
                    setAttributionFormData({ ...attributionFormData, attribution_commercial: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attribution_destination" className="text-sm font-medium">
                  Destinataire
                </Label>
                <Input
                  id="attribution_destination"
                  placeholder="Destination"
                  value={attributionFormData.destination}
                  onChange={(e) =>
                    setAttributionFormData({ ...attributionFormData, destination: e.target.value })
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attribution_quantite" className="text-sm font-medium">
                  Quantité
                </Label>
                <Input
                  id="attribution_quantite"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={attributionFormData.quantite_attribuee}
                  onChange={(e) =>
                    setAttributionFormData({ ...attributionFormData, quantite_attribuee: e.target.value })
                  }
                  className="h-10"
                />
                {(() => {
                  const sel = goodies.find((g) => g.id === attributionFormData.goodiesBrochuresId);
                  return sel ? (
                    <p className="text-xs text-muted-foreground">
                      Restant : {sel.quantite_restante}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="border-t bg-muted/30 px-6 py-4">
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAttributionDialogOpen(false)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

        {/* Table of goodies */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Liste des goodies et brochures</CardTitle>
                <CardDescription>
                  {goodies.length} référence{goodies.length !== 1 ? "s" : ""} au catalogue
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingGoodies ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>Chargement du catalogue...</p>
              </div>
            ) : goodies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <div className="rounded-full bg-amber-100 p-6 mb-4">
                  <Package className="w-12 h-12 text-amber-600" />
                </div>
                <p className="font-medium text-foreground">Aucun goodie ou brochure</p>
                <p className="text-sm mt-1 max-w-sm text-center">
                  Cliquez sur &quot;Créer Goodies / Brochures&quot; pour ajouter votre premier article au catalogue.
                </p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le premier
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="px-4 py-3 font-semibold">Nom</TableHead>
                      <TableHead className="px-4 py-3 font-semibold">Catégorie</TableHead>
                      <TableHead className="px-4 py-3 text-right font-semibold">Prix (FCFA)</TableHead>
                      <TableHead className="px-4 py-3 font-semibold">Origine</TableHead>
                      <TableHead className="px-4 py-3 font-semibold">Contact</TableHead>
                      <TableHead className="px-4 py-3 text-right font-semibold">Qté rest.</TableHead>
                      <TableHead className="px-4 py-3 font-semibold">Attribution</TableHead>
                      <TableHead className="px-4 py-3 text-center font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goodies.map((item) => (
                      <TableRow key={item.id} className="group">
                        <TableCell className="px-4 py-3 font-medium">{item.nom}</TableCell>
                        <TableCell className="px-4 py-3">
                          {item.categorie ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                              {item.categorie}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums">
                          {item.prix_achat != null
                            ? item.prix_achat.toLocaleString("fr-FR")
                            : "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{item.origine_artisan || "—"}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{item.contact_artisan || "—"}</TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums font-medium">
                          {item.quantite_restante}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                            onClick={() => openAttributionDialog(item)}
                          >
                            Attribuer
                          </Button>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              aria-label="Ajouter au stock"
                              onClick={() => openAddQuantityDialog(item)}
                            >
                              <PackagePlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                              aria-label="Modifier"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              aria-label="Supprimer"
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table of attributions */}
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Liste des attributions</CardTitle>
                <CardDescription>
                  {attributions.length} attribution{attributions.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAttributions ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin mb-4" />
                <p>Chargement des attributions...</p>
              </div>
            ) : attributions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <UserPlus className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-medium text-foreground">Aucune attribution</p>
                <p className="text-sm mt-1">Les attributions apparaîtront ici.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="px-4 py-3 font-semibold">Date</TableHead>
                      <TableHead className="px-4 py-3 font-semibold">Goodie</TableHead>
                      <TableHead className="px-4 py-3 font-semibold">Commercial</TableHead>
                      <TableHead className="px-4 py-3 font-semibold">Destination</TableHead>
                      <TableHead className="px-4 py-3 text-right font-semibold">Quantité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-3 font-medium">{item.goodieNom}</TableCell>
                        <TableCell className="px-4 py-3">{item.attribution_commercial}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{item.destination || "—"}</TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums font-medium">
                          {item.quantite_attribuee}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
