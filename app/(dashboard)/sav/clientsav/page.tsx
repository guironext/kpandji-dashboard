"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Car, ChevronRight, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ClientSAVPage from "./page1";
import VoitureSAVTab from "./VoitureSAVTab";

type TabValue = "client" | "voiture";

const tabConfig: {
  value: TabValue;
  label: string;
  description: string;
  icon: typeof User;
  accent: string;
  iconBg: string;
  statKey: keyof PageStats;
}[] = [
  {
    value: "client",
    label: "Clients",
    description: "Dossiers et contacts",
    icon: User,
    accent: "from-teal-500 to-cyan-600",
    iconBg: "bg-teal-50 text-teal-700",
    statKey: "clients",
  },
  {
    value: "voiture",
    label: "Véhicules",
    description: "Parc rattaché aux clients",
    icon: Car,
    accent: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-50 text-emerald-700",
    statKey: "voitures",
  },
];

type PageStats = {
  clients: number;
  voitures: number;
};

const emptyStats: PageStats = {
  clients: 0,
  voitures: 0,
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
      const [clients, voitures] = await Promise.all([
        fetchStatCount("/api/sav/client-sav"),
        fetchStatCount("/api/sav/voiture-sav"),
      ]);

      if (!cancelled) {
        setStats({ clients, voitures });
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

  return (
    <div className="relative min-h-full bg-[#f3f6fa]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.08),transparent_26%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_22%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8">
        <header className="mb-3 sm:mb-6">
          <nav className="mb-2.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-400 sm:mb-3 sm:text-sm">
            <Link
              href="/sav"
              className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 transition-colors hover:bg-white hover:text-slate-700"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              SAV
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="font-medium text-slate-600">Clients SAV</span>
          </nav>

          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25 sm:h-12 sm:w-12">
                <ActiveIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl lg:text-[1.75rem]">
                  Client SAV
                </h1>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
                  Clients et véhicules du service après-vente.
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              {tabConfig.map((tab) => {
                const count = stats[tab.statKey];
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-left ring-1 transition",
                      activeTab === tab.value
                        ? "bg-white shadow-sm ring-slate-200"
                        : "bg-white/60 ring-transparent hover:bg-white hover:ring-slate-200"
                    )}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {tab.label}
                    </p>
                    <p className="font-mono text-xl font-semibold tabular-nums text-slate-900">
                      {statsLoading ? "—" : count}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Mobile + all: sticky 2-way segmented control */}
        <nav
          className="sticky top-16 z-30 -mx-3 mb-3 border-b border-slate-200/70 bg-[#f3f6fa]/92 px-3 py-2 backdrop-blur-xl sm:static sm:mx-0 sm:mb-5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
          aria-label="Sections clients SAV"
        >
          <div
            role="tablist"
            className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200/80"
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
                    "relative flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center transition touch-manipulation sm:min-h-[3.5rem] sm:justify-start sm:px-4",
                    isActive
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 active:bg-slate-50 sm:hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isActive ? "bg-white/15 text-white" : tab.iconBg
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-[13px] font-semibold leading-tight sm:text-sm">
                      {tab.label}
                    </span>
                    <span
                      className={cn(
                        "hidden truncate text-[11px] sm:block",
                        isActive ? "text-white/70" : "text-slate-400"
                      )}
                    >
                      {tab.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "ml-auto hidden min-w-[1.5rem] rounded-full px-2 py-0.5 text-xs font-bold tabular-nums sm:inline-block",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {statsLoading ? "—" : count}
                  </span>
                  <span
                    className={cn(
                      "absolute right-2 top-1.5 min-w-[1.15rem] rounded-full px-1 text-[10px] font-bold tabular-nums leading-4 sm:hidden",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {statsLoading ? "·" : count}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <section>
          <div className="mb-3 hidden items-center gap-3 sm:mb-4 sm:flex">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                activeConfig.accent
              )}
            >
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                {activeConfig.label}
              </h2>
              <p className="truncate text-sm text-slate-500">{activeConfig.description}</p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabValue)}
            className="mt-0"
          >
            <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-sm ring-1 ring-slate-200/80 sm:rounded-3xl">
              <div className="p-3 sm:p-5 lg:p-6">
                <TabsContent
                  value="client"
                  className="mt-0 focus-visible:outline-none animate-in fade-in duration-200"
                >
                  <ClientSAVPage embedded />
                </TabsContent>

                <TabsContent
                  value="voiture"
                  className="mt-0 focus-visible:outline-none animate-in fade-in duration-200"
                >
                  <VoitureSAVTab embedded />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
