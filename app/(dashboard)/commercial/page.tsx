"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Car,
  Package,
  Warehouse,
  UserCheck,
  Users,
  Calendar,
  ClipboardList,
  Eye,
  BarChart3,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Receipt,
  FileCheck,
  Pen,
  Mail,
  MessageSquare,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { href: "/commercial/ajouter-modele", label: "Modèles Voitures", icon: Car, bgColor: "bg-blue-500/10", iconColor: "text-blue-600" },
  { href: "/commercial/ajouter-accessoires", label: "Accessoires", icon: Package, bgColor: "bg-emerald-500/10", iconColor: "text-emerald-600" },
  { href: "/commercial/stock-disponible", label: "Stock disponible", icon: Warehouse, bgColor: "bg-amber-500/10", iconColor: "text-amber-600" },
  { href: "/commercial/prospects", label: "Prospects", icon: UserCheck, bgColor: "bg-violet-500/10", iconColor: "text-violet-600" },
  { href: "/commercial/clients", label: "Clients", icon: Users, bgColor: "bg-cyan-500/10", iconColor: "text-cyan-600" },
  { href: "/commercial/rendez-vous", label: "Rendez-vous", icon: Calendar, bgColor: "bg-rose-500/10", iconColor: "text-rose-600" },
  { href: "/commercial/rapport-rendez-vous", label: "Rapport Rendez-vous", icon: ClipboardList, bgColor: "bg-indigo-500/10", iconColor: "text-indigo-600" },
  { href: "/commercial/suivi-rendez-vous", label: "Suivi Rendez-vous", icon: Eye, bgColor: "bg-sky-500/10", iconColor: "text-sky-600" },
  { href: "/commercial/tableau-chute", label: "Tableau de Chute", icon: BarChart3, bgColor: "bg-orange-500/10", iconColor: "text-orange-600" },
  { href: "/commercial/suivi-commandes", label: "Suivi Commandes", icon: TrendingUp, bgColor: "bg-green-500/10", iconColor: "text-green-600" },
  { href: "/commercial/proformas", label: "Proformas", icon: FileText, bgColor: "bg-amber-500/10", iconColor: "text-amber-600" },
  { href: "/commercial/profoma-multi", label: "Proformas-multi", icon: FileSpreadsheet, bgColor: "bg-amber-600/10", iconColor: "text-amber-700" },
  { href: "/commercial/bon-de-commande", label: "Bon de Commande", icon: Receipt, bgColor: "bg-teal-500/10", iconColor: "text-teal-600" },
  { href: "/commercial/bon-pour-acquis", label: "Bon pour Acquis", icon: FileCheck, bgColor: "bg-lime-500/10", iconColor: "text-lime-600" },
  { href: "/commercial/signature", label: "Signature", icon: Pen, bgColor: "bg-slate-500/10", iconColor: "text-slate-600" },
  { href: "/commercial/numero-courrier", label: "Numéro Courrier", icon: Mail, bgColor: "bg-fuchsia-500/10", iconColor: "text-fuchsia-600" },
  { href: "/commercial/messages", label: "Messages", icon: MessageSquare, bgColor: "bg-purple-500/10", iconColor: "text-purple-600" },
];

type DashboardStats = {
  prospectsCount: number;
  clientsCount: number;
  rendezVousCount: number;
  proformasCount: number;
  todayRendezVous: number;
  upcomingRendezVous: number;
};

export default function CommercialDashboardPage() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const [clientsRes, entreprisesRes, rendezVousRes, facturesRes] =
        await Promise.all([
          fetch(`/api/prospects/clients?userId=${encodeURIComponent(user.id)}`),
          fetch(
            `/api/prospects/client-entreprises?userId=${encodeURIComponent(user.id)}`
          ),
          fetch(`/api/rendez-vous?userId=${encodeURIComponent(user.id)}`),
          fetch(`/api/facture?userId=${encodeURIComponent(user.id)}`),
        ]);

      const [clientsData, entreprisesData, rendezVousData, facturesData] =
        await Promise.all([
          clientsRes.json(),
          entreprisesRes.json(),
          rendezVousRes.json(),
          facturesRes.json(),
        ]);

      const clients = (clientsData.success ? clientsData.data : []) || [];
      const entreprises =
        (entreprisesData.success ? entreprisesData.data : []) || [];
      const rendezVous = (rendezVousData.success ? rendezVousData.data : []) || [];
      const factures = (facturesData.success ? facturesData.data : []) || [];

      const prospectsCount =
        clients.filter((c: { status_client?: string }) => c.status_client === "PROSPECT").length +
        entreprises.filter((e: { status_client?: string }) => e.status_client === "PROSPECT").length;
      const clientsCount =
        clients.filter((c: { status_client?: string }) => c.status_client !== "PROSPECT").length +
        entreprises.filter((e: { status_client?: string }) => e.status_client !== "PROSPECT").length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayRendezVous = rendezVous.filter((rv: { date: string; statut?: string }) => {
        const d = new Date(rv.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime() && rv.statut !== "ANNULE";
      }).length;

      const upcomingRendezVous = rendezVous.filter(
        (rv: { date: string; statut?: string }) => {
          const d = new Date(rv.date);
          const s = rv.statut;
          return d >= today && s !== "ANNULE" && s !== "EFFECTUE";
        }
      ).length;

      const proformasCount = factures.filter(
        (f: { status_facture?: string }) => f.status_facture === "PROFORMA"
      ).length;

      setStats({
        prospectsCount,
        clientsCount,
        rendezVousCount: rendezVous.length,
        proformasCount,
        todayRendezVous,
        upcomingRendezVous,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats({
        prospectsCount: 0,
        clientsCount: 0,
        rendezVousCount: 0,
        proformasCount: 0,
        todayRendezVous: 0,
        upcomingRendezVous: 0,
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchStats().finally(() => setLoading(false));
    }
  }, [isLoaded, user?.id, fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
          <p className="text-slate-600 font-medium">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-amber-800 to-orange-700 bg-clip-text text-transparent">
              Dashboard Commercial
            </h1>
            <p className="text-slate-600 mt-1">
              Vue d&apos;ensemble de vos activités de vente
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="border-amber-300 text-amber-800 hover:bg-amber-50 hover:border-amber-400"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Prospects
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats?.prospectsCount ?? "—"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Clients</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats?.clientsCount ?? "—"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Rendez-vous
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats?.rendezVousCount ?? "—"}
                  </p>
                  {stats && stats.todayRendezVous > 0 && (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {stats.todayRendezVous} aujourd&apos;hui
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-600" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Proformas
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stats?.proformasCount ?? "—"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">
              Accès rapide
            </CardTitle>
            <p className="text-sm text-slate-500">
              Toutes les sections de l&apos;espace commercial
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-200"
                  >
                    <div
                      className={`h-11 w-11 rounded-lg ${link.bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${link.iconColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-800 group-hover:text-amber-800">
                        {link.label}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Rendez-vous CTA */}
        {stats && stats.upcomingRendezVous > 0 && (
          <Card className="shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {stats.upcomingRendezVous} rendez-vous à venir
                    </h3>
                    <p className="text-sm text-slate-600">
                      Consultez et gérez vos prochains rendez-vous
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link
                    href="/commercial/rendez-vous"
                    className="flex items-center gap-2"
                  >
                    Voir les rendez-vous
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
