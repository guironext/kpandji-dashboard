"use client";

import React, { useEffect, useState } from "react";
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
  Warehouse,
  Package,
  ClipboardCheck,
  Archive,
  Settings,
  ContainerIcon,
  RotateCcw,
  Truck,
  FileText,
  CheckCircle,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Boxes,
  PackageCheck,
  Zap,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

const MagasinierDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Mock data - replace with actual API calls
  const stats = {
    totalStock: 1247,
    stockDisponible: 892,
    stockEnVerification: 156,
    stockEnStockage: 199,
    piecesVerifiees: 234,
    piecesEnAttente: 45,
    operationsMontage: 12,
    operationsCorrection: 5,
    commandesARenseigner: 8,
    piecesAAttribuer: 23,
  };

  const quickActions = [
    {
      title: "Renseigner Commande",
      icon: ClipboardCheck,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "text-blue-600",
      count: stats.commandesARenseigner,
      href: "/magasinier/renseigner-commande",
      description: "Renseigner les détails des commandes",
    },
    {
      title: "Pièces Vérifiées",
      icon: PackageCheck,
      color: "bg-green-50 hover:bg-green-100",
      iconColor: "text-green-600",
      count: stats.piecesVerifiees,
      href: "/magasinier/verification",
      description: "Gérer les pièces vérifiées",
    },
    {
      title: "Stockage",
      icon: Archive,
      color: "bg-purple-50 hover:bg-purple-100",
      iconColor: "text-purple-600",
      count: stats.stockEnStockage,
      href: "/magasinier/stockage",
      description: "Organiser le stockage",
    },
    {
      title: "Stock",
      icon: Warehouse,
      color: "bg-indigo-50 hover:bg-indigo-100",
      iconColor: "text-indigo-600",
      count: stats.stockDisponible,
      href: "/magasinier/stock",
      description: "Consulter le stock disponible",
    },
    {
      title: "Attribution Pièces",
      icon: Settings,
      color: "bg-orange-50 hover:bg-orange-100",
      iconColor: "text-orange-600",
      count: stats.piecesAAttribuer,
      href: "/magasinier/attributionpieces",
      description: "Attribuer les pièces aux équipes",
    },
    {
      title: "Opérations Montage",
      icon: ContainerIcon,
      color: "bg-cyan-50 hover:bg-cyan-100",
      iconColor: "text-cyan-600",
      count: stats.operationsMontage,
      href: "/magasinier/montage",
      description: "Suivre les opérations de montage",
    },
    {
      title: "Opérations Correction",
      icon: RotateCcw,
      color: "bg-red-50 hover:bg-red-100",
      iconColor: "text-red-600",
      count: stats.operationsCorrection,
      href: "/magasinier/correction",
      description: "Gérer les corrections",
    },
    {
      title: "Retour Pièces",
      icon: Truck,
      color: "bg-amber-50 hover:bg-amber-100",
      iconColor: "text-amber-600",
      count: 0,
      href: "/magasinier/Retourstock",
      description: "Gérer les retours de pièces",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "Pièces vérifiées",
      details: "15 pièces vérifiées avec succès",
      time: "2 min",
      status: "success",
      icon: CheckCircle,
    },
    {
      id: 2,
      action: "Stockage complété",
      details: "Lot #2024-001 stocké en zone A-3",
      time: "15 min",
      status: "success",
      icon: Archive,
    },
    {
      id: 3,
      action: "Commande renseignée",
      details: "Commande #CMD-456 renseignée",
      time: "1h",
      status: "info",
      icon: ClipboardCheck,
    },
    {
      id: 4,
      action: "Pièces attribuées",
      details: "12 pièces attribuées à l'équipe Alpha",
      time: "2h",
      status: "success",
      icon: Settings,
    },
    {
      id: 5,
      action: "Alerte stock faible",
      details: "Stock critique pour pièce #P-789",
      time: "3h",
      status: "warning",
      icon: AlertTriangle,
    },
  ];

  const stockStatus = [
    {
      status: "Disponible",
      count: stats.stockDisponible,
      percentage: Math.round((stats.stockDisponible / stats.totalStock) * 100),
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      status: "En Vérification",
      count: stats.stockEnVerification,
      percentage: Math.round(
        (stats.stockEnVerification / stats.totalStock) * 100
      ),
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      status: "En Stockage",
      count: stats.stockEnStockage,
      percentage: Math.round((stats.stockEnStockage / stats.totalStock) * 100),
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      status: "En Attente",
      count: stats.piecesEnAttente,
      percentage: Math.round((stats.piecesEnAttente / stats.totalStock) * 100),
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  const operationsStatus = [
    {
      title: "Opérations Montage",
      active: stats.operationsMontage,
      completed: 28,
      total: 40,
      progress: 70,
      trend: "up",
      change: "+5%",
      icon: ContainerIcon,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      title: "Opérations Correction",
      active: stats.operationsCorrection,
      completed: 12,
      total: 17,
      progress: 71,
      trend: "down",
      change: "-2%",
      icon: RotateCcw,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="relative p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/30 transform transition-transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
              <Warehouse className="w-8 h-8 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                Dashboard Magasinier
              </h1>
              <p className="text-slate-600 text-base md:text-lg mt-1 font-medium">
                Vue d&apos;ensemble de la gestion des stocks et opérations
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold"
          >
            <Activity className="w-4 h-4 mr-2" />
            Système actif
          </Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm md:text-base font-semibold text-slate-600">
              Stock Total
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-slate-900">
              {stats.totalStock.toLocaleString()}
            </div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-xs md:text-sm text-green-600 font-medium">+8%</p>
              <span className="text-xs text-slate-500 ml-2">
                vs mois dernier
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm md:text-base font-semibold text-slate-600">
              Stock Disponible
            </CardTitle>
            <Boxes className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-slate-900">
              {stats.stockDisponible.toLocaleString()}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-2">
              {Math.round((stats.stockDisponible / stats.totalStock) * 100)}% du stock total
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm md:text-base font-semibold text-slate-600">
              En Vérification
            </CardTitle>
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-slate-900">
              {stats.stockEnVerification}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-2">
              Pièces en cours de vérification
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm md:text-base font-semibold text-slate-600">
              Opérations Actives
            </CardTitle>
            <Zap className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl md:text-3xl font-bold text-slate-900">
              {stats.operationsMontage + stats.operationsCorrection}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-2">
              {stats.operationsMontage} montage, {stats.operationsCorrection} correction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl md:text-2xl font-semibold text-slate-900">
                Actions Rapides
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm md:text-base">
                Accès direct aux fonctions principales du magasin
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="ml-2 bg-blue-100 text-blue-700 hidden md:flex"
            >
              {quickActions.length} actions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 border-transparent hover:border-slate-200 cursor-pointer transition-all duration-200 ${action.color} group`}
                >
                  <div
                    className={`p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow mb-3 ${action.iconColor}`}
                  >
                    <IconComponent className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div className="w-full">
                    <h3 className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 mb-1 line-clamp-2">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                      {action.description}
                    </p>
                    {action.count > 0 && (
                      <Badge
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold"
                      >
                        {action.count}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Stock Status Overview */}
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl font-semibold text-slate-900">
                  Statut du Stock
                </CardTitle>
                <CardDescription className="text-slate-600 text-sm md:text-base">
                  Répartition du stock par statut
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Eye className="w-4 h-4 mr-2" />
                Voir détails
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 md:space-y-6">
              {stockStatus.map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}
                      ></div>
                      <span className="font-medium text-slate-900 text-sm md:text-base">
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg md:text-xl font-bold text-slate-900">
                        {item.count}
                      </span>
                      <span className={`text-sm font-medium ${item.textColor}`}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 md:h-3 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out group-hover:shadow-sm`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl md:text-2xl font-semibold text-slate-900">
                  Activités Récentes
                </CardTitle>
                <CardDescription className="text-slate-600 text-sm md:text-base">
                  Dernières actions du système
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hidden md:flex">
                En temps réel
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
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
                        {activity.details}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Il y a {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Status */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl md:text-2xl font-semibold text-slate-900">
                Statut des Opérations
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm md:text-base">
                Progression des opérations de montage et correction
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyse complète
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {operationsStatus.map((operation, index) => {
              const IconComponent = operation.icon;
              return (
                <div
                  key={index}
                  className="space-y-4 p-4 md:p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl ${operation.bgColor}`}>
                        <IconComponent className={`h-5 w-5 ${operation.color}`} />
                      </div>
                      <span className="font-semibold text-slate-900 text-sm md:text-base">
                        {operation.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {operation.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          operation.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {operation.change}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>
                        {operation.completed}/{operation.total} complétés
                      </span>
                      <span className="font-bold">{operation.progress}%</span>
                    </div>
                    <Progress value={operation.progress} className="h-3" />
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{operation.active} actives</span>
                      <span>{operation.total - operation.completed} restants</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reports Quick Access */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl md:text-2xl font-semibold text-slate-900">
                Rapports
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm md:text-base">
                Accès rapide aux rapports de montage et vérification
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/magasinier/rapportmontage"
              className="flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Rapport Montages</h3>
                  <p className="text-sm text-slate-600">Consulter les rapports de montage</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
            <Link
              href="/magasinier/rapportverification"
              className="flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-green-200 bg-green-50 hover:bg-green-100 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Rapport Vérification</h3>
                  <p className="text-sm text-slate-600">Consulter les rapports de vérification</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MagasinierDashboard;
