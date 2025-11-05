"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RendezVousForm } from '@/components/RendezVousForm';
import { RendezVousList } from '@/components/RendezVousList';
import { getRendezVousByUser } from '@/lib/actions/rendezvous';
import { Loader2, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RendezVous } from '@/lib/types/rendezvous';

export default function RendezVousPage() {
  const { user, isLoaded } = useUser();
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRendezVous = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await getRendezVousByUser(user.id);
      if (result.success) {
        setRendezVous(result.data || []);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des rendez-vous');
      }
    } catch (error) {
      console.error('Error fetching rendez-vous:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
    }
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRendezVous();
    setRefreshing(false);
  };

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchRendezVous().finally(() => setLoading(false));
    }
  }, [isLoaded, user?.id, fetchRendezVous]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement des rendez-vous...</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Non autorisé</h2>
          <p className="text-gray-600">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const upcomingRendezVous = rendezVous.filter(rv => 
    new Date(rv.date) >= new Date() && rv.statut !== 'ANNULE' && rv.statut !== 'EFFECTUE'
  );

  const completedRendezVous = rendezVous.filter(rv => 
    rv.statut === 'EFFECTUE'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
          <div className="relative px-8 py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Rendez-vous
                    </h1>
                    <p className="text-gray-600 text-lg mt-1">
                      Gestion professionnelle de vos rendez-vous clients / prospects
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                
                <RendezVousForm 
                  clerkUserId={user.id} 
                  onSuccess={fetchRendezVous}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total</p>
                  <p className="text-4xl font-bold text-blue-900">{rendezVous.length}</p>
                  <p className="text-sm text-blue-600">Rendez-vous</p>
                </div>
                <div className="p-4 bg-blue-500 rounded-2xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">À venir</p>
                  <p className="text-4xl font-bold text-green-900">{upcomingRendezVous.length}</p>
                  <p className="text-sm text-green-600">Prochains RDV</p>
                </div>
                <div className="p-4 bg-green-500 rounded-2xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Terminés</p>
                  <p className="text-4xl font-bold text-purple-900">{completedRendezVous.length}</p>
                  <p className="text-sm text-purple-600">Effectués</p>
                </div>
                <div className="p-4 bg-purple-500 rounded-2xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Rendez-vous List */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-100">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              Liste des Rendez-vous
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RendezVousList 
              rendezVous={rendezVous} 
              onUpdate={fetchRendezVous}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}