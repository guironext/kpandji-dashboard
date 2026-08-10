"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  Loader2,
  Palette,
  Sparkles,
  Target,
  TrendingUp,
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DesignerDashboardData } from "@/lib/actions/designer-dashboard";

type Props = {
  data: DesignerDashboardData;
};

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.98)",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow: "0 20px 50px -12px rgb(15 23 42 / 0.18)",
  padding: "12px 16px",
};

const QUICK_LINKS = [
  {
    href: "/designer/projet-ponctuel",
    label: "Projet ponctuel",
    description: "Activités et livrables à durée limitée",
    icon: Sparkles,
    gradient: "from-violet-500 to-fuchsia-600",
  },
  {
    href: "/designer/projet-permanent",
    label: "Projet permanent",
    description: "Tâches récurrentes et routine créative",
    icon: FileText,
    gradient: "from-indigo-500 to-violet-600",
  },
] as const;

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

export default function DesignerDashboardClient({ data }: Props) {
  const { stats, userLabel, statusDistribution, workloadByType, monthlyTrends, recentItems } =
    data;

  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const kpiCards = [
    {
      label: "Tâches assignées",
      value: stats.totalAssigned,
      sub: `${stats.ponctuelTotal} ponctuel · ${stats.permanentTotal} permanent`,
      icon: Target,
      iconBg: "bg-violet-50 text-violet-700",
      accent: "from-violet-500 to-fuchsia-500",
    },
    {
      label: "Terminées / validées",
      value: stats.totalCompleted,
      sub: `Taux de complétion ${stats.completionRate}%`,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 text-emerald-700",
      accent: "from-emerald-500 to-teal-500",
    },
    {
      label: "En cours",
      value: stats.totalInProgress,
      sub: `${stats.totalAwaitingValidation} en attente`,
      icon: Loader2,
      iconBg: "bg-sky-50 text-sky-700",
      accent: "from-sky-500 to-cyan-500",
    },
    {
      label: "En retard",
      value: stats.totalOverdue,
      sub: "Échéance dépassée",
      icon: AlertTriangle,
      iconBg: "bg-amber-50 text-amber-700",
      accent: "from-amber-500 to-orange-500",
    },
  ] as const;

  const hasStatusData = statusDistribution.some((d) => d.value > 0);
  const hasWorkloadData = workloadByType.some((d) => d.value > 0);
  const hasTrendData = monthlyTrends.some(
    (m) =>
      m.ponctuelCompleted > 0 ||
      m.permanentCompleted > 0 ||
      m.ponctuelAssigned > 0 ||
      m.permanentAssigned > 0
  );

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-gradient-to-b from-violet-50/50 via-white to-fuchsia-50/40">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.14),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-32 -z-10 h-72 w-72 rounded-full bg-fuchsia-200/30 blur-3xl sm:h-96 sm:w-96"
        aria-hidden
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-700 px-5 py-7 shadow-lg shadow-violet-900/25 sm:mb-10 sm:rounded-3xl sm:px-8 sm:py-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium capitalize text-white/90 backdrop-blur-sm">
                {todayLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                <Palette className="h-3.5 w-3.5" />
                Designer
              </span>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-100 backdrop-blur-sm">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Tableau de bord
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Votre performance créative
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-violet-50/85 sm:text-base">
                  Bienvenue, <span className="font-semibold text-white">{userLabel}</span>.
                  Suivez vos activités, votre progression et vos livrables en un coup
                  d&apos;œil.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:pt-1">
                <Button
                  asChild
                  variant="secondary"
                  className="w-full bg-white/15 text-white hover:bg-white/20 sm:w-auto"
                >
                  <Link href="/designer/projet-ponctuel">
                    Projets ponctuels
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Link href="/designer/projet-permanent">Projets permanents</Link>
                </Button>
              </div>
            </div>

            {/* Performance score strip */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs font-medium text-violet-100">Taux de complétion</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                  {stats.completionRate}%
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs font-medium text-violet-100">Ponctuel terminé</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                  {stats.ponctuelCompleted}
                  <span className="ml-1 text-sm font-medium text-violet-100">
                    / {stats.ponctuelTotal}
                  </span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs font-medium text-violet-100">Permanent terminé</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                  {stats.permanentCompleted}
                  <span className="ml-1 text-sm font-medium text-violet-100">
                    / {stats.permanentTotal}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {kpiCards.map((kpi) => (
            <Card
              key={kpi.label}
              className="overflow-hidden border-0 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className={`h-1 bg-gradient-to-r ${kpi.accent}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {kpi.label}
                </CardTitle>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.iconBg}`}
                >
                  <kpi.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
                  {kpi.value}
                </div>
                <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
          <Card className="border border-slate-200/60 bg-white/90 shadow-md lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-600" />
                <CardTitle className="text-base">Évolution sur 6 mois</CardTitle>
              </div>
              <CardDescription>
                Assignations et livraisons terminées / validées
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {hasTrendData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ponctuelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="permanentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d946ef" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
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
                      dataKey="ponctuelCompleted"
                      name="Ponctuel terminé"
                      stroke="#8b5cf6"
                      fill="url(#ponctuelGrad)"
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="permanentCompleted"
                      name="Permanent terminé"
                      stroke="#d946ef"
                      fill="url(#permanentGrad)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Pas encore de données d'évolution. Complétez des tâches pour voir la tendance." />
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 bg-white/90 shadow-md lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-fuchsia-600" />
                <CardTitle className="text-base">Répartition par statut</CardTitle>
              </div>
              <CardDescription>État actuel de votre charge</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {hasStatusData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} stroke="white" strokeWidth={2} />
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
                <EmptyChart message="Aucune tâche assignée pour le moment." />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workload + recent */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <Card className="border border-slate-200/60 bg-white/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Charge de travail</CardTitle>
              <CardDescription>
                Répartition entre projets ponctuels et permanents
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {hasWorkloadData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadByType}
                    layout="vertical"
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Tâches" radius={[0, 8, 8, 0]} barSize={28}>
                      {workloadByType.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Aucune charge de travail enregistrée." />
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 bg-white/90 shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Activité récente</CardTitle>
                <CardDescription>Vos dernières tâches mises à jour</CardDescription>
              </div>
              <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
            </CardHeader>
            <CardContent>
              {recentItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">
                  Aucune activité récente.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {recentItems.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link
                        href={item.href}
                        className="group flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 transition hover:border-violet-200 hover:bg-violet-50/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-violet-800">
                            {item.titre}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {item.projetLabel}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="secondary"
                              className={
                                item.type === "ponctuel"
                                  ? "bg-violet-100 text-violet-800 hover:bg-violet-100"
                                  : "bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-100"
                              }
                            >
                              {item.type === "ponctuel" ? "Ponctuel" : "Permanent"}
                            </Badge>
                            <Badge variant="outline" className="text-slate-600">
                              {item.statutLabel}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-violet-600" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <div className="mb-4">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900">
            Accès rapide
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {QUICK_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="h-full border border-slate-200/60 bg-white/90 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-xl">
                  <CardContent className="flex items-start justify-between gap-4 p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${item.gradient}`}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-violet-800">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 group-hover:text-violet-700" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
