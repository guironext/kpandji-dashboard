"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Wand2,
  Users,
  ClipboardList,
  BarChart3,
  FolderKanban,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProjetPonctuelListItem } from "@/lib/actions/projet-ponctuel";
import GenererProjetPanel from "./GenererProjetPanel";
import ActivitesResponsablesPanel from "./ActivitesResponsablesPanel";
import MiseEnOeuvrePonctuelPanel from "./MiseEnOeuvrePonctuelPanel";
import PerformancesPonctuelPanel from "./PerformancesPonctuelPanel";

type TabId =
  | "generer-projet"
  | "activites-responsables"
  | "mise-en-oeuvre"
  | "performances";

const TABS: {
  id: TabId;
  label: string;
  description: string;
  icon: typeof Wand2;
  gradient: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  shadow: string;
}[] = [
  {
    id: "generer-projet",
    label: "Générer projet",
    description: "Créer un nouveau projet ponctuel",
    icon: Wand2,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    inactiveBg: "bg-violet-50",
    inactiveBorder: "border-violet-200",
    inactiveText: "text-violet-700",
    shadow: "shadow-violet-500/25",
  },
  {
    id: "activites-responsables",
    label: "Activités et responsables",
    description: "Actions et affectations",
    icon: Users,
    gradient: "from-sky-500 via-cyan-500 to-teal-500",
    inactiveBg: "bg-sky-50",
    inactiveBorder: "border-sky-200",
    inactiveText: "text-sky-700",
    shadow: "shadow-sky-500/25",
  },
  {
    id: "mise-en-oeuvre",
    label: "Mise en Oeuvre",
    description: "Suivi et exécution",
    icon: ClipboardList,
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    inactiveBg: "bg-emerald-50",
    inactiveBorder: "border-emerald-200",
    inactiveText: "text-emerald-700",
    shadow: "shadow-emerald-500/25",
  },
  {
    id: "performances",
    label: "Performances",
    description: "Indicateurs et résultats",
    icon: BarChart3,
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    inactiveBg: "bg-amber-50",
    inactiveBorder: "border-amber-200",
    inactiveText: "text-amber-700",
    shadow: "shadow-amber-500/25",
  },
];

const TAB_PANEL_STYLES: Record<
  TabId,
  { border: string; headerGradient: string; ring: string }
> = {
  "generer-projet": {
    border: "border-violet-200/60",
    headerGradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/5",
    ring: "ring-violet-500/20",
  },
  "activites-responsables": {
    border: "border-sky-200/60",
    headerGradient: "from-sky-500/10 via-cyan-500/5 to-teal-500/5",
    ring: "ring-sky-500/20",
  },
  "mise-en-oeuvre": {
    border: "border-emerald-200/60",
    headerGradient: "from-emerald-500/10 via-green-500/5 to-teal-500/5",
    ring: "ring-emerald-500/20",
  },
  performances: {
    border: "border-amber-200/60",
    headerGradient: "from-amber-500/10 via-orange-500/5 to-rose-500/5",
    ring: "ring-amber-500/20",
  },
};

type Props = {
  initialProjects: ProjetPonctuelListItem[];
};

export default function ProjetsPonctuelsTabsClient({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeTab, setActiveTab] = useState<TabId>("generer-projet");
  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;
  const panelStyles = TAB_PANEL_STYLES[activeTab];

  return (
    <div className="min-h-full -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <section className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_45%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Communication
              </span>
              <Badge className="border-0 bg-white/20 text-white hover:bg-white/25">
                Projets ponctuels
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Projets ponctuels
            </h1>
            <p className="max-w-2xl text-sm text-white/90 sm:text-base">
              Générez, planifiez et suivez vos projets ponctuels — activités,
              responsables, mise en œuvre et performances.
            </p>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
        <div
          className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 top-32 h-56 w-56 rounded-full bg-fuchsia-300/15 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-5 sm:space-y-6">
          <div className="md:hidden">
            <label
              htmlFor="projets-ponctuels-tab-select"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Section active
            </label>
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
              <SelectTrigger
                id="projets-ponctuels-tab-select"
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

          <nav className="hidden md:block" aria-label="Sections des projets ponctuels">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-slate-50 to-transparent lg:hidden" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-slate-50 to-transparent lg:hidden" />
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:overflow-visible">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex min-w-[10rem] shrink-0 snap-start flex-col gap-1 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 lg:min-w-0",
                        isActive
                          ? cn(
                              "border-transparent bg-gradient-to-br text-white shadow-lg",
                              tab.gradient,
                              tab.shadow
                            )
                          : cn(
                              "border bg-white hover:-translate-y-0.5 hover:shadow-md",
                              tab.inactiveBorder,
                              tab.inactiveBg
                            )
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                            isActive ? "bg-white/20" : cn(tab.inactiveBg, tab.inactiveText)
                          )}
                        >
                          <Icon className={cn("h-4 w-4", isActive ? "text-white" : "")} />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold leading-tight",
                            isActive ? "text-white" : tab.inactiveText
                          )}
                        >
                          {tab.label}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "pl-11 text-xs leading-snug",
                          isActive ? "text-white/80" : "text-slate-500"
                        )}
                      >
                        {tab.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          <article
            className={cn(
              "overflow-hidden rounded-2xl border bg-white shadow-lg shadow-slate-200/40 ring-1",
              panelStyles.border,
              panelStyles.ring
            )}
          >
            <header
              className={cn(
                "flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5",
                panelStyles.headerGradient
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md sm:h-12 sm:w-12 sm:rounded-2xl",
                    activeTabConfig.gradient
                  )}
                >
                  <activeTabConfig.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    {activeTabConfig.label}
                  </h2>
                  <p className="text-sm text-slate-600">{activeTabConfig.description}</p>
                </div>
              </div>
              <div className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 sm:flex">
                <FolderKanban className="h-4 w-4" />
                <span>Projets ponctuels</span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <span className="text-slate-700">{activeTabConfig.label}</span>
              </div>
            </header>

            <div className="min-h-[min(60vh,520px)] bg-gradient-to-b from-white to-slate-50/40">
              {activeTab === "generer-projet" && (
                <div className="animate-in fade-in duration-300">
                  <GenererProjetPanel
                    initialProjects={projects}
                    onProjectCreated={(project) =>
                      setProjects((prev) => [project, ...prev])
                    }
                  />
                </div>
              )}
              {activeTab === "activites-responsables" && (
                <div className="animate-in fade-in duration-300">
                  <ActivitesResponsablesPanel
                    projects={projects}
                    onProjectUpdated={(project) =>
                      setProjects((prev) =>
                        prev.map((p) => (p.id === project.id ? project : p))
                      )
                    }
                  />
                </div>
              )}
              {activeTab === "mise-en-oeuvre" && (
                <div className="animate-in fade-in duration-300">
                  <MiseEnOeuvrePonctuelPanel
                    projects={projects}
                    onProjectUpdated={(project) =>
                      setProjects((prev) =>
                        prev.map((p) => (p.id === project.id ? project : p))
                      )
                    }
                  />
                </div>
              )}
              {activeTab === "performances" && (
                <div className="animate-in fade-in duration-300">
                  <PerformancesPonctuelPanel projects={projects} />
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
