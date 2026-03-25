"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, FileText, User, Building2, Phone, Mail, RefreshCw, Plus, ChevronRight, Car, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
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
      const res = await fetch(`/api/rendez-vous?userId=${encodeURIComponent(user.id)}`);
      const result = await res.json();
      if (result.success) {
        // Filter only rendezvous with status EFFECTUE
        const data = (result.data || []) as RendezVous[];
        const effectueRendezVous = data.filter(rv => rv.statut === 'EFFECTUE');
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
    Com_Pres: boolean;
    Com_Drive: boolean;
    Com_Achat: boolean;
    Com_Livre: boolean;
    Com_APV: boolean;
    Com_Office: boolean;
    Com_Close: boolean;
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
    propositions_faites?: string;
    reference_offre?: string;
    financement_propose?: string;
    assurance_entretien: boolean;
    reprise_ancien_vehicule: boolean;
    suivi_actions?: string;
    actions_suivi: Array<{
      action: string;
      responsable: string;
      echeance: string;
      statut: string;
    }>;
    commentaire_global?: string;
  }) => {
    try {
      const res = await fetch('/api/rapport-rendez-vous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
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
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-indigo-50/30">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl" />
            <div className="relative size-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 ring-4 ring-indigo-500/10">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              Chargement des rendez-vous
            </h3>
            <p className="text-sm text-muted-foreground">
              Récupération de vos rendez-vous effectués...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden px-4 pb-8 pt-4 sm:px-6 sm:pb-6 sm:pt-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-6 border-b border-slate-200/50 bg-white/80 px-4 pb-4 pt-4 backdrop-blur-xl sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6 sm:pb-4">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/10 sm:size-14">
              <ClipboardList className="size-6 text-white sm:size-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
                Rapport Rendez-vous
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Gérez les rapports pour vos rendez-vous effectués
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <div className="min-w-[7rem] flex-1 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-center shadow-sm backdrop-blur-sm sm:min-w-0 sm:flex-initial sm:px-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Effectués</p>
              <p className="text-2xl font-bold text-indigo-600 tabular-nums">{rendezVous.length}</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              variant="outline"
              className="shrink-0 gap-2 border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-700"
            >
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
      {rendezVous.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 bg-white/60 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="flex flex-col items-center justify-center px-4 py-14 sm:px-6 sm:py-20">
            <div className="mb-6 rounded-2xl bg-slate-100 p-6 ring-4 ring-slate-200/50">
              <Calendar className="size-14 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Aucun rendez-vous effectué
            </h3>
            <p className="mt-3 max-w-md text-center text-muted-foreground leading-relaxed">
              Les rapports seront disponibles une fois vos rendez-vous marqués comme effectués dans le calendrier.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {rendezVous.map((rv) => {
            const clientInfo = getClientInfo(rv);
            const ClientIcon = clientInfo?.icon || User;
            const hasRapport = rv.rapportRendezVous && rv.rapportRendezVous.length > 0;

            return (
              <Card
                key={rv.id}
                className="group overflow-hidden border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-indigo-200/60"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Main content */}
                    <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3 sm:gap-4">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md ring-2 ring-emerald-500/20 sm:size-12">
                            <Calendar className="size-5 sm:size-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-lg">
                                {formatDate(rv.date)}
                              </h3>
                              <Badge variant="secondary" className="shrink-0 font-normal text-slate-600">
                                {formatTime(rv.date)}
                              </Badge>
                              <Badge className="shrink-0 bg-emerald-500/10 text-emerald-700 border-emerald-200/80 hover:bg-emerald-500/20">
                                Effectué
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                              Créé le {new Intl.DateTimeFormat('fr-FR').format(new Date(rv.createdAt))}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                          <Button
                            onClick={() => handleRapport(rv)}
                            disabled={hasRapport}
                            size="sm"
                            className="w-full gap-2 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
                          >
                            <FileText className="size-4 shrink-0" />
                            {hasRapport ? 'Rapport créé' : 'Générer rapport'}
                          </Button>
                          {hasRapport && (
                            <Button
                              onClick={() => handleRapport(rv)}
                              variant="outline"
                              size="sm"
                              className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 sm:w-auto"
                            >
                              <Plus className="size-4 shrink-0" />
                              Nouvelle visite
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2">
                        {/* Client info */}
                        <div className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors group-hover:bg-slate-50/80">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="rounded-lg bg-indigo-500 p-1.5">
                              <ClientIcon className="size-4 text-white" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {clientInfo?.type === 'CLIENT' ? 'Client' : 'Client entreprise'}
                            </span>
                          </div>
                          <p className="break-words font-semibold text-foreground">{clientInfo?.name}</p>
                          <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1">
                            <span className="flex min-w-0 items-center gap-1.5">
                              <Phone className="size-3.5 shrink-0" />
                              <span className="break-all">{clientInfo?.contact}</span>
                            </span>
                            {clientInfo?.email && (
                              <span className="flex min-w-0 items-start gap-1.5 sm:items-center">
                                <Mail className="size-3.5 shrink-0 pt-0.5 sm:pt-0" />
                                <span className="break-all">{clientInfo.email}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Voitures souhaitées */}
                        {rv.voitures_souhaitees && rv.voitures_souhaitees.length > 0 && (
                          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-colors group-hover:bg-slate-50/80">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="rounded-lg bg-emerald-500 p-1.5">
                                <Car className="size-4 text-white" />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Voitures souhaitées
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {rv.voitures_souhaitees.map((voiture) => (
                                <Badge key={voiture.id} variant="secondary" className="font-normal">
                                  {voiture.voitureModel?.model || 'Modèle non défini'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {(rv.resume_rendez_vous || rv.note) && (
                        <div className="mt-4 space-y-3">
                          {rv.resume_rendez_vous && (
                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/30 p-4">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Résumé</p>
                              <p className="text-sm text-foreground leading-relaxed">
                                {rv.resume_rendez_vous}
                              </p>
                            </div>
                          )}
                          {rv.note && (
                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
                              <p className="text-xs font-medium text-amber-700 mb-2">Notes</p>
                              <p className="text-sm text-foreground leading-relaxed">{rv.note}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action indicator */}
                    <div className="flex items-center border-t border-slate-200/80 bg-slate-50/30 px-4 py-3 sm:px-6 sm:py-4 lg:min-w-[160px] lg:justify-center lg:border-l lg:border-t-0">
                      <Button
                        onClick={() => handleRapport(rv)}
                        variant="ghost"
                        size="sm"
                        className="w-full gap-2 text-indigo-600 hover:bg-indigo-50 lg:w-auto font-medium"
                      >
                        <ChevronRight className="size-4" />
                        {hasRapport ? 'Nouvelle visite' : 'Remplir le rapport'}
                      </Button>
                    </div>
                  </div>
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