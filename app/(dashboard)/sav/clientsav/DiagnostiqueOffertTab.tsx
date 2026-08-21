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
import { Gift, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoitureLink {
  id: string;
  model: string;
  immatriculation?: string | null;
  chassisNumber?: string | null;
}

interface DiagnosticOffert {
  id: string;
  libelle: string;
  date_activation: string;
  date_fin: string;
  voitureSAVId?: string | null;
  voitureSAV?: VoitureLink | null;
  createdAt: string;
}

const NONE = "__none__";

const emptyForm = {
  libelle: "",
  date_activation: "",
  date_fin: "",
  voitureSAVId: "",
};

function toDateInput(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateFr(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

function vehicleLabel(v: VoitureLink): string {
  const plate = v.immatriculation || v.chassisNumber;
  return plate ? `${v.model} · ${plate}` : v.model;
}

async function fetchOfferts() {
  const res = await fetch("/api/sav/diagnostic-offert");
  return res.json();
}

async function fetchVoitures() {
  const res = await fetch("/api/sav/voiture-sav");
  return res.json();
}

async function createOffert(data: Record<string, string>) {
  const res = await fetch("/api/sav/diagnostic-offert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function updateOffert(id: string, data: Record<string, string>) {
  const res = await fetch(`/api/sav/diagnostic-offert/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function deleteOffert(id: string) {
  const res = await fetch(`/api/sav/diagnostic-offert/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

export default function DiagnostiqueOffertTab({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<DiagnosticOffert[]>([]);
  const [voitures, setVoitures] = useState<VoitureLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DiagnosticOffert | null>(null);
  const [editingItem, setEditingItem] = useState<DiagnosticOffert | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [offertRes, voitureRes] = await Promise.all([fetchOfferts(), fetchVoitures()]);
      if (offertRes.success && offertRes.data) setItems(offertRes.data);
      else toast.error(offertRes.error || "Erreur lors du chargement");
      if (voitureRes.success && voitureRes.data) setVoitures(voitureRes.data);
    } catch (error) {
      console.error("Error fetching diagnostiques offerts:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const payload = () => ({
    libelle: formData.libelle.trim(),
    date_activation: formData.date_activation,
    date_fin: formData.date_fin,
    voitureSAVId: formData.voitureSAVId,
  });

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setAddDialogOpen(true);
  };

  const handleOpenEdit = (item: DiagnosticOffert) => {
    setEditingItem(item);
    setFormData({
      libelle: item.libelle,
      date_activation: toDateInput(item.date_activation),
      date_fin: toDateInput(item.date_fin),
      voitureSAVId: item.voitureSAVId || "",
    });
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (item: DiagnosticOffert) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (!formData.libelle.trim() || !formData.date_activation || !formData.date_fin) {
      toast.error("Libellé, date d'activation et date de fin sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createOffert(payload());
      if (result.success) {
        toast.success("Diagnostique offert ajouté");
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
    if (!editingItem || !formData.libelle.trim() || !formData.date_activation || !formData.date_fin) {
      toast.error("Libellé, date d'activation et date de fin sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateOffert(editingItem.id, payload());
      if (result.success) {
        toast.success("Diagnostique offert modifié");
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
      const result = await deleteOffert(itemToDelete.id);
      if (result.success) {
        toast.success("Diagnostique offert supprimé");
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la suppression");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  const renderForm = (prefix: string) => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-libelle`}>Libellé *</Label>
        <Input
          id={`${prefix}-libelle`}
          value={formData.libelle}
          onChange={(e) => setFormData((p) => ({ ...p, libelle: e.target.value }))}
          placeholder="Ex: Diagnostic moteur offert"
          className="rounded-lg"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-date-activation`}>Date d&apos;activation *</Label>
          <Input
            id={`${prefix}-date-activation`}
            type="date"
            value={formData.date_activation}
            onChange={(e) => setFormData((p) => ({ ...p, date_activation: e.target.value }))}
            className="rounded-lg"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-date-fin`}>Date de fin *</Label>
          <Input
            id={`${prefix}-date-fin`}
            type="date"
            value={formData.date_fin}
            onChange={(e) => setFormData((p) => ({ ...p, date_fin: e.target.value }))}
            className="rounded-lg"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Véhicule SAV (optionnel)</Label>
        <Select
          value={formData.voitureSAVId || NONE}
          onValueChange={(v) =>
            setFormData((p) => ({ ...p, voitureSAVId: v === NONE ? "" : v }))
          }
        >
          <SelectTrigger className="rounded-lg">
            <SelectValue placeholder="Aucun véhicule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Aucun véhicule</SelectItem>
            {voitures.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {vehicleLabel(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div>
      <div className={embedded ? "mb-4 flex justify-end sm:mb-6" : "mb-6 flex items-center justify-between"}>
        {!embedded && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2">
              <span className="text-2xl font-bold text-amber-700">{items.length}</span>
              <span className="ml-1 text-sm text-amber-600">offre(s)</span>
            </div>
          </div>
        )}
        <Button
          onClick={handleOpenAdd}
          size="default"
          className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 shadow-md shadow-amber-500/20 hover:from-amber-700 hover:to-orange-700 sm:h-10 sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter Diagnostique Offert
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
            <p className="text-slate-500">Chargement des diagnostiques offerts...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-6">
              <Gift className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Aucun diagnostique offert</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Ajoutez une offre de diagnostic avec ses dates d&apos;activation et de fin
            </p>
            <Button onClick={handleOpenAdd} size="lg" className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Diagnostique Offert
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{item.libelle}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDateFr(item.date_activation)} → {formatDateFr(item.date_fin)}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.voitureSAV ? vehicleLabel(item.voitureSAV) : "Aucun véhicule lié"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-700"
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
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b-2 border-slate-200 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 py-4">Libellé</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Activation</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Fin</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden md:table-cell">Véhicule</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-right w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow
                    key={item.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-amber-50/30 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    <TableCell className="font-medium text-slate-900 py-3">{item.libelle}</TableCell>
                    <TableCell className="text-slate-600 py-3">{formatDateFr(item.date_activation)}</TableCell>
                    <TableCell className="text-slate-600 py-3">{formatDateFr(item.date_fin)}</TableCell>
                    <TableCell className="text-slate-600 py-3 hidden md:table-cell">
                      {item.voitureSAV ? vehicleLabel(item.voitureSAV) : "—"}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-600 hover:text-amber-600 hover:bg-amber-100/80 rounded-lg"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-600 hover:text-red-600 hover:bg-red-100/80 rounded-lg"
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
        <DialogContent className="max-w-lg border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100">
                <Plus className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nouveau diagnostique offert</DialogTitle>
                <DialogDescription>Définir le libellé et la période de validité de l&apos;offre</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("add")}</div>
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button onClick={handleSubmitAdd} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 rounded-lg px-6">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
        <DialogContent className="max-w-lg border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-100">
                <Edit className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Modifier le diagnostique offert</DialogTitle>
                <DialogDescription>Mettez à jour le libellé, les dates ou le véhicule associé</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("edit")}</div>
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 rounded-lg px-6">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
        <DialogContent className="max-w-md border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Supprimer le diagnostique offert</DialogTitle>
                <DialogDescription>
                  {itemToDelete && (
                    <>
                      Êtes-vous sûr de vouloir supprimer{" "}
                      <strong>{itemToDelete.libelle}</strong> ? Cette action est irréversible.
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="rounded-lg px-6 bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
