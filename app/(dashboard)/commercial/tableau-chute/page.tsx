"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getTableauChuteRendezVousByUser } from '@/lib/actions/tableau-chute';
import { TableauChuteRendezVousTable } from '@/components/TableauChuteRendezVousTable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Users, TrendingDown, AlertCircle } from 'lucide-react';

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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
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
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingDown className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Chute</h1>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Erreur de chargement</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingDown className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Chute</h1>
        </div>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="text-center">
              <TrendingDown className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold text-blue-800 mb-2">Aucun tableau de chute</h3>
              <p className="text-blue-600">Aucun rendez-vous en chute trouvé pour le moment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <TrendingDown className="h-8 w-8 text-blue-500" />
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Chute</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Total Chutes</p>
                <p className="text-2xl font-bold text-blue-800">{totalChutes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Clients Uniques</p>
                <p className="text-2xl font-bold text-green-800">{uniqueClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">Ce Mois</p>
                <p className="text-2xl font-bold text-orange-800">{thisMonthChutes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-500 rounded-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600">Taux de Chute</p>
                <p className="text-2xl font-bold text-purple-800">
                  {totalChutes > 0 ? Math.round((thisMonthChutes / totalChutes) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <TableauChuteRendezVousTable data={data} onRefresh={fetchData} />
    </div>
  );
};

export default Page;