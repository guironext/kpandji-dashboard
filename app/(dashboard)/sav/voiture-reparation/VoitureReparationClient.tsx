"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Car,
  User,
  Wrench,
  ClipboardList,
  Palette,
  Gauge,
  Cog,
  CheckCircle2,
  Package,
  Hash,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
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

interface VoitureSAVRow {
  id: string;
  model: string;
  immatriculation: string;
  couleur: string;
  motorisation: string;
  transmission: string;
  statut: string;
  ClientSAV?: ClientSAV;
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

async function fetchVoituresEnTraitement(): Promise<VoitureSAVRow[]> {
  const res = await fetch(
    "/api/sav/voiture-sav?statut=EN_TRAITEMENT&includeDiagnostic=1"
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Erreur chargement des véhicules");
  }
  return json.data || [];
}

async function fetchPiecesStock(): Promise<PieceStockOption[]> {
  const res = await fetch("/api/sav/piece-sav");
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Erreur chargement des pièces");
  }
  return json.data || [];
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

function isReparationEnregistree(voiture: VoitureSAVRow): boolean {
  const details =
    voiture.diagnosticArrivee?.flatMap((da) => da.DetailDiagnostic ?? []) ?? [];
  if (details.length === 0) return false;
  return details.every((d) => d.reparationId != null && String(d.reparationId).trim() !== "");
}

function buildDetailOptions(voiture: VoitureSAVRow) {
  const out: {
    id: string;
    diagnosticArriveeId: string;
    label: string;
  }[] = [];
  for (const da of voiture.diagnosticArrivee ?? []) {
    const catNom = da.catergorieDiagnostic?.nom ?? "Catégorie";
    for (const d of da.DetailDiagnostic ?? []) {
      out.push({
        id: d.id,
        diagnosticArriveeId: da.id,
        label: `${catNom} — ${d.nom}`,
      });
    }
  }
  return out;
}

function DiagnosticSection({
  voiture,
  onDetailRowClick,
  onAddAnotherPiece,
  onEditPiece,
}: {
  voiture: VoitureSAVRow;
  onDetailRowClick: (detailId: string) => void;
  onAddAnotherPiece: (detailId: string) => void;
  onEditPiece: (detailId: string, pieceId: string) => void;
}) {
  const diagnostics = voiture.diagnosticArrivee ?? [];

  if (diagnostics.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80">
            <ClipboardList className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-700">
            Aucun diagnostic d&apos;arrivée
          </h3>
          <p className="mt-2 max-w-sm mx-auto text-slate-500 text-sm">
            Ce véhicule est en traitement mais n&apos;a pas encore de lignes de diagnostic
            enregistrées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {diagnostics.map((da, idx) => {
        const accent = CATEGORY_ACCENTS[idx % CATEGORY_ACCENTS.length];
        const catNom = da.catergorieDiagnostic?.nom ?? "Catégorie";
        const details = da.DetailDiagnostic ?? [];

        return (
          <Card
            key={da.id}
            className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <CardHeader className="pb-3 pt-5 bg-gradient-to-r from-slate-50/90 to-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={cn("h-1 w-8 rounded-full bg-gradient-to-r", accent)} />
                  <CardTitle className="text-lg font-semibold text-slate-800 tracking-tight">
                    {catNom}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs font-normal text-slate-600">
                  {details.length} ligne{details.length > 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-5">
              {details.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">Aucun détail pour cette catégorie.</p>
              ) : (
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
                        <TableHead className="font-semibold text-slate-700">Détail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((d, i) => {
                        const pieces = findPiecesForDetail(voiture, d.id);
                        const hasPiece = pieces.length > 0;
                        return (
                          <TableRow
                            key={d.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onDetailRowClick(d.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onDetailRowClick(d.id);
                              }
                            }}
                            className={cn(
                              i % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                              "cursor-pointer hover:bg-teal-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                            )}
                          >
                            <TableCell className="font-medium text-slate-900">
                              <span className="flex flex-col gap-2">
                                <span>{d.nom}</span>
                                {hasPiece ? (
                                  <span className="flex flex-col gap-2 text-xs font-normal text-slate-600">
                                    {pieces.map((piece) => (
                                      <span
                                        key={piece.id}
                                        className="flex flex-wrap items-center gap-x-2 gap-y-1"
                                      >
                                        <span className="text-teal-700 font-medium">
                                          {piece.nom}
                                          {piece.part_code ? ` (${piece.part_code})` : ""}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEditPiece(d.id, piece.id);
                                          }}
                                        >
                                          Changer la pièce
                                        </Button>
                                      </span>
                                    ))}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-fit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAddAnotherPiece(d.id);
                                      }}
                                    >
                                      Autre pièce
                                    </Button>
                                  </span>
                                ) : (
                                  <span className="text-xs font-normal text-teal-600">
                                    — Cliquer pour Ajouter une pièce
                                  </span>
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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
  const [loading, setLoading] = useState(true);

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

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchVoituresEnTraitement();
      setVoitures(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

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
  }, [loadPieces]);

  const openSortieDialog = (
    voiture: VoitureSAVRow,
    presetDetailId: string | null,
    opts?: { addAnother?: boolean; replacePieceId?: string }
  ) => {
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
    return buildDetailOptions(sortieVoiture);
  }, [sortieVoiture]);

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
      await Promise.all([load(), loadPieces()]);
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
          : "Réparation enregistrée en base."
      );
      await load();
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
          Chargement des réparations…
        </p>
        <p className="mt-1 text-xs text-slate-400">Véhicules en traitement et diagnostics</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Dialog
        open={sortieOpen}
        onOpenChange={(open) => {
          setSortieOpen(open);
          if (!open) setSortieAddAnother(false);
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
                      {sortieAddAnother
                        ? "Ajouter une autre pièce"
                        : sortieIsEdit
                          ? "Modifier la sortie de pièce"
                          : "Sortie de pièce — diagnostic"}
                    </DialogTitle>
                    <DialogDescription className="text-left text-sm leading-relaxed text-slate-600">
                      {sortieAddAnother
                        ? "Choisissez une autre référence en stock pour cette même ligne de diagnostic. Les sorties précédentes restent inchangées."
                        : sortieIsEdit
                          ? "Changez la référence ou la quantité : le stock est recalculé automatiquement, y compris si vous remplacez la pièce."
                          : "Indiquez la pièce en stock, la quantité et la ligne de diagnostic concernée. Les quantités disponibles sont mises à jour automatiquement."}
                    </DialogDescription>
                  </div>
                </div>
                {sortieVoiture && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 text-xs text-slate-700 ring-1 ring-slate-950/[0.04]">
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

            <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/90 to-slate-50 px-6 py-5">
              <div className="grid gap-5">
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
                  <p className="flex items-center gap-1.5 text-xs text-slate-600">
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
                  value={sortieQty}
                  onChange={(e) => setSortieQty(e.target.value)}
                  className="h-11 max-w-[140px] border-slate-200 bg-white font-medium shadow-sm tabular-nums focus-visible:ring-teal-500/25"
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
                    Ligne verrouillée : vous avez ouvert la sortie depuis cette ligne.
                  </p>
                )}
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
              onClick={() => void submitSortie()}
              disabled={sortieSubmitting || detailOptions.length === 0 || piecesStock.length === 0}
            >
              {sortieSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                sortieIsEdit ? "Enregistrer les changements" : "Valider la sortie"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative -mx-6 -mt-6 mb-10 overflow-hidden rounded-b-[1.75rem] bg-gradient-to-br from-teal-700 via-emerald-700 to-teal-800 px-6 pt-10 pb-10 sm:pt-12 sm:pb-11">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(255,255,255,0.22),transparent)]" />
        <div className="absolute -right-32 -bottom-24 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-100/95">
              Atelier SAV
            </span>
            {voitures.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
                {voitures.length} en cours
              </span>
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-[2.25rem] sm:leading-tight">
            Voiture en réparation
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-teal-100/90 sm:text-lg">
            <span className="font-semibold text-white">EN TRAITEMENT</span>
            {" — "}
            suivez les diagnostics d&apos;arrivée et les sorties de pièces pour chaque véhicule.
          </p>
        </div>
      </div>

      {voitures.length === 0 ? (
        <div className="mx-auto max-w-lg">
          <Card className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm ring-1 ring-slate-950/5">
            <div className="bg-gradient-to-b from-slate-50 via-white to-teal-50/30 px-6 py-10 sm:py-12">
              <CardContent className="flex flex-col items-center px-0 text-center">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-teal-400/30 to-emerald-400/20 blur-lg" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80">
                    <Car className="h-10 w-10 text-slate-400" />
                  </div>
                </div>
                <h3 className="mt-7 text-xl font-semibold tracking-tight text-slate-800">
                  Aucun véhicule en traitement
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                  Les véhicules au statut{" "}
                  <span className="font-medium text-slate-700">EN_TRAITEMENT</span> apparaîtront ici
                  avec leurs diagnostics d&apos;arrivée.
                </p>
              </CardContent>
            </div>
          </Card>
        </div>
      ) : (
        <Tabs
          key={voitures.map((v) => v.id).join(",")}
          defaultValue={voitures[0]?.id}
          className="mx-auto w-full max-w-5xl"
        >
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sélectionner un véhicule
            </p>
            <TabsList
              className={cn(
                "inline-flex h-auto w-full flex-nowrap justify-start gap-2 rounded-2xl p-2",
                "border border-slate-200/90 bg-slate-100/80 shadow-sm ring-1 ring-slate-950/5",
                "overflow-x-auto overflow-y-hidden max-w-full [scrollbar-width:thin]",
                "snap-x snap-mandatory sm:snap-none"
              )}
            >
              {voitures.map((v) => (
                <TabsTrigger
                  key={v.id}
                  value={v.id}
                  className={cn(
                    "flex min-w-[min(100%,220px)] flex-shrink-0 snap-start flex-col items-start gap-1 rounded-xl px-4 py-3.5 sm:min-w-[min(100%,240px)] sm:px-5",
                    "text-left transition-[box-shadow,transform,background-color] duration-200",
                    "data-[state=active]:bg-white data-[state=active]:text-teal-900",
                    "data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-slate-200/90",
                    "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/70"
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold leading-tight">
                    <User className="h-3.5 w-3.5 shrink-0 opacity-80" />
                    <span className="truncate">
                      {[v.ClientSAV?.nom, v.ClientSAV?.prenom].filter(Boolean).join(" ") || "—"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Car className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {v.model} · {v.immatriculation}
                    </span>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {voitures.map((v) => {
            const hasDetailLines = buildDetailOptions(v).length > 0;
            const saved = isReparationEnregistree(v);
            const enregistrerBusy = enregistrerVoitureId === v.id;
            const canEnregistrer = hasDetailLines && !saved;
            return (
              <TabsContent key={v.id} value={v.id} className="mt-0 focus-visible:ring-0 space-y-8">
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-950/5">
                  <div className="bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-5 py-5 sm:px-6 sm:py-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-600/25 ring-1 ring-white/30">
                          <Car className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800/90">
                            Client & véhicule
                          </p>
                          <p className="mt-1 truncate text-lg font-semibold tracking-tight text-slate-900">
                            {[v.ClientSAV?.nom, v.ClientSAV?.prenom].filter(Boolean).join(" ") || "—"}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-slate-600">
                            {v.model}
                            <span className="text-slate-400"> · </span>
                            <span className="font-mono text-slate-700">{v.immatriculation}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                        <Badge
                          variant="outline"
                          className="border-teal-200/80 bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-900"
                        >
                          {v.statut}
                        </Badge>
                        {saved && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Réparation enregistrée
                          </span>
                        )}
                      </div>
                    </div>

                    <Separator className="my-5 bg-slate-200/90" />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                      {[
                        {
                          icon: Car,
                          label: "Immatriculation",
                          value: v.immatriculation,
                          mono: true,
                        },
                        {
                          icon: Palette,
                          label: "Couleur",
                          value: v.couleur || "—",
                        },
                        {
                          icon: Gauge,
                          label: "Motorisation",
                          value: v.motorisation || "—",
                        },
                        {
                          icon: Cog,
                          label: "Transmission",
                          value: v.transmission || "—",
                        },
                      ].map(({ icon: Icon, label, value, mono }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-100/90 bg-white/80 px-3 py-3 shadow-sm ring-1 ring-slate-950/[0.03]"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            <Icon className="h-3 w-3 opacity-70" />
                            {label}
                          </div>
                          <p
                            className={cn(
                              "mt-1.5 text-sm font-semibold leading-snug text-slate-900",
                              mono && "font-mono text-[13px] tracking-tight"
                            )}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 w-full font-semibold shadow-sm transition-all duration-200 sm:h-12",
                        saved
                          ? "cursor-not-allowed border-slate-200 bg-slate-300 text-white hover:bg-slate-300"
                          : "border-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md hover:from-teal-700 hover:to-emerald-700 hover:shadow-lg"
                      )}
                      disabled={!canEnregistrer || enregistrerBusy}
                      onClick={() => void enregistrerReparation(v.id)}
                    >
                      {enregistrerBusy ? (
                        <>
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                          Enregistrement…
                        </>
                      ) : saved ? (
                        "Réparation enregistrée"
                      ) : (
                        "Enregistrer la réparation"
                      )}
                    </Button>
                    {saved && (
                      <p className="mt-3 text-center text-xs text-emerald-700">
                        Les données de réparation sont enregistrées.
                      </p>
                    )}
                    {!hasDetailLines && (
                      <p className="mt-3 text-center text-xs text-amber-800">
                        Ajoutez d&apos;abord des lignes de diagnostic pour lier une sortie de pièce.
                      </p>
                    )}
                    {piecesStock.length === 0 && (
                      <p className="mt-2 text-center text-xs text-amber-800">
                        Aucune pièce en stock — enregistrez des pièces dans la gestion SAV.
                      </p>
                    )}
                  </div>
                </div>
                <DiagnosticSection
                  voiture={v}
                  onDetailRowClick={(id) => openSortieDialog(v, id)}
                  onAddAnotherPiece={(detailId) => openSortieDialog(v, detailId, { addAnother: true })}
                  onEditPiece={(detailId, pieceId) =>
                    openSortieDialog(v, detailId, { replacePieceId: pieceId })
                  }
                />
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
