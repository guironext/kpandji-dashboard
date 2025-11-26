"use client";

import React, { useState } from 'react'
import { getCommandesProposees } from '@/lib/actions/commande'
import { getAllFournisseurs } from '@/lib/actions/fournisseur'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Car, User, Settings, CheckCircle, XCircle, Clock, Package, TrendingUp, AlertCircle } from 'lucide-react'
import { ValidationDialog } from '@/components/ValidationDialog'

interface Commande {
  id: string;
  nbr_portes: string;
  transmission: string;
  motorisation: string;
  couleur: string;
  date_livraison: Date; // Change from string to Date
  client: {
    id: string;
    nom: string;
    email: string | null;
    telephone: string;
    // ... other client properties
  };
  voitureModel?: {
    id: string;
    model: string;
    // ... other model properties
  } | null;
  fournisseurs: Fournisseur[];
}

interface Fournisseur {
  id: string;
  nom: string;
  email: string | null; // Change from string | undefined to string | null
  telephone: string | null; // Change from string | undefined to string | null
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
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [commandesResult, fournisseursResult] = await Promise.all([
          getCommandesProposees(),
          getAllFournisseurs()
        ])
        
        if (commandesResult.success) {
          setCommandes(commandesResult.data || [])
        }
        
        if (fournisseursResult.success) {
          setFournisseurs(fournisseursResult.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleValidateClick = (commandeId: string) => {
    setSelectedCommandeId(commandeId)
    setIsDialogOpen(true)
  }

  const handleValidationSuccess = () => {
    // Refresh the commandes list
    const fetchCommandes = async () => {
      const result = await getCommandesProposees()
      if (result.success) {
        setCommandes(result.data || [])
      }
    }
    fetchCommandes()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <div className="relative">
            <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4 animate-spin" />
            <div className="absolute inset-0 h-16 w-16 mx-auto bg-amber-500/20 rounded-full animate-ping" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chargement en cours...</h2>
          <p className="text-gray-500">Récupération des commandes proposées</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: commandes.length,
    urgent: commandes.filter(c => {
      const daysUntilDelivery = Math.ceil((new Date(c.date_livraison).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDelivery <= 30
    }).length,
    withSuppliers: commandes.filter(c => c.fournisseurs && c.fournisseurs.length > 0).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Package className="h-10 w-10" />
              Commandes Proposées
            </h1>
            <p className="text-amber-50 text-lg">
              Gérez et validez les propositions de commandes en attente
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
              <div className="text-5xl font-bold">{commandes.length}</div>
              <div className="text-sm text-amber-50">En attente</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Total Propositions</CardTitle>
              <div className="p-3 bg-amber-500 rounded-xl shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-600">{stats.total}</div>
            <p className="text-sm text-gray-500 mt-1">Commandes à traiter</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Urgentes</CardTitle>
              <div className="p-3 bg-orange-500 rounded-xl shadow-md">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">{stats.urgent}</div>
            <p className="text-sm text-gray-500 mt-1">Livraison &lt; 30 jours</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-white to-green-50 shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-700">Avec Fournisseurs</CardTitle>
              <div className="p-3 bg-green-500 rounded-xl shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{stats.withSuppliers}</div>
            <p className="text-sm text-gray-500 mt-1">Prêtes à valider</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {commandes.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-white shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-6">
              <Car className="h-16 w-16 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Aucune commande proposée</h3>
            <p className="text-gray-500 text-center max-w-md text-lg">
              Il n&apos;y a actuellement aucune commande en attente de validation. 
              Les nouvelles propositions apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {commandes.map((commande) => {
            const daysUntilDelivery = Math.ceil((new Date(commande.date_livraison).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            const isUrgent = daysUntilDelivery <= 30
            
            return (
              <Card 
                key={commande.id} 
                className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 ${
                  isUrgent ? 'border-orange-300 bg-gradient-to-br from-white to-orange-50' : 'border-gray-200 bg-white'
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
                      className={`${
                        isUrgent 
                          ? 'bg-orange-100 text-orange-700 border-orange-300' 
                          : 'bg-amber-100 text-amber-700 border-amber-300'
                      } font-semibold px-3 py-1.5`}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      {isUrgent ? 'Urgent' : 'En attente'}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Car className="h-5 w-5 text-amber-600" />
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
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-blue-600 font-medium">Livraison prévue</div>
                      <div className="text-sm font-bold text-gray-800">
                        {new Date(commande.date_livraison).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      {isUrgent && (
                        <div className="text-xs text-orange-600 font-medium mt-0.5">
                          Dans {daysUntilDelivery} jour{daysUntilDelivery > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suppliers */}
                  {commande.fournisseurs && commande.fournisseurs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          Fournisseurs ({commande.fournisseurs.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {commande.fournisseurs.map((fournisseur) => (
                          <Badge 
                            key={fournisseur.id} 
                            variant="secondary" 
                            className="bg-green-100 text-green-700 border border-green-200 font-medium px-3 py-1"
                          >
                            {fournisseur.nom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <div className="px-6 pb-6 pt-2">
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                      onClick={() => handleValidateClick(commande.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-bold transition-all"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Validation Dialog */}
      <ValidationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        commandeId={selectedCommandeId || ''}
        fournisseurs={fournisseurs}
        onSuccess={handleValidationSuccess}
      />
    </div>
  )
}

export default Page