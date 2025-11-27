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
  Users,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Car,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  CheckSquare,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllCommandes } from "@/lib/actions/commande";

type CommandeWithRelations = {
  id: string;
  nbr_portes: string;
  transmission: string;
  etapeCommande: string;
  motorisation: string;
  couleur: string;
  date_livraison: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  clientId: string | null;
  voitureModelId?: string | null;
  conteneurId?: string | null;
  commandeLocalId?: string | null;
  prix_unitaire?: number | null;
  client?: { nom: string; [key: string]: unknown } | null;
  voitureModel?: { model: string; [key: string]: unknown } | null;
  fournisseurs?: { id: string; nom: string }[];
  [key: string]: unknown;
};

const ManagerDashboard = () => {
  const router = useRouter();
  const [commandes, setCommandes] = useState<CommandeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommandes = async () => {
      const result = await getAllCommandes();
      if (result.success && result.data) {
        setCommandes(result.data as unknown as CommandeWithRelations[]);
      }
      setLoading(false);
    };
    fetchCommandes();
  }, []);

  // Mock data - replace with actual data from your API
  const stats = {
    totalOrders: 156,
    pendingOrders: 23,
    completedOrders: 98,
    inProgressOrders: 35,
    totalVehicles: 89,
    vehiclesInStock: 45,
    vehiclesInAssembly: 28,
    vehiclesInTesting: 16,
    totalTeams: 8,
    activeTeams: 6,
    totalEmployees: 45,
    activeEmployees: 42,
  };

  const recentActivities = [
    {
      id: 1,
      action: "Nouvelle commande validée",
      client: "Client ABC",
      time: "2 min",
      status: "success",
      icon: CheckCircle,
    },
    {
      id: 2,
      action: "Montage terminé",
      vehicle: "Toyota Camry #001",
      time: "15 min",
      status: "success",
      icon: Car,
    },
    {
      id: 3,
      action: "Réclamation pièces",
      client: "Client XYZ",
      time: "1h",
      status: "warning",
      icon: AlertTriangle,
    },
    {
      id: 4,
      action: "Conteneur arrivé",
      container: "CONT-2024-001",
      time: "2h",
      status: "info",
      icon: Truck,
    },
    {
      id: 5,
      action: "Teste échoué",
      vehicle: "Honda Civic #002",
      time: "3h",
      status: "error",
      icon: AlertTriangle,
    },
  ];

  const orderStatusData = [
    {
      status: "Proposées",
      count: 12,
      percentage: 7.7,
      color: "bg-amber-500",
      textColor: "text-amber-600",
    },
    {
      status: "Validées",
      count: 23,
      percentage: 14.7,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      status: "En Transit",
      count: 18,
      percentage: 11.5,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      status: "Arrivées",
      count: 15,
      percentage: 9.6,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      status: "En Montage",
      count: 28,
      percentage: 17.9,
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
    {
      status: "Terminées",
      count: 60,
      percentage: 38.5,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
    },
  ];

  const teamPerformance = [
    {
      team: "Équipe Alpha",
      progress: 85,
      completed: 12,
      total: 14,
      trend: "up",
      change: "+5%",
    },
    {
      team: "Équipe Beta",
      progress: 72,
      completed: 8,
      total: 11,
      trend: "down",
      change: "-2%",
    },
    {
      team: "Équipe Gamma",
      progress: 90,
      completed: 18,
      total: 20,
      trend: "up",
      change: "+8%",
    },
    {
      team: "Équipe Delta",
      progress: 65,
      completed: 6,
      total: 9,
      trend: "up",
      change: "+3%",
    },
  ];

  // Group commandes by etapeCommande
  const commandesByEtape = commandes.reduce((acc, commande) => {
    const etape = commande.etapeCommande;
    if (!acc[etape]) {
      acc[etape] = [];
    }
    acc[etape].push(commande);
    return acc;
  }, {} as Record<string, CommandeWithRelations[]>);

  // Get the count of PROPOSITION commandes
  const propositionCommandesCount = commandesByEtape.PROPOSITION?.length || 0;

  // Get the count of VALIDE commandes
  const valideCommandesCount = commandesByEtape.VALIDE?.length || 0;

  // Get the count of TRANSITE commandes
  const transiteCommandesCount = commandesByEtape.TRANSITE?.length || 0;

  // Get the count of RENSEIGNEE commandes
  const renseigneeCommandesCount = commandesByEtape.RENSEIGNEE?.length || 0;

  // Get the count of ARRIVE commandes
  const arriveCommandesCount = commandesByEtape.ARRIVE?.length || 0;

  const quickActions = [
    {
      title: "Nouvelle Commande",
      icon: Plus,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "text-blue-600",
      nbr: propositionCommandesCount,
      href: "/manager/ajouter-commande",
    },
    {
      title: "Commandes Proposées",
      icon: AlertCircle,
      color: "bg-amber-50 hover:bg-amber-100",
      iconColor: "text-amber-600",
      nbr: propositionCommandesCount,
      href: "/manager/equipes",
    },
    {
      title: "Commandes Validées",
      icon: CheckSquare,
      color: "bg-green-50 hover:bg-green-100",
      iconColor: "text-green-600",
      nbr: valideCommandesCount,
      href: "/manager/corrections",
    },
    {
      title: "Commandes Transites",
      icon: Truck,
      color: "bg-purple-50 hover:bg-purple-100",
      iconColor: "text-purple-600",
      nbr: transiteCommandesCount,
      href: "/manager/rapports",
    },
    {
      title: "Commandes Renseignées",
      icon: ClipboardCheck,
      color: "bg-indigo-50 hover:bg-indigo-100",
      iconColor: "text-indigo-600",
      nbr: renseigneeCommandesCount,
      href: "/manager/stock",
    },
    {
      title: "Commandes Arrivées",
      icon: CheckCircle,
      color: "bg-emerald-50 hover:bg-emerald-100",
      iconColor: "text-emerald-600",
      nbr: arriveCommandesCount,
      href: "/manager/commandes-arrivees",
    },
  ];

  // Define etape configurations
  const etapeConfig = {
    PROPOSITION: {
      label: "Proposées",
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: AlertCircle,
    },
    VALIDE: {
      label: "Validées",
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: CheckSquare,
    },
    TRANSITE: {
      label: "En Transit",
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      icon: Truck,
    },
    RENSEIGNEE: {
      label: "Renseignées",
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      icon: ClipboardCheck,
    },
    ARRIVE: {
      label: "Arrivées",
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: CheckCircle,
    },
    VERIFIER: {
      label: "Vérifiées",
      color: "bg-cyan-500",
      textColor: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
      icon: Eye,
    },
    MONTAGE: {
      label: "En Montage",
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      icon: Wrench,
    },
    TESTE: {
      label: "En Test",
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      icon: Play,
    },
    PARKING: {
      label: "En Parking",
      color: "bg-gray-500",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      icon: Pause,
    },
    CORRECTION: {
      label: "En Correction",
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: RotateCcw,
    },
    VENTE: {
      label: "Vendues",
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: ShoppingCart,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent py-3">
            Dashboard Manager
          </h1>
          <p className="text-slate-600 text-lg">
            Vue d&apos;ensemble des opérations et performances
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
        </div>
      </div>

      {/* Data Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="p-4 cursor-pointer"
          onClick={() => router.push("/manager/montage")}
        >
          <div className="text-2xl font-bold text-blue-600">
            Ordre de Montage
          </div>
          <div className="text-sm text-slate-600">5</div>
        </Card>

        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            Ordre de Correction
          </div>
          <div className="text-sm text-slate-600">3</div>
        </Card>

        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            Ordre de Livraison
          </div>
          <div className="text-sm text-slate-600">Équipes</div>
        </Card>

        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">Ordre Achat</div>
          <div className="text-sm text-slate-600">
            Ordre achat de pièces locales
          </div>
        </Card>
        
      </div>

      {/* PROPOSITION Commandes Count Card */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Commandes en Proposition
              </CardTitle>
              <CardDescription className="text-slate-600">
                Nombre total de commandes Proposées
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-amber-600">
                {propositionCommandesCount}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Quick Actions */}
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
            Accès direct aux fonctions principales
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
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium text-slate-700 mt-3 group-hover:text-slate-900">
                      {action.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1"
                    >
                      {action.nbr}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-600">
              Commandes en Montage
            </CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">
              {stats.totalOrders}
            </div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-sm text-green-600 font-medium">+12%</p>
              <span className="text-xs text-slate-500 ml-2">
                vs semaine dernière
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-600">
              Commandes en Correction
            </CardTitle>
            <Car className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">
              {stats.vehiclesInStock}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {stats.vehiclesInAssembly} Véhicules en Correction
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-600">
              Commandes non délivrées
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">
              {stats.activeTeams}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              sur {stats.totalTeams} Commandes finies non délivrées
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold text-slate-600">
              Equipes actives en usines
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">94%</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-sm text-green-600 font-medium">+2%</p>
              <span className="text-xs text-slate-500 ml-2">
                vs par Montage
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Enhanced Order Status Overview */}
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Statut des Commandes
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Répartition des commandes par étape
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
              {orderStatusData.map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}
                      ></div>
                      <span className="font-medium text-slate-900">
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-slate-900">
                        {item.count}
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
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Recent Activities */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Activités Récentes
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Dernières actions du système
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
                        {activity.client ||
                          activity.vehicle ||
                          activity.container}{" "}
                        • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Team Performance */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Performance des Équipes
              </CardTitle>
              <CardDescription className="text-slate-600">
                Progression des montages par équipe
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
            {teamPerformance.map((team, index) => (
              <div
                key={index}
                className="space-y-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {team.team}
                  </span>
                  <div className="flex items-center space-x-1">
                    {team.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        team.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {team.change}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>
                      {team.completed}/{team.total} complétés
                    </span>
                    <span>{team.progress}%</span>
                  </div>
                  <Progress value={team.progress} className="h-3" />
                  <div className="text-xs text-slate-500">
                    {team.total - team.completed} restant
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commandes by Etape Section */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Toutes les Commandes
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-100 text-blue-700"
                >
                  {commandes.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Commandes classées par étape de traitement
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(commandesByEtape).map(
                ([etape, commandesList]) => {
                  const config = etapeConfig[etape as keyof typeof etapeConfig];

                  // Add safety check for undefined config
                  if (!config) {
                    console.warn(`No configuration found for etape: ${etape}`);
                    return null; // Skip rendering this etape
                  }

                  const IconComponent = config.icon;
                  const commandesArray =
                    commandesList as CommandeWithRelations[];

                  return (
                    <div key={etape} className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full ${config.bgColor} ${config.borderColor} border`}
                        >
                          <IconComponent
                            className={`w-5 h-5 ${config.textColor}`}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {config.label}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${config.textColor} ${config.borderColor}`}
                        >
                          {commandesArray.length}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {commandesArray.map((commande) => (
                          <Card
                            key={commande.id}
                            className={`${config.bgColor} ${config.borderColor} border hover:shadow-md transition-shadow`}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-slate-700">
                                  Commande #{commande.id.slice(-6)}
                                </CardTitle>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${config.textColor} ${config.borderColor}`}
                                >
                                  {config.label}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="text-xs text-slate-600">
                                <p>
                                  <strong>Client:</strong>{" "}
                                  {commande.client?.nom || "N/A"}
                                </p>
                                <p>
                                  <strong>Modèle:</strong>{" "}
                                  {commande.voitureModel?.model || "N/A"}
                                </p>
                                <p>
                                  <strong>Portes:</strong> {commande.nbr_portes}
                                </p>
                                <p>
                                  <strong>Transmission:</strong>{" "}
                                  {commande.transmission}
                                </p>
                                <p>
                                  <strong>Motorisation:</strong>{" "}
                                  {commande.motorisation}
                                </p>
                                <p>
                                  <strong>Couleur:</strong> {commande.couleur}
                                </p>
                              </div>
                              <div className="text-xs text-slate-500">
                                <p>
                                  Livraison:{" "}
                                  {new Date(
                                    commande.date_livraison
                                  ).toLocaleDateString()}
                                </p>
                                <p>
                                  Créée:{" "}
                                  {new Date(
                                    commande.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              {commande.fournisseurs &&
                                commande.fournisseurs.length > 0 && (
                                  <div className="text-xs text-slate-600">
                                    <p>
                                      <strong>Fournisseurs:</strong>{" "}
                                      {commande.fournisseurs.length}
                                    </p>
                                  </div>
                                )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}

              {Object.keys(commandesByEtape).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Aucune commande trouvée</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;
