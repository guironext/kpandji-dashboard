"use client";

import React, { useState } from 'react'
import { getConteneursRenseignes, markConteneurAsArrive } from '@/lib/actions/conteneur'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Car, User, CheckCircle, Truck, Package, Weight, Ruler, MapPin, ArrowRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  updatedAt: Date;
  commandes: Commande[];
  subcases: unknown[];
  verifications: unknown[];
  voitures: unknown[];
}

interface Commande {
  id: string;
  nbr_portes: string;
  transmission: string;
  motorisation: string;
  couleur: string;
  date_livraison: Date;
  client: {
    id: string;
    nom: string;
    email: string | null;
    telephone: string;
  };
  voitureModel?: {
    id: string;
    model: string;
  } | null;
  fournisseurs: unknown[];
}

const Page = () => {
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [processingConteneur, setProcessingConteneur] = useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getConteneursRenseignes()
        
        if (result.success) {
          setConteneurs(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredConteneurs = conteneurs.filter(conteneur =>
    conteneur.conteneurNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conteneur.sealNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conteneur.commandes.some(commande => 
      commande.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.voitureModel?.model.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleMarkAsArrive = async (conteneurId: string) => {
    setProcessingConteneur(conteneurId)
    try {
      const result = await markConteneurAsArrive(conteneurId)
      if (result.success) {
        // Refresh the data
        const updatedResult = await getConteneursRenseignes()
        if (updatedResult.success) {
          setConteneurs(updatedResult.data || [])
        }
      }
    } catch (error) {
      console.error('Error marking conteneur as arrive:', error)
    } finally {
      setProcessingConteneur(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="relative">
            <Truck className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-bounce" />
            <div className="absolute inset-0 h-16 w-16 mx-auto bg-blue-500/20 rounded-full animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chargement en cours...</h2>
          <p className="text-gray-500">Récupération des conteneurs renseignés</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: conteneurs.length,
    totalCommandes: conteneurs.reduce((acc, c) => acc + c.commandes.length, 0),
    withDates: conteneurs.filter(c => c.dateArriveProbable).length,
    totalPackages: conteneurs.reduce((acc, c) => acc + (parseInt(c.totalPackages || '0') || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Truck className="h-10 w-10" />
              Conteneurs Renseignés
            </h1>
            <p className="text-blue-50 text-lg">
              Suivi des conteneurs en transit avec informations complètes
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
              <div className="text-5xl font-bold">{conteneurs.length}</div>
              <div className="text-sm text-blue-50">Conteneurs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, sceau, client ou modèle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 w-full bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Total Conteneurs</CardTitle>
              <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-sm text-gray-500 mt-1">Renseignés</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-cyan-200 bg-gradient-to-br from-white to-cyan-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Commandes</CardTitle>
              <div className="p-3 bg-cyan-500 rounded-xl shadow-md">
                <Car className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-cyan-600">{stats.totalCommandes}</div>
            <p className="text-sm text-gray-500 mt-1">Au total</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Avec Date</CardTitle>
              <div className="p-3 bg-purple-500 rounded-xl shadow-md">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">{stats.withDates}</div>
            <p className="text-sm text-gray-500 mt-1">Arrivée prévue</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Colis Total</CardTitle>
              <div className="p-3 bg-orange-500 rounded-xl shadow-md">
                <Weight className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">{stats.totalPackages}</div>
            <p className="text-sm text-gray-500 mt-1">Paquets</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {filteredConteneurs.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-white shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full mb-6">
              <Package className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Aucun conteneur trouvé</h3>
            <p className="text-gray-500 text-center max-w-md text-lg">
              {searchTerm ? 
                `Aucun conteneur ne correspond à "${searchTerm}".` : 
                "Il n'y a actuellement aucun conteneur avec le statut RENSEIGNE."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredConteneurs.map((conteneur) => {
            const daysUntilArrival = conteneur.dateArriveProbable 
              ? Math.ceil((new Date(conteneur.dateArriveProbable).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null
            const isArrivalSoon = daysUntilArrival !== null && daysUntilArrival <= 7 && daysUntilArrival >= 0
            
            return (
              <Card 
                key={conteneur.id} 
                className={`group hover:shadow-2xl transition-all duration-300 border-2 ${
                  isArrivalSoon ? 'border-orange-300 bg-gradient-to-br from-white to-orange-50' : 'border-blue-200 bg-white'
                }`}
              >
                <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                          <Truck className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                          Conteneur #{conteneur.conteneurNumber}
                        </CardTitle>
                      </div>
                      <CardDescription className="flex flex-wrap items-center gap-4 text-base">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                          <Ruler className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-700">Sceau: {conteneur.sealNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                          <Calendar className="h-4 w-4 text-gray-600" />
                          <span className="text-gray-600">Créé le {new Date(conteneur.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </CardDescription>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <Badge 
                        variant="outline" 
                        className="bg-green-100 text-green-700 border-green-300 font-semibold px-4 py-2"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Renseigné
                      </Badge>
                      <Button 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                        onClick={() => handleMarkAsArrive(conteneur.id)}
                        disabled={processingConteneur === conteneur.id}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {processingConteneur === conteneur.id ? 'Traitement...' : 'Marquer Arrivé'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-6">
                  {/* Enhanced Conteneur Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {conteneur.totalPackages && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Package className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-blue-700 uppercase">Colis</span>
                        </div>
                        <span className="text-3xl font-bold text-blue-900">{conteneur.totalPackages}</span>
                      </div>
                    )}
                    {conteneur.grossWeight && (
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-orange-500 rounded-lg">
                            <Weight className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-orange-700 uppercase">Poids Brut</span>
                        </div>
                        <span className="text-3xl font-bold text-orange-900">{conteneur.grossWeight} <span className="text-lg">kg</span></span>
                      </div>
                    )}
                    {conteneur.netWeight && (
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <Weight className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-green-700 uppercase">Poids Net</span>
                        </div>
                        <span className="text-3xl font-bold text-green-900">{conteneur.netWeight} <span className="text-lg">kg</span></span>
                      </div>
                    )}
                    {conteneur.dateArriveProbable && (
                      <div className={`rounded-xl p-4 border-2 shadow-sm ${
                        isArrivalSoon 
                          ? 'bg-gradient-to-br from-orange-50 to-red-100 border-orange-300' 
                          : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-2 rounded-lg ${isArrivalSoon ? 'bg-orange-500' : 'bg-purple-500'}`}>
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                          <span className={`text-xs font-semibold uppercase ${isArrivalSoon ? 'text-orange-700' : 'text-purple-700'}`}>
                            Arrivée Prévue
                          </span>
                        </div>
                        <div className={`text-xl font-bold ${isArrivalSoon ? 'text-orange-900' : 'text-purple-900'}`}>
                          {new Date(conteneur.dateArriveProbable).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        {isArrivalSoon && daysUntilArrival !== null && (
                          <div className="text-xs text-orange-700 font-medium mt-1">
                            Dans {daysUntilArrival} jour{daysUntilArrival > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Commandes Section */}
                  {conteneur.commandes && conteneur.commandes.length > 0 && (
                    <div className="pt-6 border-t-2 border-gray-200">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
                          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-md">
                            <Car className="h-6 w-6 text-white" />
                          </div>
                          Commandes Associées
                        </h4>
                        <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold px-4 py-2 text-base shadow-md">
                          {conteneur.commandes.length} commande{conteneur.commandes.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {conteneur.commandes.map((commande) => (
                          <Card key={commande.id} className="group/commande hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                                    <span className="font-bold text-sm text-gray-700">
                                      #{commande.id.slice(0, 8).toUpperCase()}
                                    </span>
                                  </div>
                                  <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-medium px-3 py-1">
                                    {commande.voitureModel?.model || 'N/A'}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                  <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                                    <User className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-800">{commande.client.nom}</p>
                                    <p className="text-xs text-blue-600 font-medium">{commande.client.telephone}</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500 font-medium mb-1">Portes</div>
                                    <div className="font-bold text-gray-800">{commande.nbr_portes}</div>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500 font-medium mb-1">Transmission</div>
                                    <div className="font-bold text-gray-800">{commande.transmission}</div>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500 font-medium mb-1">Motorisation</div>
                                    <div className="font-bold text-gray-800">{commande.motorisation}</div>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="text-xs text-gray-500 font-medium mb-1">Couleur</div>
                                    <div className="font-bold text-gray-800 capitalize">{commande.couleur}</div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
                                  <div className="p-2 bg-amber-500 rounded-lg">
                                    <Calendar className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-amber-700 font-semibold">Livraison prévue</p>
                                    <p className="text-sm font-bold text-amber-900">
                                      {new Date(commande.date_livraison).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Page