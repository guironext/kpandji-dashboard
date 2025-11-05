"use client";

import React, { useState, useEffect } from 'react'
import { getSparePartsRanges } from '@/lib/actions/conteneur'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package, Archive, Car, User, Calendar, Hash, CheckCircle, AlertCircle, Search, Filter, Download, Eye, MapPin, Clock, Building2 } from 'lucide-react'

interface SparePartRange {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  etapeSparePart: string;
  statusVerification: string;
  createdAt: Date;
  updatedAt: Date;
  commande?: {
    id: string;
    nbr_portes: string;
    transmission: string;
    motorisation: string;
    couleur: string;
    date_livraison: Date;
    voitureModel?: {
      id: string;
      model: string;
    } | null;
    client?: {
      id: string;
      nom: string;
      entreprise?: string | null;
    } | null;
  } | null;
  voiture?: {
    id: string;
    nbr_portes: string;
    transmission: string;
    motorisation: string;
    couleur: string;
    voitureModel?: {
      id: string;
      model: string;
    } | null;
    commande?: {
      id: string;
      client?: {
        id: string;
        nom: string;
        entreprise?: string | null;
      } | null;
    } | null;
  } | null;
  Storage?: {
    id: string;
    storageNumber: string | null;
    porte_Number: string | null;
    rayon: string | null;
    etage: string | null;
    caseNumber: string | null;
  } | null;
  subcase?: {
    id: string;
    subcaseNumber: string;
    conteneur: {
      id: string;
      conteneurNumber: string;
    };
  } | null;
}

const StockPage = () => {
  const [spareParts, setSpareParts] = useState<SparePartRange[]>([])
  const [filteredParts, setFilteredParts] = useState<SparePartRange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModel, setSelectedModel] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSparePartsRanges()
        if (result.success && result.data) {
          setSpareParts(result.data)
          setFilteredParts(result.data)
        } else {
          setError(result.error || 'Erreur de chargement')
        }
      } catch (err) {
        setError('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = spareParts

    if (searchTerm) {
      filtered = filtered.filter(part => 
        part.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (part.partNameFrench && part.partNameFrench.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedModel !== 'all') {
      filtered = filtered.filter(part => {
        const model = part.commande?.voitureModel?.model || part.voiture?.voitureModel?.model
        return model === selectedModel
      })
    }

    setFilteredParts(filtered)
  }, [searchTerm, selectedModel, spareParts])

  const uniqueModels = Array.from(new Set(
    spareParts.map(sp => sp.commande?.voitureModel?.model || sp.voiture?.voitureModel?.model).filter(Boolean)
  ))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Chargement des pièces rangées</h3>
            <p className="text-muted-foreground">Récupération des données en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
              <Archive className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Stock - Pièces Rangées
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Gestion centralisée des pièces en stock avec informations détaillées
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par code, nom ou nom français..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-64">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">Tous les modèles</option>
                {uniqueModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
        
        {/* Enhanced Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-700">{filteredParts.length}</p>
                <p className="text-sm text-blue-600 font-medium">Pièces rangées</p>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-700">{uniqueModels.length}</p>
                <p className="text-sm text-green-600 font-medium">Modèles de voiture</p>
              </div>
              <Car className="w-12 h-12 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-700">
                  {filteredParts.reduce((acc, sp) => acc + sp.quantity, 0)}
                </p>
                <p className="text-sm text-purple-600 font-medium">Quantité totale</p>
              </div>
              <Hash className="w-12 h-12 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-700">100%</p>
                <p className="text-sm text-emerald-600 font-medium">Taux de rangement</p>
              </div>
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      {filteredParts.length === 0 ? (
        <Card className="p-16">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">Aucune pièce trouvée</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {searchTerm || selectedModel !== 'all' 
                  ? 'Aucune pièce ne correspond à vos critères de recherche'
                  : 'Les pièces avec statut RANGE apparaîtront ici'
                }
              </p>
            </div>
            {(searchTerm || selectedModel !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedModel('all')
                }}
              >
                Effacer les filtres
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Archive className="w-6 h-6 text-primary" />
                  Pièces Rangées
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {filteredParts.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Inventaire complet des pièces en stock avec détails des commandes et modèles
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Vue détaillée
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-bold text-slate-700 py-4">Code Pièce</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4">Détails Pièce</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4 text-center">Quantité</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4">Modèle Voiture</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4">Commande</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4">Localisation</TableHead>
                    <TableHead className="font-bold text-slate-700 py-4 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((sparePart, index) => {
                    const voitureModel = sparePart.commande?.voitureModel || sparePart.voiture?.voitureModel;
                    const commande = sparePart.commande || sparePart.voiture?.commande;
                    
                    return (
                      <TableRow key={sparePart.id} className={`hover:bg-slate-50/80 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        <TableCell className="py-4">
                          <div className="font-mono text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-md inline-block">
                            {sparePart.partCode}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 max-w-[250px]">
                          <div className="space-y-2">
                            <div className="font-semibold text-slate-800 truncate" title={sparePart.partName}>
                              {sparePart.partName}
                            </div>
                            {sparePart.partNameFrench && (
                              <div className="text-sm text-slate-600 italic bg-slate-50 px-2 py-1 rounded truncate" title={sparePart.partNameFrench}>
                                {sparePart.partNameFrench}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1">
                            {sparePart.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          {voitureModel ? (
                            <div className="flex items-center gap-3 bg-green-50 px-3 py-2 rounded-lg">
                              <Car className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-green-800">{voitureModel.model}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {commande ? (
                            <div className="space-y-2">
                              <div className="font-semibold text-sm text-slate-800 bg-slate-100 px-2 py-1 rounded">
                                #{commande.id.slice(-8)}
                              </div>
                              {'nbr_portes' in commande && (
                                <div className="text-xs text-slate-600 space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {(commande as unknown as { nbr_portes: string; transmission: string; motorisation: string }).nbr_portes} portes • {(commande as unknown as { nbr_portes: string; transmission: string; motorisation: string }).transmission} • {(commande as unknown as { nbr_portes: string; transmission: string; motorisation: string }).motorisation}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date((commande as unknown as { date_livraison: Date }).date_livraison).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {sparePart.Storage ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-600" />
                                <span className="font-semibold text-sm">{sparePart.Storage.storageNumber || 'N/A'}</span>
                              </div>
                              <div className="text-xs text-slate-600 space-y-1">
                                {sparePart.Storage.porte_Number && (
                                  <div>Porte: {sparePart.Storage.porte_Number}</div>
                                )}
                                {sparePart.Storage.rayon && (
                                  <div>Rayon: {sparePart.Storage.rayon}</div>
                                )}
                                {sparePart.Storage.etage && (
                                  <div>Étage: {sparePart.Storage.etage}</div>
                                )}
                                {sparePart.Storage.caseNumber && (
                                  <div>Case: {sparePart.Storage.caseNumber}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2"
                            onClick={() => {
                              // Handle action logic here
                              console.log('Action for spare part:', sparePart.id);
                            }}
                          >
                            Attribuer
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StockPage