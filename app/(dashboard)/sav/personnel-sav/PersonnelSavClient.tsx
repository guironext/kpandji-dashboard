"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Users,
  UsersRound,
  LayoutGrid,
} from "lucide-react";
import TravailleursSavPanel from "./TravailleursSavPanel";

function EmptyPanel({
  icon: Icon,
  title,
  description,
  accentClass,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accentClass: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-dashed bg-gradient-to-br p-10 sm:p-14",
        "from-slate-50/90 via-white to-slate-50/50 dark:from-slate-950/40 dark:via-slate-900/30 dark:to-slate-950/50",
        "border-slate-200/90 dark:border-slate-700/80",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset] dark:shadow-none",
        "animate-in fade-in slide-in-from-bottom-3 duration-500",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-[0.12] blur-3xl",
          accentClass,
        )}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        <div
          className={cn(
            "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm",
            "border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-900",
          )}
        >
          <Icon className="h-8 w-8 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
        <div className="mt-8 h-px w-24 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Liste à venir
        </p>
      </div>
    </div>
  );
}

export default function PersonnelSavClient() {
  const [statsTick, setStatsTick] = useState(0);
  const [nbTravailleurs, setNbTravailleurs] = useState<number | null>(null);
  const [nbGroupes, setNbGroupes] = useState<number | null>(null);

  const refreshStats = useCallback(() => {
    setStatsTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pr, gr] = await Promise.all([
          fetch("/api/sav/personnel").then((r) => r.json()),
          fetch("/api/sav/groupe-personnel").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setNbTravailleurs(pr.success ? (pr.data?.length ?? 0) : 0);
        setNbGroupes(gr.success ? (gr.data?.length ?? 0) : 0);
      } catch {
        if (!cancelled) {
          setNbTravailleurs(0);
          setNbGroupes(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statsTick]);

  const formatStat = (n: number | null) =>
    n === null ? "—" : String(n);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-800 shadow-[0_25px_60px_-15px_rgba(13,148,136,0.45)] ring-1 ring-white/10">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-90"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-50/95 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden />
                Ressources humaines SAV
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Personnel SAV
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-emerald-50/85 sm:text-lg">
                  Gérez les travailleurs et les groupes d&apos;équipe : affectations,
                  organisation et visibilité sur votre service après-vente.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3 sm:justify-end">
              <div className="flex min-w-[140px] flex-col rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-100/80">
                  Travailleurs
                </span>
                <span className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">
                  {formatStat(nbTravailleurs)}
                </span>
              </div>
              <div className="flex min-w-[140px] flex-col rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-100/80">
                  Groupes
                </span>
                <span className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">
                  {formatStat(nbGroupes)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs + panels */}
      <Tabs defaultValue="travailleurs" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LayoutGrid className="h-4 w-4 shrink-0 text-emerald-600/80 dark:text-emerald-400/80" />
            <span>Vue par catégorie</span>
          </div>
          <TabsList
            className={cn(
              "grid h-auto w-full max-w-md grid-cols-2 gap-1 p-1.5",
              "rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md",
              "dark:border-slate-700/80 dark:bg-slate-900/60",
            )}
          >
            <TabsTrigger
              value="travailleurs"
              className={cn(
                "gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                "data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-teal-700 data-[state=active]:text-white data-[state=active]:shadow-md",
                "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100/90 dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:bg-slate-800/80",
              )}
            >
              <Users className="h-4 w-4 shrink-0" />
              Travailleurs
            </TabsTrigger>
            <TabsTrigger
              value="groupe"
              className={cn(
                "gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                "data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600 data-[state=active]:to-teal-700 data-[state=active]:text-white data-[state=active]:shadow-md",
                "data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-100/90 dark:data-[state=inactive]:text-slate-400 dark:data-[state=inactive]:hover:bg-slate-800/80",
              )}
            >
              <UsersRound className="h-4 w-4 shrink-0" />
              Groupe
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="travailleurs"
          className="mt-8 focus-visible:outline-none focus-visible:ring-0"
        >
          <TravailleursSavPanel onStatsChange={refreshStats} />
        </TabsContent>

        <TabsContent
          value="groupe"
          className="mt-8 focus-visible:outline-none focus-visible:ring-0"
        >
          <EmptyPanel
            icon={UsersRound}
            title="Aucun groupe défini"
            description="Créez des groupes pour organiser les équipes par atelier, spécialité ou créneau. Les groupes pourront être liés aux interventions et plannings."
            accentClass="bg-cyan-500"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
