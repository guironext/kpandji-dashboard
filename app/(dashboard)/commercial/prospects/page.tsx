"use client";

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientForm } from '@/components/ClientForm';
import { ClientEntrepriseForm } from '@/components/ClientEntrepriseForm';
import { getClientsByUser, updateClient, deleteClient } from '@/lib/actions/client';
import { getClientEntreprisesByUser, updateClientEntreprise, deleteClientEntreprise } from '@/lib/actions/client_entreprise';
import { 
  Users, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  User,
  Briefcase,
  Trash2,
  Edit,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  nom: string;
  email?: string | null;
  telephone: string;
  entreprise?: string | null;
  localisation?: string | null;
  secteur_activite?: string | null;
  commercial?: string | null;
  status_client: string;
  createdAt: Date;
}

interface ClientEntreprise {
  id: string;
  nom_entreprise: string;
  sigle?: string | null;
  email?: string | null;
  telephone: string;
  nom_personne_contact?: string | null;
  fonction_personne_contact?: string | null;
  email_personne_contact?: string | null;
  telephone_personne_contact?: string | null;
  localisation?: string | null;
  secteur_activite?: string | null;
  flotte_vehicules?: boolean | null;
  flotte_vehicules_description?: string | null;
  commercial?: string | null;
  status_client: string;
  createdAt: Date;
}

const ProspectsPage = () => {
  const { user, isLoaded } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientEntreprises, setClientEntreprises] = useState<ClientEntreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('individual');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClientEntreprise, setSelectedClientEntreprise] = useState<ClientEntreprise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editingClientEntreprise, setEditingClientEntreprise] = useState<ClientEntreprise | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isSubmittingClientEdit, setIsSubmittingClientEdit] = useState(false);
  
  // Form fields for editing client entreprise
  const [formData, setFormData] = useState({
    nom_entreprise: '',
    sigle: '',
    email: '',
    telephone: '',
    nom_personne_contact: '',
    fonction_personne_contact: '',
    email_personne_contact: '',
    telephone_personne_contact: '',
    localisation: '',
    secteur_activite: '',
    flotte_vehicules: false,
    flotte_vehicules_description: '',
    commercial: '',
    status_client: 'PROSPECT' as 'CLIENT' | 'PROSPECT' | 'FAVORABLE' | 'A_SUIVRE' | 'ABANDONNE',
  });

  // Form fields for editing individual client
  const [clientFormData, setClientFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    localisation: '',
    secteur_activite: '',
    commercial: '',
    status_client: 'PROSPECT' as 'CLIENT' | 'PROSPECT' | 'FAVORABLE' | 'A_SUIVRE' | 'ABANDONNE',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [clientsResult, clientEntreprisesResult] = await Promise.all([
          getClientsByUser(user.id),
          getClientEntreprisesByUser(user.id)
        ]);

        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data);
        }
        if (clientEntreprisesResult.success && clientEntreprisesResult.data) {
          setClientEntreprises(clientEntreprisesResult.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, user?.id]);

  const handleFormSuccess = () => {
    // Refresh data after successful form submission
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const [clientsResult, clientEntreprisesResult] = await Promise.all([
          getClientsByUser(user.id),
          getClientEntreprisesByUser(user.id)
        ]);

        if (clientsResult.success && clientsResult.data) {
          setClients(clientsResult.data);
        }
        if (clientEntreprisesResult.success && clientEntreprisesResult.data) {
          setClientEntreprises(clientEntreprisesResult.data);
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };

    fetchData();
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setSelectedClientEntreprise(null);
    setIsModalOpen(true);
  };

  const handleViewClientEntreprise = (clientEntreprise: ClientEntreprise) => {
    setSelectedClientEntreprise(clientEntreprise);
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClientEntreprise = (clientEntreprise: ClientEntreprise) => {
    setEditingClientEntreprise(clientEntreprise);
    setFormData({
      nom_entreprise: clientEntreprise.nom_entreprise,
      sigle: clientEntreprise.sigle || '',
      email: clientEntreprise.email || '',
      telephone: clientEntreprise.telephone,
      nom_personne_contact: clientEntreprise.nom_personne_contact || '',
      fonction_personne_contact: clientEntreprise.fonction_personne_contact || '',
      email_personne_contact: clientEntreprise.email_personne_contact || '',
      telephone_personne_contact: clientEntreprise.telephone_personne_contact || '',
      localisation: clientEntreprise.localisation || '',
      secteur_activite: clientEntreprise.secteur_activite || '',
      flotte_vehicules: clientEntreprise.flotte_vehicules || false,
      flotte_vehicules_description: clientEntreprise.flotte_vehicules_description || '',
      commercial: clientEntreprise.commercial || '',
      status_client: clientEntreprise.status_client as 'CLIENT' | 'PROSPECT' | 'FAVORABLE' | 'A_SUIVRE' | 'ABANDONNE',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingClientEntreprise) return;

    setIsSubmittingEdit(true);
    try {
      const result = await updateClientEntreprise(editingClientEntreprise.id, formData);

      if (result.success) {
        toast.success('Client entreprise mis à jour avec succès!');
        setIsEditModalOpen(false);
        handleFormSuccess(); // Refresh the data
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating client entreprise:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteClientEntreprise = async (id: string) => {
    // Confirm deletion
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client entreprise ? Cette action est irréversible.')) {
      return;
    }

    try {
      const result = await deleteClientEntreprise(id);

      if (result.success) {
        toast.success('Client entreprise supprimé avec succès!');
        handleFormSuccess(); // Refresh the data
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting client entreprise:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientFormData({
      nom: client.nom,
      email: client.email || '',
      telephone: client.telephone,
      entreprise: client.entreprise || '',
      localisation: client.localisation || '',
      secteur_activite: client.secteur_activite || '',
      commercial: client.commercial || '',
      status_client: client.status_client as 'CLIENT' | 'PROSPECT' | 'FAVORABLE' | 'A_SUIVRE' | 'ABANDONNE',
    });
    setIsEditClientModalOpen(true);
  };

  const handleSaveClientEdit = async () => {
    if (!editingClient) return;

    setIsSubmittingClientEdit(true);
    try {
      const result = await updateClient(editingClient.id, clientFormData);

      if (result.success) {
        toast.success('Client mis à jour avec succès!');
        setIsEditClientModalOpen(false);
        handleFormSuccess(); // Refresh the data
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSubmittingClientEdit(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    // Confirm deletion
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) {
      return;
    }

    try {
      const result = await deleteClient(id);

      if (result.success) {
        toast.success('Client supprimé avec succès!');
        handleFormSuccess(); // Refresh the data
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLIENT':
        return 'bg-green-100 text-green-800';
      case 'PROSPECT':
        return 'bg-blue-100 text-blue-800';
      case 'FAVORABLE':
        return 'bg-yellow-100 text-yellow-800';
      case 'A_SUIVRE':
        return 'bg-orange-100 text-orange-800';
      case 'ABANDONNE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CLIENT':
        return 'Client';
      case 'PROSPECT':
        return 'Prospect';
      case 'FAVORABLE':
        return 'Favorable';
      case 'A_SUIVRE':
        return 'À suivre';
      case 'ABANDONNE':
        return 'Abandonné';
      default:
        return status;
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Non connecté</h2>
          <p className="text-gray-600">Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white">
                      Gestion des Prospects
                    </h1>
                    <p className="text-blue-100 text-lg mt-2">
                      Créer et gérer vos prospects individuels et entreprises
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{clients.length}</div>
                    <div className="text-blue-100 text-sm">Prospects Individuels</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{clientEntreprises.length}</div>
                    <div className="text-blue-100 text-sm">Entreprises</div>
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-white">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Système actif</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 space-y-8">

        {/* Forms Section */}
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Créer un nouveau prospect</h2>
            <p className="text-gray-600">Sélectionnez le type de Prospect à créer</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                <TabsTrigger 
                  value="individual" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Prospects Individuels</span>
                  <span className="sm:hidden">Individuels</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="enterprise" 
                  className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all duration-200"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Prospects Entreprise</span>
                  <span className="sm:hidden">Entreprises</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="individual" className="space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Nouveau Prospect Individuel</h3>
                      <p className="text-sm text-gray-600">Ajoutez un prospect particulier à votre portefeuille</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ClientForm 
                    userId={user.id} 
                    userName={`${user.firstName || ''} ${user.lastName || ''}`.trim()} 
                    onSuccess={handleFormSuccess} 
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enterprise" className="space-y-6 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Nouveau Prospect Entreprise</h3>
                      <p className="text-sm text-gray-600">Ajoutez un prospect entreprise à votre portefeuille</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ClientEntrepriseForm 
                    userId={user.id} 
                    userName={`${user.firstName || ''} ${user.lastName || ''}`.trim()} 
                    onSuccess={handleFormSuccess} 
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Lists Section */}
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos Prospects</h2>
            <p className="text-gray-600">Gérez vos prospects individuels et entreprises</p>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Individual Clients List */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Prospects Individuels</h3>
                      <p className="text-sm text-gray-600">{clients.length} Prospects enregistrés</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {clients.length}
                  </Badge>
                </div>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500">Chargement des prospects...</p>
                    </div>
                  </div>
                ) : clients.length > 0 ? (
                  <div className="space-y-4">
                    {clients.map((client, index) => (
                      <div
                        key={client.id}
                        className="group p-5 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 bg-white hover:border-blue-200"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">{client.nom}</h4>
                                <Badge className={`${getStatusColor(client.status_client)} text-xs font-medium`}>
                                  {getStatusLabel(client.status_client)}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                              {client.telephone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span>{client.telephone}</span>
                                </div>
                              )}
                              {client.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="truncate">{client.email}</span>
                                </div>
                              )}
                              {client.entreprise && (
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4 text-gray-400" />
                                  <span className="truncate">{client.entreprise}</span>
                                </div>
                              )}
                              {client.localisation && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="truncate">{client.localisation}</span>
                                </div>
                              )}
                            </div>
                            
                            {client.secteur_activite && (
                              <div className="mt-3">
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                  {client.secteur_activite}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                              <Calendar className="h-4 w-4" />
                              <span>Créé le {new Date(client.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewClient(client)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditClient(client)}
                            
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDeleteClient(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun prospect individuel</h3>
                    <p className="text-gray-500 mb-4">Créez votre premier prospect individuel en utilisant le formulaire ci-dessus</p>
                    <Button 
                      onClick={() => setActiveTab('individual')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Créer un prospect individuel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Enterprise Clients List */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Prospects Entreprise</h3>
                      <p className="text-sm text-gray-600">{clientEntreprises.length} Prospects entreprises enregistrées</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {clientEntreprises.length}
                  </Badge>
                </div>
              </div>
              
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <p className="text-gray-500">Chargement des prospects entreprises...</p>
                    </div>
                  </div>
                ) : clientEntreprises.length > 0 ? (
                  <div className="space-y-4">
                    {clientEntreprises.map((clientEntreprise, index) => (
                      <div
                        key={clientEntreprise.id}
                        className="group p-5 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 bg-white hover:border-green-200"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {clientEntreprise.nom_entreprise}
                                  {clientEntreprise.sigle && (
                                    <span className="text-sm text-gray-500 ml-2">
                                      ({clientEntreprise.sigle})
                                    </span>
                                  )}
                                </h4>
                                <Badge className={`${getStatusColor(clientEntreprise.status_client)} text-xs font-medium`}>
                                  {getStatusLabel(clientEntreprise.status_client)}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                              {clientEntreprise.telephone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span>{clientEntreprise.telephone}</span>
                                </div>
                              )}
                              {clientEntreprise.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="truncate">{clientEntreprise.email}</span>
                                </div>
                              )}
                              {clientEntreprise.nom_personne_contact && (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="truncate">
                                    {clientEntreprise.nom_personne_contact}
                                    {clientEntreprise.fonction_personne_contact && (
                                      <span className="text-gray-500">
                                        - {clientEntreprise.fonction_personne_contact}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}
                              {clientEntreprise.localisation && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="truncate">{clientEntreprise.localisation}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              {clientEntreprise.secteur_activite && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                  {clientEntreprise.secteur_activite}
                                </span>
                              )}
                              {clientEntreprise.flotte_vehicules && (
                                <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                                  ✓ Flotte de véhicules
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                              <Calendar className="h-4 w-4" />
                              <span>Créé le {new Date(clientEntreprise.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewClientEntreprise(clientEntreprise)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditClientEntreprise(clientEntreprise)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDeleteClientEntreprise(clientEntreprise.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun prospect entreprise</h3>
                    <p className="text-gray-500 mb-4">Créez votre première entreprise en utilisant le formulaire ci-dessus</p>
                    <Button 
                      onClick={() => setActiveTab('enterprise')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Créer un prospect entreprise
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedClient ? (
                <>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xl font-semibold">{selectedClient.nom}</span>
                    <Badge className={`${getStatusColor(selectedClient.status_client)} text-xs font-medium ml-2`}>
                      {getStatusLabel(selectedClient.status_client)}
                    </Badge>
                  </div>
                </>
              ) : selectedClientEntreprise ? (
                <>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <span className="text-xl font-semibold">
                      {selectedClientEntreprise.nom_entreprise}
                      {selectedClientEntreprise.sigle && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({selectedClientEntreprise.sigle})
                        </span>
                      )}
                    </span>
                    <Badge className={`${getStatusColor(selectedClientEntreprise.status_client)} text-xs font-medium ml-2`}>
                      {getStatusLabel(selectedClientEntreprise.status_client)}
                    </Badge>
                  </div>
                </>
              ) : null}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {selectedClient && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    Informations de Contact
                  </h3>
                  <div className="space-y-3">
                    {selectedClient.telephone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClient.telephone}</span>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClient.email}</span>
                      </div>
                    )}
                    {selectedClient.localisation && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClient.localisation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Informations Professionnelles
                  </h3>
                  <div className="space-y-3">
                    {selectedClient.entreprise && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClient.entreprise}</span>
                      </div>
                    )}
                    {selectedClient.secteur_activite && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Secteur d&apos;activité:</span>
                        <div className="mt-1">
                          <span className="inline-block bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full">
                            {selectedClient.secteur_activite}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedClient.commercial && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Commercial: {selectedClient.commercial}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedClientEntreprise && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    Informations de l&apos;Entreprise
                  </h3>
                  <div className="space-y-3">
                    {selectedClientEntreprise.telephone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClientEntreprise.telephone}</span>
                      </div>
                    )}
                    {selectedClientEntreprise.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClientEntreprise.email}</span>
                      </div>
                    )}
                    {selectedClientEntreprise.localisation && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClientEntreprise.localisation}</span>
                      </div>
                    )}
                    {selectedClientEntreprise.secteur_activite && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Secteur d&apos;activité:</span>
                        <div className="mt-1">
                          <span className="inline-block bg-green-100 text-green-600 text-sm px-3 py-1 rounded-full">
                            {selectedClientEntreprise.secteur_activite}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedClientEntreprise.flotte_vehicules && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Flotte de véhicules:</span>
                        <div className="mt-1">
                          <span className="inline-block bg-blue-100 text-blue-600 text-sm px-3 py-1 rounded-full">
                            ✓ Oui
                          </span>
                          {selectedClientEntreprise.flotte_vehicules_description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {selectedClientEntreprise.flotte_vehicules_description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Person Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-green-600" />
                    Personne de Contact
                  </h3>
                  <div className="space-y-3">
                    {selectedClientEntreprise.nom_personne_contact && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium">{selectedClientEntreprise.nom_personne_contact}</span>
                          {selectedClientEntreprise.fonction_personne_contact && (
                            <p className="text-sm text-gray-600">
                              {selectedClientEntreprise.fonction_personne_contact}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedClientEntreprise.email_personne_contact && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClientEntreprise.email_personne_contact}</span>
                      </div>
                    )}
                    {selectedClientEntreprise.telephone_personne_contact && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{selectedClientEntreprise.telephone_personne_contact}</span>
                      </div>
                    )}
                    {selectedClientEntreprise.commercial && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Commercial: {selectedClientEntreprise.commercial}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Creation Date */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  Créé le {new Date((selectedClient?.createdAt || selectedClientEntreprise?.createdAt)!).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Entreprise Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xl font-semibold">
                Modifier l&apos;entreprise
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Informations de l&apos;entreprise
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_entreprise">Nom de l&apos;entreprise *</Label>
                  <Input
                    id="nom_entreprise"
                    value={formData.nom_entreprise}
                    onChange={(e) => setFormData({ ...formData, nom_entreprise: e.target.value })}
                    placeholder="ABC Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sigle">Sigle</Label>
                  <Input
                    id="sigle"
                    value={formData.sigle}
                    onChange={(e) => setFormData({ ...formData, sigle: e.target.value })}
                    placeholder="ABC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email entreprise</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@abc-corp.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone entreprise *</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localisation">Localisation</Label>
                  <Input
                    id="localisation"
                    value={formData.localisation}
                    onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                    placeholder="Paris, France"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secteur_activite">Secteur d&apos;activité</Label>
                  <Input
                    id="secteur_activite"
                    value={formData.secteur_activite}
                    onChange={(e) => setFormData({ ...formData, secteur_activite: e.target.value })}
                    placeholder="Automobile, Finance, etc."
                  />
                </div>
              </div>
            </div>

            {/* Contact Person Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Personne de contact
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_personne_contact">Nom complet</Label>
                  <Input
                    id="nom_personne_contact"
                    value={formData.nom_personne_contact}
                    onChange={(e) => setFormData({ ...formData, nom_personne_contact: e.target.value })}
                    placeholder="Marie Martin"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fonction_personne_contact">Fonction</Label>
                  <Input
                    id="fonction_personne_contact"
                    value={formData.fonction_personne_contact}
                    onChange={(e) => setFormData({ ...formData, fonction_personne_contact: e.target.value })}
                    placeholder="Directeur des achats"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_personne_contact">Email contact</Label>
                  <Input
                    id="email_personne_contact"
                    type="email"
                    value={formData.email_personne_contact}
                    onChange={(e) => setFormData({ ...formData, email_personne_contact: e.target.value })}
                    placeholder="marie.martin@abc-corp.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone_personne_contact">Téléphone contact</Label>
                  <Input
                    id="telephone_personne_contact"
                    value={formData.telephone_personne_contact}
                    onChange={(e) => setFormData({ ...formData, telephone_personne_contact: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>
            </div>

            {/* Commercial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informations commerciales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commercial">Commercial assigné</Label>
                  <Input
                    id="commercial"
                    value={formData.commercial}
                    onChange={(e) => setFormData({ ...formData, commercial: e.target.value })}
                    placeholder="Nom du commercial"
                    className="bg-gray-50"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status_client">Statut</Label>
                  <Select
                    value={formData.status_client}
                    onValueChange={(value) => setFormData({ ...formData, status_client: value as 'CLIENT' | 'PROSPECT' | 'FAVORABLE' | 'A_SUIVRE' | 'ABANDONNE' })}
                  >
                    <SelectTrigger id="status_client">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROSPECT">Prospect</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                      <SelectItem value="FAVORABLE">Favorable</SelectItem>
                      <SelectItem value="A_SUIVRE">À suivre</SelectItem>
                      <SelectItem value="ABANDONNE">Abandonné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="flotte_vehicules"
                  checked={formData.flotte_vehicules}
                  onCheckedChange={(checked) => setFormData({ ...formData, flotte_vehicules: checked === true })}
                />
                <div className="space-y-1">
                  <Label htmlFor="flotte_vehicules" className="font-medium cursor-pointer">
                    Possède une flotte de véhicules
                  </Label>
                </div>
              </div>

              {formData.flotte_vehicules && (
                <div className="space-y-2">
                  <Label htmlFor="flotte_vehicules_description">Description de la flotte</Label>
                  <Textarea
                    id="flotte_vehicules_description"
                    value={formData.flotte_vehicules_description}
                    onChange={(e) => setFormData({ ...formData, flotte_vehicules_description: e.target.value })}
                    placeholder="Décrivez la flotte de véhicules (nombre, types, etc.)"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmittingEdit}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmittingEdit}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
              >
                {isSubmittingEdit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Individual Client Modal */}
      <Dialog open={isEditClientModalOpen} onOpenChange={setIsEditClientModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xl font-semibold">
                Modifier le client
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Informations du client
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_nom">Nom complet *</Label>
                  <Input
                    id="client_nom"
                    value={clientFormData.nom}
                    onChange={(e) => setClientFormData({ ...clientFormData, nom: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_telephone">Téléphone *</Label>
                  <Input
                    id="client_telephone"
                    value={clientFormData.telephone}
                    onChange={(e) => setClientFormData({ ...clientFormData, telephone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={clientFormData.email}
                    onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                    placeholder="jean.dupont@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_entreprise">Entreprise</Label>
                  <Input
                    id="client_entreprise"
                    value={clientFormData.entreprise}
                    onChange={(e) => setClientFormData({ ...clientFormData, entreprise: e.target.value })}
                    placeholder="Nom de l'entreprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_localisation">Localisation</Label>
                  <Input
                    id="client_localisation"
                    value={clientFormData.localisation}
                    onChange={(e) => setClientFormData({ ...clientFormData, localisation: e.target.value })}
                    placeholder="Paris, France"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_secteur_activite">Secteur d&apos;activité</Label>
                  <Input
                    id="client_secteur_activite"
                    value={clientFormData.secteur_activite}
                    onChange={(e) => setClientFormData({ ...clientFormData, secteur_activite: e.target.value })}
                    placeholder="Automobile, Finance, etc."
                  />
                </div>
              </div>
            </div>

            {/* Commercial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informations commerciales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_commercial">Commercial assigné</Label>
                  <Input
                    id="client_commercial"
                    value={clientFormData.commercial}
                    onChange={(e) => setClientFormData({ ...clientFormData, commercial: e.target.value })}
                    placeholder="Nom du commercial"
                    className="bg-gray-50"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_status">Statut</Label>
                  <Select
                    value={clientFormData.status_client}
                    onValueChange={(value) => setClientFormData({ ...clientFormData, status_client: value as 'CLIENT' | 'PROSPECT' | 'FAVORABLE' | 'A_SUIVRE' | 'ABANDONNE' })}
                  >
                    <SelectTrigger id="client_status">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROSPECT">Prospect</SelectItem>
                      <SelectItem value="CLIENT">Client</SelectItem>
                      <SelectItem value="FAVORABLE">Favorable</SelectItem>
                      <SelectItem value="A_SUIVRE">À suivre</SelectItem>
                      <SelectItem value="ABANDONNE">Abandonné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditClientModalOpen(false)}
                disabled={isSubmittingClientEdit}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSaveClientEdit}
                disabled={isSubmittingClientEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              >
                {isSubmittingClientEdit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProspectsPage;