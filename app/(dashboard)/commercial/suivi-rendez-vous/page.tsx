"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Phone, 
  RefreshCw, 
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Sparkles,
  Filter,
  X,
  Users,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { getRapportRendezVousByUser } from '@/lib/actions/rendezvous';
import { RapportCard } from '@/components/RapportCard';

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
  Com_Pres: boolean;
  Com_Drive: boolean;
  Com_Achat: boolean;
  Com_Livre: boolean;
  Com_APV: boolean;
  Com_Office: boolean;
  Com_Close: boolean;
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
  clientId?: string | null;
  clientEntrepriseId?: string | null;
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
        setRapports((result.data || []) as unknown as RapportRendezVous[]);
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
            @media print {
              body { margin: 0; }
            }
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
                <span class="checkbox">${rapport.Com_Pres ? '☑' : '☐'}</span> Com_Pres
              </div>
              <div class="col">
                <span class="checkbox">${rapport.Com_Drive ? '☑' : '☐'}</span> Com_Drive
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="checkbox">${rapport.Com_Achat ? '☑' : '☐'}</span> Com_Achat
              </div>
              <div class="col">
                <span class="checkbox">${rapport.Com_Livre ? '☑' : '☐'}</span> Com_Livre
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="checkbox">${rapport.Com_APV ? '☑' : '☐'}</span> Com_APV
              </div>
              <div class="col">
                <span class="checkbox">${rapport.Com_Office ? '☑' : '☐'}</span> Com_Office
              </div>
              <div class="col">
                <span class="checkbox">${rapport.Com_Close ? '☑' : '☐'}</span> Com_Close
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
      // Focus the new window - user can manually print using Ctrl+P or File > Print
      printWindow.focus();
    }
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
  const filteredAndSortedRapports = useMemo(() => [...rapports]
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
    }), [rapports, searchTerm, priorityFilter]);

  // Group rapports by client/prospect
  const groupedByClient = useMemo(() => {
    const groups = new Map<string, { key: string; name: string; rapports: RapportRendezVous[] }>();
    
    const getClientKey = (r: RapportRendezVous) => {
      if (r.clientId) return `client:${r.clientId}`;
      if (r.clientEntrepriseId) return `entreprise:${r.clientEntrepriseId}`;
      return `prospect:${(r.nom_prenom_client || '').toLowerCase().trim()}|${(r.telephone_client || '').replace(/\s/g, '')}`;
    };
    
    const getClientName = (r: RapportRendezVous) => {
      if (r.client?.nom) return r.client.nom;
      if (r.clientEntreprise?.nom_entreprise) return r.clientEntreprise.nom_entreprise;
      return r.nom_prenom_client || 'Prospect inconnu';
    };
    
    for (const rapport of filteredAndSortedRapports) {
      const key = getClientKey(rapport);
      const name = getClientName(rapport);
      if (!groups.has(key)) {
        groups.set(key, { key, name, rapports: [] });
      }
      groups.get(key)!.rapports.push(rapport);
    }
    
    // Sort each group's rapports by date (newest first)
    groups.forEach(g => {
      g.rapports.sort((a, b) => new Date(b.date_rendez_vous).getTime() - new Date(a.date_rendez_vous).getTime());
    });
    
    // Sort groups by most recent rapport
    return Array.from(groups.values()).sort((a, b) => {
      const dateA = new Date(a.rapports[0]?.date_rendez_vous || 0).getTime();
      const dateB = new Date(b.rapports[0]?.date_rendez_vous || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredAndSortedRapports]);

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

        {/* Reports Section - Tab Design */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Rapports de Rendez-vous
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-gray-600 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-md border border-gray-200">
                {filteredAndSortedRapports.length} rapport(s) · {groupedByClient.length} client(s)
              </div>
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
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200 rounded-2xl overflow-hidden">
              <Tabs defaultValue="all" className="w-full">
                <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-gray-50 px-4 pt-4">
                  <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0 border-0 w-full overflow-x-auto pb-2 scrollbar-thin">
                    <TabsTrigger 
                      value="all" 
                      className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-gray-200 font-semibold transition-all"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Tous ({filteredAndSortedRapports.length})
                    </TabsTrigger>
                    {groupedByClient.map((group) => (
                      <TabsTrigger 
                        key={group.key} 
                        value={`client-${group.key}`}
                        className="rounded-xl px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-indigo-200 data-[state=active]:text-indigo-700 font-semibold transition-all whitespace-nowrap"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {group.name}
                        <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                          {group.rapports.length}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <div className="p-6">
                  <TabsContent value="all" className="mt-0 space-y-6">
                    {filteredAndSortedRapports.map((rapport) => (
                      <RapportCard
                        key={rapport.id}
                        rapport={rapport}
                        onRefresh={handleRefresh}
                        onPrint={handlePrint}
                        dialogDisabled={dialogDisabled}
                        setDialogDisabled={setDialogDisabled}
                      />
                    ))}
                  </TabsContent>
                  {groupedByClient.map((group) => (
                    <TabsContent key={group.key} value={`client-${group.key}`} className="mt-0">
                      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50/50 border-2 border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg ring-4 ring-indigo-100">
                            <Users className="h-9 w-9 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-bold text-gray-900 truncate">{group.name}</h3>
                            <p className="text-sm text-indigo-600 font-medium mt-1">
                              {group.rapports.length} rapport{group.rapports.length > 1 ? 's' : ''} de rendez-vous
                            </p>
                            {group.rapports[0]?.telephone_client && (
                              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-indigo-500" />
                                {group.rapports[0].telephone_client}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-base px-4 py-1.5">
                            {group.rapports.length} RDV
                          </Badge>
                        </div>
                      </div>
                      {group.rapports.length === 1 ? (
                        <RapportCard
                          rapport={group.rapports[0]}
                          onRefresh={handleRefresh}
                          onPrint={handlePrint}
                          dialogDisabled={dialogDisabled}
                          setDialogDisabled={setDialogDisabled}
                        />
                      ) : (
                        <Tabs defaultValue={`rapport-${group.rapports[0].id}`} className="w-full">
                          <TabsList className="mb-6 h-auto flex-wrap gap-2 bg-slate-100 p-2 rounded-xl w-full">
                            {group.rapports.map((rapport) => (
                              <TabsTrigger 
                                key={rapport.id} 
                                value={`rapport-${rapport.id}`}
                                className="rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:border data-[state=active]:border-gray-200"
                              >
                                <ChevronRight className="h-4 w-4 mr-2" />
                                RDV du {new Date(rapport.date_rendez_vous).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {rapport.heure_rendez_vous && ` · ${rapport.heure_rendez_vous}`}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {group.rapports.map((rapport) => (
                            <TabsContent key={rapport.id} value={`rapport-${rapport.id}`} className="mt-0">
                              <RapportCard
                                rapport={rapport}
                                onRefresh={handleRefresh}
                                onPrint={handlePrint}
                                dialogDisabled={dialogDisabled}
                                setDialogDisabled={setDialogDisabled}
                              />
                            </TabsContent>
                          ))}
                        </Tabs>
                      )}
                    </TabsContent>
                  ))}
                </div>
              </Tabs>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
