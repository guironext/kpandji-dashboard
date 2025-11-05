"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase,
  X,
  Search,
  Loader2,
  Users
} from "lucide-react";
import {
  createFournisseurCommandeLocal,
  getAllFournisseurCommandeLocal,
  deleteFournisseurCommandeLocal,
} from "@/lib/actions/fournisseur-commande-local";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Fournisseur {
  id: string;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  type_Activite?: string | null;
}

export default function FournisseurLocauxPage() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    ville: "",
    code_postal: "",
    pays: "",
    type_Activite: "",
  });

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    setIsLoadingData(true);
    const result = await getAllFournisseurCommandeLocal();
    if (result.success && result.data) {
      setFournisseurs(result.data);
    }
    setIsLoadingData(false);
  };

  const filteredFournisseurs = fournisseurs.filter((f) =>
    f.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.telephone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.ville?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createFournisseurCommandeLocal(formData);
      
      if (result.success) {
        toast.success("Fournisseur créé avec succès");
        setFormData({
          nom: "",
          email: "",
          telephone: "",
          adresse: "",
          ville: "",
          code_postal: "",
          pays: "",
          type_Activite: "",
        });
        setShowForm(false);
        loadFournisseurs();
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur?")) return;

    const result = await deleteFournisseurCommandeLocal(id);
    if (result.success) {
      toast.success("Fournisseur supprimé avec succès");
      loadFournisseurs();
    } else {
      toast.error(result.error || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fournisseurs Locaux
            </h1>
            <p className="text-muted-foreground mt-1">Gérez vos fournisseurs locaux</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            size="lg"
            className="w-full sm:w-auto"
          >
            {showForm ? (
              <>
                <X className="mr-2 h-5 w-5" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Nouveau Fournisseur
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Fournisseurs</p>
                  <p className="text-3xl font-bold mt-2">{fournisseurs.length}</p>
                </div>
                <Users className="h-12 w-12 text-blue-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Avec Email</p>
                  <p className="text-3xl font-bold mt-2">
                    {fournisseurs.filter(f => f.email).length}
                  </p>
                </div>
                <Mail className="h-12 w-12 text-green-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avec Téléphone</p>
                  <p className="text-3xl font-bold mt-2">
                    {fournisseurs.filter(f => f.telephone).length}
                  </p>
                </div>
                <Phone className="h-12 w-12 text-purple-200 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pays Uniques</p>
                  <p className="text-3xl font-bold mt-2">
                    {new Set(fournisseurs.map(f => f.pays).filter(Boolean)).size}
                  </p>
                </div>
                <Globe className="h-12 w-12 text-orange-200 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Section */}
        {showForm && (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Ajouter un Nouveau Fournisseur
              </CardTitle>
              <CardDescription>
                Remplissez les informations du fournisseur local
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de Base */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Informations de Base
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom" className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        Nom du Fournisseur *
                      </Label>
                      <Input
                        id="nom"
                        placeholder="Ex: ABC Supplies"
                        value={formData.nom}
                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type_Activite" className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        Type d&apos;Activité
                      </Label>
                      <Input
                        id="type_Activite"
                        placeholder="Ex: Fourniture industrielle"
                        value={formData.type_Activite}
                        onChange={(e) => setFormData({ ...formData, type_Activite: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Coordonnées
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@fournisseur.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        Téléphone
                      </Label>
                      <Input
                        id="telephone"
                        placeholder="+225 XX XX XX XX XX"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="adresse" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Adresse Complète
                      </Label>
                      <Input
                        id="adresse"
                        placeholder="123 Rue Example"
                        value={formData.adresse}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ville" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Ville
                      </Label>
                      <Input
                        id="ville"
                        placeholder="Ex: Abidjan"
                        value={formData.ville}
                        onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pays" className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        Pays
                      </Label>
                      <Input
                        id="pays"
                        placeholder="Ex: Côte d'Ivoire"
                        value={formData.pays}
                        onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 h-11"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Créer le Fournisseur
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="h-11"
                    size="lg"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Fournisseurs Section */}
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Liste des Fournisseurs
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredFournisseurs.length} fournisseur(s) trouvé(s)
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un fournisseur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fournisseurs Cards Grid */}
          {isLoadingData ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFournisseurs.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                <Building2 className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  {searchTerm ? "Aucun résultat trouvé" : "Aucun fournisseur"}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {searchTerm 
                    ? "Essayez de modifier votre recherche" 
                    : "Commencez par ajouter votre premier fournisseur local"
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setShowForm(true)} 
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un Fournisseur
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFournisseurs.map((fournisseur) => (
                <Card 
                  key={fournisseur.id} 
                  className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 relative overflow-hidden"
                >
                  {/* Gradient Background Decoration */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10 group-hover:opacity-20 transition-opacity" />
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {fournisseur.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg line-clamp-1">
                            {fournisseur.nom}
                          </CardTitle>
                          {fournisseur.type_Activite && (
                            <Badge variant="secondary" className="mt-1 font-normal text-xs">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {fournisseur.type_Activite}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Contact Information */}
                    <div className="space-y-2">
                      {fournisseur.email ? (
                        <div className="flex items-start gap-2 text-sm group/item">
                          <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <a 
                            href={`mailto:${fournisseur.email}`}
                            className="text-muted-foreground hover:text-blue-500 transition-colors break-all"
                          >
                            {fournisseur.email}
                          </a>
                        </div>
                      ) : null}
                      
                      {fournisseur.telephone ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <a 
                            href={`tel:${fournisseur.telephone}`}
                            className="text-muted-foreground hover:text-green-500 transition-colors"
                          >
                            {fournisseur.telephone}
                          </a>
                        </div>
                      ) : null}

                      {!fournisseur.email && !fournisseur.telephone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>Aucun contact renseigné</span>
                        </div>
                      )}
                    </div>

                    {/* Location Information */}
                    {(fournisseur.adresse || fournisseur.ville || fournisseur.pays) && (
                      <div className="pt-2 border-t space-y-2">
                        {fournisseur.adresse && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{fournisseur.adresse}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          {fournisseur.ville && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{fournisseur.ville}</span>
                            </div>
                          )}
                          {fournisseur.pays && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{fournisseur.pays}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(fournisseur.id)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
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