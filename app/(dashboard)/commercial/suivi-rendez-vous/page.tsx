"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  FileText, 
  User, 
  Phone, 
  RefreshCw, 
  Printer,
  Car,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  MapPin,
  Mail,
  Briefcase,
  Sparkles,
  Filter,
  X,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { getRapportRendezVousByUser } from '@/lib/actions/rendezvous';
import { TableauChuteRendezVousDialog } from '@/components/TableauChuteRendezVousDialog';
import { EditRapportRendezVousDialog } from '@/components/EditRapportRendezVousDialog';

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
  rendezVous?: {
    id: string;
    date: Date;
    statut: string;
  } | null;
  voiture?: {
    id: string;
    voitureModel?: {
      model: string;
    } | null;
  } | null;
}

export default function SuiviRendezVousPage() {
  const { user, isLoaded } = useUser();
  const [rapports, setRapports] = useState<RapportRendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dialogDisabled, setDialogDisabled] = useState(false);

  const fetchRapports = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await getRapportRendezVousByUser(user.id);
      if (result.success) {
        setRapports(result.data || []);
      } else {
        toast.error(result.error || 'Erreur lors du chargement des rapports');
      }
    } catch (error) {
      console.error('Error fetching rapports:', error);
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);


  useEffect(() => {
    if (isLoaded && user) {
      fetchRapports();
    }
  }, [isLoaded, user, fetchRapports]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRapports();
    setRefreshing(false);
  };

  const handlePrint = (rapport: RapportRendezVous) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rapport de Rendez-vous - ${rapport.nom_prenom_client}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section h3 { background: #f5f5f5; padding: 10px; margin: 0 0 15px 0; }
            .row { display: flex; margin-bottom: 10px; }
            .col { flex: 1; margin-right: 20px; }
            .label { font-weight: bold; }
            .checkbox { margin-right: 10px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FICHE DE RAPPORT DE RENDEZ-VOUS CLIENT</h1>
            <h2>KPANDJI AUTOMOBILES</h2>
          </div>
          
          <div class="section">
            <h3>1. Détails du rendez-vous</h3>
            <div class="row">
              <div class="col">
                <span class="label">Date:</span> ${new Date(rapport.date_rendez_vous).toLocaleDateString('fr-FR')}
              </div>
              <div class="col">
                <span class="label">Heure:</span> ${rapport.heure_rendez_vous}
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">Lieu:</span> ${rapport.lieu_rendez_vous} ${rapport.lieu_autre ? `(${rapport.lieu_autre})` : ''}
              </div>
              <div class="col">
                <span class="label">Durée:</span> ${rapport.duree_rendez_vous}
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">Conseiller commercial:</span> ${rapport.conseiller_commercial}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>2. Informations sur le client</h3>
            <div class="row">
              <div class="col">
                <span class="label">Nom et prénom:</span> ${rapport.nom_prenom_client}
              </div>
              <div class="col">
                <span class="label">Téléphone:</span> ${rapport.telephone_client}
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">Email:</span> ${rapport.email_client || 'Non renseigné'}
              </div>
              <div class="col">
                <span class="label">Type de client:</span> ${rapport.type_client}
              </div>
            </div>
            ${rapport.profession_societe ? `
            <div class="row">
              <div class="col">
                <span class="label">Profession/Société:</span> ${rapport.profession_societe}
              </div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>3. Objet du rendez-vous</h3>
            <div class="row">
              <div class="col">
                <span class="checkbox">${rapport.presentation_gamme ? '☑' : '☐'}</span> Présentation de la gamme
              </div>
              <div class="col">
                <span class="checkbox">${rapport.essai_vehicule ? '☑' : '☐'}</span> Essai du véhicule
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="checkbox">${rapport.negociation_commerciale ? '☑' : '☐'}</span> Négociation commerciale
              </div>
              <div class="col">
                <span class="checkbox">${rapport.livraison_vehicule ? '☑' : '☐'}</span> Livraison de véhicule
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="checkbox">${rapport.service_apres_vente ? '☑' : '☐'}</span> Service après-vente
              </div>
            </div>
            ${rapport.objet_autre ? `
            <div class="row">
              <div class="col">
                <span class="label">Autre:</span> ${rapport.objet_autre}
              </div>
            </div>
            ` : ''}
          </div>

          ${rapport.modeles_discutes && Array.isArray(rapport.modeles_discutes) && rapport.modeles_discutes.length > 0 ? `
          <div class="section">
            <h3>4. Modèles discutés</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Modèle</th>
                  <th>Motorisation</th>
                  <th>Transmission</th>
                  <th>Couleur</th>
                  <th>Observation</th>
                </tr>
              </thead>
              <tbody>
                ${(rapport.modeles_discutes as unknown[])?.map((modele: unknown) => `
                  <tr>
                    <td>${(modele as Record<string, unknown>).modele || ''}</td>
                    <td>${(modele as Record<string, unknown>).motorisation || ''}</td>
                    <td>${(modele as Record<string, unknown>).transmission || ''}</td>
                    <td>${(modele as Record<string, unknown>).couleur || ''}</td>
                    <td>${(modele as Record<string, unknown>).observation || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="section">
            <h3>5. Impressions et besoins du client</h3>
            ${rapport.motivations_achat ? `
            <div class="row">
              <div class="col">
                <span class="label">Motivations d'achat:</span><br>
                ${rapport.motivations_achat}
              </div>
            </div>
            ` : ''}
            ${rapport.points_positifs ? `
            <div class="row">
              <div class="col">
                <span class="label">Points positifs perçus:</span><br>
                ${rapport.points_positifs}
              </div>
            </div>
            ` : ''}
            ${rapport.objections_freins ? `
            <div class="row">
              <div class="col">
                <span class="label">Objections / freins:</span><br>
                ${rapport.objections_freins}
              </div>
            </div>
            ` : ''}
            <div class="row">
              <div class="col">
                <span class="label">Degré d'intérêt:</span> ${rapport.degre_interet || 'Non renseigné'}
              </div>
              <div class="col">
                <span class="label">Décision attendue:</span> ${rapport.decision_attendue || 'Non renseigné'}
              </div>
            </div>
          </div>

          <div class="section">
            <h3>6. Propositions faites</h3>
            <div class="row">
              <div class="col">
                <span class="checkbox">${rapport.devis_offre_remise ? '☑' : '☐'}</span> Devis / Offre remise
                ${rapport.reference_offre ? ` (Réf: ${rapport.reference_offre})` : ''}
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">Financement proposé:</span> ${rapport.financement_propose || 'Non renseigné'}
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="checkbox">${rapport.assurance_entretien ? '☑' : '☐'}</span> Assurance / entretien proposés
              </div>
              <div class="col">
                <span class="checkbox">${rapport.reprise_ancien_vehicule ? '☑' : '☐'}</span> Reprise d'ancien véhicule
              </div>
            </div>
          </div>

          ${rapport.actions_suivi && Array.isArray(rapport.actions_suivi) && rapport.actions_suivi.length > 0 ? `
          <div class="section">
            <h3>7. Suivi / Actions à entreprendre</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Action prévue</th>
                  <th>Responsable</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${(rapport.actions_suivi as unknown[])?.map((action: unknown) => `
                  <tr>
                    <td>${(action as Record<string, unknown>).action || ''}</td>
                    <td>${(action as Record<string, unknown>).responsable || ''}</td>
                    <td>${(action as Record<string, unknown>).echeance || ''}</td>
                    <td>${(action as Record<string, unknown>).statut || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${rapport.commentaire_global ? `
          <div class="section">
            <h3>8. Commentaire global du conseiller</h3>
            <div class="row">
              <div class="col">
                ${rapport.commentaire_global}
              </div>
            </div>
          </div>
          ` : ''}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getDegreInteretBadge = (degre: string | null) => {
    switch (degre) {
      case 'Fort':
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-md">Fort</Badge>;
      case 'Moyen':
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600 shadow-md">Moyen</Badge>;
      case 'Faible':
        return <Badge className="bg-red-500 text-white hover:bg-red-600 shadow-md">Faible</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300">Non renseigné</Badge>;
    }
  };

  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
      case 'Immédiate':
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-md">Immédiate</Badge>;
      case 'En réflexion':
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600 shadow-md">En réflexion</Badge>;
      case 'Après étude financement':
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600 shadow-md">Après étude financement</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300">Non renseigné</Badge>;
    }
  };

  const getCardBorderColor = (rapport: RapportRendezVous) => {
    const degreInteret = rapport.degre_interet;
    const decisionAttendue = rapport.decision_attendue;
    
    if (degreInteret === 'Fort' && decisionAttendue === 'Immédiate') {
      return 'border-l-[6px] border-l-emerald-500 shadow-emerald-100';
    }
    if (degreInteret === 'Fort' || decisionAttendue === 'Immédiate') {
      return 'border-l-[6px] border-l-amber-500 shadow-amber-100';
    }
    if (degreInteret === 'Moyen') {
      return 'border-l-[6px] border-l-blue-500 shadow-blue-100';
    }
    if (degreInteret === 'Faible') {
      return 'border-l-[6px] border-l-red-500 shadow-red-100';
    }
    return 'border-l-[6px] border-l-gray-300 shadow-gray-100';
  };

  const getPriorityBadge = (rapport: RapportRendezVous) => {
    const degreInteret = rapport.degre_interet;
    const decisionAttendue = rapport.decision_attendue;
    
    if (degreInteret === 'Fort' && decisionAttendue === 'Immédiate') {
      return <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg px-3 py-1 text-sm font-semibold">🔥 Priorité Haute</Badge>;
    }
    if (degreInteret === 'Fort' || decisionAttendue === 'Immédiate') {
      return <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg px-3 py-1 text-sm font-semibold">⚡ Priorité Moyenne-Haute</Badge>;
    }
    if (degreInteret === 'Moyen') {
      return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg px-3 py-1 text-sm font-semibold">📋 Priorité Moyenne</Badge>;
    }
    if (degreInteret === 'Faible') {
      return <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg px-3 py-1 text-sm font-semibold">📌 Priorité Faible</Badge>;
    }
    return <Badge variant="outline" className="border-gray-300 px-3 py-1 text-sm">À évaluer</Badge>;
  };

  // Calculate statistics
  const stats = {
    total: rapports.length,
    highPriority: rapports.filter(r => r.degre_interet === 'Fort' && r.decision_attendue === 'Immédiate').length,
    mediumHighPriority: rapports.filter(r => (r.degre_interet === 'Fort' || r.decision_attendue === 'Immédiate') && !(r.degre_interet === 'Fort' && r.decision_attendue === 'Immédiate')).length,
    mediumPriority: rapports.filter(r => r.degre_interet === 'Moyen').length,
    lowPriority: rapports.filter(r => r.degre_interet === 'Faible').length,
    recent: rapports.filter(r => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(r.createdAt) >= oneWeekAgo;
    }).length
  };

  // Filter and sort rapports
  const filteredAndSortedRapports = [...rapports]
    .filter(rapport => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          rapport.nom_prenom_client.toLowerCase().includes(searchLower) ||
          rapport.telephone_client.includes(searchTerm) ||
          (rapport.email_client && rapport.email_client.toLowerCase().includes(searchLower)) ||
          (rapport.profession_societe && rapport.profession_societe.toLowerCase().includes(searchLower))
        );
      }
      
      if (priorityFilter !== 'all') {
        const degreInteret = rapport.degre_interet;
        const decisionAttendue = rapport.decision_attendue;
        
        switch (priorityFilter) {
          case 'high':
            return degreInteret === 'Fort' && decisionAttendue === 'Immédiate';
          case 'medium-high':
            return (degreInteret === 'Fort' || decisionAttendue === 'Immédiate') && !(degreInteret === 'Fort' && decisionAttendue === 'Immédiate');
          case 'medium':
            return degreInteret === 'Moyen';
          case 'low':
            return degreInteret === 'Faible';
          case 'recent':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return new Date(rapport.createdAt) >= oneWeekAgo;
          default:
            return true;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      const getPriorityScore = (rapport: RapportRendezVous) => {
        const degreInteret = rapport.degre_interet;
        const decisionAttendue = rapport.decision_attendue;
        
        if (degreInteret === 'Fort' && decisionAttendue === 'Immédiate') return 4;
        if (degreInteret === 'Fort' || decisionAttendue === 'Immédiate') return 3;
        if (degreInteret === 'Moyen') return 2;
        if (degreInteret === 'Faible') return 1;
        return 0;
      };
      
      const scoreA = getPriorityScore(a);
      const scoreB = getPriorityScore(b);
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-gray-700">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                    <BarChart3 className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                      Suivi des Rendez-vous
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl mt-1 font-medium">Tableau de bord des rapports clients</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleRefresh} 
                  disabled={refreshing} 
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/30 shadow-lg h-12 px-6 font-semibold transition-all duration-300"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Total Rapports</p>
                  <p className="text-4xl font-bold text-emerald-900">{stats.total}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 hover:border-red-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Priorité Haute</p>
                  <p className="text-4xl font-bold text-red-900">{stats.highPriority}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-200 hover:border-amber-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Moyenne-Haute</p>
                  <p className="text-4xl font-bold text-amber-900">{stats.mediumHighPriority}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-100 border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Priorité Moyenne</p>
                  <p className="text-4xl font-bold text-blue-900">{stats.mediumPriority}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Récents (7j)</p>
                  <p className="text-4xl font-bold text-purple-900">{stats.recent}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filter Section */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2 border-gray-200 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Rechercher par nom, téléphone, email, profession..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all duration-200"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mr-2">
                  <Filter className="h-4 w-4" />
                  Filtres:
                </div>
                <Button
                  variant={priorityFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('all')}
                  className={`h-12 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    priorityFilter === 'all' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                      : 'border-2 hover:border-blue-300'
                  }`}
                >
                  Tous ({stats.total})
                </Button>
                <Button
                  variant={priorityFilter === 'high' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('high')}
                  className={`h-12 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    priorityFilter === 'high' 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl' 
                      : 'border-2 hover:border-red-300'
                  }`}
                >
                  🔥 Haute ({stats.highPriority})
                </Button>
                <Button
                  variant={priorityFilter === 'medium-high' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('medium-high')}
                  className={`h-12 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    priorityFilter === 'medium-high' 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl' 
                      : 'border-2 hover:border-amber-300'
                  }`}
                >
                  ⚡ Moyenne-Haute ({stats.mediumHighPriority})
                </Button>
                <Button
                  variant={priorityFilter === 'medium' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('medium')}
                  className={`h-12 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    priorityFilter === 'medium' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl' 
                      : 'border-2 hover:border-blue-300'
                  }`}
                >
                  📋 Moyenne ({stats.mediumPriority})
                </Button>
                <Button
                  variant={priorityFilter === 'recent' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('recent')}
                  className={`h-12 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    priorityFilter === 'recent' 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
                      : 'border-2 hover:border-purple-300'
                  }`}
                >
                  ✨ Récents ({stats.recent})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Rapports de Rendez-vous
            </h2>
            <div className="text-sm font-semibold text-gray-600 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-md border border-gray-200">
              {filteredAndSortedRapports.length} rapport(s) affiché(s)
            </div>
          </div>

          {filteredAndSortedRapports.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-2 border-gray-200 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6 shadow-lg">
                  <FileText className="h-20 w-20 text-gray-400" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">Aucun rapport trouvé</h3>
                <p className="text-gray-600 text-center text-lg max-w-md mb-6">
                  {searchTerm || priorityFilter !== 'all' 
                    ? "Aucun rapport ne correspond à vos critères de recherche."
                    : "Vous n'avez pas encore créé de rapports de rendez-vous."
                  }
                </p>
                {(searchTerm || priorityFilter !== 'all') && (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setPriorityFilter('all');
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg h-12 px-8 rounded-xl font-semibold"
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredAndSortedRapports.map((rapport) => (
                <Card 
                  key={rapport.id} 
                  className={`bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${getCardBorderColor(rapport)} rounded-2xl overflow-hidden`}
                >
                  <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                          <FileText className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                              {rapport.nom_prenom_client}
                            </CardTitle>
                            {getPriorityBadge(rapport)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{new Date(rapport.date_rendez_vous).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                              <Clock className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{rapport.heure_rendez_vous}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
                              <User className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{rapport.conseiller_commercial}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg">
                              <Phone className="h-4 w-4 text-amber-600" />
                              <span className="font-medium">{rapport.telephone_client}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-3 font-medium">
                            Créé le {new Date(rapport.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handlePrint(rapport)}
                          variant="outline"
                          className="border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 h-11 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimer
                        </Button>

                        <EditRapportRendezVousDialog
                          rapport={rapport}
                          onSuccess={() => {
                            handleRefresh();
                          }}
                          trigger={
                            <Button
                              variant="outline"
                              className="border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 h-11 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                          }
                        />
                        
                        <TableauChuteRendezVousDialog
                          rapport={rapport}
                          onSuccess={() => {
                            handleRefresh();
                            setDialogDisabled(true);
                          }}
                          disabled={dialogDisabled}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-5">
                    {/* 1. Détails du rendez-vous */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-100 shadow-sm">
                      <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        1. Détails du rendez-vous
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Date:</span>
                          <span className="text-gray-600">{new Date(rapport.date_rendez_vous).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Heure:</span>
                          <span className="text-gray-600">{rapport.heure_rendez_vous}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-700">Lieu:</span>
                          <span className="text-gray-600">{rapport.lieu_rendez_vous} {rapport.lieu_autre && `(${rapport.lieu_autre})`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-700">Durée:</span>
                          <span className="text-gray-600">{rapport.duree_rendez_vous}</span>
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-700">Conseiller:</span>
                          <span className="text-gray-600">{rapport.conseiller_commercial}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Informations sur le client */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-5 rounded-xl border border-emerald-100 shadow-sm">
                      <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        2. Informations sur le client
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Nom:</span>
                          <span className="text-gray-600">{rapport.nom_prenom_client}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-700">Téléphone:</span>
                          <span className="text-gray-600">{rapport.telephone_client}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-700">Email:</span>
                          <span className="text-gray-600">{rapport.email_client || 'Non renseigné'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">Type:</span>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{rapport.type_client}</Badge>
                        </div>
                        {rapport.profession_societe && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <Briefcase className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold text-gray-700">Profession/Société:</span>
                            <span className="text-gray-600">{rapport.profession_societe}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Objet du rendez-vous */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100 shadow-sm">
                      <h3 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                        <Car className="h-5 w-5" />
                        3. Objet du rendez-vous
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {rapport.presentation_gamme && <Badge className="bg-purple-500 text-white hover:bg-purple-600 shadow-md">Présentation gamme</Badge>}
                        {rapport.essai_vehicule && <Badge className="bg-pink-500 text-white hover:bg-pink-600 shadow-md">Essai véhicule</Badge>}
                        {rapport.negociation_commerciale && <Badge className="bg-indigo-500 text-white hover:bg-indigo-600 shadow-md">Négociation</Badge>}
                        {rapport.livraison_vehicule && <Badge className="bg-violet-500 text-white hover:bg-violet-600 shadow-md">Livraison</Badge>}
                        {rapport.service_apres_vente && <Badge className="bg-rose-500 text-white hover:bg-rose-600 shadow-md">SAV</Badge>}
                        {rapport.objet_autre && <Badge variant="outline" className="border-purple-300 text-purple-700">Autre: {rapport.objet_autre}</Badge>}
                      </div>
                    </div>

                    {/* 4. Modèles discutés */}
                    {(rapport.modeles_discutes as unknown[])?.length > 0 && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100 shadow-sm">
                        <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-lg">
                          <Car className="h-5 w-5" />
                          4. Modèles discutés
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-amber-200">
                                <th className="text-left p-3 font-semibold text-amber-900">Modèle</th>
                                <th className="text-left p-3 font-semibold text-amber-900">Motorisation</th>
                                <th className="text-left p-3 font-semibold text-amber-900">Transmission</th>
                                <th className="text-left p-3 font-semibold text-amber-900">Couleur</th>
                                <th className="text-left p-3 font-semibold text-amber-900">Observation</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(rapport.modeles_discutes as unknown[])?.map((modele: unknown, idx: number) => (
                                <tr key={idx} className="border-b border-amber-100 hover:bg-amber-50/50 transition-colors">
                                  <td className="p-3 font-medium">{(modele as Record<string, unknown>).modele as string || ''}</td>
                                  <td className="p-3">{(modele as Record<string, unknown>).motorisation as string || ''}</td>
                                  <td className="p-3">{(modele as Record<string, unknown>).transmission as string || ''}</td>
                                  <td className="p-3">{(modele as Record<string, unknown>).couleur as string || ''}</td>
                                  <td className="p-3 text-gray-600">{(modele as Record<string, unknown>).observation as string || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 5. Impressions et besoins du client */}
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-5 rounded-xl border border-cyan-100 shadow-sm">
                      <h3 className="font-bold text-cyan-900 mb-4 flex items-center gap-2 text-lg">
                        <User className="h-5 w-5" />
                        5. Impressions et besoins du client
                      </h3>
                      <div className="space-y-4 text-sm">
                        {rapport.motivations_achat && (
                          <div className="bg-white/60 p-4 rounded-lg border border-cyan-200">
                            <strong className="text-gray-700 block mb-2">Motivations d&apos;achat:</strong>
                            <p className="text-gray-700 leading-relaxed">{rapport.motivations_achat}</p>
                          </div>
                        )}
                        {rapport.points_positifs && (
                          <div className="bg-white/60 p-4 rounded-lg border border-cyan-200">
                            <strong className="text-gray-700 block mb-2">Points positifs:</strong>
                            <p className="text-gray-700 leading-relaxed">{rapport.points_positifs}</p>
                          </div>
                        )}
                        {rapport.objections_freins && (
                          <div className="bg-white/60 p-4 rounded-lg border border-cyan-200">
                            <strong className="text-gray-700 block mb-2">Objections/Freins:</strong>
                            <p className="text-gray-700 leading-relaxed">{rapport.objections_freins}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-lg border border-cyan-200">
                            <strong className="text-gray-700">Intérêt:</strong>
                            {getDegreInteretBadge(rapport.degre_interet ?? null)}
                          </div>
                          <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-lg border border-cyan-200">
                            <strong className="text-gray-700">Décision:</strong>
                            {getDecisionBadge(rapport.decision_attendue ?? null)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 6. Propositions faites */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100 shadow-sm">
                      <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        6. Propositions faites
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-emerald-200">
                          <span className={`text-lg ${rapport.devis_offre_remise ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {rapport.devis_offre_remise ? '☑' : '☐'}
                          </span>
                          <span className="font-medium text-gray-700">Devis/Offre remise {rapport.reference_offre && <span className="text-emerald-600">(Réf: {rapport.reference_offre})</span>}</span>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg border border-emerald-200">
                          <strong className="text-gray-700">Financement proposé:</strong> 
                          <span className="ml-2 text-gray-600">{rapport.financement_propose || 'Non renseigné'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-emerald-200">
                            <span className={`text-lg ${rapport.assurance_entretien ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {rapport.assurance_entretien ? '☑' : '☐'}
                            </span>
                            <span className="font-medium text-gray-700">Assurance/Entretien</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white/60 p-3 rounded-lg border border-emerald-200">
                            <span className={`text-lg ${rapport.reprise_ancien_vehicule ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {rapport.reprise_ancien_vehicule ? '☑' : '☐'}
                            </span>
                            <span className="font-medium text-gray-700">Reprise ancien véhicule</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 7. Actions de suivi */}
                    {(rapport.actions_suivi as unknown[])?.length > 0 && (
                      <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-100 shadow-sm">
                        <h3 className="font-bold text-violet-900 mb-4 flex items-center gap-2 text-lg">
                          <Phone className="h-5 w-5" />
                          7. Actions de suivi
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-violet-200">
                                <th className="text-left p-3 font-semibold text-violet-900">Action</th>
                                <th className="text-left p-3 font-semibold text-violet-900">Responsable</th>
                                <th className="text-left p-3 font-semibold text-violet-900">Échéance</th>
                                <th className="text-left p-3 font-semibold text-violet-900">Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(rapport.actions_suivi as unknown[])?.map((action: unknown, idx: number) => (
                                <tr key={idx} className="border-b border-violet-100 hover:bg-violet-50/50 transition-colors">
                                  <td className="p-3 font-medium">{(action as Record<string, unknown>).action as string || ''}</td>
                                  <td className="p-3">{(action as Record<string, unknown>).responsable as string || ''}</td>
                                  <td className="p-3">{(action as Record<string, unknown>).echeance as string || ''}</td>
                                  <td className="p-3">
                                    <Badge variant="secondary" className="bg-violet-100 text-violet-800">
                                      {(action as Record<string, unknown>).statut as string || ''}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* 8. Commentaire global */}
                    {rapport.commentaire_global && (
                      <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-5 rounded-xl border border-rose-100 shadow-sm">
                        <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5" />
                          8. Commentaire global du conseiller
                        </h3>
                        <div className="bg-white/60 p-4 rounded-lg border border-rose-200">
                          <p className="text-sm text-gray-700 leading-relaxed">{rapport.commentaire_global}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
