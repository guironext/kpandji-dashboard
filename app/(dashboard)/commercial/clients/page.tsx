"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Users, 
  CheckCircle,
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase,
  Search,
  Edit,
  Trash2,
  Filter,
  SortAsc,
  MoreVertical,
  UserCheck,
  Calendar,
  Sparkles,
  Star,
  TrendingUp,
  Award
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient, getClientsByUserAndStatus, updateClient, deleteClient } from "@/lib/actions/client";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

interface Client {
  id: string;
  nom: string;
  email?: string | null;
  telephone: string;
  status_client: string;
  entreprise?: string | null;
  localisation?: string | null;
  secteur_activite?: string | null;
  commercial?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type SortField = 'nom' | 'entreprise' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const ClientPage = () => {
  const { user } = useUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterSector, setFilterSector] = useState<string>('all');

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    entreprise: "",
    localisation: "",
    secteur_activite: "",
    commercial: "",
    status_client: "CLIENT",
  });

  // Memoized filtered and sorted clients
  const filteredAndSortedClients = useMemo(() => {
    const filtered = clients.filter(client => {
      const matchesSearch = 
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telephone.includes(searchTerm);
      
      const matchesSector = filterSector === 'all' || client.secteur_activite === filterSector;
      
      return matchesSearch && matchesSector;
    });

    return filtered.sort((a, b) => {
      let aValue: string | Date = '';
      let bValue: string | Date = '';

      switch (sortField) {
        case 'nom':
          aValue = a.nom;
          bValue = b.nom;
          break;
        case 'entreprise':
          aValue = a.entreprise || '';
          bValue = b.entreprise || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clients, searchTerm, filterSector, sortField, sortOrder]);

  // Get unique sectors for filter
  const uniqueSectors = useMemo(() => {
    const sectors = clients
      .map(client => client.secteur_activite)
      .filter(Boolean)
      .filter((sector, index, arr) => arr.indexOf(sector) === index);
    return sectors;
  }, [clients]);

  const fetchClients = useCallback(async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      const result = await getClientsByUserAndStatus(user.id, "CLIENT");
      if (result.success && result.data) {
        setClients(result.data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingClient) {
        const updateData = {
          nom: formData.nom,
          email: formData.email || undefined,
          telephone: formData.telephone,
          entreprise: formData.entreprise || undefined,
          localisation: formData.localisation || undefined,
          secteur_activite: formData.secteur_activite || undefined,
          commercial: formData.commercial || undefined,
          status_client: "CLIENT" as "CLIENT" | "PROSPECT" | "ABANDONNE",
        };
        const result = await updateClient(editingClient.id, updateData);
        if (result.success) {
          toast.success("Client mis à jour avec succès");
          setEditingClient(null);
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour");
        }
      } else {
        const createData = {
          ...formData,
          userId: user.id,
          email: formData.email || undefined,
          entreprise: formData.entreprise || undefined,
          localisation: formData.localisation || undefined,
          secteur_activite: formData.secteur_activite || undefined,
          commercial: formData.commercial || undefined,
          status_client: "CLIENT" as "CLIENT" | "PROSPECT" | "ABANDONNE",
        };
        const result = await createClient(createData);
        if (result.success) {
          toast.success("Client créé avec succès");
        } else {
          toast.error(result.error || "Erreur lors de la création");
        }
      }

      resetForm();
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      email: "",
      telephone: "",
      entreprise: "",
      localisation: "",
      secteur_activite: "",
      commercial: "",
      status_client: "CLIENT",
    });
    setShowForm(false);
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setFormData({
      nom: client.nom,
      email: client.email || "",
      telephone: client.telephone,
      entreprise: client.entreprise || "",
      localisation: client.localisation || "",
      secteur_activite: client.secteur_activite || "",
      commercial: client.commercial || "",
      status_client: client.status_client,
    });
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      try {
        const result = await deleteClient(id);
        if (result.success) {
          toast.success("Client supprimé avec succès");
          fetchClients();
        } else {
          toast.error(result.error || "Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Error deleting client:", error);
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-600 border-r-pink-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6 space-y-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 space-y-6">
        {/* Stunning Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-200/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                        Gestion des Clients
                      </h1>
                      <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
                    </div>
                    <p className="text-purple-700/70 text-lg font-medium flex items-center gap-2 mt-2">
                      <UserCheck className="w-5 h-5" />
                      Gérez votre portefeuille client efficacement
                    </p>
                  </div>
                </div>
              </div>
              
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50"></div>
                    <Button className="relative h-14 px-8 text-lg font-bold shadow-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white border-0 rounded-2xl">
                      <Plus className="w-5 h-5 mr-2" />
                      Nouveau Client
                    </Button>
                  </div>
                </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                {editingClient ? <Edit className="w-6 h-6 text-purple-600" /> : <Plus className="w-6 h-6 text-purple-600" />}
                {editingClient ? "Modifier le Client" : "Nouveau Client"}
              </DialogTitle>
              <DialogDescription className="text-purple-700/70 font-medium">
                {editingClient ? "✨ Modifiez les informations du client" : "🚀 Remplissez les informations du nouveau client"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-sm font-bold text-purple-900">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Nom du client"
                    className="h-12 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone" className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-pink-500" />
                    Téléphone *
                  </Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="Numéro de téléphone"
                    className="h-12 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Adresse email"
                    className="h-12 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entreprise" className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    Entreprise
                  </Label>
                  <Input
                    id="entreprise"
                    value={formData.entreprise}
                    onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                    placeholder="Nom de l'entreprise"
                    className="h-12 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localisation" className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    Localisation
                  </Label>
                  <Input
                    id="localisation"
                    value={formData.localisation}
                    onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                    placeholder="Ville, région"
                    className="h-12 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secteur_activite" className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    Secteur d&apos;activité
                  </Label>
                  <Input
                    id="secteur_activite"
                    value={formData.secteur_activite}
                    onChange={(e) => setFormData({ ...formData, secteur_activite: e.target.value })}
                    placeholder="Secteur d'activité"
                    className="h-12 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="commercial" className="text-sm font-bold text-purple-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-purple-500" />
                    Commercial assigné
                  </Label>
                  <Input
                    id="commercial"
                    value={formData.commercial || user?.fullName || ""}
                    onChange={(e) => setFormData({ ...formData, commercial: e.target.value })}
                    placeholder="Nom du commercial"
                    className="h-12 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t-2 border-purple-200">
                <Button type="button" variant="outline" onClick={resetForm} className="h-12 px-6 rounded-xl border-2 border-purple-300 hover:bg-purple-50">
                  Annuler
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-md opacity-50"></div>
                  <Button type="submit" className="relative h-12 px-8 font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl">
                    {editingClient ? "✨ Mettre à jour" : "🚀 Créer"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
            </div>
          </div>
        </div>

      {/* Stunning Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <Card className="relative border-2 border-purple-200/50 shadow-2xl bg-gradient-to-br from-white to-purple-50 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {clients.length}
                  </div>
                  <div className="text-sm text-purple-700 font-bold mt-1 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Total Clients
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <Card className="relative border-2 border-blue-200/50 shadow-2xl bg-gradient-to-br from-white to-blue-50 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {uniqueSectors.length}
                  </div>
                  <div className="text-sm text-blue-700 font-bold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Secteurs
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <Card className="relative border-2 border-pink-200/50 shadow-2xl bg-gradient-to-br from-white to-pink-50 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 to-rose-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    {filteredAndSortedClients.length}
                  </div>
                  <div className="text-sm text-pink-700 font-bold mt-1 flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Résultats
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl blur-md opacity-50"></div>
                  <div className="relative p-4 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stunning Search and Filters */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-3xl blur-xl opacity-20"></div>
        <Card className="relative border-2 border-purple-200/50 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-500 w-5 h-5" />
                <Input
                  placeholder="🔍 Rechercher par nom, entreprise ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 rounded-2xl text-base font-medium"
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={filterSector} onValueChange={setFilterSector}>
                  <SelectTrigger className="w-56 h-14 border-2 border-purple-200 rounded-2xl font-semibold">
                    <Filter className="w-5 h-5 mr-2 text-purple-500" />
                    <SelectValue placeholder="Filtrer par secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les secteurs</SelectItem>
                    {uniqueSectors.map(sector => (
                      <SelectItem key={sector} value={sector!}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={`${sortField}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-') as [SortField, SortOrder];
                  setSortField(field);
                  setSortOrder(order);
                }}>
                  <SelectTrigger className="w-56 h-14 border-2 border-purple-200 rounded-2xl font-semibold">
                    <SortAsc className="w-5 h-5 mr-2 text-pink-500" />
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nom-asc">Nom (A-Z)</SelectItem>
                    <SelectItem value="nom-desc">Nom (Z-A)</SelectItem>
                    <SelectItem value="entreprise-asc">Entreprise (A-Z)</SelectItem>
                    <SelectItem value="entreprise-desc">Entreprise (Z-A)</SelectItem>
                    <SelectItem value="createdAt-desc">Plus récent</SelectItem>
                    <SelectItem value="createdAt-asc">Plus ancien</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stunning Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedClients.map((client) => (
          <div key={client.id} className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-3xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <Card className="relative border-2 border-purple-200/50 shadow-2xl bg-gradient-to-br from-white to-purple-50/30 rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02]">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-2">
                      {client.nom}
                    </h3>
                    {client.entreprise && (
                      <div className="flex items-center text-purple-700 text-sm mb-2 font-semibold">
                        <Building2 className="w-4 h-4 mr-2" />
                        {client.entreprise}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300 border-2 px-3 py-1 font-bold shadow-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Client
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-purple-100">
                          <MoreVertical className="h-5 w-5 text-purple-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-2 border-purple-200">
                        <DropdownMenuItem onClick={() => handleEdit(client)} className="font-semibold">
                          <Edit className="w-4 h-4 mr-2 text-purple-600" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 font-semibold"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-purple-700 bg-purple-50 p-3 rounded-xl">
                    <Phone className="w-5 h-5 mr-3 text-pink-600" />
                    <span className="font-bold">{client.telephone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center text-sm text-blue-700 bg-blue-50 p-3 rounded-xl">
                      <Mail className="w-5 h-5 mr-3 text-blue-600" />
                      <span className="truncate font-semibold">{client.email}</span>
                    </div>
                  )}
                  {client.localisation && (
                    <div className="flex items-center text-sm text-pink-700 bg-pink-50 p-3 rounded-xl">
                      <MapPin className="w-5 h-5 mr-3 text-pink-600" />
                      <span className="font-semibold">{client.localisation}</span>
                    </div>
                  )}
                  {client.secteur_activite && (
                    <div className="flex items-center text-sm text-purple-700 bg-purple-50 p-3 rounded-xl">
                      <Briefcase className="w-5 h-5 mr-3 text-purple-600" />
                      <span className="font-semibold">{client.secteur_activite}</span>
                    </div>
                  )}
                  <div className="flex items-center text-xs text-purple-600 pt-2 border-t-2 border-purple-200 font-bold">
                    <Calendar className="w-4 h-4 mr-2" />
                    Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(client)}
                    className="flex-1 h-11 border-2 border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-400 font-bold rounded-xl text-purple-700"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      
      {/* Stunning Empty State */}
      {filteredAndSortedClients.length === 0 && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-20"></div>
          <Card className="relative border-2 border-purple-200/50 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl">
            <CardContent className="p-16">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-2xl opacity-30"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <Users className="w-12 h-12 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {searchTerm || filterSector !== 'all' ? '🔍 Aucun résultat' : '👋 Aucun client trouvé'}
                </h3>
                <p className="text-base mb-8 max-w-md mx-auto text-purple-700/70 font-medium">
                  {searchTerm || filterSector !== 'all' 
                    ? 'Essayez de modifier vos critères de recherche ou filtres'
                    : 'Commencez par créer votre premier client pour développer votre portefeuille'
                  }
                </p>
                {!searchTerm && filterSector === 'all' && (
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50"></div>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="relative h-14 px-8 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-2xl shadow-xl"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Créer mon premier client
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default ClientPage;