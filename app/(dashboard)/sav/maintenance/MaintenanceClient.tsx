"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatNumberWithSpaces } from "@/lib/utils";
import { validateTerminerMaintenance } from "@/lib/sav/terminerMaintenanceValidation";
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
  catergorieDiagnostic: CatergorieDiagnostic;
  PieceSAV: PieceRow[];
};

type MaintenanceRow = {
  id: string;
  nom: string;
  description: string | null;
  duree_maintenance: string | null;
  prix_maintenance: unknown;
  catergorieDiagnosticId: string | null;
};

export type ReparationMaintenance = {
  id: string;
  categorie_reparation: string;
  horaire_travail_prix: unknown;
  horaire_travail_duration: string | null;
  voitureSAV: {
    id: string;
    immatriculation: string;
    model: string;
    ClientSAV: {
      nom: string;
      prenom: string;
    };
  };
  DetailDiagnostic: DetailRow[];
  Maintenance: MaintenanceRow[];
};

type CatBlock = {
  id: string;
  nom: string;
  description: string | null;
  details: {
    id: string;
    nom: string;
    description: string | null;
    diagnosticArriveeId: string | null;
  }[];
  pieces: PieceRow[];
};

function buildCategoryBlocks(rep: ReparationMaintenance): CatBlock[] {
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
    });
    for (const p of d.PieceSAV ?? []) {
      if (seenPiece.has(p.id)) continue;
      seenPiece.add(p.id);
      byCat.get(cat.id)!.pieces.push(p);
    }
  }
  return Array.from(byCat.values());
}

function priceToDisplay(v: unknown): string {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${formatNumberWithSpaces(n)} FCFA`;
}

function hasMaintenanceForCategory(
  rep: ReparationMaintenance,
  categorieId: string
): boolean {
  return (
    rep.Maintenance?.some((m) => m.catergorieDiagnosticId === categorieId) ??
    false
  );
}

/** Aperçu local (les données fraîches sont vérifiées au clic via l’API). */
function getTerminerValidation(rep: ReparationMaintenance) {
  return validateTerminerMaintenance(
    {
      horaire_travail_prix: rep.horaire_travail_prix,
      horaire_travail_duration: rep.horaire_travail_duration,
    },
    rep.Maintenance ?? [],
    (rep.DetailDiagnostic ?? []).map(
      (d) => d.catergorieDiagnostic?.id ?? null
    )
  );
}

type PieceStockOption = {
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

function buildDetailOptionsForCategory(
  rep: ReparationMaintenance,
  categorieId: string
): DetailSortieOption[] {
  const out: DetailSortieOption[] = [];
  for (const d of rep.DetailDiagnostic ?? []) {
    if (d.catergorieDiagnostic?.id !== categorieId) continue;
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

function findPiecesForDetailRep(
  rep: ReparationMaintenance,
  detailId: string
): PieceRow[] {
  const d = rep.DetailDiagnostic?.find((x) => x.id === detailId);
  return d?.PieceSAV ?? [];
}

function findPieceByIdRep(
  rep: ReparationMaintenance,
  pieceId: string
): PieceRow | null {
  for (const d of rep.DetailDiagnostic ?? []) {
    const p = d.PieceSAV?.find((x) => x.id === pieceId);
    if (p) return p;
  }
  return null;
}

async function fetchPiecesStock(): Promise<PieceStockOption[]> {
  const res = await fetch("/api/sav/piece-sav");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Erreur chargement des pièces");
  }
  return json.data || [];
}

type FormFields = {
  nom: string;
  description: string;
  duree_maintenance: string;
  prix_maintenance: string;
};

const emptyForm = (): FormFields => ({
  nom: "",
  description: "",
  duree_maintenance: "",
  prix_maintenance: "",
});

export default function MaintenanceClient() {
  const [reparations, setReparations] = useState<ReparationMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [finishingRepId, setFinishingRepId] = useState<string | null>(null);
  const [formsByRepCat, setFormsByRepCat] = useState<
    Record<string, Record<string, FormFields>>
  >({});

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/sav/reparations-en-maintenance");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Chargement impossible");
      }
      const data: ReparationMaintenance[] = json.data ?? [];
      setReparations(data);
      setActiveTab((prev) => {
        if (data.length === 0) return "";
        if (prev && data.some((r) => r.id === prev)) return prev;
        return data[0].id;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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

  const loadPieces = useCallback(async () => {
    try {
      const rows = await fetchPiecesStock();
      setPiecesStock(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement pièces");
    }
  }, []);

  useEffect(() => {
    void loadPieces();
  }, [loadPieces]);

  const sortieRep = useMemo(
    () =>
      sortieRepId ? reparations.find((r) => r.id === sortieRepId) : undefined,
    [reparations, sortieRepId]
  );

  const sortieDetailOptions = useMemo(() => {
    if (!sortieRepId || !sortieCategorieId) return [];
    const rep = reparations.find((r) => r.id === sortieRepId);
    if (!rep) return [];
    return buildDetailOptionsForCategory(rep, sortieCategorieId);
  }, [reparations, sortieRepId, sortieCategorieId]);

  const sortieSelectedPiece = useMemo(
    () => piecesStock.find((p) => p.id === sortiePieceId),
    [piecesStock, sortiePieceId]
  );

  const sortieIsEdit = Boolean(sortieReplacePieceId);

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

  const handleAjouterPièce = async (repId: string, categorieId: string) => {
    const rep = reparations.find((r) => r.id === repId);
    if (!rep) return;
    const opts = buildDetailOptionsForCategory(rep, categorieId);
    if (opts.length === 0) {
      toast.error(
        "Aucune ligne de diagnostic liée à un diagnostic d’arrivée pour cette catégorie. Complétez la fiche depuis l’atelier ou vérifiez les données."
      );
      return;
    }
    if (piecesStock.length === 0) {
      try {
        const rows = await fetchPiecesStock();
        setPiecesStock(rows);
        if (rows.length === 0) {
          toast.error("Aucune pièce en stock — ajoutez des références en gestion SAV.");
          return;
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur chargement pièces");
        return;
      }
    }
    setSortieRepId(repId);
    setSortieCategorieId(categorieId);
    const first = opts[0];
    setSortieDetailId(first.id);
    syncPieceStateForDetailRep(rep, first.id);
    setSortieOpen(true);
  };

  const submitSortieMaintenance = async () => {
    if (!sortieRepId || !sortieCategorieId) return;
    const rep = reparations.find((r) => r.id === sortieRepId);
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

  useEffect(() => {
    const rep = reparations.find((r) => r.id === activeTab);
    if (!rep) return;
    if (!formsByRepCat[rep.id]) {
      initFormsForRep(rep);
    }
  }, [activeTab, reparations, formsByRepCat, initFormsForRep]);

  const updateField = (
    repId: string,
    catId: string,
    field: keyof FormFields,
    value: string
  ) => {
    setFormsByRepCat((prev) => ({
      ...prev,
      [repId]: {
        ...(prev[repId] ?? {}),
        [catId]: {
          ...(prev[repId]?.[catId] ?? emptyForm()),
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async (repId: string, catId: string) => {
    const fields = formsByRepCat[repId]?.[catId];
    if (!fields?.nom?.trim()) {
      toast.error("Le nom de la maintenance est requis");
      return;
    }
    setSavingCat(`${repId}:${catId}`);
    try {
      const res = await fetch("/api/sav/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reparationId: repId,
          catergorieDiagnosticId: catId,
          nom: fields.nom.trim(),
          description: fields.description.trim() || null,
          duree_maintenance: fields.duree_maintenance.trim() || null,
          prix_maintenance: fields.prix_maintenance.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement impossible");
      }
      toast.success("Maintenance enregistrée");
      setReparations((prev) =>
        prev.map((r) => {
          if (r.id !== repId) return r;
          const m = json.data as MaintenanceRow;
          const rest = r.Maintenance.filter(
            (x) => x.catergorieDiagnosticId !== catId
          );
          const repPatch = json.reparation as
            | {
                horaire_travail_prix: unknown;
                horaire_travail_duration: string | null;
              }
            | null
            | undefined;
          return {
            ...r,
            ...(repPatch
              ? {
                  horaire_travail_prix: repPatch.horaire_travail_prix,
                  horaire_travail_duration: repPatch.horaire_travail_duration,
                }
              : {}),
            Maintenance: [m, ...rest],
          };
        })
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingCat(null);
    }
  };

  const handleTerminerMaintenance = async (repId: string) => {
    setFinishingRepId(repId);
    try {
      const resGet = await fetch(`/api/sav/reparation/${repId}`);
      const jsonGet = await resGet.json();
      if (!resGet.ok || !jsonGet.success || !jsonGet.data) {
        throw new Error(jsonGet.error || "Chargement de la réparation impossible");
      }
      const snap = jsonGet.data as {
        horaire_travail_prix: unknown;
        horaire_travail_duration: string | null;
        Maintenance: MaintenanceRow[];
        DetailDiagnostic: { catergorieDiagnosticId: string | null }[];
      };
      const check = validateTerminerMaintenance(
        {
          horaire_travail_prix: snap.horaire_travail_prix,
          horaire_travail_duration: snap.horaire_travail_duration,
        },
        snap.Maintenance,
        snap.DetailDiagnostic.map((d) => d.catergorieDiagnosticId)
      );
      if (!check.ok) {
        toast.error(check.error);
        return;
      }

      if (
        !window.confirm(
          "Confirmer la fin de maintenance ? La réparation passera au statut « terminé » et quittera cette liste."
        )
      ) {
        return;
      }

      const res = await fetch(`/api/sav/reparation/${repId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "TERMINE" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Mise à jour impossible");
      }
      toast.success("Maintenance terminée — données enregistrées");
      setReparations((prev) => {
        const remaining = prev.filter((r) => r.id !== repId);
        setActiveTab((tab) => {
          if (remaining.length === 0) return "";
          if (tab === repId) return remaining[0].id;
          if (remaining.some((r) => r.id === tab)) return tab;
          return remaining[0].id;
        });
        return remaining;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setFinishingRepId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 rounded-2xl border border-border/60 bg-gradient-to-b from-card to-muted/20 px-6 py-20 text-center shadow-sm">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/15 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">
            Chargement des dossiers
          </p>
          <p className="text-sm text-muted-foreground">
            Connexion à l&apos;atelier et récupération des dossiers…
          </p>
        </div>
      </div>
    );
  }

  if (reparations.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-border/70 bg-gradient-to-b from-card/90 to-muted/15 shadow-sm">
        <div className="relative px-6 py-20 text-center sm:px-10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50">
            <Wrench className="h-10 w-10 text-muted-foreground/65" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            Aucun dossier en maintenance
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Dès qu&apos;une réparation sera au statut « en maintenance », elle
            apparaîtra ici pour la saisie des interventions et durées.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
        <DialogContent className="flex max-h-[min(90dvh,calc(100dvh-1.5rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:top-3.5 [&_[data-slot=dialog-close]]:right-3.5 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:bg-slate-100/90 [&_[data-slot=dialog-close]]:hover:bg-slate-200/90">
          <div
            className="h-1 shrink-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"
            aria-hidden
          />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
            <div className="p-6 pb-4 pt-5">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex gap-3.5 pr-8">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-600/20 ring-1 ring-white/20">
                    <Package className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <DialogTitle className="text-left text-xl font-semibold tracking-tight text-slate-900">
                      {sortieIsEdit
                        ? "Modifier la sortie de pièce"
                        : "Sortie de pièce — diagnostic"}
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

            <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/90 to-slate-50 px-6 py-5">
              <div className="grid gap-5">
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
                    className="h-11 max-w-[140px] border-slate-200 bg-white font-medium shadow-sm tabular-nums focus-visible:ring-teal-500/25"
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

          <DialogFooter className="shrink-0 gap-2 border-t border-slate-200/90 bg-white px-6 py-4 sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 border-slate-200 sm:min-w-[100px]"
              onClick={() => setSortieOpen(false)}
              disabled={sortieSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="h-10 min-w-[140px] bg-gradient-to-r from-teal-600 to-emerald-600 font-semibold text-white shadow-md transition-[box-shadow,filter] hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg disabled:opacity-60"
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
                "Enregistrer les changements"
              ) : (
                "Valider la sortie"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card/95 to-muted/30 p-5 shadow-sm sm:p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-primary/[0.07] blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Atelier · SAV
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-inner ring-1 ring-primary/10">
                <Wrench className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Maintenance SAV
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                  Dossiers en maintenance : synthèse client / véhicule, diagnostics,
                  pièces et saisie d&apos;intervention par catégorie.
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
            <Badge
              variant="secondary"
              className="gap-1.5 border border-border/50 bg-background/80 px-3 py-1.5 text-xs font-medium shadow-sm"
            >
              <Gauge className="h-3.5 w-3.5 opacity-80" />
              {reparations.length} dossier{reparations.length > 1 ? "s" : ""}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-border/70 bg-background/80 shadow-sm"
              disabled={refreshing}
              onClick={() => void load({ silent: true })}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              />
              Actualiser
            </Button>
          </div>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin] sm:mx-0">
          <TabsList className="inline-flex h-auto min-w-min flex-nowrap gap-1.5 rounded-2xl border border-border/50 bg-muted/35 p-1.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
            {reparations.map((rep) => {
              const c = rep.voitureSAV.ClientSAV;
              const clientLabel = `${c.prenom} ${c.nom}`.trim();
              const immat = rep.voitureSAV.immatriculation;
              return (
                <TabsTrigger
                  key={rep.id}
                  value={rep.id}
                  className={cn(
                    "shrink-0 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                    "data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-background data-[state=active]:shadow-md",
                    "data-[state=inactive]:hover:bg-muted/60"
                  )}
                >
                  <span className="flex min-w-[10rem] max-w-[18rem] flex-col gap-0.5 sm:min-w-[12rem]">
                    <span className="flex items-center gap-1.5 text-xs font-semibold leading-tight">
                      <User className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{clientLabel}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Car className="h-3 w-3 shrink-0 opacity-80" />
                      <span className="truncate font-mono tabular-nums">
                        {immat}
                      </span>
                    </span>
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {reparations.map((rep) => {
          const blocks = buildCategoryBlocks(rep);
          const vs = rep.voitureSAV;
          const clientLabel = `${vs.ClientSAV.prenom} ${vs.ClientSAV.nom}`.trim();
          const terminerVal = getTerminerValidation(rep);
          return (
            <TabsContent
              key={rep.id}
              value={rep.id}
              className="mt-6 space-y-6 focus-visible:outline-none"
            >
              <Card className="overflow-hidden border-border/70 shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.03] dark:ring-white/10">
                <CardHeader className="space-y-0 border-b border-border/60 bg-gradient-to-br from-muted/40 via-background to-muted/20 pb-0">
                  <div className="flex flex-col gap-4 pb-4 pt-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
                          {rep.categorie_reparation}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/[0.06] font-normal text-foreground"
                        >
                          {blocks.length}{" "}
                          {blocks.length === 1 ? "catégorie" : "catégories"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fiche réparation sélectionnée — identité client et véhicule
                        ci-dessous.
                      </p>
                      {terminerVal.ok ? (
                        <p className="text-xs text-muted-foreground">
                          Prix / durée horaire (réparation) :{" "}
                          <span className="font-medium text-foreground">
                            {priceToDisplay(rep.horaire_travail_prix)}
                          </span>
                          {" · "}
                          <span className="font-medium text-foreground">
                            {rep.horaire_travail_duration?.trim() || "—"}
                          </span>
                          {" — alignés sur chaque ligne maintenance."}
                        </p>
                      ) : (
                        <p
                          className="text-xs text-amber-700 dark:text-amber-500"
                          role="status"
                        >
                          {terminerVal.error}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      className="shrink-0 gap-2 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                      title={
                        terminerVal.ok
                          ? "Enregistre la fin de maintenance après contrôle en base (prix et durée)."
                          : terminerVal.error
                      }
                      disabled={finishingRepId === rep.id}
                      onClick={() => void handleTerminerMaintenance(rep.id)}
                    >
                      {finishingRepId === rep.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Traitement…
                        </>
                      ) : (
                        <>
                          <CircleCheck className="h-4 w-4" />
                          Terminer la maintenance
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="grid gap-3 pb-5 sm:grid-cols-2">
                    <div className="group flex min-h-[4.75rem] items-start gap-3 rounded-xl border border-border/50 bg-background/90 px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                        <User className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Client
                        </p>
                        <p className="truncate text-[15px] font-semibold leading-snug">
                          {clientLabel}
                        </p>
                      </div>
                    </div>
                    <div className="group flex min-h-[4.75rem] items-start gap-3 rounded-xl border border-border/50 bg-background/90 px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/10">
                        <Car className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Véhicule
                        </p>
                        <p className="truncate text-[15px] font-semibold leading-snug">
                          {vs.model}
                        </p>
                        <p className="truncate font-mono text-xs text-muted-foreground tabular-nums">
                          {vs.immatriculation}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  {blocks.length === 0 ? (
                    <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center">
                      <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Aucune catégorie de diagnostic liée à cette réparation.
                      </p>
                    </div>
                  ) : (
                    blocks.map((block, idx) => {
                      const form =
                        formsByRepCat[rep.id]?.[block.id] ?? emptyForm();
                      const saveKey = `${rep.id}:${block.id}`;
                      const saved = hasMaintenanceForCategory(rep, block.id);
                      return (
                        <div
                          key={block.id}
                          className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card to-muted/10 shadow-sm transition-shadow duration-200 hover:shadow-md"
                        >
                          <div
                            className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-primary/80"
                            aria-hidden
                          />
                          <div className="relative px-4 pb-5 pt-5 sm:px-6">
                            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                  <h3 className="text-lg font-semibold tracking-tight">
                                    {block.nom}
                                  </h3>
                                  {saved ? (
                                    <Badge
                                      variant="secondary"
                                      className="gap-1 text-[11px] font-medium"
                                    >
                                      <Sparkles className="h-3 w-3" />
                                      Saisie enregistrée
                                    </Badge>
                                  ) : null}
                                </div>
                                {block.description ? (
                                  <p className="text-sm leading-relaxed text-muted-foreground">
                                    {block.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            {block.details.length > 0 ? (
                              <>
                                <div className="mb-4">
                                  <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    <ClipboardList className="h-3.5 w-3.5" />
                                    Détails diagnostic
                                  </p>
                                  <ul className="space-y-2">
                                    {block.details.map((d) => (
                                      <li
                                        key={d.id}
                                        className="rounded-lg border border-border/50 bg-muted/25 px-3 py-2.5 text-sm leading-snug"
                                      >
                                        <span className="font-medium text-foreground">
                                          {d.nom}
                                        </span>
                                        {d.description ? (
                                          <span className="text-muted-foreground">
                                            {" "}
                                            — {d.description}
                                          </span>
                                        ) : null}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <Separator className="my-5" />
                              </>
                            ) : null}

                            <div className="mb-6">
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  <Package className="h-3.5 w-3.5" />
                                  Pièces SAV
                                </p>
                                {block.pieces.length > 0 ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 border-emerald-600/40 bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20 dark:text-emerald-200"
                                    onClick={() =>
                                      void handleAjouterPièce(rep.id, block.id)
                                    }
                                  >
                                    Ajouter pièce
                                  </Button>
                                ) : null}
                              </div>
                              {block.pieces.length === 0 ? (
                                <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/15 px-3 py-3 text-sm text-muted-foreground">
                                  <p>
                                    Aucune pièce liée à cette catégorie. Utilisez le
                                    bouton ci-dessous pour ouvrir la sortie de pièce
                                    (même formulaire que sur la fiche réparation
                                    atelier).
                                  </p>
                                  <div>
                                    <Button
                                      type="button"
                                      className="border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700"
                                      onClick={() =>
                                        void handleAjouterPièce(rep.id, block.id)
                                      }
                                    >
                                      Ajouter pièce
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="overflow-hidden rounded-xl border border-border/60">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
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
                                          className="border-border/50"
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
                              )}
                            </div>

                            <div className="space-y-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-background/95 to-muted/25 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:shadow-none sm:p-5">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                                  <Wrench className="h-4 w-4" />
                                </span>
                                <div>
                                  <p className="text-sm font-semibold tracking-tight">
                                    Saisie maintenance
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {block.nom}
                                  </p>
                                </div>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor={`nom-${rep.id}-${block.id}`}>
                                    Nom
                                  </Label>
                                  <Input
                                    id={`nom-${rep.id}-${block.id}`}
                                    value={form.nom}
                                    onChange={(e) =>
                                      updateField(
                                        rep.id,
                                        block.id,
                                        "nom",
                                        e.target.value
                                      )
                                    }
                                    className="bg-background/80"
                                    placeholder="Intitulé de l’intervention"
                                  />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                  <Label htmlFor={`desc-${rep.id}-${block.id}`}>
                                    Description
                                  </Label>
                                  <Textarea
                                    id={`desc-${rep.id}-${block.id}`}
                                    value={form.description}
                                    onChange={(e) =>
                                      updateField(
                                        rep.id,
                                        block.id,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    className="min-h-[5rem] resize-y bg-background/80"
                                    placeholder="Travaux prévus, remarques…"
                                    rows={3}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`duree-${rep.id}-${block.id}`}>
                                    Durée maintenance
                                  </Label>
                                  <Input
                                    id={`duree-${rep.id}-${block.id}`}
                                    value={form.duree_maintenance}
                                    onChange={(e) =>
                                      updateField(
                                        rep.id,
                                        block.id,
                                        "duree_maintenance",
                                        e.target.value
                                      )
                                    }
                                    className="bg-background/80"
                                    placeholder="ex. 2 h, 1 jour"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`prix-${rep.id}-${block.id}`}>
                                    Prix maintenance (FCFA)
                                  </Label>
                                  <Input
                                    id={`prix-${rep.id}-${block.id}`}
                                    value={form.prix_maintenance}
                                    onChange={(e) =>
                                      updateField(
                                        rep.id,
                                        block.id,
                                        "prix_maintenance",
                                        e.target.value
                                      )
                                    }
                                    className="bg-background/80"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                className="w-full shadow-sm sm:w-auto"
                                disabled={savingCat === saveKey}
                                onClick={() =>
                                  void handleSave(rep.id, block.id)
                                }
                              >
                                {savingCat === saveKey ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement…
                                  </>
                                ) : (
                                  "Enregistrer la maintenance"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
