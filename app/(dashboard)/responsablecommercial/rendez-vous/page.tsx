"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllRendezVous } from "@/lib/actions/rendezvous";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Building2,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarStack,
} from "recharts";

const CHART_COLORS = [
  "#059669", // emerald
  "#0d9488", // teal
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#84cc16", // lime
];

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRME: "Confirmé",
  DEPLACE: "Déplacé",
  EFFECTUE: "Effectué",
  ANNULE: "Annulé",
};

const STATUT_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; icon: string; gradient: string }
> = {
  EN_ATTENTE: {
    bg: "bg-amber-50/80 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200/60 dark:border-amber-800/50",
    icon: "text-amber-500",
    gradient: "from-amber-400 to-orange-500",
  },
  CONFIRME: {
    bg: "bg-blue-50/80 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200/60 dark:border-blue-800/50",
    icon: "text-blue-500",
    gradient: "from-blue-400 to-indigo-500",
  },
  DEPLACE: {
    bg: "bg-orange-50/80 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200/60 dark:border-orange-800/50",
    icon: "text-orange-500",
    gradient: "from-orange-400 to-amber-500",
  },
  EFFECTUE: {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200/60 dark:border-emerald-800/50",
    icon: "text-emerald-500",
    gradient: "from-emerald-400 to-teal-500",
  },
  ANNULE: {
    bg: "bg-rose-50/80 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200/60 dark:border-rose-800/50",
    icon: "text-rose-500",
    gradient: "from-rose-400 to-red-500",
  },
};

type RendezVousItem = {
  id: string;
  date: Date | string;
  statut: string;
  commercialName: string;
  client?: { nom?: string } | null;
  clientEntreprise?: { nom_entreprise?: string } | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

export default function RendezVousPage() {
  const [rendezVous, setRendezVous] = useState<RendezVousItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStatus, setExpandedStatus] = useState<string | null>("EN_ATTENTE");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const result = await getAllRendezVous();
        if (result.success && result.data) {
          setRendezVous(result.data as RendezVousItem[]);
        } else {
          setError(result.error || "Échec du chargement des rendez-vous");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur s'est produite");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const grouped = useMemo(() => {
    const byStatus: Record<string, Record<string, RendezVousItem[]>> = {};
    const statusOrder = ["EN_ATTENTE", "CONFIRME", "DEPLACE", "EFFECTUE", "ANNULE"];

    rendezVous.forEach((rv) => {
      const statut = rv.statut || "EN_ATTENTE";
      if (!byStatus[statut]) byStatus[statut] = {};
      const commercial = rv.commercialName || "Non assigné";
      if (!byStatus[statut][commercial]) byStatus[statut][commercial] = [];
      byStatus[statut][commercial].push(rv);
    });

    Object.keys(byStatus).forEach((statut) => {
      Object.keys(byStatus[statut]).forEach((commercial) => {
        byStatus[statut][commercial].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
      });
    });

    const ordered: Record<string, Record<string, RendezVousItem[]>> = {};
    statusOrder.forEach((s) => {
      if (byStatus[s]) ordered[s] = byStatus[s];
    });
    return ordered;
  }, [rendezVous]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(grouped).forEach(([statut, byCommercial]) => {
      counts[statut] = Object.values(byCommercial).flat().length;
    });
    return counts;
  }, [grouped]);

  const chartDataByCommercial = useMemo(() => {
    const counts: Record<string, number> = {};
    rendezVous.forEach((rv) => {
      const commercial = rv.commercialName || "Non assigné";
      counts[commercial] = (counts[commercial] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [rendezVous]);

  const chartDataByCommercialAndMonth = useMemo(() => {
    const commercialSet = new Set<string>();
    const monthMap = new Map<string, Map<string, number>>();

    rendezVous.forEach((rv) => {
      const commercial = rv.commercialName || "Non assigné";
      commercialSet.add(commercial);

      const d = new Date(rv.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Map());
      }
      const commercialCounts = monthMap.get(monthKey)!;
      commercialCounts.set(commercial, (commercialCounts.get(commercial) ?? 0) + 1);
    });

    const commercialNames = Array.from(commercialSet).sort();
    const sortedMonths = Array.from(monthMap.keys()).sort();

    return sortedMonths.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      const commercialCounts = monthMap.get(monthKey)!;
      const row: Record<string, string | number> = { month: monthLabel, total: 0 };
      let total = 0;
      for (const name of commercialNames) {
        const count = commercialCounts.get(name) ?? 0;
        row[name] = count;
        total += count;
      }
      row.total = total;
      return row;
    });
  }, [rendezVous]);

  const commercialNamesForChart = useMemo(() => {
    const set = new Set<string>();
    rendezVous.forEach((rv) => set.add(rv.commercialName || "Non assigné"));
    return Array.from(set).sort();
  }, [rendezVous]);

  const formatTimeShort = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getClientName = (rv: RendezVousItem) => {
    if (rv.client?.nom) return rv.client.nom;
    if (rv.clientEntreprise?.nom_entreprise) return rv.clientEntreprise.nom_entreprise;
    return "—";
  };

  const isClientEntreprise = (rv: RendezVousItem) => !!rv.clientEntreprise?.nom_entreprise;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c0f14]">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-cyan-600/20 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30">
          <div className="px-6 py-12 lg:py-14">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-32 rounded-full" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-24 rounded-2xl" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 -mt-6 space-y-6">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8">
        <div className="rounded-full bg-destructive/10 p-4">
          <Calendar className="h-12 w-12 text-destructive" />
        </div>
        <p className="text-center text-destructive font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c0f14]">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <div className="relative px-6 py-12 lg:py-14">
          <div className="max-w-7xl mx-auto">
            {/* Title + Stats row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-white/95 border border-white/20">
                  <CalendarDays className="h-4 w-4" />
                  Vue d&apos;ensemble
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-[2.75rem]">
                  Rendez-vous
                </h1>
                <p className="max-w-lg text-lg text-white/90 leading-relaxed">
                  Tous les rendez-vous classés par statut et par commercial
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 px-6 py-5 min-w-[120px] shadow-xl shadow-black/10 transition-all hover:scale-[1.02] hover:bg-white/20">
                  <Calendar className="h-6 w-6 text-white mb-2" />
                  <span className="text-2xl font-bold text-white">{rendezVous.length}</span>
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Total</span>
                </div>
                {(["EN_ATTENTE", "CONFIRME", "EFFECTUE"] as const).map((key) => {
                  const count = statusCounts[key] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={key}
                      className="flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 px-5 py-4 min-w-[100px] transition-all hover:bg-white/15"
                    >
                      <span className="text-xl font-bold text-white">{count}</span>
                      <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">{STATUT_LABELS[key]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Charts - integrated in header */}
            <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-white" />
                    <h2 className="text-base font-semibold text-white">Par commercial</h2>
                  </div>
                  <div className="h-[240px] w-full">
                    {chartDataByCommercial.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataByCommercial} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                          <XAxis type="number" stroke="rgba(255,255,255,0.8)" tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={90} stroke="rgba(255,255,255,0.8)" tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(15,23,42,0.95)", color: "#fff" }}
                            formatter={(value) => [value ?? 0, "Rendez-vous"]}
                            labelFormatter={(label) => label}
                          />
                          <Bar dataKey="count" fill="rgba(255,255,255,0.9)" radius={[0, 4, 4, 0]} name="Rendez-vous" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center rounded-xl bg-white/5">
                        <BarChart3 className="h-10 w-10 text-white/40 mb-2" />
                        <p className="text-sm text-white/70">Aucun rendez-vous</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-white" />
                    <h2 className="text-base font-semibold text-white">Par mois et commercial</h2>
                  </div>
                  <div className="h-[240px] w-full bg-white/35">
                    {chartDataByCommercialAndMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataByCommercialAndMonth} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                          <XAxis dataKey="month" stroke="rgba(255,255,255,0.8)" tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 10 }} />
                          <YAxis stroke="rgba(255,255,255,0.8)" tick={{ fill: "rgba(255,255,255,0.9)", fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(15,23,42,0.95)", color: "#fff" }}
                            labelFormatter={(label) => label}
                          />
                          <Legend wrapperStyle={{ color: "rgba(255,255,255,0.9)" }} formatter={(v) => <span className="text-white/90 text-xs">{v}</span>} />
                          <BarStack>
                            {commercialNamesForChart.map((name, i) => (
                              <Bar key={name} dataKey={name} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[0, 4, 0, 0]} name={name} />
                            ))}
                          </BarStack>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center rounded-xl bg-white/5">
                        <BarChart3 className="h-10 w-10 text-white/40 mb-2" />
                        <p className="text-sm text-white/70">Aucune donnée</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6 lg:p-8 -mt-6 relative z-10">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUT_LABELS).map(([key, label]) => {
            const count = statusCounts[key] ?? 0;
            const config = STATUT_CONFIG[key];
            if (!config || count === 0) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setExpandedStatus(expandedStatus === key ? null : key)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md ${config.bg} ${config.border} ${expandedStatus === key ? "ring-2 ring-offset-2 ring-emerald-500/50" : ""}`}
              >
                <span className={`text-sm font-semibold ${config.text}`}>{label}</span>
                <Badge variant="secondary" className={`border-0 text-xs font-bold ${config.text}`}>
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Grouped Content */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([statut, byCommercial]) => {
            const totalForStatus = Object.values(byCommercial).flat().length;
            const isExpanded = expandedStatus === statut;
            const config = STATUT_CONFIG[statut] || STATUT_CONFIG.EN_ATTENTE;

            return (
              <Collapsible key={statut} open={isExpanded} onOpenChange={(open) => setExpandedStatus(open ? statut : null)}>
                <Card className={`overflow-hidden border-2 transition-all duration-300 ${config.border} ${config.bg} shadow-lg dark:shadow-none rounded-2xl`}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer transition-colors hover:opacity-95 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} text-white shadow-lg`}>
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <p className={`font-semibold text-base ${config.text}`}>{STATUT_LABELS[statut] || statut}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {totalForStatus} rendez-vous · {Object.keys(byCommercial).length} commercial{Object.keys(byCommercial).length > 1 ? "aux" : ""}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-500" /> : <ChevronRight className="h-5 w-5 text-slate-500" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-6">
                      <div className="space-y-8">
                        {Object.entries(byCommercial).map(([commercial, items]) => (
                          <div key={commercial} className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-700/50">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                                {getInitials(commercial)}
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{commercial}</span>
                              <Badge variant="secondary" className="ml-2 rounded-full px-2.5">
                                {items.length}
                              </Badge>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                              {items.map((rv) => (
                                <div
                                  key={rv.id}
                                  className="group flex gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-900/30 dark:hover:border-emerald-700/50"
                                >
                                  <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2.5 shrink-0 dark:from-emerald-950/40 dark:to-teal-950/40">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                      {new Date(rv.date).toLocaleDateString("fr-FR", { weekday: "short" })}
                                    </span>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                                      {new Date(rv.date).getDate()}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {new Date(rv.date).toLocaleDateString("fr-FR", { month: "short" })}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-slate-900 dark:text-white">{getClientName(rv)}</p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-[10px] font-bold dark:bg-emerald-900/50">
                                        {getInitials(commercial)}
                                      </span>
                                      {commercial}
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                                      <Clock className="h-3.5 w-3.5 shrink-0" />
                                      {formatTimeShort(rv.date)}
                                      {isClientEntreprise(rv) && <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        {/* Empty State */}
        {Object.keys(grouped).length === 0 && (
          <Card className="overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="mb-6 rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-inner">
                <Calendar className="h-16 w-16 text-slate-300 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Aucun rendez-vous</h3>
              <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Les rendez-vous apparaîtront ici une fois qu&apos;ils auront été créés par les commerciaux.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
