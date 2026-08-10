"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarDays,
  CarFront,
  CircleCheck,
  ClipboardList,
  FileText,
  Package,
  Receipt,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SavDashboardData } from "@/lib/actions/sav-dashboard";

type Props = {
  data: SavDashboardData;
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
    href: "/sav/clientsav",
    label: "Clients SAV",
    description: "Gérer les clients",
    icon: Users,
    gradient: "from-teal-500 to-cyan-600",
    glow: "group-hover:shadow-teal-200/60",
  },
  {
    href: "/sav/diagnostique-arrivee",
    label: "Diagnostic arrivée",
    description: "Contrôle à l'entrée",
    icon: ClipboardList,
    gradient: "from-sky-500 to-blue-600",
    glow: "group-hover:shadow-sky-200/60",
  },
  {
    href: "/sav/voiture-reparation",
    label: "Voiture réparation",
    description: "Suivi atelier",
    icon: CarFront,
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-200/60",
  },
  {
    href: "/sav/maintenance",
    label: "Maintenance",
    description: "Interventions en cours",
    icon: Wrench,
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-200/60",
  },
  {
    href: "/sav/teste-final",
    label: "Teste final",
    description: "Contrôle qualité",
    icon: CircleCheck,
    gradient: "from-cyan-500 to-teal-600",
    glow: "group-hover:shadow-cyan-200/60",
  },
  {
    href: "/sav/proforma-sav",
    label: "Proforma SAV",
    description: "Devis & proformas",
    icon: FileText,
    gradient: "from-violet-500 to-purple-600",
    glow: "group-hover:shadow-violet-200/60",
  },
  {
    href: "/sav/facturation-sav",
    label: "Facturation",
    description: "Factures & paiements",
    icon: Receipt,
    gradient: "from-rose-500 to-pink-600",
    glow: "group-hover:shadow-rose-200/60",
  },
  {
    href: "/sav/gestion-pieces-sav",
    label: "Pièces SAV",
    description: "Stock & mouvements",
    icon: Boxes,
    gradient: "from-indigo-500 to-blue-600",
    glow: "group-hover:shadow-indigo-200/60",
  },
  {
    href: "/sav/personnel-sav",
    label: "Personnel SAV",
    description: "Équipes & groupes",
    icon: UserCog,
    gradient: "from-slate-600 to-zinc-700",
    glow: "group-hover:shadow-slate-200/60",
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

export default function SavDashboardClient({ data }: Props) {
  const { user } = useUser();
  const { stats } = data;
  const userLabel = user?.firstName || user?.username || "Technicien";
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const kpiCards = [
    {
      label: "Clients SAV",
      value: stats.clientsTotal,
      sub: `${stats.voituresTotal} véhicule(s) enregistré(s)`,
      icon: Users,
      accent: "from-teal-500 via-cyan-500 to-sky-500",
      iconBg: "bg-teal-50 text-teal-700",
      href: "/sav/clientsav",
    },
    {
      label: "Véhicules en atelier",
      value: stats.voituresEnAtelier,
      sub: `${stats.voituresTerminees} terminé(s) · ${stats.voituresTotal} total`,
      icon: CarFront,
      accent: "from-emerald-500 via-green-500 to-teal-500",
      iconBg: "bg-emerald-50 text-emerald-700",
      href: "/sav/voiture-reparation",
    },
    {
      label: "Réparations",
      value: stats.reparationsTotal,
      sub: `${stats.reparationsEnCours} en cours · ${stats.diagnosticsTotal} diagnostic(s)`,
      icon: Wrench,
      accent: "from-amber-500 via-orange-500 to-rose-500",
      iconBg: "bg-amber-50 text-amber-700",
      href: "/sav/voiture-reparation",
    },
    {
      label: "Maintenances",
      value: stats.maintenancesTotal,
      sub: `${stats.maintenancesEnCours} en cours`,
      icon: ClipboardList,
      accent: "from-sky-500 via-blue-500 to-indigo-500",
      iconBg: "bg-sky-50 text-sky-700",
      href: "/sav/maintenance",
    },
    {
      label: "Pièces SAV",
      value: stats.piecesTotal,
      sub:
        stats.piecesStockFaible > 0
          ? `${stats.piecesStockFaible} stock faible (≤ 5)`
          : "Stock disponible",
      icon: Package,
      accent: "from-indigo-500 via-violet-500 to-purple-500",
      iconBg: "bg-indigo-50 text-indigo-700",
      href: "/sav/gestion-pieces-sav",
    },
    {
      label: "Facturation",
      value: stats.facturesTotal,
      sub: `${stats.facturesEnAttente} en attente`,
      icon: Receipt,
      accent: "from-rose-500 via-pink-500 to-fuchsia-500",
      iconBg: "bg-rose-50 text-rose-700",
      href: "/sav/facturation-sav",
    },
    {
      label: "Chiffre d'affaires",
      value: formatCurrency(stats.caMois),
      sub: `Total : ${formatCurrency(stats.caTotal)}`,
      icon: TrendingUp,
      accent: "from-cyan-500 via-teal-500 to-emerald-500",
      iconBg: "bg-cyan-50 text-cyan-700",
      href: "/sav/facturation-sav",
    },
    {
      label: "Personnel SAV",
      value: stats.personnelTotal,
      sub: "Techniciens & groupes",
      icon: UserCog,
      accent: "from-slate-600 via-slate-500 to-zinc-500",
      iconBg: "bg-slate-50 text-slate-700",
      href: "/sav/personnel-sav",
    },
  ];

  const monthlyChartData = data.monthlyTrends;

  const caTrendData = data.monthlyTrends.map((m) => ({
    monthShort: m.monthShort,
    activite: m.voitures + m.reparations,
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(8,145,178,0.08),transparent_24%),linear-gradient(to_bottom,#f8fafc,#ffffff_40%,#f1f5f9)]"
        aria-hidden
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(13,148,136,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(8,145,178,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.12),transparent_30%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                SAV · Tableau de bord
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Wrench className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Bonjour, {userLabel}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Vue d&apos;ensemble de l&apos;atelier : véhicules, diagnostics, réparations,
                    pièces et facturation SAV.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-teal-300" />
                  {todayLabel}
                </span>
                {stats.voituresEnAtelier > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                    <CarFront className="h-3.5 w-3.5" />
                    {stats.voituresEnAtelier} véhicule(s) en atelier
                  </span>
                )}
                {stats.piecesStockFaible > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-100">
                    <Package className="h-3.5 w-3.5" />
                    {stats.piecesStockFaible} pièce(s) en stock faible
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl border-0 bg-white px-6 text-teal-950 shadow-xl shadow-black/20 hover:bg-teal-50 sm:w-auto"
              >
                <Link href="/sav/clientsav">
                  Nouveau client SAV
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/sav/diagnostique-arrivee">
                  Diagnostic arrivée
                  <ClipboardList className="ml-2 h-4 w-4" />
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
              <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Activité mensuelle
                    </CardTitle>
                    <CardDescription>
                      Véhicules, diagnostics et réparations (6 derniers mois)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyChartData.some(
                  (m) => m.voitures > 0 || m.diagnostics > 0 || m.reparations > 0
                ) ? (
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
                        dataKey="voitures"
                        name="Véhicules"
                        fill="#0d9488"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="diagnostics"
                        name="Diagnostics"
                        fill="#0284c7"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="reparations"
                        name="Réparations"
                        fill="#d97706"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucune activité enregistrée sur les 6 derniers mois." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <CarFront className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Véhicules par statut
                    </CardTitle>
                    <CardDescription>Répartition dans le parcours atelier</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.voituresByStatut.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.voituresByStatut}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {data.voituresByStatut.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun véhicule SAV enregistré." />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Réparations par statut
                    </CardTitle>
                    <CardDescription>Suivi des interventions en cours et terminées</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.reparationsByStatut.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.reparationsByStatut} layout="vertical" margin={{ left: 8 }}>
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
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {data.reparationsByStatut.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucune réparation enregistrée." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Factures par statut
                    </CardTitle>
                    <CardDescription>Proformas, factures et paiements SAV</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.facturesByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data.facturesByStatus}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {data.facturesByStatus.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucune facture SAV enregistrée." />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600" />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Véhicules récents
                  </CardTitle>
                  <CardDescription>Dernières entrées en atelier</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-teal-600">
                  <Link href="/sav/voiture-reparation">
                    Voir tout
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.recentVoitures.length > 0 ? (
                  <ul className="space-y-3">
                    {data.recentVoitures.map((voiture) => (
                      <li
                        key={voiture.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {voiture.model} · {voiture.immatriculation}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-slate-600">
                            {voiture.clientName}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {format(new Date(voiture.createdAt), "d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {voiture.statut}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyChart message="Aucun véhicule SAV pour le moment." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Maintenances récentes
                  </CardTitle>
                  <CardDescription>Dernières interventions programmées</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-amber-600">
                  <Link href="/sav/maintenance">
                    Voir tout
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.recentMaintenances.length > 0 ? (
                  <ul className="space-y-3">
                    {data.recentMaintenances.map((maintenance) => (
                      <li
                        key={maintenance.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{maintenance.nom}</p>
                          <p className="mt-0.5 truncate text-sm text-slate-600">
                            {maintenance.voitureModel} · {maintenance.immatriculation}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {format(new Date(maintenance.createdAt), "d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {maintenance.statut}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyChart message="Aucune maintenance enregistrée." />
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Volume d&apos;activité
                    </CardTitle>
                    <CardDescription>
                      Véhicules + réparations par mois (6 derniers mois)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {caTrendData.some((m) => m.activite > 0) ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={caTrendData}>
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
                      <Line
                        type="monotone"
                        dataKey="activite"
                        name="Activité"
                        stroke="#0d9488"
                        strokeWidth={3}
                        dot={{ fill: "#0d9488", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Pas encore de données d'activité." />
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Accès rapide</h2>
                <p className="text-sm text-slate-500">Raccourcis vers les modules SAV</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/40 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${link.glow}`}
                  >
                    <div
                      className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${link.gradient} opacity-10 transition group-hover:opacity-20`}
                    />
                    <div
                      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient} text-white shadow-lg`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-900">{link.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{link.description}</p>
                    <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-slate-300 transition group-hover:text-slate-600" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
