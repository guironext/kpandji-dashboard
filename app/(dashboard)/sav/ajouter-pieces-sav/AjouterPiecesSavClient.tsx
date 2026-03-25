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
  Loader2,
  PackagePlus,
  Package,
  Boxes,
  Hash,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type PieceSAVRow = {
  id: string;
  nom: string;
  model_voiture: string | null;
  marque_piece: string | null;
  part_code: string | null;
  description: string | null;
  prix_achat: number | null;
  prix_vente: number | null;
  quantite_entree: number;
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

export default function AjouterPiecesSavClient({
  initialPieces,
}: {
  initialPieces: PieceSAVRow[];
}) {
  const router = useRouter();
  const [pieces, setPieces] = useState(initialPieces);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

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

  const stats = useMemo(() => {
    const n = pieces.length;
    const units = pieces.reduce((acc, p) => acc + (p.quantite_entree ?? 0), 0);
    return { references: n, units };
  }, [pieces]);

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

  function resetForm() {
    setNom("");
    setModelVoiture("");
    setMarquePiece("");
    setPartCode("");
    setDescription("");
    setPrixAchat("");
    setPrixVente("");
    setQuantiteEntree("0");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      const res = await fetch("/api/sav/piece-sav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          model_voiture: modelVoiture.trim() || undefined,
          marque_piece: marquePiece.trim() || undefined,
          part_code: partCode.trim() || undefined,
          description: description.trim() || undefined,
          prix_achat: prixAchat.trim() || undefined,
          prix_vente: prixVente.trim() || undefined,
          quantite_entree: qe,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Enregistrement impossible");
      }
      toast.success("Pièce enregistrée.");
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] pb-10">
      {/* Hero */}
      <div className="relative mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-8">
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border border-emerald-200/40",
            "bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950",
            "px-6 py-8 shadow-[0_24px_48px_-12px_rgba(6,78,59,0.35)] md:px-10 md:py-10"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-emerald-100/90 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                Stock atelier SAV
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Pièces de rechange
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-slate-300/95 md:text-base">
                Référencez les pièces, suivez les quantités entrées et les prix
                d&apos;achat et de vente pour un inventaire clair et à jour.
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              className={cn(
                "h-12 shrink-0 gap-2 self-stretch border-0 shadow-lg shadow-emerald-900/40",
                "bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:from-emerald-300 hover:to-teal-400",
                "lg:self-end"
              )}
              onClick={() => setDialogOpen(true)}
            >
              <PackagePlus className="h-5 w-5" />
              Ajouter une pièce
            </Button>
          </div>

          <div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Références
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {stats.references}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-200">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Unités (entrées)
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {stats.units}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-slate-200">
                  <Hash className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Recherche active
                  </p>
                  <p className="truncate text-sm text-slate-200">
                    {search.trim()
                      ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`
                      : "Tout l’inventaire"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="mx-auto mt-8 max-w-7xl space-y-4 px-4 md:px-6">
        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Inventaire
                </CardTitle>
                <CardDescription className="mt-1.5 text-slate-600">
                  Filtrez par nom, référence, marque ou modèle.
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
                      Modèle
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Marque pièce
                    </TableHead>
                    <TableHead className="min-w-[120px] font-semibold text-slate-700">
                      Nom
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700">
                      Réf.
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      Qté
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      P. achat
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      P. vente
                    </TableHead>
                    <TableHead className="min-w-[200px] font-semibold text-slate-700">
                      Description
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 p-0">
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
                            <Package className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {pieces.length === 0
                              ? "Aucune pièce pour l’instant"
                              : "Aucun résultat"}
                          </h3>
                          <p className="mt-2 max-w-sm text-sm text-slate-500">
                            {pieces.length === 0
                              ? "Ajoutez votre première pièce avec le bouton ci-dessus."
                              : "Modifiez votre recherche ou effacez le filtre."}
                          </p>
                          {pieces.length > 0 && search.trim() && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-4 rounded-full"
                              onClick={() => setSearch("")}
                            >
                              Effacer la recherche
                            </Button>
                          )}
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
                          "hover:bg-emerald-50/50"
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
                        <TableCell className="text-right">
                          <span className="inline-flex min-w-[2rem] justify-end rounded-lg bg-emerald-50 px-2 py-0.5 font-semibold tabular-nums text-emerald-900">
                            {p.quantite_entree}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">
                          {p.prix_achat != null
                            ? priceFmt.format(p.prix_achat)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">
                          {p.prix_vente != null
                            ? priceFmt.format(p.prix_vente)
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-[280px] text-sm text-slate-600">
                          <span className="line-clamp-2">
                            {p.description ?? (
                              <span className="text-slate-400">—</span>
                            )}
                          </span>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto rounded-3xl border-slate-200/80 p-0 sm:max-w-lg">
          <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/40 px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-semibold text-slate-900">
                Nouvelle pièce
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Renseignez l’identification, le stock et les prix.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Identification
                </p>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="nom" className="text-slate-700">
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                      placeholder="Ex. Filtre à huile"
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="model_voiture" className="text-slate-700">
                        Modèle voiture
                      </Label>
                      <Input
                        id="model_voiture"
                        value={modelVoiture}
                        onChange={(e) => setModelVoiture(e.target.value)}
                        placeholder="Optionnel"
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="marque_piece" className="text-slate-700">
                        Marque pièce
                      </Label>
                      <Input
                        id="marque_piece"
                        value={marquePiece}
                        onChange={(e) => setMarquePiece(e.target.value)}
                        placeholder="Optionnel"
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="part_code" className="text-slate-700">
                      Part code
                    </Label>
                    <Input
                      id="part_code"
                      value={partCode}
                      onChange={(e) => setPartCode(e.target.value)}
                      placeholder="Référence constructeur"
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
                    <Label htmlFor="qe" className="text-slate-700">
                      Quantité entrée <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="qe"
                      type="number"
                      min={0}
                      step={1}
                      value={quantiteEntree}
                      onChange={(e) => setQuantiteEntree(e.target.value)}
                      required
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prix_achat" className="text-slate-700">
                      Prix d&apos;achat
                    </Label>
                    <Input
                      id="prix_achat"
                      type="number"
                      min={0}
                      step="0.01"
                      value={prixAchat}
                      onChange={(e) => setPrixAchat(e.target.value)}
                      placeholder="0"
                      className="h-11 rounded-xl border-slate-200"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prix_vente" className="text-slate-700">
                    Prix de vente
                  </Label>
                  <Input
                    id="prix_vente"
                    type="number"
                    min={0}
                    step="0.01"
                    value={prixVente}
                    onChange={(e) => setPrixVente(e.target.value)}
                    placeholder="0"
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
                  <Label htmlFor="desc" className="text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Notes, condition, emplacement…"
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
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-500 hover:to-teal-500 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer la pièce"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
