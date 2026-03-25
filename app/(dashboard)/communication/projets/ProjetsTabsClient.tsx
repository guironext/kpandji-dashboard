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
import { Plus, ClipboardList, Users, Calculator, FileText, Sparkles, FolderKanban } from "lucide-react";

type TabId = "creer-projet" | "plan-action" | "auteurs-roles" | "budget" | "resume-projet";

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
    shadow: "shadow-sky-500/30",
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
    shadow: "shadow-emerald-500/30",
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
    shadow: "shadow-violet-500/30",
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
    shadow: "shadow-amber-500/30",
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
    shadow: "shadow-rose-500/30",
  },
];

const TAB_PANEL_STYLES: Record<
  TabId,
  { border: string; headerGradient: string; accentGlow: string; leftBorder: string }
> = {
  "creer-projet": {
    border: "border-sky-200/80",
    headerGradient: "from-sky-500/20 via-cyan-500/15 to-teal-500/10",
    accentGlow: "shadow-[0_0_40px_-10px_rgba(14,165,233,0.4)]",
    leftBorder: "border-l-4 border-l-sky-500",
  },
  "plan-action": {
    border: "border-emerald-200/80",
    headerGradient: "from-emerald-500/20 via-green-500/15 to-teal-500/10",
    accentGlow: "shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]",
    leftBorder: "border-l-4 border-l-emerald-500",
  },
  "auteurs-roles": {
    border: "border-violet-200/80",
    headerGradient: "from-violet-500/20 via-purple-500/15 to-fuchsia-500/10",
    accentGlow: "shadow-[0_0_40px_-10px_rgba(139,92,246,0.4)]",
    leftBorder: "border-l-4 border-l-violet-500",
  },
  budget: {
    border: "border-amber-200/80",
    headerGradient: "from-amber-500/20 via-orange-500/15 to-amber-600/10",
    accentGlow: "shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]",
    leftBorder: "border-l-4 border-l-amber-500",
  },
  "resume-projet": {
    border: "border-rose-200/80",
    headerGradient: "from-rose-500/20 via-pink-500/15 to-fuchsia-500/10",
    accentGlow: "shadow-[0_0_40px_-10px_rgba(244,63,94,0.4)]",
    leftBorder: "border-l-4 border-l-rose-500",
  },
};

type Props = {
  projects: CommunicationProjectListItem[];
  initialPlanActions: PlanActionItem[];
  initialBudgetItems: CommunicationBudgetItem[];
  budgetError: string | null;
};

export default function ProjetsTabsClient({
  projects,
  initialPlanActions,
  initialBudgetItems,
  budgetError,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("creer-projet");
  const firstProjectId = projects[0]?.id ?? null;
  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;
  const panelStyles = TAB_PANEL_STYLES[activeTab];

  return (
    <div className="min-h-full">
      {/* Vibrant gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-400/25 blur-[100px]" />
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-400/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-400/20 blur-[80px]" />
        <div className="absolute right-1/3 top-2/3 h-64 w-64 rounded-full bg-emerald-400/15 blur-[70px]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 rounded-full bg-rose-400/10 blur-[90px]" />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(120,119,198,0.12),transparent_50%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.95)_50%,rgba(241,245,249,0.98)_100%)]"
          aria-hidden
        />
      </div>

      <div className="relative">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Colorful hero header */}
          <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-violet-500/10 via-sky-500/10 to-amber-500/10 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm sm:p-8">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139,92,246,0.3) 0%, transparent 40%),
                  radial-gradient(circle at 80% 50%, rgba(14,165,233,0.25) 0%, transparent 40%),
                  radial-gradient(circle at 50% 100%, rgba(251,191,36,0.2) 0%, transparent 40%)`,
              }}
              aria-hidden
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/40">
                  <FolderKanban className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-200/60">
                      <Sparkles className="h-3.5 w-3.5" />
                      Projets de communication
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {projects.length} projet{projects.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                    Gestion des projets
                  </h1>
                  <p className="mt-1.5 max-w-xl text-sm text-slate-600 sm:text-base">
                    Créez, planifiez et pilotez vos projets en un seul endroit — diagnostic, objectifs, budget et équipes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Colorful tab bar */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-xl px-5 py-3.5 text-base font-semibold transition-all duration-300",
                      isActive
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg ${tab.shadow} scale-[1.02]`
                        : cn(
                            tab.inactiveBg,
                            tab.inactiveBorder,
                            tab.inactiveText,
                            "border hover:scale-[1.02] hover:shadow-md"
                          )
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-white" : "opacity-80"
                      )}
                    />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content panel with tab-specific styling */}
          <div
            key={activeTab}
            className={cn(
              "overflow-hidden rounded-2xl border-2 bg-white shadow-2xl",
              panelStyles.border,
              panelStyles.accentGlow,
              panelStyles.leftBorder
            )}
          >
            {/* Tab header strip */}
            <div
              className={cn(
                "border-b border-slate-100 bg-gradient-to-r px-6 py-5",
                panelStyles.headerGradient
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r text-white shadow-lg",
                    activeTabConfig.gradient
                  )}
                >
                  <activeTabConfig.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {activeTabConfig.label}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {activeTabConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab content */}
            <div className="min-h-[480px] bg-gradient-to-b from-white to-slate-50/30">
              {activeTab === "creer-projet" && (
                <div className="animate-in fade-in duration-300">
                  <ProjetsClient initialProjects={projects} embedded />
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
                    projects={projects.map((p) => ({
                      id: p.id,
                      name: p.name,
                      projectStatus: p.projectStatus,
                    }))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
