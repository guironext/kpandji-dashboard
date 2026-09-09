"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleDot,
  FileBarChart,
  FolderKanban,
  Landmark,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MODULES = [
  {
    href: "/finance/projet",
    label: "Projets",
    description: "Portefeuille, budgets et avancement des initiatives financières.",
    icon: FolderKanban,
    gradient: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-200/70",
  },
  {
    href: "/finance/taches",
    label: "Tâches",
    description: "Suivi opérationnel des actions, validations et échéances.",
    icon: ListChecks,
    gradient: "from-teal-500 to-emerald-700",
    glow: "group-hover:shadow-teal-200/70",
  },
  {
    href: "/finance/planning",
    label: "Planning",
    description: "Calendrier des clôtures, revues et rendez-vous financiers.",
    icon: CalendarDays,
    gradient: "from-slate-600 to-teal-700",
    glow: "group-hover:shadow-slate-200/70",
  },
  {
    href: "/finance/rapport",
    label: "Rapports",
    description: "Synthèses, indicateurs et restitution pour la direction.",
    icon: FileBarChart,
    gradient: "from-emerald-600 to-cyan-700",
    glow: "group-hover:shadow-emerald-200/70",
  },
] as const;

const KPI = [
  {
    label: "Projets actifs",
    value: 0,
    sub: "Aucun portefeuille ouvert",
    icon: FolderKanban,
    accent: "from-amber-500 via-yellow-500 to-orange-500",
    iconBg: "bg-amber-50 text-amber-700",
    href: "/finance/projet",
  },
  {
    label: "Tâches en cours",
    value: 0,
    sub: "Rien à traiter aujourd'hui",
    icon: ListChecks,
    accent: "from-teal-500 via-emerald-500 to-cyan-500",
    iconBg: "bg-teal-50 text-teal-700",
    href: "/finance/taches",
  },
  {
    label: "Échéances semaine",
    value: 0,
    sub: "Planning libre cette semaine",
    icon: CalendarDays,
    accent: "from-slate-500 via-slate-600 to-teal-600",
    iconBg: "bg-slate-100 text-slate-700",
    href: "/finance/planning",
  },
  {
    label: "Rapports",
    value: 0,
    sub: "Aucune synthèse publiée",
    icon: FileBarChart,
    accent: "from-emerald-500 via-teal-500 to-cyan-600",
    iconBg: "bg-emerald-50 text-emerald-700",
    href: "/finance/rapport",
  },
] as const;

const FOCUS = [
  {
    title: "Structurer le portefeuille",
    text: "Créez vos premiers projets pour suivre budgets, jalons et responsables.",
    href: "/finance/projet",
    icon: Target,
  },
  {
    title: "Planifier la semaine",
    text: "Posez les clôtures, revues et échéances sur le calendrier finance.",
    href: "/finance/planning",
    icon: CalendarDays,
  },
  {
    title: "Préparer un rapport",
    text: "Centralisez les indicateurs à présenter à la direction.",
    href: "/finance/rapport",
    icon: FileBarChart,
  },
] as const;

function EmptyPanel({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof CircleDot;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/60 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}

export default function FinanceDashboardClient() {
  const { user, isLoaded } = useUser();
  const today = new Date();
  const todayLabel = format(today, "EEEE d MMMM yyyy", { locale: fr });
  const userLabel =
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Finance";

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(180,83,9,0.08),transparent_26%),linear-gradient(to_bottom,#f8fafc,#ffffff_42%,#f1f5f9)]"
        aria-hidden
      />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950" />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(20,184,166,0.28),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_70%_85%,rgba(16,185,129,0.14),transparent_32%)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-28 sm:pt-8 lg:px-8 lg:pb-32">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-100 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Finance · Tableau de bord
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
                  <Landmark className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                    {isLoaded ? `Bonjour, ${userLabel}` : "Tableau de bord Finance"}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                    Vue d&apos;ensemble du portefeuille, des tâches, du planning et
                    des rapports financiers.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium capitalize text-slate-200 backdrop-blur-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-teal-300" />
                  {todayLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                  <CircleDot className="h-3.5 w-3.5" />
                  Espace prêt à être alimenté
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                className="w-full rounded-2xl border-0 bg-white px-6 text-teal-950 shadow-xl shadow-black/20 hover:bg-teal-50 sm:w-auto"
              >
                <Link href="/finance/projet">
                  Ouvrir les projets
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-2xl border-white/15 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Link href="/finance/planning">
                  Voir le planning
                  <CalendarDays className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link key={kpi.label} href={kpi.href} className="group block">
                <Card className="gap-0 overflow-hidden border-0 bg-white/90 py-0 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/70">
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
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Modules
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Accédez aux espaces de travail du département finance.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${mod.glow}`}
                  >
                    <div
                      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${mod.gradient} transition-transform group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-900">{mod.label}</p>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">
                      {mod.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700">
                      Ouvrir
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-slate-300 opacity-0 transition-all group-hover:opacity-100 group-hover:text-teal-600" />
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="gap-0 overflow-hidden border-0 bg-white/90 py-0 shadow-xl shadow-slate-200/40 backdrop-blur-xl lg:col-span-3">
              <div className="h-1 bg-gradient-to-r from-teal-600 to-emerald-600" />
              <CardHeader className="px-6 pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Semaine en cours
                      </CardTitle>
                      <CardDescription>
                        {format(weekStart, "d MMM", { locale: fr })} —{" "}
                        {format(addDays(weekStart, 6), "d MMM yyyy", { locale: fr })}
                      </CardDescription>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-teal-700">
                    <Link href="/finance/planning">
                      Planning
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {weekDays.map((day) => {
                    const isToday = isSameDay(day, today);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`rounded-2xl border px-1.5 py-3 text-center sm:px-2 sm:py-4 ${
                          isToday
                            ? "border-teal-300 bg-teal-50 shadow-sm shadow-teal-100"
                            : "border-slate-100 bg-slate-50/70"
                        }`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
                            isToday ? "text-teal-700" : "text-slate-400"
                          }`}
                        >
                          {format(day, "EEE", { locale: fr })}
                        </p>
                        <p
                          className={`mt-1 text-lg font-bold tabular-nums sm:text-xl ${
                            isToday ? "text-teal-900" : "text-slate-800"
                          }`}
                        >
                          {format(day, "d")}
                        </p>
                        <div className="mx-auto mt-2 h-1.5 w-1.5 rounded-full bg-slate-200" />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-center text-xs text-slate-500">
                  Aucun événement planifié. Ajoutez des échéances depuis le planning.
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 overflow-hidden border-0 bg-white/90 py-0 shadow-xl shadow-slate-200/40 backdrop-blur-xl lg:col-span-2">
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-lg font-bold text-slate-900">
                  Activité récente
                </CardTitle>
                <CardDescription>Derniers mouvements du département</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <EmptyPanel
                  icon={FileBarChart}
                  title="Pas encore d'activité"
                  hint="Les projets, tâches et rapports apparaîtront ici dès leur création."
                />
              </CardContent>
            </Card>
          </section>

          <section>
            <Card className="gap-0 overflow-hidden border-0 bg-white/90 py-0 shadow-xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-slate-700 via-teal-600 to-amber-500" />
              <CardHeader className="px-6 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Priorités pour démarrer
                    </CardTitle>
                    <CardDescription>
                      Trois actions pour activer l&apos;espace finance
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {FOCUS.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:border-teal-200 hover:bg-white hover:shadow-md"
                      >
                        <Badge
                          variant="secondary"
                          className="mt-0.5 h-6 min-w-6 justify-center rounded-full bg-white text-xs font-bold text-teal-800"
                        >
                          {index + 1}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 font-semibold text-slate-900">
                            <Icon className="h-4 w-4 text-teal-700" />
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">
                            {item.text}
                          </p>
                        </div>
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
