"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Car, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientSAV {
  id: string;
  nom: string;
  prenom: string;
  contact: string;
}

interface VoitureSavGarantie {
  id: string;
  chassisNumber?: string | null;
  garantieSAVbadge?: boolean;
}

type StatutGarantieSAV =
  | "EN_COURS"
  | "FIN_INTERVENTION_GARANTIESAV_EN_COURS"
  | "GARANTIESAV_EN_COURS"
  | "GARANTIESAV_TERMINE"
  | "PAS_DE_GARANTIE";

interface VoitureSAV {
  id: string;
  model: string;
  motorisation: string;
  transmission: string;
  couleur: string;
  nbr_portes: string;
  immatriculation: string;
  chassisNumber?: string | null;
  clientSAVId: string;
  ClientSAV?: ClientSAV;
  VoitureSavGarantie?: VoitureSavGarantie | null;
  sousGarantie?: boolean;
  StatutGarantie?: StatutGarantieSAV | string | null;
  createdAt: string;
}

const emptyForm = {
  model: "",
  motorisation: "",
  transmission: "",
  couleur: "",
  nbr_portes: "",
  immatriculation: "",
  chassisNumber: "",
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

function chassisKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

function hasGarantie(v: VoitureSAV) {
  if (v.StatutGarantie === "PAS_DE_GARANTIE") return false;
  if (typeof v.sousGarantie === "boolean") return v.sousGarantie;
  return Boolean(v.VoitureSavGarantie && v.VoitureSavGarantie.garantieSAVbadge !== false);
}

function statutGarantieFromChassisMatch(matched: VoitureSavGarantie | null): StatutGarantieSAV {
  return matched ? "EN_COURS" : "PAS_DE_GARANTIE";
}

function GarantieBadge({
  covered,
  compact = false,
}: {
  covered: boolean;
  compact?: boolean;
}) {
  if (covered) {
    return (
      <Badge
        className={cn(
          "shrink-0 rounded-full bg-rose-50 font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-50",
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
        )}
      >
        <ShieldCheck className={cn("mr-1", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        Garantie
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        "max-w-[11.5rem] shrink-0 whitespace-normal rounded-full bg-slate-100 text-left font-semibold leading-tight text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      )}
    >
      <ShieldAlert className={cn("mr-1 shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
      Pas de garantie sur cette voiture
    </Badge>
  );
}

async function fetchVoitures() {
  const res = await fetch("/api/sav/voiture-sav");
  return res.json();
}

async function fetchClients() {
  const res = await fetch("/api/sav/client-sav");
  return res.json();
}

async function fetchGaranties() {
  const res = await fetch("/api/sav/voiture-sav-garantie");
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
  const [garanties, setGaranties] = useState<VoitureSavGarantie[]>([]);
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
      const [voitRes, clientRes, garantieRes] = await Promise.all([
        fetchVoitures(),
        fetchClients(),
        fetchGaranties(),
      ]);
      if (voitRes.success && voitRes.data) setVoitures(voitRes.data);
      else toast.error(voitRes.error || "Erreur chargement véhicules");
      if (clientRes.success && clientRes.data) setClients(clientRes.data);
      if (garantieRes.success && garantieRes.data) setGaranties(garantieRes.data);
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

  const matchedGarantie = useMemo(() => {
    const key = chassisKey(formData.chassisNumber);
    if (!key) return null;
    return (
      garanties.find(
        (g) => chassisKey(g.chassisNumber) === key && g.garantieSAVbadge !== false
      ) ?? null
    );
  }, [formData.chassisNumber, garanties]);

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
      chassisNumber: v.chassisNumber || "",
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
      !formData.chassisNumber.trim() ||
      !formData.clientSAVId
    ) {
      toast.error("Tous les champs obligatoires doivent être renseignés");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createVoitureSAV({
        ...formData,
        StatutGarantie: statutGarantieFromChassisMatch(matchedGarantie),
      });
      if (result.success) {
        toast.success(
          result.data?.StatutGarantie === "PAS_DE_GARANTIE" || !result.data?.sousGarantie
            ? "Véhicule ajouté — pas de garantie sur cette voiture"
            : "Véhicule ajouté — châssis sous garantie"
        );
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
      !formData.chassisNumber.trim() ||
      !formData.clientSAVId
    ) {
      toast.error("Tous les champs obligatoires doivent être renseignés");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateVoitureSAV(editingVoiture.id, {
        ...formData,
        ...(matchedGarantie ? {} : { StatutGarantie: "PAS_DE_GARANTIE" as const }),
      });
      if (result.success) {
        toast.success(
          result.data?.StatutGarantie === "PAS_DE_GARANTIE" || !result.data?.sousGarantie
            ? "Véhicule modifié — pas de garantie sur cette voiture"
            : "Véhicule modifié — châssis sous garantie"
        );
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
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${prefix}-chassisNumber`}>Numéro de châssis *</Label>
          {formData.chassisNumber.trim() ? (
            <GarantieBadge covered={Boolean(matchedGarantie)} compact />
          ) : null}
        </div>
        <Input
          id={`${prefix}-chassisNumber`}
          value={formData.chassisNumber}
          onChange={(e) =>
            setFormData((p) => ({ ...p, chassisNumber: e.target.value.toUpperCase() }))
          }
          placeholder="VF3XXXXXXXXXXXXXX"
          className="rounded-lg font-mono uppercase tracking-wide"
          required
          autoComplete="off"
        />
        {formData.chassisNumber.trim() ? (
          matchedGarantie ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Ce châssis est enregistré sous garantie
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <ShieldAlert className="h-3.5 w-3.5" />
              Pas de garantie sur cette voiture
            </p>
          )
        ) : (
          <p className="text-xs text-slate-500">
            Le n° de châssis détermine automatiquement le badge Garantie.
          </p>
        )}
      </div>
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
      <div className={embedded ? "mb-4 flex justify-end sm:mb-6" : "mb-6 flex items-center justify-between"}>
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
          className="h-11 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 sm:h-10 sm:w-auto"
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
          <>
          <div className="space-y-2.5 p-2 md:hidden">
            {voitures.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Car className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{v.model}</p>
                    <p className="mt-0.5 font-mono text-sm text-slate-600">
                      {v.immatriculation || "—"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {v.chassisNumber || "Sans n° de châssis"}
                    </p>
                    <div className="mt-2">
                      <GarantieBadge covered={hasGarantie(v)} compact />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {[
                        MOTORISATIONS.find((m) => m.value === v.motorisation)?.label ?? v.motorisation,
                        TRANSMISSIONS.find((t) => t.value === v.transmission)?.label ?? v.transmission,
                        v.ClientSAV ? `${v.ClientSAV.prenom} ${v.ClientSAV.nom}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => handleOpenEdit(v)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleOpenDelete(v)}
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
                  <TableHead className="font-semibold text-slate-700 py-4">Modèle</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Immatriculation</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 hidden md:table-cell">Châssis</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4">Garantie</TableHead>
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
                    <TableCell className="font-mono text-slate-600 py-3 hidden md:table-cell">
                      {v.chassisNumber || "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      <GarantieBadge covered={hasGarantie(v)} compact />
                    </TableCell>
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
          </>
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
