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
import { Plus, Edit, Trash2, Loader2, Car } from "lucide-react";
import { toast } from "sonner";

interface ClientSAV {
  id: string;
  nom: string;
  prenom: string;
  contact: string;
}

interface VoitureSAV {
  id: string;
  model: string;
  motorisation: string;
  transmission: string;
  couleur: string;
  nbr_portes: string;
  immatriculation: string;
  clientSAVId: string;
  ClientSAV?: ClientSAV;
  createdAt: string;
}

const emptyForm = {
  model: "",
  motorisation: "",
  transmission: "",
  couleur: "",
  nbr_portes: "",
  immatriculation: "",
  clientSAVId: "",
};

const MOTORISATIONS = [
  { value: "ELECTRIQUE", label: "Électrique" },
  { value: "ESSENCE", label: "Essence" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRIDE", label: "Hybride" },
];

const TRANSMISSIONS = [
  { value: "AUTOMATIQUE", label: "Automatique" },
  { value: "MANUEL", label: "Manuel" },
];

async function fetchVoitures() {
  const res = await fetch("/api/sav/voiture-sav");
  return res.json();
}

async function fetchClients() {
  const res = await fetch("/api/sav/client-sav");
  return res.json();
}

async function createVoitureSAV(data: Record<string, string>) {
  const res = await fetch("/api/sav/voiture-sav", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function updateVoitureSAV(id: string, data: Record<string, string>) {
  const res = await fetch(`/api/sav/voiture-sav/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

async function deleteVoitureSAV(id: string) {
  const res = await fetch(`/api/sav/voiture-sav/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
  return json;
}

export default function VoitureSAVTab({ embedded = false }: { embedded?: boolean }) {
  const [voitures, setVoitures] = useState<VoitureSAV[]>([]);
  const [clients, setClients] = useState<ClientSAV[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voitureToDelete, setVoitureToDelete] = useState<VoitureSAV | null>(null);
  const [editingVoiture, setEditingVoiture] = useState<VoitureSAV | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [voitRes, clientRes] = await Promise.all([
        fetchVoitures(),
        fetchClients(),
      ]);
      if (voitRes.success && voitRes.data) setVoitures(voitRes.data);
      else toast.error(voitRes.error || "Erreur chargement véhicules");
      if (clientRes.success && clientRes.data) setClients(clientRes.data);
    } catch (error) {
      console.error("Error fetching:", error);
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

  const handleOpenEdit = (v: VoitureSAV) => {
    setEditingVoiture(v);
    setFormData({
      model: v.model,
      motorisation: v.motorisation,
      transmission: v.transmission,
      couleur: v.couleur,
      nbr_portes: v.nbr_portes,
      immatriculation: v.immatriculation,
      clientSAVId: v.clientSAVId,
    });
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (v: VoitureSAV) => {
    setVoitureToDelete(v);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async () => {
    if (
      !formData.model.trim() ||
      !formData.motorisation ||
      !formData.transmission ||
      !formData.couleur.trim() ||
      !formData.nbr_portes.trim() ||
      !formData.immatriculation.trim() ||
      !formData.clientSAVId
    ) {
      toast.error("Tous les champs obligatoires doivent être renseignés");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createVoitureSAV(formData);
      if (result.success) {
        toast.success("Véhicule ajouté avec succès");
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
    if (
      !editingVoiture ||
      !formData.model.trim() ||
      !formData.motorisation ||
      !formData.transmission ||
      !formData.couleur.trim() ||
      !formData.nbr_portes.trim() ||
      !formData.immatriculation.trim() ||
      !formData.clientSAVId
    ) {
      toast.error("Tous les champs obligatoires doivent être renseignés");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateVoitureSAV(editingVoiture.id, formData);
      if (result.success) {
        toast.success("Véhicule modifié avec succès");
        setEditDialogOpen(false);
        setEditingVoiture(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la modification");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!voitureToDelete) return;
    try {
      const result = await deleteVoitureSAV(voitureToDelete.id);
      if (result.success) {
        toast.success("Véhicule supprimé avec succès");
        setDeleteDialogOpen(false);
        setVoitureToDelete(null);
        loadData();
      } else toast.error(result.error || "Erreur lors de la suppression");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  const renderForm = (prefix: string) => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-model`}>Modèle *</Label>
          <Input
            id={`${prefix}-model`}
            value={formData.model}
            onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
            placeholder="Ex: Peugeot 208"
            className="rounded-lg"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-immatriculation`}>Immatriculation *</Label>
          <Input
            id={`${prefix}-immatriculation`}
            value={formData.immatriculation}
            onChange={(e) => setFormData((p) => ({ ...p, immatriculation: e.target.value }))}
            placeholder="AB-123-CD"
            className="rounded-lg"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Motorisation *</Label>
          <Select
            value={formData.motorisation}
            onValueChange={(v) => setFormData((p) => ({ ...p, motorisation: v }))}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {MOTORISATIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Transmission *</Label>
          <Select
            value={formData.transmission}
            onValueChange={(v) => setFormData((p) => ({ ...p, transmission: v }))}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {TRANSMISSIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-couleur`}>Couleur *</Label>
          <Input
            id={`${prefix}-couleur`}
            value={formData.couleur}
            onChange={(e) => setFormData((p) => ({ ...p, couleur: e.target.value }))}
            placeholder="Ex: Bleu"
            className="rounded-lg"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-nbr_portes`}>Nombre de portes *</Label>
          <Input
            id={`${prefix}-nbr_portes`}
            value={formData.nbr_portes}
            onChange={(e) => setFormData((p) => ({ ...p, nbr_portes: e.target.value }))}
            placeholder="3, 5..."
            className="rounded-lg"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Client SAV *</Label>
        <Select
          value={formData.clientSAVId}
          onValueChange={(v) => setFormData((p) => ({ ...p, clientSAVId: v }))}
        >
          <SelectTrigger className="rounded-lg">
            <SelectValue placeholder="Sélectionner un client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.prenom} {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clients.length === 0 && (
          <p className="text-xs text-amber-600">Ajoutez d&apos;abord un client dans l&apos;onglet Client</p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className={embedded ? "mb-6 flex justify-end" : "mb-6 flex items-center justify-between"}>
        {!embedded && (
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2">
              <span className="text-2xl font-bold text-emerald-700">{voitures.length}</span>
              <span className="ml-1 text-sm text-emerald-600">véhicule(s)</span>
            </div>
          </div>
        )}
        <Button
          onClick={handleOpenAdd}
          size="default"
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter Voiture SAV
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-slate-500">Chargement des véhicules...</p>
          </div>
        ) : voitures.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6">
              <Car className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Aucun véhicule enregistré</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Ajoutez votre premier véhicule SAV pour gérer les dossiers
            </p>
            <Button onClick={handleOpenAdd} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter Voiture SAV
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b-2 border-slate-200 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700 py-4">Modèle</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Immatriculation</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden md:table-cell">Motorisation</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden md:table-cell">Transmission</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden lg:table-cell">Client</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 text-right w-28">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voitures.map((v, i) => (
                  <TableRow
                    key={v.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-emerald-50/30 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    }`}
                  >
                    <TableCell className="font-medium text-slate-900 py-3">{v.model}</TableCell>
                    <TableCell className="text-slate-700 py-3">{v.immatriculation}</TableCell>
                    <TableCell className="text-slate-600 py-3 hidden md:table-cell">
                      {MOTORISATIONS.find((m) => m.value === v.motorisation)?.label ?? v.motorisation}
                    </TableCell>
                    <TableCell className="text-slate-600 py-3 hidden md:table-cell">
                      {TRANSMISSIONS.find((t) => t.value === v.transmission)?.label ?? v.transmission}
                    </TableCell>
                    <TableCell className="text-slate-600 py-3 hidden lg:table-cell">
                      {v.ClientSAV ? `${v.ClientSAV.prenom} ${v.ClientSAV.nom}` : "—"}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-600 hover:text-emerald-600 hover:bg-emerald-100/80 rounded-lg"
                          onClick={() => handleOpenEdit(v)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-600 hover:text-red-600 hover:bg-red-100/80 rounded-lg"
                          onClick={() => handleOpenDelete(v)}
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
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <Plus className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Nouvelle voiture SAV</DialogTitle>
                <DialogDescription>Renseignez les informations du véhicule</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("add")}</div>
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button onClick={handleSubmitAdd} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-6">
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-100">
                <Edit className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Modifier le véhicule</DialogTitle>
                <DialogDescription>Mettez à jour les informations du véhicule</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-6">{renderForm("edit")}</div>
          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-lg">
              Annuler
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-6">
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md border-0 shadow-2xl shadow-slate-300/50 rounded-2xl">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Supprimer le véhicule</DialogTitle>
                <DialogDescription>
                  {voitureToDelete && (
                    <>
                      Êtes-vous sûr de vouloir supprimer{" "}
                      <strong>{voitureToDelete.model} ({voitureToDelete.immatriculation})</strong> ? Cette action est irréversible.
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
