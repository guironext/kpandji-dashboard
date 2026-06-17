"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  FolderOpen,
  GraduationCap,
  Scale,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DossiersVeilleJuridiqueTab from "@/components/juridique/DossiersVeilleJuridiqueTab";
import NonConformiteJuridiqueTab from "@/components/juridique/NonConformiteJuridiqueTab";
import type {
  DossierVeilleJuridiqueListItem,
  NonConformiteJuridiqueListItem,
} from "@/lib/actions/veille-juridique";

type TabId =
  | "dossiers"
  | "non-conformite"
  | "ecarts-risques"
  | "nouvelles-loi"
  | "actions-correctifs"
  | "formation";

const TABS: {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  gradient: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  inactiveIcon: string;
}[] = [
  {
    id: "dossiers",
    label: "Dossiers",
    shortLabel: "Dossiers",
    icon: FolderOpen,
    gradient: "from-violet-500 via-purple-500 to-indigo-600",
    inactiveBg: "bg-violet-50/70",
    inactiveBorder: "border-violet-200/70",
    inactiveText: "text-violet-900",
    inactiveIcon: "bg-violet-100 text-violet-600",
  },
  {
    id: "non-conformite",
    label: "Non conformité et pratiques actuelles",
    shortLabel: "Non conformité",
    icon: AlertTriangle,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    inactiveBg: "bg-amber-50/70",
    inactiveBorder: "border-amber-200/70",
    inactiveText: "text-amber-900",
    inactiveIcon: "bg-amber-100 text-amber-600",
  },
  {
    id: "ecarts-risques",
    label: "Écartès et risques juridiques",
    shortLabel: "Écarts & risques",
    icon: Scale,
    gradient: "from-rose-500 via-red-500 to-rose-600",
    inactiveBg: "bg-rose-50/70",
    inactiveBorder: "border-rose-200/70",
    inactiveText: "text-rose-900",
    inactiveIcon: "bg-rose-100 text-rose-600",
  },
  {
    id: "nouvelles-loi",
    label: "Nouvelles loi",
    shortLabel: "Nouvelles loi",
    icon: BookOpen,
    gradient: "from-indigo-500 via-violet-500 to-purple-600",
    inactiveBg: "bg-indigo-50/70",
    inactiveBorder: "border-indigo-200/70",
    inactiveText: "text-indigo-900",
    inactiveIcon: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "actions-correctifs",
    label: "Action correctifs",
    shortLabel: "Actions correctifs",
    icon: ShieldCheck,
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    inactiveBg: "bg-emerald-50/70",
    inactiveBorder: "border-emerald-200/70",
    inactiveText: "text-emerald-900",
    inactiveIcon: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "formation",
    label: "Formation",
    shortLabel: "Formation",
    icon: GraduationCap,
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    inactiveBg: "bg-sky-50/70",
    inactiveBorder: "border-sky-200/70",
    inactiveText: "text-sky-900",
    inactiveIcon: "bg-sky-100 text-sky-600",
  },
];

function TabPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
      <p className="text-center text-sm text-slate-500">
        Contenu de la section « {title} » à venir.
      </p>
    </div>
  );
}

export default function VeilleJuridiqueClient({
  dossiers,
  nonConformites,
}: {
  dossiers: DossierVeilleJuridiqueListItem[];
  nonConformites: NonConformiteJuridiqueListItem[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("dossiers");
  const activeTabConfig = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <div className="min-h-full bg-slate-50/80">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 px-4 pb-24 pt-8 sm:px-6 sm:pb-28 lg:px-8">
        <div
          className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              Service Juridique · Veille
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md sm:h-14 sm:w-14">
                <Scale className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Veille juridique
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                  Suivez la conformité, les risques juridiques, les évolutions législatives et les
                  actions correctives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 space-y-5 pb-10 sm:space-y-6 sm:pb-12">
          <div
            className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-indigo-200/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-violet-200/20 blur-3xl"
            aria-hidden
          />

          <div className="relative lg:hidden">
            <label
              htmlFor="veille-tab-select"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Section active
            </label>
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
              <SelectTrigger
                id="veille-tab-select"
                className="h-12 w-full rounded-xl border-slate-200 bg-white shadow-sm"
              >
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <activeTabConfig.icon className="h-4 w-4 text-slate-600" />
                    {activeTabConfig.label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <SelectItem key={tab.id} value={tab.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabId)}
            className="relative w-full"
          >
            <div className="mb-5 hidden lg:block">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-sm">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "group flex min-w-[140px] flex-1 flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all",
                        "data-[state=inactive]:shadow-none",
                        "data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-br data-[state=active]:text-white data-[state=active]:shadow-lg",
                        tab.gradient,
                        `data-[state=inactive]:${tab.inactiveBg} data-[state=inactive]:${tab.inactiveBorder} data-[state=inactive]:${tab.inactiveText}`
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg",
                            "group-data-[state=active]:bg-white/20",
                            tab.inactiveIcon
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        {tab.shortLabel}
                      </span>
                      <span className="text-[11px] opacity-80 group-data-[state=active]:text-white/90">
                        {tab.label}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {TABS.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0 focus-visible:ring-0">
                {tab.id === "dossiers" ? (
                  <DossiersVeilleJuridiqueTab dossiers={dossiers} />
                ) : tab.id === "non-conformite" ? (
                  <NonConformiteJuridiqueTab
                    nonConformites={nonConformites}
                    dossiers={dossiers}
                  />
                ) : (
                  <TabPlaceholder title={tab.label} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
