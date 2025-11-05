"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
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
} from 'lucide-react';
import { toast } from 'sonner';
import { getRapportRendezVousByUser } from '@/lib/actions/rendezvous';
import { TableauChuteRendezVousDialog } from '@/components/TableauChuteRendezVousDialog';

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
        return <Badge className="bg-green-100 text-green-800">Fort</Badge>;
      case 'Moyen':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyen</Badge>;
      case 'Faible':
        return <Badge className="bg-red-100 text-red-800">Faible</Badge>;
      default:
        return <Badge variant="outline">Non renseigné</Badge>;
    }
  };

  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
      case 'Immédiate':
        return <Badge className="bg-green-100 text-green-800">Immédiate</Badge>;
      case 'En réflexion':
        return <Badge className="bg-yellow-100 text-yellow-800">En réflexion</Badge>;
      case 'Après étude financement':
        return <Badge className="bg-blue-100 text-blue-800">Après étude financement</Badge>;
      default:
        return <Badge variant="outline">Non renseigné</Badge>;
    }
  };

  const getCardBorderColor = (rapport: RapportRendezVous) => {
    const degreInteret = rapport.degre_interet;
    const decisionAttendue = rapport.decision_attendue;
    
    // High priority: Fort interest + Immédiate decision
    if (degreInteret === 'Fort' && decisionAttendue === 'Immédiate') {
      return 'border-l-4 border-l-green-500';
    }
    // Medium-high priority: Fort interest OR Immédiate decision
    if (degreInteret === 'Fort' || decisionAttendue === 'Immédiate') {
      return 'border-l-4 border-l-yellow-500';
    }
    // Medium priority: Moyen interest
    if (degreInteret === 'Moyen') {
      return 'border-l-4 border-l-blue-500';
    }
    // Low priority: Faible interest or no data
    if (degreInteret === 'Faible') {
      return 'border-l-4 border-l-red-500';
    }
    // Default: no special border
    return 'border-l-4 border-l-gray-300';
  };

  const getPriorityBadge = (rapport: RapportRendezVous) => {
    const degreInteret = rapport.degre_interet;
    const decisionAttendue = rapport.decision_attendue;
    
    if (degreInteret === 'Fort' && decisionAttendue === 'Immédiate') {
      return <Badge className="bg-green-500 text-white">Priorité Haute</Badge>;
    }
    if (degreInteret === 'Fort' || decisionAttendue === 'Immédiate') {
      return <Badge className="bg-yellow-500 text-white">Priorité Moyenne-Haute</Badge>;
    }
    if (degreInteret === 'Moyen') {
      return <Badge className="bg-blue-500 text-white">Priorité Moyenne</Badge>;
    }
    if (degreInteret === 'Faible') {
      return <Badge className="bg-red-500 text-white">Priorité Faible</Badge>;
    }
    return <Badge variant="outline">À évaluer</Badge>;
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
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          rapport.nom_prenom_client.toLowerCase().includes(searchLower) ||
          rapport.telephone_client.includes(searchTerm) ||
          (rapport.email_client && rapport.email_client.toLowerCase().includes(searchLower)) ||
          (rapport.profession_societe && rapport.profession_societe.toLowerCase().includes(searchLower))
        );
      }
      
      // Priority filter
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
        return scoreB - scoreA; // Higher priority first
      }
      
      // If same priority, sort by date (most recent first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Chargement des rapports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Suivi des Rendez-vous
                  </h1>
                  <p className="text-gray-600 text-lg">Tableau de bord des rapports clients</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing} 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Rapports</p>
                  <p className="text-3xl font-bold text-green-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-green-500 rounded-full">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Priorité Haute</p>
                  <p className="text-3xl font-bold text-red-900">{stats.highPriority}</p>
                </div>
                <div className="p-3 bg-red-500 rounded-full">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Priorité Moyenne-Haute</p>
                  <p className="text-3xl font-bold text-yellow-900">{stats.mediumHighPriority}</p>
                </div>
                <div className="p-3 bg-yellow-500 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Priorité Moyenne</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.mediumPriority}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Récents (7j)</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.recent}</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-full">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card className="bg-white shadow-lg border border-gray-100">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom, téléphone, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={priorityFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('all')}
                  className="h-12 px-6"
                >
                  Tous ({stats.total})
                </Button>
                <Button
                  variant={priorityFilter === 'high' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('high')}
                  className="h-12 px-6 bg-red-500 hover:bg-red-600 text-white"
                >
                  Haute ({stats.highPriority})
                </Button>
                <Button
                  variant={priorityFilter === 'medium-high' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('medium-high')}
                  className="h-12 px-6 bg-yellow-500 hover:bg-yellow-600 text-white"
                >
                  Moyenne-Haute ({stats.mediumHighPriority})
                </Button>
                <Button
                  variant={priorityFilter === 'medium' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('medium')}
                  className="h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Moyenne ({stats.mediumPriority})
                </Button>
                <Button
                  variant={priorityFilter === 'recent' ? 'default' : 'outline'}
                  onClick={() => setPriorityFilter('recent')}
                  className="h-12 px-6 bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Récents ({stats.recent})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Rapports de Rendez-vous
            </h2>
            <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              {filteredAndSortedRapports.length} rapport(s) affiché(s)
            </div>
          </div>

          {filteredAndSortedRapports.length === 0 ? (
            <Card className="bg-white shadow-lg border border-gray-100">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-100 rounded-full mb-6">
                  <FileText className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun rapport trouvé</h3>
                <p className="text-gray-600 text-center text-lg max-w-md">
                  {searchTerm || priorityFilter !== 'all' 
                    ? "Aucun rapport ne correspond à vos critères de recherche."
                    : "Vous n&apos;avez pas encore créé de rapports de rendez-vous."
                  }
                </p>
                {(searchTerm || priorityFilter !== 'all') && (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setPriorityFilter('all');
                    }}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
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
                  className={`bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${getCardBorderColor(rapport)}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-2xl font-bold text-gray-900">
                              {rapport.nom_prenom_client}
                            </CardTitle>
                            {getPriorityBadge(rapport)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(rapport.date_rendez_vous).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{rapport.heure_rendez_vous}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{rapport.conseiller_commercial}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{rapport.telephone_client}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
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
                          className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimer
                        </Button>
                        
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
                      <CardContent className="space-y-6">
                        {/* 1. Détails du rendez-vous */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            1. Détails du rendez-vous
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div><strong>Date:</strong> {new Date(rapport.date_rendez_vous).toLocaleDateString('fr-FR')}</div>
                            <div><strong>Heure:</strong> {rapport.heure_rendez_vous}</div>
                            <div><strong>Lieu:</strong> {rapport.lieu_rendez_vous} {rapport.lieu_autre && `(${rapport.lieu_autre})`}</div>
                            <div><strong>Durée:</strong> {rapport.duree_rendez_vous}</div>
                            <div><strong>Conseiller:</strong> {rapport.conseiller_commercial}</div>
                          </div>
                        </div>

                        {/* 2. Informations sur le client */}
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            2. Informations sur le client
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div><strong>Nom:</strong> {rapport.nom_prenom_client}</div>
                            <div><strong>Téléphone:</strong> {rapport.telephone_client}</div>
                            <div><strong>Email:</strong> {rapport.email_client || 'Non renseigné'}</div>
                            <div><strong>Type:</strong> {rapport.type_client}</div>
                            {rapport.profession_societe && (
                              <div><strong>Profession/Société:</strong> {rapport.profession_societe}</div>
                            )}
                          </div>
                        </div>

                        {/* 3. Objet du rendez-vous */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            3. Objet du rendez-vous
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {rapport.presentation_gamme && <Badge variant="secondary">Présentation gamme</Badge>}
                            {rapport.essai_vehicule && <Badge variant="secondary">Essai véhicule</Badge>}
                            {rapport.negociation_commerciale && <Badge variant="secondary">Négociation</Badge>}
                            {rapport.livraison_vehicule && <Badge variant="secondary">Livraison</Badge>}
                            {rapport.service_apres_vente && <Badge variant="secondary">SAV</Badge>}
                            {rapport.objet_autre && <Badge variant="outline">Autre: {rapport.objet_autre}</Badge>}
                          </div>
                        </div>

                        {/* 4. Modèles discutés */}
                        {(rapport.modeles_discutes as unknown[])?.length > 0 && (
                          <div className="bg-amber-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              4. Modèles discutés
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2">Modèle</th>
                                    <th className="text-left p-2">Motorisation</th>
                                    <th className="text-left p-2">Transmission</th>
                                    <th className="text-left p-2">Couleur</th>
                                    <th className="text-left p-2">Observation</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(rapport.modeles_discutes as unknown[])?.map((modele: unknown, idx: number) => (
                                    <tr key={idx} className="border-b">
                                      <td className="p-2">{(modele as Record<string, unknown>).modele as string || ''}</td>
                                      <td className="p-2">{(modele as Record<string, unknown>).motorisation as string || ''}</td>
                                      <td className="p-2">{(modele as Record<string, unknown>).transmission as string || ''}</td>
                                      <td className="p-2">{(modele as Record<string, unknown>).couleur as string || ''}</td>
                                      <td className="p-2">{(modele as Record<string, unknown>).observation as string || ''}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 5. Impressions et besoins du client */}
                        <div className="bg-cyan-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-cyan-900 mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            5. Impressions et besoins du client
                          </h3>
                          <div className="space-y-3 text-sm">
                            {rapport.motivations_achat && (
                              <div>
                                <strong>Motivations d&apos;achat:</strong>
                                <p className="mt-1 text-gray-700">{rapport.motivations_achat}</p>
                              </div>
                            )}
                            {rapport.points_positifs && (
                              <div>
                                <strong>Points positifs:</strong>
                                <p className="mt-1 text-gray-700">{rapport.points_positifs}</p>
                              </div>
                            )}
                            {rapport.objections_freins && (
                              <div>
                                <strong>Objections/Freins:</strong>
                                <p className="mt-1 text-gray-700">{rapport.objections_freins}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <strong>Intérêt:</strong>
                                {getDegreInteretBadge(rapport.degre_interet ?? null)}
                              </div>
                              <div className="flex items-center gap-2">
                                <strong>Décision:</strong>
                                {getDecisionBadge(rapport.decision_attendue ?? null)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 6. Propositions faites */}
                        <div className="bg-emerald-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            6. Propositions faites
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={rapport.devis_offre_remise ? 'text-green-600' : 'text-gray-400'}>
                                {rapport.devis_offre_remise ? '☑' : '☐'}
                              </span>
                              <span>Devis/Offre remise {rapport.reference_offre && `(Réf: ${rapport.reference_offre})`}</span>
                            </div>
                            <div><strong>Financement proposé:</strong> {rapport.financement_propose || 'Non renseigné'}</div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className={rapport.assurance_entretien ? 'text-green-600' : 'text-gray-400'}>
                                  {rapport.assurance_entretien ? '☑' : '☐'}
                                </span>
                                <span>Assurance/Entretien</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={rapport.reprise_ancien_vehicule ? 'text-green-600' : 'text-gray-400'}>
                                  {rapport.reprise_ancien_vehicule ? '☑' : '☐'}
                                </span>
                                <span>Reprise ancien véhicule</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 7. Actions de suivi */}
                        {(rapport.actions_suivi as unknown[])?.length > 0 && (
                          <div className="bg-violet-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-violet-900 mb-3 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              7. Actions de suivi
                            </h3>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2">Action</th>
                                    <th className="text-left p-2">Responsable</th>
                                    <th className="text-left p-2">Échéance</th>
                                    <th className="text-left p-2">Statut</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(rapport.actions_suivi as unknown[])?.map((action: unknown, idx: number) => (
                                    <tr key={idx} className="border-b">
                                      <td className="p-2">{(action as Record<string, unknown>).action as string || ''}</td>
                                      <td className="p-2">{(action as Record<string, unknown>).responsable as string || ''}</td>
                                      <td className="p-2">{(action as Record<string, unknown>).echeance as string || ''}</td>
                                      <td className="p-2">{(action as Record<string, unknown>).statut as string || ''}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 8. Commentaire global */}
                        {rapport.commentaire_global && (
                          <div className="bg-rose-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-rose-900 mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              8. Commentaire global du conseiller
                            </h3>
                            <p className="text-sm text-gray-700">{rapport.commentaire_global}</p>
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