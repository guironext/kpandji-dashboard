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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Users,
  Mail,
  Phone,
  MapPin,
  Clock,
  Building2,
  User,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarCheck,
  Briefcase,
  UserCircle2,
} from "lucide-react";
import { getAllRendezVousByUser } from "@/lib/actions/superviseur";

interface RendezVous {
  id: string;
  date: Date;
  heure: string;
  lieu: string | null;
  statut: string;
  objet: string | null;
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

const SuiviRendezVousPage = () => {
  const [loading, setLoading] = useState(true);
  const [rendezVousByUser, setRendezVousByUser] = useState<UserRendezVous[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllRendezVousByUser();
      
      if (result.success && result.data) {
        setRendezVousByUser(result.data);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter and search logic
  const filteredData = useMemo(() => {
    return rendezVousByUser.map(user => {
      const filteredRendezVous = user.rendezVous.filter(rdv => {
        // Search filter
        const matchesSearch = searchQuery === '' || 
          user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rdv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rdv.lieu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rdv.objet?.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === 'ALL' || rdv.statut === statusFilter;

        // Client type filter
        const matchesClientType = clientTypeFilter === 'ALL' || rdv.clientType === clientTypeFilter;

        return matchesSearch && matchesStatus && matchesClientType;
      });

      return {
        ...user,
        rendezVous: filteredRendezVous,
        totalRendezVous: filteredRendezVous.length,
      };
    }).filter(user => user.totalRendezVous > 0 || searchQuery === '');
  }, [rendezVousByUser, searchQuery, statusFilter, clientTypeFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const allRendezVous = rendezVousByUser.flatMap(user => user.rendezVous);
    return {
      total: allRendezVous.length,
      effectue: allRendezVous.filter(r => r.statut === 'EFFECTUE').length,
      confirme: allRendezVous.filter(r => r.statut === 'CONFIRME').length,
      enAttente: allRendezVous.filter(r => r.statut === 'EN_ATTENTE').length,
      annule: allRendezVous.filter(r => r.statut === 'ANNULE').length,
      particulier: allRendezVous.filter(r => r.clientType === 'PARTICULIER').length,
      entreprise: allRendezVous.filter(r => r.clientType === 'ENTREPRISE').length,
    };
  }, [rendezVousByUser]);

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
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
      case "EFFECTUE":
        return "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-300";
      case "CONFIRME":
        return "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-300";
      case "EN_ATTENTE":
        return "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-300";
      case "ANNULE":
        return "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300";
      default:
        return "bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-slate-300";
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case "EFFECTUE":
        return <CheckCircle2 className="h-4 w-4" />;
      case "CONFIRME":
        return <CalendarCheck className="h-4 w-4" />;
      case "EN_ATTENTE":
        return <AlertCircle className="h-4 w-4" />;
      case "ANNULE":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

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
      {/* Header with Gradient */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <CalendarCheck className="h-8 w-8 text-white" />
            </div>
    <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Suivi des Rendez-vous
              </h1>
              <p className="text-slate-600 mt-1">
                Gestion complète des rendez-vous par commercial
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-blue-600/5 to-purple-600/5 group-hover:from-blue-500/10 group-hover:via-blue-600/10 group-hover:to-purple-600/10 transition-all"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Total Commerciaux
            </CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {rendezVousByUser.length}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Équipe commerciale active
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-purple-600/5 to-pink-600/5 group-hover:from-purple-500/10 group-hover:via-purple-600/10 group-hover:to-pink-600/10 transition-all"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Total Rendez-vous
            </CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {statistics.total}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Tous les rendez-vous enregistrés
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-green-600/5 to-emerald-600/5 group-hover:from-green-500/10 group-hover:via-green-600/10 group-hover:to-emerald-600/10 transition-all"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              RDV Effectués
            </CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {statistics.effectue}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {statistics.total > 0 ? `${Math.round((statistics.effectue / statistics.total) * 100)}%` : '0%'} du total
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-amber-600/5 to-orange-600/5 group-hover:from-amber-500/10 group-hover:via-amber-600/10 group-hover:to-orange-600/10 transition-all"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Moyenne / Commercial
            </CardTitle>
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
              {rendezVousByUser.length > 0 
                ? Math.round(statistics.total / rendezVousByUser.length)
                : 0}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Rendez-vous par personne
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Effectués</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{statistics.effectue}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CalendarCheck className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Confirmés</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{statistics.confirme}</p>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">En Attente</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{statistics.enAttente}</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-semibold text-red-700">Annulés</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{statistics.annule}</p>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <UserCircle2 className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700">Particuliers</span>
          </div>
          <p className="text-2xl font-bold text-indigo-700">{statistics.particulier}</p>
        </div>
        
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold text-violet-700">Entreprises</span>
          </div>
          <p className="text-2xl font-bold text-violet-700">{statistics.entreprise}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <CardTitle>Filtres & Recherche</CardTitle>
          </div>
          <CardDescription>
            Affinez votre recherche de rendez-vous
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, lieu, objet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="EFFECTUE">✓ Effectués</SelectItem>
                <SelectItem value="CONFIRME">📅 Confirmés</SelectItem>
                <SelectItem value="EN_ATTENTE">⏳ En attente</SelectItem>
                <SelectItem value="ANNULE">✕ Annulés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                <SelectItem value="PARTICULIER">👤 Particuliers</SelectItem>
                <SelectItem value="ENTREPRISE">🏢 Entreprises</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || statusFilter !== 'ALL' || clientTypeFilter !== 'ALL') && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">Résultats:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {filteredData.reduce((sum, user) => sum + user.totalRendezVous, 0)} rendez-vous trouvés
              </Badge>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setClientTypeFilter('ALL');
                }}
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rendez-vous by User */}
      <div className="space-y-6">
        {filteredData.map((user) => (
          <Card 
            key={user.userId} 
            className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm overflow-hidden"
          >
            <CardHeader 
              className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300"
              onClick={() => toggleUserExpanded(user.userId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {user.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-900 mb-1">
                      {user.userName}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-3">
                      {user.userEmail && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Mail className="h-3.5 w-3.5" />
                          {user.userEmail}
                        </span>
                      )}
                      {user.userPhone && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5" />
                          {user.userPhone}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-bold px-5 py-2.5 rounded-xl shadow-md border border-purple-200">
                      <span className="text-2xl">{user.totalRendezVous}</span>
                      <span className="text-xs ml-1.5">RDV</span>
                    </div>
                  </div>
                  <div className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    {expandedUsers.has(user.userId) ? (
                      <ChevronUp className="h-6 w-6 text-slate-600" />
                    ) : (
                      <ChevronDown className="h-6 w-6 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            {expandedUsers.has(user.userId) && (
              <CardContent className="pt-0">
                <div className="border-t border-gradient-to-r from-slate-200 via-blue-200 to-purple-200 pt-6">
                  {user.rendezVous.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {user.rendezVous.map((rdv) => (
                        <div
                          key={rdv.id}
                          className="group relative p-5 bg-gradient-to-br from-white via-slate-50 to-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                          {/* Decorative corner */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full"></div>
                          
                          <div className="relative">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`p-2.5 rounded-xl shadow-md ${
                                  rdv.clientType === 'ENTREPRISE' 
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                    : 'bg-gradient-to-br from-green-500 to-green-600'
                                }`}>
                                  {rdv.clientType === 'ENTREPRISE' ? (
                                    <Building2 className="h-5 w-5 text-white" />
                                  ) : (
                                    <User className="h-5 w-5 text-white" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-slate-900 text-lg mb-1 truncate">
                                    {rdv.clientName}
                                  </h4>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      rdv.clientType === 'ENTREPRISE' 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-green-50 text-green-700 border-green-200'
                                    }`}
                                  >
                                    {rdv.clientType === 'ENTREPRISE' ? '🏢 Entreprise' : '👤 Particulier'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="mb-4">
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(rdv.statut)} flex items-center gap-1.5 w-fit px-3 py-1.5 font-semibold`}
                              >
                                {getStatusIcon(rdv.statut)}
                                {rdv.statut.replace('_', ' ')}
                              </Badge>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center gap-3 p-2.5 bg-white/70 rounded-lg">
                                <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-slate-700">{formatDate(rdv.date)}</span>
                              </div>
                              
                              {rdv.heure && (
                                <div className="flex items-center gap-3 p-2.5 bg-white/70 rounded-lg">
                                  <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-sm font-medium text-slate-700">{rdv.heure}</span>
                                </div>
                              )}

                              {rdv.lieu && (
                                <div className="flex items-center gap-3 p-2.5 bg-white/70 rounded-lg">
                                  <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
                                  <span className="text-sm text-slate-700 truncate">{rdv.lieu}</span>
                                </div>
                              )}
                            </div>

                            {/* Objet */}
                            {rdv.objet && (
                              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Objet du rendez-vous</p>
                                <p className="text-sm text-slate-700 line-clamp-2">
                                  {rdv.objet}
                                </p>
                              </div>
                            )}

                            {/* Contact Info */}
                            {(rdv.clientPhone || rdv.clientEmail) && (
                              <div className="pt-4 border-t border-slate-200 space-y-2">
                                {rdv.clientPhone && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="p-1.5 bg-green-100 rounded">
                                      <Phone className="h-3 w-3 text-green-600" />
                                    </div>
                                    <span className="font-medium">{rdv.clientPhone}</span>
                                  </div>
                                )}
                                {rdv.clientEmail && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                                    <div className="p-1.5 bg-blue-100 rounded flex-shrink-0">
                                      <Mail className="h-3 w-3 text-blue-600" />
                                    </div>
                                    <span className="font-medium truncate">{rdv.clientEmail}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-6">
                      <div className="inline-block p-6 bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl mb-4">
                        <Calendar className="h-16 w-16 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        Aucun rendez-vous
                      </h3>
                      <p className="text-sm text-slate-500">
                        Ce commercial n&apos;a aucun rendez-vous enregistré pour le moment
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {filteredData.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <div className="inline-block p-8 bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100 rounded-full mb-6">
                <Users className="h-20 w-20 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                Aucun rendez-vous trouvé
              </h3>
              <p className="text-slate-500 text-lg mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'ALL' || clientTypeFilter !== 'ALL'
                  ? "Aucun rendez-vous ne correspond à vos critères de recherche."
                  : "Il n'y a actuellement aucun rendez-vous enregistré dans le système."}
              </p>
              {(searchQuery || statusFilter !== 'ALL' || clientTypeFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setClientTypeFilter('ALL');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Afficher tous les rendez-vous
                </button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuiviRendezVousPage;
