"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Package, Truck, Calendar, Weight, MapPin, Eye, Edit, MoreHorizontal, Download, Filter, Search, CheckCircle2, Car, TrendingUp, AlertCircle } from "lucide-react";
import { getConteneursArrives, markConteneurAsDecharge } from '@/lib/actions/conteneur';
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Conteneur {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  totalPackages?: string | null;
  grossWeight?: string | null;
  netWeight?: string | null;
  stuffingMap?: string | null;
  etapeConteneur: string;
  dateEmbarquement?: Date | null;
  dateArriveProbable?: Date | null;
  createdAt: Date;
  commandes: Commande[];
}

interface Commande {
  id: string;
  nbr_portes: string;
  transmission: string;
  etapeCommande: string;
  motorisation: string;
  couleur: string;
  date_livraison: Date;
  client: {
    id: string;
    nom: string;
    email?: string | null;
    telephone: string;
  };
  voitureModel?: {
    id: string;
    model: string;
  } | null;
  fournisseurs: {
    id: string;
    nom: string;
  }[];
}

export default function CommandesArriveesPage() {
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedConteneurs, setExpandedConteneurs] = useState<Set<string>>(new Set());
  const [processingConteneur, setProcessingConteneur] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchConteneurs = async () => {
      const result = await getConteneursArrives();
      if (result.success && result.data) {
        setConteneurs(result.data);
      }
      setLoading(false);
    };

    fetchConteneurs();
  }, []);

  const toggleConteneur = (conteneurId: string) => {
    const newExpanded = new Set(expandedConteneurs);
    if (newExpanded.has(conteneurId)) {
      newExpanded.delete(conteneurId);
    } else {
      newExpanded.add(conteneurId);
    }
    setExpandedConteneurs(newExpanded);
  };

  const handleDecharge = async (conteneurId: string) => {
    setProcessingConteneur(conteneurId);
    try {
      const result = await markConteneurAsDecharge(conteneurId);
      if (result.success) {
        const updatedResult = await getConteneursArrives();
        if (updatedResult.success && updatedResult.data) {
          setConteneurs(updatedResult.data);
        }
      }
    } catch (error) {
      console.error('Error processing decharge:', error);
    } finally {
      setProcessingConteneur(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ARRIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'TRANSITE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RENSEIGNEE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCommandeAction = (action: string, commandeId: string) => {
    console.log(`Action: ${action} for commande: ${commandeId}`);
    // Implement specific actions here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="relative">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
            <div className="absolute inset-0 h-16 w-16 mx-auto bg-green-500/20 rounded-full animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chargement en cours...</h2>
          <p className="text-gray-500">Récupération des conteneurs arrivés</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: conteneurs.length,
    totalCommandes: conteneurs.reduce((acc, c) => acc + c.commandes.length, 0),
    totalPackages: conteneurs.reduce((acc, c) => acc + (parseInt(c.totalPackages || '0') || 0), 0),
    totalWeight: conteneurs.reduce((acc, c) => acc + (parseFloat(c.grossWeight || '0') || 0), 0)
  };

  const filteredConteneurs = conteneurs.filter(conteneur => 
    searchTerm === '' || 
    conteneur.conteneurNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conteneur.sealNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10" />
              Conteneurs Arrivés
            </h1>
            <p className="text-green-50 text-lg">
              Gestion des conteneurs arrivés au port - Prêts pour déchargement
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
              <div className="text-5xl font-bold">{conteneurs.length}</div>
              <div className="text-sm text-green-50">Arrivés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Conteneurs</CardTitle>
              <div className="p-3 bg-green-500 rounded-xl shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{stats.total}</div>
            <p className="text-sm text-gray-500 mt-1">Arrivés au port</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Commandes</CardTitle>
              <div className="p-3 bg-emerald-500 rounded-xl shadow-md">
                <Car className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-600">{stats.totalCommandes}</div>
            <p className="text-sm text-gray-500 mt-1">Total commandes</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Colis Total</CardTitle>
              <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{stats.totalPackages}</div>
            <p className="text-sm text-gray-500 mt-1">Paquets totaux</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Poids Total</CardTitle>
              <div className="p-3 bg-orange-500 rounded-xl shadow-md">
                <Weight className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">{stats.totalWeight.toFixed(0)}</div>
            <p className="text-sm text-gray-500 mt-1">Kilogrammes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-green-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Rechercher par numéro de conteneur ou sceau..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 w-full bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      {filteredConteneurs.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-white shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {searchTerm ? 'Aucun résultat' : 'Aucun conteneur arrivé'}
            </h3>
            <p className="text-gray-500 text-center max-w-md text-lg">
              {searchTerm 
                ? `Aucun conteneur ne correspond à "${searchTerm}".` 
                : "Les conteneurs avec le statut ARRIVÉE apparaîtront ici."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredConteneurs.map((conteneur) => (
            <Card key={conteneur.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-green-200 bg-white">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="cursor-pointer hover:bg-green-50/50 transition-colors bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200"
                    onClick={() => toggleConteneur(conteneur.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          {expandedConteneurs.has(conteneur.id) ? (
                            <ChevronDown className="h-6 w-6 text-green-600" />
                          ) : (
                            <ChevronRight className="h-6 w-6 text-green-600" />
                          )}
                          <div className="p-3 bg-green-500 rounded-xl shadow-md">
                            <Truck className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                            Conteneur {conteneur.conteneurNumber}
                            <Badge className="bg-green-100 text-green-700 border-2 border-green-300 font-bold px-4 py-1.5">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {conteneur.etapeConteneur}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-4 mt-3 text-base">
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="text-gray-700">Sceau: <span className="font-mono font-bold text-gray-900">{conteneur.sealNumber}</span></span>
                            </span>
                            <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                              <Calendar className="h-4 w-4 text-gray-600" />
                              <span className="text-gray-700">Créé le {new Date(conteneur.createdAt).toLocaleDateString('fr-FR')}</span>
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-4">
                          {conteneur.totalPackages && (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                              <Package className="h-5 w-5 text-blue-600" />
                              <span className="font-bold text-blue-900">{conteneur.totalPackages}</span>
                              <span className="text-xs text-blue-600">colis</span>
                            </div>
                          )}
                          {conteneur.grossWeight && (
                            <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                              <Weight className="h-5 w-5 text-orange-600" />
                              <span className="font-bold text-orange-900">{conteneur.grossWeight}</span>
                              <span className="text-xs text-orange-600">kg</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold px-4 py-2">
                            {conteneur.commandes.length} commande{conteneur.commandes.length !== 1 ? 's' : ''}
                          </Badge>
                          <Button 
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecharge(conteneur.id);
                            }}
                            disabled={processingConteneur === conteneur.id}
                          >
                            {processingConteneur === conteneur.id ? 'Traitement...' : 'Décharger'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-6 p-8 bg-gray-50">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-md">
                            <Car className="h-6 w-6 text-white" />
                          </div>
                          Commandes Associées
                        </h3>
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold px-4 py-2 shadow-md">
                          {conteneur.commandes.length} commande{conteneur.commandes.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      {conteneur.commandes.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-500 text-lg">Aucune commande associée à ce conteneur</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                                <TableHead className="font-bold text-gray-700 py-4 text-base">Client</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-base">Véhicule</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-base">Spécifications</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-base">Livraison</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-base">Statut</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-base">Fournisseurs</TableHead>
                                <TableHead className="font-bold text-gray-700 py-4 text-center text-base">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {conteneur.commandes.map((commande, index) => (
                                <TableRow 
                                  key={commande.id} 
                                  className={`hover:bg-green-50/50 transition-all duration-200 ${
                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  }`}
                                >
                                  <TableCell className="py-4">
                                    <div className="space-y-1">
                                      <p className="font-bold text-gray-900">{commande.client.nom}</p>
                                      <p className="text-sm text-blue-600 font-medium">{commande.client.telephone}</p>
                                      {commande.client.email && (
                                        <p className="text-xs text-gray-500">{commande.client.email}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="space-y-1">
                                      <p className="font-bold text-gray-900">{commande.voitureModel?.model || 'N/A'}</p>
                                      <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-xs">{commande.couleur}</Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500">Portes:</span>
                                        <Badge variant="outline" className="text-xs font-bold">{commande.nbr_portes}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500">Trans:</span>
                                        <span className="text-xs font-bold text-gray-800">{commande.transmission}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500">Motor:</span>
                                        <span className="text-xs font-bold text-gray-800">{commande.motorisation}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-gray-500" />
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {new Date(commande.date_livraison).toLocaleDateString('fr-FR', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <Badge 
                                      variant="outline" 
                                      className={`${getStatusColor(commande.etapeCommande)} text-xs px-3 py-1.5 font-bold border-2`}
                                    >
                                      {commande.etapeCommande}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex flex-wrap gap-1">
                                      {commande.fournisseurs.map((fournisseur) => (
                                        <Badge 
                                          key={fournisseur.id} 
                                          className="bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs px-2 py-1 font-medium"
                                        >
                                          {fournisseur.nom}
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-2 hover:bg-green-50">
                                          <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => handleCommandeAction('view', commande.id)} className="cursor-pointer">
                                          <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                          <span className="font-medium">Voir détails</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCommandeAction('edit', commande.id)} className="cursor-pointer">
                                          <Edit className="h-4 w-4 mr-2 text-orange-600" />
                                          <span className="font-medium">Modifier</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCommandeAction('process', commande.id)} className="cursor-pointer">
                                          <Package className="h-4 w-4 mr-2 text-green-600" />
                                          <span className="font-medium">Traiter</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}