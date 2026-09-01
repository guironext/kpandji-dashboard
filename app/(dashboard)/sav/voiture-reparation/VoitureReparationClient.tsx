"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Car,
  Wrench,
  ClipboardList,
  Palette,
  Gauge,
  Cog,
  CheckCircle2,
  Package,
  Hash,
  ListChecks,
  Save,
  Plus,
  Pencil,
  AlertTriangle,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  isGarantieOffertDetailLocked,
  type GarantieOffertMatch,
} from "@/lib/sav/garantieOffertMatch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CatergorieDiagnostic {
  id: string;
  nom: string;
}

interface DetailDiagnostic {
  id: string;
  nom: string;
  reparationId?: string | null;
  garantieSAVId?: string | null;
}

interface PieceSAVLink {
  id: string;
  nom: string;
  part_code: string | null;
  detailDiagnosticId: string | null;
  quantiteSortieDetail: number;
  diagnosticArriveeId: string | null;
}

interface DiagnosticArrivee {
  id: string;
  createdAt: string;
  catergorieDiagnostic: CatergorieDiagnostic;
  DetailDiagnostic: DetailDiagnostic[];
  PieceSAV?: PieceSAVLink[];
}

interface ClientSAV {
  nom?: string;
  prenom?: string;
}

interface VoitureSavGarantie {
  id: string;
  chassisNumber?: string | null;
  garantieSAVbadge?: boolean;
}

interface VoitureSAVRow {
  id: string;
  model: string;
  immatriculation: string;
  couleur: string;
  motorisation: string;
  transmission: string;
  statut: string;
  StatutGarantie?: string | null;
  ClientSAV?: ClientSAV;
  VoitureSavGarantie?: VoitureSavGarantie | null;
  sousGarantie?: boolean;
  GarantieSAV?: GarantieOffertMatch[];
  diagnosticArrivee?: DiagnosticArrivee[];
}

type PieceStockOption = {
  id: string;
  nom: string;
  model_voiture: string | null;
  marque_piece: string | null;
  part_code: string | null;
  quantite_restante: number;
};

const CATEGORY_ACCENTS = [
  "from-violet-400 to-purple-500",
  "from-teal-400 to-emerald-500",
  "from-sky-400 to-blue-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
];

async function fetchVoituresDiagnosticFini(): Promise<VoitureSAVRow[]> {
  const json = await fetch(
    "/api/sav/voiture-sav?statut=DIAGNOSTIC_FINI&includeDiagnostic=1&includeGarantie=1",
  ).then((r) => r.json());

  if (!json.success) {
    throw new Error(json.error || "Erreur chargement des véhicules");
  }

  return (json.data || []) as VoitureSAVRow[];
}

async function fetchGarantieOffertCatalog(): Promise<GarantieOffertMatch[]> {
  const json = await fetch("/api/sav/garantie-sav").then((r) => r.json());
  if (!json.success) {
    throw new Error(json.error || "Erreur chargement des garanties offertes");
  }
  return (json.data || []) as GarantieOffertMatch[];
}

async function fetchPiecesStock(): Promise<PieceStockOption[]> {
  const res = await fetch("/api/sav/piece-sav");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Erreur chargement des pièces");
  }
  return json.data || [];
}

function clientLabel(voiture: VoitureSAVRow): string {
  return [voiture.ClientSAV?.nom, voiture.ClientSAV?.prenom].filter(Boolean).join(" ") || "—";
}

function hasGarantie(v: VoitureSAVRow) {
  if (typeof v.sousGarantie === "boolean") return v.sousGarantie;
  return Boolean(v.VoitureSavGarantie && v.VoitureSavGarantie.garantieSAVbadge !== false);
}

function GarantieBadge({ compact }: { compact?: boolean }) {
  return (
    <Badge
      className={cn(
        "rounded-full bg-rose-50 font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-50",
        compact
          ? "px-1.5 py-0 text-[9px]"
          : "px-2 py-0.5 text-[10px]"
      )}
    >
      <ShieldCheck className={cn(compact ? "mr-0.5 h-2.5 w-2.5" : "mr-1 h-3 w-3")} />
      Garantie
    </Badge>
  );
}

function findPiecesForDetail(
  voiture: VoitureSAVRow,
  detailId: string
): PieceSAVLink[] {
  const out: PieceSAVLink[] = [];
  for (const da of voiture.diagnosticArrivee ?? []) {
    for (const p of da.PieceSAV ?? []) {
      if (p.detailDiagnosticId === detailId) out.push(p);
    }
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
}

function findPieceById(voiture: VoitureSAVRow, pieceId: string): PieceSAVLink | null {
  for (const da of voiture.diagnosticArrivee ?? []) {
    const p = da.PieceSAV?.find((x) => x.id === pieceId);
    if (p) return p;
  }
  return null;
}

function isDetailLocked(
  voiture: VoitureSAVRow,
  detail: DetailDiagnostic,
  catalog: GarantieOffertMatch[]
) {
  return isGarantieOffertDetailLocked(
    voiture.StatutGarantie,
    detail,
    voiture.GarantieSAV,
    catalog
  );
}

function allDetails(voiture: VoitureSAVRow): DetailDiagnostic[] {
  return voiture.diagnosticArrivee?.flatMap((da) => da.DetailDiagnostic ?? []) ?? [];
}

function actionableDetails(
  voiture: VoitureSAVRow,
  catalog: GarantieOffertMatch[]
): DetailDiagnostic[] {
  return allDetails(voiture).filter((d) => !isDetailLocked(voiture, d, catalog));
}

function isReparationEnregistree(voiture: VoitureSAVRow): boolean {
  const details = allDetails(voiture);
  if (details.length === 0) return false;
  return details.every((d) => d.reparationId != null && String(d.reparationId).trim() !== "");
}

function allDetailsHavePieces(
  voiture: VoitureSAVRow,
  catalog: GarantieOffertMatch[]
): boolean {
  const details = actionableDetails(voiture, catalog);
  if (details.length === 0) return false;
  return details.every((d) => findPiecesForDetail(voiture, d.id).length > 0);
}

function countDetailsMissingPieces(
  voiture: VoitureSAVRow,
  catalog: GarantieOffertMatch[]
): number {
  return actionableDetails(voiture, catalog).filter(
    (d) => findPiecesForDetail(voiture, d.id).length === 0
  ).length;
}

function countPieces(voiture: VoitureSAVRow): number {
  let n = 0;
  for (const da of voiture.diagnosticArrivee ?? []) {
    n += da.PieceSAV?.length ?? 0;
  }
  return n;
}

function buildDetailOptions(
  voiture: VoitureSAVRow,
  catalog: GarantieOffertMatch[]
) {
  const out: {
    id: string;
    diagnosticArriveeId: string;
    label: string;
  }[] = [];
  for (const da of voiture.diagnosticArrivee ?? []) {
    const catNom = da.catergorieDiagnostic?.nom ?? "Catégorie";
    for (const d of da.DetailDiagnostic ?? []) {
      if (isDetailLocked(voiture, d, catalog)) continue;
      out.push({
        id: d.id,
        diagnosticArriveeId: da.id,
        label: `${catNom} — ${d.nom}`,
      });
    }
  }
  return out;
}

function RegisterCta({
  saved,
  canEnregistrer,
  busy,
  hasDetailLines,
  allPiecesAdded,
  missingPieceCount,
  pieceCount,
  warrantyLockedOnly,
  onClick,
  compact,
}: {
  saved: boolean;
  canEnregistrer: boolean;
  busy: boolean;
  hasDetailLines: boolean;
  allPiecesAdded: boolean;
  missingPieceCount: number;
  pieceCount: number;
  warrantyLockedOnly?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const hint = saved
    ? "Les données de préparation sont enregistrées."
    : !hasDetailLines
      ? warrantyLockedOnly
        ? "Les lignes couvertes par une garantie offerte sont désactivées tant que la garantie n'est pas terminée."
        : "Ajoutez d'abord des lignes de diagnostic."
      : !allPiecesAdded
        ? missingPieceCount === 1
          ? "Ajoutez une pièce à la ligne de diagnostic restante."
          : `Ajoutez une pièce à chaque ligne de diagnostic (${missingPieceCount} restantes).`
        : `${pieceCount} pièce${pieceCount > 1 ? "s" : ""} liée${pieceCount > 1 ? "s" : ""} — prêt à enregistrer.`;

  return (
    <div
      className={cn(
        "flex gap-3",
        compact
          ? "items-center"
          : "flex-col sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      {!compact && (
        <div className="flex min-w-0 items-start gap-2.5">
          {saved ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : canEnregistrer ? (
            <Package className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {saved
                ? "Préparation enregistrée"
                : canEnregistrer
                  ? "Enregistrer la préparation"
                  : "Enregistrement indisponible"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{hint}</p>
          </div>
        </div>
      )}
      {compact && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-slate-500">{hint}</p>
          <p className="truncate text-sm font-semibold text-slate-900">
            {saved
              ? "Préparation enregistrée"
              : canEnregistrer
                ? "Enregistrer la préparation"
                : "Pièce requise"}
          </p>
        </div>
      )}
      <Button
        type="button"
        disabled={!canEnregistrer || busy}
        onClick={onClick}
        title={
          saved
            ? "Préparation déjà enregistrée"
            : !canEnregistrer
              ? hint
              : "Enregistrer la préparation (réparation en attente)"
        }
        className={cn(
          "shrink-0 font-semibold shadow-md transition-[box-shadow,filter,opacity]",
          compact
            ? "h-11 min-w-[10.5rem] px-3"
            : "h-11 w-full sm:h-10 sm:w-auto sm:min-w-[13rem]",
          saved
            ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-none hover:bg-emerald-50 disabled:opacity-100"
            : canEnregistrer
              ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg"
              : "cursor-not-allowed bg-slate-200 text-slate-500 shadow-none hover:bg-slate-200"
        )}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement…
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Enregistrée
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Garder la préparation
          </>
        )}
      </Button>
    </div>
  );
}

function DiagnosticSection({
  voiture,
  catalog,
  onDetailRowClick,
  onAddAnotherPiece,
  onEditPiece,
}: {
  voiture: VoitureSAVRow;
  catalog: GarantieOffertMatch[];
  onDetailRowClick: (detailId: string) => void;
  onAddAnotherPiece: (detailId: string) => void;
  onEditPiece: (detailId: string, pieceId: string) => void;
}) {
  const diagnostics = voiture.diagnosticArrivee ?? [];

  if (diagnostics.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-slate-300 bg-slate-50/70 shadow-none">
        <CardContent className="px-4 py-10 text-center sm:py-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/80 sm:h-16 sm:w-16">
            <ClipboardList className="h-7 w-7 text-slate-400 sm:h-8 sm:w-8" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-700 sm:text-lg">
            Aucun diagnostic d&apos;arrivée
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Ce véhicule a un diagnostic fini mais n&apos;a pas encore de lignes de diagnostic
            enregistrées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {diagnostics.map((da, idx) => {
        const accent = CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length];
        const catNom = da.catergorieDiagnostic?.nom ?? "Catégorie";
        const details = da.DetailDiagnostic ?? [];
        const pieceCount = da.PieceSAV?.length ?? 0;

        return (
          <Card
            key={da.id}
            className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm"
          >
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3.5 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className={cn("h-1 w-6 shrink-0 rounded-full bg-gradient-to-r sm:w-8", accent)} />
                  <CardTitle className="truncate text-[15px] font-semibold tracking-tight text-slate-800 sm:text-lg">
                    {catNom}
                  </CardTitle>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {pieceCount > 0 && (
                    <Badge className="border-0 bg-teal-600 text-[10px] font-medium text-white hover:bg-teal-600 sm:text-xs">
                      {pieceCount} pièce{pieceCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] font-normal text-slate-600 sm:text-xs">
                    {details.length} ligne{details.length > 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
              {details.length === 0 ? (
                <p className="px-1 py-3 text-sm text-slate-500">Aucun détail pour cette catégorie.</p>
              ) : (
                <ul className="space-y-2.5">
                  {details.map((d) => {
                    const pieces = findPiecesForDetail(voiture, d.id);
                    const hasPiece = pieces.length > 0;
                    const locked = isDetailLocked(voiture, d, catalog);
                    return (
                      <li
                        key={d.id}
                        className={cn(
                          "rounded-2xl border p-3 sm:p-3.5",
                          locked
                            ? "border-rose-200/80 bg-rose-50/50"
                            : hasPiece
                              ? "border-teal-200/80 bg-gradient-to-br from-white to-teal-50/50"
                              : "border-dashed border-slate-200 bg-white"
                        )}
                      >
                        {locked ? (
                          <div
                            className="flex w-full items-start gap-3"
                            title="Garantie offerte — non cliquable tant que la garantie n'est pas terminée"
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
                              <Lock className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-semibold leading-snug text-slate-700">
                                  {d.nom}
                                </span>
                                <Badge className="rounded-full bg-rose-50 px-2 py-0 text-[10px] font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-50">
                                  Garantie offerte
                                </Badge>
                              </span>
                              <span className="mt-1 block text-xs font-medium text-rose-700/90">
                                Désactivée — garantie non terminée
                              </span>
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDetailRowClick(d.id)}
                            className="flex w-full items-start gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                hasPiece
                                  ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                                  : "bg-slate-100 text-slate-400"
                              )}
                            >
                              {hasPiece ? (
                                <Package className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold leading-snug text-slate-900">
                                {d.nom}
                              </span>
                              {!hasPiece && (
                                <span className="mt-1 block text-xs font-medium text-teal-700">
                                  Touchez pour ajouter une pièce
                                </span>
                              )}
                            </span>
                          </button>
                        )}

                        {hasPiece && (
                          <div className="mt-3 space-y-2">
                            {pieces.map((piece) => (
                              <div
                                key={piece.id}
                                className="flex flex-col gap-2 rounded-xl border border-teal-100/90 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3 sm:py-2.5"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-800">
                                    {piece.nom}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-500">
                                    {piece.part_code ?? "Sans code"}
                                    {piece.quantiteSortieDetail > 0
                                      ? ` · Qté ${piece.quantiteSortieDetail}`
                                      : ""}
                                  </p>
                                </div>
                                {!locked && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 w-full border-slate-200 sm:h-8 sm:w-auto"
                                    onClick={() => onEditPiece(d.id, piece.id)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Changer
                                  </Button>
                                )}
                              </div>
                            ))}
                            {!locked && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 w-full border-dashed border-teal-300 bg-teal-50/40 text-teal-800 hover:bg-teal-50 sm:h-8 sm:w-fit"
                                onClick={() => onAddAnotherPiece(d.id)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Autre pièce
                              </Button>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function VoitureReparationClient() {
  const [voitures, setVoitures] = useState<VoitureSAVRow[]>([]);
  const [piecesStock, setPiecesStock] = useState<PieceStockOption[]>([]);
  const [catalog, setCatalog] = useState<GarantieOffertMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [sortieOpen, setSortieOpen] = useState(false);
  const [sortieVoiture, setSortieVoiture] = useState<VoitureSAVRow | null>(null);
  const [sortiePresetDetailId, setSortiePresetDetailId] = useState<string | null>(null);
  const [sortiePieceId, setSortiePieceId] = useState("");
  const [sortieQty, setSortieQty] = useState("1");
  const [sortieDetailId, setSortieDetailId] = useState("");
  const [sortieReplacePieceId, setSortieReplacePieceId] = useState<string | null>(null);
  const [sortieAddAnother, setSortieAddAnother] = useState(false);
  const [sortieSubmitting, setSortieSubmitting] = useState(false);
  const [enregistrerVoitureId, setEnregistrerVoitureId] = useState<string | null>(null);

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchVoituresDiagnosticFini();
      setVoitures(data);
      setSelectedId((prev) => {
        if (prev && data.some((v) => v.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  const loadCatalog = useCallback(async () => {
    try {
      setCatalog(await fetchGarantieOffertCatalog());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement garanties");
    }
  }, []);

  const loadPieces = useCallback(async () => {
    try {
      const rows = await fetchPiecesStock();
      setPiecesStock(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement pièces");
    }
  }, []);

  useEffect(() => {
    void load();
    void loadPieces();
    void loadCatalog();
  }, [loadPieces, loadCatalog]);

  const selected = useMemo(
    () => voitures.find((v) => v.id === selectedId) ?? null,
    [voitures, selectedId]
  );

  const openSortieDialog = (
    voiture: VoitureSAVRow,
    presetDetailId: string | null,
    opts?: { addAnother?: boolean; replacePieceId?: string }
  ) => {
    if (presetDetailId) {
      const detail = allDetails(voiture).find((d) => d.id === presetDetailId);
      if (detail && isDetailLocked(voiture, detail, catalog)) {
        toast.error(
          "Cette ligne est couverte par une garantie offerte et ne peut pas être modifiée tant que la garantie n'est pas terminée."
        );
        return;
      }
    }

    setSortieVoiture(voiture);
    setSortiePresetDetailId(presetDetailId);
    setSortieDetailId(presetDetailId ?? "");

    if (!presetDetailId) {
      setSortiePieceId("");
      setSortieQty("1");
      setSortieReplacePieceId(null);
      setSortieAddAnother(false);
      setSortieOpen(true);
      return;
    }

    if (opts?.addAnother) {
      setSortiePieceId("");
      setSortieQty("1");
      setSortieReplacePieceId(null);
      setSortieAddAnother(true);
      setSortieOpen(true);
      return;
    }

    if (opts?.replacePieceId) {
      const ex = findPieceById(voiture, opts.replacePieceId);
      if (ex) {
        setSortiePieceId(ex.id);
        setSortieQty(String(ex.quantiteSortieDetail > 0 ? ex.quantiteSortieDetail : 1));
        setSortieReplacePieceId(ex.id);
      } else {
        setSortiePieceId("");
        setSortieQty("1");
        setSortieReplacePieceId(null);
      }
      setSortieAddAnother(false);
      setSortieOpen(true);
      return;
    }

    const pieces = findPiecesForDetail(voiture, presetDetailId);
    const ex = pieces[0];
    if (ex) {
      setSortiePieceId(ex.id);
      setSortieQty(String(ex.quantiteSortieDetail > 0 ? ex.quantiteSortieDetail : 1));
      setSortieReplacePieceId(ex.id);
    } else {
      setSortiePieceId("");
      setSortieQty("1");
      setSortieReplacePieceId(null);
    }
    setSortieAddAnother(false);
    setSortieOpen(true);
  };

  const syncPieceStateForDetailLine = useCallback(
    (voiture: VoitureSAVRow, detailId: string) => {
      const pieces = findPiecesForDetail(voiture, detailId);
      const ex = pieces[0];
      if (ex) {
        setSortiePieceId(ex.id);
        setSortieQty(String(ex.quantiteSortieDetail > 0 ? ex.quantiteSortieDetail : 1));
        setSortieReplacePieceId(ex.id);
      } else {
        setSortiePieceId("");
        setSortieQty("1");
        setSortieReplacePieceId(null);
      }
    },
    []
  );

  const detailOptions = useMemo(() => {
    if (!sortieVoiture) return [];
    return buildDetailOptions(sortieVoiture, catalog);
  }, [sortieVoiture, catalog]);

  const selectedPiece = useMemo(
    () => piecesStock.find((p) => p.id === sortiePieceId),
    [piecesStock, sortiePieceId]
  );

  const sortieIsEdit = Boolean(sortieReplacePieceId);

  const submitSortie = async () => {
    if (!sortieVoiture) return;
    const opt = detailOptions.find((o) => o.id === sortieDetailId);
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
      ? findPieceById(sortieVoiture, sortieReplacePieceId)
      : null;
    const samePieceEdit =
      Boolean(sortieReplacePieceId) &&
      sortiePieceId === sortieReplacePieceId &&
      Boolean(alloc) &&
      alloc!.id === sortiePieceId;

    if (samePieceEdit && alloc) {
      const delta = q - alloc.quantiteSortieDetail;
      if (delta > 0 && selectedPiece && selectedPiece.quantite_restante < delta) {
        toast.error(
          `Stock insuffisant pour augmenter la quantité (restant : ${selectedPiece.quantite_restante}, besoin : +${delta}).`
        );
        return;
      }
    } else if (!selectedPiece || q > selectedPiece.quantite_restante) {
      toast.error(
        selectedPiece
          ? `Stock insuffisant (restant : ${selectedPiece.quantite_restante}).`
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
          voitureSAVId: sortieVoiture.id,
          ...(sortieReplacePieceId ? { replacePieceId: sortieReplacePieceId } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Sortie impossible");
      }
      toast.success(
        sortieReplacePieceId ? "Sortie de pièce mise à jour." : "Sortie de pièce enregistrée."
      );
      setSortieOpen(false);
      await Promise.all([load({ silent: true }), loadPieces()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSortieSubmitting(false);
    }
  };

  const enregistrerReparation = async (voitureId: string) => {
    setEnregistrerVoitureId(voitureId);
    try {
      const res = await fetch(
        `/api/sav/voiture-sav/${voitureId}/enregistrer-reparation`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement impossible");
      }
      toast.success(
        json.alreadySaved
          ? "Cette réparation était déjà enregistrée."
          : "Préparation enregistrée — réparation en attente."
      );
      await load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnregistrerVoitureId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center px-4">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 shadow-inner ring-1 ring-teal-200/60">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
          <div className="absolute -inset-3 rounded-[1.35rem] bg-gradient-to-r from-teal-400/25 to-emerald-500/25 blur-2xl animate-pulse" />
        </div>
        <p className="mt-7 text-sm font-medium tracking-tight text-slate-600">
          Chargement des préparations…
        </p>
        <p className="mt-1 text-xs text-slate-400">Véhicules en traitement et diagnostics</p>
      </div>
    );
  }

  const hasDetailLines = selected ? buildDetailOptions(selected, catalog).length > 0 : false;
  const allPiecesAdded = selected ? allDetailsHavePieces(selected, catalog) : false;
  const missingPieceCount = selected ? countDetailsMissingPieces(selected, catalog) : 0;
  const saved = selected ? isReparationEnregistree(selected) : false;
  const enregistrerBusy = selected ? enregistrerVoitureId === selected.id : false;
  const canEnregistrer = Boolean(selected && hasDetailLines && allPiecesAdded && !saved);
  const pieceCount = selected ? countPieces(selected) : 0;
  const warrantyLockedOnly = Boolean(
    selected &&
      !hasDetailLines &&
      allDetails(selected).length > 0 &&
      actionableDetails(selected, catalog).length === 0
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-[max(7.25rem,calc(5.75rem+env(safe-area-inset-bottom)))] sm:pb-12">
      <Dialog
        open={sortieOpen}
        onOpenChange={(open) => {
          setSortieOpen(open);
          if (!open) setSortieAddAnother(false);
        }}
      >
        <DialogContent className="flex max-h-[min(92dvh,calc(100dvh-1rem))] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:bg-slate-100/90 [&_[data-slot=dialog-close]]:hover:bg-slate-200/90">
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
                      {sortieAddAnother
                        ? "Ajouter une autre pièce"
                        : sortieIsEdit
                          ? "Modifier la sortie de pièce"
                          : "Sortie de pièce"}
                    </DialogTitle>
                    <DialogDescription className="text-left text-sm leading-relaxed text-slate-600">
                      {sortieAddAnother
                        ? "Choisissez une autre référence en stock pour cette même ligne. Les sorties précédentes restent inchangées."
                        : sortieIsEdit
                          ? "Changez la référence ou la quantité : le stock est recalculé automatiquement."
                          : "Indiquez la pièce, la quantité et la ligne de diagnostic concernée."}
                    </DialogDescription>
                  </div>
                </div>
                {sortieVoiture && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 text-xs text-slate-700 ring-1 ring-slate-950/[0.04] sm:mt-4">
                    <Car className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                    <span className="font-medium text-slate-800">{sortieVoiture.model}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono text-[11px] font-semibold tracking-tight text-slate-700">
                      {sortieVoiture.immatriculation}
                    </span>
                  </div>
                )}
              </DialogHeader>
            </div>

            <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/90 to-slate-50 px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-4 sm:gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="piece-sav"
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <Package className="h-3.5 w-3.5 text-teal-600" />
                  Pièce en stock
                </Label>
                <Select value={sortiePieceId} onValueChange={setSortiePieceId}>
                  <SelectTrigger
                    id="piece-sav"
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
                {selectedPiece && (
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <span className="inline-flex rounded-md bg-white px-1.5 py-0.5 font-medium text-teal-800 ring-1 ring-teal-200/80">
                      Stock restant : {selectedPiece.quantite_restante}
                    </span>
                    {selectedPiece.model_voiture && (
                      <span className="text-slate-500">· {selectedPiece.model_voiture}</span>
                    )}
                  </p>
                )}
                {piecesStock.length === 0 && (
                  <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Aucune pièce en stock — ajoutez des références dans la gestion SAV.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="qty-sortie"
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <Hash className="h-3.5 w-3.5 text-teal-600" />
                  Quantité sortie
                </Label>
                <Input
                  id="qty-sortie"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={sortieQty}
                  onChange={(e) => setSortieQty(e.target.value)}
                  className="h-11 w-full border-slate-200 bg-white font-medium shadow-sm tabular-nums focus-visible:ring-teal-500/25 sm:max-w-[140px]"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="detail-dx"
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <ListChecks className="h-3.5 w-3.5 text-teal-600" />
                  Ligne de diagnostic
                </Label>
                <Select
                  value={sortieDetailId}
                  onValueChange={(id) => {
                    setSortieDetailId(id);
                    if (sortiePresetDetailId || !sortieVoiture) return;
                    syncPieceStateForDetailLine(sortieVoiture, id);
                  }}
                  disabled={Boolean(sortiePresetDetailId)}
                >
                  <SelectTrigger
                    id="detail-dx"
                    className={cn(
                      "h-11 w-full border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color] hover:border-slate-300 focus:ring-teal-500/20",
                      sortiePresetDetailId && "cursor-not-allowed opacity-90"
                    )}
                  >
                    <SelectValue placeholder="Sélectionner une ligne…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(280px,50vh)]">
                    {detailOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sortiePresetDetailId && (
                  <p className="flex items-start gap-1.5 text-xs leading-snug text-teal-800">
                    <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    Ligne verrouillée : ouverte depuis ce détail.
                  </p>
                )}
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
              onClick={() => void submitSortie()}
              disabled={sortieSubmitting || detailOptions.length === 0 || piecesStock.length === 0}
            >
              {sortieSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                sortieIsEdit ? "Enregistrer" : "Valider la sortie"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mx-auto max-w-6xl space-y-4 px-3 pt-3 sm:space-y-6 sm:px-4 sm:pt-5 lg:px-6">
        <section className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-teal-800 via-emerald-700 to-teal-900 text-white shadow-[0_18px_44px_-18px_rgba(13,148,136,0.45)] sm:rounded-3xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(255,255,255,0.2),transparent)]" />
          <div className="absolute -right-20 -bottom-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl sm:h-72 sm:w-72" />
          <div className="relative px-4 py-5 sm:px-8 sm:py-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm sm:h-9 sm:w-9">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/95 sm:text-[11px]">
                Atelier SAV
              </span>
              {voitures.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white ring-1 ring-white/20 sm:px-3 sm:py-1 sm:text-xs">
                  {voitures.length} en cours
                </span>
              )}
            </div>
            <h1 className="mt-3 text-[1.65rem] font-bold leading-tight tracking-tight sm:mt-4 sm:text-3xl lg:text-[2.15rem]">
              Voiture en P
              réparation
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-teal-100/90 sm:mt-3 sm:text-base">
              <span className="font-semibold text-white">DIAGNOSTIC FINI</span>
              {" — "}
              sorties de pièces et enregistrement de la préparation.
            </p>
          </div>
        </section>

        {voitures.length === 0 ? (
          <Card className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm ring-1 ring-slate-950/5">
            <CardContent className="flex flex-col items-center px-4 py-10 text-center sm:py-12">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-400/30 to-emerald-400/20 blur-lg" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 sm:h-20 sm:w-20">
                  <Car className="h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />
                </div>
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight text-slate-800 sm:mt-7 sm:text-xl">
                Aucun véhicule au diagnostic fini
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                Les véhicules au statut{" "}
                <span className="font-medium text-slate-700">DIAGNOSTIC_FINI</span>{" "}
                apparaîtront ici avec leurs diagnostics d&apos;arrivée.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
            <aside className="space-y-2.5 lg:sticky lg:top-20 lg:self-start">
              <div className="flex items-center justify-between px-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Véhicules
                </p>
                <Badge variant="secondary" className="tabular-nums">
                  {voitures.length}
                </Badge>
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 snap-x snap-mandatory [scrollbar-width:thin] lg:hidden">
                {voitures.map((v) => {
                  const active = v.id === selectedId;
                  const ready = allDetailsHavePieces(v, catalog);
                  const sousGarantie = hasGarantie(v);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedId(v.id)}
                      className={cn(
                        "snap-start min-w-[11.5rem] shrink-0 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200",
                        active
                          ? "border-teal-500/45 bg-teal-50 shadow-md shadow-teal-600/10 ring-1 ring-teal-500/20"
                          : "border-slate-200 bg-white hover:border-teal-300/60 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                            active ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          <Car className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {clientLabel(v)}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                            {v.immatriculation}
                          </p>
                        </div>
                        {ready && (
                          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                        )}
                      </div>
                      {sousGarantie && (
                        <div className="mt-1.5 pl-[2.625rem]">
                          <GarantieBadge compact />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="hidden max-h-[calc(100vh-12rem)] space-y-2 overflow-y-auto pr-0.5 [scrollbar-width:thin] lg:block">
                {voitures.map((v) => {
                  const active = v.id === selectedId;
                  const ready = allDetailsHavePieces(v, catalog);
                  const done = isReparationEnregistree(v);
                  const sousGarantie = hasGarantie(v);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedId(v.id)}
                      className={cn(
                        "group w-full rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-200",
                        active
                          ? "border-teal-500/40 bg-gradient-to-br from-teal-50 to-cyan-50/70 shadow-md shadow-teal-600/10 ring-1 ring-teal-500/20"
                          : "border-slate-200/80 bg-white hover:border-teal-300/50 hover:bg-slate-50 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            active ? "bg-teal-600 text-white shadow-sm" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          <Car className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {clientLabel(v)}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                            {v.immatriculation}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-slate-500">{v.model}</p>
                          {sousGarantie && (
                            <div className="mt-1.5">
                              <GarantieBadge />
                            </div>
                          )}
                        </div>
                        {done ? (
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : ready ? (
                          <Package className="mt-1 h-4 w-4 shrink-0 text-teal-600" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {selected && (
              <div className="min-w-0 space-y-4 sm:space-y-5">
                <Card className="overflow-hidden rounded-2xl border-slate-200/90 shadow-sm ring-1 ring-slate-950/5">
                  <div className="bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3 sm:gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-600/25 ring-1 ring-white/30 sm:h-14 sm:w-14">
                          <Car className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800/90">
                            Client & véhicule
                          </p>
                          <p className="mt-1 truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                            {clientLabel(selected)}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-slate-600">
                            {selected.model}
                            <span className="text-slate-400"> · </span>
                            <span className="font-mono text-slate-700">{selected.immatriculation}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <Badge
                          variant="outline"
                          className="border-teal-200/80 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-900"
                        >
                          {selected.statut}
                        </Badge>
                        {hasGarantie(selected) && <GarantieBadge />}
                        {saved && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Enregistrée
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
                      {[
                        {
                          icon: Car,
                          label: "Immatriculation",
                          value: selected.immatriculation,
                          mono: true,
                        },
                        {
                          icon: Palette,
                          label: "Couleur",
                          value: selected.couleur || "—",
                        },
                        {
                          icon: Gauge,
                          label: "Motorisation",
                          value: selected.motorisation || "—",
                        },
                        {
                          icon: Cog,
                          label: "Transmission",
                          value: selected.transmission || "—",
                        },
                      ].map(({ icon: Icon, label, value, mono }) => (
                        <div
                          key={label}
                          className="min-w-0 rounded-xl border border-slate-100/90 bg-white/80 px-2.5 py-2.5 shadow-sm ring-1 ring-slate-950/[0.03] sm:px-3 sm:py-3"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
                            <Icon className="h-3 w-3 shrink-0 opacity-70" />
                            <span className="truncate">{label}</span>
                          </div>
                          <p
                            className={cn(
                              "mt-1 truncate text-[13px] font-semibold leading-snug text-slate-900 sm:mt-1.5 sm:text-sm",
                              mono && "font-mono tracking-tight"
                            )}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:block sm:px-6">
                    <RegisterCta
                      saved={saved}
                      canEnregistrer={canEnregistrer}
                      busy={enregistrerBusy}
                      hasDetailLines={hasDetailLines}
                      allPiecesAdded={allPiecesAdded}
                      missingPieceCount={missingPieceCount}
                      pieceCount={pieceCount}
                      warrantyLockedOnly={warrantyLockedOnly}
                      onClick={() => void enregistrerReparation(selected.id)}
                    />
                    {piecesStock.length === 0 && (
                      <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Aucune pièce en stock — enregistrez des pièces dans la gestion SAV.
                      </p>
                    )}
                  </div>
                </Card>

                <div className="flex items-center justify-between gap-2 px-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Diagnostic & pièces
                  </p>
                  {pieceCount > 0 && (
                    <span className="text-xs font-medium text-teal-700">
                      {pieceCount} pièce{pieceCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <DiagnosticSection
                  voiture={selected}
                  catalog={catalog}
                  onDetailRowClick={(id) => openSortieDialog(selected, id)}
                  onAddAnotherPiece={(detailId) =>
                    openSortieDialog(selected, detailId, { addAnother: true })
                  }
                  onEditPiece={(detailId, pieceId) =>
                    openSortieDialog(selected, detailId, { replacePieceId: pieceId })
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden supports-[padding:max(0px)]:pb-[max(0.7rem,env(safe-area-inset-bottom))]">
          <RegisterCta
            compact
            saved={saved}
            canEnregistrer={canEnregistrer}
            busy={enregistrerBusy}
            hasDetailLines={hasDetailLines}
            allPiecesAdded={allPiecesAdded}
            missingPieceCount={missingPieceCount}
            pieceCount={pieceCount}
            warrantyLockedOnly={warrantyLockedOnly}
            onClick={() => void enregistrerReparation(selected.id)}
          />
        </div>
      )}
    </div>
  );
}
