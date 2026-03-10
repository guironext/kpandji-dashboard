"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Loader2,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  Briefcase,
  UserCircle,
  Target,
  Building2,
  Layers,
  Car,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import {
  getRapportRendezVousByObjectifPeriod,
  getObjectifsFinancieresByPoleAndCommercial,
  getObjectifsVehiculesByPeriodAndCommercial,
  getObjectifsCibleByPeriodAndCommercial,
  type RapportRendezVousAnalyticsData,
  type RapportRendezVousByPeriodData,
  type ObjectifFinanciereByPoleAndCommercial,
  type ObjectifVehiculeByPeriodAndCommercial,
  type ObjectifCibleByPeriodAndCommercial,
} from "@/lib/actions/rapport-rendez-vous-analytics";
import { formatNumberWithSpaces } from "@/lib/utils";

const PROSPECT_COLOR = "#8b5cf6";
const CLIENT_COLOR = "#10b981";

export default function PerformencesPage() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<RapportRendezVousAnalyticsData | null>(null);
  const [objectifsFinancieres, setObjectifsFinancieres] = useState<ObjectifFinanciereByPoleAndCommercial[]>([]);
  const [objectifsVehicules, setObjectifsVehicules] = useState<ObjectifVehiculeByPeriodAndCommercial[]>([]);
  const [objectifsCible, setObjectifsCible] = useState<ObjectifCibleByPeriodAndCommercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsedPeriods, setCollapsedPeriods] = useState<Set<string>>(new Set());
  const [collapsedSecteurKeys, setCollapsedSecteurKeys] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [rapportResult, objectifsResult, vehiculesResult, cibleResult] = await Promise.all([
        getRapportRendezVousByObjectifPeriod(user.id),
        getObjectifsFinancieresByPoleAndCommercial(user.id),
        getObjectifsVehiculesByPeriodAndCommercial(user.id),
        getObjectifsCibleByPeriodAndCommercial(user.id),
      ]);
      if (rapportResult.success && rapportResult.data) {
        setData(rapportResult.data);
      } else if (rapportResult.error) {
        toast.error(rapportResult.error);
      }
      if (objectifsResult.success && objectifsResult.data) {
        setObjectifsFinancieres(objectifsResult.data);
      } else if (objectifsResult.error) {
        toast.error(objectifsResult.error);
      }
      if (vehiculesResult.success && vehiculesResult.data) {
        setObjectifsVehicules(vehiculesResult.data);
      } else if (vehiculesResult.error) {
        toast.error(vehiculesResult.error);
      }
      if (cibleResult.success && cibleResult.data) {
        setObjectifsCible(cibleResult.data);
      } else if (cibleResult.error) {
        toast.error(cibleResult.error);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      toast.error("Erreur lors du chargement des données");
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) {
      if (user?.id) {
        fetchData().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [isLoaded, user?.id, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const togglePeriod = (periodId: string) => {
    setCollapsedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodId)) next.delete(periodId);
      else next.add(periodId);
      return next;
    });
  };

  const toggleSecteurKey = (key: string) => {
    setCollapsedSecteurKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalProspects = data?.periods.reduce(
    (s, p) => s + p.prospects.length,
    0
  ) ?? 0;
  const totalClients = data?.periods.reduce(
    (s, p) => s + p.clients.length,
    0
  ) ?? 0;

  const chartDataByPeriod =
    data?.periods.map((p) => ({
      period: p.periodLabel.length > 20 ? p.periodLabel.slice(0, 18) + "…" : p.periodLabel,
      periodFull: p.periodLabel,
      prospects: p.prospects.length,
      clients: p.clients.length,
      total: p.prospects.length + p.clients.length,
    })) ?? [];

  const pieChartData = [
    { name: "Prospects", value: totalProspects, color: PROSPECT_COLOR },
    { name: "Clients", value: totalClients, color: CLIENT_COLOR },
  ].filter((d) => d.value > 0);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-xl border border-slate-200 flex items-center justify-center">
              <Target className="h-10 w-10 text-indigo-600" />
            </div>
            <div className="absolute -inset-3 flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-slate-800 font-semibold text-lg">Chargement des performances</p>
            <p className="text-slate-500 text-sm">Analyse des rapports et objectifs en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <Card className="max-w-md w-full border border-slate-200 shadow-xl rounded-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <User className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Accès restreint</h2>
            <p className="text-slate-600">
              Veuillez vous connecter pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalObjectif = objectifsFinancieres.reduce((s, o) => s + o.chiffreAffaire, 0);
  const totalRealise = objectifsFinancieres.reduce((s, o) => s + o.objectifReelAtteint, 0);
  const ecartGlobal = totalRealise - totalObjectif;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 shadow-xl shadow-indigo-500/25 ring-1 ring-white/30 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.1)_100%)]" />
                <Target className="h-10 w-10 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Tableau de bord des performances
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                  Rapports RDV • Objectifs financiers • Véhicules • Prospects
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 font-medium rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5 shrink-0"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <div className="group rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:border-violet-200/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prospects</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{totalProspects}</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-50 group-hover:bg-violet-100 transition-colors">
                  <Users className="h-6 w-6 text-violet-600" />
                </div>
              </div>
            </div>
            <div className="group rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:border-emerald-200/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{totalClients}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                  <Briefcase className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="group rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:border-indigo-200/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total RDV</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{totalProspects + totalClients}</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="group rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:border-amber-200/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Périodes</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{data?.periods.length ?? 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 group-hover:bg-amber-100 transition-colors">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Vue d'ensemble - Charts */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            <h2 className="text-xl font-bold text-slate-900">Vue d&apos;ensemble</h2>
          </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-indigo-50/90 via-violet-50/80 to-purple-50/80 px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-100">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Prospects vs Clients par période</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Répartition par période objectif</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  {chartDataByPeriod.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartDataByPeriod} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 10 }} angle={-35} textAnchor="end" height={80} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 10px 40px -10px rgb(0 0 0 / 0.15)" }}
                            formatter={(value) => [value ?? 0, ""]}
                            labelFormatter={(_, payload) => payload?.[0]?.payload?.periodFull ?? ""}
                          />
                          <Bar dataKey="prospects" fill={PROSPECT_COLOR} name="Prospects" radius={[0, 4, 4, 0]} stackId="a" />
                          <Bar dataKey="clients" fill={CLIENT_COLOR} name="Clients" radius={[0, 4, 4, 0]} stackId="a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-500 rounded-xl bg-slate-50/50">Aucune donnée</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-violet-50/90 via-purple-50/80 to-fuchsia-50/80 px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-100">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Répartition globale</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Prospects vs Clients (toutes périodes)</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  {pieChartData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value ?? 0, ""]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-500 rounded-xl bg-slate-50/50">
                      Aucune donnée
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
        </section>

        {/* Prospects & Clients */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
            <h2 className="text-xl font-bold text-slate-900">Prospects et clients par période</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-violet-50/90 to-purple-50/80 px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-100">
                    <UserCircle className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Prospects</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Client et Client_entreprise avec statut prospect</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <RapportTableByPeriod periods={data?.periods ?? []} type="prospects" collapsedPeriods={collapsedPeriods} onTogglePeriod={togglePeriod} />
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/80 px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Clients</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Client et Client_entreprise avec statut client</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <RapportTableByPeriod periods={data?.periods ?? []} type="clients" collapsedPeriods={collapsedPeriods} onTogglePeriod={togglePeriod} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Par secteur */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-slate-500 to-zinc-500" />
            <h2 className="text-xl font-bold text-slate-900">Répartition par secteur d&apos;activité</h2>
          </div>
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-slate-50/90 via-slate-50/80 to-zinc-50/80 px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100">
                    <Building2 className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Clients et entreprises par secteur et période</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Répartition par secteur d&apos;activité et période objectif</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <BySecteurAndPeriod periods={data?.periods ?? []} collapsedSecteurKeys={collapsedSecteurKeys} onToggleSecteurKey={toggleSecteurKey} />
              </CardContent>
            </Card>
        </section>

        {/* Objectifs financiers */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            <h2 className="text-xl font-bold text-slate-900">Suivi des objectifs financiers</h2>
          </div>
          {objectifsFinancieres.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Objectif total</p>
                <p className="text-xl font-bold text-slate-900 mt-2 tabular-nums">{formatNumberWithSpaces(totalObjectif)} <span className="text-sm font-normal text-slate-500">FCFA</span></p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Réalisé total</p>
                <p className="text-xl font-bold text-slate-900 mt-2 tabular-nums">{formatNumberWithSpaces(totalRealise)} <span className="text-sm font-normal text-slate-500">FCFA</span></p>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Écart global</p>
                <p className={`text-xl font-bold mt-2 tabular-nums ${ecartGlobal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {ecartGlobal >= 0 ? "+" : ""}{formatNumberWithSpaces(ecartGlobal)} <span className="text-sm font-normal text-slate-500">FCFA</span>
                </p>
              </div>
            </div>
          )}
            <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-yellow-50/80 px-6 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100">
                    <Target className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Par pôle et commercial</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Objectifs, réalisations et écarts par période</p>
                  </div>
                </div>
                
              </div>

              <CardContent className="p-6">
                {objectifsFinancieres.length > 0 && (
                  <div className="mb-6 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={objectifsFinancieres.map((o) => ({
                          name: `${o.nomDuCommercial} (${o.periodLabel})`,
                          objectif: o.chiffreAffaire,
                          realise: o.objectifReelAtteint,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" hide />
                        <YAxis
                          tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value: number | undefined) => (value != null ? formatNumberWithSpaces(value) + " FCFA" : "")}
                          labelFormatter={(label) => label}
                        />
                        <Legend />
                        <Bar dataKey="objectif" name="Objectif (FCFA)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="realise" name="Réalisé (FCFA)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <ObjectifsFinancieresTable objectifs={objectifsFinancieres} />
              </CardContent>
            </Card>
        </section>

        {/* Objectifs véhicules par période et commercial */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-sky-500" />
            <h2 className="text-xl font-bold text-slate-900">Objectifs véhicules par période</h2>
          </div>
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/80 to-cyan-50/80 px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Par période et commercial</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Objectifs véhicules (volume de vente) par période objectif</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {objectifsVehicules.length > 0 && (
                <div className="mb-6 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={objectifsVehicules.map((o) => ({
                        name: `${o.commercialName} (${o.periodLabel})`,
                        cible: parseFloat(String(o.objectifCible || "0").replace(/\s/g, "")) || 0,
                        realise: o.venteVehiculesRealise,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" hide />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number | undefined) => (value != null ? String(value) : "")}
                        labelFormatter={(label) => label}
                      />
                      <Legend />
                      <Bar dataKey="cible" name="Vente Véhicules (cible)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="realise" name="Vente Véhicules (réalisé)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ObjectifsVehiculesTable objectifs={objectifsVehicules} />
            </CardContent>
          </Card>
        </section>

        {/* Objectifs cible (prospects) par période et commercial */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <h2 className="text-xl font-bold text-slate-900">Objectifs prospects par période</h2>
          </div>
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-violet-50/90 via-purple-50/80 to-fuchsia-50/80 px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-100">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Objectif cible (prospects) par période et commercial</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nombre de prospects ciblés par période objectif</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {objectifsCible.length > 0 && (
                <div className="mb-6 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={objectifsCible.map((o) => ({
                        name: `${o.commercialName} (${o.periodLabel})`,
                        cible: o.prospectCible,
                        reel: o.prospectReel,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" hide />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number | undefined) => (value != null ? String(value) : "")}
                        labelFormatter={(label) => label}
                      />
                      <Legend />
                      <Bar dataKey="cible" name="Objectif cible" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reel" name="Prospect réel" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <ObjectifsCibleTable objectifs={objectifsCible} />
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  );
}

type RapportRendezVousItem = {
  id: string;
  nom_prenom_client: string;
  telephone_client: string;
  commercialName: string;
  secteur_activite: string;
  type: "client" | "client_entreprise";
  status_client: string;
};

function BySecteurAndPeriod({
  periods,
  collapsedSecteurKeys,
  onToggleSecteurKey,
}: {
  periods: RapportRendezVousByPeriodData[];
  collapsedSecteurKeys: Set<string>;
  onToggleSecteurKey: (key: string) => void;
}) {
  if (periods.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-700 font-semibold">Aucune donnée</p>
        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
          Créez des périodes objectif et des rapports rendez-vous pour afficher les données.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {periods.map((period) => {
        const allItems: RapportRendezVousItem[] = [
          ...period.prospects,
          ...period.clients,
        ];
        const bySecteur = new Map<
          string,
          { prospects: RapportRendezVousItem[]; clients: RapportRendezVousItem[] }
        >();
        for (const item of allItems) {
          const secteur = item.secteur_activite || "Non renseigné";
          const current = bySecteur.get(secteur) ?? {
            prospects: [],
            clients: [],
          };
          if (item.status_client === "PROSPECT") {
            current.prospects.push(item);
          } else {
            current.clients.push(item);
          }
          bySecteur.set(secteur, current);
        }
        const secteurs = Array.from(bySecteur.entries()).sort(
          (a, b) =>
            b[1].prospects.length +
            b[1].clients.length -
            (a[1].prospects.length + a[1].clients.length)
        );

        const secteurChartData = secteurs.map(([secteur, { prospects, clients }]) => ({
          secteur: secteur.length > 18 ? secteur.slice(0, 16) + "…" : secteur,
          secteurFull: secteur,
          prospects: prospects.length,
          clients: clients.length,
          total: prospects.length + clients.length,
        }));

        return (
          <div
            key={period.periodId}
            className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-50/80 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                  <Calendar className="h-4 w-4 text-slate-600" />
                </div>
                <span className="font-bold text-slate-800">{period.periodLabel}</span>
                <Badge className="bg-slate-200/80 text-slate-800 hover:bg-slate-200/80 font-medium">
                  {allItems.length} total
                </Badge>
              </div>
            </div>
            {secteurChartData.length > 0 && (
              <div className="px-4 py-3 border-b border-slate-200 bg-white/50">
                <p className="text-xs font-semibold text-slate-500 mb-2">Répartition par secteur</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={secteurChartData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="secteur"
                        width={140}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value) => [value ?? 0, ""]}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.secteurFull ?? ""
                        }
                      />
                      <Bar dataKey="prospects" fill={PROSPECT_COLOR} name="Prospects" stackId="s" radius={[0, 2, 2, 0]} />
                      <Bar dataKey="clients" fill={CLIENT_COLOR} name="Clients" stackId="s" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="divide-y divide-slate-200">
              {secteurs.map(([secteur, { prospects, clients }]) => {
                const total = prospects.length + clients.length;
                const key = `${period.periodId}-${secteur}`;
                const isCollapsed = collapsedSecteurKeys.has(key);
                return (
                  <div key={key} className="bg-white">
                    <button
                      type="button"
                      onClick={() => onToggleSecteurKey(key)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/80 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold text-slate-700">{secteur}</span>
                        <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                          {prospects.length} prospect{prospects.length !== 1 ? "s" : ""}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          {clients.length} client{clients.length !== 1 ? "s" : ""}
                        </Badge>
                        <span className="text-sm text-slate-500">({total} total)</span>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    {!isCollapsed && (
                      <div className="border-t border-slate-100 bg-slate-50/50">
                        <div className="overflow-x-auto max-h-52 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-sm z-10">
                              <tr className="border-b border-slate-200">
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Client / Entreprise</th>
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Téléphone</th>
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Commercial</th>
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider w-24">Statut</th>
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider w-24">Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...prospects, ...clients].map((item, idx) => (
                                <tr
                                  key={item.id}
                                  className={`border-b border-slate-100 transition-colors hover:bg-white/80 ${idx % 2 === 0 ? "bg-white/50" : "bg-transparent"}`}
                                >
                                  <td className="px-4 py-2.5 font-medium text-slate-800">
                                    {item.nom_prenom_client}
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{item.telephone_client}</td>
                                  <td className="px-4 py-2.5 text-slate-600">{item.commercialName}</td>
                                  <td className="px-4 py-2.5">
                                    <Badge
                                      variant="outline"
                                      className={
                                        item.status_client === "PROSPECT"
                                          ? "text-xs bg-violet-50 text-violet-700 border-violet-200"
                                          : "text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                                      }
                                    >
                                      {item.status_client}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Badge
                                      variant="outline"
                                      className={
                                        item.type === "client"
                                          ? "text-xs bg-blue-50 text-blue-700 border-blue-200"
                                          : "text-xs bg-amber-50 text-amber-700 border-amber-200"
                                      }
                                    >
                                      {item.type === "client" ? "Client" : "Entreprise"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ObjectifsFinancieresTable({
  objectifs,
}: {
  objectifs: ObjectifFinanciereByPoleAndCommercial[];
}) {
  if (objectifs.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Target className="h-7 w-7 text-amber-600" />
        </div>
        <p className="text-slate-700 font-semibold">Aucun objectif financier</p>
        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
          Les objectifs financiers par pôle et commercial apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-inner">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="sticky top-0 z-10 bg-slate-50/95 border-b-2 border-slate-200 backdrop-blur-sm">
          <tr>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Pôle</th>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Commercial</th>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Période</th>
            <th className="px-5 py-3.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Objectif (FCFA)</th>
            <th className="px-5 py-3.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Réalisé (FCFA)</th>
            <th className="px-5 py-3.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider">% atteint</th>
            <th className="px-5 py-3.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider whitespace-nowrap">Écart (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          {objectifs.map((o, idx) => (
            <tr
              key={o.id}
              className={`border-b border-slate-100 transition-colors hover:bg-amber-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
            >
              <td className="px-5 py-3 font-medium text-slate-800">{o.pole}</td>
              <td className="px-5 py-3 text-slate-700">{o.nomDuCommercial}</td>
              <td className="px-5 py-3 text-slate-600 text-xs">{o.periodLabel}</td>
              <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-800">
                {formatNumberWithSpaces(o.chiffreAffaire)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                {formatNumberWithSpaces(o.objectifReelAtteint)}
              </td>
              <td className="px-5 py-3 text-right">
                <Badge
                  variant="outline"
                  className={
                    o.pourcentageAtteint >= 100
                      ? "text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                      : o.pourcentageAtteint >= 50
                        ? "text-xs bg-amber-50 text-amber-700 border-amber-200 font-medium"
                        : "text-xs bg-slate-100 text-slate-600 border-slate-200"
                  }
                >
                  {o.pourcentageAtteint.toFixed(1)}%
                </Badge>
              </td>
              <td className="px-5 py-3 text-right tabular-nums">
                <span className={`font-medium ${o.ecartCible >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {o.ecartCible >= 0 ? "+" : ""}{formatNumberWithSpaces(o.ecartCible)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ObjectifsVehiculesTable({
  objectifs,
}: {
  objectifs: ObjectifVehiculeByPeriodAndCommercial[];
}) {
  if (objectifs.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Car className="h-7 w-7 text-blue-600" />
        </div>
        <p className="text-slate-700 font-semibold">Aucun objectif véhicule</p>
        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
          Les objectifs véhicules par période et commercial apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-inner">
      <table className="w-full text-sm min-w-[600px]">
        <thead className="sticky top-0 z-10 bg-slate-50/95 border-b-2 border-slate-200 backdrop-blur-sm">
          <tr>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Période</th>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Commercial</th>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Vente Véhicules (cible)</th>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Vente Véhicules (réalisé)</th>
            <th className="px-5 py-3.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider">% atteint</th>
          </tr>
        </thead>
        <tbody>
          {objectifs.map((o, idx) => (
            <tr
              key={o.id}
              className={`border-b border-slate-100 transition-colors hover:bg-blue-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
            >
              <td className="px-5 py-3 text-slate-700 text-xs">{o.periodLabel}</td>
              <td className="px-5 py-3 font-medium text-slate-800">{o.commercialName}</td>
              <td className="px-5 py-3 text-slate-600">{o.objectifCible}</td>
              <td className="px-5 py-3 text-slate-700 font-medium tabular-nums">{o.venteVehiculesRealise}</td>
              <td className="px-5 py-3 text-right">
                {o.pourcentageAtteint != null ? (
                  <Badge
                    variant="outline"
                    className={
                      o.pourcentageAtteint >= 100
                        ? "text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                        : o.pourcentageAtteint >= 50
                          ? "text-xs bg-amber-50 text-amber-700 border-amber-200 font-medium"
                          : "text-xs bg-slate-100 text-slate-600 border-slate-200"
                    }
                  >
                    {o.pourcentageAtteint.toFixed(1)}%
                  </Badge>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ObjectifsCibleTable({
  objectifs,
}: {
  objectifs: ObjectifCibleByPeriodAndCommercial[];
}) {
  if (objectifs.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
          <Users className="h-7 w-7 text-violet-600" />
        </div>
        <p className="text-slate-700 font-semibold">Aucun objectif cible</p>
        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
          Les objectifs prospects par période et commercial apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-inner">
      <table className="w-full text-sm min-w-[500px]">
        <thead className="sticky top-0 z-10 bg-slate-50/95 border-b-2 border-slate-200 backdrop-blur-sm">
          <tr>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Période</th>
            <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Commercial</th>
            <th className="px-5 py-3.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider">Prospect cible</th>
            <th className="px-5 py-3.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider">Prospect réel</th>
            <th className="px-5 py-3.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider">% atteint</th>
          </tr>
        </thead>
        <tbody>
          {objectifs.map((o, idx) => (
            <tr
              key={o.id}
              className={`border-b border-slate-100 transition-colors hover:bg-violet-50/40 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
            >
              <td className="px-5 py-3 text-slate-700 text-xs">{o.periodLabel}</td>
              <td className="px-5 py-3 font-medium text-slate-800">{o.commercialName}</td>
              <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-800">{o.prospectCible}</td>
              <td className="px-5 py-3 text-right tabular-nums text-slate-600">{o.prospectReel}</td>
              <td className="px-5 py-3 text-right">
                <Badge
                  variant="outline"
                  className={
                    o.tauxAtteint >= 100
                      ? "text-xs bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                      : o.tauxAtteint >= 50
                        ? "text-xs bg-amber-50 text-amber-700 border-amber-200 font-medium"
                        : "text-xs bg-slate-100 text-slate-600 border-slate-200"
                  }
                >
                  {o.tauxAtteint.toFixed(1)}%
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RapportTableByPeriod({
  periods,
  type,
  collapsedPeriods,
  onTogglePeriod,
}: {
  periods: RapportRendezVousByPeriodData[];
  type: "prospects" | "clients";
  collapsedPeriods: Set<string>;
  onTogglePeriod: (id: string) => void;
}) {
  const items = periods.flatMap((p) =>
    (type === "prospects" ? p.prospects : p.clients).map((item) => ({
      ...item,
      periodLabel: p.periodLabel,
      periodId: p.periodId,
    }))
  );

  if (periods.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-700 font-semibold">Aucune donnée</p>
        <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
          Créez des périodes objectif et des rapports rendez-vous pour afficher les données.
        </p>
      </div>
    );
  }

  const byPeriod = new Map<string, typeof items>();
  for (const item of items) {
    const list = byPeriod.get(item.periodId) ?? [];
    list.push(item);
    byPeriod.set(item.periodId, list);
  }

  return (
    <div className="space-y-2">
      {periods.map((period) => {
        const periodItems = byPeriod.get(period.periodId) ?? [];
        const isCollapsed = collapsedPeriods.has(period.periodId);
        return (
          <div
            key={period.periodId}
            className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              type="button"
              onClick={() => onTogglePeriod(period.periodId)}
              className={`w-full flex items-center justify-between px-5 py-3.5 transition-all text-left rounded-t-xl ${
                type === "prospects"
                  ? "bg-violet-50/60 hover:bg-violet-50"
                  : "bg-emerald-50/60 hover:bg-emerald-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`h-5 w-5 ${type === "prospects" ? "text-violet-600" : "text-emerald-600"}`} />
                <span className="font-semibold text-slate-800">{period.periodLabel}</span>
                <Badge
                  className={
                    type === "prospects"
                      ? "bg-violet-100 text-violet-700 hover:bg-violet-100"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  }
                >
                  {periodItems.length} {type === "prospects" ? "prospect" : "client"}
                  {periodItems.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              )}
            </button>
            {!isCollapsed && (
              <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-b-xl">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Client</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Téléphone</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Commercial</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Secteur</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider w-24">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-500 bg-slate-50/50">
                          Aucun {type === "prospects" ? "prospect" : "client"} pour cette période
                        </td>
                      </tr>
                    ) : (
                      periodItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-slate-100 transition-colors hover:bg-slate-50/80 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                        >
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {item.nom_prenom_client}
                          </td>
                          <td className="px-5 py-3 text-slate-600 font-mono text-xs">{item.telephone_client}</td>
                          <td className="px-5 py-3 text-slate-600">{item.commercialName}</td>
                          <td className="px-5 py-3 text-slate-600">{item.secteur_activite}</td>
                          <td className="px-5 py-3">
                            <Badge
                              variant="outline"
                              className={
                                item.type === "client"
                                  ? "text-xs bg-blue-50 text-blue-700 border-blue-200"
                                  : "text-xs bg-amber-50 text-amber-700 border-amber-200"
                              }
                            >
                              {item.type === "client" ? "Client" : "Entreprise"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
