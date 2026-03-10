"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getTableauChuteRendezVousByUser } from '@/lib/actions/tableau-chute';
import { TableauChuteRendezVousTable } from '@/components/TableauChuteRendezVousTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Users, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';

interface TableauChuteRendezVousData {
  id: string;
  mois_chute: string;
  modeles_discutes: unknown;
  createdAt: string;
  rapportRendezVous: {
    id: string;
    nom_prenom_client: string;
    telephone_client: string;
    email_client?: string;
    profession_societe?: string;
    type_client: string;
    motivations_achat?: string;
    points_positifs?: string;
    objections_freins?: string;
    degre_interet?: string;
    decision_attendue?: string;
    commentaire_global?: string;
    client?: {
      id: string;
      nom: string;
      email?: string;
      telephone: string;
      entreprise?: string;
      localisation?: string;
    };
    clientEntreprise?: {
      id: string;
      nom_entreprise: string;
      email?: string;
      telephone: string;
      localisation?: string;
    };
    rendezVous: {
      id: string;
      date: string;
      statut: string;
    };
  };
}

const Page = () => {
  const { user } = useUser();
  const [data, setData] = useState<TableauChuteRendezVousData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate statistics
  const totalChutes = data.length;
  const uniqueClients = new Set(data.map(item => item.rapportRendezVous.nom_prenom_client)).size;
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const thisMonthChutes = data.filter(item => 
    item.mois_chute.toLowerCase().includes(currentMonth.split(' ')[0].toLowerCase())
  ).length;

  const fetchData = React.useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const result = await getTableauChuteRendezVousByUser(user.id);
      
      if (result.success && result.data) {
        setData(result.data as unknown as TableauChuteRendezVousData[]);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error('Error fetching tableau chute rendez-vous:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] space-y-8 animate-in fade-in duration-300">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-14" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 mb-6" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center py-3 border-b border-border/50 last:border-0">
                  <Skeleton className="h-4 w-28 shrink-0" />
                  <Skeleton className="h-4 w-40 shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24 shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de Chute</h1>
            <p className="text-muted-foreground text-sm mt-1">Suivi des rendez-vous en chute</p>
          </div>
        </header>
        <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Erreur de chargement</h3>
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => fetchData()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de Chute</h1>
            <p className="text-muted-foreground text-sm mt-1">Suivi des rendez-vous en chute</p>
          </div>
        </header>
        <Card className="border-0 shadow-sm overflow-hidden bg-muted/30">
          <CardContent className="p-16">
            <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <TrendingDown className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">Aucun rendez-vous en chute</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Aucun rendez-vous en chute n&apos;a été enregistré pour le moment. Les rendez-vous en chute apparaîtront ici lorsqu&apos;ils seront signalés.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Chutes",
      value: totalChutes,
      icon: TrendingDown,
      className: "from-amber-500/10 to-orange-500/5 border-amber-200/50 dark:border-amber-800/30",
      iconBg: "bg-amber-500",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Clients Uniques",
      value: uniqueClients,
      icon: Users,
      className: "from-emerald-500/10 to-teal-500/5 border-emerald-200/50 dark:border-emerald-800/30",
      iconBg: "bg-emerald-500",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Ce Mois",
      value: thisMonthChutes,
      icon: CalendarDays,
      className: "from-sky-500/10 to-blue-500/5 border-sky-200/50 dark:border-sky-800/30",
      iconBg: "bg-sky-500",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      label: "Taux de Chute",
      value: `${totalChutes > 0 ? Math.round((thisMonthChutes / totalChutes) * 100) : 0}%`,
      icon: AlertCircle,
      className: "from-rose-500/10 to-pink-500/5 border-rose-200/50 dark:border-rose-800/30",
      iconBg: "bg-rose-500",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de Chute</h1>
          <p className="text-muted-foreground text-sm mt-1">Suivi des rendez-vous en chute et opportunités à relancer</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData()}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className={`overflow-hidden border bg-gradient-to-br ${stat.className} transition-all hover:shadow-md hover:-translate-y-0.5`}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} text-white shadow-sm`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${stat.iconColor}`}>{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table */}
      <TableauChuteRendezVousTable data={data} onRefresh={fetchData} />
    </div>
  );
};

export default Page;