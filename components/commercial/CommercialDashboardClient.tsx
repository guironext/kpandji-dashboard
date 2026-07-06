"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  Car,
  ClipboardList,
  Eye,
  FileText,
  MessageSquare,
  Receipt,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
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
import type { CommercialDashboardData } from "@/lib/actions/commercial-dashboard";

type Props = {
  data: CommercialDashboardData;
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
    href: "/commercial/prospects",
    label: "Prospects",
    description: "Gérer vos prospects",
    icon: UserCheck,
    gradient: "from-sky-500 to-blue-600",
    glow: "group-hover:shadow-sky-200/60",
  },
  {
    href: "/commercial/rendez-vous",
    label: "Rendez-vous",
    description: "Planifier vos RDV",
    icon: CalendarDays,
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-200/60",
  },
  {
    href: "/commercial/proformas",
    label: "Proformas",
    description: "Créer et suivre",
    icon: FileText,
    gradient: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-200/60",
  },
  {
    href: "/commercial/objectifs",
    label: "Mes objectifs",
    description: "Suivi des cibles",
    icon: Target,
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-200/60",
  },
  {
    href: "/commercial/statistiques",
    label: "Performances",
    description: "Analyses détaillées",
    icon: BarChart3,
    gradient: "from-rose-500 to-pink-600",
    glow: "group-hover:shadow-rose-200/60",
  },
  {
    href: "/commercial/suivi-commandes",
    label: "Suivi commandes",
    description: "Commandes en cours",
    icon: ClipboardList,
    gradient: "from-indigo-500 to-blue-600",
    glow: "group-hover:shadow-indigo-200/60",
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

export default function CommercialDashboardClient({ data }: Props) {
  const { stats, userLabel } = data;
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const kpiCards = [
    {
      label: "Prospects",
      value: stats.prospectsTotal,
      sub: `${stats.favorableTotal} favorable(s)`,
      icon: UserCheck,
      accent: "from-sky-500 via-blue-500 to-indigo-500",
      iconBg: "bg-sky-50 text-sky-700",
      href: "/commercial/prospects",
    },
    {
      label: "Clients",
      value: stats.clientsTotal,
      sub: "Base clients active",
      icon: Users,
      accent: "from-emerald-500 via-green-500 to-teal-500",
      iconBg: "bg-emerald-50 text-emerald-700",
      href: "/commercial/clients",
    },
    {
      label: "Rendez-vous",
      value: stats.rendezVousTotal,
      sub: `${stats.rendezVousAvenir} à venir · ${stats.rendezVousMois} ce mois`,
      icon: CalendarDays,
      accent: "from-amber-500 via-orange-500 to-rose-500",
      iconBg: "bg-amber-50 text-amber-700",
      href: "/commercial/rendez-vous",
    },
    {
      label: "Proformas",
      value: stats.proformasEnAttente + stats.proformasValidees,
      sub: `${stats.proformasEnAttente} en attente · ${stats.proformasValidees} validées`,
      icon: FileText,
      accent: "from-violet-500 via-purple-500 to-fuchsia-500",
      iconBg: "bg-violet-50 text-violet-700",
      href: "/commercial/proformas",
    },
    {
      label: "Chiffre d'affaires",
      value: formatCurrency(stats.caMois),
      sub: `Total : ${formatCurrency(stats.caTotal)}`,
      icon: TrendingUp,
      accent: "from-rose-500 via-pink-500 to-fuchsia-500",
      iconBg: "bg-rose-50 text-rose-700",
      href: "/commercial/statistiques",
    },
    {
      label: "Rapports & chutes",
      value: stats.rapportsTotal,
      sub: `${stats.chutesTotal} chute(s) enregistrée(s)`,
      icon: TrendingDown,
      accent: "from-slate-600 via-slate-500 to-zinc-500",
      iconBg: "bg-slate-50 text-slate-700",
      href: "/commercial/tableau-chute",
    },
    {
      label: "Factures en attente",
      value: stats.facturesEnAttente,
      sub: "À valider ou traiter",
      icon: Receipt,
      accent: "from-cyan-500 via-sky-500 to-blue-500",
      iconBg: "bg-cyan-50 text-cyan-700",
      href: "/commercial/proformas",
    },
    {
      label: "Messages",
      value: stats.messagesNonLus,
      sub: "Non lus",
      icon: MessageSquare,
      accent: "from-indigo-500 via-violet-500 to-purple-500",
      iconBg: "bg-indigo-50 text-indigo-700",
      href: "/commercial/messages",
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,88,12,0.08),transparent_24%),linear-gradient(to_bottom,#f8fafc,#ffffff_40%,#f1f5f9)]"
        aria-hidden
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-orange-950 to-amber-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(245,158,11,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(234,88,12,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.12),transparent_30%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-amber-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Commercial · Tableau de bord
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Car className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Bonjour, {userLabel}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Vue d&apos;ensemble de vos prospects, rendez-vous, ventes et performances
                    commerciales.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-amber-300" />
                  {todayLabel}
                </span>
                {stats.currentPeriodLabel && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                    <Target className="h-3.5 w-3.5" />
                    Période : {stats.currentPeriodLabel}
                  </span>
                )}
                {stats.rendezVousAvenir > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-100">
                    <Eye className="h-3.5 w-3.5" />
                    {stats.rendezVousAvenir} RDV à venir
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl border-0 bg-white px-6 text-orange-950 shadow-xl shadow-black/20 hover:bg-amber-50 sm:w-auto"
              >
                <Link href="/commercial/prospects">
                  Nouveau prospect
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/commercial/rendez-vous">
                  Planifier un RDV
                  <CalendarDays className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <div className="mt-8 space-y-8 pb-10 sm:mt-10 sm:space-y-10 sm:pb-12">
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
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
              <CardContent>
                {monthlyChartData.some((m) => m.total > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
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
                        fill="#16a34a"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun client ou prospect enregistré." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-sky-500 to-blue-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Rendez-vous mensuels
                    </CardTitle>
                    <CardDescription>Évolution sur les 6 derniers mois</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rdvTrendData.some((m) => m.rendezVous > 0) ? (
                  <ResponsiveContainer width="100%" height={280}>
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
                        stroke="#0284c7"
                        strokeWidth={3}
                        dot={{ fill: "#0284c7", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun rendez-vous enregistré." />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Répartition par secteur
                    </CardTitle>
                    <CardDescription>Top secteurs d&apos;activité</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.secteurChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data.secteurChart}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {data.secteurChart.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun secteur renseigné." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
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

          {data.objectifProgress.length > 0 && (
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-600" />
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Progression des objectifs
                      </CardTitle>
                      <CardDescription>Cibles financières et véhicules</CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <Link href="/commercial/objectifs">
                      Voir tout
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.objectifProgress.map((obj) => {
                    const pct = Math.min(100, Math.max(0, obj.pourcentage));
                    return (
                      <div
                        key={obj.label}
                        className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">{obj.label}</p>
                          <Badge variant="secondary" className="tabular-nums">
                            {pct}%
                          </Badge>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {obj.atteint} / {obj.cible} atteint
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Prochains rendez-vous
                      </CardTitle>
                      <CardDescription>À venir</CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="rounded-xl">
                    <Link href="/commercial/rendez-vous">Tout voir</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {data.upcomingRendezVous.length > 0 ? (
                  <ul className="space-y-3">
                    {data.upcomingRendezVous.map((rdv) => (
                      <li
                        key={rdv.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-amber-200 hover:shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{rdv.clientName}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(rdv.date), "EEEE d MMM · HH:mm", { locale: fr })}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 capitalize">
                          {rdv.statut}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyChart message="Aucun rendez-vous à venir." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Derniers prospects
                      </CardTitle>
                      <CardDescription>Ajoutés récemment</CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="rounded-xl">
                    <Link href="/commercial/prospects">Tout voir</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {data.recentProspects.length > 0 ? (
                  <ul className="space-y-3">
                    {data.recentProspects.map((p) => (
                      <li
                        key={`${p.type}-${p.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-sky-200 hover:shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {p.secteur} ·{" "}
                            {format(new Date(p.createdAt), "d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 capitalize"
                        >
                          {p.type}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyChart message="Aucun prospect récent." />
                )}
              </CardContent>
            </Card>
          </section>

          <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
            <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Accès rapide</CardTitle>
              <CardDescription>
                Raccourcis vers vos outils commerciaux essentiels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg ${link.glow}`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${link.gradient} transition group-hover:scale-105`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 group-hover:text-orange-700">
                          {link.label}
                        </p>
                        <p className="truncate text-sm text-slate-500">{link.description}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-orange-600" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
