"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Car,
  User,
  Package,
  Wrench,
  ClipboardList,
  Gauge,
  Sparkles,
  RefreshCw,
  CircleCheck,
  Hash,
  ListChecks,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Palette,
  Gift,
  Phone,
  Plus,
  Save,
  ArrowRight,
  Undo2,
  Lock,
  ChevronRight,
  ChevronDown,
  DoorOpen,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatNumberWithSpaces } from "@/lib/utils";
import { validateTerminerMaintenance } from "@/lib/sav/terminerMaintenanceValidation";
import {
  isGarantieOffertDetailLocked,
  filterUnlockedDetails,
  type GarantieOffertMatch,
} from "@/lib/sav/garantieOffertMatch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

type CatergorieDiagnostic = {
  id: string;
  nom: string;
  description: string | null;
};

type PieceRow = {
  id: string;
  nom: string;
  part_code: string | null;
  prix_vente: unknown;
  quantiteSortieDetail: number;
};

type DetailRow = {
  id: string;
  nom: string;
  description: string | null;
  diagnosticArriveeId: string | null;
  garantieSAVId?: string | null;
  catergorieDiagnostic: CatergorieDiagnostic;
  PieceSAV: PieceRow[];
};

export type MaintenanceRow = {
  id: string;
  nom: string;
  description: string | null;
  duree_maintenance: string | null;
  prix_maintenance: unknown;
  catergorieDiagnosticId: string | null;
};

export type QueueTab = "attente" | "maintenance" | "garantie" | "sortie";

export type ReparationMaintenance = {
  id: string;
  kind?: "reparation" | "garantie";
  categorie_reparation: string;
  horaire_travail_prix: unknown;
  horaire_travail_duration: string | null;
  voitureSAV: {
    id: string;
    immatriculation: string;
    model: string;
    StatutGarantie?: string | null;
    GarantieSAV?: GarantieOffertMatch[];
    ClientSAV: {
      nom: string;
      prenom: string;
    } | null;
  };
  DetailDiagnostic: DetailRow[];
  Maintenance: MaintenanceRow[];
};

/** Full client name for a repair/warranty dossier, or a fallback label. */
export function clientName(rep: ReparationMaintenance): string {
  const c = rep.voitureSAV.ClientSAV;
  const label = `${c?.prenom ?? ""} ${c?.nom ?? ""}`.trim();
  return label || "Client non renseigné";
}

type StatutGarantieSAV =
  | "EN_COURS"
  | "FIN_INTERVENTION_GARANTIESAV_EN_COURS"
  | "GARANTIESAV_EN_COURS"
  | "GARANTIESAV_TERMINE"
  | "PAS_DE_GARANTIE";

type AttenteDetailDiagnostic = {
  id: string;
  nom: string;
  description?: string | null;
  garantieSAVId?: string | null;
};

type AttenteGarantieOffert = {
  id?: string;
  nom_garantie?: string | null;
  statut?: string | null;
  quantite_garantie_offert?: number | null;
  voitureSAVId?: string | null;
};

type InterventionOffertSummary = {
  id: string;
  niveau_Intervention: number;
  detailDiagnosticId?: string | null;
  typeProduitUtilise?: string | null;
};

type AttenteDiagnosticArrivee = {
  id: string;
  catergorieDiagnostic?: { nom?: string | null } | null;
  DetailDiagnostic?: AttenteDetailDiagnostic[];
};

type VoitureSavGarantieMatch = {
  id?: string;
  chassisNumber?: string | null;
  garantieSAVbadge?: boolean | null;
};

type VoitureAttente = {
  id: string;
  model: string;
  immatriculation: string;
  chassisNumber?: string | null;
  couleur: string;
  motorisation?: string | null;
  transmission?: string | null;
  statut: string;
  deplacementSAV?: string | null;
  StatutGarantie?: StatutGarantieSAV | string | null;
  sousGarantie?: boolean;
  VoitureSavGarantie?: VoitureSavGarantieMatch | null;
  ClientSAV?: { nom?: string; prenom?: string; contact?: string } | null;
  diagnosticArrivee?: AttenteDiagnosticArrivee[];
  GarantieSAV?: AttenteGarantieOffert[];
  InterventionDiagnosticOffert?: InterventionOffertSummary[];
};

const STATUT_GARANTIE_LABELS: Record<StatutGarantieSAV, string> = {
  EN_COURS: "Garantie : en cours",
  FIN_INTERVENTION_GARANTIESAV_EN_COURS: "Fin intervention garantie",
  GARANTIESAV_EN_COURS: "Garantie SAV en cours",
  GARANTIESAV_TERMINE: "Garantie terminée",
  PAS_DE_GARANTIE: "Pas de garantie sur cette voiture",
};

const STATUT_GARANTIE_BADGE_CLASS: Record<StatutGarantieSAV, string> = {
  EN_COURS: "border-slate-200 bg-slate-100 font-medium text-slate-800 hover:bg-slate-100",
  FIN_INTERVENTION_GARANTIESAV_EN_COURS:
    "border-pink-200 bg-pink-100 font-medium text-pink-900 hover:bg-pink-100",
  GARANTIESAV_EN_COURS:
    "border-rose-200 bg-rose-100 font-medium text-rose-900 hover:bg-rose-100",
  GARANTIESAV_TERMINE:
    "border-fuchsia-200 bg-fuchsia-100 font-medium text-fuchsia-900 hover:bg-fuchsia-100",
  PAS_DE_GARANTIE:
    "border-slate-200 bg-slate-100 font-medium text-slate-600 hover:bg-slate-100",
};

/** Type guard: true when `value` is a known SAV warranty status. */
function isStatutGarantieSAV(value: string): value is StatutGarantieSAV {
  return value in STATUT_GARANTIE_LABELS;
}

/** Human-readable label for a SAV warranty status (defaults to “en cours”). */
export function statutGarantieLabel(value: string | null | undefined): string {
  if (!value) return STATUT_GARANTIE_LABELS.EN_COURS;
  if (isStatutGarantieSAV(value)) return STATUT_GARANTIE_LABELS[value];
  return value;
}

/** Badge color classes for a SAV warranty status. */
export function statutGarantieBadgeClass(value: string | null | undefined): string {
  if (value && isStatutGarantieSAV(value)) return STATUT_GARANTIE_BADGE_CLASS[value];
  return STATUT_GARANTIE_BADGE_CLASS.EN_COURS;
}

function chassisKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "";
}

/** True when this SAV vehicle’s chassis is listed in VoitureSavGarantie. */
function hasVoitureSavGarantieByChassis(v: VoitureAttente): boolean {
  if (typeof v.sousGarantie === "boolean") return v.sousGarantie;
  const key = chassisKey(v.chassisNumber);
  const matched = v.VoitureSavGarantie ?? null;
  if (!matched) return false;
  const matchedKey = chassisKey(matched.chassisNumber);
  if (key && matchedKey && key !== matchedKey) return false;
  return matched.garantieSAVbadge !== false;
}

/** Full client name for a vehicle in the waiting/sortie queues. */
function voitureAttenteClient(v: VoitureAttente): string {
  const label = `${v.ClientSAV?.prenom ?? ""} ${v.ClientSAV?.nom ?? ""}`.trim();
  return label || "Client non renseigné";
}

/** Arrival diagnostics grouped with their detail lines for a waiting vehicle. */
function attenteDiagnosticGroups(v: VoitureAttente) {
  return (v.diagnosticArrivee ?? []).map((da) => ({
    id: da.id,
    nom: da.catergorieDiagnostic?.nom?.trim() || "Diagnostic",
    details: da.DetailDiagnostic ?? [],
  }));
}

/** Normalize a warranty/product name so it can be compared case-insensitively. */
function normalizeGarantieLibelle(value: string) {
  return value.trim().toLowerCase();
}

/** Tokens extracted from a gift-warranty name (lines, separators) for matching. */
function garantieOffertNameTokens(nom_garantie?: string | null): string[] {
  if (!nom_garantie?.trim()) return [];
  const keys = new Set<string>();
  for (const line of nom_garantie.split(/[\n;]+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    keys.add(normalizeGarantieLibelle(trimmed));
    for (const part of trimmed.split(/\s+[—–\-]\s+/)) {
      const token = normalizeGarantieLibelle(part);
      if (token) keys.add(token);
    }
  }
  return [...keys];
}

/** True if the diagnostic detail name matches an active (non-cancelled) gift warranty. */
function detailMatchesGarantieOffert(
  nom: string,
  garanties: AttenteGarantieOffert[] | undefined
): boolean {
  const key = normalizeGarantieLibelle(nom);
  if (!key) return false;
  const list = (garanties ?? []).filter((g) => g.statut !== "ANNULE");
  return list.some((g) => {
    const exact = normalizeGarantieLibelle(g.nom_garantie ?? "") === key;
    return exact || garantieOffertNameTokens(g.nom_garantie).includes(key);
  });
}

/** True if this diagnostic line is covered by a gift warranty (id, vehicle, or catalog). */
function isDetailGarantieOffert(
  detail: AttenteDetailDiagnostic,
  vehicleGaranties: AttenteGarantieOffert[] | undefined,
  catalogGaranties: AttenteGarantieOffert[]
): boolean {
  if (detail.garantieSAVId) return true;
  return (
    detailMatchesGarantieOffert(detail.nom, vehicleGaranties) ||
    detailMatchesGarantieOffert(detail.nom, catalogGaranties)
  );
}

/** Find the gift-warranty record matching a diagnostic detail name (exact, then token). */
function findGarantieForDetail(
  nom: string,
  garanties: AttenteGarantieOffert[] | undefined
): AttenteGarantieOffert | null {
  const key = normalizeGarantieLibelle(nom);
  if (!key) return null;
  const list = (garanties ?? []).filter((g) => g.statut !== "ANNULE");
  const exact = list.find(
    (g) => normalizeGarantieLibelle(g.nom_garantie ?? "") === key
  );
  if (exact) return exact;
  return (
    list.find((g) => garantieOffertNameTokens(g.nom_garantie).includes(key)) ??
    null
  );
}

/** Integer gift-warranty quantity (quota), or null if missing / not a number. */
function garantieQuota(garantie: AttenteGarantieOffert | null): number | null {
  if (!garantie) return null;
  const q = garantie.quantite_garantie_offert;
  if (q == null || !Number.isFinite(Number(q))) return null;
  return Math.trunc(Number(q));
}

/** Quota for a detail: vehicle warranty first, then catalog warranty. */
function quotaForDetail(
  nom: string,
  vehicleGaranties: AttenteGarantieOffert[] | undefined,
  catalogGaranties: AttenteGarantieOffert[] | undefined
): number | null {
  const fromVehicle = garantieQuota(
    findGarantieForDetail(nom, vehicleGaranties)
  );
  if (fromVehicle != null) return fromVehicle;
  return garantieQuota(findGarantieForDetail(nom, catalogGaranties));
}

/** Catalog gift warranties that are not tied to a specific vehicle. */
function catalogGarantiesOnly(catalog: AttenteGarantieOffert[]) {
  return catalog.filter((g) => !g.voitureSAVId);
}

/** Gift interventions that belong to this diagnostic detail (by id, then by product name). */
function interventionsForDetail(
  detail: AttenteDetailDiagnostic,
  interventions: InterventionOffertSummary[] | undefined,
  currentDetailIds: Set<string>
): InterventionOffertSummary[] {
  const key = normalizeGarantieLibelle(detail.nom);
  return (interventions ?? []).filter((item) => {
    if (item.detailDiagnosticId === detail.id) return true;
    if (
      item.detailDiagnosticId &&
      currentDetailIds.has(item.detailDiagnosticId)
    ) {
      return false;
    }
    if (!key) return false;
    return normalizeGarantieLibelle(item.typeProduitUtilise ?? "") === key;
  });
}

/** Highest intervention level already used for this diagnostic detail (0 if none). */
function maxNiveauForDetail(
  detail: AttenteDetailDiagnostic,
  interventions: InterventionOffertSummary[] | undefined,
  currentDetailIds: Set<string>
): number {
  const rows = interventionsForDetail(detail, interventions, currentDetailIds);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((row) => Number(row.niveau_Intervention) || 0));
}

/** True when every gift-warranty quota on this vehicle has been fully consumed. */
function isGarantieQuotaReached(
  v: VoitureAttente,
  catalog: AttenteGarantieOffert[]
): boolean {
  const catalogOnly = catalogGarantiesOnly(catalog);
  const details = attenteDiagnosticGroups(v).flatMap((g) => g.details);
  const currentDetailIds = new Set(details.map((d) => d.id));
  const offered = details.filter((d) =>
    isDetailGarantieOffert(d, v.GarantieSAV, catalog)
  );
  const compared = offered
    .map((d) => ({
      quota: quotaForDetail(d.nom, v.GarantieSAV, catalogOnly),
      niveau: maxNiveauForDetail(
        d,
        v.InterventionDiagnosticOffert,
        currentDetailIds
      ),
    }))
    .filter((row) => row.quota != null);
  if (compared.length > 0) {
    return compared.every((row) => row.quota === row.niveau);
  }
  const vehicleQuotas = (v.GarantieSAV ?? [])
    .filter((g) => g.statut !== "ANNULE")
    .map((g) => garantieQuota(g))
    .filter((q): q is number => q != null);
  if (vehicleQuotas.length === 0) return false;
  const niveaux = (v.InterventionDiagnosticOffert ?? []).map(
    (item) => Number(item.niveau_Intervention) || 0
  );
  const maxNiveau = niveaux.length > 0 ? Math.max(...niveaux) : 0;
  return vehicleQuotas.every((quota) => quota === maxNiveau);
}

const QUEUE_TABS: {
  value: QueueTab;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof Clock;
  iconBg: string;
  activeBtn: string;
  hero: string;
  glow: string;
  kicker: string;
  plate: "amber" | "teal" | "rose";
}[] = [
  {
    value: "attente",
    label: "Attente",
    shortLabel: "Attente",
    description: "File atelier",
    icon: Clock,
    iconBg: "bg-amber-50 text-amber-700",
    activeBtn: "bg-amber-600 text-white shadow-md shadow-amber-600/25",
    hero: "from-amber-800 via-orange-700 to-amber-900",
    glow: "bg-orange-400/20",
    kicker: "text-amber-100/95",
    plate: "amber",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    shortLabel: "Atelier",
    description: "Interventions",
    icon: Wrench,
    iconBg: "bg-teal-50 text-teal-700",
    activeBtn: "bg-teal-700 text-white shadow-md shadow-teal-700/25",
    hero: "from-teal-800 via-emerald-700 to-teal-900",
    glow: "bg-emerald-400/20",
    kicker: "text-teal-100/95",
    plate: "teal",
  },
  {
    value: "garantie",
    label: "Garantie SAV",
    shortLabel: "Garantie",
    description: "Dossiers garantie",
    icon: ShieldCheck,
    iconBg: "bg-rose-50 text-rose-700",
    activeBtn: "bg-rose-700 text-white shadow-md shadow-rose-700/25",
    hero: "from-rose-800 via-pink-700 to-rose-900",
    glow: "bg-rose-400/20",
    kicker: "text-rose-100/90",
    plate: "rose",
  },
  {
    value: "sortie",
    label: "Sortie",
    shortLabel: "Sortie",
    description: "Départ atelier",
    icon: DoorOpen,
    iconBg: "bg-sky-50 text-sky-700",
    activeBtn: "bg-sky-700 text-white shadow-md shadow-sky-700/25",
    hero: "from-sky-800 via-cyan-700 to-sky-900",
    glow: "bg-sky-400/20",
    kicker: "text-sky-100/90",
    plate: "teal",
  },
];

/** Compact license-plate badge (SAV strip + registration). */
export function PlateBadge({
  immat,
  tone = "teal",
}: {
  immat: string;
  tone?: "amber" | "teal" | "rose";
}) {
  const bar =
    tone === "amber"
      ? "bg-amber-600"
      : tone === "rose"
        ? "bg-rose-600"
        : "bg-teal-600";
  const text =
    tone === "amber"
      ? "text-amber-400"
      : tone === "rose"
        ? "text-rose-300"
        : "text-teal-300";
  return (
    <span className="inline-flex max-w-[10.5rem] shrink-0 items-stretch overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950 shadow-sm sm:max-w-[12rem]">
      <span
        className={cn(
          "flex w-5 shrink-0 flex-col items-center justify-center text-[8px] font-black leading-none text-white",
          bar
        )}
      >
        SAV
      </span>
      <span
        className={cn(
          "truncate px-2 py-1 font-mono text-[11px] font-bold tracking-wider",
          text
        )}
      >
        {immat}
      </span>
    </span>
  );
}

/** Queue card for a waiting / warranty / sortie vehicle (identity, diagnostic, gift quotas). */
function ChassisGarantieBadge({ v }: { v: VoitureAttente }) {
  if (hasVoitureSavGarantieByChassis(v)) {
    return (
      <Badge className="max-w-full gap-1 truncate border-rose-200 bg-rose-100 font-medium text-rose-900 hover:bg-rose-100">
        <ShieldCheck className="h-3 w-3 shrink-0" />
        <span className="truncate">Garantie en cours</span>
      </Badge>
    );
  }
  return (
    <span className="inline-flex max-w-full items-center gap-1 text-xs font-medium text-slate-500">
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
      <span>Pas de garantie sur cette voiture</span>
    </span>
  );
}

function VoitureSavQueueCard({
  v,
  catalog,
  tone,
  statutLabel,
  statutClassName,
  footer,
  clickableDetails = false,
}: {
  v: VoitureAttente;
  catalog: AttenteGarantieOffert[];
  tone: "amber" | "rose" | "teal";
  statutLabel: string;
  statutClassName: string;
  footer?: ReactNode;
  clickableDetails?: boolean;
}) {
  const groups = attenteDiagnosticGroups(v);
  const detailCount = groups.reduce((n, g) => n + g.details.length, 0);
  const catalogOnly = catalogGarantiesOnly(catalog);
  const currentDetailIds = new Set(
    groups.flatMap((g) => g.details.map((item) => item.id))
  );
  const headerGrad =
    tone === "amber"
      ? "from-amber-50/90 via-white to-orange-50/40"
      : tone === "rose"
        ? "from-rose-50/90 via-white to-pink-50/40"
        : "from-teal-50/90 via-white to-emerald-50/40";
  const iconGrad =
    tone === "amber"
      ? "from-amber-500 to-orange-600 shadow-amber-600/20"
      : tone === "rose"
        ? "from-rose-500 to-pink-600 shadow-rose-600/20"
        : "from-teal-500 to-emerald-600 shadow-teal-600/20";

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/5">
      <CardHeader
        className={cn(
          "space-y-0 border-b border-slate-100 bg-gradient-to-br px-4 pb-3.5 pt-4 sm:px-5",
          headerGrad
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md sm:h-11 sm:w-11",
              iconGrad
            )}
          >
            <Car className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {v.model}
              </CardTitle>
              <PlateBadge immat={v.immatriculation} tone={tone} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-medium text-slate-800">
                {voitureAttenteClient(v)}
              </span>
            </p>
            {v.ClientSAV?.contact ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{v.ClientSAV.contact}</span>
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge className={statutClassName}>{statutLabel}</Badge>
              <ChassisGarantieBadge v={v} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <Palette className="h-3 w-3" />
              Couleur
            </p>
            <p className="mt-1 truncate text-sm font-medium capitalize text-slate-900">
              {v.couleur || "—"}
            </p>
          </div>
          <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <Gauge className="h-3 w-3" />
              Moteur
            </p>
            <p className="mt-1 truncate text-sm font-medium text-slate-900">
              {v.motorisation?.trim() || "—"}
              {v.transmission?.trim() ? ` · ${v.transmission}` : ""}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
          <p className="mb-2 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <ClipboardList className="h-3 w-3" />
              Diagnostic
            </span>
            <span className="font-medium normal-case tracking-normal text-slate-700">
              {detailCount} ligne{detailCount > 1 ? "s" : ""}
            </span>
          </p>
          {groups.length === 0 || detailCount === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun détail diagnostic pour ce véhicule.
            </p>
          ) : (
            <div className="space-y-2.5">
              {groups.map((group) =>
                group.details.length === 0 ? null : (
                  <div key={group.id}>
                    <p className="mb-1.5 text-xs font-semibold text-slate-800">
                      {group.nom}
                    </p>
                    <ul className="space-y-1.5">
                      {group.details.map((d) => {
                        const offert = isDetailGarantieOffert(
                          d,
                          v.GarantieSAV,
                          catalog
                        );
                        const quota = offert
                          ? quotaForDetail(d.nom, v.GarantieSAV, catalogOnly)
                          : null;
                        const niveau = offert
                          ? maxNiveauForDetail(
                              d,
                              v.InterventionDiagnosticOffert,
                              currentDetailIds
                            )
                          : 0;
                        const quotaReached =
                          quota != null && quota === niveau;
                        const body = (
                          <>
                            <span className="flex min-w-0 flex-1 items-start gap-2">
                              {clickableDetails ? (
                                <span
                                  className={cn(
                                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1",
                                    offert
                                      ? "bg-amber-100 text-amber-700 ring-amber-200"
                                      : "bg-slate-100 text-slate-400 ring-slate-200"
                                  )}
                                >
                                  {offert ? (
                                    <Gift className="h-3.5 w-3.5" />
                                  ) : (
                                    <Lock className="h-3 w-3" />
                                  )}
                                </span>
                              ) : null}
                              <span className="min-w-0 flex-1">
                                <span className="font-medium text-slate-900">
                                  {d.nom}
                                </span>
                                {offert ? (
                                  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                    <Gift className="h-2.5 w-2.5" />
                                    Offert
                                  </span>
                                ) : clickableDetails ? (
                                  <span className="ml-1.5 text-[10px] font-medium text-slate-400">
                                    Hors garantie
                                  </span>
                                ) : null}
                                {d.description ? (
                                  <span className="mt-0.5 block text-xs text-slate-500">
                                    {d.description}
                                  </span>
                                ) : null}
                                {clickableDetails && offert ? (
                                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                                    <span className="inline-flex items-center rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700 ring-1 ring-emerald-200">
                                      Qté garantie : {quota ?? "—"}
                                    </span>
                                    <span className="inline-flex items-center rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-700 ring-1 ring-rose-200">
                                      Niveau : {niveau}
                                    </span>
                                    {quotaReached ? (
                                      <span className="inline-flex items-center rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                        Quota atteint
                                      </span>
                                    ) : null}
                                  </span>
                                ) : null}
                                {clickableDetails && offert ? (
                                  <span className="mt-1 block text-[11px] font-medium text-amber-700">
                                    Ouvrir les interventions
                                  </span>
                                ) : clickableDetails ? (
                                  <span className="mt-1 block text-[11px] text-slate-400">
                                    Hors garantie — non cliquable
                                  </span>
                                ) : null}
                              </span>
                            </span>
                            {clickableDetails && offert ? (
                              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            ) : null}
                          </>
                        );
                        const className = cn(
                          "rounded-lg border px-2.5 py-2 text-sm leading-snug",
                          offert
                            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                            : "border-slate-200/80 bg-white",
                          clickableDetails && offert
                            ? "flex items-start gap-2 transition-colors hover:border-amber-300 hover:bg-amber-50"
                            : clickableDetails && !offert
                              ? "flex items-start gap-2 opacity-60"
                              : null
                        );
                        if (clickableDetails && offert) {
                          return (
                            <li key={d.id}>
                              <Link
                                href={`/sav/maintenance/${v.id}?detail=${d.id}`}
                                className={className}
                              >
                                {body}
                              </Link>
                            </li>
                          );
                        }
                        return (
                          <li key={d.id} className={className}>
                            {body}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )
              )}
            </div>
          )}
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}

type CatBlock = {
  id: string;
  nom: string;
  description: string | null;
  details: {
    id: string;
    nom: string;
    description: string | null;
    diagnosticArriveeId: string | null;
    garantieSAVId?: string | null;
  }[];
  pieces: PieceRow[];
};

/** Group diagnostic details and issued parts by diagnostic category for a dossier. */
export function buildCategoryBlocks(rep: ReparationMaintenance): CatBlock[] {
  const byCat = new Map<string, CatBlock>();
  const seenPiece = new Set<string>();

  for (const d of rep.DetailDiagnostic ?? []) {
    const cat = d.catergorieDiagnostic;
    if (!cat?.id) continue;
    if (!byCat.has(cat.id)) {
      byCat.set(cat.id, {
        id: cat.id,
        nom: cat.nom,
        description: cat.description ?? null,
        details: [],
        pieces: [],
      });
    }
    byCat.get(cat.id)!.details.push({
      id: d.id,
      nom: d.nom,
      description: d.description ?? null,
      diagnosticArriveeId: d.diagnosticArriveeId ?? null,
      garantieSAVId: d.garantieSAVId ?? null,
    });
    for (const p of d.PieceSAV ?? []) {
      if (seenPiece.has(p.id)) continue;
      seenPiece.add(p.id);
      byCat.get(cat.id)!.pieces.push(p);
    }
  }
  return Array.from(byCat.values());
}

/** Format a price as “N FCFA”, or “—” when missing / invalid. */
function priceToDisplay(v: unknown): string {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${formatNumberWithSpaces(n)} FCFA`;
}

/** True if this diagnostic line is covered by a gift warranty and still locked. */
export function isRepDetailLocked(
  rep: ReparationMaintenance,
  detail: { nom: string; garantieSAVId?: string | null },
  catalog: GarantieOffertMatch[] = []
): boolean {
  return isGarantieOffertDetailLocked(
    rep.voitureSAV.StatutGarantie,
    detail,
    rep.voitureSAV.GarantieSAV,
    catalog
  );
}

/** True if this category still has at least one unlocked diagnostic line. */
export function categoryHasUnlockedDetails(
  rep: ReparationMaintenance,
  categorieId: string,
  catalog: GarantieOffertMatch[] = []
): boolean {
  const details = (rep.DetailDiagnostic ?? []).filter(
    (d) => d.catergorieDiagnostic?.id === categorieId
  );
  if (details.length === 0) return true;
  return details.some((d) => !isRepDetailLocked(rep, d, catalog));
}

/** True if this dossier already has a maintenance fiche for the given category. */
export function hasMaintenanceForCategory(
  rep: ReparationMaintenance,
  categorieId: string
): boolean {
  return (
    rep.Maintenance?.some((m) => m.catergorieDiagnosticId === categorieId) ??
    false
  );
}

/** Local preview of “finish maintenance” rules (fresh data is re-checked via API on click). */
export function getTerminerValidation(
  rep: ReparationMaintenance,
  catalog: GarantieOffertMatch[] = []
) {
  const unlocked = filterUnlockedDetails(
    rep.voitureSAV.StatutGarantie,
    rep.DetailDiagnostic ?? [],
    rep.voitureSAV.GarantieSAV,
    catalog
  );
  return validateTerminerMaintenance(
    {
      horaire_travail_prix: rep.horaire_travail_prix,
      horaire_travail_duration: rep.horaire_travail_duration,
    },
    rep.Maintenance ?? [],
    unlocked.map((d) => d.catergorieDiagnostic?.id ?? null)
  );
}

export type PieceStockOption = {
  id: string;
  nom: string;
  model_voiture: string | null;
  marque_piece: string | null;
  part_code: string | null;
  quantite_restante: number;
};

type DetailSortieOption = {
  id: string;
  diagnosticArriveeId: string;
  label: string;
};

/** Diagnostic-line options for the parts-sortie dialog, filtered to one category. */
export function buildDetailOptionsForCategory(
  rep: ReparationMaintenance,
  categorieId: string,
  catalog: GarantieOffertMatch[] = []
): DetailSortieOption[] {
  const out: DetailSortieOption[] = [];
  for (const d of rep.DetailDiagnostic ?? []) {
    if (d.catergorieDiagnostic?.id !== categorieId) continue;
    if (isRepDetailLocked(rep, d, catalog)) continue;
    const daId = d.diagnosticArriveeId?.trim();
    if (!daId) continue;
    const catNom = d.catergorieDiagnostic?.nom ?? "Catégorie";
    out.push({
      id: d.id,
      diagnosticArriveeId: daId,
      label: `${catNom} — ${d.nom}`,
    });
  }
  return out;
}

/** Parts already issued against a diagnostic detail on this dossier. */
export function findPiecesForDetailRep(
  rep: ReparationMaintenance,
  detailId: string
): PieceRow[] {
  const d = rep.DetailDiagnostic?.find((x) => x.id === detailId);
  return d?.PieceSAV ?? [];
}

/** Find a part by id across all diagnostic details of a dossier. */
export function findPieceByIdRep(
  rep: ReparationMaintenance,
  pieceId: string
): PieceRow | null {
  for (const d of rep.DetailDiagnostic ?? []) {
    const p = d.PieceSAV?.find((x) => x.id === pieceId);
    if (p) return p;
  }
  return null;
}

/** Load gift-warranty catalog used to match diagnostic lines. */
export async function fetchGarantieOffertCatalog(): Promise<GarantieOffertMatch[]> {
  const json = await fetch("/api/sav/garantie-sav").then((r) => r.json());
  if (!json.success) {
    throw new Error(json.error || "Erreur chargement des garanties offertes");
  }
  return (json.data || []) as GarantieOffertMatch[];
}

/** Load spare-parts stock from the SAV API. */
export async function fetchPiecesStock(): Promise<PieceStockOption[]> {
  const res = await fetch("/api/sav/piece-sav");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Erreur chargement des pièces");
  }
  return json.data || [];
}

export type FormFields = {
  nom: string;
  description: string;
  duree_maintenance: string;
  prix_maintenance: string;
};

/** Empty maintenance-fiche form (name, description, duration, price). */
export const emptyForm = (): FormFields => ({
  nom: "",
  description: "",
  duree_maintenance: "",
  prix_maintenance: "",
});

/** Fetch a list of repair/warranty dossiers from a queue API endpoint. */
export async function fetchQueue(
  url: string
): Promise<ReparationMaintenance[]> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Chargement impossible");
  }
  return (json.data ?? []) as ReparationMaintenance[];
}

/** Run async work with a cap on in-flight tasks (avoids Prisma pool exhaustion). */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await mapper(items[index]);
      }
    })
  );
  return results;
}

/** Tag each dossier with `kind` (reparation vs garantie) when the API omitted it. */
export function withKind(
  rows: ReparationMaintenance[],
  kind: ReparationMaintenance["kind"]
): ReparationMaintenance[] {
  return rows.map((r) => ({ ...r, kind: r.kind ?? kind }));
}

/** Keep the current dossier selected if it is still in the list; otherwise pick the first. */
export function pickActive(prev: string, data: ReparationMaintenance[]): string {
  if (data.length === 0) return "";
  if (prev && data.some((r) => r.id === prev)) return prev;
  return data[0].id;
}

/** Empty-state card shown when a queue tab has no vehicles / dossiers. */
function EmptyWorkshopState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Clock;
  title: string;
  body: string;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm ring-1 ring-slate-950/5">
      <CardContent className="flex flex-col items-center px-4 py-10 text-center sm:py-12">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-400/30 to-emerald-400/20 blur-lg" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 sm:h-20 sm:w-20">
            <Icon className="h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />
          </div>
        </div>
        <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-800 sm:mt-7 sm:text-xl">
          {title}
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          {body}
        </p>
      </CardContent>
    </Card>
  );
}

/** Workspace for one open dossier: per-category maintenance fiches, parts, and finish action. */
export function DossierWorkspace({
  rep,
  queueTab,
  formsByRepCat,
  savingCat,
  finishingRepId,
  onUpdateField,
  onSave,
  onFinish,
  onAddPiece,
  showIdentity = true,
  garantieCatalog = [],
}: {
  rep: ReparationMaintenance;
  queueTab: QueueTab;
  formsByRepCat: Record<string, Record<string, FormFields>>;
  savingCat: string | null;
  finishingRepId: string | null;
  onUpdateField: (
    repId: string,
    catId: string,
    field: keyof FormFields,
    value: string
  ) => void;
  onSave: (repId: string, catId: string) => void;
  onFinish: (repId: string) => void;
  onAddPiece: (repId: string, categorieId: string) => void;
  showIdentity?: boolean;
  garantieCatalog?: GarantieOffertMatch[];
}) {
  const blocks = buildCategoryBlocks(rep);
  const vs = rep.voitureSAV;
  const clientLabel = clientName(rep);
  const terminerVal = getTerminerValidation(rep, garantieCatalog);
  const plateTone = queueTab === "garantie" ? "rose" : "teal";
  const actionableBlocks = blocks.filter((b) =>
    categoryHasUnlockedDetails(rep, b.id, garantieCatalog)
  );
  const savedCount = actionableBlocks.filter((b) =>
    hasMaintenanceForCategory(rep, b.id)
  ).length;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const isBlockCollapsed = (blockId: string, saved: boolean) =>
    collapsed[blockId] ?? saved;

  return (
    <div className="min-w-0 space-y-3 sm:space-y-5">
      {showIdentity ? (
      <Card className="overflow-hidden rounded-2xl border-slate-200/90 shadow-sm ring-1 ring-slate-950/5">
        <div className="bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3 sm:gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ring-1 ring-white/30 sm:h-14 sm:w-14",
                  queueTab === "garantie"
                    ? "bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-600/25"
                    : "bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-600/25"
                )}
              >
                <Car className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wider",
                    queueTab === "garantie"
                      ? "text-rose-800/90"
                      : "text-teal-800/90"
                  )}
                >
                  {queueTab === "garantie"
                    ? "Dossier garantie"
                    : "Dossier maintenance"}
                </p>
                <p className="mt-1 truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  {clientLabel}
                </p>
                <p className="mt-0.5 truncate text-sm text-slate-600">
                  {vs.model}
                  <span className="text-slate-400"> · </span>
                  <span className="font-mono text-slate-700">
                    {vs.immatriculation}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              <PlateBadge immat={vs.immatriculation} tone={plateTone} />
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium",
                  queueTab === "garantie"
                    ? "border-rose-200/80 bg-rose-50 text-rose-900"
                    : "border-teal-200/80 bg-teal-50 text-teal-900"
                )}
              >
                {actionableBlocks.length}{" "}
                {actionableBlocks.length === 1 ? "catégorie" : "catégories"}
              </Badge>
              {vs.StatutGarantie ? (
                <Badge
                  className={cn(
                    "max-w-full gap-1 truncate",
                    statutGarantieBadgeClass(vs.StatutGarantie)
                  )}
                >
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {statutGarantieLabel(vs.StatutGarantie)}
                  </span>
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
            <div className="min-w-0 rounded-xl border border-slate-100/90 bg-white/80 px-2.5 py-2.5 shadow-sm ring-1 ring-slate-950/[0.03] sm:px-3 sm:py-3">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
                <User className="h-3 w-3 shrink-0 opacity-70" />
                <span className="truncate">Client</span>
              </div>
              <p className="mt-1 truncate text-[13px] font-semibold leading-snug text-slate-900 sm:mt-1.5 sm:text-sm">
                {clientLabel}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-100/90 bg-white/80 px-2.5 py-2.5 shadow-sm ring-1 ring-slate-950/[0.03] sm:px-3 sm:py-3">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
                <Wrench className="h-3 w-3 shrink-0 opacity-70" />
                <span className="truncate">Intervention</span>
              </div>
              <p className="mt-1 truncate text-[13px] font-semibold leading-snug text-slate-900 sm:mt-1.5 sm:text-sm">
                {rep.categorie_reparation || "—"}
              </p>
            </div>
          </div>

          {queueTab === "maintenance" &&
            (terminerVal.ok ? (
              <p className="mt-3 text-xs text-slate-500">
                Prix / durée horaire :{" "}
                <span className="font-medium text-slate-800">
                  {priceToDisplay(rep.horaire_travail_prix)}
                </span>
                {" · "}
                <span className="font-medium text-slate-800">
                  {rep.horaire_travail_duration?.trim() || "—"}
                </span>
              </p>
            ) : (
              <p
                className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                role="status"
              >
                {terminerVal.error}
              </p>
            ))}
        </div>

        <div className="hidden border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:block sm:px-6">
          <Button
            type="button"
            className="h-11 w-full gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
            disabled={
              finishingRepId === rep.id ||
              (queueTab === "maintenance" && !terminerVal.ok)
            }
            onClick={() => onFinish(rep.id)}
          >
            {finishingRepId === rep.id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement…
              </>
            ) : (
              <>
                <CircleCheck className="h-4 w-4" />
                Envoyer en Sortie
              </>
            )}
          </Button>
        </div>
      </Card>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-950/5 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <Wrench className="h-3 w-3" />
                Intervention
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900 sm:text-base">
                {rep.categorie_reparation || "Réparation atelier"}
              </p>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 border-teal-200 bg-teal-50 text-teal-900"
            >
              {savedCount}/{actionableBlocks.length || 0} fiche
              {actionableBlocks.length > 1 ? "s" : ""}
            </Badge>
          </div>
          {vs.StatutGarantie ? (
            <Badge
              className={cn(
                "mt-2 max-w-full gap-1 truncate",
                statutGarantieBadgeClass(vs.StatutGarantie)
              )}
            >
              <ShieldCheck className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {statutGarantieLabel(vs.StatutGarantie)}
              </span>
            </Badge>
          ) : null}
          {actionableBlocks.length > 0 ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-[width]"
                style={{
                  width: `${
                    actionableBlocks.length === 0
                      ? 0
                      : Math.round((savedCount / actionableBlocks.length) * 100)
                  }%`,
                }}
              />
            </div>
          ) : null}
          {queueTab === "maintenance" ? (
            terminerVal.ok ? (
              <p className="mt-2.5 text-xs text-slate-500">
                Prix / durée horaire :{" "}
                <span className="font-medium text-slate-800">
                  {priceToDisplay(rep.horaire_travail_prix)}
                </span>
                {" · "}
                <span className="font-medium text-slate-800">
                  {rep.horaire_travail_duration?.trim() || "—"}
                </span>
              </p>
            ) : (
              <p
                className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
                role="status"
              >
                {terminerVal.error}
              </p>
            )
          ) : null}
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">
            Aucune catégorie de diagnostic liée à cette réparation.
          </p>
        </div>
      ) : (
        blocks.map((block, idx) => {
          const form = formsByRepCat[rep.id]?.[block.id] ?? emptyForm();
          const saveKey = `${rep.id}:${block.id}`;
          const saved = hasMaintenanceForCategory(rep, block.id);
          const collapsedMobile = isBlockCollapsed(block.id, saved);
          const allDetailsLocked =
            block.details.length > 0 &&
            block.details.every((d) =>
              isRepDetailLocked(rep, d, garantieCatalog)
            );
          return (
            <div
              key={block.id}
              className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/5"
            >
              <div
                className={cn(
                  "absolute left-0 top-0 h-full w-1 rounded-l-2xl",
                  queueTab === "garantie" ? "bg-rose-500" : "bg-teal-600"
                )}
                aria-hidden
              />
              <div className="relative px-3 pb-4 pt-3.5 sm:px-6 sm:pb-5 sm:pt-5">
                <button
                  type="button"
                  aria-expanded={!collapsedMobile}
                  className="mb-3 flex w-full items-start justify-between gap-2 text-left sm:mb-5 sm:pointer-events-none sm:cursor-default"
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [block.id]: !collapsedMobile,
                    }))
                  }
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-lg font-mono text-[11px] font-bold tabular-nums",
                          saved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 sm:text-lg">
                        {block.nom}
                      </h3>
                      {saved ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-[11px] font-medium"
                        >
                          <Sparkles className="h-3 w-3" />
                          Enregistrée
                        </Badge>
                      ) : allDetailsLocked ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-rose-200 bg-rose-50 text-[11px] font-medium text-rose-900"
                        >
                          <Lock className="h-3 w-3" />
                          Garantie
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-900"
                        >
                          À saisir
                        </Badge>
                      )}
                    </div>
                    {block.description ? (
                      <p className="text-sm leading-relaxed text-slate-500">
                        {block.description}
                      </p>
                    ) : null}
                  </div>
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform sm:hidden",
                      !collapsedMobile && "rotate-180"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    collapsedMobile ? "hidden sm:block" : "block"
                  )}
                >

                {block.details.length > 0 ? (
                  <>
                    <div className="mb-4">
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Détails diagnostic
                      </p>
                      <ul className="space-y-2">
                        {block.details.map((d) => {
                          const locked = isRepDetailLocked(
                            rep,
                            d,
                            garantieCatalog
                          );
                          return (
                          <li
                            key={d.id}
                            className={cn(
                              "rounded-lg border px-3 py-2.5 text-sm leading-snug",
                              locked
                                ? "border-rose-200/80 bg-rose-50/60"
                                : "border-slate-200/80 bg-slate-50/80"
                            )}
                          >
                            {locked ? (
                              <span className="flex items-start gap-2.5">
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-500">
                                  <Lock className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-medium text-slate-700">
                                      {d.nom}
                                    </span>
                                    <Badge className="rounded-full bg-rose-50 px-2 py-0 text-[10px] font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-50">
                                      Garantie offerte
                                    </Badge>
                                  </span>
                                  {d.description ? (
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                      {d.description}
                                    </span>
                                  ) : null}
                                  <span className="mt-1 block text-xs font-medium text-rose-700/90">
                                    Désactivée — garantie non terminée
                                  </span>
                                </span>
                              </span>
                            ) : (
                              <>
                                <span className="font-medium text-slate-900">
                                  {d.nom}
                                </span>
                                {d.description ? (
                                  <span className="mt-0.5 block text-xs text-slate-500 sm:mt-0 sm:inline sm:text-sm">
                                    <span className="hidden sm:inline"> — </span>
                                    {d.description}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                    <Separator className="my-4 sm:my-5" />
                  </>
                ) : null}

                <div className="mb-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <Package className="h-3.5 w-3.5" />
                      Pièces SAV
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 shrink-0 gap-1.5 border-emerald-600/40 bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20 sm:h-9"
                      disabled={allDetailsLocked}
                      title={
                        allDetailsLocked
                          ? "Les lignes couvertes par une garantie offerte sont désactivées tant que la garantie n'est pas terminée."
                          : undefined
                      }
                      onClick={() => void onAddPiece(rep.id, block.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </Button>
                  </div>
                  {block.pieces.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3 text-sm text-slate-500">
                      Aucune pièce liée. Utilisez « Ajouter » pour une sortie
                      de stock.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 sm:hidden">
                        {block.pieces.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5"
                          >
                            <p className="text-sm font-medium text-slate-900">
                              {p.nom}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-500">
                              <span className="font-mono">
                                {p.part_code ?? "—"}
                              </span>
                              <span>Qté {p.quantiteSortieDetail}</span>
                              <span className="font-medium tabular-nums text-slate-800">
                                {priceToDisplay(p.prix_vente)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden overflow-hidden rounded-xl border border-slate-200/80 sm:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-semibold">
                                Désignation
                              </TableHead>
                              <TableHead className="font-semibold">
                                Réf.
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                Qté sortie
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                P.U. vente
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {block.pieces.map((p) => (
                              <TableRow
                                key={p.id}
                                className="border-slate-100"
                              >
                                <TableCell className="font-medium">
                                  {p.nom}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {p.part_code ?? "—"}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {p.quantiteSortieDetail}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {priceToDisplay(p.prix_vente)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>

                <div
                  className={cn(
                    "space-y-4 rounded-xl border p-3.5 sm:p-5",
                    allDetailsLocked
                      ? "border-rose-200/80 bg-rose-50/50"
                      : "border-teal-200/70 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/40"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl ring-1",
                        allDetailsLocked
                          ? "bg-rose-100 text-rose-700 ring-rose-200/80"
                          : "bg-teal-600/10 text-teal-700 ring-teal-600/15"
                      )}
                    >
                      {allDetailsLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold tracking-tight text-slate-900">
                        Saisie maintenance
                      </p>
                      <p className="text-xs text-slate-500">{block.nom}</p>
                    </div>
                  </div>
                  {allDetailsLocked ? (
                    <p className="rounded-lg border border-rose-200/80 bg-white/70 px-3 py-2.5 text-xs leading-relaxed text-rose-800">
                      Désactivée — les lignes de cette catégorie sont couvertes
                      par une garantie offerte tant que la garantie n’est pas
                      terminée.
                    </p>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`nom-${rep.id}-${block.id}`}>Nom</Label>
                      <Input
                        id={`nom-${rep.id}-${block.id}`}
                        value={form.nom}
                        onChange={(e) =>
                          onUpdateField(rep.id, block.id, "nom", e.target.value)
                        }
                        className="h-11 bg-white text-base sm:text-sm"
                        placeholder="Intitulé de l’intervention"
                        disabled={saved || allDetailsLocked}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`desc-${rep.id}-${block.id}`}>
                        Description
                      </Label>
                      <Textarea
                        id={`desc-${rep.id}-${block.id}`}
                        value={form.description}
                        onChange={(e) =>
                          onUpdateField(
                            rep.id,
                            block.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="min-h-[4.5rem] resize-y bg-white text-base sm:text-sm"
                        placeholder="Travaux prévus, remarques…"
                        rows={3}
                        disabled={saved || allDetailsLocked}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`duree-${rep.id}-${block.id}`}>
                        Durée
                      </Label>
                      <Input
                        id={`duree-${rep.id}-${block.id}`}
                        value={form.duree_maintenance}
                        onChange={(e) =>
                          onUpdateField(
                            rep.id,
                            block.id,
                            "duree_maintenance",
                            e.target.value
                          )
                        }
                        className="h-11 bg-white text-base sm:text-sm"
                        placeholder="ex. 2 h, 1 jour"
                        disabled={saved || allDetailsLocked}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`prix-${rep.id}-${block.id}`}>
                        Prix (FCFA){" "}
                        <span className="font-normal text-slate-400">
                          (optionnel)
                        </span>
                      </Label>
                      <Input
                        id={`prix-${rep.id}-${block.id}`}
                        value={form.prix_maintenance}
                        onChange={(e) =>
                          onUpdateField(
                            rep.id,
                            block.id,
                            "prix_maintenance",
                            e.target.value
                          )
                        }
                        className="h-11 bg-white text-base sm:text-sm"
                        inputMode="decimal"
                        placeholder="Facultatif"
                        disabled={saved || allDetailsLocked}
                      />
                    </div>
                  </div>
                  {rep.kind !== "garantie" ? (
                    <Button
                      type="button"
                      className={cn(
                        "h-11 w-full gap-2 font-semibold sm:w-auto",
                        saved
                          ? "cursor-not-allowed border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 disabled:opacity-100"
                          : allDetailsLocked
                            ? "cursor-not-allowed border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-50 disabled:opacity-100"
                            : "bg-teal-700 text-white hover:bg-teal-800"
                      )}
                      disabled={
                        saved || allDetailsLocked || savingCat === saveKey
                      }
                      title={
                        saved
                          ? "Maintenance déjà enregistrée"
                          : allDetailsLocked
                            ? "Saisie désactivée tant que la garantie n'est pas terminée."
                            : "Enregistrer cette fiche (le prix est facultatif)"
                      }
                      onClick={() => void onSave(rep.id, block.id)}
                    >
                      {savingCat === saveKey ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enregistrement…
                        </>
                      ) : saved ? (
                        <>
                          <CircleCheck className="h-4 w-4" />
                          Enregistrée
                        </>
                      ) : allDetailsLocked ? (
                        <>
                          <Lock className="h-4 w-4" />
                          Désactivée
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * SAV workshop queue: waiting vehicles, maintenance dossiers, gift-warranty files, and sortie.
 */
export default function MaintenanceClient({
  initialQueueTab = "maintenance",
}: {
  initialQueueTab?: QueueTab;
}) {
  const [queueTab, setQueueTab] = useState<QueueTab>(initialQueueTab);
  const [attenteVoitures, setAttenteVoitures] = useState<VoitureAttente[]>([]);
  const [maintenanceVoitures, setMaintenanceVoitures] = useState<
    VoitureAttente[]
  >([]);
  const [garantieVoitures, setGarantieVoitures] = useState<VoitureAttente[]>([]);
  const [sortieVoitures, setSortieVoitures] = useState<VoitureAttente[]>([]);
  const [attenteActionKey, setAttenteActionKey] = useState<string | null>(null);
  const [garantiesOffertCatalog, setGarantiesOffertCatalog] = useState<
    AttenteGarantieOffert[]
  >([]);
  const [reparations, setReparations] = useState<ReparationMaintenance[]>([]);
  const [garanties, setGaranties] = useState<ReparationMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [finishingRepId, setFinishingRepId] = useState<string | null>(null);
  const [formsByRepCat, setFormsByRepCat] = useState<
    Record<string, Record<string, FormFields>>
  >({});

  /** Dossiers shown in the current tab (warranty vs repair). */
  const dossiers = useMemo(() => {
    if (queueTab === "garantie") return garanties;
    return reparations;
  }, [queueTab, reparations, garanties]);

  /** All repair + warranty dossiers (used by the parts-sortie dialog). */
  const allDossiers = useMemo(
    () => [...reparations, ...garanties],
    [reparations, garanties]
  );

  /** Load waiting, warranty, sortie vehicles and open workshop dossiers. */
  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [
        attenteRes,
        attenteEnAttenteRes,
        maintenanceRes,
        garantieRes,
        finInterventionRes,
        sortieRes,
        maintRows,
        garantieRows,
        catalogRes,
      ] = await mapWithConcurrency(
        [
          () =>
            fetch(
              "/api/sav/voiture-sav?statut=EN_MAINTENANCE&includeDiagnostic=1&includeGarantie=1"
            ).then((r) => r.json()),
          () =>
            fetch(
              "/api/sav/voiture-sav?statut=EN_MAINTENANCE_EN_ATTENTE&includeDiagnostic=1&includeGarantie=1"
            ).then((r) => r.json()),
          () =>
            fetch(
              "/api/sav/voiture-sav?statut=EN_MAINTENANCE_EN_COURS&includeDiagnostic=1&includeGarantie=1"
            ).then((r) => r.json()),
          () =>
            fetch(
              "/api/sav/voiture-sav?statut=EN_TRAITEMENT_EN_COURS&includeDiagnostic=1&includeGarantie=1&includeInterventions=1"
            ).then((r) => r.json()),
          () =>
            fetch(
              "/api/sav/voiture-sav?statut=FIN_INTERVENTION_GARANTIESAV_EN_COURS&includeDiagnostic=1&includeGarantie=1&includeInterventions=1"
            ).then((r) => r.json()),
          () =>
            fetch(
              "/api/sav/voiture-sav?deplacement=SORTIE_MAINTENANCE&includeDiagnostic=1&includeGarantie=1"
            ).then((r) => r.json()),
          () => fetchQueue("/api/sav/reparations-en-maintenance"),
          () => fetchQueue("/api/sav/garanties-en-maintenance"),
          () => fetch("/api/sav/garantie-sav").then((r) => r.json()),
        ],
        3,
        (run) => run()
      );
      if (!attenteRes.success) {
        throw new Error(attenteRes.error || "Chargement des véhicules impossible");
      }
      if (!attenteEnAttenteRes.success) {
        throw new Error(
          attenteEnAttenteRes.error ||
            "Chargement des véhicules en attente de maintenance impossible"
        );
      }
      if (!maintenanceRes.success) {
        throw new Error(
          maintenanceRes.error ||
            "Chargement des véhicules en maintenance en cours impossible"
        );
      }
      if (!garantieRes.success) {
        throw new Error(
          garantieRes.error || "Chargement des véhicules garantie impossible"
        );
      }
      if (!finInterventionRes.success) {
        throw new Error(
          finInterventionRes.error ||
            "Chargement des véhicules fin intervention impossible"
        );
      }
      if (!sortieRes.success) {
        throw new Error(
          sortieRes.error || "Chargement des véhicules en sortie impossible"
        );
      }
      const attenteStatuts = new Set([
        "EN_MAINTENANCE",
        "EN_MAINTENANCE_EN_ATTENTE",
      ]);
      const attenteById = new Map<string, VoitureAttente>();
      for (const row of [
        ...((attenteRes.data ?? []) as VoitureAttente[]),
        ...((attenteEnAttenteRes.data ?? []) as VoitureAttente[]),
      ]) {
        if (
          attenteStatuts.has(row.statut) &&
          row.deplacementSAV !== "SORTIE_MAINTENANCE"
        ) {
          attenteById.set(row.id, row);
        }
      }
      const nextAttente = [...attenteById.values()];
      const garantieStatuts = new Set([
        "EN_TRAITEMENT_EN_COURS",
        "FIN_INTERVENTION_GARANTIESAV_EN_COURS",
      ]);
      const garantieById = new Map<string, VoitureAttente>();
      for (const row of [
        ...((garantieRes.data ?? []) as VoitureAttente[]),
        ...((finInterventionRes.data ?? []) as VoitureAttente[]),
      ]) {
        if (
          garantieStatuts.has(row.statut) &&
          row.deplacementSAV !== "SORTIE_MAINTENANCE"
        ) {
          garantieById.set(row.id, row);
        }
      }
      const nextGarantieVoitures = [...garantieById.values()];
      const nextSortieVoitures = (
        (sortieRes.data ?? []) as VoitureAttente[]
      ).filter((v) => v.deplacementSAV === "SORTIE_MAINTENANCE");
      const sortieIds = new Set(nextSortieVoitures.map((v) => v.id));
      const nextMaintenanceVoitures = (
        (maintenanceRes.data ?? []) as VoitureAttente[]
      ).filter(
        (v) =>
          v.statut === "EN_MAINTENANCE_EN_COURS" &&
          v.deplacementSAV !== "SORTIE_MAINTENANCE" &&
          !sortieIds.has(v.id)
      );
      const nextMaint = withKind(maintRows, "reparation").filter(
        (r) => !sortieIds.has(r.voitureSAV.id)
      );
      const nextGarantie = withKind(garantieRows, "garantie").filter(
        (r) => !sortieIds.has(r.voitureSAV.id)
      );
      setAttenteVoitures(nextAttente);
      setMaintenanceVoitures(nextMaintenanceVoitures);
      setGarantieVoitures(nextGarantieVoitures);
      setSortieVoitures(nextSortieVoitures);
      setReparations(nextMaint);
      setGaranties(nextGarantie);
      setGarantiesOffertCatalog(
        catalogRes?.success
          ? ((catalogRes.data ?? []) as AttenteGarantieOffert[])
          : []
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  /** Move a waiting or warranty vehicle into warranty treatment or “maintenance in progress”. */
  const handleAttenteStatut = async (
    voitureId: string,
    statut: "EN_TRAITEMENT_EN_COURS" | "EN_MAINTENANCE_EN_COURS"
  ) => {
    if (attenteActionKey) return;
    setAttenteActionKey(`${voitureId}:${statut}`);
    try {
      const res = await fetch(`/api/sav/voiture-sav/${voitureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Mise à jour impossible");
      }
      const moved =
        attenteVoitures.find((row) => row.id === voitureId) ??
        garantieVoitures.find((row) => row.id === voitureId);
      setAttenteVoitures((prev) => prev.filter((row) => row.id !== voitureId));
      if (statut === "EN_TRAITEMENT_EN_COURS") {
        if (moved) {
          setGarantieVoitures((prev) =>
            prev.some((row) => row.id === voitureId)
              ? prev
              : [{ ...moved, statut }, ...prev]
          );
        }
      } else if (statut === "EN_MAINTENANCE_EN_COURS") {
        setGarantieVoitures((prev) =>
          prev.filter((row) => row.id !== voitureId)
        );
        if (moved) {
          setMaintenanceVoitures((prev) =>
            prev.some((row) => row.id === voitureId)
              ? prev
              : [{ ...moved, statut }, ...prev]
          );
        }
      }
      toast.success(
        statut === "EN_TRAITEMENT_EN_COURS"
          ? "Véhicule passé en traitement garantie"
          : "Véhicule passé en maintenance en cours"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAttenteActionKey(null);
    }
  };

  /** Send a warranty-queue vehicle back to the waiting (maintenance) list. */
  const handleRenvoyerEnMaintenance = async (voitureId: string) => {
    if (attenteActionKey) return;
    setAttenteActionKey(`${voitureId}:RENVOYER`);
    try {
      const res = await fetch(`/api/sav/voiture-sav/${voitureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "EN_MAINTENANCE" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Mise à jour impossible");
      }
      const moved =
        garantieVoitures.find((row) => row.id === voitureId) ??
        maintenanceVoitures.find((row) => row.id === voitureId);
      setGarantieVoitures((prev) => prev.filter((row) => row.id !== voitureId));
      setMaintenanceVoitures((prev) =>
        prev.filter((row) => row.id !== voitureId)
      );
      if (moved) {
        setAttenteVoitures((prev) =>
          prev.some((row) => row.id === voitureId)
            ? prev
            : [{ ...moved, statut: "EN_MAINTENANCE" }, ...prev]
        );
      }
      toast.success("Véhicule renvoyé en maintenance");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAttenteActionKey(null);
    }
  };

  /** Send a Sortie-queue vehicle to TESTE (test final). */
  const handleEnvoyerPourTeste = async (voitureId: string) => {
    if (attenteActionKey) return;
    if (
      !window.confirm(
        "Envoyer ce véhicule pour TESTE ? Il quittera la file Sortie."
      )
    ) {
      return;
    }
    setAttenteActionKey(`${voitureId}:TESTE_EN_COURS`);
    try {
      const res = await fetch(`/api/sav/voiture-sav/${voitureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut: "TESTE_EN_COURS",
          deplacementSAV: "TEST_FINAL",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Mise à jour impossible");
      }
      setSortieVoitures((prev) => prev.filter((row) => row.id !== voitureId));
      toast.success("Véhicule envoyé pour TESTE");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAttenteActionKey(null);
    }
  };

  /** Initial load of queues and dossiers. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [load]);

  /** Keep the selected dossier in sync when the current tab’s list changes. */
  useEffect(() => {
    setActiveTab((prev) => pickActive(prev, dossiers));
  }, [dossiers]);

  const [piecesStock, setPiecesStock] = useState<PieceStockOption[]>([]);
  const [sortieOpen, setSortieOpen] = useState(false);
  const [sortieRepId, setSortieRepId] = useState<string | null>(null);
  const [sortieCategorieId, setSortieCategorieId] = useState<string | null>(
    null
  );
  const [sortiePieceId, setSortiePieceId] = useState("");
  const [sortieQty, setSortieQty] = useState("1");
  const [sortieDetailId, setSortieDetailId] = useState("");
  const [sortieReplacePieceId, setSortieReplacePieceId] = useState<string | null>(
    null
  );
  const [sortieSubmitting, setSortieSubmitting] = useState(false);

  /** Refresh spare-parts stock used by the sortie dialog. */
  const loadPieces = useCallback(async () => {
    try {
      const rows = await fetchPiecesStock();
      setPiecesStock(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement pièces");
    }
  }, []);

  /** Load spare-parts stock once for the sortie dialog. */
  useEffect(() => {
    void loadPieces();
  }, [loadPieces]);

  /** Dossier currently targeted by the parts-sortie dialog. */
  const sortieRep = useMemo(
    () =>
      sortieRepId ? allDossiers.find((r) => r.id === sortieRepId) : undefined,
    [allDossiers, sortieRepId]
  );

  /** Diagnostic-line choices for the open sortie dialog (one category). */
  const sortieDetailOptions = useMemo(() => {
    if (!sortieRepId || !sortieCategorieId) return [];
    const rep = allDossiers.find((r) => r.id === sortieRepId);
    if (!rep) return [];
    return buildDetailOptionsForCategory(
      rep,
      sortieCategorieId,
      garantiesOffertCatalog
    );
  }, [allDossiers, sortieRepId, sortieCategorieId, garantiesOffertCatalog]);

  /** Stock row for the part selected in the sortie dialog. */
  const sortieSelectedPiece = useMemo(
    () => piecesStock.find((p) => p.id === sortiePieceId),
    [piecesStock, sortiePieceId]
  );

  const sortieIsEdit = Boolean(sortieReplacePieceId);

  /** Prefill the sortie dialog from an existing issued part, or reset for a new one. */
  const syncPieceStateForDetailRep = useCallback(
    (rep: ReparationMaintenance, detailId: string) => {
      const pieces = findPiecesForDetailRep(rep, detailId);
      const ex = pieces[0];
      if (ex) {
        setSortiePieceId(ex.id);
        setSortieQty(
          String(ex.quantiteSortieDetail > 0 ? ex.quantiteSortieDetail : 1)
        );
        setSortieReplacePieceId(ex.id);
      } else {
        setSortiePieceId("");
        setSortieQty("1");
        setSortieReplacePieceId(null);
      }
    },
    []
  );

  /** Submit a stock sortie (or update an existing one) for the selected diagnostic line. */
  const submitSortieMaintenance = async () => {
    if (!sortieRepId || !sortieCategorieId) return;
    const rep = allDossiers.find((r) => r.id === sortieRepId);
    if (!rep?.voitureSAV?.id) return;
    const opt = sortieDetailOptions.find((o) => o.id === sortieDetailId);
    if (!opt) {
      toast.error("Sélectionnez une ligne de diagnostic.");
      return;
    }
    if (!sortiePieceId) {
      toast.error("Sélectionnez une pièce.");
      return;
    }
    const q = Number(sortieQty.trim());
    if (!Number.isFinite(q) || !Number.isInteger(q) || q <= 0) {
      toast.error("Indiquez une quantité entière strictement positive.");
      return;
    }

    const alloc = sortieReplacePieceId
      ? findPieceByIdRep(rep, sortieReplacePieceId)
      : null;
    const samePieceEdit =
      Boolean(sortieReplacePieceId) &&
      sortiePieceId === sortieReplacePieceId &&
      alloc != null &&
      alloc.id === sortiePieceId;

    if (samePieceEdit && alloc) {
      const delta = q - alloc.quantiteSortieDetail;
      if (
        delta > 0 &&
        sortieSelectedPiece &&
        sortieSelectedPiece.quantite_restante < delta
      ) {
        toast.error(
          `Stock insuffisant pour augmenter la quantité (restant : ${sortieSelectedPiece.quantite_restante}, besoin : +${delta}).`
        );
        return;
      }
    } else if (!sortieSelectedPiece || q > sortieSelectedPiece.quantite_restante) {
      toast.error(
        sortieSelectedPiece
          ? `Stock insuffisant (restant : ${sortieSelectedPiece.quantite_restante}).`
          : "Pièce introuvable."
      );
      return;
    }

    setSortieSubmitting(true);
    try {
      const res = await fetch(`/api/sav/piece-sav/${sortiePieceId}/mouvement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SORTIE",
          quantite: q,
          diagnosticArriveeId: opt.diagnosticArriveeId,
          detailDiagnosticId: opt.id,
          voitureSAVId: rep.voitureSAV.id,
          ...(sortieReplacePieceId
            ? { replacePieceId: sortieReplacePieceId }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Sortie impossible");
      }
      toast.success(
        sortieReplacePieceId
          ? "Sortie de pièce mise à jour."
          : "Sortie de pièce enregistrée."
      );
      setSortieOpen(false);
      setSortieRepId(null);
      setSortieCategorieId(null);
      await Promise.all([load({ silent: true }), loadPieces()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSortieSubmitting(false);
    }
  };

  /** Seed per-category maintenance forms from existing Maintenance rows on a dossier. */
  const initFormsForRep = useCallback((rep: ReparationMaintenance) => {
    const blocks = buildCategoryBlocks(rep);
    const next: Record<string, FormFields> = {};
    for (const b of blocks) {
      const m = rep.Maintenance?.find(
        (x) => x.catergorieDiagnosticId === b.id
      );
      next[b.id] = {
        nom: m?.nom ?? "",
        description: m?.description ?? "",
        duree_maintenance: m?.duree_maintenance ?? "",
        prix_maintenance:
          m?.prix_maintenance != null && m.prix_maintenance !== ""
            ? String(m.prix_maintenance)
            : "",
      };
    }
    setFormsByRepCat((prev) => ({ ...prev, [rep.id]: next }));
  }, []);

  /** Initialize maintenance forms when the active dossier has none yet. */
  useEffect(() => {
    const rep = allDossiers.find((r) => r.id === activeTab);
    if (!rep) return;
    if (!formsByRepCat[rep.id]) {
      initFormsForRep(rep);
    }
  }, [activeTab, allDossiers, formsByRepCat, initFormsForRep]);

  /** Send the dossier’s vehicle to SORTIE_MAINTENANCE (Sortie tab). */
  const handleTerminerMaintenance = async (repId: string) => {
    const dossier = allDossiers.find((r) => r.id === repId);
    if (!dossier) return;

    if (dossier.kind !== "garantie") {
      const resGet = await fetch(`/api/sav/reparation/${repId}`);
      const jsonGet = await resGet.json();
      if (!resGet.ok || !jsonGet.success || !jsonGet.data) {
        toast.error(jsonGet.error || "Chargement de la réparation impossible");
        return;
      }
      const snap = jsonGet.data as {
        horaire_travail_prix: unknown;
        horaire_travail_duration: string | null;
        Maintenance: MaintenanceRow[];
        DetailDiagnostic: {
          nom: string;
          garantieSAVId?: string | null;
          catergorieDiagnosticId: string | null;
        }[];
        voitureSAV?: {
          StatutGarantie?: string | null;
          GarantieSAV?: GarantieOffertMatch[];
        };
      };
      const unlocked = filterUnlockedDetails(
        snap.voitureSAV?.StatutGarantie ?? dossier.voitureSAV.StatutGarantie,
        snap.DetailDiagnostic,
        snap.voitureSAV?.GarantieSAV ?? dossier.voitureSAV.GarantieSAV,
        garantiesOffertCatalog
      );
      const check = validateTerminerMaintenance(
        {
          horaire_travail_prix: snap.horaire_travail_prix,
          horaire_travail_duration: snap.horaire_travail_duration,
        },
        snap.Maintenance,
        unlocked.map((d) => d.catergorieDiagnosticId)
      );
      if (!check.ok) {
        toast.error(check.error);
        return;
      }
    }

    if (
      !window.confirm(
        "Envoyer ce véhicule en sortie ? Il quittera la file maintenance."
      )
    ) {
      return;
    }

    const voitureId = dossier.voitureSAV.id;
    setFinishingRepId(repId);
    try {
      const res = await fetch(`/api/sav/voiture-sav/${voitureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut: "EN_MAINTENANCE_FINI",
          deplacementSAV: "SORTIE_MAINTENANCE",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Mise à jour impossible");
      }
      toast.success("Véhicule envoyé en sortie");
      setReparations((prev) => prev.filter((r) => r.id !== repId));
      setGaranties((prev) => prev.filter((r) => r.id !== repId));
      await load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setFinishingRepId(null);
    }
  };

  const queueMeta = {
    attente: {
      title: "Attente",
      subtitle:
        "Véhicules au statut « en maintenance », prêts à être dispatchés en atelier.",
      emptyTitle: "Aucun véhicule en attente",
      emptyBody:
        "Les véhicules SAV au statut EN_MAINTENANCE s’affichent ici sous forme de cartes.",
    },
    maintenance: {
      title: "Maintenance SAV",
      subtitle:
        "Véhicules au statut « maintenance en cours », affichés sous forme de cartes.",
      emptyTitle: "Aucun véhicule en maintenance",
      emptyBody:
        "Les véhicules SAV au statut EN_MAINTENANCE_EN_COURS s’affichent ici sous forme de cartes.",
    },
    garantie: {
      title: "Garantie SAV",
      subtitle:
        "Véhicules au statut « traitement en cours », affichés sous forme de cartes.",
      emptyTitle: "Aucun véhicule en garantie SAV",
      emptyBody:
        "Les véhicules SAV aux statuts EN_TRAITEMENT_EN_COURS et FIN_INTERVENTION_GARANTIESAV_EN_COURS s’affichent ici sous forme de cartes.",
    },
    sortie: {
      title: "Sortie",
      subtitle:
        "Véhicules prêts à quitter l’atelier, affichés sous forme de cartes.",
      emptyTitle: "Aucun véhicule en sortie",
      emptyBody:
        "Les véhicules SAV au déplacement SORTIE_MAINTENANCE s’affichent ici sous forme de cartes.",
    },
  }[queueTab];

  const activeQueue = QUEUE_TABS.find((t) => t.value === queueTab)!;
  const ActiveQueueIcon = activeQueue.icon;
  const activeDossier = dossiers.find((r) => r.id === activeTab);
  const activeTerminerVal = activeDossier
    ? getTerminerValidation(activeDossier, garantiesOffertCatalog)
    : { ok: true as const };
  const showMobileFinishBar = false;
  const queueCount =
    queueTab === "attente"
      ? attenteVoitures.length
      : queueTab === "garantie"
        ? garantieVoitures.length
        : queueTab === "sortie"
          ? sortieVoitures.length
          : queueTab === "maintenance"
            ? maintenanceVoitures.length
            : dossiers.length;

  return (
    <div
      className={cn(
        "relative min-h-[calc(100vh-4rem)] bg-[#f3f6fa]",
        showMobileFinishBar
          ? "pb-[max(7.25rem,calc(5.75rem+env(safe-area-inset-bottom)))] sm:pb-12"
          : "pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-12"
      )}
    >
      <Dialog
        open={sortieOpen}
        onOpenChange={(open) => {
          setSortieOpen(open);
          if (!open) {
            setSortieRepId(null);
            setSortieCategorieId(null);
          }
        }}
      >
        <DialogContent className="flex max-h-[min(92dvh,calc(100dvh-1rem))] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:bg-slate-100/90 [&_[data-slot=dialog-close]]:hover:bg-slate-200/90">
          <div
            className="h-1 shrink-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"
            aria-hidden
          />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
            <div className="p-4 pb-3 pt-4 sm:p-6 sm:pb-4 sm:pt-5">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex gap-3 pr-8 sm:gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-600/20 ring-1 ring-white/20 sm:h-11 sm:w-11">
                    <Package className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                    <DialogTitle className="text-left text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                      {sortieIsEdit
                        ? "Modifier la sortie de pièce"
                        : "Sortie de pièce"}
                    </DialogTitle>
                    <DialogDescription className="text-left text-sm leading-relaxed text-slate-600">
                      {sortieIsEdit
                        ? "Changez la référence ou la quantité : le stock est recalculé automatiquement."
                        : "Choisissez la pièce en stock, la quantité et la ligne de diagnostic de cette catégorie."}
                    </DialogDescription>
                  </div>
                </div>
                {sortieRep && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 text-xs text-slate-700 ring-1 ring-slate-950/[0.04]">
                    <Car className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                    <span className="font-medium text-slate-800">
                      {sortieRep.voitureSAV.model}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-[11px] font-semibold tracking-tight text-slate-700">
                      {sortieRep.voitureSAV.immatriculation}
                    </span>
                  </div>
                )}
              </DialogHeader>
            </div>

            <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/90 to-slate-50 px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-4 sm:gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="piece-sav-maint"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <Package className="h-3.5 w-3.5 text-teal-600" />
                    Pièce en stock
                  </Label>
                  <Select value={sortiePieceId} onValueChange={setSortiePieceId}>
                    <SelectTrigger
                      id="piece-sav-maint"
                      className="h-11 w-full border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color] hover:border-slate-300 focus:ring-teal-500/20"
                    >
                      <SelectValue placeholder="Choisir une pièce…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(280px,50vh)]">
                      {piecesStock.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-medium">{p.nom}</span>
                          {p.part_code ? (
                            <span className="text-slate-500"> ({p.part_code})</span>
                          ) : null}
                          <span className="text-slate-500">
                            {" "}
                            — restant : {p.quantite_restante}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {sortieSelectedPiece && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="inline-flex rounded-md bg-white px-1.5 py-0.5 font-medium text-teal-800 ring-1 ring-teal-200/80">
                        Stock restant : {sortieSelectedPiece.quantite_restante}
                      </span>
                      {sortieSelectedPiece.model_voiture && (
                        <span className="text-slate-500">
                          · {sortieSelectedPiece.model_voiture}
                        </span>
                      )}
                    </p>
                  )}
                  {piecesStock.length === 0 && (
                    <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      Aucune pièce en stock — ajoutez des références dans la gestion
                      SAV.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="qty-sortie-maint"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <Hash className="h-3.5 w-3.5 text-teal-600" />
                    Quantité sortie
                  </Label>
                  <Input
                    id="qty-sortie-maint"
                    type="number"
                    min={1}
                    step={1}
                    value={sortieQty}
                    onChange={(e) => setSortieQty(e.target.value)}
                    className="h-11 w-full border-slate-200 bg-white font-medium shadow-sm tabular-nums focus-visible:ring-teal-500/25 sm:max-w-[140px]"
                    inputMode="numeric"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="detail-dx-maint"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <ListChecks className="h-3.5 w-3.5 text-teal-600" />
                    Ligne de diagnostic
                  </Label>
                  <Select
                    value={sortieDetailId}
                    onValueChange={(id) => {
                      setSortieDetailId(id);
                      if (!sortieRep) return;
                      syncPieceStateForDetailRep(sortieRep, id);
                    }}
                  >
                    <SelectTrigger
                      id="detail-dx-maint"
                      className="h-11 w-full border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color] hover:border-slate-300 focus:ring-teal-500/20"
                    >
                      <SelectValue placeholder="Sélectionner une ligne…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(280px,50vh)]">
                      {sortieDetailOptions.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t border-slate-200/90 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4 supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-slate-200 sm:h-10 sm:w-auto sm:min-w-[100px]"
              onClick={() => setSortieOpen(false)}
              disabled={sortieSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="h-11 w-full min-w-0 bg-gradient-to-r from-teal-600 to-emerald-600 font-semibold text-white shadow-md transition-[box-shadow,filter] hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg disabled:opacity-60 sm:h-10 sm:w-auto sm:min-w-[160px]"
              onClick={() => void submitSortieMaintenance()}
              disabled={
                sortieSubmitting ||
                sortieDetailOptions.length === 0 ||
                piecesStock.length === 0
              }
            >
              {sortieSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : sortieIsEdit ? (
                "Enregistrer"
              ) : (
                "Valider la sortie"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-6xl space-y-3 px-3 pt-3 sm:space-y-5 sm:px-4 sm:pt-5 lg:px-6">
        <section
          className={cn(
            "relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br text-white shadow-[0_18px_44px_-18px_rgba(15,23,42,0.45)] sm:rounded-3xl",
            activeQueue.hero
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(255,255,255,0.2),transparent)]" />
          <div
            className={cn(
              "absolute -right-20 -bottom-16 h-48 w-48 rounded-full blur-3xl sm:h-72 sm:w-72",
              activeQueue.glow
            )}
          />
          <div className="relative px-4 py-5 sm:px-8 sm:py-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm sm:h-9 sm:w-9">
                    <ActiveQueueIcon className="h-4 w-4 text-white" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]",
                      activeQueue.kicker
                    )}
                  >
                    Atelier SAV
                  </span>
                  {!loading && (
                    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white ring-1 ring-white/20 sm:px-3 sm:py-1 sm:text-xs">
                      {queueCount} véhicule
                      {queueCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-[1.55rem] font-bold leading-tight tracking-tight sm:mt-4 sm:text-3xl lg:text-[2.05rem]">
                  {queueMeta.title}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/85 sm:mt-2 sm:text-[15px]">
                  {queueMeta.subtitle}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 gap-2 bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 hover:text-white"
                disabled={refreshing}
                onClick={() => void load({ silent: true })}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
            </div>
          </div>
        </section>

        <nav
          className="sticky top-16 z-30 -mx-3 border-b border-slate-200/70 bg-[#f3f6fa]/92 px-3 py-2 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
          aria-label="Files atelier"
        >
          <div
            role="tablist"
            className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200/80"
          >
            {QUEUE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = queueTab === tab.value;
              const count =
                tab.value === "attente"
                  ? attenteVoitures.length
                  : tab.value === "garantie"
                    ? garantieVoitures.length
                    : tab.value === "sortie"
                      ? sortieVoitures.length
                      : tab.value === "maintenance"
                        ? maintenanceVoitures.length
                        : reparations.length;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setQueueTab(tab.value)}
                  className={cn(
                    "relative flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2 text-center transition sm:min-h-[3.35rem] sm:flex-row sm:justify-start sm:gap-2.5 sm:px-3",
                    isActive
                      ? tab.activeBtn
                      : "text-slate-500 active:bg-slate-50 sm:hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8",
                      isActive ? "bg-white/15 text-white" : tab.iconBg
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>
                  <span className="min-w-0 sm:text-left">
                    <span className="block truncate text-[11px] font-semibold leading-tight sm:text-sm">
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                    <span
                      className={cn(
                        "hidden truncate text-[11px] sm:block",
                        isActive ? "text-white/70" : "text-slate-400"
                      )}
                    >
                      {tab.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "absolute right-1.5 top-1 min-w-[1.15rem] rounded-full px-1 text-[10px] font-bold tabular-nums leading-4 sm:static sm:ml-auto sm:min-w-[1.5rem] sm:px-2 sm:py-0.5 sm:text-xs sm:leading-5",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {loading ? "·" : count}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 shadow-inner ring-1 ring-teal-200/60">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
              <div className="absolute -inset-3 animate-pulse rounded-[1.35rem] bg-gradient-to-r from-teal-400/25 to-emerald-500/25 blur-2xl" />
            </div>
            <p className="mt-7 text-sm font-medium tracking-tight text-slate-600">
              Chargement des dossiers
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Connexion à l&apos;atelier et récupération des files…
            </p>
          </div>
        ) : queueTab === "attente" ? (
          attenteVoitures.length === 0 ? (
            <EmptyWorkshopState
              icon={Clock}
              title={queueMeta.emptyTitle}
              body={queueMeta.emptyBody}
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {attenteVoitures.map((v) => {
                const hasChassisGarantie = hasVoitureSavGarantieByChassis(v);
                const hideProfiter =
                  v.StatutGarantie === "GARANTIESAV_TERMINE";
                return (
                <VoitureSavQueueCard
                  key={v.id}
                  v={v}
                  catalog={garantiesOffertCatalog}
                  tone="amber"
                  statutLabel="En attente"
                  statutClassName="border-amber-200 bg-amber-100 font-medium text-amber-900 hover:bg-amber-100"
                  footer={
                    <div
                      className={cn(
                        "grid gap-2",
                        hideProfiter
                          ? "grid-cols-1"
                          : "grid-cols-1 sm:grid-cols-2"
                      )}
                    >
                      {hideProfiter ? null : (
                        <Button
                          type="button"
                          disabled={
                            Boolean(attenteActionKey) || !hasChassisGarantie
                          }
                          title={
                            hasChassisGarantie
                              ? undefined
                              : "Pas de garantie sur cette voiture"
                          }
                          onClick={() =>
                            void handleAttenteStatut(
                              v.id,
                              "EN_TRAITEMENT_EN_COURS"
                            )
                          }
                          className="h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
                        >
                          {attenteActionKey ===
                          `${v.id}:EN_TRAITEMENT_EN_COURS` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Gift className="h-4 w-4" />
                          )}
                          Profiter garantie
                        </Button>
                      )}
                      <Button
                        type="button"
                        disabled={Boolean(attenteActionKey)}
                        onClick={() =>
                          void handleAttenteStatut(
                            v.id,
                            "EN_MAINTENANCE_EN_COURS"
                          )
                        }
                        className="h-11 gap-2 bg-teal-700 text-white hover:bg-teal-800"
                      >
                        {attenteActionKey ===
                        `${v.id}:EN_MAINTENANCE_EN_COURS` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wrench className="h-4 w-4" />
                        )}
                        Maintenance
                      </Button>
                    </div>
                  }
                />
                );
              })}
            </div>
          )
        ) : queueTab === "garantie" ? (
          garantieVoitures.length === 0 ? (
            <EmptyWorkshopState
              icon={ShieldCheck}
              title={queueMeta.emptyTitle}
              body={queueMeta.emptyBody}
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {garantieVoitures.map((v) => {
                const hideProceder = isGarantieQuotaReached(
                  v,
                  garantiesOffertCatalog
                );
                return (
                <VoitureSavQueueCard
                  key={v.id}
                  v={v}
                  catalog={garantiesOffertCatalog}
                  tone="rose"
                  statutLabel={
                    v.statut === "FIN_INTERVENTION_GARANTIESAV_EN_COURS"
                      ? "Fin intervention garantie"
                      : "Traitement en cours"
                  }
                  statutClassName={
                    v.statut === "FIN_INTERVENTION_GARANTIESAV_EN_COURS"
                      ? "border-pink-200 bg-pink-100 font-medium text-pink-900 hover:bg-pink-100"
                      : "border-rose-200 bg-rose-100 font-medium text-rose-900 hover:bg-rose-100"
                  }
                  clickableDetails
                  footer={
                    <div
                      className={cn(
                        "grid gap-2",
                        hideProceder
                          ? "grid-cols-1"
                          : "grid-cols-1 sm:grid-cols-2"
                      )}
                    >
                      {hideProceder ? null : (
                        <Button
                          asChild
                          className="h-11 gap-2 bg-rose-700 text-white hover:bg-rose-800"
                        >
                          <Link href={`/sav/maintenance/${v.id}`}>
                            Procéder
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        type="button"
                        disabled={Boolean(attenteActionKey)}
                        onClick={() =>
                          void handleAttenteStatut(
                            v.id,
                            "EN_MAINTENANCE_EN_COURS"
                          )
                        }
                        variant="outline"
                        className="h-11 gap-2 border-teal-300 bg-white text-teal-800 hover:bg-teal-50"
                      >
                        {attenteActionKey ===
                        `${v.id}:EN_MAINTENANCE_EN_COURS` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Undo2 className="h-4 w-4" />
                        )}
                        Renvoyer en Maintenance
                      </Button>
                    </div>
                  }
                />
                );
              })}
            </div>
          )
        ) : queueTab === "sortie" ? (
          sortieVoitures.length === 0 ? (
            <EmptyWorkshopState
              icon={DoorOpen}
              title={queueMeta.emptyTitle}
              body={queueMeta.emptyBody}
            />
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {sortieVoitures.map((v) => (
                <VoitureSavQueueCard
                  key={v.id}
                  v={v}
                  catalog={garantiesOffertCatalog}
                  tone="teal"
                  statutLabel="Sortie maintenance"
                  statutClassName="border-sky-200 bg-sky-100 font-medium text-sky-900 hover:bg-sky-100"
                  footer={
                    <Button
                      type="button"
                      disabled={Boolean(attenteActionKey)}
                      onClick={() => void handleEnvoyerPourTeste(v.id)}
                      className="h-11 w-full gap-2 bg-sky-700 text-white hover:bg-sky-800"
                    >
                      {attenteActionKey === `${v.id}:TESTE_EN_COURS` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FlaskConical className="h-4 w-4" />
                      )}
                      Envoyer la voiture pour TESTE
                    </Button>
                  }
                />
              ))}
            </div>
          )
        ) : maintenanceVoitures.length === 0 ? (
          <EmptyWorkshopState
            icon={Wrench}
            title={queueMeta.emptyTitle}
            body={queueMeta.emptyBody}
          />
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {maintenanceVoitures.map((v) => (
              <VoitureSavQueueCard
                key={v.id}
                v={v}
                catalog={garantiesOffertCatalog}
                tone="teal"
                statutLabel="Maintenance en cours"
                statutClassName="border-teal-200 bg-teal-100 font-medium text-teal-900 hover:bg-teal-100"
                footer={
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      asChild
                      className="h-11 gap-2 bg-teal-700 text-white hover:bg-teal-800"
                    >
                      <Link href={`/sav/maintenance/tabMaintenance/${v.id}`}>
                        <Wrench className="h-4 w-4" />
                        Réparation
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      disabled={Boolean(attenteActionKey)}
                      onClick={() => void handleRenvoyerEnMaintenance(v.id)}
                      variant="outline"
                      className="h-11 gap-2 border-amber-300 bg-white text-amber-900 hover:bg-amber-50"
                    >
                      {attenteActionKey === `${v.id}:RENVOYER` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Undo2 className="h-4 w-4" />
                      )}
                      Renvoyer en Attente
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {showMobileFinishBar && activeDossier ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden supports-[padding:max(0px)]:pb-[max(0.7rem,env(safe-area-inset-bottom))]">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="truncate font-medium text-slate-700">
              {clientName(activeDossier)}
            </span>
            <span className="shrink-0 font-mono">
              {activeDossier.voitureSAV.immatriculation}
            </span>
          </div>
          <Button
            type="button"
            className="h-11 w-full gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            disabled={
              finishingRepId === activeDossier.id || !activeTerminerVal.ok
            }
            onClick={() => void handleTerminerMaintenance(activeDossier.id)}
          >
            {finishingRepId === activeDossier.id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement…
              </>
            ) : (
              <>
                <CircleCheck className="h-4 w-4" />
                Envoyer en Sortie
              </>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
