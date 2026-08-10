"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllRendezVous } from "@/lib/actions/rendezvous";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Clock,
  Building2,
  Sparkles,
  CalendarDays,
} from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-violet-950/10">
      <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6 lg:p-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-xl shadow-indigo-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-transparent" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-start gap-4">
              <Link href="/manager/departements">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl border border-slate-200/60 bg-white/50 hover:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <span className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Gestion commerciale
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
                  Rendez-vous
                </h1>
                <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-400">
                  Vue d&apos;ensemble par statut, commercial et date
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50 px-5 py-3 dark:border-indigo-900/50 dark:from-indigo-950/50 dark:to-violet-950/30">
              <CalendarDays className="h-6 w-6 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {rendezVous.length}
                </p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  rendez-vous au total
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Stats Pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUT_LABELS).map(([key, label]) => {
            const count = statusCounts[key] ?? 0;
            const config = STATUT_CONFIG[key];
            if (!config || count === 0) return null;
            return (
              <div
                key={key}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${config.bg} ${config.border} transition-all hover:scale-[1.02]`}
              >
                <span className={`text-sm font-semibold ${config.text}`}>{label}</span>
                <Badge
                  variant="secondary"
                  className={`border-0 bg-white/60 text-xs font-bold dark:bg-black/20 ${config.text}`}
                >
                  {count}
                </Badge>
              </div>
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
              <Collapsible
                key={statut}
                open={isExpanded}
                onOpenChange={(open) => setExpandedStatus(open ? statut : null)}
              >
                <Card
                  className={`overflow-hidden border-2 transition-all duration-300 ${config.border} ${config.bg} shadow-lg shadow-slate-200/50 dark:shadow-none`}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer transition-colors hover:opacity-90">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-md`}
                          >
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className={`font-semibold ${config.text}`}>
                              {STATUT_LABELS[statut] || statut}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {totalForStatus} rendez-vous · {Object.keys(byCommercial).length}{" "}
                              commercial{Object.keys(byCommercial).length > 1 ? "aux" : ""}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-slate-500 transition-transform" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-500 transition-transform" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-8">
                        {Object.entries(byCommercial).map(([commercial, items]) => (
                          <div key={commercial} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200/80 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                {getInitials(commercial)}
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {commercial}
                              </span>
                              <Badge
                                variant="outline"
                                className="ml-2 border-slate-300/60 text-xs dark:border-slate-600"
                              >
                                {items.length}
                              </Badge>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {items.map((rv) => (
                                <div
                                  key={rv.id}
                                  className="group flex gap-4 rounded-xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/50 dark:hover:border-indigo-900/50"
                                >
                                  <div className="flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 px-3 py-2 dark:from-indigo-950/50 dark:to-violet-950/50">
                                    <span className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                      {new Date(rv.date).toLocaleDateString("fr-FR", {
                                        weekday: "short",
                                      })}
                                    </span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                                      {new Date(rv.date).getDate()}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {new Date(rv.date).toLocaleDateString("fr-FR", {
                                        month: "short",
                                      })}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-slate-900 dark:text-white">
                                      {getClientName(rv)}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                      <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-[10px] font-bold dark:bg-indigo-900/50">
                                        {getInitials(commercial)}
                                      </span>
                                      {commercial}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                      <Clock className="h-3.5 w-3.5 shrink-0" />
                                      {formatTimeShort(rv.date)}
                                      {isClientEntreprise(rv) && (
                                        <Building2 className="ml-2 h-3.5 w-3.5 shrink-0" />
                                      )}
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
          <Card className="overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-6 rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                <Calendar className="h-16 w-16 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Aucun rendez-vous
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Les rendez-vous apparaîtront ici une fois qu&apos;ils auront été créés par les
                commerciaux.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
