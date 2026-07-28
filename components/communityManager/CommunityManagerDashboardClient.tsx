"use client";

import { useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  CalendarRange,
  ClipboardList,
  FolderKanban,
  Layers,
  ListChecks,
  RefreshCw,
  TrendingUp,
  User,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCommunityManagerDashboard,
  type CommunityManagerDashboardData,
  type CmDashboardPerson,
} from "@/lib/actions/community-manager-dashboard";
import {
  ACTIVITE_STATUT_COLUMNS,
  getActiviteStatutConfig,
} from "@/lib/projet-ponctuel-activite-statut";
import {
  TACHE_STATUT_COLUMNS,
  getTacheStatutConfig,
} from "@/lib/tache-activite-projet-routine-statut";

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.98)",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow: "0 20px 50px -12px rgb(15 23 42 / 0.18)",
  padding: "12px 16px",
};

const PROJET_STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: "#94a3b8",
  EN_COURS: "#0ea5e9",
  TERMINEE: "#10b981",
  ANNULE: "#f43f5e",
};

const ACTIVITE_STATUS_COLORS: Record<string, string> = {
  NOUVEAU: "#6366f1",
  EN_ATTENTE: "#94a3b8",
  EN_COURS: "#0ea5e9",
  EN_ATTENTE_VALIDATION: "#f59e0b",
  VALIDEE: "#10b981",
  NON_VALIDEE: "#f43f5e",
  TRANSFEREE: "#8b5cf6",
  TERMINEE: "#14b8a6",
  ANNULE: "#cbd5e1",
};

type ChartDatum = {
  key: string;
  label: string;
  value: number;
  color: string;
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/50 px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <BarChart3 className="h-6 w-6 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const visible = payload.filter((p) => p.value > 0);
  if (visible.length === 0) return null;

  return (
    <div style={TOOLTIP_STYLE}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="space-y-2">
        {visible.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-6 text-sm"
          >
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-bold tabular-nums text-slate-900">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div style={TOOLTIP_STYLE}>
      <div className="flex items-center justify-between gap-6 text-sm">
        <span className="flex items-center gap-2 text-slate-700">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.payload.color }}
          />
          {entry.name}
        </span>
        <span className="font-bold tabular-nums text-slate-900">
          {entry.value}
        </span>
      </div>
    </div>
  );
}

function countByStatus<T>(
  items: T[],
  getStatut: (item: T) => string,
  options: Array<{ value: string; label: string }>,
  colors: Record<string, string>
): ChartDatum[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const statut = getStatut(item);
    counts.set(statut, (counts.get(statut) ?? 0) + 1);
  }
  return options
    .map((opt) => ({
      key: opt.value,
      label: opt.label,
      value: counts.get(opt.value) ?? 0,
      color: colors[opt.value] ?? "#94a3b8",
    }))
    .filter((d) => d.value > 0);
}

function buildMonthlyKeys(months: number) {
  const result: {
    monthKey: string;
    monthShort: string;
    start: Date;
    end: Date;
  }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    result.push({
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      monthShort: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
      start,
      end,
    });
  }
  return result;
}

type DashboardRefreshResult = {
  success: boolean;
  data: CommunityManagerDashboardData;
  error?: string;
};

type Props = {
  initialData: CommunityManagerDashboardData;
  initialError: string | null;
  brandLabel?: string;
  refreshAction?: () => Promise<DashboardRefreshResult>;
};

type StatusOption = {
  value: string;
  label: string;
  shortLabel?: string;
  dotClass: string;
  badgeClass?: string;
};

const PROJET_STATUT_OPTIONS: StatusOption[] = [
  {
    value: "EN_ATTENTE",
    label: "En attente",
    shortLabel: "Attente",
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    value: "EN_COURS",
    label: "En cours",
    shortLabel: "Cours",
    dotClass: "bg-sky-500",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
  {
    value: "TERMINEE",
    label: "Terminée",
    shortLabel: "Terminée",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    value: "ANNULE",
    label: "Annulée",
    shortLabel: "Annulée",
    dotClass: "bg-rose-500",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "dd/MM/yyyy");
}

function initials(person: CmDashboardPerson | null | undefined, fallback = "?") {
  if (!person) return fallback;
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

function ItemRow({
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
  responsables: CmDashboardPerson[];
  accent: "violet" | "teal";
}) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-white px-3.5 py-3 shadow-sm transition-colors sm:px-4",
        accent === "violet"
          ? "border-violet-100/90 hover:border-violet-200"
          : "border-teal-100/90 hover:border-teal-200"
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {badge}
            {subtitle && (
              <span className="truncate text-xs font-medium text-slate-500">
                {subtitle}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold leading-snug text-slate-900">
            {title}
          </h4>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            <CalendarRange className="h-3 w-3 shrink-0" />
            <span className="tabular-nums">
              {formatDate(dateDebut)} → {formatDate(dateCloture)}
            </span>
          </div>
        </div>
        {responsables.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {responsables.map((person) => (
              <div
                key={person.userId}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[8px] font-bold text-white">
                  {initials(person)}
                </span>
                <span className="truncate">{person.fullName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function StatusListSection<T>({
  title,
  description,
  icon: Icon,
  options,
  items,
  getStatut,
  getProjectKey,
  renderItem,
  accent,
}: {
  title: string;
  description: string;
  icon: typeof FolderKanban;
  options: StatusOption[];
  items: T[];
  getStatut: (item: T) => string;
  getProjectKey?: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  accent: "violet" | "teal";
}) {
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const opt of options) map[opt.value] = 0;
    for (const item of items) {
      const statut = getStatut(item);
      map[statut] = (map[statut] ?? 0) + 1;
    }
    return map;
  }, [options, items, getStatut]);

  const [filter, setFilter] = useState<string>("all");

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => getStatut(item) === filter);
  }, [items, filter, getStatut]);

  const groupsByStatus = useMemo(() => {
    if (filter !== "all") return null;
    return options
      .map((opt) => ({
        option: opt,
        items: items.filter((item) => getStatut(item) === opt.value),
      }))
      .filter((g) => g.items.length > 0);
  }, [filter, options, items, getStatut]);

  function renderGroupedList(list: T[]) {
    if (!getProjectKey) {
      return <div className="space-y-2">{list.map(renderItem)}</div>;
    }

    const byProject = new Map<string, T[]>();
    for (const item of list) {
      const key = getProjectKey(item);
      const bucket = byProject.get(key) ?? [];
      bucket.push(item);
      byProject.set(key, bucket);
    }

    return (
      <div className="space-y-4">
        {Array.from(byProject.entries())
          .sort(([a], [b]) => a.localeCompare(b, "fr"))
          .map(([projectName, projectItems]) => (
            <div key={projectName} className="space-y-2">
              <div className="flex items-center gap-2 px-0.5">
                <FolderKanban className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate text-xs font-semibold text-slate-600">
                  {projectName}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
                  {projectItems.length}
                </span>
              </div>
              <div className="space-y-2">{projectItems.map(renderItem)}</div>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
            accent === "violet"
              ? "bg-gradient-to-br from-violet-600 to-fuchsia-600"
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
                accent === "violet"
                  ? "bg-violet-100 text-violet-800"
                  : "bg-teal-100 text-teal-800"
              )}
            >
              {items.length}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            filter === "all"
              ? accent === "violet"
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-teal-600 bg-teal-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          Tous
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
              filter === "all" ? "bg-white/20" : "bg-slate-100 text-slate-500"
            )}
          >
            {counts.all}
          </span>
        </button>
        {options.map((opt) => {
          const count = counts[opt.value] ?? 0;
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                isActive
                  ? accent === "violet"
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-teal-600 bg-teal-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isActive ? "bg-white/90" : opt.dotClass
                )}
              />
              {opt.shortLabel ?? opt.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
          Aucun élément à afficher.
        </div>
      ) : filter === "all" && groupsByStatus ? (
        <div className="space-y-6">
          {groupsByStatus.map(({ option, items: groupItems }) => (
            <section key={option.value} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", option.dotClass)} />
                <h4 className="text-sm font-semibold text-slate-800">
                  {option.label}
                </h4>
                <Badge
                  variant="outline"
                  className="ml-auto border-slate-200 bg-slate-50 text-xs tabular-nums text-slate-600"
                >
                  {groupItems.length}
                </Badge>
              </div>
              {renderGroupedList(groupItems)}
            </section>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
          Aucun élément dans ce statut.
        </div>
      ) : (
        renderGroupedList(filteredItems)
      )}
    </div>
  );
}

export default function CommunityManagerDashboardClient({
  initialData,
  initialError,
  brandLabel = "Community Manager",
  refreshAction = getCommunityManagerDashboard,
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
      const result = await refreshAction();
      setData(result.data);
      setError(result.success ? null : (result.error ?? null));
    } finally {
      setRefreshing(false);
    }
  }

  const kpis = [
    {
      label: "Projets",
      value: data.projetsPonctuels.length,
      icon: Layers,
      tone: "violet" as const,
    },
    {
      label: "Act. ponctuelles",
      value: data.activitesPonctuelles.length,
      icon: ClipboardList,
      tone: "violet" as const,
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

  const activiteOptions: StatusOption[] = ACTIVITE_STATUT_COLUMNS.map((c) => ({
    value: c.value,
    label: c.label,
    shortLabel: c.shortLabel,
    dotClass: c.dotClass,
  }));

  const tacheOptions: StatusOption[] = TACHE_STATUT_COLUMNS.map((c) => ({
    value: c.value,
    label: c.label,
    shortLabel: c.shortLabel,
    dotClass: c.dotClass,
  }));

  const projetsByStatut = useMemo(
    () =>
      countByStatus(
        data.projetsPonctuels,
        (item) => item.statutProjet,
        PROJET_STATUT_OPTIONS,
        PROJET_STATUS_COLORS
      ),
    [data.projetsPonctuels]
  );

  const activitesPonctuellesByStatut = useMemo(
    () =>
      countByStatus(
        data.activitesPonctuelles,
        (item) => item.statutActivite,
        ACTIVITE_STATUT_COLUMNS,
        ACTIVITE_STATUS_COLORS
      ),
    [data.activitesPonctuelles]
  );

  const tachesByStatut = useMemo(
    () =>
      countByStatus(
        data.tachesRoutine,
        (item) => item.statutTache,
        TACHE_STATUT_COLUMNS,
        ACTIVITE_STATUS_COLORS
      ),
    [data.tachesRoutine]
  );

  const workloadByType = useMemo(
    (): ChartDatum[] =>
      [
        {
          key: "projets",
          label: "Projets",
          value: data.projetsPonctuels.length,
          color: "#8b5cf6",
        },
        {
          key: "act-ponctuel",
          label: "Act. ponctuelles",
          value: data.activitesPonctuelles.length,
          color: "#d946ef",
        },
        {
          key: "act-routine",
          label: "Act. routine",
          value: data.activitesRoutine.length,
          color: "#14b8a6",
        },
        {
          key: "taches",
          label: "Tâches",
          value: data.tachesRoutine.length,
          color: "#0d9488",
        },
      ].filter((d) => d.value > 0),
    [data]
  );

  const monthlyTrends = useMemo(() => {
    const keys = buildMonthlyKeys(6);
    return keys.map(({ monthKey, monthShort, start, end }) => {
      const inRange = (iso: string) => {
        const d = new Date(iso);
        return d >= start && d <= end;
      };
      return {
        monthKey,
        monthShort,
        ponctuel: data.activitesPonctuelles.filter((a) => inRange(a.dateDebut))
          .length,
        routine: data.tachesRoutine.filter((t) => inRange(t.dateDebut)).length,
      };
    });
  }, [data.activitesPonctuelles, data.tachesRoutine]);

  const hasProjetsChart = projetsByStatut.length > 0;
  const hasActivitesChart = activitesPonctuellesByStatut.length > 0;
  const hasTachesChart = tachesByStatut.length > 0;
  const hasWorkloadChart = workloadByType.length > 0;
  const hasTrendChart = monthlyTrends.some(
    (m) => m.ponctuel > 0 || m.routine > 0
  );

  const projetsBoard = (
    <StatusListSection
      title="Projets"
      description="Vos projets ponctuels par statut"
      icon={Layers}
      options={PROJET_STATUT_OPTIONS}
      items={data.projetsPonctuels}
      getStatut={(item) => item.statutProjet}
      accent="violet"
      renderItem={(item) => {
        const config = PROJET_STATUT_OPTIONS.find(
          (c) => c.value === item.statutProjet
        );
        return (
          <ItemRow
            key={item.id}
            title={item.titre}
            dateDebut={item.dateDebut}
            dateCloture={item.dateCloture}
            accent="violet"
            responsables={item.responsables}
            badge={
              <Badge
                variant="outline"
                className={cn("shrink-0 border text-[10px]", config?.badgeClass)}
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
    <StatusListSection
      title="Activités"
      description="Vos activités ponctuelles par statut et projet"
      icon={ClipboardList}
      options={activiteOptions}
      items={data.activitesPonctuelles}
      getStatut={(item) => item.statutActivite}
      getProjectKey={(item) => item.projetTitre}
      accent="violet"
      renderItem={(item) => {
        const config = getActiviteStatutConfig(item.statutActivite);
        return (
          <ItemRow
            key={item.id}
            title={item.titre}
            subtitle={item.projetTitre}
            dateDebut={item.dateDebut}
            dateCloture={item.dateCloture}
            accent="violet"
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
    <StatusListSection
      title="Activités de routine"
      description="Vos activités de routine par statut"
      icon={ClipboardList}
      options={activiteOptions}
      items={data.activitesRoutine}
      getStatut={(item) => item.statutActivite}
      accent="teal"
      renderItem={(item) => {
        const config = getActiviteStatutConfig(item.statutActivite);
        return (
          <ItemRow
            key={item.id}
            title={item.libelle}
            subtitle={item.roleMissionLibelle}
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

  const tachesRoutineBoard = (
    <StatusListSection
      title="Tâches de routine"
      description="Vos tâches par statut et activité"
      icon={User}
      options={tacheOptions}
      items={data.tachesRoutine}
      getStatut={(item) => item.statutTache}
      getProjectKey={(item) =>
        `${item.roleMissionLibelle} · ${item.activiteLibelle}`
      }
      accent="teal"
      renderItem={(item) => {
        const config = getTacheStatutConfig(item.statutTache);
        return (
          <ItemRow
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
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/40 p-4 shadow-sm sm:p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-200/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-teal-200/25 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
              {brandLabel}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              Suivi de vos projets ponctuels et activités de routine, organisés
              par statut.
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
                  kpi.tone === "violet" ? "border-violet-100" : "border-teal-100"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-white",
                      kpi.tone === "violet"
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-600"
                        : "bg-gradient-to-br from-teal-500 to-cyan-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-500">
                      {kpi.label}
                    </p>
                    <p className="text-lg font-bold tabular-nums text-slate-900">
                      {kpi.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="relative mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </header>

      {/* Graphics */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-0.5">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-bold text-slate-900">Graphiques</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
          <Card className="border border-slate-200/60 bg-white/90 shadow-md lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-600" />
                <CardTitle className="text-base">Évolution sur 6 mois</CardTitle>
              </div>
              <CardDescription>
                Activités ponctuelles et tâches de routine démarrées
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {hasTrendChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyTrends}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="cmPonctuelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cmRoutineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="monthShort"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="ponctuel"
                      name="Act. ponctuelles"
                      stroke="#8b5cf6"
                      fill="url(#cmPonctuelGrad)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="routine"
                      name="Tâches routine"
                      stroke="#14b8a6"
                      fill="url(#cmRoutineGrad)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Pas encore de données d'évolution." />
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 bg-white/90 shadow-md lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-fuchsia-600" />
                <CardTitle className="text-base">Projets par statut</CardTitle>
              </div>
              <CardDescription>Répartition de vos projets ponctuels</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {hasProjetsChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projetsByStatut}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {projetsByStatut.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={entry.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      formatter={(value) => (
                        <span className="text-xs text-slate-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Aucun projet assigné pour le moment." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          <Card className="border border-slate-200/60 bg-white/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Charge de travail</CardTitle>
              <CardDescription>Répartition de vos éléments assignés</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {hasWorkloadChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadByType}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={110}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Éléments" radius={[0, 8, 8, 0]} barSize={28}>
                      {workloadByType.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Aucune charge enregistrée." />
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 bg-white/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Activités ponctuelles</CardTitle>
              <CardDescription>Par statut</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {hasActivitesChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activitesPonctuellesByStatut}
                    margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Activités" radius={[8, 8, 0, 0]} barSize={24}>
                      {activitesPonctuellesByStatut.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Aucune activité ponctuelle." />
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 bg-white/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Tâches de routine</CardTitle>
              <CardDescription>Par statut</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {hasTachesChart ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tachesByStatut}
                    margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Tâches" radius={[8, 8, 0, 0]} barSize={24}>
                      {tachesByStatut.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Aucune tâche de routine." />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="sticky top-16 z-30 lg:hidden">
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-sm backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMobileSection("ponctuels")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all",
              mobileSection === "ponctuels"
                ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-200/50"
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

      <section
        className={cn(
          "overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/40 shadow-sm ring-1 ring-violet-100/60",
          mobileSection !== "ponctuels" && "hidden lg:block"
        )}
      >
        <div className="border-b border-violet-100/80 bg-gradient-to-r from-violet-500/10 via-transparent to-fuchsia-500/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">
                Projets Ponctuels
              </h2>
              <p className="text-sm text-slate-500">
                Projets et activités dont vous êtes responsable
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-3 py-5 sm:space-y-10 sm:px-6 sm:py-6">
          {projetsBoard}
          <div className="border-t border-violet-100/80 pt-6 sm:pt-8">
            {activitesPonctuellesBoard}
          </div>
        </div>
      </section>

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
                Activités et tâches dont vous êtes responsable
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
