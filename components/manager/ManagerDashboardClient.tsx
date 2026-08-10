"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Container,
  FileSpreadsheet,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Package,
  PieChart as PieChartIcon,
  Ship,
  Sparkles,
  TrendingUp,
  Truck,
  TriangleAlert,
  Warehouse,
  Wrench,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgendaDuJourMarquee } from "@/components/manager/AgendaDuJourMarquee";
import type { ChartDatum, ManagerDashboardData } from "@/lib/actions/manager-dashboard";

type Props = {
  data: ManagerDashboardData;
};

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(255,255,255,0.98)",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow: "0 20px 50px -12px rgb(15 23 42 / 0.18)",
  padding: "12px 16px",
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
            className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
            style={{ backgroundColor: entry.payload.color }}
          />
          {entry.name}
        </span>
        <span className="font-bold tabular-nums text-slate-900">{entry.value}</span>
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  {
    href: "/manager/agenda",
    label: "Agenda",
    description: "Planning & activités",
    icon: CalendarDays,
    gradient: "from-indigo-500 to-violet-600",
    glow: "group-hover:shadow-indigo-200/60",
    category: "Principal",
  },
  {
    href: "/manager/sistre",
    label: "SISTRE Facture",
    description: "Facturation & contrats",
    icon: FileSpreadsheet,
    gradient: "from-sky-500 to-blue-600",
    glow: "group-hover:shadow-sky-200/60",
    category: "Principal",
  },
  {
    href: "/manager/commandes",
    label: "Commandes",
    description: "Suivi des commandes",
    icon: ClipboardList,
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-200/60",
    category: "Commandes",
  },
  {
    href: "/manager/tableau-commandes",
    label: "Tableau commandes",
    description: "Vue synthèse globale",
    icon: LayoutDashboard,
    gradient: "from-cyan-500 to-teal-600",
    glow: "group-hover:shadow-cyan-200/60",
    category: "Commandes",
  },
  {
    href: "/manager/listeConteneurs",
    label: "Conteneurs chargés",
    description: "Liste & détails",
    icon: Container,
    gradient: "from-emerald-500 to-green-600",
    glow: "group-hover:shadow-emerald-200/60",
    category: "Commandes",
  },
  {
    href: "/manager/conteneur-transit",
    label: "Conteneurs transit",
    description: "Suivi du transit",
    icon: Ship,
    gradient: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-200/60",
    category: "Commandes",
  },
  {
    href: "/manager/conteneur-arrives",
    label: "Conteneurs arrivés",
    description: "Réception & contrôle",
    icon: Truck,
    gradient: "from-blue-500 to-indigo-600",
    glow: "group-hover:shadow-blue-200/60",
    category: "Commandes",
  },
  {
    href: "/manager/reclamationpieces",
    label: "Réclamations pièces",
    description: "Suivi des anomalies",
    icon: TriangleAlert,
    gradient: "from-rose-500 to-red-600",
    glow: "group-hover:shadow-rose-200/60",
    category: "Commandes",
  },
  {
    href: "/manager/ordre-montage",
    label: "Ordre montage",
    description: "Opérations atelier",
    icon: Wrench,
    gradient: "from-orange-500 to-amber-600",
    glow: "group-hover:shadow-orange-200/60",
    category: "Opérations",
  },
  {
    href: "/manager/rapportmontages",
    label: "Rapport montages",
    description: "Analyse & rapports",
    icon: FileSpreadsheet,
    gradient: "from-slate-600 to-slate-800",
    glow: "group-hover:shadow-slate-200/60",
    category: "Rapports",
  },
  {
    href: "/manager/numero-courrier",
    label: "Numéro courrier",
    description: "Courriers entrants/sortants",
    icon: Mail,
    gradient: "from-fuchsia-500 to-pink-600",
    glow: "group-hover:shadow-fuchsia-200/60",
    category: "Communication",
  },
  {
    href: "/manager/messages",
    label: "Messages",
    description: "Communication interne",
    icon: MessageSquare,
    gradient: "from-purple-500 to-violet-600",
    glow: "group-hover:shadow-purple-200/60",
    category: "Communication",
  },
] as const;

function PipelineStep({
  label,
  value,
  href,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  accent: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-1 flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md transition-transform group-hover:scale-105`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-950">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
      </div>
      <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-300 opacity-0 transition-all group-hover:opacity-100 group-hover:text-indigo-500" />
    </Link>
  );
}

export default function ManagerDashboardClient({ data }: Props) {
  const { user } = useUser();
  const userLabel = user?.firstName || user?.username || "Manager";
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const kpiCards = [
    {
      label: "Commandes",
      value: data.totalCommandes,
      sub: `${data.commandesVendues} vendues · ${data.commandesDisponibles} dispo.`,
      icon: Package,
      accent: "from-amber-500 via-orange-500 to-rose-500",
      iconBg: "bg-amber-50 text-amber-700",
    },
    {
      label: "Conteneurs transit",
      value: data.conteneursTransit,
      sub: `${data.conteneursCharges} chargés en attente`,
      icon: Ship,
      accent: "from-violet-500 via-purple-500 to-fuchsia-500",
      iconBg: "bg-violet-50 text-violet-700",
    },
    {
      label: "Conteneurs arrivés",
      value: data.conteneursArrives,
      sub: "Réception & dépotage",
      icon: Truck,
      accent: "from-emerald-500 via-teal-500 to-cyan-500",
      iconBg: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Agenda aujourd'hui",
      value: data.agendaToday,
      sub: `${data.montagesActifs} montage(s) actif(s)`,
      icon: CalendarDays,
      accent: "from-indigo-500 via-blue-500 to-sky-500",
      iconBg: "bg-indigo-50 text-indigo-700",
    },
  ];

  const categories = [...new Set(QUICK_LINKS.map((l) => l.category))];

  const hasMonthlyData = data.monthlyTrends.some(
    (m) => m.commandes > 0 || m.conteneurs > 0 || m.montagesTermines > 0
  );

  const totalConteneurs = data.conteneurPipelineChart.reduce((sum, d) => sum + d.value, 0);
  const tauxVente =
    data.totalCommandes > 0
      ? Math.round((data.commandesVendues / data.totalCommandes) * 100)
      : 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_24%),linear-gradient(to_bottom,#f8fafc,#ffffff_40%,#f1f5f9)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(129,140,248,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.14),transparent_30%)]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                Manager · Tableau de bord opérations
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Warehouse className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Bonjour, {userLabel}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Pilotez vos commandes, conteneurs et opérations atelier depuis une vue
                    unifiée, claire et actionnable.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-300" />
                  {todayLabel}
                </span>
                {data.montagesActifs > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-xs font-medium text-orange-100">
                    <Wrench className="h-3.5 w-3.5" />
                    {data.montagesActifs} montage(s) en cours
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Données synchronisées
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col lg:items-stretch">
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl border-0 bg-white px-6 text-indigo-950 shadow-xl shadow-black/20 hover:bg-blue-50 sm:w-auto"
              >
                <Link href="/manager/tableau-commandes">
                  Tableau commandes
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/manager/agenda">
                  Ouvrir l&apos;agenda
                  <CalendarDays className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.label}
                className="group overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/70"
              >
                <div className={`h-1 bg-gradient-to-r ${kpi.accent}`} />
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
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

        <div className="mt-8 space-y-8 pb-10 sm:mt-10 sm:space-y-10 sm:pb-12">
          {/* Statistiques & graphiques */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Activité opérationnelle
                    </CardTitle>
                    <CardDescription>
                      Commandes, conteneurs et montages (6 derniers mois)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {hasMonthlyData ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.monthlyTrends} barGap={4}>
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
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                      <Legend />
                      <Bar
                        dataKey="commandes"
                        name="Commandes"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="conteneurs"
                        name="Conteneurs"
                        fill="#7c3aed"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="montagesTermines"
                        name="Montages terminés"
                        fill="#059669"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucune activité enregistrée sur la période." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Container className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Pipeline conteneurs
                    </CardTitle>
                    <CardDescription>
                      {totalConteneurs} conteneur(s) suivis · répartition par étape
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.conteneurPipelineChart.length > 0 ? (
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data.conteneurPipelineChart}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {data.conteneurPipelineChart.map((entry) => (
                            <Cell key={entry.label} fill={entry.color} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full space-y-2 sm:max-w-[180px]">
                      {data.conteneurPipelineChart.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-slate-900">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyChart message="Aucun conteneur enregistré." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <PieChartIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Répartition commandes
                    </CardTitle>
                    <CardDescription>
                      {tauxVente}% vendues · {data.commandesDisponibles} disponible(s)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.commandesByFlag.length > 0 ? (
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={data.commandesByFlag}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={4}
                        >
                          {data.commandesByFlag.map((entry) => (
                            <Cell key={entry.label} fill={entry.color} stroke="white" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full space-y-2 sm:max-w-[180px]">
                      {data.commandesByFlag.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-slate-900">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyChart message="Aucune commande enregistrée." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Montages par étape
                    </CardTitle>
                    <CardDescription>
                      {data.montagesActifs} actif(s) · suivi atelier
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.montageByEtape.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.montageByEtape} layout="vertical" barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={90}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(148,163,184,0.08)" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const item = payload[0].payload as ChartDatum;
                          return (
                            <div style={TOOLTIP_STYLE}>
                              <div className="flex items-center justify-between gap-6 text-sm">
                                <span className="text-slate-700">{item.label}</span>
                                <span className="font-bold tabular-nums text-slate-900">
                                  {item.value}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="value" name="Montages" radius={[0, 6, 6, 0]}>
                        {data.montageByEtape.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun montage enregistré." />
                )}
              </CardContent>
            </Card>
          </section>

          {/* Évolution mensuelle — courbe */}
          {hasMonthlyData && (
            <section>
              <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
                <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Tendance mensuelle
                      </CardTitle>
                      <CardDescription>
                        Évolution des commandes et conteneurs sur 6 mois
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data.monthlyTrends}>
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
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="commandes"
                        name="Commandes"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ fill: "#2563eb", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="conteneurs"
                        name="Conteneurs"
                        stroke="#7c3aed"
                        strokeWidth={2.5}
                        dot={{ fill: "#7c3aed", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Pipeline conteneurs */}
          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Pipeline conteneurs
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Suivi en temps réel des étapes logistiques
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PipelineStep
                label="Chargés"
                value={data.conteneursCharges}
                href="/manager/listeConteneurs"
                accent="from-emerald-500 to-teal-600"
                icon={Container}
              />
              <div className="hidden items-center sm:flex">
                <div className="h-px w-6 bg-gradient-to-r from-slate-200 to-slate-300" />
              </div>
              <PipelineStep
                label="En transit"
                value={data.conteneursTransit}
                href="/manager/conteneur-transit"
                accent="from-violet-500 to-purple-600"
                icon={Ship}
              />
              <div className="hidden items-center sm:flex">
                <div className="h-px w-6 bg-gradient-to-r from-slate-200 to-slate-300" />
              </div>
              <PipelineStep
                label="Arrivés"
                value={data.conteneursArrives}
                href="/manager/conteneur-arrives"
                accent="from-blue-500 to-indigo-600"
                icon={Truck}
              />
            </div>
          </section>

          {/* Agenda du jour */}
          <section>
            <AgendaDuJourMarquee />
          </section>

          {/* Quick access by category */}
          {categories.map((category) => {
            const links = QUICK_LINKS.filter((l) => l.category === category);
            return (
              <section key={category}>
                <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
                  <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-slate-900">{category}</CardTitle>
                    <CardDescription>
                      Accès rapide aux sections {category.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {links.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${link.glow}`}
                          >
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient} text-white shadow-md transition-transform group-hover:scale-105`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">{link.label}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                {link.description}
                              </p>
                            </div>
                            <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-300 opacity-0 transition-all group-hover:opacity-100 group-hover:text-indigo-500" />
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
