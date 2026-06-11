"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAllSistreInvoices, type SistreInvoice } from "@/lib/actions/sistre";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  FileText,
  DollarSign,
  Receipt,
  FileTextIcon,
  Search,
  Calendar,
  Sparkles,
  Package,
  TrendingUp,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: "amber" | "orange" | "emerald";
}) {
  const styles = {
    amber: "from-amber-500 to-orange-500 bg-amber-50 text-amber-700 border-amber-100",
    orange: "from-orange-500 to-amber-600 bg-orange-50 text-orange-700 border-orange-100",
    emerald: "from-emerald-500 to-teal-600 bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <Card className="overflow-hidden border-slate-200/80 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1 truncate text-2xl font-bold text-slate-900 sm:text-3xl">
              {value}
            </p>
            {sub && (
              <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
              styles[accent].split(" ").slice(1).join(" ")
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div
          className={cn(
            "mt-4 h-1 w-full rounded-full bg-gradient-to-r opacity-80",
            styles[accent].split(" ")[0],
            styles[accent].split(" ")[1]
          )}
        />
      </CardContent>
    </Card>
  );
}

function InvoiceCard({
  invoice,
  onReceipt,
  onContract,
}: {
  invoice: SistreInvoice;
  onReceipt: () => void;
  onContract: () => void;
}) {
  const totalQuantity = invoice.lineItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/40">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Badge className="mb-1.5 border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                {invoice.invoiceNumber}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(invoice.createdAt)}</span>
                <span className="text-slate-300">·</span>
                <span>{formatTime(invoice.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2">
            <DollarSign className="h-4 w-4 text-amber-600" />
            <span className="text-lg font-bold text-amber-800">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Articles
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {invoice.lineItems.length} ligne
              {invoice.lineItems.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Quantité
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {totalQuantity} unité{totalQuantity > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {invoice.lineItems.length > 0 && (
          <div className="mt-3 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            {invoice.lineItems.slice(0, 2).map((item, idx) => (
              <div key={item.id} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                  {idx + 1}
                </span>
                <span className="line-clamp-2 text-slate-600">
                  {item.description}
                </span>
              </div>
            ))}
            {invoice.lineItems.length > 2 && (
              <p className="pl-7 text-xs text-slate-400">
                +{invoice.lineItems.length - 2} autre
                {invoice.lineItems.length - 2 > 1 ? "s" : ""} article
                {invoice.lineItems.length - 2 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
          <Button
            onClick={onReceipt}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
            size="sm"
          >
            <Receipt className="mr-1.5 h-4 w-4" />
            Voir le reçu
            <ChevronRight className="ml-auto h-4 w-4 opacity-70 sm:ml-1.5" />
          </Button>
          <Button
            onClick={onContract}
            variant="outline"
            className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
            size="sm"
          >
            <FileTextIcon className="mr-1.5 h-4 w-4" />
            Contrat
          </Button>
        </div>
      </div>
    </article>
  );
}

const Page = () => {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SistreInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const result = await getAllSistreInvoices();

        if (result.success && result.data) {
          setInvoices(result.data);
        } else {
          setError(result.error || "Failed to fetch invoices");
        }
      } catch (err) {
        setError("An error occurred while fetching invoices");
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;

    const term = searchTerm.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.lineItems.some((item) =>
          item.description.toLowerCase().includes(term)
        )
    );
  }, [invoices, searchTerm]);

  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalItems = invoices.reduce(
      (sum, inv) => sum + inv.lineItems.length,
      0
    );
    return { totalAmount, totalItems };
  }, [invoices]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg shadow-amber-200/50">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Reçus SISTRE
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Gérez et consultez tous vos reçus SISTRE
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/manager/sistre/creer-invoice")}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-5 text-base font-semibold text-white shadow-md hover:from-amber-600 hover:to-orange-600 hover:shadow-lg sm:w-auto"
          size="lg"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Créer un Nouveau Reçu
        </Button>
      </div>

      {/* Stats */}
      {!loading && !error && invoices.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard
            icon={Receipt}
            label="Total reçus"
            value={String(invoices.length)}
            sub="Enregistrés dans le système"
            accent="amber"
          />
          <StatCard
            icon={TrendingUp}
            label="Montant cumulé"
            value={formatCurrency(stats.totalAmount)}
            sub="Tous les reçus confondus"
            accent="orange"
          />
          <StatCard
            icon={Package}
            label="Lignes d'articles"
            value={String(stats.totalItems)}
            sub="Articles sur l'ensemble des reçus"
            accent="emerald"
          />
        </div>
      )}

      {/* Main list card */}
      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">
                  Liste des Reçus
                </CardTitle>
                <CardDescription>
                  {!loading && !error
                    ? `${filteredInvoices.length} reçu${filteredInvoices.length !== 1 ? "s" : ""}${searchTerm ? ` sur ${invoices.length}` : ""}`
                    : "Chargement…"}
                </CardDescription>
              </div>
            </div>

            {!loading && !error && invoices.length > 0 && (
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Rechercher par numéro ou article…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-slate-200 bg-white pl-10 pr-10 focus-visible:ring-amber-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-amber-500 sm:h-12 sm:w-12" />
              <p className="text-base text-slate-500">Chargement des reçus…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                <FileText className="h-7 w-7 text-red-500" />
              </div>
              <p className="text-lg font-semibold text-red-700">{error}</p>
              <p className="mt-1 text-sm text-red-500/80">
                Veuillez réessayer plus tard
              </p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
              {searchTerm ? (
                <>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
                    <Search className="h-7 w-7 text-amber-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-800">
                    Aucun résultat trouvé
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Aucun reçu ne correspond à « {searchTerm} »
                  </p>
                  <Button
                    onClick={() => setSearchTerm("")}
                    variant="outline"
                    className="mt-5"
                  >
                    Réinitialiser la recherche
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
                    <FileText className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-800">
                    Aucun reçu créé
                  </p>
                  <p className="mt-1 max-w-md text-sm text-slate-500">
                    Commencez par créer votre premier reçu SISTRE
                  </p>
                  <Button
                    onClick={() => router.push("/manager/sistre/creer-invoice")}
                    className="mt-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Créer le Premier Reçu
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Mobile & tablet: card layout */}
              <div className="grid gap-4 lg:hidden">
                {filteredInvoices.map((invoice) => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onReceipt={() =>
                      router.push(`/manager/sistre/${invoice.id}`)
                    }
                    onContract={() =>
                      router.push(`/manager/sistre/${invoice.id}/contract`)
                    }
                  />
                ))}
              </div>

              {/* Desktop: table layout */}
              <div className="hidden overflow-x-auto custom-scrollbar lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-amber-100/80 bg-gradient-to-r from-slate-50 via-amber-50/40 to-orange-50/30 hover:bg-transparent">
                      <TableHead className="py-4 pl-2 font-semibold text-slate-700">
                        Numéro
                      </TableHead>
                      <TableHead className="py-4 font-semibold text-slate-700">
                        Articles
                      </TableHead>
                      <TableHead className="py-4 text-center font-semibold text-slate-700">
                        Qté
                      </TableHead>
                      <TableHead className="py-4 text-right font-semibold text-slate-700">
                        Montant
                      </TableHead>
                      <TableHead className="py-4 font-semibold text-slate-700">
                        Date
                      </TableHead>
                      <TableHead className="py-4 pr-2 text-center font-semibold text-slate-700">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const totalQuantity = invoice.lineItems.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      );
                      return (
                        <TableRow
                          key={invoice.id}
                          className="border-b border-slate-100 transition-colors hover:bg-amber-50/30"
                        >
                          <TableCell className="py-4 pl-2">
                            <Badge className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white">
                              {invoice.invoiceNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs py-4">
                            <div className="space-y-1">
                              {invoice.lineItems.slice(0, 2).map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-700">
                                    {idx + 1}
                                  </span>
                                  <span className="line-clamp-1 text-slate-600">
                                    {item.description}
                                  </span>
                                </div>
                              ))}
                              {invoice.lineItems.length > 2 && (
                                <span className="text-xs text-slate-400">
                                  +{invoice.lineItems.length - 2} autre(s)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 font-bold text-amber-800 hover:bg-amber-100"
                            >
                              {totalQuantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 font-bold text-amber-800">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatCurrency(invoice.total)}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-700">
                                {formatDate(invoice.createdAt)}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatTime(invoice.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 pr-2">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() =>
                                  router.push(`/manager/sistre/${invoice.id}`)
                                }
                                size="sm"
                                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                              >
                                <Receipt className="mr-1.5 h-3.5 w-3.5" />
                                Reçu
                              </Button>
                              <Button
                                onClick={() =>
                                  router.push(
                                    `/manager/sistre/${invoice.id}/contract`
                                  )
                                }
                                size="sm"
                                variant="outline"
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                              >
                                <FileTextIcon className="mr-1.5 h-3.5 w-3.5" />
                                Contrat
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
