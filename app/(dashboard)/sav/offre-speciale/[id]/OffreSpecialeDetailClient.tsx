"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  ArrowLeft,
  ClipboardList,
  Cog,
  Copy,
  DoorOpen,
  Gauge,
  Gift,
  Loader2,
  Lock,
  Palette,
  Phone,
  Plus,
  ScanLine,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DetailDiagnostic {
  id: string;
  nom: string;
  description?: string | null;
}

interface DiagnosticArrivee {
  id: string;
  catergorieDiagnostic?: { nom?: string } | null;
  DetailDiagnostic?: DetailDiagnostic[];
}

interface GroupePersonnel {
  id: string;
  nom: string;
}

interface GarantieLink {
  id: string;
  statut: string;
  nom_garantie?: string | null;
  quantite_garantie_offert?: number | null;
  voitureSAVId?: string | null;
  groupePersonnelSAV?: GroupePersonnel | null;
}

interface DiagnosticOffert {
  id: string;
  libelle: string;
  date_activation: string;
  date_fin: string;
  voitureSAVId?: string | null;
  interventionDiagnosticOffertId?: string | null;
}

interface PieceStock {
  id: string;
  nom: string;
  part_code?: string | null;
  model_voiture?: string | null;
  quantite_restante: number;
  quantite_sortie: number;
  interventionDiagnosticOffertId?: string | null;
}

interface InterventionPiece {
  id: string;
  nom: string;
  quantite_sortie: number;
  part_code?: string | null;
}

interface InterventionRow {
  id: string;
  niveau_Intervention: number;
  typeProduitUtilise: string;
  detailDiagnosticId?: string | null;
  PieceSAV?: InterventionPiece[];
}

interface InterventionDraft {
  key: string;
  pieceSAVId: string;
  quantite: string;
}

interface VoitureDetail {
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
  diagnosticArrivee?: DiagnosticArrivee[];
  GarantieSAV?: GarantieLink[];
}

const MOTORISATION_LABELS: Record<string, string> = {
  ELECTRIQUE: "Électrique",
  ESSENCE: "Essence",
  DIESEL: "Diesel",
  HYBRIDE: "Hybride",
};

const TRANSMISSION_LABELS: Record<string, string> = {
  AUTOMATIQUE: "Automatique",
  MANUEL: "Manuelle",
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

function statutLabel(statut: string) {
  if (statut === "GARANTIESAV_EN_COURS") return "Garantie en cours";
  if (statut === "GARANTIESAV_TERMINE") return "Garantie terminée";
  return statut;
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

function formatDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normalizeLibelle(value: string) {
  return value.trim().toLowerCase();
}

/** Tokens from GarantieSAV.nom_garantie (exact, line-by-line, and "catégorie — nom"). */
function garantieNameTokens(nom_garantie?: string | null): string[] {
  if (!nom_garantie?.trim()) return [];
  const keys = new Set<string>();
  for (const line of nom_garantie.split(/[\n;]+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    keys.add(normalizeLibelle(trimmed));
    for (const part of trimmed.split(/\s+[—–\-]\s+/)) {
      const token = normalizeLibelle(part);
      if (token) keys.add(token);
    }
  }
  return [...keys];
}

function detailMatchesGarantie(
  nom: string,
  garanties: GarantieLink[] | undefined,
): boolean {
  return Boolean(findGarantieForDetail(nom, garanties));
}

function findGarantieForDetail(
  nom: string,
  garanties: GarantieLink[] | undefined,
): GarantieLink | null {
  const key = normalizeLibelle(nom);
  if (!key) return null;
  const list = (garanties ?? []).filter((g) => g.statut !== "ANNULE");
  const exact = list.find(
    (g) => normalizeLibelle(g.nom_garantie ?? "") === key,
  );
  if (exact) return exact;
  return (
    list.find((g) => garantieNameTokens(g.nom_garantie).includes(key)) ?? null
  );
}

function garantieQuota(garantie: GarantieLink | null): number | null {
  if (!garantie) return null;
  const q = garantie.quantite_garantie_offert;
  if (q == null || !Number.isFinite(Number(q))) return null;
  return Math.trunc(Number(q));
}

function quotaForDetail(
  nom: string,
  vehicleGaranties: GarantieLink[] | undefined,
  catalogGaranties: GarantieLink[] | undefined,
): number | null {
  const fromVehicle = garantieQuota(
    findGarantieForDetail(nom, vehicleGaranties),
  );
  if (fromVehicle != null) return fromVehicle;
  return garantieQuota(findGarantieForDetail(nom, catalogGaranties));
}

function groupeEnCharge(v: VoitureDetail) {
  const active = (v.GarantieSAV ?? []).filter((g) => g.statut !== "ANNULE");
  return active.find((g) => g.groupePersonnelSAV)?.groupePersonnelSAV ?? null;
}

function interventionCountLabel(count: number, quota?: number | null) {
  const word = count > 1 ? "interventions" : "intervention";
  if (quota != null) return `${count}/${quota} ${word}`;
  return `${count} ${word}`;
}

type ApiJson = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

async function fetchJson(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 1,
): Promise<{ res: Response; json: ApiJson | null }> {
  const res = await fetch(input, init);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    if (retries > 0 && (res.status === 404 || res.status >= 500)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchJson(input, init, retries - 1);
    }
    return { res, json: null };
  }
  try {
    return { res, json: (await res.json()) as ApiJson };
  } catch {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchJson(input, init, retries - 1);
    }
    return { res, json: null };
  }
}

function LicensePlate({ immat }: { immat: string }) {
  return (
    <div className="flex w-full overflow-hidden rounded-xl border-2 border-slate-800 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="flex w-11 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-rose-600 to-rose-700 text-white sm:w-12">
        <span className="text-[8px] font-black leading-none tracking-wide">
          CI
        </span>
        <span className="mt-0.5 text-[9px] font-bold leading-none">SAV</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center bg-gradient-to-b from-white to-slate-100 px-3 py-3 sm:py-3.5">
        <span className="truncate font-mono text-base font-black tracking-[0.18em] text-slate-900 sm:text-xl sm:tracking-[0.22em]">
          {immat}
        </span>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-11 w-36 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-44 animate-pulse rounded-[1.35rem] bg-gradient-to-br from-slate-800 to-rose-950 sm:h-52" />
        <div className="grid gap-3 lg:grid-cols-5">
          <div className="h-56 animate-pulse rounded-3xl bg-white lg:col-span-3" />
          <div className="h-56 animate-pulse rounded-3xl bg-white lg:col-span-2" />
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  );
}

export default function OffreSpecialeDetailClient({ id }: { id: string }) {
  const [voiture, setVoiture] = useState<VoitureDetail | null>(null);
  const [offers, setOffers] = useState<DiagnosticOffert[]>([]);
  const [pieces, setPieces] = useState<PieceStock[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [catalogGaranties, setCatalogGaranties] = useState<GarantieLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDetailId, setOpenDetailId] = useState("");
  const [draftsByDetail, setDraftsByDetail] = useState<
    Record<string, InterventionDraft[]>
  >({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [
        voitureResult,
        offersResult,
        piecesResult,
        interventionsResult,
        garantiesResult,
      ] = await Promise.all([
          fetchJson(`/api/sav/voiture-sav/${id}`),
          fetchJson(`/api/sav/diagnostic-offert?voitureSAVId=${id}&active=1`),
          fetchJson("/api/sav/piece-sav"),
          fetchJson(
            `/api/sav/intervention-diagnostic-offert?voitureSAVId=${id}`,
          ),
          fetchJson("/api/sav/garantie-sav"),
        ]);

      const voitureJson = voitureResult.json;
      if (!voitureResult.res.ok || !voitureJson?.success) {
        throw new Error(voitureJson?.error || "Véhicule introuvable");
      }
      setVoiture(voitureJson.data as VoitureDetail);
      setOffers(
        offersResult.res.ok && offersResult.json?.success
          ? ((offersResult.json.data || []) as DiagnosticOffert[])
          : [],
      );
      const allPieces = (
        piecesResult.res.ok && piecesResult.json?.success
          ? piecesResult.json.data || []
          : []
      ) as PieceStock[];
      setPieces(allPieces.filter((p) => !p.interventionDiagnosticOffertId));
      setInterventions(
        interventionsResult.res.ok && interventionsResult.json?.success
          ? ((interventionsResult.json.data || []) as InterventionRow[])
          : [],
      );
      const allGaranties = (
        garantiesResult.res.ok && garantiesResult.json?.success
          ? garantiesResult.json.data || []
          : []
      ) as GarantieLink[];
      setCatalogGaranties(allGaranties.filter((g) => !g.voitureSAVId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement");
      if (!opts?.silent) {
        setVoiture(null);
        setOffers([]);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Map DetailDiagnostic.nom → DiagnosticOffert (by libelle), used to start an intervention. */
  const offerByLibelle = useMemo(() => {
    const map = new Map<string, DiagnosticOffert>();
    for (const offer of offers) {
      if (offer.interventionDiagnosticOffertId) continue;
      const key = normalizeLibelle(offer.libelle);
      if (!key || map.has(key)) continue;
      map.set(key, offer);
    }
    return map;
  }, [offers]);

  const findOfferForDetail = (nom: string) => {
    const key = normalizeLibelle(nom);
    const exact = offerByLibelle.get(key);
    if (exact) return exact;
    return (
      offers.find((offer) => {
        if (offer.interventionDiagnosticOffertId) return false;
        return garantieNameTokens(offer.libelle).includes(key);
      }) ?? null
    );
  };

  const isDetailActive = (nom: string) =>
    detailMatchesGarantie(nom, voiture?.GarantieSAV);

  const currentDetailIds = useMemo(() => {
    const ids = new Set<string>();
    for (const da of voiture?.diagnosticArrivee ?? []) {
      for (const d of da.DetailDiagnostic ?? []) ids.add(d.id);
    }
    return ids;
  }, [voiture?.diagnosticArrivee]);

  const savedForDetail = (detailId: string, nom?: string) =>
    interventions
      .filter((i) => {
        if (i.detailDiagnosticId === detailId) return true;
        if (i.detailDiagnosticId && currentDetailIds.has(i.detailDiagnosticId)) {
          return false;
        }
        if (!nom) return false;
        return (
          normalizeLibelle(i.typeProduitUtilise) === normalizeLibelle(nom)
        );
      })
      .sort((a, b) => a.niveau_Intervention - b.niveau_Intervention);

  const ensureDraft = (detailId: string, nom?: string) => {
    setDraftsByDetail((prev) => {
      if (prev[detailId]?.length) return prev;
      const saved = savedForDetail(detailId, nom);
      const quota = nom
        ? quotaForDetail(nom, voiture?.GarantieSAV, catalogGaranties)
        : null;
      if (quota != null && saved.length >= quota) return prev;
      if (saved.length > 0) return prev;
      return {
        ...prev,
        [detailId]: [{ key: crypto.randomUUID(), pieceSAVId: "", quantite: "1" }],
      };
    });
  };

  const addDraft = (detailId: string, nom?: string) => {
    setDraftsByDetail((prev) => {
      const savedCount = savedForDetail(detailId, nom).length;
      const quota = nom
        ? quotaForDetail(nom, voiture?.GarantieSAV, catalogGaranties)
        : null;
      if (quota != null && savedCount >= quota) return prev;
      const current =
        prev[detailId] ??
        (savedCount === 0
          ? [{ key: `init-${detailId}`, pieceSAVId: "", quantite: "1" }]
          : []);
      return {
        ...prev,
        [detailId]: [
          ...current,
          { key: crypto.randomUUID(), pieceSAVId: "", quantite: "1" },
        ],
      };
    });
  };

  const updateDraft = (
    detailId: string,
    key: string,
    patch: Partial<InterventionDraft>,
  ) => {
    setDraftsByDetail((prev) => {
      const current = prev[detailId] ?? [
        { key, pieceSAVId: "", quantite: "1" },
      ];
      return {
        ...prev,
        [detailId]: current.map((d) =>
          d.key === key ? { ...d, ...patch } : d,
        ),
      };
    });
  };

  const handleSaveIntervention = async (opts: {
    detail: DetailDiagnostic;
    diagnosticArriveeId: string;
    draft: InterventionDraft;
    niveau: number;
  }) => {
    if (!voiture) return;
    const quota = quotaForDetail(
      opts.detail.nom,
      voiture.GarantieSAV,
      catalogGaranties,
    );
    const already = savedForDetail(opts.detail.id, opts.detail.nom).length;
    if (quota != null && already >= quota) {
      toast.error(`Quantité de garantie atteinte (${already}/${quota})`);
      return;
    }
    const qty = parseInt(opts.draft.quantite, 10);
    if (!opts.draft.pieceSAVId) {
      toast.error("Choisissez une pièce SAV");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("La quantité sortie doit être un entier positif");
      return;
    }
    const piece = pieces.find((p) => p.id === opts.draft.pieceSAVId);
    if (piece && qty > piece.quantite_restante) {
      toast.error(`Stock insuffisant (restant : ${piece.quantite_restante})`);
      return;
    }

    const offer = findOfferForDetail(opts.detail.nom);
    setSavingKey(opts.draft.key);
    try {
      const { res, json } = await fetchJson(
        "/api/sav/intervention-diagnostic-offert",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            voitureSAVId: voiture.id,
            pieceSAVId: opts.draft.pieceSAVId,
            quantite_sortie: qty,
            niveau_Intervention: opts.niveau,
            detailDiagnosticId: opts.detail.id,
            diagnosticArriveeId: opts.diagnosticArriveeId,
            diagnosticOffertId: offer?.id,
            typeProduitUtilise: opts.detail.nom,
            groupePersonnelSAVId: groupeEnCharge(voiture)?.id,
          }),
        },
      );
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Erreur intervention");
      }
      toast.success(`Intervention N° ${opts.niveau} enregistrée`);
      setDraftsByDetail((prev) => ({
        ...prev,
        [opts.detail.id]: (prev[opts.detail.id] ?? []).filter(
          (d) => d.key !== opts.draft.key,
        ),
      }));
      await load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur intervention");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <PageSkeleton />;

  if (!voiture) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 ring-1 ring-rose-500/15">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-xl font-black tracking-tight text-slate-900">
          Véhicule introuvable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Ce dossier n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Button
          asChild
          className="mt-6 h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 font-bold shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:to-pink-700"
        >
          <Link href="/sav/offre-speciale">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l&apos;offre spéciale
          </Link>
        </Button>
      </div>
    );
  }

  const client =
    [voiture.ClientSAV?.prenom, voiture.ClientSAV?.nom]
      .filter(Boolean)
      .join(" ") || "Client non renseigné";
  const contact = voiture.ClientSAV?.contact?.trim() || "";
  const enCours = voiture.statut === "GARANTIESAV_EN_COURS";
  const diagnostics = voiture.diagnosticArrivee ?? [];
  const findingCount = diagnostics.reduce(
    (n, da) => n + (da.DetailDiagnostic?.length ?? 0),
    0,
  );
  const offeredCount = diagnostics.reduce((n, da) => {
    return (
      n +
      (da.DetailDiagnostic ?? []).filter((d) => isDetailActive(d.nom)).length
    );
  }, 0);
  const interventionTotal = diagnostics.reduce((n, da) => {
    return (
      n +
      (da.DetailDiagnostic ?? []).reduce(
        (sum, d) => sum + savedForDetail(d.id, d.nom).length,
        0,
      )
    );
  }, 0);
  const hex = colorHex(voiture.couleur);
  const date = formatDate(voiture.createdAt);
  const groupe = groupeEnCharge(voiture);

  const copyChassis = async () => {
    try {
      await navigator.clipboard.writeText(voiture.chassisNumber);
      toast.success("N° châssis copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.07),_transparent_55%)] pb-[max(6.25rem,calc(5rem+env(safe-area-inset-bottom)))] sm:pb-10">
      <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-4 sm:py-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 bg-white/80 px-3 font-semibold shadow-sm backdrop-blur-sm sm:px-4"
          >
            <Link href="/sav/offre-speciale">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Offre spéciale</span>
            </Link>
          </Button>
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
            Dossier garantie
          </p>
        </div>

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
          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-200 ring-1 ring-white/15">
                  <Sparkles className="h-3.5 w-3.5" />
                  Offre spéciale
                </div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {voiture.model}
                </h1>
                <p className="flex items-center gap-1.5 text-sm text-slate-300">
                  <User className="h-4 w-4 shrink-0 text-rose-300" />
                  <span className="truncate font-medium">{client}</span>
                </p>
              </div>
              <Badge
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold",
                  enCours
                    ? "bg-emerald-500 text-white hover:bg-emerald-500"
                    : "bg-white/15 text-white hover:bg-white/15",
                )}
              >
                {statutLabel(voiture.statut)}
              </Badge>
            </div>
            {date && (
              <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Dossier du {date}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg bg-white/10 px-2.5 py-1 font-semibold ring-1 ring-white/10">
                {diagnostics.length} catégorie
                {diagnostics.length > 1 ? "s" : ""}
              </span>
              <span className="rounded-lg bg-white/10 px-2.5 py-1 font-semibold ring-1 ring-white/10">
                {findingCount} constat{findingCount > 1 ? "s" : ""}
              </span>
              <span className="rounded-lg bg-amber-400/20 px-2.5 py-1 font-semibold text-amber-100 ring-1 ring-amber-300/30">
                {offeredCount} offert{offeredCount > 1 ? "s" : ""} cliquable
                {offeredCount > 1 ? "s" : ""}
              </span>
              <span className="rounded-lg bg-sky-400/20 px-2.5 py-1 font-semibold text-sky-100 ring-1 ring-sky-300/30">
                {interventionTotal} intervention
                {interventionTotal > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-5">
          <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-black/[0.03] lg:col-span-3">
            <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Identité véhicule
              </h2>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {voiture.immatriculation ? (
                <LicensePlate immat={voiture.immatriculation} />
              ) : null}
              <button
                type="button"
                onClick={() => void copyChassis()}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
              >
                <ScanLine className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    N° châssis
                  </p>
                  <p className="truncate font-mono text-[12px] font-bold tracking-wide text-slate-800 sm:text-[13px]">
                    {voiture.chassisNumber || "—"}
                  </p>
                </div>
                <Copy className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 sm:grid-cols-4">
              <SpecCell
                icon={<Palette className="h-3.5 w-3.5" />}
                label="Couleur"
                value={voiture.couleur}
                swatch={hex}
              />
              <SpecCell
                icon={<Gauge className="h-3.5 w-3.5" />}
                label="Moteur"
                value={
                  MOTORISATION_LABELS[voiture.motorisation] ??
                  voiture.motorisation
                }
              />
              <SpecCell
                icon={<Cog className="h-3.5 w-3.5" />}
                label="Boîte"
                value={
                  TRANSMISSION_LABELS[voiture.transmission] ??
                  voiture.transmission
                }
              />
              <SpecCell
                icon={<DoorOpen className="h-3.5 w-3.5" />}
                label="Portes"
                value={voiture.nbr_portes || "—"}
              />
            </div>
          </article>

          <div className="flex flex-col gap-3 sm:gap-4 lg:col-span-2">
            <article className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-black/[0.03]">
              <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Client
                </h2>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-black text-white shadow-md shadow-rose-500/25">
                    {initials(client)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold tracking-tight text-slate-900">
                      {client}
                    </p>
                    <p className="text-xs text-slate-500">Propriétaire SAV</p>
                  </div>
                </div>
                {contact ? (
                  <a
                    href={`tel:${contact}`}
                    className="mt-4 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 text-sm font-bold text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100"
                  >
                    <Phone className="h-4 w-4" />
                    {contact}
                  </a>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-400">
                    Aucun numéro renseigné
                  </p>
                )}
              </div>
            </article>

            {groupe ? (
              <article className="overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50/70 shadow-sm">
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
                      Équipe en charge
                    </p>
                    <p className="truncate text-sm font-bold text-indigo-950">
                      {groupe.nom}
                    </p>
                  </div>
                </div>
              </article>
            ) : (
              <article className="rounded-3xl border border-dashed border-amber-200 bg-amber-50/70 px-4 py-4 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-950">
                      Équipe non affectée
                    </p>
                    <p className="text-xs text-amber-800/80">
                      Affectez un groupe depuis la liste.
                    </p>
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-black/[0.03]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-500/10">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900">
                  Diagnostic d&apos;arrivée
                </h2>
                <p className="text-xs text-slate-500">
                  Seuls les constats dont le nom égale un{" "}
                  <span className="font-semibold text-amber-700">
                    GarantieSAV.nom_garantie
                  </span>{" "}
                  sont cliquables
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {findingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-8 rounded-full px-2.5 tabular-nums"
                >
                  {offeredCount}/{findingCount}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="h-8 rounded-full bg-sky-50 px-2.5 tabular-nums text-sky-700"
              >
                {interventionCountLabel(interventionTotal)}
              </Badge>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {diagnostics.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Aucune ligne de diagnostic
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Aucun constat n&apos;a encore été enregistré pour ce dossier.
                </p>
              </div>
            ) : (
              <ol className="space-y-3">
                {diagnostics.map((da, index) => {
                  const details = da.DetailDiagnostic ?? [];
                  const categoryInterventionCount = details.reduce(
                    (n, d) => n + savedForDetail(d.id, d.nom).length,
                    0,
                  );
                  return (
                    <li
                      key={da.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60"
                    >
                      <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-3.5 py-3 sm:px-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-xs font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-900">
                          {da.catergorieDiagnostic?.nom || "Catégorie"}
                        </p>
                        <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-rose-700">
                          {details.length} constat{details.length > 1 ? "s" : ""}
                        </span>
                        <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-sky-700">
                          {categoryInterventionCount} intervention
                          {categoryInterventionCount > 1 ? "s" : ""}
                        </span>
                      </div>
                      {details.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400">
                          Aucun détail dans cette catégorie.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {details.map((d) => {
                            const active = isDetailActive(d.nom);
                            const saved = savedForDetail(d.id, d.nom);
                            const interventionCount = saved.length;

                            if (active) {
                              const quota = quotaForDetail(
                                d.nom,
                                voiture.GarantieSAV,
                                catalogGaranties,
                              );
                              const atQuota =
                                quota != null && interventionCount >= quota;
                              const drafts = atQuota
                                ? []
                                : (draftsByDetail[d.id] ??
                                  (saved.length === 0
                                    ? [
                                        {
                                          key: `init-${d.id}`,
                                          pieceSAVId: "",
                                          quantite: "1",
                                        },
                                      ]
                                    : []));

                              return (
                                <li key={d.id} className="bg-white">
                                  <Accordion
                                    type="single"
                                    collapsible
                                    value={openDetailId === d.id ? d.id : ""}
                                    onValueChange={(v) => {
                                      setOpenDetailId(v);
                                      if (v) ensureDraft(v, d.nom);
                                    }}
                                  >
                                    <AccordionItem value={d.id} className="border-0">
                                      <AccordionTrigger className="px-3.5 py-3 hover:no-underline hover:bg-amber-50/80 sm:px-4">
                                        <span className="flex min-w-0 flex-1 items-start gap-3 text-left">
                                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                                            <Gift className="h-3.5 w-3.5" />
                                          </span>
                                          <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                              <span className="text-sm font-semibold leading-snug text-slate-900">
                                                {d.nom}
                                              </span>
                                              <Badge className="rounded-md bg-amber-500 px-1.5 py-0 text-[10px] font-bold text-white hover:bg-amber-500">
                                                Garantie
                                              </Badge>
                                              <Badge
                                                variant="secondary"
                                                className={cn(
                                                  "rounded-md px-1.5 py-0 text-[10px] font-bold tabular-nums",
                                                  atQuota
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : interventionCount > 0
                                                      ? "bg-sky-50 text-sky-700"
                                                      : "bg-slate-100 text-slate-600",
                                                )}
                                              >
                                                {interventionCountLabel(
                                                  interventionCount,
                                                  quota,
                                                )}
                                              </Badge>
                                            </span>
                                            {d.description ? (
                                              <span className="mt-0.5 block text-xs font-normal leading-relaxed text-slate-500">
                                                {d.description}
                                              </span>
                                            ) : null}
                                            <span className="mt-1 block text-[11px] font-medium text-amber-700">
                                              {interventionCount > 0
                                                ? `${interventionCountLabel(interventionCount)} — ouvrir`
                                                : "Ouvrir les interventions"}
                                            </span>
                                          </span>
                                        </span>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-3 pb-4 sm:px-4">
                                        <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-3 sm:p-4">
                                          {saved.map((item) => (
                                            <InterventionTable
                                              key={item.id}
                                              title={`Intervention N° ${item.niveau_Intervention}`}
                                              saved
                                              pieceName={
                                                item.PieceSAV?.[0]?.nom ?? "—"
                                              }
                                              quantite={
                                                item.PieceSAV?.[0]
                                                  ?.quantite_sortie ?? 0
                                              }
                                            />
                                          ))}
                                          {drafts.map((draft, draftIndex) => {
                                            const niveau =
                                              saved.length + draftIndex + 1;
                                            return (
                                              <InterventionTable
                                                key={draft.key}
                                                title={`Intervention N° ${niveau}`}
                                                pieces={pieces}
                                                draft={draft}
                                                saving={savingKey === draft.key}
                                                onPieceChange={(pieceSAVId) =>
                                                  updateDraft(d.id, draft.key, {
                                                    pieceSAVId,
                                                  })
                                                }
                                                onQuantiteChange={(quantite) =>
                                                  updateDraft(d.id, draft.key, {
                                                    quantite,
                                                  })
                                                }
                                                onSave={() =>
                                                  void handleSaveIntervention({
                                                    detail: d,
                                                    diagnosticArriveeId: da.id,
                                                    draft,
                                                    niveau,
                                                  })
                                                }
                                              />
                                            );
                                          })}
                                          <Button
                                            type="button"
                                            variant="outline"
                                            disabled={atQuota}
                                            onClick={() => {
                                              if (atQuota) return;
                                              addDraft(d.id, d.nom);
                                            }}
                                            className="h-11 w-full rounded-xl border-amber-200 bg-white font-semibold text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                                          >
                                            <Plus className="mr-2 h-4 w-4" />
                                            {atQuota
                                              ? quota != null
                                                ? `Quota atteint (${saved.length}/${quota})`
                                                : "Nouvelle Intervention"
                                              : "Nouvelle Intervention"}
                                          </Button>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </li>
                              );
                            }

                            return (
                              <li
                                key={d.id}
                                className="flex items-start gap-3 px-3.5 py-3 opacity-55 sm:px-4"
                                title="Non couvert par une GarantieSAV (nom_garantie)"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                                  <Lock className="h-3 w-3" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold leading-snug text-slate-600">
                                      {d.nom}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className="rounded-md bg-slate-100 px-1.5 py-0 text-[10px] font-bold tabular-nums text-slate-500"
                                    >
                                      {interventionCountLabel(interventionCount)}
                                    </Badge>
                                  </div>
                                  {d.description ? (
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                                      {d.description}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    Hors garantie — non cliquable
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/90 px-3 py-2.5 backdrop-blur-xl sm:hidden pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-2xl border-slate-200 font-semibold"
          >
            <Link href="/sav/offre-speciale">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retour
            </Link>
          </Button>
          {contact ? (
            <Button
              asChild
              className="h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 font-bold text-white shadow-sm shadow-rose-500/20"
            >
              <a href={`tel:${contact}`}>
                <Phone className="mr-1.5 h-4 w-4" />
                Appeler
              </a>
            </Button>
          ) : (
            <Button
              disabled
              className="h-12 rounded-2xl bg-slate-200 font-bold text-slate-500"
            >
              <Phone className="mr-1.5 h-4 w-4" />
              Appeler
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InterventionTable({
  title,
  saved,
  pieceName,
  quantite,
  pieces,
  draft,
  saving,
  onPieceChange,
  onQuantiteChange,
  onSave,
}: {
  title: string;
  saved?: boolean;
  pieceName?: string;
  quantite?: number;
  pieces?: PieceStock[];
  draft?: InterventionDraft;
  saving?: boolean;
  onPieceChange?: (pieceSAVId: string) => void;
  onQuantiteChange?: (quantite: string) => void;
  onSave?: () => void;
}) {
  const selected = pieces?.find((p) => p.id === draft?.pieceSAVId);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2.5 sm:px-4">
        <p className="text-sm font-extrabold tracking-tight text-slate-900">
          {title}
        </p>
        {saved ? (
          <Badge
            variant="secondary"
            className="rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700"
          >
            Enregistrée
          </Badge>
        ) : null}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pièce SAV
            </TableHead>
            <TableHead className="w-36 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Quantité sortie
            </TableHead>
            {!saved ? (
              <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-transparent">
            <TableCell className="align-top">
              {saved ? (
                <p className="font-semibold text-slate-800">{pieceName}</p>
              ) : (
                <div className="space-y-1.5">
                  <Label className="sr-only">Pièce SAV</Label>
                  <Select
                    value={draft?.pieceSAVId || undefined}
                    onValueChange={onPieceChange}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Choisir une pièce…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(280px,50vh)]">
                      {(pieces ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nom}
                          {p.part_code ? ` (${p.part_code})` : ""} — restant :{" "}
                          {p.quantite_restante}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected ? (
                    <p className="text-[11px] text-slate-500">
                      Stock restant : {selected.quantite_restante}
                    </p>
                  ) : null}
                  {(pieces ?? []).length === 0 ? (
                    <p className="text-[11px] text-amber-700">
                      Aucune pièce en stock
                    </p>
                  ) : null}
                </div>
              )}
            </TableCell>
            <TableCell className="align-top">
              {saved ? (
                <p className="font-semibold tabular-nums text-slate-800">
                  {quantite}
                </p>
              ) : (
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={draft?.quantite ?? "1"}
                  onChange={(e) => onQuantiteChange?.(e.target.value)}
                  className="h-10 max-w-[120px] rounded-xl tabular-nums"
                />
              )}
            </TableCell>
            {!saved ? (
              <TableCell className="align-top text-right">
                <Button
                  type="button"
                  size="sm"
                  onClick={onSave}
                  disabled={saving}
                  className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white hover:from-amber-600 hover:to-orange-700"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        </TableBody>
      </Table>
    </div>
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
    <div className="flex flex-col items-center gap-1.5 bg-white px-2 py-3.5 text-center">
      <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </span>
      <span className="flex max-w-full items-center justify-center gap-1.5 text-xs font-bold capitalize leading-tight text-slate-800 sm:text-[13px]">
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
