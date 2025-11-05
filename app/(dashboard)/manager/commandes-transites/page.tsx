"use client";

import React, { useState } from 'react'
import { getCommandesTransites } from '@/lib/actions/commande'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Car, User, CheckCircle, Truck, Ship, Package, MapPin, TrendingUp } from 'lucide-react'
import TransiteDialog from '@/components/TransiteDialog';


interface Commande {
  id: string;
  nbr_portes: string;
  transmission: string;
  etapeCommande: string; // Add this field
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
  fournisseurs: Fournisseur[];
  conteneur?: {
    id: string;
    conteneurNumber: string;
    sealNumber: string;
  } | null;
}

interface Fournisseur {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  type_Activite?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const Page = () => {
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getCommandesTransites()
        
        if (result.success) {
          setCommandes(result.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleTransiteClick = (commandeId: string) => {
    setSelectedCommandeId(commandeId)
    setIsDialogOpen(true)
  }

  const handleTransiteSuccess = () => {
    // Refresh the commandes list
    const fetchCommandes = async () => {
      const result = await getCommandesTransites()
      if (result.success) {
        setCommandes(result.data || [])
      }
    }
    fetchCommandes()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="relative">
            <Ship className="h-16 w-16 text-teal-500 mx-auto mb-4 animate-bounce" />
            <div className="absolute inset-0 h-16 w-16 mx-auto bg-teal-500/20 rounded-full animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chargement en cours...</h2>
          <p className="text-gray-500">Récupération des commandes en transit</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: commandes.length,
    withContainer: commandes.filter(c => c.conteneur).length,
    nearDelivery: commandes.filter(c => {
      const daysUntilDelivery = Math.ceil((new Date(c.date_livraison).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDelivery <= 30 && daysUntilDelivery >= 0
    }).length,
    withSuppliers: commandes.filter(c => c.fournisseurs && c.fournisseurs.length > 0).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Ship className="h-10 w-10" />
              Commandes en Transit
            </h1>
            <p className="text-teal-50 text-lg">
              Suivi des commandes validées actuellement en transit maritime
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
              <div className="text-5xl font-bold">{commandes.length}</div>
              <div className="text-sm text-teal-50">En transit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-teal-200 bg-gradient-to-br from-white to-teal-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Total Transit</CardTitle>
              <div className="p-3 bg-teal-500 rounded-xl shadow-md">
                <Ship className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-teal-600">{stats.total}</div>
            <p className="text-sm text-gray-500 mt-1">Commandes en cours</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Avec Conteneur</CardTitle>
              <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{stats.withContainer}</div>
            <p className="text-sm text-gray-500 mt-1">Conteneurs assignés</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-cyan-200 bg-gradient-to-br from-white to-cyan-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Arrivée Proche</CardTitle>
              <div className="p-3 bg-cyan-500 rounded-xl shadow-md">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-cyan-600">{stats.nearDelivery}</div>
            <p className="text-sm text-gray-500 mt-1">Dans les 30 jours</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Fournisseurs</CardTitle>
              <div className="p-3 bg-purple-500 rounded-xl shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">{stats.withSuppliers}</div>
            <p className="text-sm text-gray-500 mt-1">Avec fournisseurs</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {commandes.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-white shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full mb-6">
              <Ship className="h-16 w-16 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Aucune commande en transit</h3>
            <p className="text-gray-500 text-center max-w-md text-lg">
              Il n&apos;y a actuellement aucune commande en transit. 
              Les nouvelles commandes apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {commandes.map((commande) => {
            const daysUntilDelivery = Math.ceil((new Date(commande.date_livraison).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            const isNearDelivery = daysUntilDelivery <= 30 && daysUntilDelivery >= 0
            
            return (
              <Card 
                key={commande.id} 
                className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 ${
                  isNearDelivery ? 'border-cyan-300 bg-gradient-to-br from-white to-cyan-50' : 'border-teal-200 bg-gradient-to-br from-white to-teal-50'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-800 mb-2">
                        #{commande.id.slice(0, 8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">{commande.client.nom}</span>
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="bg-teal-100 text-teal-700 border-teal-300 font-semibold px-3 py-1.5"
                    >
                      <Ship className="h-3.5 w-3.5 mr-1.5" />
                      {commande.etapeCommande}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Car className="h-5 w-5 text-teal-600" />
                      </div>
                      <span className="font-bold text-lg text-gray-800">
                        {commande.voitureModel?.model || 'Modèle non spécifié'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Vehicle Specifications */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1 font-medium">Portes</div>
                      <div className="text-base font-bold text-gray-800">{commande.nbr_portes}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1 font-medium">Transmission</div>
                      <div className="text-base font-bold text-gray-800">{commande.transmission}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1 font-medium">Motorisation</div>
                      <div className="text-base font-bold text-gray-800">{commande.motorisation}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1 font-medium">Couleur</div>
                      <div className="text-base font-bold text-gray-800 capitalize">{commande.couleur}</div>
                    </div>
                  </div>

                  {/* Delivery Date */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isNearDelivery ? 'bg-cyan-50 border-cyan-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      isNearDelivery ? 'bg-cyan-100' : 'bg-gray-100'
                    }`}>
                      <Calendar className={`h-4 w-4 ${
                        isNearDelivery ? 'text-cyan-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-medium ${
                        isNearDelivery ? 'text-cyan-600' : 'text-gray-600'
                      }`}>
                        Livraison prévue
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {new Date(commande.date_livraison).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      {isNearDelivery && (
                        <div className="text-xs text-cyan-600 font-medium mt-0.5">
                          Dans {daysUntilDelivery} jour{daysUntilDelivery > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conteneur Info */}
                  {commande.conteneur && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <Truck className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-700 uppercase">Conteneur</span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {commande.conteneur.conteneurNumber}
                      </div>
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        Sceau: {commande.conteneur.sealNumber}
                      </div>
                    </div>
                  )}

                  {/* Suppliers */}
                  {commande.fournisseurs && commande.fournisseurs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          Fournisseurs ({commande.fournisseurs.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {commande.fournisseurs.map((fournisseur) => (
                          <Badge 
                            key={fournisseur.id} 
                            variant="secondary" 
                            className="bg-purple-100 text-purple-700 border border-purple-200 font-medium px-3 py-1"
                          >
                            {fournisseur.nom}
                          </Badge>
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

      {/* Transite Dialog */}
      <TransiteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        commandeId={selectedCommandeId || ''}
        onSuccess={handleTransiteSuccess}
      />
    </div>
  )
}

export default Page