"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Wrench,
  Users,
  ClipboardCheck,
  Receipt,
  Package,
  FileText,
  ArrowRight,
  Sparkles,
  Boxes,
  UserCog,
} from "lucide-react";

const quickActions = [
  {
    href: "/sav/clientsav",
    label: "Clients SAV",
    icon: Users,
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10",
    description: "Gérer les dossiers clients",
  },
  {
    href: "/sav/diagnostique-arrivee",
    label: "Diagnostique Arrivée",
    icon: ClipboardCheck,
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10",
    description: "Contrôle à l'arrivée",
  },
  {
    href: "/sav/maintenance",
    label: "Maintenance",
    icon: Wrench,
    gradient: "from-blue-500 to-cyan-600",
    bg: "bg-blue-500/10",
    description: "Suivi des interventions",
  },
  {
    href: "/sav/facturation-sav",
    label: "Facturation SAV",
    icon: Receipt,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    description: "Factures et devis",
  },
  {
    href: "/sav/gestion-pieces-sav",
    label: "Gestion pièces",
    icon: Boxes,
    gradient: "from-slate-600 to-slate-800",
    bg: "bg-slate-500/10",
    description: "Stock et inventaire",
  },
  {
    href: "/sav/personnel-sav",
    label: "Personnel SAV",
    icon: UserCog,
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-500/10",
    description: "Équipe technique",
  },
];

const statsPlaceholder = [
  { label: "Dossiers actifs", value: "—", sub: "En cours", icon: ClipboardCheck },
  { label: "Maintenances du mois", value: "—", sub: "Interventions", icon: Wrench },
  { label: "Pièces en stock", value: "—", sub: "Références", icon: Package },
  { label: "Rapports", value: "—", sub: "Générés", icon: FileText },
];

export default function SavDashboard() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 pt-8 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <span className="text-sm font-medium text-emerald-100/90">
              Tableau de bord
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Services Après Vente
          </h1>
          <p className="mt-2 text-lg text-emerald-100/80 max-w-xl">
            Centre de gestion des interventions, maintenances et pièces détachées
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-white/90">SAV</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsPlaceholder.map((stat, i) => {
          const gradients = [
            "from-emerald-500 to-teal-600",
            "from-amber-500 to-orange-600",
            "from-blue-500 to-cyan-600",
            "from-violet-500 to-purple-600",
          ];
          const iconBg = [
            "bg-emerald-500/20",
            "bg-amber-500/20",
            "bg-blue-500/20",
            "bg-violet-500/20",
          ];
          return (
            <Card
              key={stat.label}
              className="group relative overflow-hidden border-0 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradients[i]} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}
              />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{stat.sub}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${iconBg[i]}`}>
                    <stat.icon className="h-6 w-6 text-slate-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Accès rapide
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex items-start gap-4 p-6 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-slate-300 hover:scale-[1.01]"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity`}
              />
              <div className={`relative flex-shrink-0 p-3 rounded-xl ${action.bg} shadow-sm`}>
                <action.icon className="h-7 w-7 text-slate-700" />
              </div>
              <div className="relative flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
                <p className="text-sm text-slate-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Secondary Actions Card */}
      <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Documents & Rapports</CardTitle>
              <CardDescription>
                Réçus SAV, rapports de maintenance et gestion des pièces
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/sav/recusav"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-emerald-100">
                <Receipt className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800 group-hover:text-emerald-700">
                  Réçu SAV
                </p>
                <p className="text-xs text-slate-500">Émissions de réçus</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 ml-auto" />
            </Link>
            <Link
              href="/sav/rapport-maintenance"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800 group-hover:text-blue-700">
                  Rapport Maintenance
                </p>
                <p className="text-xs text-slate-500">Rapports d&apos;intervention</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 ml-auto" />
            </Link>
            <Link
              href="/sav/ajouter-pieces-sav"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-slate-200">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800 group-hover:text-slate-700">
                  Ajouter Pièces
                </p>
                <p className="text-xs text-slate-500">Nouvelles pièces SAV</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 ml-auto" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
