"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  ClipboardList,
  Crown,
  FileText,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Receipt,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getResponsableDashboard,
  type ResponsableDashboardData,
} from "@/lib/actions/responsable-dashboard";

type Props = {
  initialData: ResponsableDashboardData;
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
    href: "/responsablecommercial/objectifs",
    label: "Objectifs",
    description: "Définir et suivre les objectifs",
    icon: Target,
    gradient: "from-indigo-500 to-violet-600",
    glow: "group-hover:shadow-indigo-200/60",
  },
  {
    href: "/responsablecommercial/calendrier-sortie",
    label: "Calendrier Sortie",
    description: "Planifier les sorties commerciales",
    icon: CalendarRange,
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-200/60",
  },
  {
    href: "/responsablecommercial/tableau-chute",
    label: "Tableau de Chute",
    description: "Rendez-vous en chute par commercial",
    icon: TrendingDown,
    gradient: "from-rose-500 to-red-600",
    glow: "group-hover:shadow-rose-200/60",
  },
  {
    href: "/responsablecommercial/performences",
    label: "Performances",
    description: "Analyses et rapports par commercial",
    icon: Activity,
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-200/60",
  },
  {
    href: "/responsablecommercial/prospects",
    label: "Prospects",
    description: "Gérer les prospects de l'équipe",
    icon: UserCheck,
    gradient: "from-sky-500 to-blue-600",
    glow: "group-hover:shadow-sky-200/60",
  },
  {
    href: "/responsablecommercial/suivi-commandes",
    label: "Suivi Commandes",
    description: "Suivre les commandes en cours",
    icon: ClipboardList,
    gradient: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-200/60",
  },
  {
    href: "/responsablecommercial/proformas",
    label: "Proformas",
    description: "Proformas en attente de validation",
    icon: FileText,
    gradient: "from-pink-500 to-rose-600",
    glow: "group-hover:shadow-pink-200/60",
  },
  {
    href: "/responsablecommercial/cout-rendez-vous",
    label: "Coût Rendez-vous",
    description: "Analyse des coûts par rendez-vous",
    icon: BarChart3,
    gradient: "from-cyan-500 to-blue-600",
    glow: "group-hover:shadow-cyan-200/60",
  },
] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default function ResponsableCommercialDashboardClient({ initialData }: Props) {
  const { user } = useUser();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { stats } = data;
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const userLabel =
    user?.firstName?.trim() ||
    user?.fullName?.trim()?.split(" ")[0] ||
    "Responsable commercial";
  const totalObjectifs =
    stats.objectifsCibleCount + stats.objectifsFinancieresCount + stats.objectifsVehiculesCount;

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getResponsableDashboard();
    if (!result.success || !result.data) {
      setError(result.error ?? "Échec du chargement");
    } else {
      setData(result.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  const kpiCards = [
    {
      label: "Commerciaux",
      value: stats.commercialsCount,
      sub: "Conseillers actifs",
      icon: Users,
      accent: "from-blue-500 via-indigo-500 to-violet-500",
      iconBg: "bg-blue-50 text-blue-700",
      href: "/responsablecommercial/performences",
    },
    {
      label: "Prospects",
      value: stats.prospectsCount,
      sub: "Particuliers et entreprises",
      icon: UserCheck,
      accent: "from-sky-500 via-blue-500 to-indigo-500",
      iconBg: "bg-sky-50 text-sky-700",
      href: "/responsablecommercial/prospects",
    },
    {
      label: "Clients",
      value: stats.clientsCount,
      sub: "Base clients active",
      icon: Users,
      accent: "from-emerald-500 via-green-500 to-teal-500",
      iconBg: "bg-emerald-50 text-emerald-700",
      href: "/responsablecommercial/clients",
    },
    {
      label: "Rapports RDV",
      value: stats.totalRapports,
      sub: `${stats.totalRapportsProspects} prospects · ${stats.totalRapportsClients} clients`,
      icon: ClipboardList,
      accent: "from-violet-500 via-purple-500 to-fuchsia-500",
      iconBg: "bg-violet-50 text-violet-700",
      href: "/responsablecommercial/rapport-rendez-vous",
    },
    {
      label: "Chutes",
      value: stats.totalChutes,
      sub: `${stats.totalCommercialsWithChutes} commercial(aux) concerné(s)`,
      icon: TrendingDown,
      accent: "from-amber-500 via-orange-500 to-rose-500",
      iconBg: "bg-amber-50 text-amber-700",
      href: "/responsablecommercial/tableau-chute",
    },
    {
      label: "Chiffre d'affaires",
      value: formatCurrency(stats.caMois),
      sub: `Total : ${formatCurrency(stats.caTotal)}`,
      icon: TrendingUp,
      accent: "from-rose-500 via-pink-500 to-fuchsia-500",
      iconBg: "bg-rose-50 text-rose-700",
      href: "/responsablecommercial/performences",
    },
    {
      label: "Proformas",
      value: stats.proformasEnAttente,
      sub: "En attente de validation",
      icon: FileText,
      accent: "from-pink-500 via-rose-500 to-red-500",
      iconBg: "bg-pink-50 text-pink-700",
      href: "/responsablecommercial/proformas",
    },
    {
      label: "Objectifs",
      value: totalObjectifs,
      sub: `${stats.periodsCount} période(s) · cibles, financiers, véhicules`,
      icon: Target,
      accent: "from-indigo-500 via-violet-500 to-purple-500",
      iconBg: "bg-indigo-50 text-indigo-700",
      href: "/responsablecommercial/objectifs",
    },
  ];

  const monthlyChartData = data.monthlyTrends.map((m) => ({
    ...m,
    total: m.clients + m.clientEntreprises,
  }));

  const rdvTrendData = data.monthlyTrends.map((m) => ({
    monthShort: m.monthShort,
    rendezVous: m.rendezVous,
  }));

  const caTrendData = data.monthlyTrends.map((m) => ({
    monthShort: m.monthShort,
    ca: m.ca,
  }));

  const topChuteCommercial = data.chutesByCommercial[0];
  const conversionRate =
    stats.prospectsCount + stats.clientsCount > 0
      ? Math.round((stats.clientsCount / (stats.prospectsCount + stats.clientsCount)) * 100)
      : 0;

  return (
    <div className="relative -mx-4 -mt-4 min-h-screen overflow-hidden bg-[#f8fafc] sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_24%),linear-gradient(to_bottom,#f8fafc,#ffffff_40%,#f1f5f9)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.12),transparent_30%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-32 sm:pt-10 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                Responsable Commercial · Tableau de bord
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
                    Pilotez votre équipe commerciale : performances, objectifs, chutes et activité
                    depuis une vue unifiée.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                  <CalendarRange className="h-3.5 w-3.5 text-blue-300" />
                  {todayLabel}
                </span>
                {stats.currentPeriodLabel && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-100">
                    <Target className="h-3.5 w-3.5" />
                    Période : {stats.currentPeriodLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Données synchronisées
                </span>
                {stats.facturesEnAttenteCount > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                    <Receipt className="h-3.5 w-3.5" />
                    {stats.facturesEnAttenteCount} facture(s) en attente
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Button
                size="lg"
                onClick={() => void loadData()}
                disabled={loading}
                className="rounded-2xl border-0 bg-white px-6 text-indigo-950 shadow-xl shadow-black/20 hover:bg-blue-50"
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
                <Link href="/responsablecommercial/performences">
                  Voir les performances
                  <Activity className="ml-2 h-4 w-4" />
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
              <Link key={kpi.label} href={kpi.href} className="group block">
                <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/70">
                  <div className={`h-1 bg-gradient-to-r ${kpi.accent}`} />
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          {kpi.label}
                        </p>
                        <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-2xl">
                          {kpi.value}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
                      </div>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11 ${kpi.iconBg} transition-transform group-hover:scale-105`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 space-y-10 pb-12">
          {error && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

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
              eyebrow="Activité"
              title="Tendances sur 6 mois"
              description="Clients, rendez-vous et chiffre d'affaires de l'équipe."
              action={
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700"
                >
                  {conversionRate}% taux de conversion clients
                </Badge>
              }
            />
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl xl:col-span-8">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Activité clients
                    </CardTitle>
                    <CardDescription>
                      Nouveaux clients et prospects (6 derniers mois)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-6 sm:p-6">
                {monthlyChartData.some((m) => m.total > 0) ? (
                  <div className="h-[280px] w-full sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} barGap={4}>
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
                        dataKey="clients"
                        name="Particuliers"
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="clientEntreprises"
                        name="Entreprises"
                        fill="#059669"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart message="Aucun client ou prospect enregistré." />
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:col-span-4">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Rendez-vous mensuels
                    </CardTitle>
                    <CardDescription>Évolution sur les 6 derniers mois</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {rdvTrendData.some((m) => m.rendezVous > 0) ? (
                  <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rdvTrendData}>
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
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="rendezVous"
                        name="Rendez-vous"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        dot={{ fill: "#4f46e5", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart message="Aucun rendez-vous enregistré." />
                )}
              </CardContent>
            </Card>

            {topChuteCommercial && (
              <div className="relative overflow-hidden rounded-[1.35rem] border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-5 shadow-lg shadow-amber-100/50">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                      <Crown className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                      Plus de chutes (période)
                    </p>
                  </div>
                  <p className="mt-4 truncate text-xl font-bold text-amber-950">
                    {topChuteCommercial.label}
                  </p>
                  <p className="mt-1 text-sm text-amber-800/80">
                    {topChuteCommercial.value} chute{topChuteCommercial.value > 1 ? "s" : ""} enregistrée
                    {topChuteCommercial.value > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
            </div>
          </section>
          </section>

          <section className="space-y-5">
            <SectionHeading
              eyebrow="Performance"
              title="Analyses commerciales"
              description="Chutes, rapports, objectifs et facturation."
            />
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Chutes par commercial
                      </CardTitle>
                      <CardDescription>Période objectif en cours</CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <Link href="/responsablecommercial/tableau-chute">
                      Détail
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {data.chutesByCommercial.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.chutesByCommercial} layout="vertical" margin={{ left: 8 }}>
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
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" name="Chutes" radius={[0, 6, 6, 0]}>
                        {data.chutesByCommercial.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucune chute enregistrée sur la période." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Rapports de rendez-vous
                    </CardTitle>
                    <CardDescription>Répartition prospects / clients</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.rapportBreakdown.length > 0 ? (
                  <>
                  <div className="relative mx-auto h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.rapportBreakdown}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={4}
                        stroke="white"
                        strokeWidth={3}
                      >
                        {data.rapportBreakdown.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold tabular-nums text-slate-900">{stats.totalRapports}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total</p>
                  </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.rapportBreakdown.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <span className="font-bold tabular-nums text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  </>
                ) : (
                  <EmptyChart message="Aucun rapport de rendez-vous enregistré." />
                )}
              </CardContent>
            </Card>
          </section>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Chiffre d&apos;affaires mensuel
                    </CardTitle>
                    <CardDescription>Factures validées — 6 derniers mois</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {caTrendData.some((m) => m.ca > 0) ? (
                  <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={caTrendData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="caFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e11d48" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#e11d48" stopOpacity={0.02} />
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
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          new Intl.NumberFormat("fr-FR", {
                            notation: "compact",
                            maximumFractionDigits: 0,
                          }).format(v)
                        }
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value) => [formatCurrency(Number(value)), "CA"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="ca"
                        stroke="#e11d48"
                        strokeWidth={2.5}
                        fill="url(#caFill)"
                        dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#e11d48" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart message="Aucune facture validée sur la période." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Objectifs définis
                    </CardTitle>
                    <CardDescription>Cibles, financiers et véhicules</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.objectifsBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.objectifsBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="label"
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
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" name="Objectifs" radius={[6, 6, 0, 0]}>
                        {data.objectifsBreakdown.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun objectif défini." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Factures par statut
                    </CardTitle>
                    <CardDescription>Proformas, factures et paiements</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.facturesByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.facturesByStatus} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={100}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {data.facturesByStatus.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucune facture enregistrée." />
                )}
              </CardContent>
            </Card>
          </section>

          <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
            <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">Accès rapide</CardTitle>
                  <CardDescription>
                    Sections principales pour la coordination commerciale
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href} className="group">
                      <div
                        className={`relative overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white p-4 shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:border-slate-300 ${link.glow} hover:shadow-xl`}
                      >
                        <div
                          className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${link.gradient} opacity-10 blur-2xl transition group-hover:opacity-20`}
                        />
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${link.gradient} text-white shadow-lg`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{link.label}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{link.description}</p>
                            </div>
                          </div>
                          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-600" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-2">
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 shadow-lg shadow-indigo-200/60 hover:from-blue-600/95 hover:to-indigo-600/95"
            >
              <Link href="/responsablecommercial/objectifs">
                Gérer les objectifs de l&apos;équipe
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
