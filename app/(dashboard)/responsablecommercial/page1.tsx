import React from "react";
import Link from "next/link";
import { getResponsableDashboard } from "@/lib/actions/responsable-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Target,
  CalendarRange,
  Users,
  TrendingDown,
  UserCheck,
  FileText,
  BarChart3,
  Receipt,
  ClipboardList,
  Activity,
  KeyRound,
  ChevronRight,
  AlertCircle,
  Layers,
} from "lucide-react";

const quickLinks = [
  {
    href: "/responsablecommercial/objectifs",
    label: "Objectifs",
    description: "Définir et suivre les objectifs par période",
    icon: Target,
    color: "from-indigo-500 to-violet-600",
  },
  {
    href: "/responsablecommercial/calendrier-sortie",
    label: "Calendrier Sortie",
    description: "Planifier les sorties commerciales",
    icon: CalendarRange,
    color: "from-amber-500 to-orange-600",
  },
  {
    href: "/responsablecommercial/tableau-chute",
    label: "Tableau de Chute",
    description: "Rendez-vous en chute par commercial",
    icon: TrendingDown,
    color: "from-rose-500 to-red-600",
  },
  {
    href: "/responsablecommercial/performences",
    label: "Performances",
    description: "Analyses et rapports par commercial",
    icon: Activity,
    color: "from-emerald-500 to-teal-600",
  },
  {
    href: "/responsablecommercial/prospects",
    label: "Prospects",
    description: "Gérer les prospects de l'équipe",
    icon: UserCheck,
    color: "from-sky-500 to-blue-600",
  },
  {
    href: "/responsablecommercial/suivi-commandes",
    label: "Suivi Commandes",
    description: "Suivre les commandes en cours",
    icon: ClipboardList,
    color: "from-violet-500 to-purple-600",
  },
  {
    href: "/responsablecommercial/proformas",
    label: "Proformas",
    description: "Proformas en attente de validation",
    icon: FileText,
    color: "from-pink-500 to-rose-600",
  },
  {
    href: "/responsablecommercial/cout-rendez-vous",
    label: "Coût Rendez-vous",
    description: "Analyse des coûts par rendez-vous",
    icon: BarChart3,
    color: "from-cyan-500 to-blue-600",
  },
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <Card className="group border-0 shadow-xl overflow-hidden relative hover:scale-[1.02] transition-all duration-300">
      <div className={`absolute top-0 right-0 opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-br ${gradient} w-32 h-32 -mr-8 -mt-8 rounded-full`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function ResponsableCommercialDashboard() {
  const result = await getResponsableDashboard();

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-700">Erreur</CardTitle>
                  <CardDescription className="text-red-600">
                    {result.error || "Impossible de charger le tableau de bord"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const d = result.data.stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative p-6 space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
                <Layers className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-muted-foreground mt-2 text-lg font-medium">
                Coordination de l&apos;équipe commerciale
                {d.currentPeriodLabel && (
                  <span className="ml-2 text-blue-600 font-semibold">
                    · Période actuelle : {d.currentPeriodLabel}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Commerciaux"
            value={d.commercialsCount}
            subtitle="Conseillers actifs"
            icon={Users}
            gradient="from-blue-500 to-indigo-600"
          />
          <StatCard
            title="Périodes objectif"
            value={d.periodsCount}
            subtitle="Périodes définies"
            icon={CalendarRange}
            gradient="from-violet-500 to-purple-600"
          />
          <StatCard
            title="Chutes"
            value={d.totalChutes}
            subtitle={`${d.totalCommercialsWithChutes} commercial(aux) concerné(s)`}
            icon={TrendingDown}
            gradient="from-amber-500 to-orange-600"
          />
          <StatCard
            title="Rendez-vous rapportés"
            value={d.totalRapports}
            subtitle={`${d.totalRapportsProspects} prospects · ${d.totalRapportsClients} clients`}
            icon={ClipboardList}
            gradient="from-emerald-500 to-teal-600"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Prospects"
            value={d.prospectsCount}
            subtitle="Particuliers et entreprises"
            icon={UserCheck}
            gradient="from-sky-500 to-cyan-600"
          />
          <StatCard
            title="Clients"
            value={d.clientsCount}
            subtitle="Base clients active"
            icon={Users}
            gradient="from-green-500 to-emerald-600"
          />
          <StatCard
            title="Factures en attente"
            value={d.facturesEnAttenteCount}
            subtitle="À valider"
            icon={Receipt}
            gradient="from-pink-500 to-rose-600"
          />
          <StatCard
            title="Objectifs définis"
            value={
              d.objectifsCibleCount +
              d.objectifsFinancieresCount +
              d.objectifsVehiculesCount
            }
            subtitle="Cibles, financiers, véhicules"
            icon={Target}
            gradient="from-indigo-500 to-violet-600"
          />
        </div>

        {/* Quick Links */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-3 font-bold">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <KeyRound className="h-6 w-6 text-white" />
                </div>
                Accès rapide
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Sections principales pour la coordination commerciale
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-200 hover:shadow-md transition-all duration-200"
                  >
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${link.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {link.label}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {link.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
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
