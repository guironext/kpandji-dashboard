"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Gift,
  Loader2,
  Lock,
  Package,
  Palette,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type StatutGarantieSAV =
  | "EN_COURS"
  | "FIN_INTERVENTION_GARANTIESAV_EN_COURS"
  | "GARANTIESAV_EN_COURS"
  | "GARANTIESAV_TERMINE"
  | "PAS_DE_GARANTIE";

type DetailDiagnostic = {
  id: string;
  nom: string;
  description?: string | null;
  garantieSAVId?: string | null;
};

type DiagnosticArrivee = {
  id: string;
  catergorieDiagnostic?: { nom?: string | null } | null;
  DetailDiagnostic?: DetailDiagnostic[];
};

type GarantieOffert = {
  id?: string;
  nom_garantie?: string | null;
  statut?: string | null;
  quantite_garantie_offert?: number | null;
  voitureSAVId?: string | null;
  groupePersonnelSAV?: { id: string; nom: string } | null;
};

type DiagnosticOffert = {
  id: string;
  libelle: string;
  interventionDiagnosticOffertId?: string | null;
};

type PieceStock = {
  id: string;
  nom: string;
  part_code?: string | null;
  quantite_restante: number;
  interventionDiagnosticOffertId?: string | null;
};

type InterventionPiece = {
  id: string;
  nom: string;
  quantite_sortie: number;
};

type InterventionRow = {
  id: string;
  niveau_Intervention: number;
  typeProduitUtilise: string;
  detailDiagnosticId?: string | null;
  PieceSAV?: InterventionPiece[];
};

type InterventionDraft = {
  key: string;
  pieceSAVId: string;
  quantite: string;
};

type VoitureDetail = {
  id: string;
  model: string;
  immatriculation: string;
  couleur: string;
  motorisation?: string | null;
  transmission?: string | null;
  statut: string;
  StatutGarantie?: StatutGarantieSAV | string | null;
  ClientSAV?: { nom?: string; prenom?: string; contact?: string } | null;
  diagnosticArrivee?: DiagnosticArrivee[];
  GarantieSAV?: GarantieOffert[];
};

const STATUT_GARANTIE_LABELS: Record<StatutGarantieSAV, string> = {
  EN_COURS: "Garantie : en cours",
  FIN_INTERVENTION_GARANTIESAV_EN_COURS: "Fin intervention garantie",
  GARANTIESAV_EN_COURS: "Garantie SAV en cours",
  GARANTIESAV_TERMINE: "Garantie terminée",
  PAS_DE_GARANTIE: "Pas de garantie sur cette voiture",
};

function normalizeLibelle(value: string) {
  return value.trim().toLowerCase();
}

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

function findGarantieForDetail(
  nom: string,
  garanties: GarantieOffert[] | undefined
): GarantieOffert | null {
  const key = normalizeLibelle(nom);
  if (!key) return null;
  const list = (garanties ?? []).filter((g) => g.statut !== "ANNULE");
  const exact = list.find(
    (g) => normalizeLibelle(g.nom_garantie ?? "") === key
  );
  if (exact) return exact;
  return (
    list.find((g) => garantieNameTokens(g.nom_garantie).includes(key)) ?? null
  );
}

function detailMatchesGarantie(
  nom: string,
  garanties: GarantieOffert[] | undefined
): boolean {
  return Boolean(findGarantieForDetail(nom, garanties));
}

function isDetailGarantieOffert(
  detail: DetailDiagnostic,
  vehicleGaranties: GarantieOffert[] | undefined,
  catalog: GarantieOffert[]
): boolean {
  if (detail.garantieSAVId) return true;
  return (
    detailMatchesGarantie(detail.nom, vehicleGaranties) ||
    detailMatchesGarantie(detail.nom, catalog)
  );
}

function garantieQuota(garantie: GarantieOffert | null): number | null {
  if (!garantie) return null;
  const q = garantie.quantite_garantie_offert;
  if (q == null || !Number.isFinite(Number(q))) return null;
  return Math.trunc(Number(q));
}

function quotaForDetail(
  nom: string,
  vehicleGaranties: GarantieOffert[] | undefined,
  catalogGaranties: GarantieOffert[] | undefined
): number | null {
  const fromVehicle = garantieQuota(
    findGarantieForDetail(nom, vehicleGaranties)
  );
  if (fromVehicle != null) return fromVehicle;
  return garantieQuota(findGarantieForDetail(nom, catalogGaranties));
}

function interventionCountLabel(count: number, quota?: number | null) {
  const word = count > 1 ? "interventions" : "intervention";
  if (quota != null) return `${count}/${quota} ${word}`;
  return `${count} ${word}`;
}

function clientLabel(v: VoitureDetail): string {
  const label = `${v.ClientSAV?.prenom ?? ""} ${v.ClientSAV?.nom ?? ""}`.trim();
  return label || "Client non renseigné";
}

function groupeEnCharge(v: VoitureDetail) {
  const active = (v.GarantieSAV ?? []).filter((g) => g.statut !== "ANNULE");
  return active.find((g) => g.groupePersonnelSAV)?.groupePersonnelSAV ?? null;
}

type ApiJson = { success?: boolean; error?: string; data?: unknown };

async function fetchJson(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  try {
    return { res, json: (await res.json()) as ApiJson };
  } catch {
    return { res, json: null };
  }
}

export default function GarantieSavProceedClient({
  id,
  initialDetailId = "",
}: {
  id: string;
  initialDetailId?: string;
}) {
  const [voiture, setVoiture] = useState<VoitureDetail | null>(null);
  const [catalog, setCatalog] = useState<GarantieOffert[]>([]);
  const [offers, setOffers] = useState<DiagnosticOffert[]>([]);
  const [pieces, setPieces] = useState<PieceStock[]>([]);
  const [interventions, setInterventions] = useState<InterventionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openDetailId, setOpenDetailId] = useState(initialDetailId);
  const [draftsByDetail, setDraftsByDetail] = useState<
    Record<string, InterventionDraft[]>
  >({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [finishingIntervention, setFinishingIntervention] = useState(false);
  const router = useRouter();

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setNotFound(false);
      try {
        const [
          voitureResult,
          catalogResult,
          offersResult,
          piecesResult,
          interventionsResult,
        ] = await Promise.all([
          fetchJson(`/api/sav/voiture-sav/${id}`),
          fetchJson("/api/sav/garantie-sav"),
          fetchJson(`/api/sav/diagnostic-offert?voitureSAVId=${id}&active=1`),
          fetchJson("/api/sav/piece-sav"),
          fetchJson(
            `/api/sav/intervention-diagnostic-offert?voitureSAVId=${id}`
          ),
        ]);
        if (!voitureResult.json?.success || !voitureResult.json.data) {
          setNotFound(true);
          setVoiture(null);
          return;
        }
        setVoiture(voitureResult.json.data as VoitureDetail);
        const allGaranties = (
          catalogResult.json?.success ? catalogResult.json.data ?? [] : []
        ) as GarantieOffert[];
        setCatalog(allGaranties.filter((g) => !g.voitureSAVId));
        setOffers(
          offersResult.json?.success
            ? ((offersResult.json.data || []) as DiagnosticOffert[])
            : []
        );
        const allPieces = (
          piecesResult.json?.success ? piecesResult.json.data || [] : []
        ) as PieceStock[];
        setPieces(allPieces.filter((p) => !p.interventionDiagnosticOffertId));
        setInterventions(
          interventionsResult.json?.success
            ? ((interventionsResult.json.data || []) as InterventionRow[])
            : []
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur de chargement");
        setNotFound(true);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const currentDetailIds = useMemo(() => {
    const ids = new Set<string>();
    for (const da of voiture?.diagnosticArrivee ?? []) {
      for (const d of da.DetailDiagnostic ?? []) ids.add(d.id);
    }
    return ids;
  }, [voiture?.diagnosticArrivee]);

  const findOfferForDetail = (nom: string) => {
    const key = normalizeLibelle(nom);
    return (
      offers.find((offer) => {
        if (offer.interventionDiagnosticOffertId) return false;
        const lib = normalizeLibelle(offer.libelle);
        return lib === key || garantieNameTokens(offer.libelle).includes(key);
      }) ?? null
    );
  };

  const savedForDetail = (detailId: string, nom?: string) =>
    interventions
      .filter((i) => {
        if (i.detailDiagnosticId === detailId) return true;
        if (i.detailDiagnosticId && currentDetailIds.has(i.detailDiagnosticId)) {
          return false;
        }
        if (!nom) return false;
        return normalizeLibelle(i.typeProduitUtilise) === normalizeLibelle(nom);
      })
      .sort((a, b) => a.niveau_Intervention - b.niveau_Intervention);

  const ensureDraft = (detailId: string, nom?: string) => {
    setDraftsByDetail((prev) => {
      if (prev[detailId]?.length) return prev;
      const saved = savedForDetail(detailId, nom);
      const quota = nom
        ? quotaForDetail(nom, voiture?.GarantieSAV, catalog)
        : null;
      if (quota != null && saved.length >= quota) return prev;
      if (saved.length > 0) return prev;
      return {
        ...prev,
        [detailId]: [{ key: crypto.randomUUID(), pieceSAVId: "", quantite: "1" }],
      };
    });
  };

  useEffect(() => {
    if (!initialDetailId || !voiture) return;
    const detail = (voiture.diagnosticArrivee ?? [])
      .flatMap((da) => da.DetailDiagnostic ?? [])
      .find((d) => d.id === initialDetailId);
    if (!detail) return;
    if (!isDetailGarantieOffert(detail, voiture.GarantieSAV, catalog)) return;
    setOpenDetailId(initialDetailId);
    ensureDraft(detail.id, detail.nom);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once after load
  }, [initialDetailId, voiture?.id, catalog.length]);

  const addDraft = (detailId: string, nom?: string) => {
    setDraftsByDetail((prev) => {
      const savedCount = savedForDetail(detailId, nom).length;
      const quota = nom
        ? quotaForDetail(nom, voiture?.GarantieSAV, catalog)
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
    patch: Partial<InterventionDraft>
  ) => {
    setDraftsByDetail((prev) => {
      const current = prev[detailId] ?? [{ key, pieceSAVId: "", quantite: "1" }];
      return {
        ...prev,
        [detailId]: current.map((d) => (d.key === key ? { ...d, ...patch } : d)),
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
      catalog
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
        }
      );
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Erreur intervention");
      }
      toast.success(`Intervention N° ${opts.niveau} enregistrée`);
      setDraftsByDetail((prev) => ({
        ...prev,
        [opts.detail.id]: (prev[opts.detail.id] ?? []).filter(
          (d) => d.key !== opts.draft.key
        ),
      }));
      await load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur intervention");
    } finally {
      setSavingKey(null);
    }
  };

  const handleFinIntervention = async (detail: DetailDiagnostic) => {
    if (!voiture) return;
    const quota = quotaForDetail(detail.nom, voiture.GarantieSAV, catalog);
    const saved = savedForDetail(detail.id, detail.nom);
    const niveau =
      saved.length === 0
        ? 0
        : Math.max(...saved.map((row) => Number(row.niveau_Intervention) || 0));
    if (quota == null) {
      toast.error("Quantité de garantie introuvable pour cette ligne");
      return;
    }
    if (!(quota > niveau)) {
      toast.error(
        `La quantité de garantie (${quota}) n'est pas supérieure au niveau d'intervention (${niveau})`
      );
      return;
    }
    const detailCount = (voiture.diagnosticArrivee ?? []).reduce(
      (n, da) => n + (da.DetailDiagnostic?.length ?? 0),
      0
    );
    const goToSortie = detailCount <= 1;
    setFinishingIntervention(true);
    try {
      const { res, json } = await fetchJson(`/api/sav/voiture-sav/${voiture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut: "FIN_INTERVENTION_GARANTIESAV_EN_COURS",
          StatutGarantie: "FIN_INTERVENTION_GARANTIESAV_EN_COURS",
          ...(goToSortie
            ? { deplacementSAV: "SORTIE_MAINTENANCE" }
            : {}),
        }),
      });
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Impossible de clôturer l'intervention");
      }
      if (goToSortie) {
        toast.success("Fin d'intervention — véhicule envoyé en sortie");
        router.push("/sav/maintenance?tab=sortie");
      } else {
        toast.success("Fin d'intervention — retour à Garantie SAV");
        router.push("/sav/maintenance?tab=garantie");
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erreur clôture d'intervention"
      );
    } finally {
      setFinishingIntervention(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[min(60vh,28rem)] flex-col items-center justify-center gap-4 px-4 text-slate-600">
        <div className="relative">
          <div className="absolute -inset-2 animate-pulse rounded-3xl bg-rose-400/20 blur-xl" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-rose-100">
            <Loader2 className="h-7 w-7 animate-spin text-rose-600" />
          </div>
        </div>
        <p className="text-sm font-medium">Chargement du dossier garantie…</p>
      </div>
    );
  }

  if (notFound || !voiture) {
    return (
      <div className="mx-auto flex min-h-[min(60vh,28rem)] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
          <Car className="h-7 w-7" />
        </div>
        <p className="mt-5 text-lg font-semibold text-slate-800">
          Véhicule introuvable
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Ce dossier n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Button
          asChild
          className="mt-6 h-12 rounded-2xl bg-rose-700 px-5 font-semibold hover:bg-rose-800"
        >
          <Link href="/sav/maintenance?tab=garantie">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la maintenance
          </Link>
        </Button>
      </div>
    );
  }

  const groups = (voiture.diagnosticArrivee ?? []).map((da) => ({
    id: da.id,
    nom: da.catergorieDiagnostic?.nom?.trim() || "Diagnostic",
    details: da.DetailDiagnostic ?? [],
  }));
  const detailCount = groups.reduce((n, g) => n + g.details.length, 0);
  const garantieLineCount = groups.reduce(
    (n, g) =>
      n +
      g.details.filter((d) =>
        isDetailGarantieOffert(d, voiture.GarantieSAV, catalog)
      ).length,
    0
  );
  const statutGarantie = voiture.StatutGarantie
    ? STATUT_GARANTIE_LABELS[voiture.StatutGarantie as StatutGarantieSAV] ??
      voiture.StatutGarantie
    : STATUT_GARANTIE_LABELS.EN_COURS;
  const interventionTerminee =
    voiture.statut === "FIN_INTERVENTION_GARANTIESAV_EN_COURS" &&
    voiture.StatutGarantie === "FIN_INTERVENTION_GARANTIESAV_EN_COURS";
  const groupe = groupeEnCharge(voiture);
  const moteurLabel = [
    voiture.motorisation?.trim(),
    voiture.transmission?.trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] bg-[radial-gradient(ellipse_at_top,_rgba(244,63,94,0.07),_transparent_55%)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="h-11 shrink-0 rounded-2xl border-slate-200 bg-white/80 px-3 font-semibold shadow-sm backdrop-blur-sm sm:px-4"
          >
            <Link href="/sav/maintenance?tab=garantie">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Garantie SAV</span>
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700/80">
              Dossier garantie
            </p>
            <p className="truncate font-mono text-[11px] text-slate-400 sm:text-xs">
              {voiture.immatriculation}
            </p>
          </div>
          <PlateChip immat={voiture.immatriculation} />
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
          <div className="relative p-4 sm:p-6 lg:p-7">
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-white/20 sm:h-14 sm:w-14">
                <Car className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-200 ring-1 ring-white/15">
                  <Sparkles className="h-3 w-3" />
                  Intervention garantie
                </div>
                <h1 className="mt-2 truncate text-xl font-black tracking-tight sm:text-2xl lg:text-[1.75rem]">
                  {voiture.model}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300">
                  <User className="h-3.5 w-3.5 shrink-0 text-rose-300" />
                  <span className="truncate font-medium text-white">
                    {clientLabel(voiture)}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge className="border-0 bg-white/15 font-medium text-white hover:bg-white/15">
                {voiture.statut || "EN_TRAITEMENT_EN_COURS"}
              </Badge>
              <Badge className="gap-1 border-0 bg-rose-500/90 font-medium text-white hover:bg-rose-500/90">
                <ShieldCheck className="h-3 w-3" />
                {statutGarantie}
              </Badge>
              {interventionTerminee ? (
                <Badge className="gap-1 border-0 bg-emerald-500 font-medium text-white hover:bg-emerald-500">
                  <CheckCircle2 className="h-3 w-3" />
                  Clôturée
                </Badge>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <HeroStat
                icon={Palette}
                label="Couleur"
                value={voiture.couleur || "—"}
                capitalize
              />
              <HeroStat icon={Gauge} label="Moteur" value={moteurLabel || "—"} />
              <HeroStat
                icon={Phone}
                label="Contact"
                value={voiture.ClientSAV?.contact || "—"}
                href={
                  voiture.ClientSAV?.contact
                    ? `tel:${voiture.ClientSAV.contact}`
                    : undefined
                }
              />
              <HeroStat
                icon={Users}
                label="Groupe"
                value={groupe?.nom || "Non assigné"}
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/5 sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <ClipboardList className="h-3.5 w-3.5" />
                Diagnostic
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {garantieLineCount} garantie
                {garantieLineCount > 1 ? "s" : ""}
                {detailCount > garantieLineCount
                  ? ` · ${detailCount - garantieLineCount} hors garantie`
                  : ""}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 tabular-nums"
            >
              {detailCount} ligne{detailCount > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="space-y-5 px-3 py-4 sm:px-5 sm:py-5">
            {groups.length === 0 || detailCount === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Aucun détail diagnostic pour ce véhicule.
              </p>
            ) : (
              groups.map((group) =>
                group.details.length === 0 ? null : (
                  <div key={group.id} className="space-y-2.5">
                    <p className="px-0.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {group.nom}
                    </p>
                    <ul className="space-y-2.5">
                      {group.details.map((d) => {
                        const offert = isDetailGarantieOffert(
                          d,
                          voiture.GarantieSAV,
                          catalog
                        );
                        const saved = savedForDetail(d.id, d.nom);
                        const interventionCount = saved.length;
                        if (!offert) {
                          return (
                            <li
                              key={d.id}
                              className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-3.5 py-3"
                              title="Hors garantie — non cliquable"
                            >
                              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
                                <Lock className="h-4 w-4" />
                              </span>
                              <div className="min-w-0 pt-0.5">
                                <p className="text-sm font-semibold text-slate-600">
                                  {d.nom}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  Hors garantie — non cliquable
                                </p>
                              </div>
                            </li>
                          );
                        }
                        const quota = quotaForDetail(
                          d.nom,
                          voiture.GarantieSAV,
                          catalog
                        );
                        const atQuota =
                          quota != null && interventionCount >= quota;
                        const isOpen = openDetailId === d.id;
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
                          <li
                            key={d.id}
                            className={cn(
                              "overflow-hidden rounded-2xl border bg-white transition-shadow",
                              isOpen
                                ? "border-amber-300 shadow-md shadow-amber-600/10 ring-1 ring-amber-200"
                                : atQuota
                                  ? "border-emerald-200"
                                  : "border-amber-200/90"
                            )}
                          >
                            <Accordion
                              type="single"
                              collapsible
                              value={isOpen ? d.id : ""}
                              onValueChange={(value) => {
                                setOpenDetailId(value);
                                if (value) ensureDraft(value, d.nom);
                              }}
                            >
                              <AccordionItem value={d.id} className="border-0">
                                <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-amber-50/70 sm:px-4 sm:py-3.5">
                                  <span className="flex min-w-0 flex-1 items-start gap-3 text-left">
                                    <span
                                      className={cn(
                                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
                                        atQuota
                                          ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                                          : "bg-amber-100 text-amber-700 ring-amber-200"
                                      )}
                                    >
                                      {atQuota ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                      ) : (
                                        <Gift className="h-4 w-4" />
                                      )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[15px] font-semibold leading-snug text-slate-900">
                                          {d.nom}
                                        </span>
                                        <Badge className="rounded-md bg-amber-500 px-1.5 py-0 text-[10px] font-bold text-white hover:bg-amber-500">
                                          Garantie
                                        </Badge>
                                      </span>
                                      <QuotaMeter
                                        count={interventionCount}
                                        quota={quota}
                                      />
                                      <span className="mt-1.5 block text-[11px] font-medium text-amber-800/80">
                                        {atQuota
                                          ? "Quota atteint"
                                          : interventionCount > 0
                                            ? `${interventionCountLabel(interventionCount, quota)} — ouvrir`
                                            : "Ouvrir les interventions"}
                                      </span>
                                    </span>
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3 sm:px-4">
                                  <div className="space-y-3 rounded-2xl border border-amber-100 bg-gradient-to-b from-amber-50/70 to-orange-50/30 p-3 sm:p-4">
                                    {saved.map((item) => (
                                      <InterventionCard
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
                                        <InterventionCard
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
                                              diagnosticArriveeId: group.id,
                                              draft,
                                              niveau,
                                            })
                                          }
                                        />
                                      );
                                    })}
                                    <div className="grid grid-cols-1 gap-2 pt-0.5 sm:grid-cols-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        disabled={atQuota}
                                        onClick={() => {
                                          if (atQuota) return;
                                          addDraft(d.id, d.nom);
                                        }}
                                        className="h-12 rounded-2xl border-amber-200 bg-white font-semibold text-amber-800 hover:bg-amber-50"
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {atQuota
                                          ? quota != null
                                            ? `Quota atteint (${saved.length}/${quota})`
                                            : "Nouvelle Intervention"
                                          : "Nouvelle Intervention"}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                          finishingIntervention ||
                                          interventionTerminee
                                        }
                                        onClick={() => {
                                          void handleFinIntervention(d);
                                        }}
                                        className="h-12 rounded-2xl border-emerald-200 bg-white font-semibold text-emerald-800 hover:bg-emerald-50"
                                      >
                                        {finishingIntervention ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                        )}
                                        {interventionTerminee
                                          ? "Intervention terminée"
                                          : "Fin Intervention"}
                                      </Button>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PlateChip({ immat }: { immat: string }) {
  return (
    <span className="inline-flex max-w-[10.5rem] shrink-0 items-stretch overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950 shadow-sm sm:max-w-[12rem]">
      <span className="flex w-5 shrink-0 flex-col items-center justify-center bg-rose-600 text-[8px] font-black leading-none text-white">
        SAV
      </span>
      <span className="truncate px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-rose-300">
        {immat}
      </span>
    </span>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  capitalize,
  href,
}: {
  icon: typeof Palette;
  label: string;
  value: string;
  capitalize?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-200/80">
        <Icon className="h-3 w-3 shrink-0" />
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-semibold text-white",
          capitalize && "capitalize"
        )}
      >
        {value}
      </p>
    </>
  );
  const className =
    "min-w-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-md";
  if (href) {
    return (
      <a href={href} className={cn(className, "transition-colors hover:bg-white/15")}>
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}

function QuotaMeter({
  count,
  quota,
}: {
  count: number;
  quota?: number | null;
}) {
  const max = quota != null && quota > 0 ? quota : null;
  const pct = max == null ? 0 : Math.min(100, Math.round((count / max) * 100));
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-amber-100">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            pct >= 100
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-amber-400 to-orange-500"
          )}
          style={{ width: max == null ? (count > 0 ? "28%" : "0%") : `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-bold tabular-nums text-slate-600">
        {interventionCountLabel(count, quota)}
      </span>
    </div>
  );
}

function InterventionCard({
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
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm",
        saved ? "border-emerald-200/80" : "border-slate-200"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/90 px-3.5 py-2.5">
        <p className="text-sm font-extrabold tracking-tight text-slate-900">
          {title}
        </p>
        {saved ? (
          <Badge className="rounded-md border-0 bg-emerald-50 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50">
            Enregistrée
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="rounded-md text-[10px] font-bold text-amber-800"
          >
            À enregistrer
          </Badge>
        )}
      </div>

      {saved ? (
        <div className="flex items-center gap-3 px-3.5 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Package className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Pièce SAV
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
              {pieceName}
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-1.5 text-right ring-1 ring-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Qté
            </p>
            <p className="font-bold tabular-nums text-slate-900">{quantite}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-3.5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pièce SAV
            </Label>
            <Select
              value={draft?.pieceSAVId || undefined}
              onValueChange={onPieceChange}
            >
              <SelectTrigger className="h-12 rounded-xl">
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
                Stock restant :{" "}
                <span className="font-semibold tabular-nums text-slate-800">
                  {selected.quantite_restante}
                </span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5 sm:w-36">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quantité sortie
              </Label>
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={draft?.quantite ?? "1"}
                onChange={(e) => onQuantiteChange?.(e.target.value)}
                className="h-12 rounded-xl tabular-nums"
              />
            </div>
            <Button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-white hover:from-amber-600 hover:to-orange-700 sm:flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
