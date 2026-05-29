"use client";

import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Loader2,
  Newspaper,
  RefreshCw,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getInactivePublicationsPerformanceData,
  type InactivePublicationPerformanceItem,
  type InactivePublicationsPerformanceData,
} from "@/lib/actions/publication-objectif-global-rubrique";

type Props = {
  initialData: InactivePublicationsPerformanceData;
  initialError: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  COMMUNICATION: "Communication",
  INFOGRAPHIE: "Infographie",
  COMMERCIAL: "Commercial",
  COMMUNITY_MANAGER: "Community manager",
};

const ACTEUR_COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#64748b",
  "#ef4444",
] as const;

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.98)",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  boxShadow: "0 10px 40px -10px rgb(0 0 0 / 0.15)",
  padding: "10px 14px",
};

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

function formatDate(date: Date): string {
  return format(new Date(date), "dd MMM yyyy", { locale: fr });
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

function PublicationTable({ publications }: { publications: InactivePublicationPerformanceItem[] }) {
  if (publications.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
        Aucune publication terminée.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white/60">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 bg-slate-50/90 hover:bg-slate-50/90">
            <TableHead className="font-semibold text-slate-600">Publication</TableHead>
            <TableHead className="font-semibold text-slate-600">Objectif</TableHead>
            <TableHead className="font-semibold text-slate-600">Rubrique</TableHead>
            <TableHead className="font-semibold text-slate-600">Période</TableHead>
            <TableHead className="font-semibold text-slate-600">Terminée le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {publications.map((pub) => (
            <TableRow key={pub.id} className="border-slate-100/80 transition-colors hover:bg-sky-50/40">
              <TableCell className="font-medium text-slate-900">{pub.titrePublication}</TableCell>
              <TableCell className="max-w-[12rem] truncate text-slate-600" title={pub.objectifTitle}>
                {pub.objectifTitle}
              </TableCell>
              <TableCell>
                {pub.rubrique ? (
                  <Badge variant="outline" className="border-sky-200 bg-sky-50/80 text-[10px] text-sky-800">
                    {pub.rubrique}
                  </Badge>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-600">
                {formatDate(pub.dateDebutPublication)} → {formatDate(pub.dateFinPublication)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-500">
                {formatDate(pub.updatedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="space-y-1.5">
        {visible.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="h-2.5 w-2.5 rounded-full"
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

export default function PerformancesPageClient({ initialData, initialError }: Props) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [collapsedActeurs, setCollapsedActeurs] = useState<Set<string>>(new Set());
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const acteurs = useMemo(() => buildActeurMeta(data), [data]);
  const monthlyChartData = useMemo(
    () => buildMonthlyChartData(data, acteurs),
    [data, acteurs]
  );
  const acteurBarData = useMemo(
    () =>
      acteurs
        .map((a) => ({
          name: a.acteurName.length > 18 ? `${a.acteurName.slice(0, 16)}…` : a.acteurName,
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

  const avgPerActeur =
    acteurs.length > 0 ? (data.totalCount / acteurs.length).toFixed(1) : "0";
  const topActeur = acteurBarData[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getInactivePublicationsPerformanceData();
    if (!res.success) {
      setError(res.error);
    } else {
      setData(res.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  const toggleActeur = (userId: string) => {
    setCollapsedActeurs((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/30">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/60 bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-sky-100 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Tableau de bord communication
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Performances
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-sky-100/90 sm:text-base">
                    Publications terminées — suivi visuel par acteur et par mois
                  </p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => void loadData()}
              disabled={loading}
              className="shrink-0 rounded-xl border-0 bg-white text-indigo-700 shadow-lg shadow-indigo-900/20 hover:bg-sky-50"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Actualiser
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              {
                label: "Publications",
                value: data.totalCount,
                icon: Newspaper,
              },
              {
                label: "Acteurs",
                value: acteurs.length,
                icon: Users,
              },
              {
                label: "Mois actifs",
                value: data.byMonth.length,
                icon: Calendar,
              },
              {
                label: "Moy. / acteur",
                value: avgPerActeur,
                icon: TrendingUp,
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-md transition hover:bg-white/15"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-100/80">
                      {stat.label}
                    </p>
                    <Icon className="h-4 w-4 text-white/70" />
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div
          className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-32 h-56 w-56 rounded-full bg-violet-200/25 blur-3xl"
          aria-hidden
        />

        {error && (
          <div className="relative rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="relative flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="font-medium">Mise à jour des données…</p>
          </div>
        ) : data.totalCount === 0 ? (
          <Card className="relative border-dashed border-slate-200 bg-white/80 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <BarChart3 className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-800">Aucune publication terminée</p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Les publications marquées comme inactives apparaîtront ici avec leurs graphiques
                de performance.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative space-y-6">
            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-sm lg:col-span-2">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-sky-50/80 to-indigo-50/50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <BarChart3 className="h-5 w-5 text-sky-600" />
                    Publications par acteur et par mois
                  </CardTitle>
                  <CardDescription>
                    Nombre de publications terminées — comparaison mensuelle entre acteurs
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[340px] w-full sm:h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyChartData}
                        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                        barCategoryGap="18%"
                        barGap={4}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
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
                            radius={[6, 6, 0, 0]}
                            maxBarSize={36}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-6">
                <Card className="flex-1 border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-slate-900">Répartition par acteur</CardTitle>
                    <CardDescription>Part du total des publications terminées</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mx-auto h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={78}
                            paddingAngle={3}
                          >
                            {pieData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} stroke="white" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 space-y-2">
                      {pieData.slice(0, 4).map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 truncate text-slate-600">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="font-semibold tabular-nums text-slate-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {topActeur && (
                  <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700/80">
                      Meilleur contributeur
                    </p>
                    <p className="mt-2 truncate text-lg font-bold text-amber-950">
                      {topActeur.fullName}
                    </p>
                    <p className="mt-1 text-sm text-amber-800/80">
                      {topActeur.count} publication{topActeur.count > 1 ? "s" : ""} terminé
                      {topActeur.count > 1 ? "es" : "e"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                    <Users className="h-5 w-5 text-violet-600" />
                    Total par acteur
                  </CardTitle>
                  <CardDescription>Classement des publications terminées</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={acteurBarData}
                        layout="vertical"
                        margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
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
                        />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={28}>
                          {acteurBarData.map((entry) => (
                            <Cell key={entry.fullName} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Évolution mensuelle
                  </CardTitle>
                  <CardDescription>Tendance des publications par acteur dans le temps</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 11 }}
                          formatter={(value) =>
                            acteurs.find((a) => a.userId === value)?.acteurName ?? value
                          }
                        />
                        {acteurs.map((acteur) => (
                          <Line
                            key={acteur.userId}
                            type="monotone"
                            dataKey={acteur.userId}
                            name={acteur.acteurName}
                            stroke={acteur.color}
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detail tabs */}
            <Card className="border-slate-200/80 bg-white/90 shadow-lg shadow-slate-200/40 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LayoutGrid className="h-5 w-5 text-indigo-600" />
                  Détail des publications
                </CardTitle>
                <CardDescription>
                  Consultez la liste complète, groupée par acteur ou par mois
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="acteur" className="w-full">
                  <TabsList className="mb-6 grid h-auto w-full grid-cols-2 rounded-xl bg-slate-100/80 p-1 sm:w-auto sm:grid-cols-2">
                    <TabsTrigger
                      value="acteur"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Par acteur
                    </TabsTrigger>
                    <TabsTrigger
                      value="month"
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Par mois
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="acteur" className="mt-0 space-y-4">
                    {data.byActeur.map((group) => {
                      const acteurMeta = acteurs.find((a) => a.userId === group.userId);
                      const isCollapsed = collapsedActeurs.has(group.userId);
                      return (
                        <section
                          key={group.userId}
                          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50/50 shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => toggleActeur(group.userId)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-slate-50/80 sm:px-5"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                                style={{ backgroundColor: acteurMeta?.color ?? "#64748b" }}
                              >
                                <User className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {group.acteurName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {roleLabel(group.acteurRole)}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge
                                className="border-0 tabular-nums"
                                style={{
                                  backgroundColor: `${acteurMeta?.color ?? "#64748b"}18`,
                                  color: acteurMeta?.color ?? "#64748b",
                                }}
                              >
                                {group.publications.length}
                              </Badge>
                              {isCollapsed ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </button>
                          {!isCollapsed && (
                            <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5">
                              <PublicationTable publications={group.publications} />
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="month" className="mt-0 space-y-4">
                    {data.byMonth.map((monthGroup) => {
                      const isCollapsed = collapsedMonths.has(monthGroup.monthKey);
                      return (
                        <section
                          key={monthGroup.monthKey}
                          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white to-violet-50/30 shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => toggleMonth(monthGroup.monthKey)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-violet-50/40 sm:px-5"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold capitalize text-slate-900">
                                  {monthGroup.monthLabel}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {monthGroup.byActeur.length} acteur
                                  {monthGroup.byActeur.length > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Badge variant="secondary" className="tabular-nums">
                                {monthGroup.totalCount}
                              </Badge>
                              {isCollapsed ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronUp className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                          </button>
                          {!isCollapsed && (
                            <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5">
                              {monthGroup.byActeur.map((acteurGroup) => {
                                const acteurMeta = acteurs.find(
                                  (a) => a.userId === acteurGroup.userId
                                );
                                return (
                                  <div key={`${monthGroup.monthKey}-${acteurGroup.userId}`}>
                                    <div className="mb-3 flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{
                                          backgroundColor: acteurMeta?.color ?? "#64748b",
                                        }}
                                      />
                                      <p className="text-sm font-semibold text-slate-800">
                                        {acteurGroup.acteurName}
                                      </p>
                                      <Badge variant="outline" className="text-[10px] tabular-nums">
                                        {acteurGroup.publications.length}
                                      </Badge>
                                    </div>
                                    <PublicationTable publications={acteurGroup.publications} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
