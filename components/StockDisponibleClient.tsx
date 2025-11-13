"use client"

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Car, 
  Search, 
  Calendar,
  Package,
  Palette,
  Gauge,
  Settings,
  DoorOpen,
  Tag,
  Filter,
  Grid3x3,
  LayoutList,
  TrendingUp,
  Eye
} from "lucide-react"
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Commande = {
  id: string
  couleur: string
  motorisation: string
  transmission: string
  nbr_portes: string
  commandeFlag: string
  etapeCommande: string
  prix_unitaire: string | null
  date_livraison: string
  createdAt: string
  updatedAt: string
  voitureModel: {
    id: string
    model: string
    image: string | null
    description: string | null
    createdAt: string
    updatedAt: string
  } | null
  client: {
    id: string
    nom: string
    email: string | null
    telephone: string
    createdAt: string
    updatedAt: string
  } | null
  clientEntreprise: {
    id: string
    nom_entreprise: string
    email: string | null
    telephone: string
    createdAt: string
    updatedAt: string
  } | null
  conteneur: {
    id: string
    conteneurNumber: string
    sealNumber: string
    etapeConteneur: string
    dateEmbarquement: string | null
    dateArriveProbable: string | null
    createdAt: string
    updatedAt: string
  } | null
}

interface StockDisponibleClientProps {
  commandes: Commande[]
}

const StockDisponibleClient = ({ commandes }: StockDisponibleClientProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMotorisation, setFilterMotorisation] = useState<string>('all')
  const [filterTransmission, setFilterTransmission] = useState<string>('all')
  const [filterEtape, setFilterEtape] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null)

  // Debug: Log commandes with images
  React.useEffect(() => {
    const commandesWithImages = commandes.filter(c => c.voitureModel?.image)
    console.log('Total commandes:', commandes.length)
    console.log('Commandes with images:', commandesWithImages.length)
    if (commandesWithImages.length > 0) {
      console.log('Sample image URL:', commandesWithImages[0].voitureModel?.image)
    }
  }, [commandes])

  // Get unique values for filters
  const motorisations = useMemo(() => {
    return Array.from(new Set(commandes.map(c => c.motorisation)))
  }, [commandes])

  const transmissions = useMemo(() => {
    return Array.from(new Set(commandes.map(c => c.transmission)))
  }, [commandes])

  const etapes = useMemo(() => {
    return Array.from(new Set(commandes.map(c => c.etapeCommande)))
  }, [commandes])

  // Filter commandes
  const filteredCommandes = useMemo(() => {
    return commandes.filter(commande => {
      const matchSearch = 
        commande.voitureModel?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.couleur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.client?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.clientEntreprise?.nom_entreprise.toLowerCase().includes(searchTerm.toLowerCase())

      const matchMotorisation = filterMotorisation === 'all' || commande.motorisation === filterMotorisation
      const matchTransmission = filterTransmission === 'all' || commande.transmission === filterTransmission
      const matchEtape = filterEtape === 'all' || commande.etapeCommande === filterEtape

      return matchSearch && matchMotorisation && matchTransmission && matchEtape
    })
  }, [commandes, searchTerm, filterMotorisation, filterTransmission, filterEtape])

  // Group commandes by model for statistics
  const statistics = useMemo(() => {
    const grouped = filteredCommandes.reduce((acc, cmd) => {
      const model = cmd.voitureModel?.model || 'Inconnu'
      if (!acc[model]) {
        acc[model] = { count: 0, colors: new Set() }
      }
      acc[model].count++
      acc[model].colors.add(cmd.couleur)
      return acc
    }, {} as Record<string, { count: number; colors: Set<string> }>)

    return Object.entries(grouped).map(([model, data]) => ({
      model,
      count: data.count,
      colorsCount: data.colors.size
    }))
  }, [filteredCommandes])

  const getEtapeColor = (etape: string) => {
    const colors: Record<string, string> = {
      PROPOSITION: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      VALIDE: 'bg-blue-100 text-blue-800 border-blue-300',
      TRANSITE: 'bg-purple-100 text-purple-800 border-purple-300',
      RENSEIGNEE: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      ARRIVE: 'bg-green-100 text-green-800 border-green-300',
      VERIFIER: 'bg-teal-100 text-teal-800 border-teal-300',
      MONTAGE: 'bg-orange-100 text-orange-800 border-orange-300',
      TESTE: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      PARKING: 'bg-gray-100 text-gray-800 border-gray-300',
    }
    return colors[etape] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getTransmissionIcon = (transmission: string) => {
    return transmission === 'AUTOMATIQUE' ? '🔄' : '⚙️'
  }

  const getMotorisationIcon = (motorisation: string) => {
    const icons: Record<string, string> = {
      ELECTRIQUE: '⚡',
      ESSENCE: '⛽',
      DIESEL: '🛢️',
      HYBRIDE: '🔋'
    }
    return icons[motorisation] || '🚗'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Stock Disponible
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez et consultez tous les véhicules disponibles en stock
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredCommandes.length} véhicule{filteredCommandes.length !== 1 ? 's' : ''} disponible{filteredCommandes.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-500" />
              Total Véhicules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filteredCommandes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">En stock disponible</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Modèles Différents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Types de véhicules</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-500" />
              Variétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statistics.reduce((sum, s) => sum + s.colorsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combinaisons couleur</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterMotorisation} onValueChange={setFilterMotorisation}>
              <SelectTrigger>
                <SelectValue placeholder="Motorisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes motorisations</SelectItem>
                {motorisations.map(m => (
                  <SelectItem key={m} value={m}>
                    {getMotorisationIcon(m)} {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTransmission} onValueChange={setFilterTransmission}>
              <SelectTrigger>
                <SelectValue placeholder="Transmission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes transmissions</SelectItem>
                {transmissions.map(t => (
                  <SelectItem key={t} value={t}>
                    {getTransmissionIcon(t)} {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterEtape} onValueChange={setFilterEtape}>
              <SelectTrigger>
                <SelectValue placeholder="Étape" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes étapes</SelectItem>
                {etapes.map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Grille
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4 mr-2" />
                Liste
              </Button>
            </div>

            {(searchTerm || filterMotorisation !== 'all' || filterTransmission !== 'all' || filterEtape !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setFilterMotorisation('all')
                  setFilterTransmission('all')
                  setFilterEtape('all')
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commandes Display */}
      {filteredCommandes.length === 0 ? (
        <Card className="border-2 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun véhicule trouvé</h3>
            <p className="text-muted-foreground text-center">
              Aucun véhicule ne correspond à vos critères de recherche.
              <br />
              Essayez d&apos;ajuster vos filtres.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommandes.map((commande) => (
            <Card key={commande.id} className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
               {/* Image Section */}
               <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                 {commande.voitureModel?.image ? (
                   <Image
                     src={commande.voitureModel.image}
                     alt={commande.voitureModel.model}
                     fill
                     className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                     unoptimized={commande.voitureModel.image.startsWith('/externes/')}
                   />
                 ) : (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Car className="h-24 w-24 text-gray-400" />
                   </div>
                 )}
                <div className="absolute top-3 right-3">
                  <Badge className={`${getEtapeColor(commande.etapeCommande)} border`}>
                    {commande.etapeCommande}
                  </Badge>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-green-500 text-white border-0">
                    Disponible
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold line-clamp-1">
                  {commande.voitureModel?.model || 'Modèle Inconnu'}
                </CardTitle>
                {commande.voitureModel?.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {commande.voitureModel.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Specifications */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Couleur</p>
                      <p className="font-semibold capitalize">{commande.couleur}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Gauge className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Motorisation</p>
                      <p className="font-semibold text-xs">{getMotorisationIcon(commande.motorisation)} {commande.motorisation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Transmission</p>
                      <p className="font-semibold text-xs">{getTransmissionIcon(commande.transmission)} {commande.transmission}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <DoorOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Portes</p>
                      <p className="font-semibold">{commande.nbr_portes}</p>
                    </div>
                  </div>
                </div>

                {/* Price and Date */}
                <div className="pt-3 border-t space-y-2">
                  {commande.prix_unitaire && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        Prix unitaire
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {parseFloat(commande.prix_unitaire).toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Livraison prévue
                    </span>
                    <span className="font-medium">
                      {format(new Date(commande.date_livraison), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>

                {/* Container Info */}
                {commande.conteneur && (
                  <div className="pt-3 border-t">
                    <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-semibold text-slate-700">Conteneur: {commande.conteneur.conteneurNumber}</p>
                      <Badge variant="outline" className="text-xs">
                        {commande.conteneur.etapeConteneur}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => setSelectedCommande(commande)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les détails
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {filteredCommandes.map((commande) => (
            <Card key={commande.id} className="border-2 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                   {/* Image */}
                   <div className="relative h-32 w-48 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                     {commande.voitureModel?.image ? (
                       <Image
                         src={commande.voitureModel.image}
                         alt={commande.voitureModel.model}
                         fill
                         className="object-contain p-2"
                         sizes="200px"
                         unoptimized={commande.voitureModel.image.startsWith('/externes/')}
                       />
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center">
                         <Car className="h-16 w-16 text-gray-400" />
                       </div>
                     )}
                   </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{commande.voitureModel?.model || 'Modèle Inconnu'}</h3>
                        {commande.voitureModel?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {commande.voitureModel.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`${getEtapeColor(commande.etapeCommande)} border`}>
                          {commande.etapeCommande}
                        </Badge>
                        <Badge variant="secondary" className="bg-green-500 text-white border-0">
                          Disponible
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Couleur</p>
                        <p className="font-semibold capitalize flex items-center gap-1">
                          <Palette className="h-4 w-4" />
                          {commande.couleur}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Motorisation</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          {getMotorisationIcon(commande.motorisation)} {commande.motorisation}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Transmission</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          {getTransmissionIcon(commande.transmission)} {commande.transmission}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Portes</p>
                        <p className="font-semibold flex items-center gap-1">
                          <DoorOpen className="h-4 w-4" />
                          {commande.nbr_portes}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-6">
                        {commande.prix_unitaire && (
                          <div>
                            <p className="text-xs text-muted-foreground">Prix unitaire</p>
                            <p className="text-lg font-bold text-primary">
                              {parseFloat(commande.prix_unitaire).toLocaleString('fr-FR')} FCFA
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Livraison prévue</p>
                          <p className="font-medium">
                            {format(new Date(commande.date_livraison), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                        {commande.conteneur && (
                          <div>
                            <p className="text-xs text-muted-foreground">Conteneur</p>
                            <p className="font-medium">{commande.conteneur.conteneurNumber}</p>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedCommande(commande)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCommande && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCommande(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedCommande.voitureModel?.model || 'Modèle Inconnu'}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCommande(null)}>✕</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* Large Image */}
               <div className="relative h-64 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                 {selectedCommande.voitureModel?.image ? (
                   <Image
                     src={selectedCommande.voitureModel.image}
                     alt={selectedCommande.voitureModel.model}
                     fill
                     className="object-contain p-4"
                     sizes="(max-width: 768px) 100vw, 700px"
                     unoptimized={selectedCommande.voitureModel.image.startsWith('/externes/')}
                   />
                 ) : (
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Car className="h-32 w-32 text-gray-400" />
                   </div>
                 )}
               </div>

              {/* Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Spécifications</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Palette className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Couleur</p>
                        <p className="font-semibold capitalize">{selectedCommande.couleur}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Gauge className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Motorisation</p>
                        <p className="font-semibold">{getMotorisationIcon(selectedCommande.motorisation)} {selectedCommande.motorisation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Settings className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Transmission</p>
                        <p className="font-semibold">{getTransmissionIcon(selectedCommande.transmission)} {selectedCommande.transmission}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <DoorOpen className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Portes</p>
                        <p className="font-semibold">{selectedCommande.nbr_portes}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCommande.voitureModel?.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedCommande.voitureModel.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Informations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-muted-foreground">Statut</span>
                      <Badge className={getEtapeColor(selectedCommande.etapeCommande)}>
                        {selectedCommande.etapeCommande}
                      </Badge>
                    </div>
                    {selectedCommande.prix_unitaire && (
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-muted-foreground">Prix unitaire</span>
                        <span className="font-bold text-primary">
                          {parseFloat(selectedCommande.prix_unitaire).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-muted-foreground">Date de livraison</span>
                      <span className="font-medium">
                        {format(new Date(selectedCommande.date_livraison), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="text-muted-foreground">Créé le</span>
                      <span className="font-medium">
                        {format(new Date(selectedCommande.createdAt), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedCommande.conteneur && (
                  <div>
                    <h4 className="font-semibold mb-2">Conteneur</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-muted-foreground">Numéro</span>
                        <span className="font-medium">{selectedCommande.conteneur.conteneurNumber}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-muted-foreground">Sceau</span>
                        <span className="font-medium">{selectedCommande.conteneur.sealNumber}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span className="text-muted-foreground">Étape</span>
                        <Badge variant="outline">{selectedCommande.conteneur.etapeConteneur}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default StockDisponibleClient

