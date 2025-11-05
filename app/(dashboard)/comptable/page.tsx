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
import { Progress } from "@/components/ui/progress";
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

} from "lucide-react";
import Link from "next/link";
// Mock data - replace with actual data from your API
const financialStats = {
  totalRevenue: 2450000,
  monthlyRevenue: 185000,
  pendingInvoices: 23,
  overdueInvoices: 8,
  totalClients: 156,
  activeClients: 142,
  averagePaymentTime: 28,
  cashFlow: 125000,
};

const invoiceStatusData = [
  {
    status: "En Attente",
    count: 15,
    amount: 45000,
    percentage: 24.3,
    color: "bg-amber-500",
    textColor: "text-amber-600",
    icon: Clock,
  },
  {
    status: "Proforma",
    count: 8,
    amount: 32000,
    percentage: 13.0,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    icon: FileText,
  },
  {
    status: "Facture",
    count: 45,
    amount: 125000,
    percentage: 67.6,
    color: "bg-green-500",
    textColor: "text-green-600",
    icon: Receipt,
  },
  {
    status: "Payée",
    count: 38,
    amount: 98000,
    percentage: 52.9,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    icon: CheckCircle,
  },
  {
    status: "Annulée",
    count: 3,
    amount: 8500,
    percentage: 1.6,
    color: "bg-red-500",
    textColor: "text-red-600",
    icon: AlertTriangle,
  },
];

const paymentMethods = [
  {
    method: "Virement",
    count: 45,
    amount: 125000,
    percentage: 65.2,
    color: "bg-blue-500",
  },
  {
    method: "Chèque",
    count: 18,
    amount: 42000,
    percentage: 21.9,
    color: "bg-green-500",
  },
  {
    method: "Carte Bancaire",
    count: 12,
    amount: 25000,
    percentage: 13.0,
    color: "bg-purple-500",
  },
];

const recentActivities = [
  {
    id: 1,
    action: "Facture payée",
    client: "Client ABC",
    amount: "15,500 €",
    time: "2 min",
    status: "success",
    icon: CheckCircle,
  },
  {
    id: 2,
    action: "Nouvelle facture créée",
    client: "Client XYZ",
    amount: "8,200 €",
    time: "15 min",
    status: "info",
    icon: FileText,
  },
  {
    id: 3,
    action: "Paiement en retard",
    client: "Client DEF",
    amount: "12,000 €",
    time: "1h",
    status: "warning",
    icon: AlertTriangle,
  },
  {
    id: 4,
    action: "Proforma validée",
    client: "Client GHI",
    amount: "25,000 €",
    time: "2h",
    status: "success",
    icon: Receipt,
  },
  {
    id: 5,
    action: "Facture annulée",
    client: "Client JKL",
    amount: "5,500 €",
    time: "3h",
    status: "error",
    icon: AlertTriangle,
  },
];

const clientAging = [
  {
    period: "0-30 jours",
    count: 45,
    amount: 125000,
    percentage: 65.2,
    color: "bg-green-500",
  },
  {
    period: "31-60 jours",
    count: 18,
    amount: 42000,
    percentage: 21.9,
    color: "bg-yellow-500",
  },
  {
    period: "61-90 jours",
    count: 8,
    amount: 15000,
    percentage: 7.8,
    color: "bg-orange-500",
  },
  {
    period: "90+ jours",
    count: 5,
    amount: 10000,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent py-3">
            Dashboard Comptable
          </h1>
          <p className="text-slate-600 text-lg">
            Vue d&apos;ensemble financière et gestion comptable
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1"
          >
            <Activity className="w-4 h-4 mr-2" />
            Système actif
          </Badge>
          <Badge
            variant="outline"
            className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString('fr-FR')}
          </Badge>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-600">
              Chiffre d&apos;Affaires Total
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(financialStats.totalRevenue)}
            </div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-sm text-green-600 font-medium">+8.2%</p>
              <span className="text-xs text-slate-500 ml-2">
                vs mois dernier
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-600">
              CA du Mois
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(financialStats.monthlyRevenue)}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Objectif: {formatCurrency(200000)}
            </p>
            <Progress value={92.5} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-600">
              Factures en Attente
            </CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">
              {financialStats.pendingInvoices}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {financialStats.overdueInvoices} en retard
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-600">
              Trésorerie
            </CardTitle>
            <Wallet className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">
              {formatCurrency(financialStats.cashFlow)}
            </div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-sm text-green-600 font-medium">+12.5%</p>
              <span className="text-xs text-slate-500 ml-2">
                vs semaine dernière
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Actions Rapides
            <Badge
              variant="secondary"
              className="ml-2 bg-blue-100 text-blue-700"
            >
              {quickActions.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-slate-600">
            Accès direct aux fonctions comptables principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href || "#"}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 border-transparent hover:border-slate-200 cursor-pointer transition-all duration-200 ${action.color} group`}
                >
                  <div
                    className={`p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow ${action.iconColor}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 mt-3 group-hover:text-slate-900">
                    {action.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Invoice Status Overview */}
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Statut des Factures
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Répartition des factures par statut
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Voir détails
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {invoiceStatusData.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}
                        ></div>
                        <IconComponent className={`w-4 h-4 ${item.textColor}`} />
                        <span className="font-medium text-slate-900">
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold text-slate-900">
                          {item.count}
                        </span>
                        <span className="text-sm font-medium text-slate-600">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className={`text-sm font-medium ${item.textColor}`}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out group-hover:shadow-sm`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Activités Récentes
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Dernières opérations comptables
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                En temps réel
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.status === "success"
                          ? "bg-green-100"
                          : activity.status === "warning"
                          ? "bg-amber-100"
                          : activity.status === "error"
                          ? "bg-red-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <IconComponent
                        className={`w-4 h-4 ${
                          activity.status === "success"
                            ? "text-green-600"
                            : activity.status === "warning"
                            ? "text-amber-600"
                            : activity.status === "error"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activity.client} • {activity.amount} • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods & Client Aging */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Méthodes de Paiement
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Répartition des paiements par méthode
                </CardDescription>
              </div>
              <PieChart className="w-5 h-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {method.method}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">
                        {method.count} paiements
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(method.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-full ${method.color} rounded-full transition-all duration-500`}
                      style={{ width: `${method.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {method.percentage}% du total
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Aging */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Âge des Créances
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Analyse des créances clients par période
                </CardDescription>
              </div>
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientAging.map((period, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {period.period}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">
                        {period.count} clients
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(period.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-full ${period.color} rounded-full transition-all duration-500`}
                      style={{ width: `${period.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {period.percentage}% des créances
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Indicators */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Indicateurs Clés de Performance
              </CardTitle>
              <CardDescription className="text-slate-600">
                Métriques financières importantes
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyse complète
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="space-y-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Délai Moyen de Paiement
                </span>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {financialStats.averagePaymentTime} jours
              </div>
              <div className="flex items-center">
                <ArrowDownRight className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">-3 jours</span>
                <span className="text-xs text-slate-500 ml-2">vs mois dernier</span>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Clients Actifs
                </span>
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {financialStats.activeClients}
              </div>
              <div className="text-sm text-slate-500">
                sur {financialStats.totalClients} clients total
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Taux de Recouvrement
                </span>
                <Target className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">94.2%</div>
              <div className="flex items-center">
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">+2.1%</span>
                <span className="text-xs text-slate-500 ml-2">vs trimestre dernier</span>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  Marge Nette
                </span>
                <Calculator className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">18.5%</div>
              <div className="flex items-center">
                <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">+1.2%</span>
                <span className="text-xs text-slate-500 ml-2">vs mois dernier</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComptableDashboard;