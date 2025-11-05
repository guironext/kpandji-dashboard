"use client";

import React, { useEffect, useState } from 'react';
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
  Users,
  ShoppingCart,
  Calendar,
  DollarSign,
  Eye,
  Plus,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Activity,
  UserCheck,
  FileText,
  Receipt,
  Target,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getAllClients } from "@/lib/actions/client";
import { getCommandesByUserId } from "@/lib/actions/commande";

interface Client {
  id: string;
  nom: string;
  email?: string | null;
  telephone: string;
  status_client: string;
  entreprise?: string | null;
  createdAt: Date;
  commandes?: Commande[];
}

interface Commande {
  id: string;
  nbr_portes: string;
  transmission: string;
  etapeCommande: string;
  motorisation: string;
  couleur: string;
  date_livraison: Date;
  createdAt: Date;
  client?: {
    nom: string;
    entreprise?: string | null;
  } | null;
  voitureModel?: {
    model: string;
  } | null;
}

const CommercialDashboard = () => {
  const router = useRouter();
  const { user } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Get database user ID from Clerk ID
      const userResponse = await fetch(`/api/user/${user.id}`);
      if (!userResponse.ok) {
        setLoading(false);
        return;
      }
      const userData = await userResponse.json();
      const dbUserId = userData.id;

      const [clientsResult, commandesResult] = await Promise.all([
        getAllClients(),
        getCommandesByUserId(dbUserId)
      ]);
      
      if (clientsResult.success && clientsResult.data) {
        setClients(clientsResult.data);
      }
      if (commandesResult.success && commandesResult.data) {
        setCommandes(commandesResult.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Calculate statistics

  const prospects = clients.filter(c => c.status_client === 'PROSPECT').length;
  const activeClients = clients.filter(c => c.status_client === 'CLIENT').length;
  const totalCommandes = commandes.length;
  const commandesEnCours = commandes.filter(c => ['PROPOSITION', 'VALIDE', 'TRANSITE', 'RENSEIGNEE', 'ARRIVE'].includes(c.etapeCommande)).length;
  const commandesLivrees = commandes.filter(c => c.etapeCommande === 'VENTE').length;
  
  // Commercial-specific metrics
  const conversionRate = prospects > 0 ? Math.round((activeClients / prospects) * 100) : 0;


  // Group commandes by status
  const commandesByStatus = commandes.reduce((acc, commande) => {
    const status = commande.etapeCommande;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(commande);
    return acc;
  }, {} as Record<string, Commande[]>);

  const recentActivities = [
    {
      id: 1,
      action: "Nouveau prospect ajouté",
      client: "ABC Corporation",
      time: "5 min",
      status: "success",
      icon: UserCheck,
    },
    {
      id: 2,
      action: "Commande validée",
      commande: "CMD-2024-001",
      time: "12 min",
      status: "success",
      icon: CheckCircle,
    },
    {
      id: 3,
      action: "Rendez-vous programmé",
      client: "XYZ Ltd",
      time: "1h",
      status: "info",
      icon: Calendar,
    },
    {
      id: 4,
      action: "Proforma générée",
      commande: "CMD-2024-002",
      time: "2h",
      status: "info",
      icon: FileText,
    },
    {
      id: 5,
      action: "Commande en retard",
      client: "DEF Corp",
      time: "3h",
      status: "warning",
      icon: AlertTriangle,
    },
  ];

  const quickActions = [
    {
      title: "Nouveau Client",
      icon: Plus,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "text-blue-600",
      href: "/manager/ajouter-client",
    },
    {
      title: "Nouvelle Commande",
      icon: ShoppingCart,
      color: "bg-green-50 hover:bg-green-100",
      iconColor: "text-green-600",
      href: "/manager/ajouter-commande",
    },
    {
      title: "Programmer RDV",
      icon: Calendar,
      color: "bg-purple-50 hover:bg-purple-100",
      iconColor: "text-purple-600",
      href: "/commercial/programme",
    },
    {
      title: "Générer Proforma",
      icon: FileText,
      color: "bg-orange-50 hover:bg-orange-100",
      iconColor: "text-orange-600",
      href: "/commercial/proformas",
    },
    {
      title: "Voir Rapports",
      icon: BarChart3,
      color: "bg-cyan-50 hover:bg-cyan-100",
      iconColor: "text-cyan-600",
      href: "/commercial/rapport-rendez-vous",
    },
    {
      title: "Suivi Commandes",
      icon: Eye,
      color: "bg-indigo-50 hover:bg-indigo-100",
      iconColor: "text-indigo-600",
      href: "/commercial/suivi-commandes",
    },
  ];

  const statusConfig = {
    PROPOSITION: {
      label: "Proposées",
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: AlertTriangle,
    },
    VALIDE: {
      label: "Validées",
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: CheckCircle,
    },
    TRANSITE: {
      label: "En Transit",
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      icon: Clock,
    },
    RENSEIGNEE: {
      label: "Renseignées",
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      icon: FileText,
    },
    ARRIVE: {
      label: "Arrivées",
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: CheckCircle,
    },
    VENTE: {
      label: "Vendues",
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: DollarSign,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent py-3">
            Dashboard Commercial
          </h1>
          <p className="text-slate-600 text-lg">
            Gestion des ventes, clients et commandes
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card 
        onClick={() => router.push('/commercial/clients')}
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">CLIENTS</div>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card 
        onClick={() => router.push('/commercial/prospects')}
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">PROSPECTS</div>
            
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card 
        onClick={() => router.push('/commercial/proformas')}
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">PROFORMAS</div>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card 
        onClick={() => router.push('/commercial/factures')}
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">FACTURES</div>
             
            </div>
            <Receipt className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-600">{totalCommandes}</div>
              <div className="text-sm text-slate-600">Commandes Total</div>
            </div>
            <ShoppingCart className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{commandesEnCours}</div>
              <div className="text-sm text-slate-600">En Cours</div>
            </div>
            <Clock className="h-8 w-8 text-indigo-500" />
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-cyan-600">{conversionRate}%</div>
              <div className="text-sm text-slate-600">Taux Conversion</div>
            </div>
            <Percent className="h-8 w-8 text-cyan-500" />
          </div>
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
            Accès direct aux fonctions commerciales
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
                  className={`flex flex-col items-center p-6 rounded-xl border-2 border-transparent hover:border-slate-200 cursor-pointer transition-all duration-200 ${action.color} group`}
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
        {/* Sales Performance */}
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Performance Commerciale
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Vue d&apos;ensemble des ventes et commandes
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Voir détails
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Taux de Conversion</span>
                  <span className="text-2xl font-bold text-green-600">{conversionRate}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${conversionRate}%` }}></div>
                </div>
                <p className="text-xs text-slate-500">
                  {activeClients} clients actifs sur {prospects} prospects
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Commandes ce Mois</span>
                  <span className="text-2xl font-bold text-blue-600">{commandes.length}</span>
                </div>
                <div className="flex items-center">
                  <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+12%</span>
                  <span className="text-xs text-slate-500 ml-2">vs mois dernier</span>
                </div>
                <p className="text-xs text-slate-500">
                  {commandesLivrees} commandes livrées
                </p>
              </div>
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
                  Dernières actions commerciales
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
                        {activity.client || activity.commande} • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commandes by Status */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Commandes par Statut
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-100 text-blue-700"
                >
                  {commandes.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Suivi des commandes par étape
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
              {Object.entries(commandesByStatus).map(([status, commandesList]) => {
                const config = statusConfig[status as keyof typeof statusConfig];
                if (!config) return null;

                const IconComponent = config.icon;
                return (
                  <div key={status} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${config.bgColor} ${config.borderColor} border`}
                      >
                        <IconComponent className={`w-5 h-5 ${config.textColor}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {config.label}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`${config.textColor} ${config.borderColor}`}
                      >
                        {commandesList.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {commandesList.slice(0, 4).map((commande) => (
                        <Card
                          key={commande.id}
                          className={`${config.bgColor} ${config.borderColor} border hover:shadow-md transition-shadow`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-slate-700">
                                #{commande.id.slice(-6)}
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
                              <p><strong>Client:</strong> {commande.client?.nom || "N/A"}</p>
                              <p><strong>Modèle:</strong> {commande.voitureModel?.model || "N/A"}</p>
                              <p><strong>Portes:</strong> {commande.nbr_portes}</p>
                              <p><strong>Transmission:</strong> {commande.transmission}</p>
                              <p><strong>Motorisation:</strong> {commande.motorisation}</p>
                              <p><strong>Couleur:</strong> {commande.couleur}</p>
                            </div>
                            <div className="text-xs text-slate-500">
                              <p>
                                Livraison: {new Date(commande.date_livraison).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {commandesList.length > 4 && (
                        <Card className={`${config.bgColor} ${config.borderColor} border hover:shadow-md transition-shadow flex items-center justify-center`}>
                          <div className="text-center p-4">
                            <p className="text-sm font-medium text-slate-700">
                              +{commandesList.length - 4} autres
                            </p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Voir tout
                            </Button>
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>
                );
              })}

              {Object.keys(commandesByStatus).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
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

export default CommercialDashboard;