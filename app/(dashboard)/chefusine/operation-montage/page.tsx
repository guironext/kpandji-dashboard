'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Settings, 
  Users, 
  Crown, 
  Car, 
  Search,
  ChefHat,
  Star,
  Building2,
  User
} from 'lucide-react'
import { toast } from 'sonner'

type Montage = {
   id: string
   no_chassis: string
   etapeMontage: string
   createdAt: string
   commande: {
     client?: {
       nom: string
     }
     clientEntreprise?: {
       nom_entreprise: string
     }
     voitureModel?: {
       model: string
     }
     ordreMontages?: {
       numeroChassis?: {
         chassisNumber: string
       }
     }[]
   }
  equipes: {
    id: string
    nomEquipe: string
    mission: string
    stautsEquipe: string
    chefEquipe: {
      nom: string
      prenoms: string
    }
    membres: {
      employee: {
        nom: string
        prenoms: string
        specialite: string
      }
    }[]
  }[]
}

const OperationMontagePage = () => {
  const [montages, setMontages] = useState<Montage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMontages = montages.filter(montage => {
    const clientName = montage.commande.client?.nom || 
                      montage.commande.clientEntreprise?.nom_entreprise || ''
    const voitureModel = montage.commande.voitureModel?.model || ''
    const equipeName = montage.equipes.map(e => e.nomEquipe).join(' ')
    
    return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           voitureModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
           equipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           montage.no_chassis.toLowerCase().includes(searchTerm.toLowerCase())
  })

  useEffect(() => {
    fetchMontages()
  }, [])

  const fetchMontages = async () => {
    try {
      const response = await fetch('/api/montages/operations')
      if (response.ok) {
        const data = await response.json()
        setMontages(data)
      } else {
        toast.error('Erreur lors du chargement des opérations')
      }
    } catch (error) {
      console.error('Error fetching montages:', error)
      toast.error('Erreur lors du chargement des opérations')
    } finally {
      setLoading(false)
    }
  }

  const getSpecialiteColor = (specialite: string) => {
    const colors = {
      'Chef': 'bg-red-100 text-red-800 border-red-200',
      'Sous-chef': 'bg-orange-100 text-orange-800 border-orange-200',
      'Cuisinier': 'bg-blue-100 text-blue-800 border-blue-200',
      'Commis': 'bg-green-100 text-green-800 border-green-200',
      'Pâtissier': 'bg-purple-100 text-purple-800 border-purple-200',
      'Serveur': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return colors[specialite as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-orange-700 bg-clip-text text-transparent">
              Opérations de Montage
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Suivi des montages en cours d&apos;exécution avec leurs équipes assignées
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{montages.length}</div>
                  <div className="text-sm text-slate-600">Montages Actifs</div>
                </div>
                <Settings className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {montages.reduce((acc, m) => acc + m.equipes.length, 0)}
                  </div>
                  <div className="text-sm text-slate-600">Équipes Assignées</div>
                </div>
                <ChefHat className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {montages.reduce((acc, m) => acc + m.equipes.reduce((eAcc, e) => eAcc + e.membres.length, 0), 0)}
                  </div>
                  <div className="text-sm text-slate-600">Membres Actifs</div>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher par client, véhicule, équipe ou châssis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Montages List */}
        <div className="space-y-6">
          {filteredMontages.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-lg">
              <div className="space-y-4">
                <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto">
                  <Settings className="w-12 h-12 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {searchTerm ? 'Aucune opération trouvée' : 'Aucune opération en cours'}
                  </h3>
                  <p className="text-slate-600">
                    {searchTerm ? 'Essayez avec d\'autres mots-clés' : 'Les montages en exécution apparaîtront ici'}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            filteredMontages.map((montage) => {
              const clientName = montage.commande.client?.nom ||
                               montage.commande.clientEntreprise?.nom_entreprise ||
                               'Client inconnu'
              const voitureModel = montage.commande.voitureModel?.model || 'Modèle inconnu'
              const clientType = montage.commande.clientEntreprise ? 'Entreprise' : 'Particulier'
              const chassisNumber = montage.commande.ordreMontages?.[0]?.numeroChassis?.chassisNumber || montage.no_chassis || 'N/A'
              
              return (
                <Card key={montage.id} className="border-0 shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                          <Car className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900">
                            {voitureModel}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {clientType === 'Entreprise' ? (
                              <Building2 className="w-4 h-4 text-slate-500" />
                            ) : (
                              <User className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="text-slate-600">{clientName}</span>
                            <Badge className="bg-slate-100 text-slate-800">{clientType}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 mb-2">
                          <Settings className="w-3 h-3 mr-1" />
                          En Exécution
                        </Badge>
                        <p className="text-sm text-slate-600">Châssis: {chassisNumber}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <ChefHat className="w-5 h-5 text-orange-600" />
                          Équipes Assignées ({montage.equipes.length})
                        </h3>
                        
                        {montage.equipes.length === 0 ? (
                          <div className="text-center py-8 bg-slate-50 rounded-lg">
                            <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Aucune équipe assignée</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {montage.equipes.map((equipe) => (
                              <Card key={equipe.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-lg font-semibold text-slate-900">
                                        {equipe.nomEquipe}
                                      </CardTitle>
                                      <p className="text-sm text-slate-600 mt-1">{equipe.mission}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Badge className={`${
                                        equipe.stautsEquipe === 'ACTIVE' 
                                          ? 'bg-green-100 text-green-800 border-green-200' 
                                          : 'bg-gray-100 text-gray-800 border-gray-200'
                                      }`}>
                                        {equipe.stautsEquipe}
                                      </Badge>
                                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                        {equipe.membres.length} membre{equipe.membres.length > 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-4">
                                  {/* Chef d'équipe */}
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                      <Crown className="w-3 h-3 text-yellow-600" />
                                      Chef d&apos;équipe
                                    </p>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                      <span className="text-sm font-medium text-slate-900">
                                        {equipe.chefEquipe.prenoms} {equipe.chefEquipe.nom}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Membres */}
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700 mb-2">Membres de l&apos;équipe</p>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {equipe.membres.slice(0, 4).map((membre, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded">
                                          <span className="font-medium">
                                            {membre.employee.prenoms} {membre.employee.nom}
                                          </span>
                                          <Badge className={`${getSpecialiteColor(membre.employee.specialite)} text-xs`}>
                                            <Star className="w-3 h-3 mr-1" />
                                            {membre.employee.specialite}
                                          </Badge>
                                        </div>
                                      ))}
                                      {equipe.membres.length > 4 && (
                                        <p className="text-xs text-slate-500 text-center py-1">
                                          +{equipe.membres.length - 4} autre{equipe.membres.length - 4 > 1 ? 's' : ''} membre{equipe.membres.length - 4 > 1 ? 's' : ''}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default OperationMontagePage