"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Car,
  ChevronRight,
  FileText,
  FolderOpen,
  LayoutGrid,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ClientSAVPage from "./page1";
import VoitureSAVTab from "./VoitureSAVTab";
import CategorieDiagnostiqueTab from "./CategorieDiagnostiqueTab";
import DetailsDiagnostiqueTab from "./DetailsDiagnostiqueTab";

type TabValue = "client" | "voiture" | "categorie-diagnostique" | "details-diagnostique";

const tabConfig: {
  value: TabValue;
  label: string;
  shortLabel: string;
  icon: typeof User;
  description: string;
  accent: string;
  iconBg: string;
  ring: string;
  statKey: keyof PageStats;
}[] = [
  {
    value: "client",
    label: "Clients",
    shortLabel: "Clients SAV",
    icon: User,
    description: "Dossiers et contacts clients",
    accent: "from-teal-500 via-cyan-500 to-sky-500",
    iconBg: "bg-teal-50 text-teal-700 border-teal-100",
    ring: "ring-teal-500/30",
    statKey: "clients",
  },
  {
    value: "voiture",
    label: "Véhicules",
    shortLabel: "Parc auto",
    icon: Car,
    description: "Véhicules rattachés aux clients",
    accent: "from-emerald-500 via-green-500 to-teal-500",
    iconBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
    ring: "ring-emerald-500/30",
    statKey: "voitures",
  },
  {
    value: "categorie-diagnostique",
    label: "Catégories",
    shortLabel: "Diagnostics",
    icon: FolderOpen,
    description: "Types et familles d'interventions",
    accent: "from-sky-500 via-blue-500 to-indigo-500",
    iconBg: "bg-sky-50 text-sky-700 border-sky-100",
    ring: "ring-sky-500/30",
    statKey: "categories",
  },
  {
    value: "details-diagnostique",
    label: "Détails",
    shortLabel: "Prestations",
    icon: FileText,
    description: "Interventions et tarification FCFA",
    accent: "from-violet-500 via-purple-500 to-fuchsia-500",
    iconBg: "bg-violet-50 text-violet-700 border-violet-100",
    ring: "ring-violet-500/30",
    statKey: "details",
  },
];

type PageStats = {
  clients: number;
  voitures: number;
  categories: number;
  details: number;
};

const emptyStats: PageStats = {
  clients: 0,
  voitures: 0,
  categories: 0,
  details: 0,
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

export default function ClientSavPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("client");
  const [stats, setStats] = useState<PageStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setStatsLoading(true);
      const [clients, voitures, categories, details] = await Promise.all([
        fetchStatCount("/api/sav/client-sav"),
        fetchStatCount("/api/sav/voiture-sav"),
        fetchStatCount("/api/sav/categorie-diagnostic"),
        fetchStatCount("/api/sav/detail-diagnostic"),
      ]);

      if (!cancelled) {
        setStats({ clients, voitures, categories, details });
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
  const totalRecords = stats.clients + stats.voitures + stats.categories + stats.details;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(8,145,178,0.08),transparent_24%),linear-gradient(to_bottom,#f8fafc,#ffffff_40%,#f1f5f9)]"
        aria-hidden
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(13,148,136,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(8,145,178,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.12),transparent_30%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
            <Link
              href="/sav"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              SAV
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="font-medium text-teal-200">Dossiers référentiels</span>
          </nav>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                SAV · Référentiels
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Wrench className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Client SAV
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Gestion centralisée des clients, véhicules et catalogue de diagnostics —
                    la base de tous vos dossiers après-vente.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-sm"
                >
                  {statsLoading ? "…" : `${totalRecords} enregistrement(s)`}
                </Badge>
                {!statsLoading && stats.clients === 0 && (
                  <Badge className="rounded-full border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100 hover:bg-amber-400/10">
                    Commencez par ajouter un client
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <button
                type="button"
                onClick={() => setActiveTab("client")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-0 bg-white px-6 py-3 text-sm font-semibold text-teal-950 shadow-xl shadow-black/20 transition hover:bg-teal-50 sm:w-auto"
              >
                Gérer les clients
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <Link
                href="/sav/diagnostique-arrivee"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto"
              >
                Diagnostic arrivée
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KPI tab selectors + content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="-mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            const count = stats[tab.statKey];

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "group block w-full text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
                  isActive ? "-translate-y-0.5" : "hover:-translate-y-1"
                )}
              >
                <Card
                  className={cn(
                    "overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300",
                    isActive
                      ? cn("shadow-2xl shadow-slate-200/70 ring-2 ring-offset-2", tab.ring)
                      : "hover:shadow-2xl hover:shadow-slate-200/70"
                  )}
                >
                  <div className={cn("h-1 bg-gradient-to-r", tab.accent)} />
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {tab.shortLabel}
                        </p>
                        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-950">
                          {statsLoading ? "—" : count}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">{tab.description}</p>
                      </div>
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition",
                          isActive ? tab.iconBg : "border-slate-100 bg-slate-50 text-slate-500 group-hover:border-slate-200"
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
        </div>

        {/* Active section header */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br text-white shadow-lg",
                activeConfig.accent
              )}
            >
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {activeConfig.label}
              </h2>
              <p className="text-sm text-slate-500">{activeConfig.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="mt-6">
          <Card className="overflow-hidden border-0 bg-white/95 shadow-xl shadow-slate-200/40 ring-1 ring-slate-100 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <TabsContent
                value="client"
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <ClientSAVPage embedded />
              </TabsContent>

              <TabsContent
                value="voiture"
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <VoitureSAVTab embedded />
              </TabsContent>

              <TabsContent
                value="categorie-diagnostique"
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <CategorieDiagnostiqueTab embedded />
              </TabsContent>

              <TabsContent
                value="details-diagnostique"
                className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <DetailsDiagnostiqueTab embedded />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
