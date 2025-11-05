"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  RefreshCw,
  Eye,
  Clock,
  MapPin,
  Briefcase,
  TrendingUp,
  Users,
  Building2,
  UserCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getAllRapportRendezVous } from '@/lib/actions/rendezvous';

interface RapportRendezVous {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  date_rendez_vous: Date;
  heure_rendez_vous: string;
  lieu_rendez_vous: string;
  lieu_autre?: string | null;
  conseiller_commercial: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client?: string | null;
  profession_societe?: string | null;
  type_client: string;
  presentation_gamme: boolean;
  essai_vehicule: boolean;
  negociation_commerciale: boolean;
  livraison_vehicule: boolean;
  service_apres_vente: boolean;
  objet_autre?: string | null;
  modeles_discutes?: unknown;
  motivations_achat?: string | null;
  points_positifs?: string | null;
  objections_freins?: string | null;
  degre_interet?: string | null;
  decision_attendue?: string | null;
  devis_offre_remise: boolean;
  reference_offre?: string | null;
  financement_propose?: string | null;
  assurance_entretien: boolean;
  reprise_ancien_vehicule: boolean;
  actions_suivi?: unknown;
  commentaire_global?: string | null;
  client?: {
    id: string;
    nom: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
  clientEntreprise?: {
    id: string;
    nom_entreprise: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
  rendezVous?: {
    id: string;
    date: Date;
    statut: string;
  } | null;
}

type ModeleDiscute = {
  modele?: string;
  couleur?: string;
  motorisation?: string;
  transmission?: string;
  observation?: string;
};

type ActionSuivi = {
  action?: string;
  statut?: string;
  echeance?: string;
  responsable?: string;
};

type GroupedRapport = {
  userId: string;
  userName: string;
  userEmail: string;
  rapports: RapportRendezVous[];
};

export default function SuiviRendezVousPage() {
  const [groupedRapports, setGroupedRapports] = useState<GroupedRapport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<RapportRendezVous | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const groupRapportsByUser = useCallback((rapportsData: RapportRendezVous[]) => {
    const grouped = new Map<string, GroupedRapport>();

    rapportsData.forEach((rapport) => {
      let userId: string;
      let userName: string;
      let userEmail: string;

      if (rapport.client?.user) {
        userId = rapport.client.user.id;
        userName = `${rapport.client.user.firstName} ${rapport.client.user.lastName}`;
        userEmail = rapport.client.user.email;
      } else if (rapport.clientEntreprise?.user) {
        userId = rapport.clientEntreprise.user.id;
        userName = `${rapport.clientEntreprise.user.firstName} ${rapport.clientEntreprise.user.lastName}`;
        userEmail = rapport.clientEntreprise.user.email;
      } else {
        userId = 'unknown';
        userName = rapport.conseiller_commercial;
        userEmail = '';
      }

      if (!grouped.has(userId)) {
        grouped.set(userId, {
          userId,
          userName,
          userEmail,
          rapports: [],
        });
      }

      grouped.get(userId)!.rapports.push(rapport);
    });

    grouped.forEach((group) => {
      group.rapports.sort((a, b) => {
        return new Date(b.date_rendez_vous).getTime() - new Date(a.date_rendez_vous).getTime();
      });
    });

    const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
      const nameCompare = a.userName.localeCompare(b.userName);
      if (nameCompare !== 0) return nameCompare;
      
      const aRecent = a.rapports[0]?.date_rendez_vous || new Date(0);
      const bRecent = b.rapports[0]?.date_rendez_vous || new Date(0);
      return new Date(bRecent).getTime() - new Date(aRecent).getTime();
    });

    setGroupedRapports(sortedGroups);
  }, []);

  const fetchRapports = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await getAllRapportRendezVous();
      if (result.success && result.data) {
        groupRapportsByUser(result.data);
      } else {
        toast.error(result.error || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching rapports:', error);
      toast.error('Failed to fetch appointment reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupRapportsByUser]);

  useEffect(() => {
    fetchRapports();
  }, [fetchRapports]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalRapports = groupedRapports.reduce((sum, group) => sum + group.rapports.length, 0);
  const totalUsers = groupedRapports.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Suivi des Rendez-vous
              </h1>
              <p className="text-muted-foreground text-lg">
                Vue d&apos;ensemble de tous les rapports de rendez-vous par utilisateur
              </p>
            </div>
            <Button
              onClick={fetchRapports}
              disabled={refreshing}
              variant="outline"
              size="lg"
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              <RefreshCw
                className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              Actualiser
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total des Rapports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{totalRapports}</div>
                <p className="text-xs text-blue-600/70 mt-1">rapports enregistrés</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-indigo-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">{totalUsers}</div>
                <p className="text-xs text-indigo-600/70 mt-1">utilisateurs actifs</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Activité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {groupedRapports.length > 0 
                    ? Math.round(totalRapports / totalUsers) 
                    : 0}
                </div>
                <p className="text-xs text-green-600/70 mt-1">rapports par utilisateur</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rapports by User */}
        {groupedRapports.length === 0 ? (
          <Card className="border-2 shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
                <FileText className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                Aucun rapport trouvé
              </h3>
              <p className="text-muted-foreground">
                Il n&apos;y a pas encore de rapports de rendez-vous dans le système.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedRapports.map((group) => (
              <Card 
                key={group.userId} 
                className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white"
              >
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b-2 border-slate-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <UserCircle className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          {group.userName}
                        </CardTitle>
                        {group.userEmail && (
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{group.userEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="text-base px-4 py-2 bg-blue-100 text-blue-700 font-semibold"
                    >
                      {group.rapports.length} rapport{group.rapports.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                          <TableHead className="font-semibold text-slate-700">Date</TableHead>
                          <TableHead className="font-semibold text-slate-700">Client</TableHead>
                          <TableHead className="font-semibold text-slate-700">Téléphone</TableHead>
                          <TableHead className="font-semibold text-slate-700">Email</TableHead>
                          <TableHead className="font-semibold text-slate-700">Type</TableHead>
                          <TableHead className="font-semibold text-slate-700">Conseiller</TableHead>
                          <TableHead className="font-semibold text-slate-700">Créé le</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.rapports.map((rapport) => (
                          <TableRow 
                            key={rapport.id}
                            className="hover:bg-blue-50/30 transition-colors border-b border-slate-100"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span>{formatDate(rapport.date_rendez_vous)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {rapport.client ? (
                                  <User className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Building2 className="h-4 w-4 text-purple-500" />
                                )}
                                <span className="font-medium">
                                  {rapport.client?.nom || rapport.clientEntreprise?.nom_entreprise || rapport.nom_prenom_client}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span>{rapport.telephone_client}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {rapport.email_client ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-blue-400" />
                                  <span className="text-sm">{rapport.email_client}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  rapport.type_client === 'Particulier' 
                                    ? 'border-blue-300 text-blue-700 bg-blue-50' 
                                    : rapport.type_client === 'Professionnel'
                                    ? 'border-purple-300 text-purple-700 bg-purple-50'
                                    : 'border-orange-300 text-orange-700 bg-orange-50'
                                }
                              >
                                {rapport.type_client}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-indigo-400" />
                                <span className="text-sm">{rapport.conseiller_commercial}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(rapport.createdAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRapport(rapport);
                                  setIsDialogOpen(true);
                                }}
                                className="hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                Détails du Rapport de Rendez-vous
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                Informations complètes et détaillées sur le rendez-vous
              </DialogDescription>
            </DialogHeader>

            {selectedRapport && (
              <div className="space-y-6 pt-4">
                {/* Détails du rendez-vous */}
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/30">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Détails du rendez-vous
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-700 uppercase">Date</p>
                        <p className="text-sm font-medium">{formatDate(selectedRapport.date_rendez_vous)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-700 uppercase">Heure</p>
                        <p className="text-sm font-medium">{selectedRapport.heure_rendez_vous}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-700 uppercase">Durée</p>
                        <p className="text-sm font-medium">{selectedRapport.duree_rendez_vous}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-xs font-semibold text-blue-700 uppercase">Lieu</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <p className="text-sm font-medium">
                            {selectedRapport.lieu_rendez_vous} {selectedRapport.lieu_autre && `(${selectedRapport.lieu_autre})`}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-blue-700 uppercase">Conseiller</p>
                        <p className="text-sm font-medium">{selectedRapport.conseiller_commercial}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informations sur le client */}
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/30">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-green-900 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informations sur le client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-green-700 uppercase">Nom complet</p>
                        <p className="text-sm font-medium">{selectedRapport.nom_prenom_client}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-green-700 uppercase">Type de client</p>
                        <Badge variant="outline" className="mt-1">
                          {selectedRapport.type_client}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-green-700 uppercase">Téléphone</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <p className="text-sm font-medium">{selectedRapport.telephone_client}</p>
                        </div>
                      </div>
                      {selectedRapport.email_client && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-green-700 uppercase">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-green-500" />
                            <p className="text-sm font-medium">{selectedRapport.email_client}</p>
                          </div>
                        </div>
                      )}
                      {selectedRapport.profession_societe && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-semibold text-green-700 uppercase">Profession / Société</p>
                          <p className="text-sm font-medium">{selectedRapport.profession_societe}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Objet du rendez-vous */}
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/30">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-purple-900">
                      Objet du rendez-vous
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedRapport.presentation_gamme && (
                        <Badge variant="outline" className="bg-purple-100 border-purple-300 text-purple-700">
                          Présentation gamme
                        </Badge>
                      )}
                      {selectedRapport.essai_vehicule && (
                        <Badge variant="outline" className="bg-purple-100 border-purple-300 text-purple-700">
                          Essai véhicule
                        </Badge>
                      )}
                      {selectedRapport.negociation_commerciale && (
                        <Badge variant="outline" className="bg-purple-100 border-purple-300 text-purple-700">
                          Négociation commerciale
                        </Badge>
                      )}
                      {selectedRapport.livraison_vehicule && (
                        <Badge variant="outline" className="bg-purple-100 border-purple-300 text-purple-700">
                          Livraison véhicule
                        </Badge>
                      )}
                      {selectedRapport.service_apres_vente && (
                        <Badge variant="outline" className="bg-purple-100 border-purple-300 text-purple-700">
                          Service après-vente
                        </Badge>
                      )}
                      {selectedRapport.objet_autre && (
                        <Badge variant="outline" className="bg-purple-100 border-purple-300 text-purple-700">
                          Autre: {selectedRapport.objet_autre}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Modèles discutés */}
                {selectedRapport.modeles_discutes != null && (
                  <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-orange-900">
                        Modèles discutés
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(selectedRapport.modeles_discutes) && selectedRapport.modeles_discutes.length > 0 ? (
                        <div className="space-y-4">
                          {(selectedRapport.modeles_discutes as ModeleDiscute[]).map((modele, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                              <div className="grid md:grid-cols-2 gap-4">
                                {modele.modele && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-orange-700 uppercase">Modèle</p>
                                    <p className="text-sm font-medium">{modele.modele}</p>
                                  </div>
                                )}
                                {modele.couleur && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-orange-700 uppercase">Couleur</p>
                                    <p className="text-sm font-medium">{modele.couleur}</p>
                                  </div>
                                )}
                                {modele.motorisation && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-orange-700 uppercase">Motorisation</p>
                                    <p className="text-sm font-medium">{modele.motorisation}</p>
                                  </div>
                                )}
                                {modele.transmission && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-orange-700 uppercase">Transmission</p>
                                    <p className="text-sm font-medium">{modele.transmission}</p>
                                  </div>
                                )}
                                {modele.observation && (
                                  <div className="space-y-1 md:col-span-2">
                                    <p className="text-xs font-semibold text-orange-700 uppercase">Observation</p>
                                    <p className="text-sm font-medium">{modele.observation}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm">Aucun modèle discuté</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Impressions et besoins */}
                {(selectedRapport.motivations_achat || selectedRapport.points_positifs || selectedRapport.objections_freins) && (
                  <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-yellow-900">
                        Impressions et besoins du client
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedRapport.motivations_achat && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-yellow-700 uppercase">Motivations d&apos;achat</p>
                            <p className="text-sm">{selectedRapport.motivations_achat}</p>
                          </div>
                        )}
                        {selectedRapport.points_positifs && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-yellow-700 uppercase">Points positifs</p>
                            <p className="text-sm">{selectedRapport.points_positifs}</p>
                          </div>
                        )}
                        {selectedRapport.objections_freins && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-yellow-700 uppercase">Objections / Freins</p>
                            <p className="text-sm">{selectedRapport.objections_freins}</p>
                          </div>
                        )}
                        {selectedRapport.degre_interet && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-yellow-700 uppercase">Degré d&apos;intérêt</p>
                            <Badge variant="outline" className="mt-1">{selectedRapport.degre_interet}</Badge>
                          </div>
                        )}
                        {selectedRapport.decision_attendue && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-yellow-700 uppercase">Décision attendue</p>
                            <p className="text-sm">{selectedRapport.decision_attendue}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Propositions */}
                {(selectedRapport.devis_offre_remise || selectedRapport.reference_offre || selectedRapport.financement_propose) && (
                  <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-indigo-900">
                        Propositions faites
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedRapport.devis_offre_remise && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Devis/Offre/Remise</span>
                          </div>
                        )}
                        {selectedRapport.reference_offre && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-700 uppercase">Référence offre</p>
                            <p className="text-sm font-medium">{selectedRapport.reference_offre}</p>
                          </div>
                        )}
                        {selectedRapport.financement_propose && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-700 uppercase">Financement proposé</p>
                            <p className="text-sm font-medium">{selectedRapport.financement_propose}</p>
                          </div>
                        )}
                        {selectedRapport.assurance_entretien && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Assurance/Entretien</span>
                          </div>
                        )}
                        {selectedRapport.reprise_ancien_vehicule && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Reprise ancien véhicule</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions de suivi */}
                {selectedRapport.actions_suivi != null && (
                  <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-pink-900">
                        Actions de suivi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Array.isArray(selectedRapport.actions_suivi) && selectedRapport.actions_suivi.length > 0 ? (
                        <div className="space-y-4">
                          {(selectedRapport.actions_suivi as ActionSuivi[]).map((action, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border-2 border-pink-200 shadow-sm">
                              <div className="grid md:grid-cols-2 gap-4">
                                {action.action && (
                                  <div className="space-y-1 md:col-span-2">
                                    <p className="text-xs font-semibold text-pink-700 uppercase">Action</p>
                                    <p className="text-sm font-medium">{action.action}</p>
                                  </div>
                                )}
                                {action.responsable && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-pink-700 uppercase">Responsable</p>
                                    <p className="text-sm font-medium">{action.responsable}</p>
                                  </div>
                                )}
                                {action.echeance && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold text-pink-700 uppercase">Échéance</p>
                                    <p className="text-sm font-medium">{new Date(action.echeance).toLocaleDateString('fr-FR')}</p>
                                  </div>
                                )}
                                {action.statut && (
                                  <div className="space-y-1 md:col-span-2">
                                    <p className="text-xs font-semibold text-pink-700 uppercase">Statut</p>
                                    <div className="mt-1">
                                      <Badge 
                                        variant={
                                          action.statut.toLowerCase() === 'terminé' || action.statut.toLowerCase() === 'terminée' 
                                            ? 'default' 
                                            : action.statut.toLowerCase() === 'en cours'
                                            ? 'secondary'
                                            : 'outline'
                                        }
                                        className="text-xs px-3 py-1"
                                      >
                                        {action.statut}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm">Aucune action de suivi</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Commentaire global */}
                {selectedRapport.commentaire_global && (
                  <Card className="border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/30">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Commentaire global
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{selectedRapport.commentaire_global}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Métadonnées */}
                <Card className="border-2 border-slate-300 bg-slate-50">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Créé le</p>
                          <p className="text-sm font-medium">{formatDateTime(selectedRapport.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">Modifié le</p>
                          <p className="text-sm font-medium">{formatDateTime(selectedRapport.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
