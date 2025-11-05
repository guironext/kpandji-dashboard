"use client";

import React, { useEffect, useState } from 'react';
import { getAllTableauChuteRendezVous } from '@/lib/actions/tableau-chute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, Users, AlertCircle } from 'lucide-react';
import { TableauChuteRendezVousTable } from '@/components/TableauChuteRendezVousTable';

interface TableauChuteRendezVousData {
  id: string;
  mois_chute: string;
  modeles_discutes: unknown;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
  const [data, setData] = useState<TableauChuteRendezVousData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Group data by user
  const groupedByUser = React.useMemo(() => {
    const grouped: Record<string, TableauChuteRendezVousData[]> = {};
    data.forEach((item) => {
      const userId = item.user.id;
      if (!grouped[userId]) {
        grouped[userId] = [];
      }
      grouped[userId].push(item);
    });
    return grouped;
  }, [data]);

  // Sort users by their most recent record
  const sortedUsers = React.useMemo(() => {
    return Object.entries(groupedByUser).sort((a, b) => {
      const aLatest = new Date(a[1][0].createdAt).getTime();
      const bLatest = new Date(b[1][0].createdAt).getTime();
      return bLatest - aLatest;
    });
  }, [groupedByUser]);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllTableauChuteRendezVous();
      
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600">Total Chutes</p>
                <p className="text-2xl font-bold text-blue-800">{data.length}</p>
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
                <p className="text-sm font-medium text-green-600">Utilisateurs</p>
                <p className="text-2xl font-bold text-green-800">{sortedUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600">Clients Uniques</p>
                <p className="text-2xl font-bold text-orange-800">
                  {new Set(data.map(item => item.rapportRendezVous.nom_prenom_client)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped by User */}
      <div className="space-y-8">
        {sortedUsers.map(([userId, items]) => {
          const user = items[0].user;
          const userName = `${user.firstName} ${user.lastName}`;
          
          return (
            <div key={userId} className="space-y-4">
              <Card className="shadow-md border-l-4 border-l-blue-500">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                  <CardTitle className="text-xl font-semibold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span>{userName}</span>
                        <span className="text-sm font-normal text-slate-600 ml-2">
                          ({user.email})
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                      {items.length} {items.length === 1 ? 'chute' : 'chutes'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
              <div className="-mt-6">
                <TableauChuteRendezVousTable 
                  data={items as unknown as TableauChuteRendezVousData[]} 
                  onRefresh={fetchData}
                  showReporterButton={false}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Page;