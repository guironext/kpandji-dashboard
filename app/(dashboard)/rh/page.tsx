"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  LogIn,
  Mail,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Loader2,
  RefreshCw,
  UserPlus,
  QrCode,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRhDashboardData } from "@/lib/actions/rh-dashboard";
import type { RhDashboardData } from "@/lib/actions/rh-dashboard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const quickLinks = [
  { href: "/rh/employes", label: "Ajouter Employé", icon: UserPlus, bgColor: "bg-blue-500/10", iconColor: "text-blue-600" },
  { href: "/rh/pointage", label: "Pointage Employé", icon: QrCode, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-600" },
  { href: "/rh/rapportequipe", label: "Rapport Equipe", icon: Users, bgColor: "bg-violet-500/10", iconColor: "text-violet-600" },
  { href: "/rh/rapportmontage", label: "Rapport Montages", icon: BarChart3, bgColor: "bg-amber-500/10", iconColor: "text-amber-600" },
  { href: "/rh/numero-courrier", label: "Numéro Courrier", icon: Mail, bgColor: "bg-fuchsia-500/10", iconColor: "text-fuchsia-600" },
  { href: "/rh/messages", label: "Messages", icon: MessageSquare, bgColor: "bg-purple-500/10", iconColor: "text-purple-600" },
];

export default function RhDashboardPage() {
  const [data, setData] = useState<RhDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = React.useCallback(async () => {
    const result = await getRhDashboardData();
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData(null);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-medium">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
              Dashboard DRH
            </h1>
            <p className="text-slate-600 mt-1">
              Vue d&apos;ensemble de vos activités Ressources Humaines
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
            </span>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-300"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Employés
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats?.employeesTotal ?? "—"}
                  </p>
                  {stats && stats.employeesActive > 0 && (
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      {stats.employeesActive} actifs
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Pointages aujourd&apos;hui
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats?.pointagesToday ?? "—"}
                  </p>
                  {stats && stats.pointagesStillAtWork > 0 && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      {stats.pointagesStillAtWork} en cours
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-1.5 bg-gradient-to-r from-fuchsia-500 to-pink-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Courriers créés
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats?.courriersByUser ?? "—"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-fuchsia-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-1.5 bg-gradient-to-r from-purple-500 to-violet-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Messages non lus
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats?.unreadMessages ?? "—"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two columns: Recent activities + Quick links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Pointages */}
          <Card className="border-0 shadow-lg bg-white overflow-hidden lg:col-span-2">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LogIn className="h-5 w-5 text-emerald-600" />
                    Pointages du jour
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Dernières entrées et sorties enregistrées
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/rh/pointage" className="flex items-center gap-1 text-emerald-600">
                    Voir tout
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data?.recentPointages && data.recentPointages.length > 0 ? (
                <div className="space-y-2">
                  {data.recentPointages.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {p.nom} {p.prenoms}
                          </p>
                          <p className="text-xs text-slate-500">
                            Entrée: {format(new Date(p.heure_entree), "HH:mm", { locale: fr })}
                            {p.hasSortie && (
                              <> · Sortie: {format(new Date(p.heure_sortie), "HH:mm", { locale: fr })}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={p.hasSortie ? "secondary" : "outline"}
                        className={
                          p.hasSortie
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }
                      >
                        {p.hasSortie ? "Terminé" : "En cours"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-slate-100 mb-3">
                    <LogOut className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-600">Aucun pointage aujourd&apos;hui</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Enregistrez des entrées et sorties via le module Pointage
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/rh/pointage" className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      Aller au pointage
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Courriers + Rapports */}
          <Card className="border-0 shadow-lg bg-white overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-fuchsia-500 to-pink-600" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-fuchsia-600" />
                Vos courriers récents
              </CardTitle>
              <CardDescription className="mt-1">
                Derniers numéros de courrier créés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.recentCourriers && data.recentCourriers.length > 0 ? (
                <div className="space-y-2">
                  {data.recentCourriers.map((c) => (
                    <Link
                      key={c.id}
                      href="/rh/numero-courrier"
                      className="block py-2.5 px-3 rounded-lg bg-slate-50/80 hover:bg-fuchsia-50/80 transition-colors group"
                    >
                      <p className="font-medium text-slate-800 group-hover:text-fuchsia-700">
                        {c.destinataire}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{c.objet}</p>
                      <p className="text-xs font-mono text-fuchsia-600 mt-0.5">
                        N° {c.numero_courrier}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-slate-500">Aucun courrier créé</p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href="/rh/numero-courrier">Créer un courrier</Link>
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Rapports équipes</span>
                  <Badge variant="secondary">{stats?.rapportEquipesCount ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-slate-500">Rapports montages</span>
                  <Badge variant="secondary">{stats?.rapportMontagesCount ?? 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">
              Accès rapide
            </CardTitle>
            <p className="text-sm text-slate-500">
              Toutes les sections de l&apos;espace Ressources Humaines
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200"
                  >
                    <div
                      className={`h-11 w-11 rounded-lg ${link.bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${link.iconColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-800 group-hover:text-blue-800">
                        {link.label}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Messages CTA */}
        {stats && stats.unreadMessages > 0 && (
          <Card className="shadow-lg bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {stats.unreadMessages} message{stats.unreadMessages > 1 ? "s" : ""} non lu{stats.unreadMessages > 1 ? "s" : ""}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Consultez vos messages
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link
                    href="/rh/messages"
                    className="flex items-center gap-2"
                  >
                    Voir les messages
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
