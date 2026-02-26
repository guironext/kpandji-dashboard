"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Target, Users, Car, TrendingUp, BarChart3 } from "lucide-react";

interface VenteRealiseeItem {
  voitureModel: string;
  quantity: number;
  prixUnitaire: number;
  total: number;
}

interface PeriodSummaryRow {
  periodId: string;
  periodStart: string;
  periodEnd: string;
  periodDuree: string;
  objectifPoleCible: string | null;
  objectifCible: string | null;
  objectifVehiculesCible: string | null;
  objectifFinancieresCible: string | null;
  clientProspectsCount: number;
  clientEntrepriseProspectsCount: number;
  factureCount: number;
  ventesRealisees?: VenteRealiseeItem[];
  ventesRealiseesTotal?: number;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  catch {
    return iso;
  }
}

function formatCurrency(value: string | null): string {
  if (value == null || value === "") return "—";
  const num = parseFloat(String(value).replace(/\s/g, "").replace(",", "."));
  if (Number.isNaN(num)) return value;
  return Math.round(num).toLocaleString("fr-FR", { useGrouping: true });
}

function formatCurrencyNumber(value: number): string {
  return value.toLocaleString("fr-FR", { useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function ObjectifsSummaryTable() {
  const [data, setData] = useState<PeriodSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/objectifs-periods/commercial-summary");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Erreur de chargement");
          setData([]);
          return;
        }
        if (json.success && Array.isArray(json.data)) {
          setData(json.data);
        } else {
          setData([]);
        }
      } catch {
        setError("Impossible de charger les données");
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20" />
            <Loader2 className="relative h-12 w-12 animate-spin text-amber-600" />
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-700">Chargement en cours</p>
            <p className="text-muted-foreground text-sm">Récupération de vos objectifs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-12 text-center">
        <p className="font-medium text-red-700">{error}</p>
        <p className="text-red-600/80 text-sm">Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
          <Target className="mx-auto h-14 w-14 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Aucun objectif défini</h3>
        <p className="mt-2 max-w-sm text-slate-500">
          Vos objectifs apparaîtront ici dès qu&apos;ils seront définis par votre responsable.
        </p>
      </div>
    );
  }

  const totalProspects = data.reduce(
    (s, r) => s + (r.clientProspectsCount ?? 0) + (r.clientEntrepriseProspectsCount ?? 0),
    0
  );
  const totalFactures = data.reduce((s, r) => s + (r.factureCount ?? 0), 0);
  const totalVentes = data.reduce((s, r) => s + (r.ventesRealiseesTotal ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-100/60" />
          <div className="relative">
            <Users className="mb-3 h-8 w-8 text-amber-600" />
            <p className="text-muted-foreground text-sm">Prospects</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{totalProspects}</p>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-100/60" />
          <div className="relative">
            <Car className="mb-3 h-8 w-8 text-emerald-600" />
            <p className="text-muted-foreground text-sm">Factures</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{totalFactures}</p>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-100/60" />
          <div className="relative">
            <TrendingUp className="mb-3 h-8 w-8 text-blue-600" />
            <p className="text-muted-foreground text-sm">Ventes (total)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {formatCurrencyNumber(totalVentes)}
            </p>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-100/60" />
          <div className="relative">
            <BarChart3 className="mb-3 h-8 w-8 text-violet-600" />
            <p className="text-muted-foreground text-sm">Périodes</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{data.length}</p>
          </div>
        </div>
      </div>

      {/* Objectifs */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <h2 className="text-muted-foreground px-4 text-xs font-medium uppercase tracking-widest">
            Objectifs
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Target className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Objectifs par période</h3>
                <p className="text-muted-foreground text-xs">Cibles définies pour chaque indicateur</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-medium text-slate-600">Période</TableHead>
                  <TableHead className="font-medium text-slate-600">Pôle</TableHead>
                  <TableHead className="font-medium text-slate-600">Prospects</TableHead>
                  <TableHead className="font-medium text-slate-600">Véhicules</TableHead>
                  <TableHead className="font-medium text-right text-slate-600">Financier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow
                    key={row.periodId}
                    className={`border-slate-50 ${i % 2 === 1 ? "bg-slate-50/30" : ""} hover:bg-amber-50/30`}
                  >
                    <TableCell className="whitespace-nowrap font-medium text-slate-800">
                      {formatDate(row.periodStart)} → {formatDate(row.periodEnd)}
                    </TableCell>
                    <TableCell className="text-slate-600">{row.objectifPoleCible ?? "—"}</TableCell>
                    <TableCell className="text-slate-600">{row.objectifCible ?? "—"}</TableCell>
                    <TableCell className="text-slate-600">{row.objectifVehiculesCible ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-slate-800">
                      {formatCurrency(row.objectifFinancieresCible)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Prospects & Volume */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Prospects atteints</h3>
                <p className="text-muted-foreground text-xs">Nouveaux prospects par période</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-medium text-slate-600">Période</TableHead>
                  <TableHead className="font-medium text-right text-slate-600">Clients</TableHead>
                  <TableHead className="font-medium text-right text-slate-600">Entreprises</TableHead>
                  <TableHead className="font-medium text-right text-slate-600">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow
                    key={row.periodId}
                    className={`border-slate-50 ${i % 2 === 1 ? "bg-slate-50/30" : ""} hover:bg-emerald-50/30`}
                  >
                    <TableCell className="whitespace-nowrap font-medium text-slate-800">
                      {formatDate(row.periodStart)} → {formatDate(row.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-600">{row.clientProspectsCount ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums text-slate-600">{row.clientEntrepriseProspectsCount ?? 0}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-slate-800">
                      {(row.clientProspectsCount ?? 0) + (row.clientEntrepriseProspectsCount ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Car className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Volume de vente</h3>
                <p className="text-muted-foreground text-xs">Factures par période</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-medium text-slate-600">Période</TableHead>
                  <TableHead className="font-medium text-right text-slate-600">Factures</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow
                    key={row.periodId}
                    className={`border-slate-50 ${i % 2 === 1 ? "bg-slate-50/30" : ""} hover:bg-blue-50/30`}
                  >
                    <TableCell className="whitespace-nowrap font-medium text-slate-800">
                      {formatDate(row.periodStart)} → {formatDate(row.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-slate-800">{row.factureCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Ventes réalisées */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <h2 className="text-muted-foreground px-4 text-xs font-medium uppercase tracking-widest">
            Détail des ventes
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                <TrendingUp className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Ventes réalisées</h3>
                <p className="text-muted-foreground text-xs">Par modèle de véhicule</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-medium text-slate-600">Période</TableHead>
                  <TableHead className="font-medium text-slate-600">Modèle</TableHead>
                  <TableHead className="font-medium text-right text-slate-600">Qté</TableHead>
                  <TableHead className="font-medium text-right text-slate-600">Prix unit.</TableHead>
                  <TableHead className="font-medium text-right text-slate-600">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.flatMap((row) =>
                  (row.ventesRealisees ?? []).length > 0
                    ? row.ventesRealisees!.map((item, idx) => (
                        <TableRow
                          key={`${row.periodId}-${item.voitureModel}-${idx}`}
                          className="border-slate-50 hover:bg-violet-50/30"
                        >
                          <TableCell className="whitespace-nowrap font-medium text-slate-800">
                            {formatDate(row.periodStart)} → {formatDate(row.periodEnd)}
                          </TableCell>
                          <TableCell className="text-slate-600">{item.voitureModel}</TableCell>
                          <TableCell className="text-right tabular-nums text-slate-600">{item.quantity}</TableCell>
                          <TableCell className="text-right tabular-nums text-slate-600">{formatCurrencyNumber(item.prixUnitaire)}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums text-slate-800">{formatCurrencyNumber(item.total)}</TableCell>
                        </TableRow>
                      ))
                    : [
                        <TableRow key={row.periodId} className="border-slate-50">
                          <TableCell className="whitespace-nowrap font-medium text-slate-800">
                            {formatDate(row.periodStart)} → {formatDate(row.periodEnd)}
                          </TableCell>
                          <TableCell colSpan={4} className="text-muted-foreground italic">
                            Aucune vente
                          </TableCell>
                        </TableRow>,
                      ]
                )}
                <TableRow className="border-t-2 border-slate-200 bg-slate-900 font-semibold text-white">
                  <TableCell colSpan={4} className="py-4">
                    Total général
                  </TableCell>
                  <TableCell className="py-4 text-right tabular-nums">
                    {formatCurrencyNumber(data.reduce((s, r) => s + (r.ventesRealiseesTotal ?? 0), 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
