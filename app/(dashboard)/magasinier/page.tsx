"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Archive, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Wrench,
  BarChart3,
  Activity,
  Plus,
  ArrowUpRight,
  Eye,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { getSparePartsRanges } from '@/lib/actions/conteneur';

interface SparePartRange {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  etapeSparePart: string;
  statusVerification: string;
  createdAt: Date;
  updatedAt: Date;
  commande?: {
    id: string;
    nbr_portes: string;
    transmission: string;
    motorisation: string;
    couleur: string;
    date_livraison: Date;
    voitureModel?: {
      id: string;
      model: string;
    } | null;
    client?: {
      id: string;
      nom: string;
      entreprise?: string | null;
    } | null;
  } | null;
}

const MagasinierDashboard = () => {
  const [spareParts, setSpareParts] = useState<SparePartRange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpareParts = async () => {
      const result = await getSparePartsRanges();
      if (result.success && result.data) {
        setSpareParts(result.data);
      }
      setLoading(false);
    };
    fetchSpareParts();
  }, []);

  // Mock data - replace with actual data from your API
  const stats = {
    totalSpareParts: 1247,
    partsInTransit: 89,
    partsVerified: 456,
    partsInStorage: 702,
    partsPendingVerification: 156,
    totalContainers: 23,
    containersArrived: 18,
    containersInTransit: 5,
    totalOrders: 89,
    ordersInProgress: 34,
    ordersCompleted: 55
  };

  const recentActivities = [
    { id: 1, action: "Conteneur arrivé", container: "CONT-2024-001", time: "5 min", status: "success", icon: Truck },
    { id: 2, action: "Pièces vérifiées", parts: "45 pièces", time: "12 min", status: "success", icon: CheckCircle },
    { id: 3, action: "Stock mis à jour", location: "Zone A-12", time: "25 min", status: "info", icon: Package },
    { id: 4, action: "Pièces en transit", parts: "23 pièces", time: "1h", status: "warning", icon: AlertTriangle },
    { id: 5, action: "Vérification échouée", parts: "Moteur #001", time: "2h", status: "error", icon: AlertCircle }
  ];

  const sparePartsStatusData = [
    { status: "En Transit", count: 89, percentage: 7.1, color: "bg-blue-500", textColor: "text-blue-600" },
    { status: "Vérifiées", count: 456, percentage: 36.6, color: "bg-green-500", textColor: "text-green-600" },
    { status: "En Stockage", count: 702, percentage: 56.3, color: "bg-purple-500", textColor: "text-purple-600" }
  ];

  const verificationStatusData = [
    { status: "En Attente", count: 156, percentage: 34.2, color: "bg-amber-500", textColor: "text-amber-600" },
    { status: "Vérifiées", count: 234, percentage: 51.3, color: "bg-green-500", textColor: "text-green-600" },
    { status: "Rejetées", count: 66, percentage: 14.5, color: "bg-red-500", textColor: "text-red-600" }
  ];

  const quickActions = [
    { title: "Scanner QR Code", icon: Search, color: "bg-blue-50 hover:bg-blue-100", iconColor: "text-blue-600", href: "/magasinier/verification" },
    { title: "Gestion Stock", icon: Package, color: "bg-green-50 hover:bg-green-100", iconColor: "text-green-600", href: "/magasinier/stock" },
    { title: "Stockage", icon: Archive, color: "bg-purple-50 hover:bg-purple-100", iconColor: "text-purple-600", href: "/magasinier/stockage" },
    { title: "Pièces en Transit", icon: Truck, color: "bg-orange-50 hover:bg-orange-100", iconColor: "text-orange-600", href: "/magasinier/piecesencoursenvoies" },
    { title: "Attribution Pièces", icon: Wrench, color: "bg-indigo-50 hover:bg-indigo-100", iconColor: "text-indigo-600", href: "/magasinier/attributionpieces" },
    { title: "Rapports", icon: BarChart3, color: "bg-cyan-50 hover:bg-cyan-100", iconColor: "text-cyan-600", href: "/magasinier/rapports" }
  ];

  // Group spare parts by etapeSparePart
  const sparePartsByEtape = spareParts.reduce((acc, part) => {
    const etape = part.etapeSparePart;
    if (!acc[etape]) {
      acc[etape] = [];
    }
    acc[etape].push(part);
    return acc;
  }, {} as Record<string, SparePartRange[]>);

  // Group spare parts by verification status
  const sparePartsByVerification = spareParts.reduce((acc, part) => {
    const status = part.statusVerification;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(part);
    return acc;
  }, {} as Record<string, SparePartRange[]>);

  // Define etape configurations
  const etapeConfig = {
    TRANSITE: { 
      label: "En Transit", 
      color: "bg-blue-500", 
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: Truck
    },
    VERIFIE: { 
      label: "Vérifiées", 
      color: "bg-green-500", 
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: CheckCircle
    },
    STOCKAGE: { 
      label: "En Stockage", 
      color: "bg-purple-500", 
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      icon: Archive
    }
  };

  // Fallback configuration for unknown etapes
  const defaultConfig = {
    label: "Inconnu",
    color: "bg-gray-500",
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: Package
  };

  const verificationConfig = {
    EN_ATTENTE: { 
      label: "En Attente", 
      color: "bg-amber-500", 
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: Clock
    },
    VERIFIE: { 
      label: "Vérifiées", 
      color: "bg-green-500", 
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: CheckCircle
    },
    REJETE: { 
      label: "Rejetées", 
      color: "bg-red-500", 
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: AlertCircle
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent py-3">
            Dashboard Magasinier
          </h1>
          <p className="text-slate-600 text-lg">Gestion des stocks et des pièces détachées</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 px-3 py-1">
            <Activity className="w-4 h-4 mr-2" />
            Système actif
          </Badge>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Action
          </Button>
        </div>
      </div>

      {/* Data Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{spareParts.length}</div>
          <div className="text-sm text-slate-600">Pièces totales</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{sparePartsByEtape.VERIFIE?.length || 0}</div>
          <div className="text-sm text-slate-600">Pièces vérifiées</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{sparePartsByEtape.STOCKAGE?.length || 0}</div>
          <div className="text-sm text-slate-600">En stockage</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{sparePartsByEtape.TRANSITE?.length || 0}</div>
          <div className="text-sm text-slate-600">En transit</div>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Actions Rapides
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
              {quickActions.length}
            </Badge>
          </CardTitle>
          <CardDescription className="text-slate-600">Accès direct aux fonctions principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link 
                  key={index}
                  href={action.href || '#'}
                  className={`flex flex-col items-center p-6 rounded-xl border-2 border-transparent hover:border-slate-200 cursor-pointer transition-all duration-200 ${action.color} group`}
                >
                  <div className={`p-3 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow ${action.iconColor}`}>
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

      {/* Enhanced Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pièces Total</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">{stats.totalSpareParts}</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-sm text-green-600 font-medium">+8%</p>
              <span className="text-xs text-slate-500 ml-2">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pièces Vérifiées</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">{stats.partsVerified}</div>
            <p className="text-sm text-slate-500 mt-2">
              {stats.partsPendingVerification} en attente
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">En Stockage</CardTitle>
            <Archive className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">{stats.partsInStorage}</div>
            <p className="text-sm text-slate-500 mt-2">
              {stats.partsInTransit} en transit
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Taux de Vérification</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-slate-900">92%</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <p className="text-sm text-green-600 font-medium">+3%</p>
              <span className="text-xs text-slate-500 ml-2">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Enhanced Spare Parts Status Overview */}
        <Card className="xl:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">Statut des Pièces</CardTitle>
                <CardDescription className="text-slate-600">Répartition des pièces par étape</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Voir détails
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sparePartsStatusData.map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}></div>
                      <span className="font-medium text-slate-900">{item.status}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-slate-900">{item.count}</span>
                      <span className={`text-sm font-medium ${item.textColor}`}>{item.percentage}%</span>
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
                <CardTitle className="text-xl font-semibold text-slate-900">Activités Récentes</CardTitle>
                <CardDescription className="text-slate-600">Dernières actions du système</CardDescription>
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
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-100' :
                      activity.status === 'warning' ? 'bg-amber-100' :
                      activity.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <IconComponent className={`w-4 h-4 ${
                        activity.status === 'success' ? 'text-green-600' :
                        activity.status === 'warning' ? 'text-amber-600' :
                        activity.status === 'error' ? 'text-red-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activity.container || activity.parts || activity.location} • {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status Overview */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">Statut de Vérification</CardTitle>
              <CardDescription className="text-slate-600">Répartition des pièces par statut de vérification</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyse complète
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {verificationStatusData.map((item, index) => (
              <div key={index} className="space-y-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{item.status}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg font-bold text-slate-900">{item.count}</span>
                    <span className={`text-sm font-medium ${item.textColor}`}>{item.percentage}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spare Parts by Etape Section */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Toutes les Pièces
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {spareParts.length}
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-600">
                Pièces classées par étape de traitement
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
              {Object.entries(sparePartsByEtape).map(([etape, partsList]) => {
                const config = etapeConfig[etape as keyof typeof etapeConfig] || defaultConfig;
                const IconComponent = config.icon;
                const partsArray = partsList as SparePartRange[];
                
                return (
                  <div key={etape} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${config.bgColor} ${config.borderColor} border`}>
                        <IconComponent className={`w-5 h-5 ${config.textColor}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {config.label}
                      </h3>
                      <Badge variant="outline" className={`${config.textColor} ${config.borderColor}`}>
                        {partsArray.length}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {partsArray.slice(0, 8).map((part) => (
                        <Card key={part.id} className={`${config.bgColor} ${config.borderColor} border hover:shadow-md transition-shadow`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-medium text-slate-700">
                                {part.partCode}
                              </CardTitle>
                              <Badge variant="outline" className={`text-xs ${config.textColor} ${config.borderColor}`}>
                                {config.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-xs text-slate-600">
                              <p><strong>Nom:</strong> {part.partName}</p>
                              {part.partNameFrench && (
                                <p><strong>Nom FR:</strong> {part.partNameFrench}</p>
                              )}
                              <p><strong>Quantité:</strong> {part.quantity}</p>
                              <p><strong>Statut:</strong> {part.statusVerification}</p>
                            </div>
                            <div className="text-xs text-slate-500">
                              <p>Créée: {new Date(part.createdAt).toLocaleDateString()}</p>
                              <p>Modifiée: {new Date(part.updatedAt).toLocaleDateString()}</p>
                            </div>
                            {part.commande && (
                              <div className="text-xs text-slate-600">
                                <p><strong>Commande:</strong> #{part.commande.id.slice(-6)}</p>
                                <p><strong>Client:</strong> {part.commande.client?.nom || 'N/A'}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {partsArray.length > 8 && (
                        <Card className={`${config.bgColor} ${config.borderColor} border hover:shadow-md transition-shadow flex items-center justify-center`}>
                          <div className="text-center p-4">
                            <p className="text-sm font-medium text-slate-700">+{partsArray.length - 8} autres</p>
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
              
              {Object.keys(sparePartsByEtape).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Aucune pièce trouvée</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default MagasinierDashboard;