"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowUpRight,
  BarChart3,
  BookMarked,
  CalendarDays,
  FolderOpen,
  FolderPlus,
  Gavel,
  Handshake,
  Inbox,
  Mail,
  MessageSquare,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
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
import type { JuridiqueDashboardData } from "@/lib/actions/juridique-dashboard";

type Props = {
  data: JuridiqueDashboardData;
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
    href: "/juridique/contrats-et-partenariats",
    label: "Contrats & Partenariats",
    description: "Accords et conventions",
    icon: Handshake,
    gradient: "from-violet-500 to-indigo-600",
    glow: "group-hover:shadow-violet-200/60",
  },
  {
    href: "/juridique/contentieux/nouveau-dossier",
    label: "Nouveau dossier",
    description: "Créer un contentieux",
    icon: FolderPlus,
    gradient: "from-indigo-500 to-purple-600",
    glow: "group-hover:shadow-purple-200/60",
  },
  {
    href: "/juridique/contentieux/liste-contentieux",
    label: "Dossiers actifs",
    description: "Suivi des contentieux",
    icon: FolderOpen,
    gradient: "from-fuchsia-500 to-pink-600",
    glow: "group-hover:shadow-fuchsia-200/60",
  },
  {
    href: "/juridique/veille-juridique",
    label: "Veille Juridique",
    description: "Actualités & conformité",
    icon: BookMarked,
    gradient: "from-sky-500 to-cyan-600",
    glow: "group-hover:shadow-sky-200/60",
  },
  {
    href: "/juridique/messages",
    label: "Messages",
    description: "Échanges internes",
    icon: MessageSquare,
    gradient: "from-rose-500 to-pink-600",
    glow: "group-hover:shadow-rose-200/60",
  },
  {
    href: "/juridique/numero-courrier",
    label: "Courriers",
    description: "Numérotation & suivi",
    icon: Inbox,
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-200/60",
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

export default function JuridiqueDashboardClient({ data }: Props) {
  const { user } = useUser();
  const { stats } = data;
  const userLabel = user?.firstName || user?.username || "Juriste";
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const kpiCards = [
    {
      label: "Dossiers contentieux",
      value: stats.dossiersTotal,
      sub: `${stats.dossiersActifs} actifs · ${stats.dossiersTermines} clos`,
      icon: Gavel,
      accent: "from-violet-500 via-purple-500 to-fuchsia-500",
      iconBg: "bg-violet-50 text-violet-700",
      href: "/juridique/contentieux/liste-contentieux",
    },
    {
      label: "Contrats & partenariats",
      value: stats.contratsTotal,
      sub: "Accords enregistrés",
      icon: Handshake,
      accent: "from-indigo-500 via-blue-500 to-cyan-500",
      iconBg: "bg-indigo-50 text-indigo-700",
      href: "/juridique/contrats-et-partenariats",
    },
    {
      label: "Veille juridique",
      value: stats.veilleDossiers,
      sub: `${stats.nonConformites} NC · ${stats.nouvellesLois} nouvelles lois`,
      icon: BookMarked,
      accent: "from-sky-500 via-cyan-500 to-teal-500",
      iconBg: "bg-sky-50 text-sky-700",
      href: "/juridique/veille-juridique",
    },
    {
      label: "Courriers",
      value: stats.courriersTotal,
      sub: `${stats.courriersMois} ce mois · ${stats.messagesNonLus} msg. non lus`,
      icon: Mail,
      accent: "from-amber-500 via-orange-500 to-rose-500",
      iconBg: "bg-amber-50 text-amber-700",
      href: "/juridique/numero-courrier",
    },
  ];

  const monthlyChartData = data.monthlyTrends.map((m) => ({
    ...m,
    monthShort: m.monthLabel.replace(".", ""),
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_24%),linear-gradient(to_bottom,#f8fafc,#ffffff_40%,#f1f5f9)]"
        aria-hidden
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,0.28),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.24),transparent_28%),radial-gradient(circle_at_70%_80%,rgba(52,211,153,0.12),transparent_30%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                Juridique · Tableau de bord
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Scale className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    Bonjour, {userLabel}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Vue d&apos;ensemble de vos contentieux, contrats, veille juridique et
                    communications.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-violet-300" />
                  {todayLabel}
                </span>
                {stats.audiencesProchaines > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                    <Gavel className="h-3.5 w-3.5" />
                    {stats.audiencesProchaines} audience(s) dans les 30 prochains jours
                  </span>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl border-0 bg-white px-6 text-violet-950 shadow-xl shadow-black/20 hover:bg-violet-50 sm:w-auto"
              >
                <Link href="/juridique/contentieux/nouveau-dossier">
                  Nouveau dossier
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/juridique/veille-juridique">
                  Veille juridique
                  <BookMarked className="ml-2 h-4 w-4" />
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
                        <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-950 sm:text-3xl">
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
              <div className="h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Activité mensuelle
                    </CardTitle>
                    <CardDescription>
                      Ouvertures de dossiers et courriers (6 derniers mois)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyChartData.some((m) => m.dossiers > 0 || m.courriers > 0) ? (
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
                        dataKey="dossiers"
                        name="Dossiers"
                        fill="#7c3aed"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="courriers"
                        name="Courriers"
                        fill="#0284c7"
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
              <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Gavel className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Contentieux par statut
                    </CardTitle>
                    <CardDescription>Répartition des dossiers en cours et clos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.contentieuxByStatut.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.contentieuxByStatut}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {data.contentieuxByStatut.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun dossier contentieux enregistré." />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-sky-500 to-cyan-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Types de contentieux
                    </CardTitle>
                    <CardDescription>Civil, commercial, social, etc.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.contentieuxByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.contentieuxByType} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
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
                        {data.contentieuxByType.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun type de contentieux enregistré." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Handshake className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Contrats par type
                    </CardTitle>
                    <CardDescription>Répartition des accords et conventions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.contratsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data.contratsByType}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {data.contratsByType.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="Aucun contrat ou partenariat enregistré." />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600" />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Dossiers récents
                  </CardTitle>
                  <CardDescription>Derniers contentieux ouverts</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-violet-600">
                  <Link href="/juridique/contentieux/liste-contentieux">
                    Voir tout
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.recentDossiers.length > 0 ? (
                  <ul className="space-y-3">
                    {data.recentDossiers.map((dossier) => (
                      <li
                        key={dossier.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{dossier.numeroDossier}</p>
                          <p className="mt-0.5 truncate text-sm text-slate-600">{dossier.objet}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {format(new Date(dossier.dateOuverture), "d MMM yyyy", { locale: fr })}
                            {" · "}
                            {dossier.typeDossier}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {dossier.statutDossier}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyChart message="Aucun dossier contentieux pour le moment." />
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Prochaines audiences
                </CardTitle>
                <CardDescription>Échéances judiciaires à venir</CardDescription>
              </CardHeader>
              <CardContent>
                {data.upcomingAudiences.length > 0 ? (
                  <ul className="space-y-3">
                    {data.upcomingAudiences.map((audience) => (
                      <li
                        key={audience.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                          <span className="text-[10px] font-bold uppercase leading-none">
                            {format(new Date(audience.dateAudience), "MMM", { locale: fr })}
                          </span>
                          <span className="text-sm font-bold leading-tight">
                            {format(new Date(audience.dateAudience), "d", { locale: fr })}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">
                            Dossier {audience.dossierNumero}
                          </p>
                          <p className="text-sm text-slate-600">{audience.tribunalAudience}</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {audience.heureAudience} · {audience.statutAudience}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyChart message="Aucune audience programmée." />
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="overflow-hidden border-0 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600" />
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">Accès rapide</CardTitle>
                <CardDescription>Navigation vers les modules juridiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {QUICK_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${link.glow}`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br sm:h-11 sm:w-11 ${link.gradient} text-white shadow-md transition-transform group-hover:scale-105`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">{link.label}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                            {link.description}
                          </p>
                        </div>
                        <ArrowUpRight className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-300 opacity-0 transition-all group-hover:opacity-100 group-hover:text-violet-500" />
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
