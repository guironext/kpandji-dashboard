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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Car,
  User,
  Hash,
  Palette,
  ShieldCheck,
  ShieldAlert,
  ScanLine,
  Zap,
  Fuel,
  Droplets,
  Leaf,
  Cog,
  Gauge,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientSAV {
  id: string;
  nom: string;
  prenom: string;
  contact: string;
}

type StatutVoitureSAV =
  | "ARRIVE"
  | "DIAGNOSTIC_FINI"
  | "PREPARATION_FINI"
  | "DISPATCHE"
  | "FIN_INTERVENTION_GARANTIESAV_EN_COURS"
  | "GARANTIESAV_EN_COURS"
  | "GARANTIESAV_TERMINE"
  | "EN_TRAITEMENT"
  | "TESTE"
  | "TERMINE"
  | "ANNULE";

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
  statut: StatutVoitureSAV;
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
  { value: "ELECTRIQUE", label: "Électrique", icon: Zap },
  { value: "ESSENCE", label: "Essence", icon: Fuel },
  { value: "DIESEL", label: "Diesel", icon: Droplets },
  { value: "HYBRIDE", label: "Hybride", icon: Leaf },
];

const TRANSMISSIONS = [
  { value: "AUTOMATIQUE", label: "Automatique", icon: Cog },
  { value: "MANUEL", label: "Manuel", icon: Gauge },
];

const DOOR_OPTIONS = ["2", "3", "4", "5"];

const STATUT_ORDER: StatutVoitureSAV[] = [
  "ARRIVE",
  "DIAGNOSTIC_FINI",
  "PREPARATION_FINI",
  "DISPATCHE",
  "FIN_INTERVENTION_GARANTIESAV_EN_COURS",
  "GARANTIESAV_EN_COURS",
  "GARANTIESAV_TERMINE",
  "EN_TRAITEMENT",
  "TESTE",
  "TERMINE",
  "ANNULE",
];

const STATUT_LABELS: Record<StatutVoitureSAV, string> = {
  ARRIVE: "Arrivée",
  DIAGNOSTIC_FINI: "Diagnostic fini",
  PREPARATION_FINI: "Préparation finie",
  DISPATCHE: "Dispatchée",
  FIN_INTERVENTION_GARANTIESAV_EN_COURS: "Fin intervention garantie",
  GARANTIESAV_EN_COURS: "Garantie en cours",
  GARANTIESAV_TERMINE: "Garantie terminée",
  EN_TRAITEMENT: "En traitement",
  TESTE: "Testée",
  TERMINE: "Terminée",
  ANNULE: "Annulée",
};

const STATUT_BADGE_CLASS: Record<StatutVoitureSAV, string> = {
  ARRIVE: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
  DIAGNOSTIC_FINI: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  PREPARATION_FINI: "bg-lime-50 text-lime-800 ring-1 ring-lime-200",
  DISPATCHE: "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",
  FIN_INTERVENTION_GARANTIESAV_EN_COURS: "bg-pink-50 text-pink-800 ring-1 ring-pink-200",
  GARANTIESAV_EN_COURS: "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
  GARANTIESAV_TERMINE: "bg-fuchsia-50 text-fuchsia-800 ring-1 ring-fuchsia-200",
  EN_TRAITEMENT: "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
  TESTE: "bg-teal-50 text-teal-800 ring-1 ring-teal-200",
  TERMINE: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  ANNULE: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

function hasGarantie(v: VoitureSAV) {
  if (v.StatutGarantie === "PAS_DE_GARANTIE") return false;
  if (typeof v.sousGarantie === "boolean") return v.sousGarantie;
  return Boolean(v.VoitureSavGarantie && v.VoitureSavGarantie.garantieSAVbadge !== false);
}

function statutGarantieFromChassisMatch(matched: VoitureSavGarantie | null): StatutGarantieSAV {
  return matched ? "EN_COURS" : "PAS_DE_GARANTIE";
}

function chassisKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
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

function ChoiceChip({
  selected,
  onClick,
  icon: Icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition touch-manipulation",
        selected
          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/25"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="truncate">{label}</span>
      {selected ? <Check className="h-3 w-3 shrink-0 text-emerald-600" /> : null}
    </button>
  );
}

function statutIndex(statut: string) {
  const i = STATUT_ORDER.indexOf(statut as StatutVoitureSAV);
  return i === -1 ? STATUT_ORDER.length : i;
}

function statutLabel(statut: string) {
  return STATUT_LABELS[statut as StatutVoitureSAV] ?? statut;
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

  const groupedVoitures = useMemo(() => {
    const sorted = [...voitures].sort((a, b) => {
      const byStatut = statutIndex(a.statut) - statutIndex(b.statut);
      if (byStatut !== 0) return byStatut;
      return (a.model || "").localeCompare(b.model || "", "fr");
    });

    const groups: { statut: StatutVoitureSAV | string; items: VoitureSAV[] }[] = [];
    for (const v of sorted) {
      const statut = v.statut || "ARRIVE";
      const last = groups[groups.length - 1];
      if (last && last.statut === statut) last.items.push(v);
      else groups.push({ statut, items: [v] });
    }
    return groups;
  }, [voitures]);

  const matchedGarantie = useMemo(() => {
    const key = chassisKey(formData.chassisNumber);
    if (!key) return null;
    return (
      garanties.find(
        (g) => chassisKey(g.chassisNumber) === key && g.garantieSAVbadge !== false
      ) ?? null
    );
  }, [formData.chassisNumber, garanties]);

  const selectedClient = clients.find((c) => c.id === formData.clientSAVId);
  const formFilledCount = [
    formData.chassisNumber,
    formData.immatriculation,
    formData.model,
    formData.motorisation,
    formData.transmission,
    formData.couleur,
    formData.nbr_portes,
    formData.clientSAVId,
  ].filter((v) => v.trim()).length;
  const formComplete = formFilledCount === 8;

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
        ...(matchedGarantie
          ? {}
          : { StatutGarantie: "PAS_DE_GARANTIE" as const }),
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
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
            <Car className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-slate-900">
              {formData.model.trim() || "Nouveau véhicule SAV"}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
              {formData.immatriculation.trim() || "Immatriculation"}
              <span className="mx-1.5 text-slate-300">·</span>
              {formData.chassisNumber.trim() || "N° de châssis"}
            </p>
          </div>
          {formData.chassisNumber.trim() ? (
            <GarantieBadge covered={Boolean(matchedGarantie)} />
          ) : null}
        </div>
        {(formData.motorisation || formData.transmission || selectedClient) && (
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-2.5 text-[11px] font-medium text-slate-500">
            {formData.motorisation ? (
              <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
                {MOTORISATIONS.find((m) => m.value === formData.motorisation)?.label}
              </span>
            ) : null}
            {formData.transmission ? (
              <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
                {TRANSMISSIONS.find((t) => t.value === formData.transmission)?.label}
              </span>
            ) : null}
            {formData.couleur ? (
              <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">{formData.couleur}</span>
            ) : null}
            {formData.nbr_portes ? (
              <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
                {formData.nbr_portes} portes
              </span>
            ) : null}
            {selectedClient ? (
              <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
                {selectedClient.prenom} {selectedClient.nom}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ScanLine className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-slate-800">Identification</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-chassisNumber`} className="text-slate-700">
            Numéro de châssis *
          </Label>
          <Input
            id={`${prefix}-chassisNumber`}
            value={formData.chassisNumber}
            onChange={(e) => setFormData((p) => ({ ...p, chassisNumber: e.target.value.toUpperCase() }))}
            placeholder="VF3XXXXXXXXXXXXXX"
            className="h-12 rounded-xl border-slate-200 font-mono text-[15px] uppercase tracking-wide"
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
              Saisi en premier : il détermine automatiquement le badge Garantie.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-immatriculation`} className="text-slate-700">
            Immatriculation *
          </Label>
          <Input
            id={`${prefix}-immatriculation`}
            value={formData.immatriculation}
            onChange={(e) => setFormData((p) => ({ ...p, immatriculation: e.target.value.toUpperCase() }))}
            placeholder="AB-123-CD"
            className="h-12 rounded-xl border-slate-200 font-mono text-[15px] uppercase tracking-wide"
            required
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Car className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-slate-800">Véhicule</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-model`} className="text-slate-700">
            Modèle *
          </Label>
          <Input
            id={`${prefix}-model`}
            value={formData.model}
            onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
            placeholder="Ex: Kpandji Urban"
            className="h-12 rounded-xl border-slate-200"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700">Motorisation *</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MOTORISATIONS.map((m) => (
              <ChoiceChip
                key={m.value}
                selected={formData.motorisation === m.value}
                onClick={() => setFormData((p) => ({ ...p, motorisation: m.value }))}
                icon={m.icon}
                label={m.label}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-700">Transmission *</Label>
          <div className="grid grid-cols-2 gap-2">
            {TRANSMISSIONS.map((t) => (
              <ChoiceChip
                key={t.value}
                selected={formData.transmission === t.value}
                onClick={() => setFormData((p) => ({ ...p, transmission: t.value }))}
                icon={t.icon}
                label={t.label}
              />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-couleur`} className="text-slate-700">
              Couleur *
            </Label>
            <div className="relative">
              <Palette className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id={`${prefix}-couleur`}
                value={formData.couleur}
                onChange={(e) => setFormData((p) => ({ ...p, couleur: e.target.value }))}
                placeholder="Ex: Blanc"
                className="h-12 rounded-xl border-slate-200 pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">Portes *</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {DOOR_OPTIONS.map((n) => (
                <ChoiceChip
                  key={n}
                  selected={formData.nbr_portes === n}
                  onClick={() => setFormData((p) => ({ ...p, nbr_portes: n }))}
                  label={n}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <User className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold text-slate-800">Client SAV</h3>
        </div>
        <Select
          value={formData.clientSAVId}
          onValueChange={(v) => setFormData((p) => ({ ...p, clientSAVId: v }))}
        >
          <SelectTrigger className="h-12 rounded-xl border-slate-200">
            <SelectValue placeholder="Sélectionner un client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.prenom} {c.nom}
                {c.contact ? ` · ${c.contact}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clients.length === 0 && (
          <p className="text-xs text-amber-600">Ajoutez d&apos;abord un client dans l&apos;onglet Clients.</p>
        )}
      </section>
    </div>
  );

  return (
    <div>
      <div className={embedded ? "mb-3 flex justify-end sm:mb-5" : "mb-6 flex items-center justify-between"}>
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
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 sm:ml-auto sm:h-11 sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          
        </Button>
      </div>

      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white py-20 shadow-sm ring-1 ring-slate-200/80">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-slate-500">Chargement des véhicules...</p>
          </div>
        ) : voitures.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200/80 sm:py-24">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
              <Car className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">Aucun véhicule enregistré</h3>
            <p className="mx-auto mb-6 max-w-sm text-slate-500">
              Ajoutez votre premier véhicule SAV pour gérer les dossiers
            </p>
            <Button onClick={handleOpenAdd} size="lg" className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedVoitures.map((group) => (
              <section key={String(group.statut)} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <Badge
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold hover:bg-inherit",
                      STATUT_BADGE_CLASS[group.statut as StatutVoitureSAV] ??
                        "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                    )}
                  >
                    {statutLabel(String(group.statut))}
                  </Badge>
                  <span className="text-xs font-medium tabular-nums text-slate-400">
                    {group.items.length} véhicule{group.items.length > 1 ? "s" : ""}
                  </span>
                  <span className="h-px flex-1 bg-slate-200/80" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((v) => {
                    const motorLabel =
                      MOTORISATIONS.find((m) => m.value === v.motorisation)?.label ?? v.motorisation;
                    const transLabel =
                      TRANSMISSIONS.find((t) => t.value === v.transmission)?.label ?? v.transmission;
                    const clientName = v.ClientSAV
                      ? `${v.ClientSAV.prenom} ${v.ClientSAV.nom}`
                      : "Client non renseigné";

                    const sousGarantie = hasGarantie(v);

                    return (
                      <Card
                        key={v.id}
                        className="gap-0 overflow-hidden rounded-2xl border-slate-200/90 py-0 shadow-sm ring-1 ring-black/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/10"
                      >
                        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3.5">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                              <Car className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="truncate text-[15px] font-bold leading-tight text-slate-900">
                                {v.model}
                              </CardTitle>
                              <p className="mt-1 flex items-center gap-1 font-mono text-xs font-semibold tracking-wide text-slate-600">
                                <Hash className="h-3 w-3 text-slate-400" />
                                {v.immatriculation || "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <Badge
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-inherit",
                                STATUT_BADGE_CLASS[v.statut] ??
                                  "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              )}
                            >
                              {statutLabel(v.statut)}
                            </Badge>
                            <GarantieBadge covered={sousGarantie} compact />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 px-4 py-3.5">
                          <p className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Hash className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="min-w-0 truncate">
                              <span className="mr-1 text-xs font-medium text-slate-400">Châssis</span>
                              <span className="font-mono">{v.chassisNumber || "—"}</span>
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5 text-sm text-slate-600">
                            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{clientName}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Palette className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {v.couleur}
                              {v.nbr_portes ? ` · ${v.nbr_portes} portes` : ""}
                            </span>
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {[motorLabel, transLabel].filter(Boolean).join(" · ")}
                          </p>
                        </CardContent>
                        <CardFooter className="justify-end gap-1 border-t border-slate-100 px-2 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleOpenEdit(v)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleOpenDelete(v)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="flex max-h-[min(92vh,840px)] w-full flex-col gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl shadow-slate-400/20 sm:max-w-2xl [&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/15 [&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-90 [&_[data-slot=dialog-close]]:hover:bg-white/25 [&_[data-slot=dialog-close]]:hover:opacity-100">
          <DialogHeader className="relative shrink-0 space-y-1 border-b border-emerald-500/10 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pb-5 pt-6 pr-14 text-left">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
              <Plus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
              Nouvelle voiture SAV
            </DialogTitle>
            <DialogDescription className="text-sm text-emerald-50/85">
              Identifiez le véhicule, puis rattachez-le à un client.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{renderForm("add")}</div>
          <DialogFooter className="shrink-0 gap-3 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:items-center sm:justify-between">
            <p className="hidden text-xs font-medium tabular-nums text-slate-400 sm:block">
              {formFilledCount}/8 champs renseignés
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="h-11 flex-1 rounded-xl sm:flex-none"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitAdd}
                disabled={isSubmitting || !formComplete}
                className="h-11 flex-1 rounded-xl bg-emerald-600 px-6 shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="flex max-h-[min(92vh,840px)] w-full flex-col gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl shadow-slate-400/20 sm:max-w-2xl [&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/15 [&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-90 [&_[data-slot=dialog-close]]:hover:bg-white/25 [&_[data-slot=dialog-close]]:hover:opacity-100">
          <DialogHeader className="relative shrink-0 space-y-1 border-b border-teal-500/10 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 px-6 pb-5 pt-6 pr-14 text-left">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
              <Edit className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
              Modifier le véhicule
            </DialogTitle>
            <DialogDescription className="text-sm text-emerald-50/85">
              Mettez à jour l’identité et les caractéristiques du dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{renderForm("edit")}</div>
          <DialogFooter className="shrink-0 gap-3 border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:items-center sm:justify-between">
            <p className="hidden text-xs font-medium tabular-nums text-slate-400 sm:block">
              {formFilledCount}/8 champs renseignés
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="h-11 flex-1 rounded-xl sm:flex-none"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitEdit}
                disabled={isSubmitting || !formComplete}
                className="h-11 flex-1 rounded-xl bg-emerald-600 px-6 shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
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
