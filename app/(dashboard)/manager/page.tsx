import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  Container,
  FileSpreadsheet,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Ship,
  Truck,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AgendaDuJourMarquee } from "@/components/manager/AgendaDuJourMarquee";

const quickLinks = [
  { href: "/manager/agenda", label: "Agenda", description: "Planning & activités", icon: CalendarDays, bgColor: "bg-indigo-500/10", iconColor: "text-indigo-700" },
  { href: "/manager/commandes", label: "Commandes", description: "Suivi des commandes", icon: ClipboardList, bgColor: "bg-amber-500/10", iconColor: "text-amber-700" },
  { href: "/manager/tableau-commandes", label: "Tableau commandes", description: "Vue synthèse", icon: LayoutDashboard, bgColor: "bg-sky-500/10", iconColor: "text-sky-700" },
  { href: "/manager/listeConteneurs", label: "Conteneurs chargés", description: "Liste & détails", icon: Container, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-700" },
  { href: "/manager/conteneur-transit", label: "Conteneurs transit", description: "Suivi du transit", icon: Ship, bgColor: "bg-violet-500/10", iconColor: "text-violet-700" },
  { href: "/manager/conteneur-arrives", label: "Conteneurs arrivés", description: "Réception & contrôle", icon: Truck, bgColor: "bg-cyan-500/10", iconColor: "text-cyan-700" },
  { href: "/manager/reclamationpieces", label: "Réclamations pièces", description: "Suivi des anomalies", icon: TriangleAlert, bgColor: "bg-rose-500/10", iconColor: "text-rose-700" },
  { href: "/manager/ordre-montage", label: "Ordre montage", description: "Opérations atelier", icon: Wrench, bgColor: "bg-orange-500/10", iconColor: "text-orange-700" },
  { href: "/manager/rapportmontages", label: "Rapport montages", description: "Analyse & rapports", icon: FileSpreadsheet, bgColor: "bg-blue-500/10", iconColor: "text-blue-700" },
  { href: "/manager/numero-courrier", label: "Numéro courrier", description: "Courriers entrants/sortants", icon: Mail, bgColor: "bg-fuchsia-500/10", iconColor: "text-fuchsia-700" },
  { href: "/manager/messages", label: "Messages", description: "Communication interne", icon: MessageSquare, bgColor: "bg-purple-500/10", iconColor: "text-purple-700" },
] as const;

function formatDateFr(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function ManagerDashboardPage() {
  const today = new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Dashboard manager
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Vue d’ensemble des opérations et accès rapide aux sections clés.
              </p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur">
                <CalendarDays className="h-4 w-4 text-indigo-600" />
                {formatDateFr(today)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="outline" className="border-slate-200 bg-white/80">
              <Link href="/manager/agenda">Ouvrir l’agenda</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-600/90 hover:to-indigo-700/90">
              <Link href="/manager/tableau-commandes">Tableau commandes</Link>
            </Button>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Agenda du jour
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tous les rendez-vous d’aujourd’hui, en défilement horizontal.
          </p>
          <div className="mt-4">
            <AgendaDuJourMarquee />
          </div>
        </div>

        {/* KPIs (placeholders) */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">Priorité du jour</CardTitle>
              <CardDescription>À traiter en premier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-sm font-medium text-slate-800">Suivi des conteneurs et commandes</p>
                <p className="mt-1 text-xs text-slate-600">
                  Consultez le tableau commandes et l’état des conteneurs en transit.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">Suivi rapide</CardTitle>
              <CardDescription>Sections les plus utilisées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary" className="bg-amber-500/10 text-amber-800 hover:bg-amber-500/15">
                  <Link href="/manager/commandes">Commandes</Link>
                </Button>
                <Button asChild size="sm" variant="secondary" className="bg-violet-500/10 text-violet-800 hover:bg-violet-500/15">
                  <Link href="/manager/conteneur-transit">Transit</Link>
                </Button>
                <Button asChild size="sm" variant="secondary" className="bg-indigo-500/10 text-indigo-800 hover:bg-indigo-500/15">
                  <Link href="/manager/agenda">Agenda</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">Communication</CardTitle>
              <CardDescription>Courriers & messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/manager/numero-courrier"
                  className="group rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Mail className="h-4 w-4 text-emerald-600" />
                    Courriers
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Numérotation</p>
                </Link>
                <Link
                  href="/manager/messages"
                  className="group rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    Messages
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Discussions</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Accès rapide</CardTitle>
            <CardDescription>Toutes les sections de l’espace manager</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-md"
                  >
                    <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${link.bgColor} ${link.iconColor} transition-transform group-hover:scale-105`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold text-slate-900">{link.label}</p>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{link.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}