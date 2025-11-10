"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Calculator,
  BarChart3,
  PieChart,
  Calendar,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  Target,
  Download,
  Filter,
  Search,
  Bell,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// Mock data - replace with actual data from your API
const financialStats = {
  totalRevenue: 1450000000,
  monthlyRevenue: 185000000,
  pendingInvoices: 23,
  overdueInvoices: 8,
  totalClients: 156,
  activeClients: 142,
  averagePaymentTime: 28,
  cashFlow: 125000000,
};

const invoiceStatusData = [
  {
    status: "En Attente",
    count: 15,
    amount: 45000000,
    percentage: 24.3,
    color: "bg-amber-500",
    textColor: "text-amber-600",
    icon: Clock,
  },
  {
    status: "Proforma",
    count: 8,
    amount: 32000000,
    percentage: 13.0,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    icon: FileText,
  },
  {
    status: "Facture",
    count: 45,
    amount: 125000000,
    percentage: 67.6,
    color: "bg-green-500",
    textColor: "text-green-600",
    icon: Receipt,
  },
  {
    status: "Payée",
    count: 38,
    amount: 98000000,
    percentage: 52.9,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    icon: CheckCircle,
  },
  {
    status: "Annulée",
    count: 3,
    amount: 8500000,
    percentage: 1.6,
    color: "bg-red-500",
    textColor: "text-red-600",
    icon: AlertTriangle,
  },
];

const paymentMethods = [
  {
    method: "Virement Bancaire",
    count: 45,
    amount: 125000000,
    percentage: 65.2,
    color: "bg-blue-500",
  },
  {
    method: "Chèque",
    count: 18,
    amount: 42000000,
    percentage: 21.9,
    color: "bg-green-500",
  },
  {
    method: "Mobile Money",
    count: 12,
    amount: 25000000,
    percentage: 13.0,
    color: "bg-purple-500",
  },
];

const recentActivities = [
  {
    id: 1,
    action: "Facture payée",
    client: "Client ABC",
    amount: 15500000,
    time: "2 min",
    status: "success",
    icon: CheckCircle,
  },
  {
    id: 2,
    action: "Nouvelle facture créée",
    client: "Client XYZ",
    amount: 8200000,
    time: "15 min",
    status: "info",
    icon: FileText,
  },
  {
    id: 3,
    action: "Paiement en retard",
    client: "Client DEF",
    amount: 12000000,
    time: "1h",
    status: "warning",
    icon: AlertTriangle,
  },
  {
    id: 4,
    action: "Proforma validée",
    client: "Client GHI",
    amount: 25000000,
    time: "2h",
    status: "success",
    icon: Receipt,
  },
  {
    id: 5,
    action: "Facture annulée",
    client: "Client JKL",
    amount: 5500000,
    time: "3h",
    status: "error",
    icon: AlertTriangle,
  },
];

const clientAging = [
  {
    period: "0-30 jours",
    count: 45,
    amount: 125000000,
    percentage: 65.2,
    color: "bg-green-500",
  },
  {
    period: "31-60 jours",
    count: 18,
    amount: 42000000,
    percentage: 21.9,
    color: "bg-yellow-500",
  },
  {
    period: "61-90 jours",
    count: 8,
    amount: 15000000,
    percentage: 7.8,
    color: "bg-orange-500",
  },
  {
    period: "90+ jours",
    count: 5,
    amount: 10000000,
    percentage: 5.2,
    color: "bg-red-500",
  },
];

const quickActions = [
  {
    title: "Nouvelle Facture",
    icon: Plus,
    color: "bg-blue-50 hover:bg-blue-100",
    iconColor: "text-blue-600",
    href: "/commercial/creerFacture",
  },
  {
    title: "Enregistrer Paiement",
    icon: CreditCard,
    color: "bg-green-50 hover:bg-green-100",
    iconColor: "text-green-600",
    href: "/comptable/paiements",
  },
  {
    title: "Rapport Financier",
    icon: BarChart3,
    color: "bg-purple-50 hover:bg-purple-100",
    iconColor: "text-purple-600",
    href: "/comptable/rapports",
  },
  {
    title: "Relances Clients",
    icon: AlertTriangle,
    color: "bg-orange-50 hover:bg-orange-100",
    iconColor: "text-orange-600",
    href: "/comptable/relances",
  },
  {
    title: "Analyse Trésorerie",
    icon: Wallet,
    color: "bg-indigo-50 hover:bg-indigo-100",
    iconColor: "text-indigo-600",
    href: "/comptable/tresorerie",
  },
  {
    title: "Budget Prévisionnel",
    icon: Target,
    color: "bg-emerald-50 hover:bg-emerald-100",
    iconColor: "text-emerald-600",
    href: "/comptable/budget",
  },
];

const ComptableDashboard = () => {
  // Format currency in FCFA
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + 'B FCFA';
    } else if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M FCFA';
    }
    return formatCurrency(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Premium Header with Actions */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Dashboard Comptable
                  </h1>
                  <p className="text-slate-600 text-base md:text-lg mt-1">
                    Vue d&apos;ensemble financière et gestion comptable
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 px-3 py-1.5 shadow-lg shadow-emerald-500/20">
                  <Activity className="w-3.5 h-3.5 mr-1.5" />
                  Système actif
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-3 py-1.5 shadow-lg shadow-blue-500/20">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Rechercher</span>
              </Button>
              <Button variant="outline" className="gap-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtrer</span>
              </Button>
              <Button variant="outline" className="gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>
              <Button variant="outline" size="icon" className="relative hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Total Revenue Card */}
        <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 transform hover:scale-105 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90">
              Chiffre d&apos;Affaires Total
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {formatCompactCurrency(financialStats.totalRevenue)}
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">+8.2%</span>
              </div>
              <span className="text-xs">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Card */}
        <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 transform hover:scale-105 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90">
              CA du Mois
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {formatCompactCurrency(financialStats.monthlyRevenue)}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-white/80">
                Objectif: {formatCompactCurrency(200000000)}
              </p>
              <div className="relative h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-white w-[92.5%] rounded-full shadow-lg"></div>
              </div>
              <p className="text-xs text-white/90 font-medium">92.5% atteint</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invoices Card */}
        <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 transform hover:scale-105 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90">
              Factures en Attente
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {financialStats.pendingInvoices}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-semibold text-white">{financialStats.overdueInvoices} en retard</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Card */}
        <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 transform hover:scale-105 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-white/90">
              Trésorerie
            </CardTitle>
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {formatCompactCurrency(financialStats.cashFlow)}
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">+12.5%</span>
              </div>
              <span className="text-xs">vs semaine dernière</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Quick Actions */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <CardHeader className="pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Actions Rapides
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Accès direct aux fonctions comptables principales
              </CardDescription>
            </div>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-3 py-1.5 shadow-lg">
              {quickActions.length} actions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href || "#"}
                  className="group relative flex flex-col items-center p-4 md:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-100 hover:border-slate-200 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300"></div>
                  <div className={`relative p-3.5 rounded-xl bg-gradient-to-br shadow-md group-hover:shadow-xl transition-all duration-300 ${action.iconColor === 'text-blue-600' ? 'from-blue-500 to-blue-600' : action.iconColor === 'text-green-600' ? 'from-green-500 to-green-600' : action.iconColor === 'text-purple-600' ? 'from-purple-500 to-purple-600' : action.iconColor === 'text-orange-600' ? 'from-orange-500 to-orange-600' : action.iconColor === 'text-indigo-600' ? 'from-indigo-500 to-indigo-600' : 'from-emerald-500 to-emerald-600'}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <span className="relative text-sm font-semibold text-slate-700 mt-3 text-center group-hover:text-slate-900 transition-colors">
                    {action.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Invoice Status Overview */}
        <Card className="xl:col-span-2 border-0 shadow-xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Statut des Factures
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Répartition des factures par statut
                </CardDescription>
              </div>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Voir détails</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {invoiceStatusData.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50/50 to-white hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl ${item.color.replace('bg-', 'bg-gradient-to-br from-')} ${item.color.replace('bg-', 'to-')} shadow-md`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 text-lg">
                            {item.status}
                          </span>
                          <p className="text-xs text-slate-500">{item.count} factures</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-900 block">
                          {formatCompactCurrency(item.amount)}
                        </span>
                        <Badge className={`${item.color} text-white border-0 mt-1`}>
                          {item.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`absolute inset-y-0 left-0 ${item.color} rounded-full transition-all duration-700 ease-out shadow-lg`}
                        style={{ width: `${item.percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"></div>
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Activités Récentes
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Dernières opérations comptables
                </CardDescription>
              </div>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1.5 shadow-lg animate-pulse">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="group flex items-start space-x-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50/50 to-white hover:shadow-md transition-all duration-300 border border-slate-100 hover:border-slate-200"
                  >
                    <div
                      className={`p-2.5 rounded-xl shadow-md ${
                        activity.status === "success"
                          ? "bg-gradient-to-br from-green-500 to-emerald-600"
                          : activity.status === "warning"
                          ? "bg-gradient-to-br from-amber-500 to-orange-600"
                          : activity.status === "error"
                          ? "bg-gradient-to-br from-red-500 to-rose-600"
                          : "bg-gradient-to-br from-blue-500 to-cyan-600"
                      }`}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {activity.action}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {activity.client}
                        </span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                          {formatCompactCurrency(activity.amount)}
                        </span>
                        <span className="text-xs text-slate-500">
                          • {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods & Client Aging */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Payment Methods */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Méthodes de Paiement
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Répartition des paiements par méthode
                </CardDescription>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <PieChart className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {paymentMethods.map((method, index) => (
                <div key={index} className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50/50 to-white hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${method.color} shadow-lg`}></div>
                      <span className="font-semibold text-slate-900 text-base">
                        {method.method}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block text-base">
                        {formatCompactCurrency(method.amount)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {method.count} paiements
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className={`absolute inset-y-0 left-0 ${method.color} rounded-full transition-all duration-700 ease-out shadow-md`}
                      style={{ width: `${method.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className="bg-slate-200 text-slate-700 text-xs border-0">
                      {method.percentage}% du total
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Aging */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"></div>
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Âge des Créances
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Analyse des créances clients par période
                </CardDescription>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {clientAging.map((period, index) => (
                <div key={index} className="group p-4 rounded-2xl bg-gradient-to-br from-slate-50/50 to-white hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${period.color} shadow-lg`}></div>
                      <span className="font-semibold text-slate-900 text-base">
                        {period.period}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block text-base">
                        {formatCompactCurrency(period.amount)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {period.count} clients
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className={`absolute inset-y-0 left-0 ${period.color} rounded-full transition-all duration-700 ease-out shadow-md`}
                      style={{ width: `${period.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className={`${period.color} text-white text-xs border-0 shadow-md`}>
                      {period.percentage}% des créances
                    </Badge>
                    {index >= 2 && (
                      <Badge className="bg-red-100 text-red-700 text-xs border-0">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        À suivre
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Key Performance Indicators */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500"></div>
        <CardHeader className="pb-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Indicateurs Clés de Performance
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1">
                Métriques financières importantes
              </CardDescription>
            </div>
            <Button className="gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analyse complète</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            {/* Average Payment Time KPI */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">
                    Délai Moyen de Paiement
                  </span>
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-md">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {financialStats.averagePaymentTime} jours
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
                    <ArrowDownRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-semibold">-3 jours</span>
                  </div>
                  <span className="text-xs text-slate-600">vs mois dernier</span>
                </div>
              </div>
            </div>

            {/* Active Clients KPI */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">
                    Clients Actifs
                  </span>
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {financialStats.activeClients}
                </div>
                <div className="text-sm text-slate-600">
                  sur <span className="font-semibold text-slate-900">{financialStats.totalClients}</span> clients total
                </div>
                <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                    style={{ width: `${(financialStats.activeClients / financialStats.totalClients) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recovery Rate KPI */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">
                    Taux de Recouvrement
                  </span>
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  94.2%
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-semibold">+2.1%</span>
                  </div>
                  <span className="text-xs text-slate-600">vs trimestre</span>
                </div>
              </div>
            </div>

            {/* Net Margin KPI */}
            <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 hover:border-orange-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">
                    Marge Nette
                  </span>
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-md">
                    <Calculator className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  18.5%
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-semibold">+1.2%</span>
                  </div>
                  <span className="text-xs text-slate-600">vs mois dernier</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptableDashboard;