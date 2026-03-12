"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { getClientsByStatus } from '@/lib/actions/client';
import { getClientEntreprisesByStatus, reassignClientEntrepriseProspect } from '@/lib/actions/client_entreprise';
import { reassignClientProspect } from '@/lib/actions/client';
import { getAllCommercialUsers } from '@/lib/actions/superviseur';
import { getProspectsChartDataByCommercialAndMonth } from '@/lib/actions/prospects-chart';
import {
  Building2,
  Phone,
  Mail,
  User,
  UserPlus,
  Loader2,
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  BarChart3,
  Factory,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarStack,
} from 'recharts';

const CHART_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
];
import { toast } from 'sonner';

interface Client {
  id: string;
  nom: string;
  email?: string | null;
  telephone: string;
  entreprise?: string | null;
  localisation?: string | null;
  secteur_activite?: string | null;
  commercial?: string | null;
  status_client: string;
  createdAt: Date;
  user?: { firstName: string; lastName: string } | null;
}

interface ClientEntreprise {
  id: string;
  nom_entreprise: string;
  sigle?: string | null;
  email?: string | null;
  telephone: string;
  nom_personne_contact?: string | null;
  fonction_personne_contact?: string | null;
  localisation?: string | null;
  secteur_activite?: string | null;
  commercial?: string | null;
  status_client: string;
  createdAt: Date;
  user?: { firstName: string; lastName: string } | null;
}

interface CommercialUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CLIENT': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    case 'PROSPECT': return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-500/30';
    case 'FAVORABLE': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30';
    case 'A_SUIVRE': return 'bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30';
    case 'ABANDONNE': return 'bg-slate-500/15 text-slate-600 dark:text-slate-500 border-slate-500/20';
    default: return 'bg-slate-500/15 text-slate-600 border-slate-500/20';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'CLIENT': return 'Client';
    case 'PROSPECT': return 'Prospect';
    case 'FAVORABLE': return 'Favorable';
    case 'A_SUIVRE': return 'À suivre';
    case 'ABANDONNE': return 'Abandonné';
    default: return status;
  }
};

const getCommercialDisplayName = (item: Client | ClientEntreprise) => {
  if (item.commercial) return item.commercial;
  const user = item.user as { firstName?: string; lastName?: string } | undefined;
  if (user?.firstName || user?.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  return '—';
};

function ProspectCardSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-5 w-[70%]" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
          <Skeleton className="h-11 w-full mt-6 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function ProspectsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientEntreprises, setClientEntreprises] = useState<ClientEntreprise[]>([]);
  const [commercials, setCommercials] = useState<CommercialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedForReassign, setSelectedForReassign] = useState<{
    type: 'client' | 'clientEntreprise';
    item: Client | ClientEntreprise;
  } | null>(null);
  const [selectedCommercialId, setSelectedCommercialId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [chartData, setChartData] = useState<{ chartData: Array<Record<string, string | number>>; commercialNames: string[] } | null>(null);

  const fetchData = async () => {
    try {
      const [clientsResult, clientEntreprisesResult, commercialsResult, chartResult] = await Promise.all([
        getClientsByStatus('PROSPECT'),
        getClientEntreprisesByStatus('PROSPECT'),
        getAllCommercialUsers(),
        getProspectsChartDataByCommercialAndMonth(),
      ]);

      if (clientsResult.success && clientsResult.data) {
        setClients(clientsResult.data as unknown as Client[]);
      }
      if (clientEntreprisesResult.success && clientEntreprisesResult.data) {
        setClientEntreprises(clientEntreprisesResult.data as unknown as ClientEntreprise[]);
      }
      if (commercialsResult.success && commercialsResult.data) {
        setCommercials(commercialsResult.data as unknown as CommercialUser[]);
      }
      if (chartResult.success && chartResult.data) {
        setChartData(chartResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q)) ||
        c.telephone.includes(q) ||
        getCommercialDisplayName(c).toLowerCase().includes(q) ||
        (c.localisation?.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  const filteredClientEntreprises = useMemo(() => {
    if (!searchQuery.trim()) return clientEntreprises;
    const q = searchQuery.toLowerCase();
    return clientEntreprises.filter(
      (c) =>
        c.nom_entreprise.toLowerCase().includes(q) ||
        (c.sigle?.toLowerCase().includes(q)) ||
        (c.email?.toLowerCase().includes(q)) ||
        c.telephone.includes(q) ||
        getCommercialDisplayName(c).toLowerCase().includes(q) ||
        (c.nom_personne_contact?.toLowerCase().includes(q))
    );
  }, [clientEntreprises, searchQuery]);

  const handleReassignClick = (type: 'client' | 'clientEntreprise', item: Client | ClientEntreprise) => {
    setSelectedForReassign({ type, item });
    setSelectedCommercialId('');
    setReassignModalOpen(true);
  };

  const handleReassignConfirm = async () => {
    if (!selectedForReassign || !selectedCommercialId) {
      toast.error('Veuillez sélectionner un commercial');
      return;
    }

    const commercial = commercials.find((c) => c.id === selectedCommercialId);
    if (!commercial) {
      toast.error('Commercial introuvable');
      return;
    }

    const newCommercialName = `${commercial.firstName} ${commercial.lastName}`.trim();

    setIsReassigning(true);
    try {
      let result;
      if (selectedForReassign.type === 'client') {
        result = await reassignClientProspect(
          selectedForReassign.item.id,
          selectedCommercialId,
          newCommercialName
        );
      } else {
        result = await reassignClientEntrepriseProspect(
          selectedForReassign.item.id,
          selectedCommercialId,
          newCommercialName
        );
      }

      if (result.success) {
        toast.success('Prospect réattribué avec succès');
        setReassignModalOpen(false);
        setSelectedForReassign(null);
        fetchData();
      } else {
        toast.error(result.error || 'Erreur lors de la réattribution');
      }
    } catch (error) {
      console.error('Error reassigning:', error);
      toast.error('Erreur lors de la réattribution');
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c0f14]">
      {/* Hero Header - Premium gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <div className="relative px-6 py-14 lg:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-white/95 border border-white/20">
                  <Users className="h-4 w-4" />
                  Gestion des prospects
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-[2.75rem]">
                  Tous les Prospects
                </h1>
                <p className="max-w-lg text-lg text-white/90 leading-relaxed">
                  Visualisez et réattribuez les prospects individuels et entreprises de votre équipe commerciale
                </p>
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 px-8 py-6 min-w-[140px] shadow-xl shadow-black/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 mb-3">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white">{clients.length}</span>
                  <span className="text-sm font-medium text-white/80 mt-0.5">Individuels</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 px-8 py-6 min-w-[140px] shadow-xl shadow-black/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 mb-3">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-white">{clientEntreprises.length}</span>
                  <span className="text-sm font-medium text-white/80 mt-0.5">Entreprises</span>
                </div>
              </div>
            </div>
            {/* Chart - Prospects by commercial and month */}
            <div className="mt-8">
              <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">Prospects par commercial et par mois</h2>
                </div>
                <div className="h-[320px] w-full">
                  {loading ? (
                    <div className="flex h-full items-center justify-center rounded-xl bg-white/10">
                      <Loader2 className="h-8 w-8 animate-spin text-white/80" />
                    </div>
                  ) : chartData && chartData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData.chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                        <XAxis
                          dataKey="month"
                          stroke="rgba(255,255,255,0.8)"
                          tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 12 }}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.8)"
                          tick={{ fill: 'rgba(255,255,255,0.9)', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(15,23,42,0.95)',
                            color: '#fff',
                          }}
                          labelStyle={{ color: 'rgba(255,255,255,0.9)' }}
                          labelFormatter={(label) => `Mois: ${label}`}
                        />
                        <Legend
                          wrapperStyle={{ color: 'rgba(255,255,255,0.9)' }}
                          formatter={(value) => <span className="text-white/90">{value}</span>}
                        />
                        <BarStack>
                          {chartData.commercialNames.map((name, i) => (
                            <Bar
                              key={name}
                              dataKey={name}
                              stackId="a"
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                              radius={[0, 4, 0, 0]}
                              name={name}
                            />
                          ))}
                        </BarStack>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center rounded-xl bg-white/5">
                      <BarChart3 className="h-12 w-12 text-white/40 mb-2" />
                      <p className="text-sm text-white/70">Aucune donnée de prospect à afficher</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative -mt-6 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, email, téléphone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500/20"
                />
              </div>
              <TabsList className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1.5 gap-1">
                <TabsTrigger
                  value="individual"
                  className="rounded-lg px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-400"
                >
                  <User className="h-4 w-4 mr-2" />
                  Individuels
                </TabsTrigger>
                <TabsTrigger
                  value="enterprise"
                  className="rounded-lg px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-indigo-400"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Entreprises
                </TabsTrigger>
              </TabsList>
            </div>
              <TabsContent value="individual" className="mt-0 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Prospects Individuels</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {filteredClients.length} prospect{filteredClients.length !== 1 ? 's' : ''} affiché{filteredClients.length !== 1 ? 's' : ''}
                    {searchQuery && ` pour « ${searchQuery} »`}
                  </p>
                </div>
                {loading ? (
                  <ProspectCardSkeleton />
                ) : filteredClients.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredClients.map((client, index) => (
                      <div
                        key={client.id}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/30 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:-translate-y-0.5"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/10">
                              <User className="h-7 w-7" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white text-lg truncate">{client.nom}</h3>
                              <Badge variant="outline" className={`mt-2 text-xs font-medium ${getStatusColor(client.status_client)}`}>
                                {getStatusLabel(client.status_client)}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {client.telephone && (
                              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <Phone className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate">{client.telephone}</span>
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <Mail className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            {client.localisation && (
                              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <MapPin className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate">{client.localisation}</span>
                              </div>
                            )}
                            {client.secteur_activite && (
                              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <Factory className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate">{client.secteur_activite}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                                <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commercial</h4>
                                <p className="font-medium text-slate-700 dark:text-slate-300">{getCommercialDisplayName(client)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                              <Calendar className="h-3.5 w-3.5" />
                              Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-6 h-11 rounded-xl border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-800 font-medium transition-all"
                            onClick={() => handleReassignClick('client', client)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Réattribuer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5">
                      <User className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Aucun prospect trouvé</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
                      {searchQuery
                        ? `Aucun résultat pour « ${searchQuery} ». Modifiez votre recherche.`
                        : 'Aucun prospect individuel avec le statut PROSPECT pour le moment.'}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="enterprise" className="mt-0 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Prospects Entreprises</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {filteredClientEntreprises.length} prospect{filteredClientEntreprises.length !== 1 ? 's' : ''} affiché{filteredClientEntreprises.length !== 1 ? 's' : ''}
                    {searchQuery && ` pour « ${searchQuery} »`}
                  </p>
                </div>
                {loading ? (
                  <ProspectCardSkeleton />
                ) : filteredClientEntreprises.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredClientEntreprises.map((ce, index) => (
                      <div
                        key={ce.id}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white dark:bg-slate-900/30 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:-translate-y-0.5"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/10">
                              <Building2 className="h-7 w-7" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white text-lg truncate">
                                {ce.nom_entreprise}
                                {ce.sigle && (
                                  <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">({ce.sigle})</span>
                                )}
                              </h3>
                              <Badge variant="outline" className={`mt-2 text-xs font-medium ${getStatusColor(ce.status_client)}`}>
                                {getStatusLabel(ce.status_client)}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {ce.telephone && (
                              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <Phone className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate">{ce.telephone}</span>
                              </div>
                            )}
                            {ce.email && (
                              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <Mail className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate">{ce.email}</span>
                              </div>
                            )}
                            
                            {ce.localisation && (
                              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <MapPin className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate">{ce.localisation}</span>
                              </div>
                            )}
                            {ce.secteur_activite && (
                              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <Factory className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="truncate">{ce.secteur_activite}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                                <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Commercial</h4>
                                <p className="font-medium text-slate-700 dark:text-slate-300">{getCommercialDisplayName(ce)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                              <Calendar className="h-3.5 w-3.5" />
                              Créé le {new Date(ce.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-6 h-11 rounded-xl border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-800 font-medium transition-all"
                            onClick={() => handleReassignClick('clientEntreprise', ce)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Réattribuer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5">
                      <Building2 className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Aucun prospect trouvé</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
                      {searchQuery
                        ? `Aucun résultat pour « ${searchQuery} ». Modifiez votre recherche.`
                        : 'Aucun prospect entreprise avec le statut PROSPECT pour le moment.'}
                    </p>
                  </div>
                )}
              </TabsContent>
          </Tabs>
          </div>
        </div>
      </main>

      {/* Reassign Modal */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
                <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Réattribuer le prospect
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            {selectedForReassign && (
              <>
                <p className="text-slate-600 dark:text-slate-400">
                  Assignez ce prospect à un nouveau commercial :{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedForReassign.type === 'client'
                      ? (selectedForReassign.item as Client).nom
                      : (selectedForReassign.item as ClientEntreprise).nom_entreprise}
                  </span>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="commercial-select" className="text-slate-700 dark:text-slate-300 font-medium">
                    Nouveau commercial
                  </Label>
                  <Select value={selectedCommercialId} onValueChange={setSelectedCommercialId}>
                    <SelectTrigger id="commercial-select" className="h-12 rounded-xl">
                      <SelectValue placeholder="Choisir un commercial" />
                    </SelectTrigger>
                    <SelectContent>
                      {commercials.map((commercial) => (
                        <SelectItem key={commercial.id} value={commercial.id}>
                          {commercial.firstName} {commercial.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setReassignModalOpen(false)}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleReassignConfirm}
                    disabled={!selectedCommercialId || isReassigning}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25"
                  >
                    {isReassigning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Réattribuer
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
