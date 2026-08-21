"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  FolderOpen,
  Gift,
  Home,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CategorieDiagnostiqueTab from "./CategorieDiagnostiqueTab";
import DetailsDiagnostiqueTab from "./DetailsDiagnostiqueTab";
import DiagnostiqueOffertTab from "./DiagnostiqueOffertTab";
import ListeVoitureSousGarantieTab from "./ListeVoitureSousGarantieTab";

type TabValue =
  | "categorie-diagnostique"
  | "details-diagnostique"
  | "garantie-offert"
  | "voiture-sous-garantie";

const tabConfig: {
  value: TabValue;
  label: string;
  mobileLabel: string;
  icon: typeof FolderOpen;
  description: string;
  accent: string;
  iconBg: string;
  glow: string;
  ring: string;
  statKey: keyof PageStats;
}[] = [
  {
    value: "categorie-diagnostique",
    label: "Catégories",
    mobileLabel: "Catégories",
    icon: FolderOpen,
    description: "Familles d'interventions",
    accent: "from-sky-500 via-blue-500 to-indigo-500",
    iconBg: "bg-sky-50 text-sky-700",
    glow: "shadow-sky-200/50",
    ring: "ring-sky-500/40",
    statKey: "categories",
  },
  {
    value: "details-diagnostique",
    label: "Détails",
    mobileLabel: "Détails",
    icon: FileText,
    description: "Prestations et tarifs FCFA",
    accent: "from-violet-500 via-purple-500 to-fuchsia-500",
    iconBg: "bg-violet-50 text-violet-700",
    glow: "shadow-violet-200/50",
    ring: "ring-violet-500/40",
    statKey: "details",
  },
  {
    value: "garantie-offert",
    label: "Garantie Offert",
    mobileLabel: "Offert",
    icon: Gift,
    description: "Garanties SAV enregistrées",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    iconBg: "bg-amber-50 text-amber-700",
    glow: "shadow-amber-200/50",
    ring: "ring-amber-500/40",
    statKey: "offerts",
  },
  {
    value: "voiture-sous-garantie",
    label: "Véhicules sous garantie",
    mobileLabel: "Garantie",
    icon: ShieldCheck,
    description: "Parc couvert par la garantie",
    accent: "from-rose-500 via-pink-500 to-fuchsia-500",
    iconBg: "bg-rose-50 text-rose-700",
    glow: "shadow-rose-200/50",
    ring: "ring-rose-500/40",
    statKey: "garanties",
  },
];

type PageStats = {
  categories: number;
  details: number;
  offerts: number;
  garanties: number;
};

const emptyStats: PageStats = {
  categories: 0,
  details: 0,
  offerts: 0,
  garanties: 0,
};

async function fetchStatCount(url: string): Promise<number> {
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) return json.data.length;
    return 0;
  } catch {
    return 0;
  }
}

export default function ConfigurationSavPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("categorie-diagnostique");
  const [stats, setStats] = useState<PageStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setStatsLoading(true);
      const [categories, details, offerts, garanties] = await Promise.all([
        fetchStatCount("/api/sav/categorie-diagnostic"),
        fetchStatCount("/api/sav/detail-diagnostic?catalog=1"),
        fetchStatCount("/api/sav/garantie-sav"),
        fetchStatCount("/api/sav/voiture-sav-garantie"),
      ]);

      if (!cancelled) {
        setStats({ categories, details, offerts, garanties });
        setStatsLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeConfig = tabConfig.find((t) => t.value === activeTab)!;
  const ActiveIcon = activeConfig.icon;
  const catalogTotal =
    stats.categories + stats.details + stats.offerts + stats.garanties;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(8,145,178,0.08),transparent_24%),linear-gradient(to_bottom,#f8fafc,#ffffff_40%,#f1f5f9)]"
        aria-hidden
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(13,148,136,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(8,145,178,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.12),transparent_30%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                SAV · Configuration
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Settings2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Configuration SAV
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Paramétrez le catalogue atelier : catégories, prestations, garanties
                    offertes et véhicules couverts.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-teal-300" />
                  {todayLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-xs font-medium text-teal-100">
                  <FolderOpen className="h-3.5 w-3.5" />
                  {statsLoading ? "…" : catalogTotal} élément(s) au catalogue
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl border-0 bg-white px-6 text-teal-950 shadow-xl shadow-black/20 hover:bg-teal-50 sm:w-auto"
              >
                <Link href="/sav">
                  Tableau de bord
                  <Home className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/sav/clientsav">
                  Clients SAV
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          className="-mt-16 grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Sections de configuration"
        >
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            const count = stats[tab.statKey];

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className="group block text-left"
              >
                <Card
                  className={cn(
                    "overflow-hidden border-0 bg-white/90 shadow-xl backdrop-blur-xl transition duration-300",
                    isActive
                      ? cn("shadow-2xl ring-2", tab.ring, tab.glow, "-translate-y-1")
                      : "shadow-slate-200/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/70"
                  )}
                >
                  <div className={cn("h-1 bg-gradient-to-r", tab.accent)} />
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {tab.label}
                        </p>
                        <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-2xl">
                          {statsLoading ? "—" : count}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{tab.description}</p>
                      </div>
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11",
                          tab.iconBg,
                          "transition-transform group-hover:scale-105"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </nav>

        <nav
          className="sticky top-16 z-30 -mx-4 mb-0 mt-4 border-b border-slate-200/70 bg-[#f8fafc]/92 px-4 py-2 backdrop-blur-xl sm:hidden"
          aria-label="Navigation rapide"
        >
          <div
            role="tablist"
            className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200/80"
          >
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const count = stats[tab.statKey];

              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center transition touch-manipulation",
                    isActive
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 active:bg-slate-50"
                  )}
                >
                  <span className="relative">
                    <Icon className="h-4 w-4" />
                    <span
                      className={cn(
                        "absolute -right-2.5 -top-1.5 min-w-[1.05rem] rounded-full px-1 text-[9px] font-bold tabular-nums leading-4",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {statsLoading ? "·" : count}
                    </span>
                  </span>
                  <span className="max-w-full truncate text-[10px] font-semibold leading-tight">
                    {tab.mobileLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-6 space-y-8 pb-10 sm:mt-10 sm:space-y-10 sm:pb-12">
          <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
            <div className={cn("h-1 bg-gradient-to-r", activeConfig.accent)} />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    activeConfig.iconBg
                  )}
                >
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    {activeConfig.label}
                  </CardTitle>
                  <CardDescription>{activeConfig.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabValue)}
                className="mt-0"
              >
                <TabsContent
                  value="categorie-diagnostique"
                  className="mt-0 focus-visible:outline-none animate-in fade-in duration-200"
                >
                  <CategorieDiagnostiqueTab embedded />
                </TabsContent>

                <TabsContent
                  value="details-diagnostique"
                  className="mt-0 focus-visible:outline-none animate-in fade-in duration-200"
                >
                  <DetailsDiagnostiqueTab embedded />
                </TabsContent>

                <TabsContent
                  value="garantie-offert"
                  className="mt-0 focus-visible:outline-none animate-in fade-in duration-200"
                >
                  <DiagnostiqueOffertTab embedded />
                </TabsContent>

                <TabsContent
                  value="voiture-sous-garantie"
                  className="mt-0 focus-visible:outline-none animate-in fade-in duration-200"
                >
                  <ListeVoitureSousGarantieTab embedded />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
