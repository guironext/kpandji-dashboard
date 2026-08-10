"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart3,
  Clock,
  FolderKanban,
  Loader2,
  Timer,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjetPonctuelListItem } from "@/lib/actions/projet-ponctuel";
import {
  getProjetPonctuelResponsablesPerformance,
  type ProjetPonctuelPerformanceResult,
  type ResponsablePerformanceItem,
} from "@/lib/actions/projet-ponctuel-performance";
import { formatDurationDays, formatDurationMs } from "@/lib/projet-ponctuel-duration";
import ProjetProgressionSection from "./ProjetProgressionSection";

type Props = {
  projects: ProjetPonctuelListItem[];
};

const ALL_PROJECTS = "__all__";

const AVATAR_GRADIENTS = [
  "from-amber-500 to-orange-500",
  "from-orange-500 to-rose-500",
  "from-rose-500 to-pink-500",
  "from-yellow-500 to-amber-500",
  "from-amber-600 to-red-500",
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Clock;
  tone: "amber" | "orange" | "rose" | "slate";
}) {
  const tones = {
    amber: "from-amber-500/10 to-yellow-500/5 border-amber-200/70 text-amber-700",
    orange: "from-orange-500/10 to-amber-500/5 border-orange-200/70 text-orange-700",
    rose: "from-rose-500/10 to-pink-500/5 border-rose-200/70 text-rose-700",
    slate: "from-slate-500/10 to-slate-400/5 border-slate-200/70 text-slate-700",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br px-4 py-4 shadow-sm ring-1 ring-white/60",
        tones[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm",
            tone === "amber" && "text-amber-600",
            tone === "orange" && "text-orange-600",
            tone === "rose" && "text-rose-600",
            tone === "slate" && "text-slate-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function PerformanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: { fullName: string; avgDays: number; completedCount: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-lg">
      <p className="font-semibold text-slate-900">{point.fullName || label}</p>
      <p className="mt-1 text-slate-600">
        Délai moyen : <span className="font-medium">{formatDurationDays(point.avgDays)}</span>
      </p>
      <p className="text-slate-600">
        Terminées : <span className="font-medium">{point.completedCount}</span>
      </p>
    </div>
  );
}

function CountTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: { fullName: string; completedCount: number; inProgressCount: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-lg">
      <p className="font-semibold text-slate-900">{point.fullName || label}</p>
      <p className="mt-1 text-slate-600">
        Terminées : <span className="font-medium">{point.completedCount}</span>
      </p>
      <p className="text-slate-600">
        En cours : <span className="font-medium">{point.inProgressCount}</span>
      </p>
    </div>
  );
}

function ResponsablePerformanceCard({
  responsable,
  index,
  showProjectColumn,
}: {
  responsable: ResponsablePerformanceItem;
  index: number;
  showProjectColumn: boolean;
}) {
  const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100">
      <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50/60 via-white to-orange-50/40 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-md",
                gradient
              )}
            >
              {initials(responsable.firstName, responsable.lastName)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{responsable.fullName}</h3>
              <p className="text-sm text-slate-500">
                {responsable.completedCount} terminée
                {responsable.completedCount !== 1 ? "s" : ""}
                {responsable.inProgressCount > 0 &&
                  ` · ${responsable.inProgressCount} en cours`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="border-0 bg-amber-100 text-amber-800 hover:bg-amber-100">
              <Timer className="mr-1 h-3 w-3" />
              Moy. {formatDurationMs(responsable.avgDurationMs)}
            </Badge>
            {responsable.minDurationMs != null && (
              <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                Min {formatDurationMs(responsable.minDurationMs)}
              </Badge>
            )}
            {responsable.maxDurationMs != null && (
              <Badge variant="outline" className="border-rose-200 text-rose-700">
                Max {formatDurationMs(responsable.maxDurationMs)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {responsable.completions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 sm:px-5">Activité</th>
                {showProjectColumn && <th className="px-4 py-3">Projet</th>}
                <th className="px-4 py-3">Assigné le</th>
                <th className="px-4 py-3">Terminé le</th>
                <th className="px-4 py-3 sm:px-5">Durée</th>
              </tr>
            </thead>
            <tbody>
              {responsable.completions.map((item) => (
                <tr
                  key={`${responsable.userId}-${item.activiteId}`}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 sm:px-5">
                    {item.activiteTitre}
                  </td>
                  {showProjectColumn && (
                    <td className="px-4 py-3 text-slate-600">{item.projetTitre}</td>
                  )}
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {formatDate(item.assignedAt)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {item.isCompleted ? formatDate(item.completedAt) : "—"}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                        item.isCompleted
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {formatDurationMs(item.durationMs)}
                      {!item.isCompleted && " (en cours)"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-6 text-sm text-slate-500">Aucune activité assignée.</p>
      )}
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 px-4 py-6 sm:px-6">
      <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function PerformancesPonctuelPanel({ projects }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState(ALL_PROJECTS);
  const [performance, setPerformance] = useState<ProjetPonctuelPerformanceResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadPerformance = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const result = await getProjetPonctuelResponsablesPerformance(
        projectId === ALL_PROJECTS ? null : projectId
      );
      if (result.success) {
        setPerformance(result.data);
      } else {
        toast.error(result.error ?? "Impossible de charger les performances.");
        setPerformance(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des performances.");
      setPerformance(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPerformance(selectedProjectId);
  }, [selectedProjectId, loadPerformance]);

  const selectedProject = useMemo(
    () =>
      selectedProjectId === ALL_PROJECTS
        ? null
        : projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const showProjectColumn = selectedProjectId === ALL_PROJECTS;
  const fastestResponsable = useMemo(() => {
    if (!performance) return null;
    const withCompleted = performance.responsables.filter((r) => r.completedCount > 0);
    if (withCompleted.length === 0) return null;
    return [...withCompleted].sort((a, b) => a.avgDurationMs - b.avgDurationMs)[0];
  }, [performance]);

  if (isLoading && !performance) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            Délai de réalisation par responsable — de l&apos;assignation à la clôture de
            l&apos;activité.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <label
            htmlFor="performance-project-select"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Projet
          </label>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger
              id="performance-project-select"
              className="h-11 rounded-xl border-slate-200 bg-white shadow-sm"
            >
              <SelectValue placeholder="Sélectionner un projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROJECTS}>Tous les projets</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.titre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProject && (
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-orange-50/40 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FolderKanban className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-slate-900">{selectedProject.titre}</span>
          </div>
        </div>
      )}

      {performance && (
        <ProjetProgressionSection progression={performance.progression} />
      )}

      {performance && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Responsables"
              value={performance.summary.responsableCount}
              icon={Users}
              tone="slate"
            />
            <StatCard
              label="Activités terminées"
              value={performance.summary.totalCompleted}
              hint={
                performance.summary.totalInProgress > 0
                  ? `${performance.summary.totalInProgress} en cours`
                  : undefined
              }
              icon={TrendingUp}
              tone="amber"
            />
            <StatCard
              label="Délai moyen global"
              value={formatDurationDays(performance.summary.globalAvgDurationDays)}
              hint="Sur les activités terminées"
              icon={Clock}
              tone="orange"
            />
            <StatCard
              label="Meilleur délai moyen"
              value={fastestResponsable ? formatDurationMs(fastestResponsable.avgDurationMs) : "—"}
              hint={fastestResponsable?.fullName}
              icon={Timer}
              tone="rose"
            />
          </div>

          {performance.chartData.length > 0 ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100">
                <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50/60 to-white px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-amber-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Délai moyen de réalisation
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Temps moyen entre assignation et clôture (jours)
                  </p>
                </div>
                <div className="h-80 px-2 py-4 sm:px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performance.chartData}
                      margin={{ top: 8, right: 12, left: 0, bottom: 48 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={56}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        allowDecimals
                        label={{
                          value: "Jours",
                          angle: -90,
                          position: "insideLeft",
                          style: { fill: "#94a3b8", fontSize: 11 },
                        }}
                      />
                      <Tooltip content={<PerformanceTooltip />} />
                      <Bar
                        dataKey="avgDays"
                        name="Délai moyen (j)"
                        fill="#f59e0b"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={56}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100">
                <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50/60 to-white px-4 py-4 sm:px-5">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Volume d&apos;activités
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Activités terminées et en cours par responsable
                  </p>
                </div>
                <div className="h-80 px-2 py-4 sm:px-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performance.chartData}
                      margin={{ top: 8, right: 12, left: 0, bottom: 48 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={56}
                      />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CountTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Bar
                        dataKey="completedCount"
                        name="Terminées"
                        fill="#10b981"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={40}
                      />
                      <Bar
                        dataKey="inProgressCount"
                        name="En cours"
                        fill="#fb923c"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-200/80 bg-amber-50/30 px-6 py-16 text-center">
              <BarChart3 className="mb-3 h-10 w-10 text-amber-300" />
              <p className="text-base font-semibold text-slate-800">Aucune donnée disponible</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Assignez des responsables aux activités et marquez-les comme terminées pour
                afficher les indicateurs de performance.
              </p>
            </div>
          )}

          {performance.responsables.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Détail par responsable</h3>
                <p className="text-sm text-slate-500">
                  Historique des activités avec durée de traitement individuelle
                </p>
              </div>
              {performance.responsables.map((responsable, index) => (
                <ResponsablePerformanceCard
                  key={responsable.userId}
                  responsable={responsable}
                  index={index}
                  showProjectColumn={showProjectColumn}
                />
              ))}
            </div>
          )}
        </>
      )}

      {isLoading && performance && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mise à jour…
        </div>
      )}
    </div>
  );
}
