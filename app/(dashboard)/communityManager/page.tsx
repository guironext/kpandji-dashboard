"use client";

import React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickLinks = [
  {
    href: "/communityManager/projet-ponctuel",
    label: "Projet Ponctuel",
    description: "Campagnes et actions à durée limitée",
    icon: Sparkles,
    bgColor: "bg-violet-500/10",
    iconColor: "text-violet-700",
  },
  {
    href: "/communityManager/projet-permanent",
    label: "Projet Permanent",
    description: "Contenus récurrents et présence continue",
    icon: FileText,
    bgColor: "bg-fuchsia-500/10",
    iconColor: "text-fuchsia-700",
  },
  {
    href: "/communityManager/performance",
    label: "Performance",
    description: "Indicateurs, engagement et résultats",
    icon: TrendingUp,
    bgColor: "bg-rose-500/10",
    iconColor: "text-rose-700",
  },
] as const;

const kpiCards = [
  {
    label: "Projets actifs",
    value: "—",
    sub: "Ponctuels & permanents",
    icon: Target,
    iconColor: "text-violet-700",
  },
  {
    label: "Publications planifiées",
    value: "—",
    sub: "Cette semaine",
    icon: CalendarDays,
    iconColor: "text-fuchsia-700",
  },
  {
    label: "Engagement moyen",
    value: "—",
    sub: "Taux sur 30 jours",
    icon: Users,
    iconColor: "text-rose-700",
  },
  {
    label: "Messages & retours",
    value: "—",
    sub: "À traiter",
    icon: MessageSquare,
    iconColor: "text-purple-700",
  },
] as const;

export default function CommunityManagerPage() {
  const { user, isLoaded } = useUser();

  const todayLabel = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date());
    } catch {
      return "";
    }
  }, []);

  const userLabel = React.useMemo(() => {
    if (!isLoaded) return "…";
    const firstName = user?.firstName?.trim();
    const lastName = user?.lastName?.trim();
    const full = [firstName, lastName].filter(Boolean).join(" ");
    return full || user?.primaryEmailAddress?.emailAddress || "Community Manager";
  }, [isLoaded, user?.firstName, user?.lastName, user?.primaryEmailAddress?.emailAddress]);

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
      <div
        className="pointer-events-none absolute -left-16 bottom-24 -z-10 h-56 w-56 rounded-full bg-violet-200/25 blur-3xl sm:h-72 sm:w-72"
        aria-hidden
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-700 px-5 py-7 shadow-lg shadow-violet-900/25 sm:mb-10 sm:rounded-3xl sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.14),transparent_42%)]" />
          <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl sm:h-56 sm:w-56" aria-hidden />

          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                <CalendarDays className="h-4 w-4 shrink-0 text-white/90" />
                <span className="truncate capitalize">{todayLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                <Megaphone className="h-3.5 w-3.5 shrink-0" />
                Community Management
              </span>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-100 backdrop-blur-sm">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Tableau de bord
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Espace Community Manager
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-violet-50/85 sm:text-base">
                  Bienvenue, <span className="font-semibold text-white">{userLabel}</span>.
                  Pilotez vos projets, suivez la performance et coordonnez votre présence
                  digitale.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:pt-1 sm:flex-row">
                <Button
                  asChild
                  variant="secondary"
                  className="w-full bg-white/15 text-white hover:bg-white/20 sm:w-auto"
                >
                  <Link href="/communityManager/projet-ponctuel">
                    Nouveau projet
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Link href="/communityManager/performance">
                    Voir la performance
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {kpiCards.map((kpi) => (
            <Card
              key={kpi.label}
              className="border-0 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className={`h-5 w-5 shrink-0 ${kpi.iconColor}`} />
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

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                Accès rapide
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Vos espaces de travail principaux, optimisés pour mobile et desktop.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="h-full border border-slate-200/60 bg-white/90 shadow-md shadow-slate-200/40 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-xl">
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${item.bgColor}`}
                        >
                          <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 transition-colors group-hover:text-violet-800">
                            {item.label}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-violet-700 sm:h-5 sm:w-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Overview strip */}
        <Card className="overflow-hidden border border-violet-100/80 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/60 shadow-md">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                Vue d&apos;ensemble
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                Centralisez vos projets et votre suivi de performance
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                Utilisez le menu latéral pour naviguer entre les projets ponctuels,
                permanents et le tableau de performance. Les indicateurs seront alimentés
                dès que vos modules seront connectés.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
                Projets
              </span>
              <span className="inline-flex items-center rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-medium text-fuchsia-800">
                Suivi
              </span>
              <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800">
                Performance
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
