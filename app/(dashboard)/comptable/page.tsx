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
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* Hero */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 px-6 py-8 shadow-lg shadow-emerald-900/20 md:px-10 md:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
          <div className="relative">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                <CalendarDays className="h-4 w-4 text-white/90" />
                {todayLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                Comptabilité
              </span>
            </div>

            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Tableau de bord Comptable
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-emerald-50/80">
                  Bienvenue, <span className="font-semibold text-white">{userLabel}</span>. Accédez
                  rapidement aux factures, paiements, clients et suivis.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Button asChild variant="secondary" className="bg-white/15 text-white hover:bg-white/20">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="h-full border-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.bgColor}`}>
                          <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {item.label}
                          </p>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0 mt-1" />
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