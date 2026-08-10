"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Briefcase,
  Target,
  ClipboardList,
  ListChecks,
  ChevronRight,
  Repeat,
  ArrowRight,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CreerRoleMissionPanel from "./CreerRoleMissionPanel";
import ObjectifsMensuelsPanel from "./ObjectifsMensuelsPanel";
import DefinirActivitePanel from "./DefinirActivitePanel";
import DefinirTachesPanel from "./DefinirTachesPanel";
import type {
  RoleMissionProjetRoutineListItem,
  UserForRoleMissionOption,
} from "@/lib/actions/role-mission-projet-routine";
import type { IndicateurObjectifMensuelListItem } from "@/lib/actions/indicateur-objectif-mensuel-projet-routine";
import type { ActiviteProjetRoutineListItem } from "@/lib/actions/activite-projet-routine";
import type { TacheActiviteProjetRoutineListItem } from "@/lib/actions/tache-activite-projet-routine";

type TabId =
  | "creer-role-mission"
  | "objectifs-mensuels"
  | "definir-activite"
  | "definir-taches";

type TabConfig = {
  id: TabId;
  step: number;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  inactiveIcon: string;
  shadow: string;
  emptyTitle: string;
  emptyDescription: string;
};

const TABS: TabConfig[] = [
  {
    id: "creer-role-mission",
    step: 1,
    label: "Créer Role et mission",
    shortLabel: "Rôles",
    description: "Définir les rôles et missions récurrents",
    icon: Briefcase,
    gradient: "from-indigo-500 via-blue-500 to-cyan-600",
    inactiveBg: "bg-indigo-50/90",
    inactiveBorder: "border-indigo-200/80",
    inactiveText: "text-indigo-800",
    inactiveIcon: "bg-indigo-100 text-indigo-600",
    shadow: "shadow-indigo-500/25",
    emptyTitle: "Aucun rôle défini",
    emptyDescription:
      "Commencez par créer les rôles et missions qui structurent vos activités routinières.",
  },
  {
    id: "objectifs-mensuels",
    step: 2,
    label: "Objectifs Mensuels",
    shortLabel: "Objectifs",
    description: "Indicateurs et objectifs du mois",
    icon: Target,
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    inactiveBg: "bg-emerald-50/90",
    inactiveBorder: "border-emerald-200/80",
    inactiveText: "text-emerald-800",
    inactiveIcon: "bg-emerald-100 text-emerald-600",
    shadow: "shadow-emerald-500/25",
    emptyTitle: "Aucun objectif mensuel",
    emptyDescription:
      "Associez des indicateurs et objectifs mensuels à chaque rôle pour mesurer la performance.",
  },
  {
    id: "definir-activite",
    step: 3,
    label: "Definir Activité",
    shortLabel: "Activités",
    description: "Planifier les activités routinières",
    icon: ClipboardList,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    inactiveBg: "bg-violet-50/90",
    inactiveBorder: "border-violet-200/80",
    inactiveText: "text-violet-800",
    inactiveIcon: "bg-violet-100 text-violet-600",
    shadow: "shadow-violet-500/25",
    emptyTitle: "Aucune activité planifiée",
    emptyDescription:
      "Planifiez les activités récurrentes liées à vos rôles et objectifs mensuels.",
  },
  {
    id: "definir-taches",
    step: 4,
    label: "Defenir Taches",
    shortLabel: "Tâches",
    description: "Détailler les tâches par activité",
    icon: ListChecks,
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    inactiveBg: "bg-amber-50/90",
    inactiveBorder: "border-amber-200/80",
    inactiveText: "text-amber-900",
    inactiveIcon: "bg-amber-100 text-amber-700",
    shadow: "shadow-amber-500/25",
    emptyTitle: "Aucune tâche définie",
    emptyDescription:
      "Décomposez chaque activité en tâches concrètes et assignez-les aux responsables.",
  },
];

const TAB_PANEL_STYLES: Record<
  TabId,
  { border: string; headerGradient: string; ring: string; accent: string }
> = {
  "creer-role-mission": {
    border: "border-indigo-200/60",
    headerGradient: "from-indigo-500/10 via-blue-500/5 to-cyan-500/5",
    ring: "ring-indigo-500/15",
    accent: "border-indigo-200 bg-indigo-50/50",
  },
  "objectifs-mensuels": {
    border: "border-emerald-200/60",
    headerGradient: "from-emerald-500/10 via-green-500/5 to-teal-500/5",
    ring: "ring-emerald-500/15",
    accent: "border-emerald-200 bg-emerald-50/50",
  },
  "definir-activite": {
    border: "border-violet-200/60",
    headerGradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/5",
    ring: "ring-violet-500/15",
    accent: "border-violet-200 bg-violet-50/50",
  },
  "definir-taches": {
    border: "border-amber-200/60",
    headerGradient: "from-amber-500/10 via-orange-500/5 to-rose-500/5",
    ring: "ring-amber-500/15",
    accent: "border-amber-200 bg-amber-50/50",
  },
};

function WorkflowStepper({
  activeStep,
  onStepClick,
  compact = false,
}: {
  activeStep: number;
  onStepClick: (tabId: TabId) => void;
  compact?: boolean;
}) {
  return (
    <ol
      className={cn(
        "flex items-center",
        compact ? "justify-between gap-1" : "gap-0"
      )}
      aria-label="Étapes du workflow"
    >
      {TABS.map((tab, index) => {
        const isActive = tab.step === activeStep;
        const isPast = tab.step < activeStep;
        const Icon = tab.icon;

        return (
          <li key={tab.id} className="flex min-w-0 flex-1 items-center">
            <button
              type="button"
              onClick={() => onStepClick(tab.id)}
              aria-current={isActive ? "step" : undefined}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 px-0.5 transition-all"
            >
              <span
                className={cn(
                  "flex items-center justify-center rounded-full font-bold transition-all duration-200",
                  compact ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs sm:h-10 sm:w-10 sm:text-sm",
                  isActive
                    ? cn("bg-gradient-to-br text-white shadow-md", tab.gradient, tab.shadow)
                    : isPast
                      ? "bg-teal-100 text-teal-700 ring-2 ring-teal-200"
                      : "bg-white text-slate-400 ring-1 ring-slate-200"
                )}
              >
                {isPast && !isActive ? (
                  <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                ) : (
                  tab.step
                )}
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-center font-medium leading-tight",
                  compact ? "text-[10px]" : "text-[11px] sm:text-xs",
                  isActive ? tab.inactiveText : isPast ? "text-teal-700" : "text-slate-400"
                )}
              >
                {tab.shortLabel}
              </span>
            </button>
            {index < TABS.length - 1 && (
              <div
                className={cn(
                  "mx-0.5 h-0.5 flex-1 rounded-full transition-colors",
                  compact ? "mb-5 min-w-[0.5rem]" : "mb-6 min-w-[0.75rem] sm:mx-1",
                  tab.step < activeStep ? "bg-teal-300" : "bg-slate-200"
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function TabEmptyState({ tab }: { tab: TabConfig }) {
  const Icon = tab.icon;

  return (
    <div
      className={cn(
        "mx-4 mb-4 mt-2 flex flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-12 text-center sm:mx-6 sm:px-8 sm:py-16",
        TAB_PANEL_STYLES[tab.id].accent
      )}
    >
      <div
        className={cn(
          "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg sm:h-[4.5rem] sm:w-[4.5rem]",
          tab.gradient,
          tab.shadow
        )}
      >
        <Icon className="h-8 w-8 sm:h-9 sm:w-9" />
      </div>
      <p className="text-base font-semibold text-slate-900 sm:text-lg">{tab.emptyTitle}</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        {tab.emptyDescription}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Badge variant="outline" className="rounded-full border-slate-200 bg-white/80 text-slate-600">
          Étape {tab.step} sur {TABS.length}
        </Badge>
        {tab.step < TABS.length && (
          <Badge variant="outline" className="rounded-full border-slate-200 bg-white/80 text-slate-500">
            Suivant : {TABS[tab.step]?.shortLabel}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function ActivitesRoutineesTabsClient({
  initialRoles,
  initialObjectifs,
  initialActivites,
  initialTaches,
  users,
  loadError,
}: {
  initialRoles: RoleMissionProjetRoutineListItem[];
  initialObjectifs: IndicateurObjectifMensuelListItem[];
  initialActivites: ActiviteProjetRoutineListItem[];
  initialTaches: TacheActiviteProjetRoutineListItem[];
  users: UserForRoleMissionOption[];
  loadError?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("creer-role-mission");
  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;
  const panelStyles = TAB_PANEL_STYLES[activeTab];
  const activeStep = activeTabConfig.step;
  const rolesCount = initialRoles.length;
  const objectifsCount = initialObjectifs.length;
  const activitesCount = initialActivites.length;
  const tachesCount = initialTaches.length;

  return (
    <div className="min-h-full -mx-4 -mt-4 bg-slate-50/80 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-teal-600 via-cyan-600 to-indigo-700 px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.18),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-300/25 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-[120%] -translate-x-1/2 bg-[linear-gradient(to_top,rgba(15,23,42,0.08),transparent)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-sm ring-1 ring-white/25">
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  Communication
                </span>
                <Badge className="border-0 bg-white/20 text-white hover:bg-white/25">
                  Workflow récurrent
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Activités routinières
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
                De la définition des rôles aux tâches opérationnelles — pilotez votre cycle
                mensuel en quatre étapes claires.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:max-w-md lg:shrink-0">
              {[
                { label: "Rôles", value: rolesCount, icon: Layers },
                { label: "Objectifs", value: objectifsCount, icon: Target },
                { label: "Activités", value: activitesCount, icon: ClipboardList },
                { label: "Tâches", value: tachesCount, icon: ListChecks },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 px-3.5 py-3 backdrop-blur-md ring-1 ring-white/20"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <StatIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-100/80">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div
          className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-indigo-200/20 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-4 sm:space-y-6">
          {/* Mobile: workflow stepper + 2×2 tab grid */}
          <div className="space-y-3 md:hidden">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-4 shadow-sm backdrop-blur-sm ring-1 ring-slate-100">
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Parcours en 4 étapes
              </p>
              <WorkflowStepper
                activeStep={activeStep}
                onStepClick={setActiveTab}
                compact
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
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
                      "group relative flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98]",
                      isActive
                        ? cn(
                            "border-transparent bg-gradient-to-br text-white shadow-lg",
                            tab.gradient,
                            tab.shadow
                          )
                        : cn(
                            "border bg-white shadow-sm hover:shadow-md",
                            tab.inactiveBorder,
                            tab.inactiveBg
                          )
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        isActive ? "bg-white/20 text-white/90" : "bg-white/80 text-slate-500"
                      )}
                    >
                      Étape {tab.step}
                    </span>
                    <div className="flex w-full items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          isActive ? "bg-white/20" : tab.inactiveIcon
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold leading-tight",
                            isActive ? "text-white" : tab.inactiveText
                          )}
                        >
                          {tab.shortLabel}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 line-clamp-2 text-[11px] leading-snug",
                            isActive ? "text-white/75" : "text-slate-500"
                          )}
                        >
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tablet: horizontal scroll tabs */}
          <nav
            className="hidden md:block lg:hidden"
            aria-label="Sections des activités routinières"
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-slate-50/95 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-slate-50/95 to-transparent" />
              <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                        "group flex min-w-[11.5rem] shrink-0 snap-start items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
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
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm",
                          isActive ? "bg-white/20 text-white" : tab.inactiveIcon
                        )}
                      >
                        {isActive ? <Icon className="h-4 w-4" /> : tab.step}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold",
                            isActive ? "text-white" : tab.inactiveText
                          )}
                        >
                          {tab.label}
                        </p>
                        <p
                          className={cn(
                            "truncate text-xs",
                            isActive ? "text-white/80" : "text-slate-500"
                          )}
                        >
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Desktop: full tab row + workflow connector */}
          <div className="hidden space-y-3 lg:block">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-5 shadow-sm backdrop-blur-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Parcours de configuration
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Rôles</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Objectifs</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Activités</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>Tâches</span>
                </div>
              </div>
              <WorkflowStepper activeStep={activeStep} onStepClick={setActiveTab} />
            </div>

            <nav aria-label="Sections des activités routinières">
              <div className="grid grid-cols-4 gap-3">
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
                        "group relative flex flex-col gap-2.5 rounded-2xl border px-4 py-4 text-left transition-all duration-200",
                        isActive
                          ? cn(
                              "border-transparent bg-gradient-to-br text-white shadow-lg",
                              tab.gradient,
                              tab.shadow,
                              "-translate-y-0.5"
                            )
                          : cn(
                              "border bg-white hover:-translate-y-0.5 hover:shadow-md",
                              tab.inactiveBorder,
                              tab.inactiveBg
                            )
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          isActive ? "bg-white/20 text-white/90" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        Étape {tab.step}
                      </span>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                            isActive ? "bg-white/20" : tab.inactiveIcon
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-sm font-semibold leading-tight",
                              isActive ? "text-white" : tab.inactiveText
                            )}
                          >
                            {tab.label}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 text-xs leading-snug",
                              isActive ? "text-white/80" : "text-slate-500"
                            )}
                          >
                            {tab.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Panel */}
          <article
            className={cn(
              "overflow-hidden rounded-2xl border bg-white/95 shadow-lg shadow-slate-200/50 ring-1 backdrop-blur-sm",
              panelStyles.border,
              panelStyles.ring
            )}
          >
            <header
              className={cn(
                "border-b border-slate-100 bg-gradient-to-r px-4 py-4 sm:px-6 sm:py-5",
                panelStyles.headerGradient
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md sm:h-12 sm:w-12 sm:rounded-2xl",
                      activeTabConfig.gradient
                    )}
                  >
                    <activeTabConfig.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full text-[11px] font-semibold",
                          panelStyles.accent
                        )}
                      >
                        Étape {activeTabConfig.step}/{TABS.length}
                      </Badge>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                      {activeTabConfig.label}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {activeTabConfig.description}
                    </p>
                  </div>
                </div>

                {/* Breadcrumb — visible on all sizes, wraps on mobile */}
                <nav
                  aria-label="Fil d'Ariane"
                  className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-slate-500 sm:text-sm"
                >
                  <Repeat className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                  <span className="truncate">Activités routinières</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <span className="truncate text-slate-700">{activeTabConfig.shortLabel}</span>
                </nav>
              </div>
            </header>

            <div className="min-h-[min(50vh,480px)] bg-gradient-to-b from-white to-slate-50/60 sm:min-h-[min(55vh,520px)]">
              <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "creer-role-mission" ? (
                  <>
                    {loadError && (
                      <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-6">
                        {loadError}
                      </div>
                    )}
                    <CreerRoleMissionPanel initialRoles={initialRoles} users={users} />
                  </>
                ) : activeTab === "objectifs-mensuels" ? (
                  <>
                    {loadError && (
                      <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-6">
                        {loadError}
                      </div>
                    )}
                    <ObjectifsMensuelsPanel
                      initialObjectifs={initialObjectifs}
                      roles={initialRoles}
                    />
                  </>
                ) : activeTab === "definir-activite" ? (
                  <>
                    {loadError && (
                      <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-6">
                        {loadError}
                      </div>
                    )}
                    <DefinirActivitePanel
                      initialActivites={initialActivites}
                      roles={initialRoles}
                    />
                  </>
                ) : activeTab === "definir-taches" ? (
                  <>
                    {loadError && (
                      <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-6">
                        {loadError}
                      </div>
                    )}
                    <DefinirTachesPanel
                      initialTaches={initialTaches}
                      activites={initialActivites}
                      users={users}
                    />
                  </>
                ) : (
                  <TabEmptyState tab={activeTabConfig} />
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
