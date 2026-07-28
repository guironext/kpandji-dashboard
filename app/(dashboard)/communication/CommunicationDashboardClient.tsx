"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Crown,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  Newspaper,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActeurWithObjectifs } from "@/lib/actions/communication-objectifs";
import {
  getInactivePublicationsPerformanceData,
  type InactivePublicationsPerformanceData,
} from "@/lib/actions/publication-objectif-global-rubrique";

type Props = {
  initialPerformanceData: InactivePublicationsPerformanceData;
  initialActeurs: ActeurWithObjectifs[];
  objectifsCount: number;
  rubriquesCount: number;
  projectsCount: number;
  initialError: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  COMMUNICATION: "Communication",
  INFOGRAPHIE: "Infographie",
  COMMERCIAL: "Commercial",
  COMMUNITY_MANAGER: "Community manager",
};

const ACTEUR_COLORS = [
  "#0284c7",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#db2777",
  "#4f46e5",
  "#0d9488",
  "#ea580c",
  "#475569",
  "#dc2626",
] as const;

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.98)",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow: "0 20px 50px -12px rgb(15 23 42 / 0.18)",
  padding: "12px 16px",
};

const QUICK_LINKS = [
  {
    href: "/communication/projets",
    label: "Projets",
    description: "Piloter les initiatives",
    icon: FolderKanban,
    gradient: "from-sky-500 to-blue-600",
    glow: "group-hover:shadow-sky-200/60",
  },
  {
    href: "/communication/objectifs-principaux",
    label: "Objectifs",
    description: "Rubriques & cycles",
    icon: Target,
    gradient: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-200/60",
  },
  {
    href: "/communication/performances",
    label: "Performances",
    description: "Analyse détaillée",
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-200/60",
  },
  {
    href: "/communication/mise-en-oeuvre",
    label: "Mise en oeuvre",
    description: "Actions & tâches",
    icon: CalendarDays,
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-200/60",
  },
] as const;

type ActeurMeta = {
  userId: string;
  acteurName: string;
  acteurRole: string;
  color: string;
  total: number;
};

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").toLowerCase();
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function shortMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const labels = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  const idx = Number(month) - 1;
  return `${labels[idx] ?? month} ${year.slice(2)}`;
}

function buildActeurMeta(data: InactivePublicationsPerformanceData): ActeurMeta[] {
  return data.byActeur.map((group, index) => ({
    userId: group.userId,
    acteurName: group.acteurName,
    acteurRole: group.acteurRole,
    color: ACTEUR_COLORS[index % ACTEUR_COLORS.length],
    total: group.publications.length,
  }));
}

function buildMonthlyChartData(
  data: InactivePublicationsPerformanceData,
  acteurs: ActeurMeta[]
) {
  const chronological = [...data.byMonth].reverse();
  return chronological.map((month) => {
    const row: Record<string, string | number> = {
      monthKey: month.monthKey,
      monthLabel: month.monthLabel,
      monthShort: shortMonthLabel(month.monthKey),
      total: month.totalCount,
    };
    for (const acteur of acteurs) {
      const match = month.byActeur.find((a) => a.userId === acteur.userId);
      row[acteur.userId] = match?.publications.length ?? 0;
    }
    return row;
  });
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
          <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-bold tabular-nums text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function CommunicationDashboardClient({
  initialPerformanceData,
  initialActeurs,
  objectifsCount,
  rubriquesCount,
  projectsCount,
  initialError,
}: Props) {
  const { user } = useUser();
  const [performanceData, setPerformanceData] = useState(initialPerformanceData);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep SSR and first client render identical to avoid hydration mismatch
  // (Clerk user + locale dates are only available after mount).
  const todayLabel = mounted
    ? format(new Date(), "EEEE d MMMM yyyy", { locale: fr })
    : "";
  const userLabel = mounted
    ? user?.firstName?.trim() ||
      user?.fullName?.trim()?.split(" ")[0] ||
      "l'équipe communication"
    : "l'équipe communication";

  const acteurs = useMemo(() => buildActeurMeta(performanceData), [performanceData]);
  const monthlyChartData = useMemo(
    () => buildMonthlyChartData(performanceData, acteurs),
    [performanceData, acteurs]
  );
  const acteurBarData = useMemo(
    () =>
      acteurs
        .map((a) => ({
          name: a.acteurName.length > 16 ? `${a.acteurName.slice(0, 14)}…` : a.acteurName,
          fullName: a.acteurName,
          count: a.total,
          fill: a.color,
        }))
        .sort((a, b) => b.count - a.count),
    [acteurs]
  );
  const pieData = useMemo(
    () =>
      acteurs
        .filter((a) => a.total > 0)
        .map((a) => ({
          name: a.acteurName,
          value: a.total,
          fill: a.color,
        })),
    [acteurs]
  );
  const objectifsByActeur = useMemo(
    () =>
      initialActeurs
        .map((a, index) => ({
          name: a.name.length > 16 ? `${a.name.slice(0, 14)}…` : a.name,
          fullName: a.name,
          count: a.objectifs.length,
          fill: ACTEUR_COLORS[index % ACTEUR_COLORS.length],
        }))
        .filter((a) => a.count > 0)
        .sort((a, b) => b.count - a.count),
    [initialActeurs]
  );
  const trendAreaData = useMemo(
    () =>
      monthlyChartData.map((row) => ({
        monthShort: row.monthShort as string,
        total: row.total as number,
      })),
    [monthlyChartData]
  );

  const avgPerActeur =
    acteurs.length > 0 ? (performanceData.totalCount / acteurs.length).toFixed(1) : "0";
  const topActeur = acteurBarData[0];
  const completionRate =
    objectifsCount > 0
      ? Math.round((performanceData.totalCount / objectifsCount) * 100)
      : 0;

  const kpiCards = [
    {
      label: "Publications",
      value: performanceData.totalCount,
      sub: "Terminées et archivées",
      icon: Newspaper,
      accent: "from-sky-500 to-blue-600",
      iconBg: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Acteurs actifs",
      value: initialActeurs.length,
      sub: "Membres de l'équipe",
      icon: Users,
      accent: "from-violet-500 to-purple-600",
      iconBg: "bg-violet-500/10 text-violet-600",
    },
    {
      label: "Objectifs",
      value: objectifsCount,
      sub: `${rubriquesCount} rubrique${rubriquesCount !== 1 ? "s" : ""}`,
      icon: Target,
      accent: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Projets",
      value: projectsCount,
      sub: `Moy. ${avgPerActeur} pub./acteur`,
      icon: FolderKanban,
      accent: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-500/10 text-amber-600",
    },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getInactivePublicationsPerformanceData();
    if (!res.success) {
      setError(res.error);
    } else {
      setPerformanceData(res.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  return (
    <div className="relative -mx-4 -mt-4 min-h-screen overflow-hidden bg-[#f8fafc] sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.08),transparent_24%),linear-gradient(to_bottom,#f8fafc,#ffffff_40%,#f1f5f9)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(167,139,250,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.14),transparent_30%)]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-32 sm:pt-10 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-sky-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                Communication · Tableau de bord
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <LayoutDashboard className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                    Bonjour, {userLabel}
                  </h1>
                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-300">
                    Pilotez vos publications, objectifs et performances des acteurs depuis une
                    vue unifiée, claire et actionnable.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex min-h-[30px] min-w-[12rem] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-sky-300" />
                  {todayLabel || "\u00a0"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Données synchronisées
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Button
                size="lg"
                onClick={() => void loadData()}
                disabled={loading}
                className="rounded-2xl border-0 bg-white px-6 text-indigo-950 shadow-xl shadow-black/20 hover:bg-sky-50"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Actualiser
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
              >
                <Link href="/communication/performances">
                  Analyse complète
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.label}
                className="group overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/70"
              >
                <div className={`h-1 bg-gradient-to-r ${kpi.accent}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {kpi.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-3xl">
                        {kpi.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
                    </div>
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${kpi.iconBg}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 space-y-10 pb-12">
          {error && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <section className="space-y-5">
            <SectionHeading
              eyebrow="Navigation"
              title="Accès rapide"
              description="Les modules essentiels pour piloter votre activité communication."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} className="group">
                    <div
                      className={`relative overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:border-slate-300 ${link.glow} hover:shadow-xl`}
                    >
                      <div
                        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${link.gradient} opacity-10 blur-2xl transition group-hover:opacity-20`}
                      />
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${link.gradient} text-white shadow-lg`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{link.label}</p>
                            <p className="mt-1 text-sm text-slate-500">{link.description}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-600" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-slate-200/70 bg-white py-28 shadow-lg shadow-slate-200/40">
              <Loader2 className="h-9 w-9 animate-spin text-indigo-500" />
              <div className="text-center">
                <p className="font-semibold text-slate-800">Mise à jour en cours</p>
                <p className="mt-1 text-sm text-slate-500">Rafraîchissement des indicateurs…</p>
              </div>
            </div>
          ) : (
            <>
              <section className="space-y-5">
                <SectionHeading
                  eyebrow="Performance"
                  title="Vue d'ensemble des acteurs"
                  description="Publications terminées, répartition et tendances mensuelles."
                  action={
                    <Badge
                      variant="outline"
                      className="rounded-full border-sky-200 bg-sky-50 px-3 py-1 text-sky-700"
                    >
                      {completionRate}% de couverture objectifs
                    </Badge>
                  }
                />

                <div className="grid gap-5 xl:grid-cols-12">
                  <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50 xl:col-span-8">
                    <CardHeader className="border-b border-slate-100/80 bg-gradient-to-r from-slate-50 to-white pb-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                            <BarChart3 className="h-5 w-5 text-sky-600" />
                            Publications par acteur et par mois
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Comparaison mensuelle des contributions
                          </CardDescription>
                        </div>
                        <div className="hidden rounded-2xl bg-sky-50 px-3 py-2 text-right sm:block">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">
                            Total
                          </p>
                          <p className="text-lg font-bold tabular-nums text-sky-950">
                            {performanceData.totalCount}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-6 sm:p-6">
                      {performanceData.totalCount === 0 ? (
                        <EmptyChart message="Aucune publication terminée pour le moment." />
                      ) : (
                        <div className="h-[280px] w-full sm:h-[360px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={monthlyChartData}
                              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                              barCategoryGap="20%"
                              barGap={3}
                            >
                              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eef2f7" />
                              <XAxis
                                dataKey="monthShort"
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                              <Legend
                                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                                formatter={(value) =>
                                  acteurs.find((a) => a.userId === value)?.acteurName ?? value
                                }
                              />
                              {acteurs.map((acteur) => (
                                <Bar
                                  key={acteur.userId}
                                  dataKey={acteur.userId}
                                  name={acteur.acteurName}
                                  fill={acteur.color}
                                  radius={[8, 8, 0, 0]}
                                  maxBarSize={34}
                                />
                              ))}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-5 xl:col-span-4">
                    <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-900">Répartition</CardTitle>
                        <CardDescription>Part des publications par acteur</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {pieData.length === 0 ? (
                          <EmptyChart message="Pas encore de données." />
                        ) : (
                          <>
                            <div className="relative mx-auto h-[210px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={58}
                                    outerRadius={82}
                                    paddingAngle={4}
                                    stroke="white"
                                    strokeWidth={3}
                                  >
                                    {pieData.map((entry) => (
                                      <Cell key={entry.name} fill={entry.fill} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-bold tabular-nums text-slate-900">
                                  {performanceData.totalCount}
                                </p>
                                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                  Total
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 space-y-2.5">
                              {pieData.slice(0, 5).map((item) => {
                                const pct =
                                  performanceData.totalCount > 0
                                    ? Math.round((item.value / performanceData.totalCount) * 100)
                                    : 0;
                                return (
                                  <div key={item.name} className="flex items-center gap-3">
                                    <span
                                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                                      style={{ backgroundColor: item.fill }}
                                    />
                                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600">
                                      {item.name}
                                    </span>
                                    <span className="text-xs font-medium tabular-nums text-slate-400">
                                      {pct}%
                                    </span>
                                    <span className="w-6 text-right text-sm font-bold tabular-nums text-slate-900">
                                      {item.value}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {topActeur && (
                      <div className="relative overflow-hidden rounded-[1.35rem] border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-5 shadow-lg shadow-amber-100/50">
                        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                              <Crown className="h-4 w-4" />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                              Top contributeur
                            </p>
                          </div>
                          <p className="mt-4 truncate text-xl font-bold text-amber-950">
                            {topActeur.fullName}
                          </p>
                          <p className="mt-1 text-sm text-amber-800/80">
                            {topActeur.count} publication{topActeur.count > 1 ? "s" : ""} terminée
                            {topActeur.count > 1 ? "s" : ""}
                          </p>
                          <div className="mt-4 h-2 overflow-hidden rounded-full bg-amber-200/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                              style={{
                                width: `${performanceData.totalCount > 0 ? Math.round((topActeur.count / performanceData.totalCount) * 100) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50">
                  <CardHeader className="border-b border-slate-100/80 bg-gradient-to-r from-violet-50/80 to-white">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                      <Users className="h-5 w-5 text-violet-600" />
                      Classement des acteurs
                    </CardTitle>
                    <CardDescription>Publications terminées — total cumulé</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-6">
                    {acteurBarData.length === 0 ? (
                      <EmptyChart message="Aucune donnée de classement." />
                    ) : (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={acteurBarData}
                            layout="vertical"
                            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#eef2f7" />
                            <XAxis
                              type="number"
                              allowDecimals={false}
                              tick={{ fontSize: 11, fill: "#64748b" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={96}
                              tick={{ fontSize: 11, fill: "#475569" }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={TOOLTIP_STYLE}
                              formatter={(value) => [value ?? 0, "Publications"]}
                              labelFormatter={(_, payload) =>
                                payload?.[0]?.payload?.fullName ?? ""
                              }
                              cursor={{ fill: "rgba(148,163,184,0.08)" }}
                            />
                            <Bar dataKey="count" radius={[0, 10, 10, 0]} maxBarSize={26}>
                              {acteurBarData.map((entry) => (
                                <Cell key={entry.fullName} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50">
                  <CardHeader className="border-b border-slate-100/80 bg-gradient-to-r from-emerald-50/80 to-white">
                    <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Tendance globale
                    </CardTitle>
                    <CardDescription>Volume mensuel de publications terminées</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-6">
                    {trendAreaData.length === 0 ? (
                      <EmptyChart message="Pas assez de données pour la tendance." />
                    ) : (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={trendAreaData}
                            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eef2f7" />
                            <XAxis
                              dataKey="monthShort"
                              tick={{ fill: "#64748b", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fill: "#64748b", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={TOOLTIP_STYLE}
                              formatter={(value) => [value ?? 0, "Publications"]}
                            />
                            <Area
                              type="monotone"
                              dataKey="total"
                              stroke="#059669"
                              strokeWidth={2.5}
                              fill="url(#trendFill)"
                              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#059669" }}
                              activeDot={{ r: 6 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {objectifsByActeur.length > 0 && (
                <section className="space-y-5">
                  <SectionHeading
                    eyebrow="Charge de travail"
                    title="Objectifs assignés par acteur"
                    description="Répartition de la charge opérationnelle sur l'équipe."
                  />
                  <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/50">
                    <CardContent className="p-5 pt-6 sm:p-6">
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={objectifsByActeur}
                            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                            barCategoryGap="22%"
                          >
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#eef2f7" />
                            <XAxis
                              dataKey="name"
                              tick={{ fill: "#64748b", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fill: "#64748b", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={TOOLTIP_STYLE}
                              formatter={(value) => [value ?? 0, "Objectifs"]}
                              labelFormatter={(_, payload) =>
                                payload?.[0]?.payload?.fullName ?? ""
                              }
                              cursor={{ fill: "rgba(148,163,184,0.08)" }}
                            />
                            <Bar dataKey="count" radius={[10, 10, 0, 0]} maxBarSize={46}>
                              {objectifsByActeur.map((entry) => (
                                <Cell key={entry.fullName} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {initialActeurs.length > 0 && (
                <section className="space-y-5">
                  <SectionHeading
                    eyebrow="Équipe"
                    title="Fiches acteurs"
                    description="Profil, objectifs assignés et publications réalisées."
                  />
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {initialActeurs.map((acteur, index) => {
                      const perf = acteurs.find((a) => a.userId === acteur.userId);
                      const color = ACTEUR_COLORS[index % ACTEUR_COLORS.length];
                      const pubCount = perf?.total ?? 0;
                      const objCount = acteur.objectifs.length;
                      const score =
                        objCount > 0 ? Math.min(100, Math.round((pubCount / objCount) * 100)) : 0;

                      return (
                        <div
                          key={acteur.userId}
                          className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                        >
                          <div
                            className="absolute inset-x-0 top-0 h-24 opacity-[0.07] transition group-hover:opacity-[0.12]"
                            style={{
                              background: `linear-gradient(135deg, ${color}, transparent 70%)`,
                            }}
                          />
                          <div className="relative">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-md"
                                  style={{ backgroundColor: color }}
                                >
                                  {initials(acteur.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {acteur.name}
                                  </p>
                                  <p className="text-xs text-slate-500">{roleLabel(acteur.role)}</p>
                                </div>
                              </div>
                              {index === 0 && pubCount > 0 && (
                                <Badge className="rounded-full border-0 bg-amber-100 text-amber-800">
                                  <Zap className="mr-1 h-3 w-3" />
                                  Actif
                                </Badge>
                              )}
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Objectifs
                                </p>
                                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                                  {objCount}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Publications
                                </p>
                                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                                  {pubCount}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="font-medium text-slate-500">Taux de réalisation</span>
                                <span className="font-bold tabular-nums text-slate-800">{score}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${score}%`,
                                    backgroundColor: color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="flex justify-center pt-2">
                <Button
                  asChild
                  size="lg"
                  className="rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 shadow-lg shadow-indigo-200/60 hover:from-sky-600/95 hover:to-indigo-600/95"
                >
                  <Link href="/communication/performances">
                    Explorer l&apos;analyse détaillée
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
