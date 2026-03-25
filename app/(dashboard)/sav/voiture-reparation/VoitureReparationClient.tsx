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
import { Loader2, Car, User, Wrench, ClipboardList } from "lucide-react";
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

function findPieceForDetail(
  voiture: VoitureSAVRow,
  detailId: string
): PieceSAVLink | null {
  for (const da of voiture.diagnosticArrivee ?? []) {
    const p = da.PieceSAV?.find((x) => x.detailDiagnosticId === detailId);
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
}: {
  voiture: VoitureSAVRow;
  onDetailRowClick: (detailId: string) => void;
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
                        const piece = da.PieceSAV?.find((p) => p.detailDiagnosticId === d.id);
                        const hasPiece = Boolean(piece);
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
                              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span>{d.nom}</span>
                                {hasPiece && piece ? (
                                  <span className="text-xs font-normal text-slate-600">
                                    <span className="text-teal-700 font-medium">
                                      {piece.nom}
                                      {piece.part_code ? ` (${piece.part_code})` : ""}
                                    </span>
                                    <span className="text-teal-600">
                                      {" "}
                                      — Changer la pièce
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-xs font-normal text-teal-600">
                                    — Cliquer pour sortir une pièce
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

  const openSortieDialog = (voiture: VoitureSAVRow, presetDetailId: string | null) => {
    setSortieVoiture(voiture);
    setSortiePresetDetailId(presetDetailId);
    setSortieDetailId(presetDetailId ?? "");
    if (presetDetailId) {
      const ex = findPieceForDetail(voiture, presetDetailId);
      if (ex) {
        setSortiePieceId(ex.id);
        setSortieQty(String(ex.quantiteSortieDetail > 0 ? ex.quantiteSortieDetail : 1));
        setSortieReplacePieceId(ex.id);
      } else {
        setSortiePieceId("");
        setSortieQty("1");
        setSortieReplacePieceId(null);
      }
    } else {
      setSortiePieceId("");
      setSortieQty("1");
      setSortieReplacePieceId(null);
    }
    setSortieOpen(true);
  };

  useEffect(() => {
    if (!sortieOpen || !sortieVoiture || !sortieDetailId || sortiePresetDetailId) return;
    const ex = findPieceForDetail(sortieVoiture, sortieDetailId);
    if (ex) {
      setSortiePieceId(ex.id);
      setSortieQty(String(ex.quantiteSortieDetail > 0 ? ex.quantiteSortieDetail : 1));
      setSortieReplacePieceId(ex.id);
    } else {
      setSortiePieceId("");
      setSortieQty("1");
      setSortieReplacePieceId(null);
    }
  }, [sortieOpen, sortieVoiture, sortieDetailId, sortiePresetDetailId]);

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

    const alloc = findPieceForDetail(sortieVoiture, sortieDetailId);
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-teal-100 flex items-center justify-center shadow-inner">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-teal-400/30 to-emerald-500/30 blur-xl animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-medium text-slate-500">Chargement des réparations…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <Dialog open={sortieOpen} onOpenChange={setSortieOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {sortieIsEdit ? "Changer la pièce ou la quantité" : "Sortie de pièce pour le diagnostic"}
            </DialogTitle>
            <DialogDescription>
              {sortieIsEdit
                ? "Modifiez la pièce ou la quantité sortie pour cette ligne. Le stock (quantite_restante) est ajusté (y compris si vous changez de référence)."
                : "Choisissez la pièce en stock, la quantité à sortir (quantite_sortie) et la ligne de diagnostic. Le stock (quantite_restante) sera mis à jour automatiquement."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="piece-sav">Pièce (stock)</Label>
              <Select value={sortiePieceId} onValueChange={setSortiePieceId}>
                <SelectTrigger id="piece-sav" className="w-full">
                  <SelectValue placeholder="Sélectionner une pièce" />
                </SelectTrigger>
                <SelectContent>
                  {piecesStock.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                      {p.part_code ? ` (${p.part_code})` : ""} — restant : {p.quantite_restante}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qty-sortie">Quantité sortie</Label>
              <Input
                id="qty-sortie"
                type="number"
                min={1}
                step={1}
                value={sortieQty}
                onChange={(e) => setSortieQty(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="detail-dx">Ligne de diagnostic (DetailDiagnostic)</Label>
              <Select
                value={sortieDetailId}
                onValueChange={setSortieDetailId}
                disabled={Boolean(sortiePresetDetailId)}
              >
                <SelectTrigger id="detail-dx" className="w-full">
                  <SelectValue placeholder="Sélectionner un détail" />
                </SelectTrigger>
                <SelectContent>
                  {detailOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sortiePresetDetailId && (
                <p className="text-xs text-slate-500">
                  Détail imposé depuis la ligne sur laquelle vous avez cliqué.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSortieOpen(false)} disabled={sortieSubmitting}>
              Annuler
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => void submitSortie()}
              disabled={sortieSubmitting || detailOptions.length === 0 || piecesStock.length === 0}
            >
              {sortieSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enregistrement…
                </>
              ) : (
                "Valider la sortie"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-[1.75rem] bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 px-6 pt-10 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.2),transparent)]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Wrench className="h-4 w-4 text-teal-100" />
            </div>
            <span className="text-sm font-semibold text-teal-100/95 uppercase tracking-widest">
              Atelier SAV
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Voiture en réparation
          </h1>
          <p className="mt-3 text-lg text-teal-100/90 max-w-xl">
            Véhicules au statut <span className="font-semibold">EN TRAITEMENT</span> avec leurs
            diagnostics d&apos;arrivée.
          </p>
          {voitures.length > 0 && (
            <p className="mt-4 text-sm text-teal-200/90">
              {voitures.length} véhicule{voitures.length > 1 ? "s" : ""} en cours
            </p>
          )}
        </div>
      </div>

      {voitures.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 px-6 py-8">
            <CardContent className="flex flex-col items-center text-center py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200/80">
                <Car className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-700">
                Aucun véhicule en traitement
              </h3>
              <p className="mt-2 text-slate-500 max-w-md">
                Les voitures dont le statut est <span className="font-medium text-slate-600">EN_TRAITEMENT</span>{" "}
                apparaîtront ici avec leurs diagnostics.
              </p>
            </CardContent>
          </div>
        </Card>
      ) : (
        <Tabs
          key={voitures.map((v) => v.id).join(",")}
          defaultValue={voitures[0]?.id}
          className="w-full"
        >
          <div className="mb-6">
            <TabsList
              className={cn(
                "inline-flex flex-nowrap gap-2 h-auto p-2 rounded-2xl",
                "bg-slate-100/90 border border-slate-200/80 shadow-sm",
                "overflow-x-auto overflow-y-hidden max-w-full"
              )}
            >
              {voitures.map((v) => (
                <TabsTrigger
                  key={v.id}
                  value={v.id}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-xl px-5 py-3.5 min-w-[200px]",
                    "text-left whitespace-nowrap",
                    "data-[state=active]:bg-white data-[state=active]:text-teal-800",
                    "data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-slate-200/80",
                    "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/60"
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    {[v.ClientSAV?.nom, v.ClientSAV?.prenom].filter(Boolean).join(" ") || "—"}
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Car className="h-3 w-3 shrink-0" />
                    {v.model} • {v.immatriculation}
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
              <TabsContent key={v.id} value={v.id} className="mt-0 focus-visible:ring-0 space-y-6">
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-6 text-sm">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Immatriculation
                      </p>
                      <p className="font-mono font-semibold text-slate-900">{v.immatriculation}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Couleur
                      </p>
                      <p className="font-medium text-slate-800">{v.couleur}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider" />
                      <Badge className="bg-teal-100 text-teal-800 border-teal-200">{v.statut}</Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full font-semibold shadow-md transition-all duration-300 mt-4 border-0",
                      saved
                        ? "bg-slate-400 text-white cursor-not-allowed hover:bg-slate-400 hover:scale-100"
                        : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white hover:shadow-lg transform hover:scale-[1.02]"
                    )}
                    disabled={!canEnregistrer || enregistrerBusy}
                    onClick={() => void enregistrerReparation(v.id)}
                  >
                    {enregistrerBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                        Enregistrement…
                      </>
                    ) : saved ? (
                      "Réparation enregistrée"
                    ) : (
                      "Enregistrer la réparation"
                    )}
                  </Button>
                  {saved && (
                    <p className="mt-2 text-xs text-center text-emerald-700">
                      Les données de réparation sont enregistrées.
                    </p>
                  )}
                  {!hasDetailLines && (
                    <p className="mt-2 text-xs text-center text-amber-700">
                      Ajoutez d&apos;abord des lignes de diagnostic pour lier une sortie de pièce.
                    </p>
                  )}
                  {piecesStock.length === 0 && (
                    <p className="mt-1 text-xs text-center text-amber-700">
                      Aucune pièce en stock — enregistrez des pièces dans la gestion SAV.
                    </p>
                  )}
                </div>
                <DiagnosticSection voiture={v} onDetailRowClick={(id) => openSortieDialog(v, id)} />
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
