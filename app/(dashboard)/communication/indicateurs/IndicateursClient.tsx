"use client";

import { useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  CalendarRange,
  ClipboardList,
  FolderKanban,
  Layers,
  ListChecks,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCommunicationIndicateurs,
  type CommunicationIndicateursData,
  type IndicateurPerson,
} from "@/lib/actions/communication-indicateurs";
import {
  ACTIVITE_STATUT_COLUMNS,
  getActiviteStatutConfig,
} from "@/lib/projet-ponctuel-activite-statut";
import {
  TACHE_STATUT_COLUMNS,
  getTacheStatutConfig,
} from "@/lib/tache-activite-projet-routine-statut";

type Props = {
  initialData: CommunicationIndicateursData;
  initialError: string | null;
};

type BoardColumn = {
  value: string;
  label: string;
  shortLabel?: string;
  headerClass: string;
  dotClass: string;
  badgeClass?: string;
};

const PROJET_STATUT_COLUMNS: BoardColumn[] = [
  {
    value: "EN_ATTENTE",
    label: "En attente",
    shortLabel: "Attente",
    headerClass: "from-slate-500/15 to-slate-400/5 border-slate-200",
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    value: "EN_COURS",
    label: "En cours",
    shortLabel: "Cours",
    headerClass: "from-sky-500/15 to-cyan-500/5 border-sky-200",
    dotClass: "bg-sky-500",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
  {
    value: "TERMINEE",
    label: "Terminée",
    shortLabel: "Terminée",
    headerClass: "from-emerald-500/15 to-teal-500/5 border-emerald-200",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "ANNULE",
    label: "Annulée",
    shortLabel: "Annulée",
    headerClass: "from-rose-500/15 to-pink-500/5 border-rose-200",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
];

const SANS_RESPONSABLE_KEY = "__none__";

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy");
}

function initials(person: IndicateurPerson | null | undefined, fallback = "?") {
  if (!person) return fallback;
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

function personKey(person: IndicateurPerson | null | undefined) {
  return person?.userId ?? SANS_RESPONSABLE_KEY;
}

function personLabel(person: IndicateurPerson | null | undefined) {
  return person?.fullName ?? "Sans responsable";
}

type ResponsableGroup<T> = {
  key: string;
  person: IndicateurPerson | null;
  items: T[];
};

function groupByResponsable<T>(
  items: T[],
  getResponsables: (item: T) => IndicateurPerson[]
): ResponsableGroup<T>[] {
  const map = new Map<string, ResponsableGroup<T>>();

  for (const item of items) {
    const responsables = getResponsables(item);
    const targets =
      responsables.length > 0
        ? responsables
        : ([null] as Array<IndicateurPerson | null>);

    for (const person of targets) {
      const key = personKey(person);
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(key, { key, person, items: [item] });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.key === SANS_RESPONSABLE_KEY) return 1;
    if (b.key === SANS_RESPONSABLE_KEY) return -1;
    return personLabel(a.person).localeCompare(personLabel(b.person), "fr");
  });
}

function ResponsableChip({
  person,
  compact = false,
}: {
  person: IndicateurPerson | null;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/80 bg-white font-medium text-slate-700",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
          compact ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[9px]",
          person
            ? "bg-gradient-to-br from-slate-600 to-slate-800"
            : "bg-slate-300 text-slate-600"
        )}
      >
        {initials(person, "—")}
      </span>
      <span className="truncate">{personLabel(person)}</span>
    </div>
  );
}

function ItemCard({
  title,
  subtitle,
  dateDebut,
  dateCloture,
  badge,
  responsables,
  accent,
}: {
  title: string;
  subtitle?: string;
  dateDebut: string;
  dateCloture: string | null;
  badge: ReactNode;
  responsables: IndicateurPerson[];
  accent: "amber" | "teal";
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-3.5 shadow-sm transition-all active:scale-[0.99] hover:shadow-md",
        accent === "amber"
          ? "border-amber-100/90 hover:border-amber-200"
          : "border-teal-100/90 hover:border-teal-200"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
          {title}
        </h4>
        <div className="shrink-0">{badge}</div>
      </div>
      {subtitle && (
        <p className="mb-2 line-clamp-2 text-xs font-medium text-slate-500">
          {subtitle}
        </p>
      )}
      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
        <CalendarRange className="h-3 w-3 shrink-0" />
        <span className="tabular-nums">
          {formatDate(dateDebut)} → {formatDate(dateCloture)}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {responsables.length > 0 ? (
          responsables.map((person) => (
            <ResponsableChip key={person.userId} person={person} compact />
          ))
        ) : (
          <ResponsableChip person={null} compact />
        )}
      </div>
    </article>
  );
}

function ColumnContent<T>({
  columnItems,
  groups,
  getProjectKey,
  renderItem,
  emptyLabel = "Aucun élément",
}: {
  columnItems: T[];
  groups: ResponsableGroup<T>[];
  getProjectKey?: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  emptyLabel?: string;
}) {
  if (columnItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center">
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const projectGroups = getProjectKey
          ? (() => {
              const byProject = new Map<string, T[]>();
              for (const item of group.items) {
                const key = getProjectKey(item);
                const list = byProject.get(key) ?? [];
                list.push(item);
                byProject.set(key, list);
              }
              return Array.from(byProject.entries()).sort(([a], [b]) =>
                a.localeCompare(b, "fr")
              );
            })()
          : null;

        return (
          <div
            key={group.key}
            className="space-y-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2.5 shadow-sm"
          >
            <div className="flex items-center gap-2 px-0.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <ResponsableChip person={group.person} />
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
                {group.items.length}
              </span>
            </div>

            {projectGroups
              ? projectGroups.map(([projectName, projectItems]) => (
                  <div key={projectName} className="space-y-2">
                    <div className="flex items-center gap-1.5 px-0.5">
                      <FolderKanban className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate text-[11px] font-semibold text-slate-600">
                        {projectName}
                      </span>
                    </div>
                    {projectItems.map(renderItem)}
                  </div>
                ))
              : group.items.map(renderItem)}
          </div>
        );
      })}
    </div>
  );
}

function StatutBoardSection<T>({
  title,
  description,
  icon: Icon,
  columns,
  items,
  getStatut,
  getResponsables,
  getProjectKey,
  renderItem,
  accent,
}: {
  title: string;
  description: string;
  icon: typeof FolderKanban;
  columns: BoardColumn[];
  items: T[];
  getStatut: (item: T) => string;
  getResponsables: (item: T) => IndicateurPerson[];
  getProjectKey?: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  accent: "amber" | "teal";
}) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const col of columns) map[col.value] = 0;
    for (const item of items) {
      const statut = getStatut(item);
      map[statut] = (map[statut] ?? 0) + 1;
    }
    return map;
  }, [columns, items, getStatut]);

  const defaultStatut = useMemo(() => {
    const withItems = columns.find((col) => (counts[col.value] ?? 0) > 0);
    return withItems?.value ?? columns[0]?.value ?? "";
  }, [columns, counts]);

  const [activeStatut, setActiveStatut] = useState(defaultStatut);

  const resolvedStatut = columns.some((c) => c.value === activeStatut)
    ? activeStatut
    : defaultStatut;

  const activeColumn = columns.find((c) => c.value === resolvedStatut) ?? columns[0];
  const total = items.length;

  const mobileColumnItems = useMemo(
    () => items.filter((item) => getStatut(item) === resolvedStatut),
    [items, getStatut, resolvedStatut]
  );

  const mobileGroups = useMemo(
    () => groupByResponsable(mobileColumnItems, getResponsables),
    [mobileColumnItems, getResponsables]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
            accent === "amber"
              ? "bg-gradient-to-br from-amber-500 to-orange-500"
              : "bg-gradient-to-br from-teal-500 to-cyan-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <Badge
              variant="outline"
              className={cn(
                "border-0 text-xs font-semibold tabular-nums",
                accent === "amber"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-teal-100 text-teal-800"
              )}
            >
              {total}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {/* Mobile / tablet: sticky status chips → single column */}
      <div className="lg:hidden">
        <div
          className={cn(
            "sticky top-16 z-20 -mx-1 rounded-2xl border bg-white/95 p-2 shadow-sm backdrop-blur-md",
            accent === "amber" ? "border-amber-100" : "border-teal-100"
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Filtrer par statut
            </p>
            <span className="text-[11px] tabular-nums text-slate-400">
              {mobileColumnItems.length} / {total}
            </span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {columns.map((col) => {
              const count = counts[col.value] ?? 0;
              const isActive = col.value === resolvedStatut;
              return (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => setActiveStatut(col.value)}
                  className={cn(
                    "inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? accent === "amber"
                        ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200/60"
                        : "border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-200/60"
                      : "border-slate-200 bg-slate-50 text-slate-600 active:bg-slate-100"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isActive ? "bg-white/90" : col.dotClass
                    )}
                  />
                  <span>{col.shortLabel ?? col.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      isActive ? "bg-white/20" : "bg-white text-slate-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
            Aucun élément à afficher.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {activeColumn && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border bg-gradient-to-br px-3 py-2.5",
                  activeColumn.headerClass
                )}
              >
                <span
                  className={cn("h-2.5 w-2.5 rounded-full", activeColumn.dotClass)}
                />
                <span className="text-sm font-semibold text-slate-800">
                  {activeColumn.label}
                </span>
                <Badge
                  variant="outline"
                  className="ml-auto border-slate-200 bg-white/80 text-xs tabular-nums text-slate-600"
                >
                  {mobileColumnItems.length}
                </Badge>
              </div>
            )}
            <ColumnContent
              columnItems={mobileColumnItems}
              groups={mobileGroups}
              getProjectKey={getProjectKey}
              renderItem={renderItem}
              emptyLabel="Aucun élément dans ce statut"
            />
          </div>
        )}
      </div>

      {/* Desktop: kanban board */}
      <div className="hidden lg:block">
        <div
          className={cn(
            "mb-3 flex flex-wrap gap-2 rounded-2xl border bg-white/80 p-3 shadow-sm",
            accent === "amber" ? "border-amber-100" : "border-teal-100"
          )}
        >
          <Badge
            variant="outline"
            className={cn(
              "border-0 px-3 py-1 text-sm font-semibold",
              accent === "amber"
                ? "bg-amber-50 text-amber-800"
                : "bg-teal-50 text-teal-800"
            )}
          >
            {total} au total
          </Badge>
          {columns.map((col) => (
            <div
              key={col.value}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              <span className={cn("h-2 w-2 rounded-full", col.dotClass)} />
              {col.label}
              <span className="tabular-nums text-slate-500">
                {counts[col.value] ?? 0}
              </span>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
            Aucun élément à afficher.
          </div>
        ) : (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300">
              {columns.map((col) => {
                const columnItems = items.filter(
                  (item) => getStatut(item) === col.value
                );
                const groups = groupByResponsable(columnItems, getResponsables);

                return (
                  <div
                    key={col.value}
                    className="flex w-[min(300px,85vw)] shrink-0 snap-start flex-col rounded-2xl border border-slate-200/80 bg-slate-50/50"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-t-2xl border-b bg-gradient-to-br px-3 py-2.5",
                        col.headerClass
                      )}
                    >
                      <span className={cn("h-2.5 w-2.5 rounded-full", col.dotClass)} />
                      <span className="text-sm font-semibold text-slate-800">
                        {col.label}
                      </span>
                      <Badge
                        variant="outline"
                        className="ml-auto border-slate-200 bg-white/80 text-xs tabular-nums text-slate-600"
                      >
                        {columnItems.length}
                      </Badge>
                    </div>

                    <div className="max-h-[70vh] flex-1 space-y-3 overflow-y-auto p-2.5">
                      <ColumnContent
                        columnItems={columnItems}
                        groups={groups}
                        getProjectKey={getProjectKey}
                        renderItem={renderItem}
                        emptyLabel="Vide"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IndicateursClient({
  initialData,
  initialError,
}: Props) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileSection, setMobileSection] = useState<"ponctuels" | "routine">(
    "ponctuels"
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const result = await getCommunicationIndicateurs();
      setData(result.data);
      setError(result.success ? null : result.error);
    } finally {
      setRefreshing(false);
    }
  }

  const kpis = [
    {
      label: "Projets",
      value: data.projetsPonctuels.length,
      icon: Layers,
      tone: "amber" as const,
    },
    {
      label: "Act. ponctuelles",
      value: data.activitesPonctuelles.length,
      icon: ClipboardList,
      tone: "amber" as const,
    },
    {
      label: "Act. routine",
      value: data.activitesRoutine.length,
      icon: ListChecks,
      tone: "teal" as const,
    },
    {
      label: "Tâches",
      value: data.tachesRoutine.length,
      icon: User,
      tone: "teal" as const,
    },
  ];

  const projetsBoard = (
    <StatutBoardSection
      title="Projets"
      description="Projets ponctuels par statut et responsable"
      icon={Layers}
      columns={PROJET_STATUT_COLUMNS}
      items={data.projetsPonctuels}
      getStatut={(item) => item.statutProjet}
      getResponsables={(item) => item.responsables}
      accent="amber"
      renderItem={(item) => {
        const config = PROJET_STATUT_COLUMNS.find(
          (c) => c.value === item.statutProjet
        );
        return (
          <ItemCard
            key={item.id}
            title={item.titre}
            dateDebut={item.dateDebut}
            dateCloture={item.dateCloture}
            accent="amber"
            responsables={item.responsables}
            badge={
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 border text-[10px]",
                  config?.badgeClass
                )}
              >
                {config?.shortLabel ?? config?.label ?? item.statutProjet}
              </Badge>
            }
          />
        );
      }}
    />
  );

  const activitesPonctuellesBoard = (
    <StatutBoardSection
      title="Activités"
      description="Activités ponctuelles par statut, responsable et projet"
      icon={ClipboardList}
      columns={ACTIVITE_STATUT_COLUMNS.map((c) => ({
        value: c.value,
        label: c.label,
        shortLabel: c.shortLabel,
        headerClass: c.headerClass,
        dotClass: c.dotClass,
      }))}
      items={data.activitesPonctuelles}
      getStatut={(item) => item.statutActivite}
      getResponsables={(item) => item.responsables}
      getProjectKey={(item) => item.projetTitre}
      accent="amber"
      renderItem={(item) => {
        const config = getActiviteStatutConfig(item.statutActivite);
        return (
          <ItemCard
            key={item.id}
            title={item.titre}
            subtitle={item.projetTitre}
            dateDebut={item.dateDebut}
            dateCloture={item.dateCloture}
            accent="amber"
            responsables={item.responsables}
            badge={
              <Badge
                variant="outline"
                className="shrink-0 border-slate-200 text-[10px] text-slate-600"
              >
                {config.shortLabel}
              </Badge>
            }
          />
        );
      }}
    />
  );

  const activitesRoutineBoard = (
    <StatutBoardSection
      title="Activités de routine"
      description="Activités de routine par statut et responsable"
      icon={ClipboardList}
      columns={ACTIVITE_STATUT_COLUMNS.map((c) => ({
        value: c.value,
        label: c.label,
        shortLabel: c.shortLabel,
        headerClass: c.headerClass,
        dotClass: c.dotClass,
      }))}
      items={data.activitesRoutine}
      getStatut={(item) => item.statutActivite}
      getResponsables={(item) =>
        item.responsable ? [item.responsable] : []
      }
      accent="teal"
      renderItem={(item) => {
        const config = getActiviteStatutConfig(item.statutActivite);
        return (
          <ItemCard
            key={item.id}
            title={item.libelle}
            subtitle={item.roleMissionLibelle}
            dateDebut={item.dateDebut}
            dateCloture={item.dateCloture}
            accent="teal"
            responsables={item.responsable ? [item.responsable] : []}
            badge={
              <Badge
                variant="outline"
                className="shrink-0 border-slate-200 text-[10px] text-slate-600"
              >
                {config.shortLabel}
              </Badge>
            }
          />
        );
      }}
    />
  );

  const tachesRoutineBoard = (
    <StatutBoardSection
      title="Tâches de routine"
      description="Tâches par statut, responsable et activité"
      icon={User}
      columns={TACHE_STATUT_COLUMNS.map((c) => ({
        value: c.value,
        label: c.label,
        shortLabel: c.shortLabel,
        headerClass: c.headerClass,
        dotClass: c.dotClass,
      }))}
      items={data.tachesRoutine}
      getStatut={(item) => item.statutTache}
      getResponsables={(item) => item.responsables}
      getProjectKey={(item) =>
        `${item.roleMissionLibelle} · ${item.activiteLibelle}`
      }
      accent="teal"
      renderItem={(item) => {
        const config = getTacheStatutConfig(item.statutTache);
        return (
          <ItemCard
            key={item.id}
            title={item.libelle}
            subtitle={`${item.roleMissionLibelle} · ${item.activiteLibelle}`}
            dateDebut={item.dateDebut}
            dateCloture={item.dateCloture}
            accent="teal"
            responsables={item.responsables}
            badge={
              <Badge
                variant="outline"
                className="shrink-0 border-slate-200 text-[10px] text-slate-600"
              >
                {config.shortLabel}
              </Badge>
            }
          />
        );
      }}
    />
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 px-3 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 p-4 shadow-sm sm:p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-teal-200/25 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Communication
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Indicateurs
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              Vue d&apos;ensemble des projets ponctuels et des activités de
              routine, organisée par statut et responsable.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-11 w-full shrink-0 rounded-xl border-slate-200 bg-white sm:h-10 sm:w-auto"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
            />
            Actualiser
          </Button>
        </div>

        <div className="relative mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className={cn(
                  "rounded-2xl border bg-white/90 p-3 shadow-sm sm:p-3.5",
                  kpi.tone === "amber"
                    ? "border-amber-100"
                    : "border-teal-100"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl text-white",
                      kpi.tone === "amber"
                        ? "bg-gradient-to-br from-amber-500 to-orange-500"
                        : "bg-gradient-to-br from-teal-500 to-cyan-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                    {kpi.label}
                  </p>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Mobile section switcher */}
      <div className="lg:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
          <button
            type="button"
            onClick={() => setMobileSection("ponctuels")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
              mobileSection === "ponctuels"
                ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200/50"
                : "text-slate-600 active:bg-white/70"
            )}
          >
            <FolderKanban className="h-4 w-4" />
            <span className="truncate">Ponctuels</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSection("routine")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
              mobileSection === "routine"
                ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-200/50"
                : "text-slate-600 active:bg-white/70"
            )}
          >
            <ListChecks className="h-4 w-4" />
            <span className="truncate">Routine</span>
          </button>
        </div>
      </div>

      {/* —— Projets Ponctuels —— */}
      <section
        className={cn(
          "overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40 shadow-sm ring-1 ring-amber-100/60",
          mobileSection !== "ponctuels" && "hidden lg:block"
        )}
      >
        <div className="border-b border-amber-100/80 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">
                Projets Ponctuels
              </h2>
              <p className="text-sm text-slate-500">
                Projets et activités par statut et responsable
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-3 py-5 sm:space-y-10 sm:px-6 sm:py-6">
          {projetsBoard}
          <div className="border-t border-amber-100/80 pt-6 sm:pt-8">
            {activitesPonctuellesBoard}
          </div>
        </div>
      </section>

      {/* —— Projet de Routine —— */}
      <section
        className={cn(
          "overflow-hidden rounded-3xl border border-teal-200/70 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/40 shadow-sm ring-1 ring-teal-100/60",
          mobileSection !== "routine" && "hidden lg:block"
        )}
      >
        <div className="border-b border-teal-100/80 bg-gradient-to-r from-teal-500/10 via-transparent to-cyan-500/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
              <ListChecks className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">
                Projet de Routine
              </h2>
              <p className="text-sm text-slate-500">
                Activités et tâches par statut et responsable
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-3 py-5 sm:space-y-10 sm:px-6 sm:py-6">
          {activitesRoutineBoard}
          <div className="border-t border-teal-100/80 pt-6 sm:pt-8">
            {tachesRoutineBoard}
          </div>
        </div>
      </section>
    </div>
  );
}
