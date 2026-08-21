"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoitureModel {
  id: string;
  model: string;
}

interface VoitureSavGarantie {
  id: string;
  marqueVoiture: string;
  modelVoiture: string;
  chassisNumber?: string | null;
  immatriculation?: string | null;
  couleur: string;
  _count?: { VoitureSAV: number };
}

const emptyForm = {
  marqueVoiture: "KPANDJI",
  modelVoiture: "",
  chassisNumber: "",
  immatriculation: "",
  couleur: "",
};

async function fetchGaranties() {
  const res = await fetch("/api/sav/voiture-sav-garantie");
  return res.json();
}

async function fetchVoitureModels(): Promise<VoitureModel[]> {
  const res = await fetch("/api/voiture-models");
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function createGarantie(data: Record<string, string>) {
  const res = await fetch("/api/sav/voiture-sav-garantie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function updateGarantie(id: string, data: Record<string, string>) {
  const res = await fetch(`/api/sav/voiture-sav-garantie/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function deleteGarantie(id: string) {
  const res = await fetch(`/api/sav/voiture-sav-garantie/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

export default function ListeVoitureSousGarantieTab({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [items, setItems] = useState<VoitureSavGarantie[]>([]);
  const [voitureModels, setVoitureModels] = useState<VoitureModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<VoitureSavGarantie | null>(null);
  const [editingItem, setEditingItem] = useState<VoitureSavGarantie | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [result, models] = await Promise.all([fetchGaranties(), fetchVoitureModels()]);
      if (result.success && result.data) setItems(result.data);
      else toast.error(result.error || "Erreur lors du chargement");
      setVoitureModels(models.filter((m) => m.model?.trim()));
    } catch (error) {
      console.error("Error fetching voitures sous garantie:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: VoitureSavGarantie) => {
    setEditingItem(item);
    setFormData({
      marqueVoiture: item.marqueVoiture || "KPANDJI",
      modelVoiture: item.modelVoiture,
      chassisNumber: item.chassisNumber || "",
      immatriculation: item.immatriculation || "",
      couleur: item.couleur,
    });
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (item: VoitureSavGarantie) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.modelVoiture.trim() || !formData.couleur.trim()) {
      toast.error("Le modèle et la couleur sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createGarantie(formData);
      if (result.success) {
        toast.success("Voiture en garantie ajoutée");
        setAddDialogOpen(false);
        loadData();
      } else toast.error(result.error || "Erreur lors de l'ajout");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingItem || !formData.modelVoiture.trim() || !formData.couleur.trim()) {
      toast.error("Le modèle et la couleur sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateGarantie(editingItem.id, formData);
      if (result.success) {
        toast.success("Voiture en garantie modifiée");
        setEditDialogOpen(false);
        setEditingItem(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la modification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const result = await deleteGarantie(itemToDelete.id);
      if (result.success) {
        toast.success("Voiture en garantie supprimée");
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la suppression");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  const modelOptions = Array.from(
    new Map(
      [
        ...voitureModels,
        ...(formData.modelVoiture &&
        !voitureModels.some((m) => m.model === formData.modelVoiture)
          ? [{ id: `current-${formData.modelVoiture}`, model: formData.modelVoiture }]
          : []),
      ].map((m) => [m.model, m])
    ).values()
  );

  const renderForm = (prefix: string) => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-marque`}>Marque</Label>
          <Input
            id={`${prefix}-marque`}
            value={formData.marqueVoiture}
            onChange={(e) => setFormData((p) => ({ ...p, marqueVoiture: e.target.value }))}
            placeholder="KPANDJI"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-model`}>Modèle *</Label>
          <Select
            value={formData.modelVoiture || undefined}
            onValueChange={(value) => setFormData((p) => ({ ...p, modelVoiture: value }))}
          >
            <SelectTrigger id={`${prefix}-model`} className="rounded-lg">
              <SelectValue placeholder="Choisir un modèle" />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500">Aucun modèle disponible</div>
              ) : (
                modelOptions.map((m) => (
                  <SelectItem key={m.id} value={m.model}>
                    {m.model}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-couleur`}>Couleur *</Label>
          <Input
            id={`${prefix}-couleur`}
            value={formData.couleur}
            onChange={(e) => setFormData((p) => ({ ...p, couleur: e.target.value }))}
            placeholder="Ex: Blanc"
            className="rounded-lg"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-immat`}>Immatriculation</Label>
          <Input
            id={`${prefix}-immat`}
            value={formData.immatriculation}
            onChange={(e) => setFormData((p) => ({ ...p, immatriculation: e.target.value }))}
            placeholder="AB-123-CD"
            className="rounded-lg"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-chassis`}>N° de châssis</Label>
        <Input
          id={`${prefix}-chassis`}
          value={formData.chassisNumber}
          onChange={(e) => setFormData((p) => ({ ...p, chassisNumber: e.target.value }))}
          placeholder="VIN / châssis"
          className="rounded-lg"
        />
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2">
            <span className="text-2xl font-bold text-rose-700">{items.length}</span>
            <span className="ml-1 text-sm text-rose-600">véhicule(s)</span>
          </div>
        </div>
        <Button
          onClick={handleOpenAdd}
          size="default"
          className="h-11 w-full rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-5 shadow-md shadow-rose-500/20 hover:from-rose-700 hover:to-pink-700 sm:h-10 sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter Voiture en Garantie
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
            <p className="text-slate-500">Chargement des véhicules sous garantie...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100">
              <ShieldCheck className="h-10 w-10 text-rose-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Aucun véhicule sous garantie</h3>
            <p className="mx-auto mb-6 max-w-sm text-slate-500">
              Ajoutez les véhicules couverts par la garantie constructeur
            </p>
            <Button onClick={handleOpenAdd} size="lg" className="bg-rose-600 hover:bg-rose-700">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter Voiture en Garantie
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2.5 p-2 md:hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {item.marqueVoiture} {item.modelVoiture}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">{item.couleur}</p>
                      <p className="mt-1 truncate font-mono text-xs text-slate-500">
                        {item.immatriculation || item.chassisNumber || "Sans immat. / châssis"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleOpenDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/80 hover:bg-slate-50">
                    <TableHead className="py-4 font-semibold text-slate-700">Marque</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-700">Modèle</TableHead>
                    <TableHead className="py-4 font-semibold text-slate-700">Couleur</TableHead>
                    <TableHead className="hidden py-4 font-semibold text-slate-700 md:table-cell">
                      Immatriculation
                    </TableHead>
                    <TableHead className="hidden py-4 font-semibold text-slate-700 lg:table-cell">
                      Châssis
                    </TableHead>
                    <TableHead className="w-28 py-4 text-right font-semibold text-slate-700">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow
                      key={item.id}
                      className={`border-b border-slate-100 transition-colors hover:bg-rose-50/30 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                      }`}
                    >
                      <TableCell className="py-3 font-medium text-slate-900">
                        {item.marqueVoiture}
                      </TableCell>
                      <TableCell className="py-3 text-slate-800">{item.modelVoiture}</TableCell>
                      <TableCell className="py-3 text-slate-600">{item.couleur}</TableCell>
                      <TableCell className="hidden py-3 text-slate-600 md:table-cell">
                        {item.immatriculation || "—"}
                      </TableCell>
                      <TableCell className="hidden py-3 font-mono text-xs text-slate-600 lg:table-cell">
                        {item.chassisNumber || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-600 hover:bg-rose-100/80 hover:text-rose-600"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-600 hover:bg-red-100/80 hover:text-red-600"
                            onClick={() => handleOpenDelete(item)}
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
          </>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl shadow-slate-300/50">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-100 p-2.5">
                <Plus className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Ajouter Voiture en Garantie</DialogTitle>
                <DialogDescription>
                  Renseignez les informations du véhicule couvert par la garantie
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("add")}</div>
          <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={isSubmitting}
              className="rounded-lg bg-rose-600 px-6 hover:bg-rose-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl shadow-slate-300/50">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-pink-100 p-2.5">
                <Edit className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Modifier la voiture en garantie</DialogTitle>
                <DialogDescription>Mettez à jour les informations du véhicule</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("edit")}</div>
          <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={isSubmitting}
              className="rounded-lg bg-rose-600 px-6 hover:bg-rose-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-0 shadow-2xl shadow-slate-300/50">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2.5">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Supprimer la voiture en garantie</DialogTitle>
                <DialogDescription>
                  {itemToDelete && (
                    <>
                      Êtes-vous sûr de vouloir supprimer{" "}
                      <strong>
                        {itemToDelete.marqueVoiture} {itemToDelete.modelVoiture}
                      </strong>{" "}
                      ? Cette action est irréversible.
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-lg"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-lg bg-red-600 px-6 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
