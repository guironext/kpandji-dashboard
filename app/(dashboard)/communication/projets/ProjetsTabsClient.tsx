"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import ProjetsClient from "./ProjetsClient";
import PlanActionClient from "../plan-action/PlanActionClient";
import ActeursRolesClient from "../acteurs-roles/ActeursRolesClient";
import BudgetClient from "../budget/BudgetClient";
import ResumeProjetClient from "../resume-projet/ResumeProjetClient";
import type { CommunicationProjectListItem } from "@/lib/actions/communication-project";
import type { PlanActionItem } from "@/lib/actions/communication-plan-action";
import type { CommunicationBudgetItem } from "@/lib/actions/communication-budget";
import {
  Plus,
  ClipboardList,
  Users,
  Calculator,
  FileText,
  Sparkles,
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

type TabId = "creer-projet" | "plan-action" | "auteurs-roles" | "budget" | "resume-projet";

export type ProjetsWorkspace = "communication" | "infographie";

const WORKSPACE_CONFIG: Record<
  ProjetsWorkspace,
  {
    badge: string;
    title: string;
    description: string;
    heroGradient: string;
    statText: string;
    projectsBasePath: string;
  }
> = {
  communication: {
    badge: "Communication",
    title: "Gestion des projets",
    description:
      "Créez, planifiez et pilotez vos projets — diagnostic, objectifs, budget et équipes.",
    heroGradient: "from-sky-600 via-cyan-600 to-teal-700",
    statText: "text-sky-100/80",
    projectsBasePath: "/communication/projets",
  },
  infographie: {
    badge: "Infographie",
    title: "Gestion des projets",
    description:
      "Créez, planifiez et pilotez vos projets visuels — diagnostic, objectifs, budget et équipes.",
    heroGradient: "from-violet-600 via-fuchsia-600 to-purple-700",
    statText: "text-violet-100/80",
    projectsBasePath: "/infographie/projets",
  },
};

const TABS: {
  id: TabId;
  label: string;
  description: string;
  icon: typeof Plus;
  gradient: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  shadow: string;
}[] = [
  {
    id: "creer-projet",
    label: "Créer Projet",
    description: "Nouveau projet en 6 étapes",
    icon: Plus,
    gradient: "from-sky-500 via-cyan-500 to-teal-500",
    inactiveBg: "bg-sky-50",
    inactiveBorder: "border-sky-200",
    inactiveText: "text-sky-700",
    shadow: "shadow-sky-500/25",
  },
  {
    id: "plan-action",
    label: "Plan d'action",
    description: "Actions et planning",
    icon: ClipboardList,
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    inactiveBg: "bg-emerald-50",
    inactiveBorder: "border-emerald-200",
    inactiveText: "text-emerald-700",
    shadow: "shadow-emerald-500/25",
  },
  {
    id: "auteurs-roles",
    label: "Auteurs et rôle",
    description: "Acteurs et affectations",
    icon: Users,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    inactiveBg: "bg-violet-50",
    inactiveBorder: "border-violet-200",
    inactiveText: "text-violet-700",
    shadow: "shadow-violet-500/25",
  },
  {
    id: "budget",
    label: "Budget",
    description: "Éléments et montants",
    icon: Calculator,
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    inactiveBg: "bg-amber-50",
    inactiveBorder: "border-amber-200",
    inactiveText: "text-amber-700",
    shadow: "shadow-amber-500/25",
  },
  {
    id: "resume-projet",
    label: "Résumé Projet",
    description: "Vue d'ensemble et export",
    icon: FileText,
    gradient: "from-rose-500 via-pink-500 to-fuchsia-600",
    inactiveBg: "bg-rose-50",
    inactiveBorder: "border-rose-200",
    inactiveText: "text-rose-700",
    shadow: "shadow-rose-500/25",
  },
];

const TAB_PANEL_STYLES: Record<
  TabId,
  { border: string; headerGradient: string; ring: string }
> = {
  "creer-projet": {
    border: "border-sky-200/60",
    headerGradient: "from-sky-500/10 via-cyan-500/5 to-teal-500/5",
    ring: "ring-sky-500/20",
  },
  "plan-action": {
    border: "border-emerald-200/60",
    headerGradient: "from-emerald-500/10 via-green-500/5 to-teal-500/5",
    ring: "ring-emerald-500/20",
  },
  "auteurs-roles": {
    border: "border-violet-200/60",
    headerGradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/5",
    ring: "ring-violet-500/20",
  },
  budget: {
    border: "border-amber-200/60",
    headerGradient: "from-amber-500/10 via-orange-500/5 to-amber-600/5",
    ring: "ring-amber-500/20",
  },
  "resume-projet": {
    border: "border-rose-200/60",
    headerGradient: "from-rose-500/10 via-pink-500/5 to-fuchsia-500/5",
    ring: "ring-rose-500/20",
  },
};

type Props = {
  projects: CommunicationProjectListItem[];
  initialPlanActions: PlanActionItem[];
  initialBudgetItems: CommunicationBudgetItem[];
  budgetError: string | null;
  workspace?: ProjetsWorkspace;
};

export default function ProjetsTabsClient({
  projects,
  initialPlanActions,
  initialBudgetItems,
  budgetError,
  workspace = "communication",
}: Props) {
  const config = WORKSPACE_CONFIG[workspace];
  const [activeTab, setActiveTab] = useState<TabId>("creer-projet");
  const firstProjectId = projects[0]?.id ?? null;
  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;
  const panelStyles = TAB_PANEL_STYLES[activeTab];
  const activeCount = projects.filter((p) => p.projectStatus === "ACTIVE").length;

  return (
    <div className="min-h-full -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <section
        className={cn(
          "relative overflow-hidden rounded-b-3xl bg-gradient-to-br px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8",
          config.heroGradient
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_45%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-teal-400/20 blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/20">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  {config.badge}
                </span>
                <Badge className="border-0 bg-white/20 text-white hover:bg-white/25">
                  {projects.length} projet{projects.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {config.title}
              </h1>
              <p className="max-w-2xl text-sm text-white/90 sm:text-base">
                {config.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-md lg:shrink-0">
              {[
                { label: "Total", value: projects.length },
                { label: "Actifs", value: activeCount },
                { label: "Sections", value: TABS.length, wide: true },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm ring-1 ring-white/20",
                    stat.wide && "col-span-2 sm:col-span-1"
                  )}
                >
                  <p className={cn("text-xs font-medium", config.statText)}>{stat.label}</p>
                  <p className="mt-0.5 text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-0">
        <div
          className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-10 top-32 h-56 w-56 rounded-full bg-violet-300/15 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-5 sm:space-y-6">
          <div className="md:hidden">
            <label
              htmlFor="projets-tab-select"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Section active
            </label>
            <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
              <SelectTrigger
                id="projets-tab-select"
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

          <nav className="hidden md:block" aria-label="Sections du projet">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-slate-50 to-transparent lg:hidden" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-slate-50 to-transparent lg:hidden" />
              <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible">
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
                        "group relative flex min-w-[9.5rem] shrink-0 snap-start flex-col gap-1 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 lg:min-w-0 lg:flex-1",
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
                <span>
                  {projects.length} projet{projects.length !== 1 ? "s" : ""} enregistré
                  {projects.length !== 1 ? "s" : ""}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </header>

            <div className="min-h-[min(60vh,520px)] bg-gradient-to-b from-white to-slate-50/40">
              {activeTab === "creer-projet" && (
                <div className="animate-in fade-in duration-300">
                  <ProjetsClient
                    initialProjects={projects}
                    embedded
                    projectsBasePath={config.projectsBasePath}
                  />
                </div>
              )}
              {activeTab === "plan-action" && (
                <div className="animate-in fade-in duration-300">
                  <PlanActionClient
                    projects={projects}
                    initialActions={initialPlanActions}
                    selectedProjectId={firstProjectId}
                    embedded
                  />
                </div>
              )}
              {activeTab === "auteurs-roles" && (
                <div className="animate-in fade-in duration-300">
                  <ActeursRolesClient initialProjects={projects} embedded />
                </div>
              )}
              {activeTab === "budget" && (
                <div className="animate-in fade-in duration-300">
                  <BudgetClient
                    projects={projects}
                    initialItems={initialBudgetItems}
                    selectedProjectId={firstProjectId}
                    error={budgetError}
                    embedded
                  />
                </div>
              )}
              {activeTab === "resume-projet" && (
                <div className="animate-in fade-in duration-300">
                  <ResumeProjetClient
                    embedded
                    projects={projects.map((p) => ({
                      id: p.id,
                      name: p.name,
                      projectStatus: p.projectStatus,
                    }))}
                  />
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
