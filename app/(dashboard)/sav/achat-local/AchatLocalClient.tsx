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
  Calendar,
  Loader2,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createCommandeLocal } from "@/lib/actions/fournisseur-commande-local";

export type CommandeLocalRow = {
  id: string;
  article: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  date_livraison: string;
  createdAt: string;
  updatedAt: string;
};

const priceFmt = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const fieldClass =
  "h-11 rounded-xl border-slate-200 bg-white shadow-sm focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

export default function AchatLocalClient({
  initialCommandes,
  loadError = null,
}: {
  initialCommandes: CommandeLocalRow[];
  loadError?: string | null;
}) {
  const router = useRouter();
  const [commandes, setCommandes] = useState(initialCommandes);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [article, setArticle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [dateLivraison, setDateLivraison] = useState("");

  useEffect(() => {
    setCommandes(initialCommandes);
  }, [initialCommandes]);

  const qtyNum = Number.parseInt(quantity, 10);
  const priceNum = Number(price.replace(",", "."));
  const computedTotal =
    Number.isInteger(qtyNum) &&
    qtyNum > 0 &&
    Number.isFinite(priceNum) &&
    priceNum >= 0
      ? Math.round(qtyNum * priceNum * 100) / 100
      : 0;

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return commandes;
    return commandes.filter((c) => {
      const hay = [c.article, c.description].join(" ");
      return normalize(hay).includes(q);
    });
  }, [commandes, search]);

  const stats = useMemo(() => {
    const units = commandes.reduce((sum, c) => sum + c.quantity, 0);
    const amount = commandes.reduce((sum, c) => sum + c.total, 0);
    return {
      references: commandes.length,
      units,
      amount,
    };
  }, [commandes]);

  function resetForm() {
    setArticle("");
    setDescription("");
    setQuantity("1");
    setPrice("");
    setDateLivraison("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!article.trim()) {
      toast.error("Saisissez l'article.");
      return;
    }
    if (!description.trim()) {
      toast.error("Saisissez la description.");
      return;
    }
    const qty = Number.parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error("La quantité doit être un entier positif.");
      return;
    }
    const unitPrice = Number(price.replace(",", "."));
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error("Le prix unitaire est invalide.");
      return;
    }
    if (!dateLivraison) {
      toast.error("Choisissez une date de livraison.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCommandeLocal({
        article: article.trim(),
        description: description.trim(),
        quantity: qty,
        price: unitPrice,
        date_livraison: dateLivraison,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Erreur lors de l'enregistrement.");
        return;
      }

      setCommandes((prev) => [result.data, ...prev]);
      toast.success("Achat local enregistré.");
      setDialogOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] pb-10">
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
                Approvisionnement atelier
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Achat local
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-slate-300/95 md:text-base">
                Enregistrez les commandes locales (pièces, fournitures) et
                suivez quantités, prix et dates de livraison.
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
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-5 w-5" />
              Nouvel achat local
            </Button>
          </div>

          <div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Achats
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
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Quantité totale
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
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Montant total
                  </p>
                  <p className="truncate text-xl font-semibold tabular-nums text-white">
                    {priceFmt.format(stats.amount)} FCFA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl space-y-4 px-4 md:px-6">
        {loadError ? (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chargement impossible</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
          <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Achats locaux
                </CardTitle>
                <CardDescription className="mt-1.5 text-slate-600">
                  Tous les achats enregistrés, du plus récent au plus ancien.
                </CardDescription>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Rechercher un article…"
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
                      Réf.
                    </TableHead>
                    <TableHead className="min-w-[140px] font-semibold text-slate-700">
                      Article
                    </TableHead>
                    <TableHead className="min-w-[180px] font-semibold text-slate-700">
                      Description
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      Quantité
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      Prix unitaire
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right font-semibold text-slate-700">
                      Total
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center font-semibold text-slate-700">
                      Livraison
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-center font-semibold text-slate-700">
                      Créé le
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-40 p-0">
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
                            <ShoppingCart className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {commandes.length === 0
                              ? "Aucun achat local"
                              : "Aucun résultat"}
                          </h3>
                          <p className="mt-2 max-w-sm text-sm text-slate-500">
                            {commandes.length === 0
                              ? "Créez votre premier achat avec le bouton « Nouvel achat local »."
                              : "Modifiez votre recherche ou effacez le filtre."}
                          </p>
                          {commandes.length > 0 && search.trim() ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-4 rounded-full"
                              onClick={() => setSearch("")}
                            >
                              Effacer la recherche
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((cmd, idx) => (
                      <TableRow
                        key={cmd.id}
                        className={cn(
                          "border-slate-100 transition-colors",
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                          "hover:bg-emerald-50/50"
                        )}
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-full bg-emerald-50 font-mono text-[11px] text-emerald-800"
                          >
                            #{cmd.id.slice(-7).toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {cmd.article}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-slate-600">
                          {cmd.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex min-w-[2rem] justify-end rounded-lg bg-emerald-50 px-2 py-0.5 font-semibold tabular-nums text-emerald-900">
                            {cmd.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">
                          {priceFmt.format(cmd.price)} FCFA
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-emerald-700">
                          {priceFmt.format(cmd.total)} FCFA
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-700">
                          {formatDate(cmd.date_livraison)}
                        </TableCell>
                        <TableCell className="text-center text-sm text-slate-500">
                          {formatDate(cmd.createdAt)}
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
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent
          className={cn(
            "flex max-h-[min(94vh,920px)] flex-col gap-0 overflow-hidden rounded-[28px] border-0 p-0 sm:max-w-xl",
            "shadow-[0_24px_80px_-12px_rgba(6,78,59,0.35)]",
            "[&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:top-5",
            "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/10",
            "[&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white",
            "[&_[data-slot=dialog-close]]:hover:bg-white/20 [&_[data-slot=dialog-close]]:hover:text-white"
          )}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 px-6 py-6 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />
            <DialogHeader className="relative space-y-1 text-left">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <ShoppingCart className="h-5 w-5 text-emerald-200" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                Nouvel achat local
              </DialogTitle>
              <DialogDescription className="text-sm text-emerald-100/80">
                Article, quantité, prix et date de livraison de la commande
                locale.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col bg-slate-50/40"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid gap-2">
                <Label htmlFor="achat-article" className="text-slate-700">
                  Article <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="achat-article"
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                  placeholder="Ex. Filtre à huile, vis M8…"
                  required
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="achat-desc" className="text-slate-700">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="achat-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Détails, marque, usage…"
                  className="min-h-[88px] resize-none rounded-xl border-slate-200 bg-white shadow-sm focus-visible:border-emerald-400 focus-visible:ring-emerald-500/20"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quantité &amp; prix
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="achat-qty" className="text-slate-700">
                      Quantité <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="achat-qty"
                      type="number"
                      min={1}
                      step={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="achat-price" className="text-slate-700">
                      Prix unitaire <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="achat-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                      required
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="achat-total" className="text-slate-700">
                      Total
                    </Label>
                    <Input
                      id="achat-total"
                      readOnly
                      value={
                        price.trim()
                          ? `${priceFmt.format(computedTotal)} FCFA`
                          : ""
                      }
                      placeholder="Calculé auto."
                      className={cn(
                        fieldClass,
                        "bg-slate-50 font-semibold tabular-nums text-emerald-800"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="achat-date" className="text-slate-700">
                  Date de livraison <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="achat-date"
                  type="date"
                  value={dateLivraison}
                  onChange={(e) => setDateLivraison(e.target.value)}
                  required
                  className={fieldClass}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl sm:w-auto"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting}
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
                  "Enregistrer l'achat"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
