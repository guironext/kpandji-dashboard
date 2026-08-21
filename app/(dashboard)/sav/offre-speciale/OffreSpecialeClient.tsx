"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Car,
  User,
  Plus,
  Search,
  RefreshCw,
  Palette,
  Gauge,
  Cog,
  Phone,
  BadgePercent,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ScanLine,
  ArrowRight,
  Undo2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GroupePersonnel {
  id: string;
  nom: string;
  _count?: { personnelSAVs: number };
}

interface GarantieLink {
  id: string;
  statut: string;
  groupePersonnelSAVId?: string | null;
  groupePersonnelSAV?: { id: string; nom: string } | null;
}

interface VoitureSAVRow {
  id: string;
  model: string;
  immatriculation: string | null;
  chassisNumber: string;
  couleur: string;
  motorisation: string;
  transmission: string;
  nbr_portes?: string;
  statut: string;
  createdAt?: string;
  ClientSAV?: {
    nom?: string;
    prenom?: string;
    contact?: string;
  };
  GarantieSAV?: GarantieLink[];
}

type StatusFilter = "all" | "en_cours" | "termine";

const GARANTIE_STATUTS = new Set([
  "GARANTIESAV_EN_COURS",
  "GARANTIESAV_TERMINE",
]);

const MOTORISATION_LABELS: Record<string, string> = {
  ELECTRIQUE: "Électrique",
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIQUE: "Auto",
  MANUEL: "Manuel",
};

const COLOR_HEX: Record<string, string> = {
  blanc: "#f8fafc",
  blanche: "#f8fafc",
  noir: "#0f172a",
  noire: "#0f172a",
  gris: "#94a3b8",
  grise: "#94a3b8",
  argent: "#cbd5e1",
  rouge: "#dc2626",
  bleu: "#2563eb",
  bleue: "#2563eb",
  vert: "#16a34a",
  verte: "#16a34a",
  jaune: "#eab308",
  orange: "#ea580c",
  beige: "#d6c3a8",
  marron: "#7c2d12",
  bordeaux: "#9f1239",
};

function colorHex(couleur: string) {
  return COLOR_HEX[couleur.trim().toLowerCase()] ?? "#64748b";
}

function clientLabel(v: VoitureSAVRow) {
  return (
    [v.ClientSAV?.prenom, v.ClientSAV?.nom].filter(Boolean).join(" ") ||
    "Client non renseigné"
  );
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "–";
  return parts
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function statutLabel(statut: string) {
  if (statut === "GARANTIESAV_EN_COURS") return "En cours";
  if (statut === "GARANTIESAV_TERMINE") return "Terminée";
  return statut;
}

function groupeEnCharge(v: VoitureSAVRow) {
  const active = (v.GarantieSAV ?? []).filter((g) => g.statut !== "ANNULE");
  const withGroup = active.find((g) => g.groupePersonnelSAV);
  return withGroup?.groupePersonnelSAV ?? null;
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function LicensePlate({ immat }: { immat: string }) {
  return (
    <div className="flex w-full overflow-hidden rounded-xl border-2 border-slate-800 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="flex w-10 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-rose-600 to-rose-700 text-white sm:w-11">
        <span className="text-[8px] font-black leading-none tracking-wide">
          CI
        </span>
        <span className="mt-0.5 text-[9px] font-bold leading-none">SAV</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center bg-gradient-to-b from-white to-slate-100 px-2 py-2.5 sm:py-3">
        <span className="truncate font-mono text-[15px] font-black tracking-[0.16em] text-slate-900 sm:text-lg sm:tracking-[0.2em]">
          {immat}
        </span>
      </div>
    </div>
  );
}

function VehicleCard({
  v,
  returning,
  onRetour,
  groupes,
  assigning,
  onAssignGroupe,
}: {
  v: VoitureSAVRow;
  returning: boolean;
  onRetour: (v: VoitureSAVRow) => void;
  groupes: GroupePersonnel[];
  assigning: boolean;
  onAssignGroupe: (voitureId: string, groupeId: string) => void;
}) {
  const client = clientLabel(v);
  const enCours = v.statut === "GARANTIESAV_EN_COURS";
  const hex = colorHex(v.couleur);
  const date = formatDate(v.createdAt);
  const groupe = groupeEnCharge(v);

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm",
        "ring-1 ring-black/[0.03] transition-all duration-300",
        "active:scale-[0.99] sm:hover:-translate-y-0.5 sm:hover:shadow-lg sm:hover:shadow-rose-500/10",
      )}
    >
      <span
        className="w-1.5 shrink-0 sm:w-2"
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3 p-3.5 pb-3 sm:p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-[11px] font-black text-white shadow-md shadow-rose-500/25 sm:h-12 sm:w-12 sm:text-xs">
            {initials(client)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="min-w-0 truncate text-[15px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-base">
                {v.model}
              </h2>
              <Badge
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold hover:bg-inherit",
                  enCours
                    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                )}
              >
                {enCours ? (
                  <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                {statutLabel(v.statut)}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600 sm:text-sm">
              <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{client}</span>
            </p>
            {v.ClientSAV?.contact && (
              <a
                href={`tel:${v.ClientSAV.contact}`}
                className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 hover:underline"
              >
                <Phone className="h-3 w-3 shrink-0" />
                {v.ClientSAV.contact}
              </a>
            )}
          </div>
        </div>

        <div className="px-3.5 pb-0 sm:px-4">
          {groupe ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
                  Équipe en charge
                </p>
                <p className="truncate text-sm font-bold text-indigo-950">
                  {groupe.nom}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-2.5">
              <label
                htmlFor={`groupe-${v.id}`}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900"
              >
                <Users className="h-3.5 w-3.5" />
                Choisir l&apos;équipe en charge
              </label>
              {groupes.length === 0 ? (
                <p className="px-1 text-[11px] text-amber-800">
                  Aucun groupe. Créez-en un dans Personnel SAV.
                </p>
              ) : (
                <Select
                  disabled={assigning}
                  onValueChange={(val) => onAssignGroupe(v.id, val)}
                >
                  <SelectTrigger
                    id={`groupe-${v.id}`}
                    className="h-11 rounded-xl border-amber-200 bg-white text-sm"
                  >
                    {assigning ? (
                      <span className="flex items-center text-slate-500">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Affectation…
                      </span>
                    ) : (
                      <SelectValue placeholder="Sélectionner un groupe…" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {groupes.map((g) => {
                      const count = g._count?.personnelSAVs;
                      return (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nom}
                          {typeof count === "number"
                            ? ` · ${count} membre${count > 1 ? "s" : ""}`
                            : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <div className="mt-2.5 space-y-2 px-3.5 sm:px-4">
          {v.immatriculation ? <LicensePlate immat={v.immatriculation} /> : null}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <ScanLine className="h-3.5 w-3.5 shrink-0 text-rose-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                N° châssis
              </p>
              <p className="truncate font-mono text-[12px] font-bold tracking-wide text-slate-800 sm:text-[13px]">
                {v.chassisNumber || "—"}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="grid grid-cols-3 gap-px overflow-hidden p-0 pt-3">
          <SpecCell
            icon={<Palette className="h-3.5 w-3.5" />}
            label="Couleur"
            value={v.couleur}
            swatch={hex}
          />
          <SpecCell
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="Moteur"
            value={MOTORISATION_LABELS[v.motorisation] ?? v.motorisation}
          />
          <SpecCell
            icon={<Cog className="h-3.5 w-3.5" />}
            label="Boîte"
            value={TRANSMISSION_LABELS[v.transmission] ?? v.transmission}
          />
        </CardContent>
        {date && (
          <p className="border-t border-slate-100 px-3.5 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:px-4">
            Dossier {date}
            {v.nbr_portes ? ` · ${v.nbr_portes} portes` : ""}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3 sm:p-3.5">
          <Button
            type="button"
            variant="outline"
            disabled={returning}
            onClick={() => onRetour(v)}
            className="h-11 rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            {returning ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="mr-1.5 h-4 w-4" />
            )}
            Retour
          </Button>
          <Button
            asChild
            className="h-11 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 font-bold text-white shadow-sm shadow-rose-500/20 hover:from-rose-600 hover:to-pink-700"
          >
            <Link href={`/sav/offre-speciale/${v.id}`}>
              Procédez
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function SpecCell({
  icon,
  label,
  value,
  swatch,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  swatch?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-slate-50/80 px-2 py-2.5 text-center">
      <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </span>
      <span className="flex max-w-full items-center justify-center gap-1.5 text-[11px] font-bold capitalize leading-tight text-slate-800 sm:text-xs">
        {swatch && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: swatch }}
          />
        )}
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}

function VehiclePickerList({
  items,
  selectedId,
  onSelect,
}: {
  items: VoitureSAVRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
        Aucun véhicule disponible.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((v) => {
        const selected = selectedId === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all touch-manipulation",
              "active:scale-[0.99]",
              selected
                ? "border-rose-400 bg-rose-50 ring-2 ring-rose-500/25"
                : "border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50/40",
            )}
          >
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white",
                selected
                  ? "bg-gradient-to-br from-rose-500 to-pink-600"
                  : "bg-slate-900",
              )}
            >
              <Car className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {v.model}
              </p>
              <p className="truncate text-xs text-slate-600">{clientLabel(v)}</p>
            </div>
            <span className="shrink-0 rounded-md bg-slate-950 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-amber-400">
              {v.chassisNumber || v.immatriculation || "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex gap-3 p-4">
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="mx-4 mb-3 h-12 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid grid-cols-3 gap-px bg-slate-100">
        <div className="h-14 animate-pulse bg-slate-50" />
        <div className="h-14 animate-pulse bg-slate-50" />
        <div className="h-14 animate-pulse bg-slate-50" />
      </div>
    </div>
  );
}

export default function OffreSpecialeClient() {
  const [voitures, setVoitures] = useState<VoitureSAVRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [retourVoiture, setRetourVoiture] = useState<VoitureSAVRow | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [groupes, setGroupes] = useState<GroupePersonnel[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [voitRes, groupesRes] = await Promise.all([
        fetch("/api/sav/voiture-sav?includeGarantie=1"),
        fetch("/api/sav/groupe-personnel"),
      ]);
      const json = await voitRes.json();
      const groupesJson = await groupesRes.json();
      if (!voitRes.ok || !json.success) {
        throw new Error(json.error || "Erreur chargement des véhicules");
      }
      setVoitures((json.data || []) as VoitureSAVRow[]);
      if (groupesRes.ok && groupesJson.success) {
        setGroupes((groupesJson.data || []) as GroupePersonnel[]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enGarantie = useMemo(
    () => voitures.filter((v) => GARANTIE_STATUTS.has(v.statut)),
    [voitures],
  );

  const enCoursCount = useMemo(
    () => enGarantie.filter((v) => v.statut === "GARANTIESAV_EN_COURS").length,
    [enGarantie],
  );

  const termineCount = enGarantie.length - enCoursCount;

  const eligible = useMemo(
    () =>
      voitures.filter(
        (v) => v.statut !== "GARANTIESAV_EN_COURS" && v.statut !== "ANNULE",
      ),
    [voitures],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enGarantie.filter((v) => {
      if (statusFilter === "en_cours" && v.statut !== "GARANTIESAV_EN_COURS") {
        return false;
      }
      if (statusFilter === "termine" && v.statut !== "GARANTIESAV_TERMINE") {
        return false;
      }
      if (!q) return true;
      const client = clientLabel(v).toLowerCase();
      return (
        client.includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.immatriculation ?? "").toLowerCase().includes(q) ||
        (v.chassisNumber ?? "").toLowerCase().includes(q) ||
        (groupeEnCharge(v)?.nom ?? "").toLowerCase().includes(q) ||
        v.couleur.toLowerCase().includes(q)
      );
    });
  }, [enGarantie, query, statusFilter]);

  const filteredEligible = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter((v) => {
      const client = clientLabel(v).toLowerCase();
      return (
        client.includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.immatriculation ?? "").toLowerCase().includes(q) ||
        (v.chassisNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [eligible, addQuery]);

  const openAdd = () => {
    setSelectedId(null);
    setAddQuery("");
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setSelectedId(null);
    setAddQuery("");
  };

  const handleRetour = async () => {
    if (!retourVoiture) return;
    setReturningId(retourVoiture.id);
    try {
      const res = await fetch("/api/sav/offre-speciale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "retour",
          voitureSAVId: retourVoiture.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Retour impossible");
      }
      toast.success("Véhicule renvoyé au dispatching");
      setRetourVoiture(null);
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors du retour");
    } finally {
      setReturningId(null);
    }
  };

  const handleAssignGroupe = async (voitureId: string, groupeId: string) => {
    setAssigningId(voitureId);
    try {
      const res = await fetch("/api/sav/offre-speciale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign-groupe",
          voitureSAVId: voitureId,
          groupePersonnelSAVId: groupeId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Affectation impossible");
      }
      const groupeNom = json.data?.groupe?.nom as string | undefined;
      toast.success(
        groupeNom
          ? `Équipe « ${groupeNom} » affectée`
          : "Équipe affectée",
      );
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'affectation");
    } finally {
      setAssigningId(null);
    }
  };

  const handleAdd = async () => {
    if (!selectedId) {
      toast.error("Sélectionnez un véhicule");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sav/voiture-sav/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "GARANTIESAV_EN_COURS" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de l'ajout");
      }
      toast.success("Véhicule ajouté en garantie");
      closeAdd();
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'ajout");
    } finally {
      setSubmitting(false);
    }
  };

  const pickerSearch = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={addQuery}
        onChange={(e) => setAddQuery(e.target.value)}
        placeholder="Client, immat, modèle…"
        className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-sm focus:bg-white"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="mb-4 h-36 animate-pulse rounded-3xl bg-gradient-to-br from-slate-800 to-rose-950 sm:h-44" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.06),_transparent_50%)] pb-[max(6.5rem,calc(5.25rem+env(safe-area-inset-bottom)))] sm:pb-10">
      <div className="space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6 lg:px-6">
        <section className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-white shadow-[0_20px_50px_-18px_rgba(190,18,60,0.45)] sm:rounded-3xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-400/35 blur-3xl sm:h-72 sm:w-72"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-8 h-36 w-36 rounded-full bg-amber-400/20 blur-3xl"
            aria-hidden
          />

          <div className="relative px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-2.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-100 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  Offre spéciale
                </div>
                <h1 className="text-[1.65rem] font-black leading-[1.1] tracking-tight sm:text-3xl lg:text-[2.35rem]">
                  Véhicules en garantie
                </h1>
                <p className="max-w-lg text-xs leading-relaxed text-rose-100/75 sm:text-sm">
                  Dossiers SAV actuellement couverts par une garantie.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-md sm:min-w-[7.5rem] sm:px-4 sm:py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-rose-100/70">
                    En cours
                  </p>
                  <p className="font-mono text-2xl font-semibold tabular-nums">
                    {enCoursCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-md sm:min-w-[7.5rem] sm:px-4 sm:py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-rose-100/70">
                    Terminées
                  </p>
                  <p className="font-mono text-2xl font-semibold tabular-nums">
                    {termineCount}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="col-span-2 h-11 border border-white/20 bg-white/15 text-white hover:bg-white/25 hover:text-white sm:col-span-1 sm:h-auto sm:w-11 sm:shrink-0 sm:px-0"
                  disabled={refreshing}
                  onClick={() => void load(true)}
                >
                  <RefreshCw
                    className={cn("h-4 w-4 sm:mr-0", refreshing && "animate-spin")}
                  />
                  <span className="ml-2 sm:hidden">Actualiser</span>
                </Button>
                <Button
                  type="button"
                  onClick={openAdd}
                  className="hidden h-auto min-w-[13.5rem] rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-5 font-bold text-white shadow-lg shadow-rose-600/30 hover:from-rose-600 hover:to-pink-700 sm:inline-flex"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter Voiture en Garantie
                </Button>
              </div>
            </div>
          </div>
        </section>

        {enGarantie.length === 0 ? (
          <Card className="overflow-hidden rounded-3xl border-dashed border-slate-200 shadow-sm">
            <CardContent className="flex flex-col items-center px-5 py-14 text-center sm:py-20">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-3xl bg-rose-400/20 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 ring-1 ring-rose-500/15">
                  <BadgePercent className="h-8 w-8" />
                </div>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-800">
                Aucun véhicule en garantie
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Les dossiers au statut garantie SAV s&apos;affichent ici.
                Ajoutez un véhicule pour lancer une offre spéciale.
              </p>
              <Button
                className="mt-6 hidden h-12 rounded-2xl bg-rose-600 px-6 font-semibold hover:bg-rose-700 sm:inline-flex"
                onClick={openAdd}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter Voiture en Garantie
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="sticky top-16 z-20 -mx-3 space-y-2.5 border-b border-slate-200/60 bg-slate-50/90 px-3 py-2.5 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un véhicule…"
                    className="h-11 rounded-2xl border-slate-200 bg-white pl-10 text-sm shadow-sm"
                  />
                </div>
                <Badge
                  variant="secondary"
                  className="hidden h-11 shrink-0 rounded-2xl px-3 tabular-nums sm:inline-flex"
                >
                  {filtered.length}
                </Badge>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(
                  [
                    { id: "all", label: "Tous", count: enGarantie.length },
                    { id: "en_cours", label: "En cours", count: enCoursCount },
                    { id: "termine", label: "Terminées", count: termineCount },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setStatusFilter(chip.id)}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors touch-manipulation",
                      statusFilter === chip.id
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
                    )}
                  >
                    {chip.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[10px] tabular-nums",
                        statusFilter === chip.id
                          ? "bg-white/20"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {chip.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
                Aucun véhicule ne correspond à la recherche.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {filtered.map((v) => (
                  <VehicleCard
                    key={v.id}
                    v={v}
                    returning={returningId === v.id}
                    onRetour={setRetourVoiture}
                    groupes={groupes}
                    assigning={assigningId === v.id}
                    onAssignGroupe={handleAssignGroupe}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile thumb dock */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-100/80 bg-white/95 px-3 pt-2.5 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          onClick={openAdd}
          className="h-12 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-[15px] font-bold text-white shadow-lg shadow-rose-600/25 hover:from-rose-600 hover:to-pink-700"
        >
          <Plus className="mr-2 h-5 w-5" />
          Ajouter Voiture en Garantie
        </Button>
      </div>

      {isMobile ? (
        <Sheet open={addOpen} onOpenChange={(open) => (open ? openAdd() : closeAdd())}>
          <SheetContent
            side="bottom"
            className="flex h-[min(92dvh,720px)] flex-col gap-0 rounded-t-[1.75rem] border-slate-200 p-0"
          >
            <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-200" />
            <SheetHeader className="space-y-1 border-b border-slate-100 px-5 pb-4 pt-3 text-left">
              <SheetTitle className="text-lg font-extrabold text-slate-900">
                Ajouter Voiture en Garantie
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                Choisissez un véhicule SAV à passer en garantie.
              </SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3">
              {pickerSearch}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
                <VehiclePickerList
                  items={filteredEligible}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
            </div>
            <SheetFooter className="gap-2 border-t border-slate-100 bg-white px-4 py-3 supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                disabled={submitting || !selectedId}
                className="h-12 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 font-bold text-white"
                onClick={() => void handleAdd()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ajout…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Ajouter en garantie
                  </>
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={addOpen} onOpenChange={(open) => (open ? setAddOpen(true) : closeAdd())}>
          <DialogContent className="max-h-[min(90vh,680px)] gap-0 overflow-hidden rounded-3xl border-slate-200/80 p-0 sm:max-w-lg">
            <div className="border-b border-slate-100 bg-gradient-to-r from-rose-50/80 via-white to-pink-50/40 px-6 py-5">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Ajouter Voiture en Garantie
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600 sm:text-sm">
                  Choisissez un véhicule SAV à passer au statut garantie.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="space-y-3 px-6 py-4">
              {pickerSearch}
              <div className="max-h-[min(48vh,340px)] overflow-y-auto pr-1">
                <VehiclePickerList
                  items={filteredEligible}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl font-semibold sm:w-auto"
                onClick={closeAdd}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={submitting || !selectedId}
                className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 font-bold text-white shadow-md hover:from-rose-600 hover:to-pink-700 sm:w-auto"
                onClick={() => void handleAdd()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ajout…
                  </>
                ) : (
                  "Ajouter en garantie"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={!!retourVoiture}
        onOpenChange={(open) => {
          if (!open && !returningId) setRetourVoiture(null);
        }}
      >
        <DialogContent className="gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-md">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold text-slate-900">
                Retour au dispatching
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-slate-600">
                {retourVoiture
                  ? `${retourVoiture.model} (${retourVoiture.chassisNumber || retourVoiture.immatriculation || "—"}) reviendra dans la file Dispatching.`
                  : ""}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="flex-col gap-2 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!!returningId}
              className="w-full rounded-xl font-semibold sm:w-auto"
              onClick={() => setRetourVoiture(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!!returningId}
              className="w-full rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 sm:w-auto"
              onClick={() => void handleRetour()}
            >
              {returningId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retour…
                </>
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Confirmer le retour
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
