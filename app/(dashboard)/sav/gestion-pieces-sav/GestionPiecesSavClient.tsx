"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Package,
  Pencil,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ReparationOption = {
  id: string;
  label: string;
};

export type GestionPieceRow = {
  id: string;
  nom: string;
  model_voiture: string | null;
  marque_piece: string | null;
  part_code: string | null;
  description: string | null;
  prix_achat: number | null;
  prix_vente: number | null;
  quantite_entree: number;
  quantite_sortie: number;
  quantite_restante: number;
};

const priceFmt = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export default function GestionPiecesSavClient({
  initialPieces,
  reparationOptions = [],
  loadError = null,
}: {
  initialPieces: GestionPieceRow[];
  reparationOptions?: ReparationOption[];
  loadError?: string | null;
}) {
  const router = useRouter();
  const [pieces, setPieces] = useState(initialPieces);
  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [entreeOpen, setEntreeOpen] = useState(false);
  const [sortieOpen, setSortieOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mouvementSubmitting, setMouvementSubmitting] = useState(false);
  const [active, setActive] = useState<GestionPieceRow | null>(null);
  const [mouvementQty, setMouvementQty] = useState("");
  const [sortieReparationId, setSortieReparationId] = useState("");

  const [nom, setNom] = useState("");
  const [modelVoiture, setModelVoiture] = useState("");
  const [marquePiece, setMarquePiece] = useState("");
  const [partCode, setPartCode] = useState("");
  const [description, setDescription] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [quantiteEntree, setQuantiteEntree] = useState("0");

  useEffect(() => {
    setPieces(initialPieces);
  }, [initialPieces]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return pieces;
    return pieces.filter((p) => {
      const hay = [
        p.nom,
        p.model_voiture,
        p.marque_piece,
        p.part_code,
        p.description,
      ]
        .filter(Boolean)
        .join(" ");
      return normalize(hay).includes(q);
    });
  }, [pieces, search]);

  function openEdit(p: GestionPieceRow) {
    setActive(p);
    setNom(p.nom);
    setModelVoiture(p.model_voiture ?? "");
    setMarquePiece(p.marque_piece ?? "");
    setPartCode(p.part_code ?? "");
    setDescription(p.description ?? "");
    setPrixAchat(
      p.prix_achat != null ? String(p.prix_achat) : ""
    );
    setPrixVente(
      p.prix_vente != null ? String(p.prix_vente) : ""
    );
    setQuantiteEntree(String(p.quantite_entree));
    setEditOpen(true);
  }

  function openDelete(p: GestionPieceRow) {
    setActive(p);
    setDeleteOpen(true);
  }

  function openEntree(p: GestionPieceRow) {
    setActive(p);
    setMouvementQty("");
    setEntreeOpen(true);
  }

  function openSortie(p: GestionPieceRow) {
    setActive(p);
    setMouvementQty("");
    setSortieReparationId("");
    setSortieOpen(true);
  }

  async function submitMouvement(type: "ENTREE" | "SORTIE") {
    if (!active) return;
    const q = Number(mouvementQty.trim());
    if (!Number.isFinite(q) || !Number.isInteger(q) || q <= 0) {
      toast.error("Indiquez un entier strictement positif.");
      return;
    }
    if (type === "SORTIE" && q > active.quantite_restante) {
      toast.error(
        `Quantité trop élevée (restant : ${active.quantite_restante}).`
      );
      return;
    }
    if (type === "SORTIE") {
      if (!sortieReparationId.trim()) {
        toast.error("Sélectionnez la réparation concernée.");
        return;
      }
      if (reparationOptions.length === 0) {
        toast.error("Aucune réparation disponible.");
        return;
      }
    }
    setMouvementSubmitting(true);
    try {
      const res = await fetch(`/api/sav/piece-sav/${active.id}/mouvement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "SORTIE"
            ? {
                type,
                quantite: q,
                reparationId: sortieReparationId.trim(),
              }
            : { type, quantite: q }
        ),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Mouvement impossible");
      }
      toast.success(
        type === "ENTREE" ? "Entrée enregistrée." : "Sortie enregistrée."
      );
      setEntreeOpen(false);
      setSortieOpen(false);
      setActive(null);
      setMouvementQty("");
      setSortieReparationId("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setMouvementSubmitting(false);
    }
  }

  function resetEditForm() {
    setActive(null);
    setNom("");
    setModelVoiture("");
    setMarquePiece("");
    setPartCode("");
    setDescription("");
    setPrixAchat("");
    setPrixVente("");
    setQuantiteEntree("0");
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    if (!nom.trim()) {
      toast.error("Saisissez le nom de la pièce.");
      return;
    }
    const qe = parseInt(quantiteEntree, 10);
    if (Number.isNaN(qe) || qe < 0) {
      toast.error("La quantité entrée doit être un entier positif ou zéro.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sav/piece-sav/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          model_voiture: modelVoiture.trim() || null,
          marque_piece: marquePiece.trim() || null,
          part_code: partCode.trim() || null,
          description: description.trim() || null,
          prix_achat: prixAchat.trim() || null,
          prix_vente: prixVente.trim() || null,
          quantite_entree: qe,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Mise à jour impossible");
      }
      toast.success("Pièce mise à jour.");
      setEditOpen(false);
      resetEditForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!active) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sav/piece-sav/${active.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Suppression impossible");
      }
      toast.success("Pièce supprimée.");
      setDeleteOpen(false);
      setActive(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] pb-10">
      <div className="relative mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-8">
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border border-slate-200/60",
            "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
            "px-6 py-8 shadow-lg md:px-10 md:py-9"
          )}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-sm">
                <Settings2 className="h-3.5 w-3.5 text-amber-300" />
                Catalogue pièces SAV
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Gestion des pièces
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-slate-300/95 md:text-base">
                Consultez l&apos;ensemble des pièces, modifiez les fiches ou
                retirez une référence du catalogue.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl space-y-4 px-4 md:px-6">
        {loadError ? (
          <Alert variant="destructive" className="rounded-2xl border-red-200/80">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Données non chargées</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Toutes les pièces
                </CardTitle>
                <CardDescription className="mt-1.5 text-slate-600">
                  Colonnes : modèle, marque, nom, code, prix unitaire (vente),
                  quantité restante, actions.
                </CardDescription>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 shadow-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Modèle voiture
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Marque pièce
                    </TableHead>
                    <TableHead className="min-w-[120px] font-semibold text-slate-700">
                      Nom
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Part code
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      Prix unitaire
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      Quantité restante
                    </TableHead>
                    <TableHead className="min-w-[160px] text-center font-semibold text-slate-700">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 p-0">
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
                            <Package className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {pieces.length === 0
                              ? "Aucune pièce enregistrée"
                              : "Aucun résultat"}
                          </h3>
                          <p className="mt-2 max-w-sm text-sm text-slate-500">
                            {pieces.length === 0
                              ? "Ajoutez des pièces depuis la page d’ajout."
                              : "Modifiez votre recherche."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        className={cn(
                          "border-slate-100 transition-colors",
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                          "hover:bg-amber-50/40"
                        )}
                      >
                        <TableCell className="font-medium text-slate-800">
                          {p.model_voiture ?? (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.marque_piece ? (
                            <Badge
                              variant="secondary"
                              className="font-normal text-slate-700"
                            >
                              {p.marque_piece}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {p.nom}
                        </TableCell>
                        <TableCell>
                          {p.part_code ? (
                            <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                              {p.part_code}
                            </code>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">
                          {p.prix_vente != null
                            ? priceFmt.format(p.prix_vente)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex min-w-[2rem] justify-end rounded-lg bg-slate-100 px-2 py-0.5 font-semibold tabular-nums text-slate-900">
                            {p.quantite_restante}
                          </span>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col items-center gap-2 py-0.5">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="Entrée pièces"
                                aria-label={`Entrée pièces — ${p.nom}`}
                                className="h-8 w-8 shrink-0 border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/80"
                                onClick={() => openEntree(p)}
                              >
                                <ArrowDownToLine className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="Sortie pièces"
                                aria-label={`Sortie pièces — ${p.nom}`}
                                className="h-8 w-8 shrink-0 border-amber-200 bg-amber-50/50 text-amber-900 hover:bg-amber-100/80"
                                onClick={() => openSortie(p)}
                              >
                                <ArrowUpFromLine className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                aria-label={`Modifier ${p.nom}`}
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-600 hover:bg-red-50 hover:text-red-600"
                                aria-label={`Supprimer ${p.nom}`}
                                onClick={() => openDelete(p)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) resetEditForm();
        }}
      >
        <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto rounded-3xl border-slate-200/80 p-0 sm:max-w-lg">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-amber-50/30 px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Modifier la pièce
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Mettez à jour les informations et enregistrez.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleEditSubmit} className="px-6 py-5">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Identification
                </p>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-nom" className="text-slate-700">
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="edit-model_voiture"
                        className="text-slate-700"
                      >
                        Modèle voiture
                      </Label>
                      <Input
                        id="edit-model_voiture"
                        value={modelVoiture}
                        onChange={(e) => setModelVoiture(e.target.value)}
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="edit-marque_piece"
                        className="text-slate-700"
                      >
                        Marque pièce
                      </Label>
                      <Input
                        id="edit-marque_piece"
                        value={marquePiece}
                        onChange={(e) => setMarquePiece(e.target.value)}
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-part_code" className="text-slate-700">
                      Part code
                    </Label>
                    <Input
                      id="edit-part_code"
                      value={partCode}
                      onChange={(e) => setPartCode(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Stock &amp; prix
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-qe" className="text-slate-700">
                      Quantité entrée
                    </Label>
                    <Input
                      id="edit-qe"
                      type="number"
                      min={0}
                      step={1}
                      value={quantiteEntree}
                      onChange={(e) => setQuantiteEntree(e.target.value)}
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-prix_achat" className="text-slate-700">
                      Prix d&apos;achat
                    </Label>
                    <Input
                      id="edit-prix_achat"
                      type="number"
                      min={0}
                      step="0.01"
                      value={prixAchat}
                      onChange={(e) => setPrixAchat(e.target.value)}
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-prix_vente" className="text-slate-700">
                    Prix unitaire (vente)
                  </Label>
                  <Input
                    id="edit-prix_vente"
                    type="number"
                    min={0}
                    step="0.01"
                    value={prixVente}
                    onChange={(e) => setPrixVente(e.target.value)}
                    className="h-11 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <Separator className="bg-slate-100" />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Détails
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="edit-desc" className="text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="edit-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="min-h-[88px] resize-none rounded-xl border-slate-200"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-0 pb-0 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                onClick={() => {
                  setEditOpen(false);
                  resetEditForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={entreeOpen}
        onOpenChange={(o) => {
          setEntreeOpen(o);
          if (!o) {
            setMouvementQty("");
            setActive(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-slate-200/80">
          <DialogHeader>
            <DialogTitle>Entrée de pièces</DialogTitle>
            <DialogDescription className="text-slate-600">
              {active ? (
                <>
                  <span className="font-medium text-slate-800">{active.nom}</span>
                  <span className="mt-2 block text-sm">
                    Stock restant actuel :{" "}
                    <span className="tabular-nums font-semibold text-slate-900">
                      {active.quantite_restante}
                    </span>{" "}
                    · Total entrées (cumul) :{" "}
                    <span className="tabular-nums font-semibold text-slate-900">
                      {active.quantite_entree}
                    </span>
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="qty-entree">Quantité à l&apos;entrée</Label>
            <Input
              id="qty-entree"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="Ex. 10"
              value={mouvementQty}
              onChange={(e) => setMouvementQty(e.target.value)}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-slate-500">
              Le cumul des entrées et le stock restant seront augmentés de cette
              quantité.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setEntreeOpen(false)}
              disabled={mouvementSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              disabled={mouvementSubmitting}
              onClick={() => void submitMouvement("ENTREE")}
            >
              {mouvementSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Valider l'entrée"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sortieOpen}
        onOpenChange={(o) => {
          setSortieOpen(o);
          if (!o) {
            setMouvementQty("");
            setSortieReparationId("");
            setActive(null);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-3xl border-slate-200/80">
          <DialogHeader>
            <DialogTitle>Sortie de pièces</DialogTitle>
            <DialogDescription className="text-slate-600">
              {active ? (
                <>
                  <span className="font-medium text-slate-800">{active.nom}</span>
                  <span className="mt-2 block text-sm">
                    Stock restant disponible :{" "}
                    <span className="tabular-nums font-semibold text-slate-900">
                      {active.quantite_restante}
                    </span>{" "}
                    · Sorties (cumul) :{" "}
                    <span className="tabular-nums font-semibold text-slate-900">
                      {active.quantite_sortie}
                    </span>
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="reparation-sortie">Réparation</Label>
              <Select
                value={sortieReparationId || undefined}
                onValueChange={setSortieReparationId}
                disabled={
                  mouvementSubmitting || reparationOptions.length === 0
                }
              >
                <SelectTrigger
                  id="reparation-sortie"
                  size="default"
                  className="h-11 w-full min-w-0 rounded-xl"
                >
                  <SelectValue placeholder="Choisir une réparation…" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {reparationOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="line-clamp-2 text-left">{r.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reparationOptions.length === 0 ? (
                <p className="text-xs text-amber-800">
                  Aucune réparation en base. Créez une réparation (voiture SAV)
                  avant d&apos;enregistrer une sortie.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  La sortie sera liée à cette réparation.
                </p>
              )}
            </div>
            <div className="grid gap-2">
            <Label htmlFor="qty-sortie">Quantité à la sortie</Label>
            <Input
              id="qty-sortie"
              type="number"
              min={1}
              max={active?.quantite_restante ?? undefined}
              step={1}
              inputMode="numeric"
              placeholder="Ex. 2"
              value={mouvementQty}
              onChange={(e) => setMouvementQty(e.target.value)}
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-slate-500">
              Le stock restant sera diminué ; le cumul des sorties augmenté.
            </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setSortieOpen(false)}
              disabled={mouvementSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-amber-600 hover:bg-amber-700"
              disabled={
                mouvementSubmitting ||
                reparationOptions.length === 0 ||
                !sortieReparationId.trim()
              }
              onClick={() => void submitMouvement("SORTIE")}
            >
              {mouvementSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Valider la sortie"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md rounded-3xl border-slate-200/80">
          <DialogHeader>
            <DialogTitle>Supprimer la pièce ?</DialogTitle>
            <DialogDescription className="text-slate-600">
              {active ? (
                <>
                  Cette action est définitive. La référence{" "}
                  <span className="font-semibold text-slate-800">
                    {active.nom}
                  </span>{" "}
                  sera retirée du catalogue.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={deleting}
              onClick={handleDeleteConfirm}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression…
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
