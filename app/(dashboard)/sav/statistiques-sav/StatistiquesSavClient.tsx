"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Wrench,
  CarFront,
  Receipt,
  Users,
  Calendar,
  Download,
  Filter,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const TURNOVER_DATA = [
  { month: "Jan", ca: 4500000, reparations: 24, maintenances: 18 },
  { month: "Fév", ca: 5200000, reparations: 28, maintenances: 22 },
  { month: "Mar", ca: 4800000, reparations: 25, maintenances: 19 },
  { month: "Avr", ca: 6100000, reparations: 34, maintenances: 26 },
  { month: "Mai", ca: 5900000, reparations: 31, maintenances: 25 },
  { month: "Juin", ca: 7200000, reparations: 39, maintenances: 30 },
  { month: "Juil", ca: 6800000, reparations: 36, maintenances: 28 },
];

const REPAIR_TYPES = [
  { name: "Moteur & Transmission", value: 38, color: "#0d9488" },
  { name: "Système de Freinage", value: 24, color: "#0284c7" },
  { name: "Électricité & Électronique", value: 18, color: "#8b5cf6" },
  { name: "Suspension & Train avant", value: 12, color: "#f59e0b" },
  { name: "Climatisation & Autre", value: 8, color: "#ec4899" },
];

const TECHNICIAN_PERF = [
  { name: "Mamadou K.", dossiers: 42, delaiMoyen: "1.8 jours", tauxSatisfaction: "98%" },
  { name: "Jean-Baptiste T.", dossiers: 38, delaiMoyen: "2.1 jours", tauxSatisfaction: "96%" },
  { name: "Ibrahim S.", dossiers: 35, delaiMoyen: "1.5 jours", tauxSatisfaction: "99%" },
  { name: "Kouassi A.", dossiers: 29, delaiMoyen: "2.4 jours", tauxSatisfaction: "94%" },
];

function formatCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function StatistiquesSavClient() {
  const [timeRange, setTimeRange] = useState("6m");

  const handleExportCSV = () => {
    toast.success("Rapport statistique exporté au format CSV !");
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] pb-16">
      {/* Background overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.06),transparent_25%),radial-gradient(circle_at_top_right,rgba(8,145,178,0.06),transparent_25%)]"
        aria-hidden
      />

      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(13,148,136,0.25),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(8,145,178,0.2),transparent_30%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200 backdrop-blur-md">
                <BarChart3 className="h-3.5 w-3.5 text-teal-300" />
                Performance & Key Metrics
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Statistiques & Analytics SAV
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Analyse détaillée de l&apos;activité atelier, des délais de réparation, du chiffre d&apos;affaires et de la productivité équipe.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md focus:outline-none"
              >
                <option value="1m" className="text-slate-900">30 derniers jours</option>
                <option value="6m" className="text-slate-900">6 derniers mois</option>
                <option value="1y" className="text-slate-900">Année en cours</option>
              </select>

              <Button
                onClick={handleExportCSV}
                className="rounded-2xl bg-teal-500 font-semibold text-slate-950 hover:bg-teal-400"
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CA Total SAV</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                {formatCFA(40500000)}
              </p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">+14.2% par rapport au mois dernier</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Délai moyen atelier</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">1.9 jours</p>
              <p className="mt-1 text-xs text-teal-600 font-semibold">Objectif &lt; 2.5 jours atteint</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interventions terminées</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">238 véhicules</p>
              <p className="mt-1 text-xs text-slate-500 font-medium">98.5% taux d'accord qualité</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Taux de retours</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">1.2%</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">Excellente fiabilité atelier</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* CA Trend */}
          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Évolution du Chiffre d'Affaires</CardTitle>
              <CardDescription>Facturation des réparations et pièces (en FCFA)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={TURNOVER_DATA}>
                  <defs>
                    <linearGradient id="caColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(val) => `${val / 1000000}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCFA(value), "Chiffre d'affaires"]}
                    contentStyle={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ca"
                    stroke="#0d9488"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#caColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Breakdown by Category */}
          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Types d'Interventions</CardTitle>
              <CardDescription>Répartition par domaine technique</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={REPAIR_TYPES}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {REPAIR_TYPES.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}%`, "Part d'intervention"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Technician Productivity Table */}
        <div className="mt-8">
          <Card className="border-0 bg-white shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Productivité des Techniciens</CardTitle>
              <CardDescription>Suivi individuel du volume de dossiers traités et taux de satisfaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-4">Technicien / Mécanicien</th>
                      <th className="p-4">Dossiers traités</th>
                      <th className="p-4">Délai Moyen</th>
                      <th className="p-4">Satisfaction Client</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {TECHNICIAN_PERF.map((tech) => (
                      <tr key={tech.name} className="hover:bg-slate-50/80">
                        <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-extrabold text-xs">
                            {tech.name.substring(0, 2)}
                          </div>
                          {tech.name}
                        </td>
                        <td className="p-4 tabular-nums">{tech.dossiers} véhicules</td>
                        <td className="p-4 text-teal-700">{tech.delaiMoyen}</td>
                        <td className="p-4">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {tech.tauxSatisfaction}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
