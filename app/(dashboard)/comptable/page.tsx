"use client";

import React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  HandCoins,
  Mail,
  MessageSquare,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickLinks = [
  {
    href: "/comptable/facture",
    label: "Factures",
    description: "Créer, éditer et suivre les factures",
    icon: Receipt,
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-700",
  },
  {
    href: "/comptable/suivi-bon-commande",
    label: "Suivi Bon de Commande",
    description: "BC + proformas associés",
    icon: FileText,
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-700",
  },
  {
    href: "/comptable/suivi-commandes",
    label: "Suivi Commandes",
    description: "Vue groupée des commandes",
    icon: Package,
    bgColor: "bg-indigo-500/10",
    iconColor: "text-indigo-700",
  },
  {
    href: "/comptable/commandes-locaux",
    label: "Commandes Locales",
    description: "Achats et suivi local",
    icon: ShoppingCart,
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-800",
  },
  {
    href: "/comptable/bon-de-livraison",
    label: "Bon de Livraison",
    description: "Préparer et suivre les livraisons",
    icon: Truck,
    bgColor: "bg-cyan-500/10",
    iconColor: "text-cyan-800",
  },
  {
    href: "/comptable/clients",
    label: "Clients",
    description: "Clients particuliers & entreprises",
    icon: Users,
    bgColor: "bg-violet-500/10",
    iconColor: "text-violet-700",
  },
  {
    href: "/comptable/point-paiement",
    label: "Point Paiement",
    description: "Suivi des paiements et relances",
    icon: HandCoins,
    bgColor: "bg-lime-500/10",
    iconColor: "text-lime-800",
  },
  {
    href: "/comptable/fournisseur-locaux",
    label: "Fournisseurs Locaux",
    description: "Répertoire et suivi fournisseurs",
    icon: Warehouse,
    bgColor: "bg-slate-500/10",
    iconColor: "text-slate-700",
  },
  {
    href: "/comptable/numero-courrier",
    label: "Numéro Courrier",
    description: "Gestion des numéros de courrier",
    icon: Mail,
    bgColor: "bg-fuchsia-500/10",
    iconColor: "text-fuchsia-700",
  },
  {
    href: "/comptable/messages",
    label: "Messages",
    description: "Communication interne",
    icon: MessageSquare,
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-700",
  },
  {
    href: "/comptable/documentation",
    label: "Documentation",
    description: "Références et procédures",
    icon: BookOpen,
    bgColor: "bg-rose-500/10",
    iconColor: "text-rose-700",
  },
  {
    href: "/comptable/bon-pour-accord",
    label: "Bon pour Accord",
    description: "Validation et suivi",
    icon: ShieldCheck,
    bgColor: "bg-teal-500/10",
    iconColor: "text-teal-700",
  },
] as const;

const kpiCards = [
  {
    label: "Factures du mois",
    value: "—",
    sub: "Créées / en cours",
    icon: Receipt,
    className:
      "border-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300",
  },
  {
    label: "Reste à payer",
    value: "—",
    sub: "Montant total",
    icon: HandCoins,
    className:
      "border-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300",
  },
  {
    label: "Commandes à suivre",
    value: "—",
    sub: "En transit / à vérifier",
    icon: Package,
    className:
      "border-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300",
  },
  {
    label: "Bons de livraison",
    value: "—",
    sub: "À préparer / envoyés",
    icon: Truck,
    className:
      "border-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300",
  },
] as const;

export default function Page() {
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
    return full || user?.primaryEmailAddress?.emailAddress || "Comptable";
  }, [isLoaded, user?.firstName, user?.lastName, user?.primaryEmailAddress?.emailAddress]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-slate-50/60">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 px-5 py-7 shadow-lg shadow-emerald-900/20 sm:mb-10 sm:rounded-3xl sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                <CalendarDays className="h-4 w-4 shrink-0 text-white/90" />
                <span className="truncate capitalize">{todayLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                Comptabilité
              </span>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Tableau de bord Comptable
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/80 sm:text-base">
                  Bienvenue, <span className="font-semibold text-white">{userLabel}</span>. Accédez
                  rapidement aux factures, paiements, clients et suivis.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                <Button
                  asChild
                  variant="secondary"
                  className="w-full bg-white/15 text-white hover:bg-white/20 sm:w-auto"
                >
                  <Link href="/comptable/facture">
                    Ouvrir les factures
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.label} className={kpi.className}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="h-5 w-5 text-emerald-700" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 tabular-nums">{kpi.value}</div>
                <p className="text-xs text-slate-500 mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Accès rapide
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Les modules comptables les plus utilisés, à portée de clic.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="h-full border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-md shadow-slate-200/40 transition-all duration-300 hover:border-emerald-200/80 hover:shadow-xl hover:-translate-y-0.5">
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${item.bgColor}`}>
                          <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 transition-colors group-hover:text-emerald-800">
                            {item.label}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-emerald-700 sm:h-5 sm:w-5" />
                    </div>
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