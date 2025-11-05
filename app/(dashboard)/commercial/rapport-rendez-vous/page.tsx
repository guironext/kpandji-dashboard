"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, FileText, User, Building2, Phone, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getRendezVousByUser, createRapportRendezVousComplet } from '@/lib/actions/rendezvous';
import { RapportRendezVousForm } from '@/components/RapportRendezVousForm';

interface RendezVous {
  id: string;
  date: Date;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'DEPLACE' | 'EFFECTUE' | 'ANNULE';
  resume_rendez_vous?: string | null;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
  client?: {
    id: string;
    nom: string;
    telephone: string;
    email?: string | null;
    entreprise?: string | null;
  } | null;
  clientEntreprise?: {
    id: string;
    nom_entreprise: string;
    telephone: string;
    email?: string | null;
    nom_personne_contact?: string | null;
  } | null;
  voitures_souhaitees?: {
    id: string;
    voitureModel: {
      id: string;
      model: string;
    } | null;
  }[];
  rapportRendezVous?: {
    id: string;
  }[];
}

export default function RapportRendezVousPage() {
  const { user, isLoaded } = useUser();
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchRendezVous = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await getRendezVousByUser(user.id);
      if (result.success) {
        // Filter only rendezvous with status EFFECTUE
        const effectueRendezVous = (result.data || []).filter(rv => rv.statut === 'EFFECTUE');
        setRendezVous(effectueRendezVous);
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

  const handleRapport = (rendezVous: RendezVous) => {
    setSelectedRendezVous(rendezVous);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: {
    rendezVousId: string;
    clientId?: string;
    clientEntrepriseId?: string;
    date_rendez_vous: string;
    heure_rendez_vous: string;
    lieu_rendez_vous: string;
    lieu_autre?: string;
    conseiller_commercial: string;
    duree_rendez_vous: string;
    nom_prenom_client: string;
    telephone_client: string;
    email_client?: string;
    profession_societe?: string;
    type_client: string;
    presentation_gamme: boolean;
    essai_vehicule: boolean;
    negociation_commerciale: boolean;
    livraison_vehicule: boolean;
    service_apres_vente: boolean;
    objet_autre?: string;
    modeles_discutes: Array<{
      modele: string;
      motorisation: string;
      transmission: string;
      couleur: string;
      observation: string;
    }>;
    motivations_achat?: string;
    points_positifs?: string;
    objections_freins?: string;
    degre_interet?: string;
    decision_attendue?: string;
    devis_offre_remise: boolean;
    reference_offre?: string;
    financement_propose?: string;
    assurance_entretien: boolean;
    reprise_ancien_vehicule: boolean;
    actions_suivi: Array<{
      action: string;
      responsable: string;
      echeance: string;
      statut: string;
    }>;
    commentaire_global?: string;
  }) => {
    try {
      const result = await createRapportRendezVousComplet(data);
      if (result.success) {
        toast.success('Rapport créé avec succès!');
        setShowForm(false);
        setSelectedRendezVous(null);
        // Refresh the list
        await fetchRendezVous();
      } else {
        toast.error(result.error || 'Erreur lors de la création du rapport');
      }
    } catch (error) {
      console.error('Error submitting rapport:', error);
      toast.error('Erreur lors de la création du rapport');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedRendezVous(null);
  };

  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchRendezVous().finally(() => setLoading(false));
    }
  }, [isLoaded, user?.id, fetchRendezVous]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getClientInfo = (rendezVous: RendezVous) => {
    if (rendezVous.client) {
      return {
        type: 'CLIENT',
        name: rendezVous.client.nom,
        contact: rendezVous.client.telephone,
        email: rendezVous.client.email,
        icon: User,
      };
    } else if (rendezVous.clientEntreprise) {
      return {
        type: 'CLIENT_ENTREPRISE',
        name: rendezVous.clientEntreprise.nom_entreprise,
        contact: rendezVous.clientEntreprise.telephone,
        email: rendezVous.clientEntreprise.email,
        icon: Building2,
      };
    }
    return null;
  };

  if (!isLoaded || loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Chargement des rapports...
              </h3>
              <p className="text-gray-600">
                Récupération de vos rendez-vous effectués
              </p>
            </div>
          </div>
        </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Rapport Rendez-vous
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Gérez les rapports pour vos rendez-vous effectués
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total des rendez-vous</p>
                <p className="text-2xl font-bold text-green-600">{rendezVous.length}</p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {rendezVous.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="p-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-6">
                  <Calendar className="h-16 w-16 text-gray-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">!</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Aucun rendez-vous effectué
              </h3>
              <p className="text-gray-600 text-center max-w-md text-lg">
                Vous n&apos;avez pas encore de rendez-vous avec le statut &quot;EFFECTUE&quot;.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Les rapports seront disponibles une fois vos rendez-vous marqués comme effectués.
                </span>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {rendezVous.map((rv, index) => {
              const clientInfo = getClientInfo(rv);
              const ClientIcon = clientInfo?.icon || User;
              const hasRapport = rv.rapportRendezVous && rv.rapportRendezVous.length > 0;

              return (
                <Card key={rv.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2"></div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-green-600">{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                            {formatDate(rv.date)}
                          </CardTitle>
                          <p className="text-lg font-semibold text-gray-700">
                            à {formatTime(rv.date)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                              ✓ EFFECTUE
                            </span>
                            <span className="text-xs text-gray-500">
                              Créé le {new Intl.DateTimeFormat('fr-FR').format(new Date(rv.createdAt))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRapport(rv)}
                        disabled={hasRapport}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-purple-600"
                      >
                        <FileText className="h-5 w-5" />
                        {hasRapport ? 'Rapport Déjà Créé' : 'Générer Rapport'}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Client Information */}
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="font-bold text-gray-900 flex items-center gap-3 mb-4 text-lg">
                            <div className="p-2 bg-blue-500 rounded-lg">
                              <ClientIcon className="h-5 w-5 text-white" />
                            </div>
                            {clientInfo?.type === 'CLIENT' ? 'Informations Client' : 'Informations Client Entreprise'}
                          </h4>
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                              <p className="font-bold text-gray-900 text-lg">{clientInfo?.name}</p>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                              <Phone className="h-5 w-5 text-blue-500" />
                              <span className="font-medium">{clientInfo?.contact}</span>
                            </div>
                            {clientInfo?.email && (
                              <div className="flex items-center gap-3 text-gray-700">
                                <Mail className="h-5 w-5 text-blue-500" />
                                <span className="font-medium">{clientInfo.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rendez-vous Details */}
                      <div className="space-y-6">
                        {rv.resume_rendez_vous && (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                            <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                              <div className="p-2 bg-purple-500 rounded-lg">
                                <FileText className="h-4 w-4 text-white" />
                              </div>
                              Résumé du Rendez-vous
                            </h4>
                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                              <p className="text-gray-700 leading-relaxed">
                                {rv.resume_rendez_vous}
                              </p>
                            </div>
                          </div>
                        )}
                        {rv.note && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                            <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                              <div className="p-2 bg-amber-500 rounded-lg">
                                <FileText className="h-4 w-4 text-white" />
                              </div>
                              Notes
                            </h4>
                            <div className="bg-white rounded-lg p-4 border border-gray-100">
                              <p className="text-gray-700 leading-relaxed">
                                {rv.note}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voitures souhaitées */}
                    {rv.voitures_souhaitees && rv.voitures_souhaitees.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                          <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                            <div className="p-2 bg-emerald-500 rounded-lg">
                              <FileText className="h-4 w-4 text-white" />
                            </div>
                            Voitures Souhaitées
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {rv.voitures_souhaitees.map((voiture) => (
                              <span
                                key={voiture.id}
                                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white text-emerald-700 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                              >
                                {voiture.voitureModel?.model || 'Modèle non défini'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && selectedRendezVous && (
        <RapportRendezVousForm
          rendezVous={selectedRendezVous}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}