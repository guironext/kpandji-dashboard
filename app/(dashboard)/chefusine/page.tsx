"use client";

// Chef usine dashboard - production management
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
  Settings,
  Clock,
  CheckSquare,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  ContainerIcon,
  DrumIcon,
  FileText,
  UserPlus,
  Factory,
  Gauge,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAllCommandes } from "@/lib/actions/commande";
import { getAllEquipes } from "@/lib/actions/equipe";
import { getAllEmployees } from "@/lib/actions/employee";
import type { Commande } from "@/lib/generated/prisma";

type CommandeWithRelations = {
  id: string;
  nbr_portes: string;
  transmission: string;
  etapeCommande: string;
  motorisation: string;
  couleur: string;
  date_livraison: Date;
  createdAt: Date;
  updatedAt: Date;
  clientId: string | null;
  clientEntrepriseId?: string | null;
  voitureModelId?: string | null;
  conteneurId?: string | null;
  commandeLocalId?: string | null;
  montageId?: string | null;
  factureId?: string | null;
  prix_unitaire?: Decimal | number | null;
  client?: unknown;
  clientEntreprise?: unknown;
  voitureModel?: unknown;
  fournisseurs?: unknown[];
};

type Decimal = {
  toNumber(): number;
};

type EquipeWithRelations = {
  id: string;
  nomEquipe: string;
  activite: string;
  chefEquipe: {
    id: string;
    nom: string;
    prenoms: string;
  };
  membres: Array<{
    id: string;
    qualite: string;
    fonction: string;
    employee: {
      id: string;
      nom: string;
      prenoms: string;
      specialite?: string;
    };
  }>;
  montage?: {
    id: string;
    dateDebut: Date;
    dateFin?: Date;
    etapeMontage: string;
    commande: {
      id: string;
      client: {
        nom: string;
      };
    };
  } | null;
};

const ChefUsineDashboard = () => {
  const router = useRouter();
  const [commandes, setCommandes] = useState<CommandeWithRelations[]>([]);
  const [equipes, setEquipes] = useState<unknown[]>([]);
  const [employees, setEmployees] = useState<{
    id: string;
    nom: string;
    prenoms: string;
    contact: string;
    email?: string;
    bloodType: string;
    specialite?: string;
    userId: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commandesResult, equipesResult, employeesResult] = await Promise.all([
          getAllCommandes(),
          getAllEquipes(),
          getAllEmployees(),
        ]);

        if (commandesResult.success && commandesResult.data) {
          setCommandes(commandesResult.data);
        }
        if (equipesResult.success && equipesResult.data) {
          setEquipes(equipesResult.data as unknown as EquipeWithRelations[]);
        }
        if (employeesResult.success && employeesResult.data) {
          setEmployees(employeesResult.data as unknown as {
            id: string;
            nom: string;
            prenoms: string;
            contact: string;
            email?: string;
            bloodType: string;
            specialite?: string;
            userId: string;
          }[]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Factory-specific stats
  const stats = {
    totalEquipes: equipes.length,
    activeEquipes: (equipes as EquipeWithRelations[]).filter(e => e.montage).length,
    totalEmployees: employees.length,
    activeEmployees: employees.length,
    commandesEnMontage: commandes.filter(c => c.etapeCommande === "MONTAGE").length,
    commandesEnCorrection: commandes.filter(c => c.etapeCommande === "CORRECTION").length,
    commandesVerifiees: commandes.filter(c => c.etapeCommande === "VERIFIER").length,
    commandesArrivees: commandes.filter(c => c.etapeCommande === "ARRIVE").length,
  };

  const recentActivities = [
    {
      id: 1,
      action: "Montage terminé",
      details: "Équipe Alpha - Toyota Camry",
      time: "5 min",
      status: "success",
      icon: CheckCircle,
    },
    {
      id: 2,
      action: "Nouvelle équipe créée",
      details: "Équipe Delta - 4 membres",
      time: "15 min",
      status: "info",
      icon: UserPlus,
    },
    {
      id: 3,
      action: "Correction requise",
      details: "Honda Civic - Pièce manquante",
      time: "30 min",
      status: "warning",
      icon: AlertTriangle,
    },
    {
      id: 4,
      action: "Pièces vérifiées",
      details: "Conteneur CONT-2024-001",
      time: "1h",
      status: "success",
      icon: ClipboardCheck,
    },
    {
      id: 5,
      action: "Test échoué",
      details: "Ford Focus - Problème moteur",
      time: "2h",
      status: "error",
      icon: AlertTriangle,
    },
  ];

  const equipePerformance = (equipes as EquipeWithRelations[]).map(equipe => {
    const totalMembers = equipe.membres.length;
    const completedMontages = equipe.montage ? 1 : 0;
    const progress = totalMembers > 0 ? (completedMontages / totalMembers) * 100 : 0;
    
    return {
      nomEquipe: equipe.nomEquipe,
      chefEquipe: `${equipe.chefEquipe.prenoms} ${equipe.chefEquipe.nom}`,
      totalMembers,
      completedMontages,
      progress: Math.min(progress, 100),
      activite: equipe.activite,
      isActive: !!equipe.montage,
    };
  });

  const quickActions = [
    {
      title: "Opérations Montage",
      icon: ContainerIcon,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "text-blue-600",
      count: stats.commandesEnMontage,
      href: "/chefusine/montage",
    },
    {
      title: "Création Équipe",
      icon: Users,
      color: "bg-green-50 hover:bg-green-100",
      iconColor: "text-green-600",
      count: stats.totalEquipes,
      href: "/chefusine/equipe",
    },
    {
      title: "Opérations Correction",
      icon: RotateCcw,
      color: "bg-orange-50 hover:bg-orange-100",
      iconColor: "text-orange-600",
      count: stats.commandesEnCorrection,
      href: "/chefusine/correction",
    },
    {
      title: "Retour Pièces",
      icon: Truck,
      color: "bg-purple-50 hover:bg-purple-100",
      iconColor: "text-purple-600",
      count: 0,
      href: "/chefusine/Retourstock",
    },
    {
      title: "Pièces Vérifiées",
      icon: DrumIcon,
      color: "bg-cyan-50 hover:bg-cyan-100",
      iconColor: "text-cyan-600",
      count: stats.commandesVerifiees,
      href: "/chefusine/verification",
    },
    {
      title: "Stockage",
      icon: Package,
      color: "bg-indigo-50 hover:bg-indigo-100",
      iconColor: "text-indigo-600",
      count: 0,
      href: "/chefusine/stockage",
    },
  ];

  const productionMetrics = [
    {
      title: "Efficacité Production",
      value: "87%",
      change: "+5%",
      trend: "up",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Temps Moyen Montage",
      value: "4.2h",
      change: "-0.3h",
      trend: "up",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Taux de Correction",
      value: "12%",
      change: "-2%",
      trend: "up",
      icon: RotateCcw,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Capacité Utilisée",
      value: "94%",
      change: "+3%",
      trend: "up",
      icon: Gauge,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent py-3">
            Dashboard Chef d&apos;Usine
          </h1>
          <p className="text-slate-600 text-lg">
            Supervision des opérations de production et gestion des équipes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1"
          >
            <Factory className="w-4 h-4 mr-2" />
            Usine Active
          </Badge>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {productionMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.bgColor.replace('bg-', 'from-')} rounded-full -translate-y-16 translate-x-16 opacity-20`}></div>
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold text-slate-600">
                  {metric.title}
                </CardTitle>
                <IconComponent className={`h-5 w-5 ${metric.color}`} />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-slate-900">
                  {metric.value}
                </div>
                <div className="flex items-center mt-2">
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <p className={`text-sm font-medium ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {metric.change}
                  </p>
                  <span className="text-xs text-slate-500 ml-2">
                    vs semaine dernière
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Actions Rapides
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
              {quickActions.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-slate-600">
            Accès direct aux opérations principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 border-transparent hover:border-slate-200 cursor-pointer transition-all duration-200 ${action.color} group`}
                >
                  <div className={`p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow ${action.iconColor}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex items-center justify-between w-full mt-3">
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                      {action.title}
                    </span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 px-2 py-1">
                      {action.count}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Team Performance */}
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Performance des Équipes
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Progression et activité des équipes de production
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyse complète
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {equipePerformance.map((equipe, index) => (
                <div key={index} className="space-y-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${equipe.isActive ? "bg-green-500" : "bg-gray-400"}`}></div>
                      <span className="font-semibold text-slate-900">{equipe.nomEquipe}</span>
                      <Badge variant="outline" className="text-xs">
                        {equipe.activite}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        {equipe.completedMontages} montages
                      </div>
                      <div className="text-xs text-slate-500">
                        {equipe.totalMembers} membres
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Chef: {equipe.chefEquipe}</span>
                      <span>{Math.round(equipe.progress)}%</span>
                    </div>
                    <Progress value={equipe.progress} className="h-2" />
                  </div>
                </div>
              ))}
              
              {equipePerformance.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Aucune équipe trouvée</p>
                </div>
              )}
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
                  Dernières actions en usine
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
                        {activity.details} • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Overview */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Vue d&apos;ensemble Production
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {commandes.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-600">
                État des commandes par étape de production
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Voir détails
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{stats.commandesArrivees}</div>
              <div className="text-sm text-green-700">Commandes Arrivées</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <ClipboardCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{stats.commandesVerifiees}</div>
              <div className="text-sm text-blue-700">Pièces Vérifiées</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
              <Wrench className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{stats.commandesEnMontage}</div>
              <div className="text-sm text-orange-700">En Montage</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
              <RotateCcw className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{stats.commandesEnCorrection}</div>
              <div className="text-sm text-red-700">En Correction</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChefUsineDashboard;