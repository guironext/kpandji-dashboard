"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  AlertCircle,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Archive,
} from "lucide-react";
import { getAllRendezVousByUser } from "@/lib/actions/superviseur";

interface RendezVous {
  id: string;
  date: Date | string;
  heure?: string | null;
  lieu?: string | null;
  statut: string;
  objet?: string | null;
  resume_rendez_vous?: string | null;
  clientName: string;
  clientType: 'PARTICULIER' | 'ENTREPRISE';
  clientPhone: string | null;
  clientEmail: string | null;
}

interface UserRendezVous {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  totalRendezVous: number;
  rendezVous: RendezVous[];
}

interface StatusGroup {
  statut: string;
  commercialGroups: CommercialGroup[];
  totalCount: number;
}

interface CommercialGroup {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  rendezVous: RendezVous[];
  count: number;
}

const STATUS_ORDER = ['CONFIRME', 'EN_ATTENTE'];
const BOTTOM_STATUS_ORDER = ['EFFECTUE', 'DEPLACE', 'ANNULE'];
const STATUS_LABELS: Record<string, string> = {
  'CONFIRME': 'Confirmés',
  'EN_ATTENTE': 'En Attente',
  'EFFECTUE': 'Effectués',
  'DEPLACE': 'Déplacés',
  'ANNULE': 'Annulés',
};

const SuiviRendezVousPage = () => {
  const [loading, setLoading] = useState(true);
  const [rendezVousByUser, setRendezVousByUser] = useState<UserRendezVous[]>([]);
  const [allRendezVousByUser, setAllRendezVousByUser] = useState<UserRendezVous[]>([]);
  const [expandedStatuses, setExpandedStatuses] = useState<Set<string>>(new Set());
  const [expandedCommercials, setExpandedCommercials] = useState<Set<string>>(new Set());
  const [expandedBottomStatuses, setExpandedBottomStatuses] = useState<Set<string>>(new Set());
  const [expandedBottomCommercials, setExpandedBottomCommercials] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllRendezVousByUser();
      
      if (result.success && result.data) {
        const allData = result.data as UserRendezVous[];
        
        // Store all data
        setAllRendezVousByUser(allData);
        
        // Filter to only include CONFIRME and EN_ATTENTE for top section
        const filteredData = allData.map(user => ({
          ...user,
          rendezVous: user.rendezVous.filter(rdv => 
            rdv.statut === 'CONFIRME' || rdv.statut === 'EN_ATTENTE'
          ),
        })).filter(user => user.rendezVous.length > 0);
        
        setRendezVousByUser(filteredData);
        
        // Expand all statuses by default
        const allStatuses = new Set(
          filteredData
            .flatMap(user => user.rendezVous)
            .map(rdv => rdv.statut)
        );
        setExpandedStatuses(allStatuses);
        
        // Expand bottom statuses by default
        const bottomStatuses = new Set(['EFFECTUE', 'DEPLACE', 'ANNULE']);
        setExpandedBottomStatuses(bottomStatuses);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Group by status, then by commercial, ordered by date (latest first)
  const groupedByStatus = useMemo(() => {
    const statusMap = new Map<string, Map<string, CommercialGroup>>();

    // First, group by status and commercial
    rendezVousByUser.forEach(user => {
      user.rendezVous.forEach(rdv => {
        const status = rdv.statut;
        
        // Only process CONFIRME and EN_ATTENTE
        if (status !== 'CONFIRME' && status !== 'EN_ATTENTE') return;
        
        if (!statusMap.has(status)) {
          statusMap.set(status, new Map());
        }
        
        const commercialMap = statusMap.get(status)!;
        
        if (!commercialMap.has(user.userId)) {
          commercialMap.set(user.userId, {
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            userPhone: user.userPhone,
            rendezVous: [],
            count: 0,
          });
        }
        
        commercialMap.get(user.userId)!.rendezVous.push(rdv);
        commercialMap.get(user.userId)!.count++;
      });
    });

    // Convert to array and sort
    const statusGroups: StatusGroup[] = [];
    
    statusMap.forEach((commercialMap, statut) => {
      const commercialGroups: CommercialGroup[] = Array.from(commercialMap.values()).map(group => ({
        ...group,
        // Sort rendez-vous by date (latest first)
        rendezVous: group.rendezVous.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        }),
      }));
      
      // Sort commercial groups by total count (descending)
      commercialGroups.sort((a, b) => b.count - a.count);
      
      statusGroups.push({
        statut,
        commercialGroups,
        totalCount: commercialGroups.reduce((sum, g) => sum + g.count, 0),
      });
    });

    // Sort status groups: CONFIRME first, then EN_ATTENTE
    statusGroups.sort((a, b) => {
      const indexA = STATUS_ORDER.indexOf(a.statut);
      const indexB = STATUS_ORDER.indexOf(b.statut);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

    return statusGroups;
  }, [rendezVousByUser]);

  // Group bottom section by status (EFFECTUE, DEPLACE, ANNULE), then by commercial
  const groupedBottomByStatus = useMemo(() => {
    const statusMap = new Map<string, Map<string, CommercialGroup>>();

    // First, group by status and commercial
    allRendezVousByUser.forEach(user => {
      user.rendezVous.forEach(rdv => {
        const status = rdv.statut;
        
        // Only process EFFECTUE, DEPLACE, and ANNULE
        if (status !== 'EFFECTUE' && status !== 'DEPLACE' && status !== 'ANNULE') return;
        
        if (!statusMap.has(status)) {
          statusMap.set(status, new Map());
        }
        
        const commercialMap = statusMap.get(status)!;
        
        if (!commercialMap.has(user.userId)) {
          commercialMap.set(user.userId, {
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            userPhone: user.userPhone,
            rendezVous: [],
            count: 0,
          });
        }
        
        commercialMap.get(user.userId)!.rendezVous.push(rdv);
        commercialMap.get(user.userId)!.count++;
      });
    });

    // Convert to array and sort
    const statusGroups: StatusGroup[] = [];
    
    statusMap.forEach((commercialMap, statut) => {
      const commercialGroups: CommercialGroup[] = Array.from(commercialMap.values()).map(group => ({
        ...group,
        // Sort rendez-vous by date (latest first)
        rendezVous: group.rendezVous.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        }),
      }));
      
      // Sort commercial groups by total count (descending)
      commercialGroups.sort((a, b) => b.count - a.count);
      
      statusGroups.push({
        statut,
        commercialGroups,
        totalCount: commercialGroups.reduce((sum, g) => sum + g.count, 0),
      });
    });

    // Sort status groups: EFFECTUE first, then DEPLACE, then ANNULE
    statusGroups.sort((a, b) => {
      const indexA = BOTTOM_STATUS_ORDER.indexOf(a.statut);
      const indexB = BOTTOM_STATUS_ORDER.indexOf(b.statut);
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      return orderA - orderB;
    });

    return statusGroups;
  }, [allRendezVousByUser]);

  const toggleStatusExpanded = (statut: string) => {
    setExpandedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(statut)) {
        newSet.delete(statut);
      } else {
        newSet.add(statut);
      }
      return newSet;
    });
  };

  const toggleCommercialExpanded = (key: string) => {
    setExpandedCommercials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleBottomStatusExpanded = (statut: string) => {
    setExpandedBottomStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(statut)) {
        newSet.delete(statut);
      } else {
        newSet.add(statut);
      }
      return newSet;
    });
  };

  const toggleBottomCommercialExpanded = (key: string) => {
    setExpandedBottomCommercials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: 'long',
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };


  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "CONFIRME":
        return {
          bg: "bg-gradient-to-br from-blue-500 to-cyan-500",
          text: "text-blue-700",
          border: "border-blue-300",
          cardBg: "from-blue-50 to-cyan-50",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "EN_ATTENTE":
        return {
          bg: "bg-gradient-to-br from-amber-500 to-orange-500",
          text: "text-amber-700",
          border: "border-amber-300",
          cardBg: "from-amber-50 to-orange-50",
          badge: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "EFFECTUE":
        return {
          bg: "bg-gradient-to-br from-green-500 to-emerald-500",
          text: "text-green-700",
          border: "border-green-300",
          cardBg: "from-green-50 to-emerald-50",
          badge: "bg-green-100 text-green-800 border-green-200",
        };
      case "DEPLACE":
        return {
          bg: "bg-gradient-to-br from-purple-500 to-violet-500",
          text: "text-purple-700",
          border: "border-purple-300",
          cardBg: "from-purple-50 to-violet-50",
          badge: "bg-purple-100 text-purple-800 border-purple-200",
        };
      case "ANNULE":
        return {
          bg: "bg-gradient-to-br from-red-500 to-rose-500",
          text: "text-red-700",
          border: "border-red-300",
          cardBg: "from-red-50 to-rose-50",
          badge: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-slate-500 to-gray-500",
          text: "text-slate-700",
          border: "border-slate-300",
          cardBg: "from-slate-50 to-gray-50",
          badge: "bg-slate-100 text-slate-800 border-slate-200",
        };
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case "CONFIRME":
        return <CalendarCheck className="h-6 w-6" />;
      case "EN_ATTENTE":
        return <AlertCircle className="h-6 w-6" />;
      case "EFFECTUE":
        return <CheckCircle2 className="h-6 w-6" />;
      case "DEPLACE":
        return <Archive className="h-6 w-6" />;
      case "ANNULE":
        return <XCircle className="h-6 w-6" />;
      default:
        return <Calendar className="h-6 w-6" />;
    }
  };

  // Statistics
  const statistics = useMemo(() => {
    const allRendezVous = rendezVousByUser.flatMap(user => user.rendezVous);
    return {
      total: allRendezVous.length,
      confirme: allRendezVous.filter(r => r.statut === 'CONFIRME').length,
      enAttente: allRendezVous.filter(r => r.statut === 'EN_ATTENTE').length,
      particulier: allRendezVous.filter(r => r.clientType === 'PARTICULIER').length,
      entreprise: allRendezVous.filter(r => r.clientType === 'ENTREPRISE').length,
    };
  }, [rendezVousByUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-t-4 border-blue-600"></div>
          <Calendar className="h-12 w-12 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-6 text-lg font-medium text-slate-600 animate-pulse">
          Chargement des rendez-vous...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      {/* Enhanced Header */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform">
                <CalendarCheck className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                  Suivi des Rendez-vous
                </h1>
                <p className="text-slate-600 text-lg font-medium">
                  Rendez-vous confirmés et en attente • Groupés par commercial
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">
                {statistics.total} Total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-cyan-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-all"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <CalendarCheck className="h-8 w-8 text-white" />
              </div>
              <TrendingUp className="h-6 w-6 text-white/80" />
            </div>
            <div className="space-y-1">
              <p className="text-white/90 text-sm font-medium">Confirmés</p>
              <p className="text-4xl font-bold text-white">{statistics.confirme}</p>
              <p className="text-white/70 text-xs">
                {statistics.total > 0 ? Math.round((statistics.confirme / statistics.total) * 100) : 0}% du total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-orange-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20 group-hover:from-amber-600/30 group-hover:to-orange-600/30 transition-all"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <TrendingUp className="h-6 w-6 text-white/80" />
            </div>
            <div className="space-y-1">
              <p className="text-white/90 text-sm font-medium">En Attente</p>
              <p className="text-4xl font-bold text-white">{statistics.enAttente}</p>
              <p className="text-white/70 text-xs">
                {statistics.total > 0 ? Math.round((statistics.enAttente / statistics.total) * 100) : 0}% du total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-indigo-500 to-purple-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 group-hover:from-indigo-600/30 group-hover:to-purple-600/30 transition-all"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <User className="h-8 w-8 text-white" />
              </div>
              <TrendingUp className="h-6 w-6 text-white/80" />
            </div>
            <div className="space-y-1">
              <p className="text-white/90 text-sm font-medium">Particuliers</p>
              <p className="text-4xl font-bold text-white">{statistics.particulier}</p>
              <p className="text-white/70 text-xs">Clients individuels</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-violet-500 to-pink-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-pink-600/20 group-hover:from-violet-600/30 group-hover:to-pink-600/30 transition-all"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <TrendingUp className="h-6 w-6 text-white/80" />
            </div>
            <div className="space-y-1">
              <p className="text-white/90 text-sm font-medium">Entreprises</p>
              <p className="text-4xl font-bold text-white">{statistics.entreprise}</p>
              <p className="text-white/70 text-xs">Clients professionnels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rendez-vous grouped by status and commercial */}
      <div className="space-y-6">
        {groupedByStatus.map((statusGroup) => {
          const statusColors = getStatusColor(statusGroup.statut);
          return (
            <Card 
              key={statusGroup.statut} 
              className={`border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white/95 backdrop-blur-sm overflow-hidden border-l-4 ${statusColors.border}`}
            >
              <CardHeader 
                className={`cursor-pointer hover:bg-gradient-to-r ${statusColors.cardBg} transition-all duration-300 relative overflow-hidden`}
                onClick={() => toggleStatusExpanded(statusGroup.statut)}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-32 -mt-32"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl ${statusColors.bg} shadow-lg transform hover:scale-110 transition-transform`}>
                      {getStatusIcon(statusGroup.statut)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-900 mb-2 font-bold">
                        {STATUS_LABELS[statusGroup.statut] || statusGroup.statut}
                      </CardTitle>
                      <CardDescription className="text-base">
                        <span className="font-semibold text-slate-700">{statusGroup.totalCount}</span> rendez-vous répartis sur{" "}
                        <span className="font-semibold text-slate-700">{statusGroup.commercialGroups.length}</span> commercial{statusGroup.commercialGroups.length > 1 ? 'aux' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={`${statusColors.badge} text-lg px-5 py-2 font-bold shadow-md`}>
                      {statusGroup.totalCount}
                    </Badge>
                    <div className="p-3 hover:bg-white/50 rounded-xl transition-colors">
                      {expandedStatuses.has(statusGroup.statut) ? (
                        <ChevronUp className="h-6 w-6 text-slate-600" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-slate-600" />
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedStatuses.has(statusGroup.statut) && (
                <CardContent className="pt-0 pb-6">
                  <div className={`border-t-2 border-gradient-to-r ${statusColors.border} pt-6 space-y-5`}>
                    {statusGroup.commercialGroups.map((commercialGroup) => {
                      const commercialKey = `${statusGroup.statut}-${commercialGroup.userId}`;
                      return (
                        <Card 
                          key={commercialKey}
                          className="border-2 border-slate-200 hover:border-blue-400 transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-slate-50"
                        >
                          <CardHeader 
                            className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all"
                            onClick={() => toggleCommercialExpanded(commercialKey)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white">
                                  {commercialGroup.userName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <CardTitle className="text-xl text-slate-900 font-bold">
                                    {commercialGroup.userName}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-4 mt-1">
                                    {commercialGroup.userEmail && (
                                      <span className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium">{commercialGroup.userEmail}</span>
                                      </span>
                                    )}
                                    {commercialGroup.userPhone && (
                                      <span className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-green-600" />
                                        <span className="font-medium">{commercialGroup.userPhone}</span>
                                      </span>
                                    )}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300 text-base px-4 py-2 font-bold shadow-md">
                                  {commercialGroup.count} RDV
                                </Badge>
                                {expandedCommercials.has(commercialKey) ? (
                                  <ChevronUp className="h-6 w-6 text-slate-600" />
                                ) : (
                                  <ChevronDown className="h-6 w-6 text-slate-600" />
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          {expandedCommercials.has(commercialKey) && (
                            <CardContent className="pt-0 pb-6">
                              <div className="border-t-2 border-slate-200 pt-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                  {commercialGroup.rendezVous.map((rdv) => {
                                    const rdvDate = new Date(rdv.date);
                                    const isToday = rdvDate.toDateString() === new Date().toDateString();
                                    
                                    return (
                                      <div
                                        key={rdv.id}
                                        className={`group relative p-6 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 rounded-3xl border-2 ${
                                          isToday 
                                            ? 'border-blue-400 shadow-xl ring-2 ring-blue-200' 
                                            : 'border-slate-200 hover:border-blue-400'
                                        } hover:shadow-2xl transition-all duration-300 overflow-hidden`}
                                      >
                                        {isToday && (
                                          <div className="absolute top-3 right-3">
                                            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg animate-pulse">
                                              Aujourd&apos;hui
                                            </Badge>
                                          </div>
                                        )}
                                        
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full"></div>
                                        
                                        <div className="relative">
                                          {/* Client Info */}
                                          <div className="flex items-start gap-4 mb-5">
                                            <div className={`p-3 rounded-2xl shadow-lg ${
                                              rdv.clientType === 'ENTREPRISE' 
                                                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                : 'bg-gradient-to-br from-green-500 to-green-600'
                                            }`}>
                                              {rdv.clientType === 'ENTREPRISE' ? (
                                                <Building2 className="h-6 w-6 text-white" />
                                              ) : (
                                                <User className="h-6 w-6 text-white" />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-slate-900 text-xl mb-2 truncate">
                                                {rdv.clientName}
                                              </h4>
                                              <Badge 
                                                variant="outline" 
                                                className={`text-sm font-semibold ${
                                                  rdv.clientType === 'ENTREPRISE' 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                                    : 'bg-green-50 text-green-700 border-green-300'
                                                }`}
                                              >
                                                {rdv.clientType === 'ENTREPRISE' ? '🏢 Entreprise' : '👤 Particulier'}
                                              </Badge>
                                            </div>
                                          </div>

                                          {/* Date and Time */}
                                          <div className="space-y-3 mb-5">
                                            <div className={`flex items-center gap-3 p-3 rounded-xl ${
                                              isToday 
                                                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300' 
                                                : 'bg-white/80'
                                            }`}>
                                              <Calendar className={`h-5 w-5 flex-shrink-0 ${
                                                isToday ? 'text-blue-600' : 'text-purple-600'
                                              }`} />
                                              <div>
                                                <p className="text-sm font-semibold text-slate-700">
                                                  {formatDate(rdv.date)}
                                                </p>
                                                {rdv.heure && (
                                                  <p className="text-xs text-slate-500 mt-0.5">
                                                    {rdv.heure}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            {rdv.lieu && (
                                              <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                                                <MapPin className="h-5 w-5 text-red-600 flex-shrink-0" />
                                                <span className="text-sm font-medium text-slate-700 truncate">{rdv.lieu}</span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Objet/Resume */}
                                          {(rdv.objet || rdv.resume_rendez_vous) && (
                                            <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                                              <p className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wide">Objet</p>
                                              <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                                                {rdv.objet || rdv.resume_rendez_vous}
                                              </p>
                                            </div>
                                          )}

                                          {/* Contact Info */}
                                          {(rdv.clientPhone || rdv.clientEmail) && (
                                            <div className="pt-4 border-t-2 border-slate-200 space-y-2">
                                              {rdv.clientPhone && (
                                                <a 
                                                  href={`tel:${rdv.clientPhone}`}
                                                  className="flex items-center gap-3 p-2.5 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                                                >
                                                  <div className="p-2 bg-green-200 rounded-lg group-hover:bg-green-300 transition-colors">
                                                    <Phone className="h-4 w-4 text-green-700" />
                                                  </div>
                                                  <span className="text-sm font-semibold text-slate-700">{rdv.clientPhone}</span>
                                                </a>
                                              )}
                                              {rdv.clientEmail && (
                                                <a 
                                                  href={`mailto:${rdv.clientEmail}`}
                                                  className="flex items-center gap-3 p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                                                >
                                                  <div className="p-2 bg-blue-200 rounded-lg group-hover:bg-blue-300 transition-colors">
                                                    <Mail className="h-4 w-4 text-blue-700" />
                                                  </div>
                                                  <span className="text-sm font-semibold text-slate-700 truncate">{rdv.clientEmail}</span>
                                                </a>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {groupedByStatus.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <div className="inline-block p-8 bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100 rounded-full mb-6">
                <Calendar className="h-20 w-20 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Aucun rendez-vous trouvé
              </h3>
              <p className="text-slate-500 text-lg">
                Il n&apos;y a actuellement aucun rendez-vous confirmé ou en attente dans le système.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Section: Rendez-vous Effectués, Déplacés, Annulés */}
      {groupedBottomByStatus.length > 0 && (
        <div className="mt-12 pt-8 border-t-4 border-slate-300">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Archive className="h-8 w-8 text-slate-600" />
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Historique des Rendez-vous
              </h2>
            </div>
            <p className="text-slate-600 text-lg ml-11">
              Rendez-vous effectués, déplacés et annulés
            </p>
          </div>

          <div className="space-y-6">
            {groupedBottomByStatus.map((statusGroup) => {
              const statusColors = getStatusColor(statusGroup.statut);
              return (
                <Card 
                  key={statusGroup.statut} 
                  className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm overflow-hidden border-l-4 ${statusColors.border}`}
                >
                  <CardHeader 
                    className={`cursor-pointer hover:bg-gradient-to-r ${statusColors.cardBg} transition-all duration-300 relative overflow-hidden`}
                    onClick={() => toggleBottomStatusExpanded(statusGroup.statut)}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-32 -mt-32"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl ${statusColors.bg} shadow-lg transform hover:scale-110 transition-transform`}>
                          {getStatusIcon(statusGroup.statut)}
                        </div>
                        <div>
                          <CardTitle className="text-2xl text-slate-900 mb-2 font-bold">
                            {STATUS_LABELS[statusGroup.statut] || statusGroup.statut}
                          </CardTitle>
                          <CardDescription className="text-base">
                            <span className="font-semibold text-slate-700">{statusGroup.totalCount}</span> rendez-vous répartis sur{" "}
                            <span className="font-semibold text-slate-700">{statusGroup.commercialGroups.length}</span> commercial{statusGroup.commercialGroups.length > 1 ? 'aux' : ''}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`${statusColors.badge} text-lg px-5 py-2 font-bold shadow-md`}>
                          {statusGroup.totalCount}
                        </Badge>
                        <div className="p-3 hover:bg-white/50 rounded-xl transition-colors">
                          {expandedBottomStatuses.has(statusGroup.statut) ? (
                            <ChevronUp className="h-6 w-6 text-slate-600" />
                          ) : (
                            <ChevronDown className="h-6 w-6 text-slate-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedBottomStatuses.has(statusGroup.statut) && (
                    <CardContent className="pt-0 pb-6">
                      <div className={`border-t-2 border-gradient-to-r ${statusColors.border} pt-6 space-y-5`}>
                        {statusGroup.commercialGroups.map((commercialGroup) => {
                          const commercialKey = `bottom-${statusGroup.statut}-${commercialGroup.userId}`;
                          return (
                            <Card 
                              key={commercialKey}
                              className="border-2 border-slate-200 hover:border-blue-400 transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-white to-slate-50"
                            >
                              <CardHeader 
                                className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all"
                                onClick={() => toggleBottomCommercialExpanded(commercialKey)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white">
                                      {commercialGroup.userName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                      <CardTitle className="text-xl text-slate-900 font-bold">
                                        {commercialGroup.userName}
                                      </CardTitle>
                                      <CardDescription className="flex items-center gap-4 mt-1">
                                        {commercialGroup.userEmail && (
                                          <span className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                            <span className="font-medium">{commercialGroup.userEmail}</span>
                                          </span>
                                        )}
                                        {commercialGroup.userPhone && (
                                          <span className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-green-600" />
                                            <span className="font-medium">{commercialGroup.userPhone}</span>
                                          </span>
                                        )}
                                      </CardDescription>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300 text-base px-4 py-2 font-bold shadow-md">
                                      {commercialGroup.count} RDV
                                    </Badge>
                                    {expandedBottomCommercials.has(commercialKey) ? (
                                      <ChevronUp className="h-6 w-6 text-slate-600" />
                                    ) : (
                                      <ChevronDown className="h-6 w-6 text-slate-600" />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>

                              {expandedBottomCommercials.has(commercialKey) && (
                                <CardContent className="pt-0 pb-6">
                                  <div className="border-t-2 border-slate-200 pt-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                      {commercialGroup.rendezVous.map((rdv) => {
                                        const rdvDate = new Date(rdv.date);
                                        const isToday = rdvDate.toDateString() === new Date().toDateString();
                                        
                                        return (
                                          <div
                                            key={rdv.id}
                                            className={`group relative p-6 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 rounded-3xl border-2 ${
                                              isToday 
                                                ? 'border-blue-400 shadow-xl ring-2 ring-blue-200' 
                                                : 'border-slate-200 hover:border-blue-400'
                                            } hover:shadow-2xl transition-all duration-300 overflow-hidden opacity-90`}
                                          >
                                            {isToday && (
                                              <div className="absolute top-3 right-3">
                                                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg animate-pulse">
                                                  Aujourd&apos;hui
                                                </Badge>
                                              </div>
                                            )}
                                            
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full"></div>
                                            
                                            <div className="relative">
                                              {/* Client Info */}
                                              <div className="flex items-start gap-4 mb-5">
                                                <div className={`p-3 rounded-2xl shadow-lg ${
                                                  rdv.clientType === 'ENTREPRISE' 
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                    : 'bg-gradient-to-br from-green-500 to-green-600'
                                                }`}>
                                                  {rdv.clientType === 'ENTREPRISE' ? (
                                                    <Building2 className="h-6 w-6 text-white" />
                                                  ) : (
                                                    <User className="h-6 w-6 text-white" />
                                                  )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <h4 className="font-bold text-slate-900 text-xl mb-2 truncate">
                                                    {rdv.clientName}
                                                  </h4>
                                                  <Badge 
                                                    variant="outline" 
                                                    className={`text-sm font-semibold ${
                                                      rdv.clientType === 'ENTREPRISE' 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                                                        : 'bg-green-50 text-green-700 border-green-300'
                                                    }`}
                                                  >
                                                    {rdv.clientType === 'ENTREPRISE' ? '🏢 Entreprise' : '👤 Particulier'}
                                                  </Badge>
                                                </div>
                                              </div>

                                              {/* Date and Time */}
                                              <div className="space-y-3 mb-5">
                                                <div className={`flex items-center gap-3 p-3 rounded-xl ${
                                                  isToday 
                                                    ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300' 
                                                    : 'bg-white/80'
                                                }`}>
                                                  <Calendar className={`h-5 w-5 flex-shrink-0 ${
                                                    isToday ? 'text-blue-600' : 'text-purple-600'
                                                  }`} />
                                                  <div>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                      {formatDate(rdv.date)}
                                                    </p>
                                                    {rdv.heure && (
                                                      <p className="text-xs text-slate-500 mt-0.5">
                                                        {rdv.heure}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>

                                                {rdv.lieu && (
                                                  <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl">
                                                    <MapPin className="h-5 w-5 text-red-600 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-slate-700 truncate">{rdv.lieu}</span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Objet/Resume */}
                                              {(rdv.objet || rdv.resume_rendez_vous) && (
                                                <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                                                  <p className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wide">Objet</p>
                                                  <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                                                    {rdv.objet || rdv.resume_rendez_vous}
                                                  </p>
                                                </div>
                                              )}

                                              {/* Contact Info */}
                                              {(rdv.clientPhone || rdv.clientEmail) && (
                                                <div className="pt-4 border-t-2 border-slate-200 space-y-2">
                                                  {rdv.clientPhone && (
                                                    <a 
                                                      href={`tel:${rdv.clientPhone}`}
                                                      className="flex items-center gap-3 p-2.5 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                                                    >
                                                      <div className="p-2 bg-green-200 rounded-lg group-hover:bg-green-300 transition-colors">
                                                        <Phone className="h-4 w-4 text-green-700" />
                                                      </div>
                                                      <span className="text-sm font-semibold text-slate-700">{rdv.clientPhone}</span>
                                                    </a>
                                                  )}
                                                  {rdv.clientEmail && (
                                                    <a 
                                                      href={`mailto:${rdv.clientEmail}`}
                                                      className="flex items-center gap-3 p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                                                    >
                                                      <div className="p-2 bg-blue-200 rounded-lg group-hover:bg-blue-300 transition-colors">
                                                        <Mail className="h-4 w-4 text-blue-700" />
                                                      </div>
                                                      <span className="text-sm font-semibold text-slate-700 truncate">{rdv.clientEmail}</span>
                                                    </a>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuiviRendezVousPage;
