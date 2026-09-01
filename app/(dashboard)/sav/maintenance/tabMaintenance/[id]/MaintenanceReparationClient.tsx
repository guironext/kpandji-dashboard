"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Car,
  CircleCheck,
  ClipboardList,
  Hash,
  ListChecks,
  Loader2,
  Package,
  RefreshCw,
  User,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { validateTerminerMaintenance } from "@/lib/sav/terminerMaintenanceValidation";
import { filterUnlockedDetails, type GarantieOffertMatch } from "@/lib/sav/garantieOffertMatch";
import {
  DossierWorkspace,
  PlateBadge,
  buildCategoryBlocks,
  buildDetailOptionsForCategory,
  clientName,
  emptyForm,
  fetchGarantieOffertCatalog,
  fetchPiecesStock,
  fetchQueue,
  findPieceByIdRep,
  findPiecesForDetailRep,
  getTerminerValidation,
  hasMaintenanceForCategory,
  isRepDetailLocked,
  categoryHasUnlockedDetails,
  pickActive,
  statutGarantieBadgeClass,
  statutGarantieLabel,
  withKind,
  type FormFields,
  type MaintenanceRow,
  type PieceStockOption,
  type ReparationMaintenance,
} from "../../MaintenanceClient";

/**
 * Previous maintenance workspace for one voitureSAV (fiches, pièces, envoyer en sortie).
 */
export default function MaintenanceReparationClient({ id }: { id: string }) {
  const router = useRouter();
  const [dossiers, setDossiers] = useState<ReparationMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [finishingRepId, setFinishingRepId] = useState<string | null>(null);
  const [formsByRepCat, setFormsByRepCat] = useState<
    Record<string, Record<string, FormFields>>
  >({});
  const [piecesStock, setPiecesStock] = useState<PieceStockOption[]>([]);
  const [garantieCatalog, setGarantieCatalog] = useState<GarantieOffertMatch[]>(
    []
  );
  const [sortieOpen, setSortieOpen] = useState(false);
  const [sortieRepId, setSortieRepId] = useState<string | null>(null);
  const [sortieCategorieId, setSortieCategorieId] = useState<string | null>(
    null
  );
  const [sortiePieceId, setSortiePieceId] = useState("");
  const [sortieQty, setSortieQty] = useState("1");
  const [sortieDetailId, setSortieDetailId] = useState("");
  const [sortieReplacePieceId, setSortieReplacePieceId] = useState<
    string | null
  >(null);
  const [sortieSubmitting, setSortieSubmitting] = useState(false);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const [rows, catalog] = await Promise.all([
          fetchQueue(
            `/api/sav/reparations-en-maintenance?voitureSAVId=${encodeURIComponent(id)}`
          ),
          fetchGarantieOffertCatalog().catch(() => [] as GarantieOffertMatch[]),
        ]);
        const next = withKind(rows, "reparation").filter(
          (r) => r.voitureSAV.id === id
        );
        setDossiers(next);
        setGarantieCatalog(catalog);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setActiveTab((prev) => pickActive(prev, dossiers));
  }, [dossiers]);

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

  const activeDossier = dossiers.find((r) => r.id === activeTab);
  const activeTerminerVal = activeDossier
    ? getTerminerValidation(activeDossier, garantieCatalog)
    : { ok: true as const };

  const sortieRep = useMemo(
    () =>
      sortieRepId ? dossiers.find((r) => r.id === sortieRepId) : undefined,
    [dossiers, sortieRepId]
  );

  const sortieDetailOptions = useMemo(() => {
    if (!sortieRepId || !sortieCategorieId) return [];
    const rep = dossiers.find((r) => r.id === sortieRepId);
    if (!rep) return [];
    return buildDetailOptionsForCategory(
      rep,
      sortieCategorieId,
      garantieCatalog
    );
  }, [dossiers, sortieRepId, sortieCategorieId, garantieCatalog]);

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
    const rep = dossiers.find((r) => r.id === repId);
    if (!rep) return;
    const opts = buildDetailOptionsForCategory(
      rep,
      categorieId,
      garantieCatalog
    );
    if (opts.length === 0) {
      const anyUnlocked = (rep.DetailDiagnostic ?? []).some(
        (d) =>
          d.catergorieDiagnostic?.id === categorieId &&
          !isRepDetailLocked(rep, d, garantieCatalog)
      );
      toast.error(
        anyUnlocked
          ? "Aucune ligne de diagnostic liée à un diagnostic d’arrivée pour cette catégorie. Complétez la fiche depuis l’atelier ou vérifiez les données."
          : "Les lignes couvertes par une garantie offerte sont désactivées tant que la garantie n'est pas terminée."
      );
      return;
    }
    if (piecesStock.length === 0) {
      try {
        const rows = await fetchPiecesStock();
        setPiecesStock(rows);
        if (rows.length === 0) {
          toast.error(
            "Aucune pièce en stock — ajoutez des références en gestion SAV."
          );
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
    const rep = dossiers.find((r) => r.id === sortieRepId);
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
    } else if (
      !sortieSelectedPiece ||
      q > sortieSelectedPiece.quantite_restante
    ) {
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
      const m = rep.Maintenance?.find((x) => x.catergorieDiagnosticId === b.id);
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
    const rep = dossiers.find((r) => r.id === activeTab);
    if (!rep) return;
    if (!formsByRepCat[rep.id]) {
      initFormsForRep(rep);
    }
  }, [activeTab, dossiers, formsByRepCat, initFormsForRep]);

  const patchDossier = (
    repId: string,
    updater: (r: ReparationMaintenance) => ReparationMaintenance
  ) => {
    setDossiers((prev) => prev.map((r) => (r.id === repId ? updater(r) : r)));
  };

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
    const dossier = dossiers.find((r) => r.id === repId);
    if (dossier?.kind === "garantie") {
      toast.error(
        "La saisie de fiche maintenance n’est pas encore liée aux dossiers garantie SAV."
      );
      return;
    }
    if (dossier && hasMaintenanceForCategory(dossier, catId)) {
      return;
    }
    if (
      dossier &&
      !categoryHasUnlockedDetails(dossier, catId, garantieCatalog)
    ) {
      toast.error(
        "La saisie maintenance est désactivée pour cette catégorie : les lignes sont couvertes par une garantie offerte tant que la garantie n'est pas terminée."
      );
      return;
    }
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
          description: fields.description?.trim() || null,
          duree_maintenance: fields.duree_maintenance?.trim() || null,
          prix_maintenance: fields.prix_maintenance?.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement impossible");
      }
      toast.success("Maintenance enregistrée");
      patchDossier(repId, (r) => {
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
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingCat(null);
    }
  };

  const handleTerminerMaintenance = async (repId: string) => {
    const dossier = dossiers.find((r) => r.id === repId);
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
        garantieCatalog
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
      router.push("/sav/maintenance?tab=sortie");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setFinishingRepId(null);
    }
  };

  const showMobileFinishBar = !loading && Boolean(activeDossier);
  const vs = activeDossier?.voitureSAV;
  const categoryBlocks = activeDossier
    ? buildCategoryBlocks(activeDossier)
    : [];
  const actionableBlocks = activeDossier
    ? categoryBlocks.filter((b) =>
        categoryHasUnlockedDetails(activeDossier, b.id, garantieCatalog)
      )
    : [];
  const savedFiches = actionableBlocks.filter((b) =>
    activeDossier
      ? hasMaintenanceForCategory(activeDossier, b.id)
      : false
  ).length;
  const progressPct =
    actionableBlocks.length === 0
      ? 0
      : Math.round((savedFiches / actionableBlocks.length) * 100);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-[#f3f6fa] px-4 py-16 text-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 shadow-inner ring-1 ring-teal-200/60">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
          <div className="absolute -inset-3 animate-pulse rounded-[1.35rem] bg-gradient-to-r from-teal-400/25 to-emerald-500/25 blur-2xl" />
        </div>
        <p className="mt-7 text-sm font-medium tracking-tight text-slate-600">
          Chargement du dossier réparation
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Récupération des fiches, pièces et diagnostics…
        </p>
      </div>
    );
  }

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
                    htmlFor="piece-sav-reparation"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <Package className="h-3.5 w-3.5 text-teal-600" />
                    Pièce en stock
                  </Label>
                  <Select value={sortiePieceId} onValueChange={setSortiePieceId}>
                    <SelectTrigger
                      id="piece-sav-reparation"
                      className="h-11 w-full border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color] hover:border-slate-300 focus:ring-teal-500/20"
                    >
                      <SelectValue placeholder="Choisir une pièce…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(280px,50vh)]">
                      {piecesStock.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-medium">{p.nom}</span>
                          {p.part_code ? (
                            <span className="text-slate-500">
                              {" "}
                              ({p.part_code})
                            </span>
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
                      Aucune pièce en stock — ajoutez des références dans la
                      gestion SAV.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="qty-sortie-reparation"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <Hash className="h-3.5 w-3.5 text-teal-600" />
                    Quantité sortie
                  </Label>
                  <Input
                    id="qty-sortie-reparation"
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
                    htmlFor="detail-dx-reparation"
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    <ListChecks className="h-3.5 w-3.5 text-teal-600" />
                    Ligne de diagnostic
                  </Label>
                  <Select
                    value={sortieDetailId}
                    onValueChange={(detailId) => {
                      setSortieDetailId(detailId);
                      if (!sortieRep) return;
                      syncPieceStateForDetailRep(sortieRep, detailId);
                    }}
                  >
                    <SelectTrigger
                      id="detail-dx-reparation"
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
        <section className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-emerald-700 to-teal-900 text-white shadow-[0_18px_44px_-18px_rgba(15,23,42,0.45)] sm:block">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(255,255,255,0.2),transparent)]" />
          <div className="absolute -right-20 -bottom-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl sm:h-72 sm:w-72" />
          <div className="relative px-4 py-4 sm:px-8 sm:py-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl bg-white/10 px-2.5 text-white ring-1 ring-white/20 hover:bg-white/20 hover:text-white"
                  >
                    <Link href="/sav/maintenance?tab=maintenance">
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Maintenance</span>
                    </Link>
                  </Button>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/95 sm:text-[11px]">
                    Réparation atelier
                  </span>
                  {refreshing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white/80" />
                  ) : null}
                </div>
                <h1 className="mt-3 truncate text-[1.4rem] font-bold leading-tight tracking-tight sm:mt-4 sm:text-3xl">
                  {vs?.model || "Dossier réparation"}
                </h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/85">
                  {vs ? (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0 opacity-80" />
                        <span className="truncate font-medium">
                          {activeDossier ? clientName(activeDossier) : "—"}
                        </span>
                      </span>
                      {activeDossier?.categorie_reparation ? (
                        <>
                          <span className="text-white/40">·</span>
                          <span className="inline-flex items-center gap-1.5 truncate">
                            <Wrench className="h-3.5 w-3.5 shrink-0 opacity-80" />
                            {activeDossier.categorie_reparation}
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <span>Aucune réparation en file pour ce véhicule.</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {vs ? (
                  <PlateBadge immat={vs.immatriculation} tone="teal" />
                ) : null}
                {vs?.StatutGarantie ? (
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="hidden gap-2 bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 hover:text-white sm:inline-flex"
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
            {activeDossier && actionableBlocks.length > 0 ? (
              <div className="mt-4 sm:mt-5">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-white/80">
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Fiches maintenance
                  </span>
                  <span className="font-medium tabular-nums">
                    {savedFiches}/{actionableBlocks.length} · {progressPct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-white transition-[width]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            ) : null}
            {activeDossier ? (
              <div className="mt-4 hidden sm:block">
                <Button
                  type="button"
                  className="h-11 gap-2 bg-white font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-60"
                  disabled={
                    finishingRepId === activeDossier.id ||
                    !activeTerminerVal.ok
                  }
                  onClick={() =>
                    void handleTerminerMaintenance(activeDossier.id)
                  }
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
                {!activeTerminerVal.ok ? (
                  <p className="mt-2 max-w-xl text-xs text-amber-100/90">
                    {activeTerminerVal.error}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {activeDossier ? (
          <nav
            className="sticky top-16 z-30 -mx-3 border-b border-slate-200/70 bg-[#f3f6fa]/92 px-3 py-2 backdrop-blur-xl sm:hidden"
            aria-label="Contexte réparation"
          >
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-10 w-10 shrink-0 rounded-xl border-slate-200 bg-white p-0"
              >
                <Link href="/sav/maintenance?tab=maintenance" aria-label="Retour">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {vs?.model}
                </p>
                <p className="truncate font-mono text-[11px] tracking-wide text-slate-500">
                  {vs?.immatriculation}
                </p>
              </div>
              {vs?.StatutGarantie ? (
                <Badge
                  className={cn(
                    "max-w-[7.5rem] shrink-0 gap-1 truncate text-[10px]",
                    statutGarantieBadgeClass(vs.StatutGarantie)
                  )}
                >
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {statutGarantieLabel(vs.StatutGarantie)}
                  </span>
                </Badge>
              ) : null}
              <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-teal-800 ring-1 ring-teal-200/80">
                {savedFiches}/{actionableBlocks.length || 0}
              </span>
            </div>
            {actionableBlocks.length > 0 ? (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            ) : null}
          </nav>
        ) : (
          <div className="flex items-center gap-2 sm:hidden">
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-2xl border-slate-200 bg-white px-3 font-semibold shadow-sm"
            >
              <Link href="/sav/maintenance?tab=maintenance">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm font-semibold text-slate-800">Réparation</p>
          </div>
        )}

        {dossiers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-14 text-center shadow-sm ring-1 ring-slate-950/5 sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-200/70">
              <Wrench className="h-6 w-6" />
            </div>
            <p className="mt-5 text-lg font-semibold text-slate-800">
              Aucun dossier réparation
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              Ce véhicule n’a pas encore de réparation en file atelier.
            </p>
            <Button
              asChild
              className="mt-6 h-11 rounded-xl bg-teal-700 hover:bg-teal-800"
            >
              <Link href="/sav/maintenance?tab=maintenance">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la maintenance
              </Link>
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3 sm:gap-5 lg:gap-6",
              dossiers.length > 1
                ? "lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]"
                : "grid-cols-1"
            )}
          >
            {dossiers.length > 1 ? (
              <aside className="space-y-2 lg:sticky lg:top-20 lg:self-start">
                <div className="flex items-center justify-between px-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Dossiers
                  </p>
                  <Badge variant="secondary" className="tabular-nums">
                    {dossiers.length}
                  </Badge>
                </div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:thin] lg:hidden">
                  {dossiers.map((rep) => {
                    const active = rep.id === activeTab;
                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => setActiveTab(rep.id)}
                        className={cn(
                          "snap-start min-w-[13rem] shrink-0 rounded-2xl border px-3 py-2.5 text-left transition-all",
                          active
                            ? "border-teal-500/45 bg-teal-50 shadow-md shadow-teal-600/10 ring-1 ring-teal-500/20"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {rep.categorie_reparation || clientName(rep)}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                          {rep.voitureSAV.immatriculation}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="hidden max-h-[calc(100vh-14rem)] space-y-2 overflow-y-auto pr-0.5 [scrollbar-width:thin] lg:block">
                  {dossiers.map((rep) => {
                    const active = rep.id === activeTab;
                    return (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => setActiveTab(rep.id)}
                        className={cn(
                          "group w-full rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-200",
                          active
                            ? "border-teal-500/40 bg-gradient-to-br from-teal-50 to-cyan-50/70 shadow-md shadow-teal-600/10 ring-1 ring-teal-500/20"
                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              active
                                ? "bg-teal-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            <Car className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {clientName(rep)}
                            </p>
                            <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                              {rep.voitureSAV.immatriculation}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-slate-500">
                              {rep.categorie_reparation}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            ) : null}

            {activeDossier ? (
              <DossierWorkspace
                rep={activeDossier}
                queueTab="maintenance"
                formsByRepCat={formsByRepCat}
                savingCat={savingCat}
                finishingRepId={finishingRepId}
                onUpdateField={updateField}
                onSave={handleSave}
                onFinish={handleTerminerMaintenance}
                onAddPiece={handleAjouterPièce}
                showIdentity={false}
                garantieCatalog={garantieCatalog}
              />
            ) : null}
          </div>
        )}
      </div>

      {showMobileFinishBar && activeDossier ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden supports-[padding:max(0px)]:pb-[max(0.7rem,env(safe-area-inset-bottom))]">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="truncate font-medium text-slate-700">
              {vs?.model} · {clientName(activeDossier)}
            </span>
            <span className="shrink-0 font-mono tabular-nums">
              {savedFiches}/{actionableBlocks.length || 0}
            </span>
          </div>
          <Button
            type="button"
            className="h-12 w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-white shadow-md hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
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
