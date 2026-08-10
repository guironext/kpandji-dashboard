'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Play, Car, User, Hash, Clock, CheckCircle, AlertCircle, Settings, Wrench, Palette, Zap, Cog, Calendar} from 'lucide-react'

interface OrdreMontage {
  id: string
  ordreMontageFlag: string
  Commande: {
    id: string
    VoitureModel: {
      model: string
    }
    Client?: {
      nom: string
    }
    Client_entreprise?: {
      nom_entreprise: string
    }
  }
  NumeroChassis: {
    chassisNumber: string
  }
}

interface Montage {
  etapeMontage: string
  no_chassis: string
  Commande_Montage_commandeIdToCommande: {
    date_livraison: string
    couleur: string
    motorisation: string
    transmission: string
    VoitureModel: {
      model: string
    }
    Client?: {
      nom: string
    }
    Client_entreprise?: {
      nom_entreprise: string
    }
  }
}

const Page = () => {
  const [ordreMontages, setOrdreMontages] = useState<OrdreMontage[]>([])
  const [montages, setMontages] = useState<Montage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ordreRes, montageRes] = await Promise.all([
        fetch('/api/ordre-montage'),
        fetch('/api/montage')
      ])
      
      const ordreData = await ordreRes.json()
      const montageData = await montageRes.json()
      
      setOrdreMontages(Array.isArray(ordreData) ? ordreData : [])
      setMontages(Array.isArray(montageData) ? montageData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  

  const handleLancerExecution = async (montageId: string) => {
    try {
      const response = await fetch('/api/montage/execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ montageId })
      })

      if (response.ok) {
        toast.success('Montage passé en exécution avec succès')
        fetchData() // Refresh data
      } else {
        toast.error('Erreur lors du passage en exécution')
      }
    } catch (error) {
      console.error('Error launching execution:', error)
      toast.error('Erreur lors du passage en exécution')
    }
  }

  const getEtapeIcon = (etape: string) => {
    switch (etape) {
      case 'CREATION': return <AlertCircle className="h-4 w-4" />
      case 'VALIDE': return <CheckCircle className="h-4 w-4" />
      case 'EXECUTION': return <Settings className="h-4 w-4" />
      case 'VERIFICATION': return <Clock className="h-4 w-4" />
      case 'CORRECTION': return <Wrench className="h-4 w-4" />
      case 'TERMINEE': return <CheckCircle className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getEtapeColor = (etape: string) => {
    switch (etape) {
      case 'CREATION': return 'bg-gray-100 text-gray-800'
      case 'VALIDE': return 'bg-blue-100 text-blue-800'
      case 'EXECUTION': return 'bg-yellow-100 text-yellow-800'
      case 'VERIFICATION': return 'bg-purple-100 text-purple-800'
      case 'CORRECTION': return 'bg-orange-100 text-orange-800'
      case 'TERMINEE': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const groupMontagesByEtape = () => {
    if (!Array.isArray(montages)) {
      return {}
    }
    return montages.reduce((acc, montage) => {
      if (!acc[montage.etapeMontage]) {
        acc[montage.etapeMontage] = []
      }
      acc[montage.etapeMontage].push(montage)
      return acc
    }, {} as Record<string, Montage[]>)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    )
  }

  const groupedMontages = groupMontagesByEtape()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Gestion des Montages
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">Suivi et lancement des ordres de montage</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{ordreMontages.length}</div>
                  <div className="text-sm text-gray-500">Ordres validés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{montages.length}</div>
                  <div className="text-sm text-gray-500">Montages actifs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Ordre Montage Section */}
        {ordreMontages.length > 0 && (
          <Card className="shadow-2xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-700 text-white">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Play className="h-6 w-6" />
                </div>
                <span>Ordres de Montage Validés</span>
                <Badge variant="secondary" className="ml-auto bg-white/30 text-white border-white/20 text-lg px-3 py-1">
                  {ordreMontages.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {ordreMontages.map((ordre, index) => (
                  <div 
                    key={ordre.id} 
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative space-y-5">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                              <Car className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="font-bold text-gray-900 text-lg">{ordre.Commande.VoitureModel.model}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{ordre.Commande.Client?.nom || ordre.Commande.Client_entreprise?.nom_entreprise}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-700">
                            <Hash className="h-4 w-4 text-gray-500" />
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{ordre.NumeroChassis.chassisNumber}</span>
                          </div>
                        </div>
                      
                      <Button 
                        onClick={() => handleLancerExecution(ordre.id)}
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Lancer Montage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Empty state for ordre montage */}
        {ordreMontages.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300 bg-white/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <Play className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucun ordre de montage validé</h3>
              <p className="text-gray-500 text-center max-w-md">Les ordres de montage validés apparaîtront ici pour être lancés</p>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Montages by Etape Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Montages par Étape
              </h2>
              <Badge variant="outline" className="text-base px-4 py-2 border-2">
                {montages.length} total
              </Badge>
            </div>
          </div>
          
          {Object.entries(groupedMontages).map(([etape, montageList], etapeIndex) => (
            <Card 
              key={etape} 
              className="shadow-2xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm"
              style={{ animationDelay: `${etapeIndex * 200}ms` }}
            >
              <CardHeader className="bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 text-white">
                <CardTitle className="flex items-center space-x-4 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    {getEtapeIcon(etape)}
                  </div>
                  <span className="capitalize font-bold">{etape.toLowerCase().replace('_', ' ')}</span>
                  <Badge variant="secondary" className="ml-auto bg-white/30 text-white border-white/20 text-base px-3 py-1">
                    {montageList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-slate-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {montageList.map((montage, index) => (
                    <div 
                      key={`${etape}-${index}`} 
                      className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative space-y-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                              <Car className="h-5 w-5 text-indigo-600" />
                            </div>
                            <span className="font-bold text-gray-900 text-lg">{montage.Commande_Montage_commandeIdToCommande?.VoitureModel?.model}</span>
                          </div>
                          <Badge className={`text-xs px-3 py-1 font-semibold ${getEtapeColor(montage.etapeMontage)} rounded-full`}>
                            {montage.etapeMontage}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 text-gray-700">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="truncate font-medium">{montage.Commande_Montage_commandeIdToCommande?.Client?.nom || montage.Commande_Montage_commandeIdToCommande?.Client_entreprise?.nom_entreprise}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <Calendar className="h-3 w-3 text-green-500" />
                            <span className="font-medium">{new Date(montage.Commande_Montage_commandeIdToCommande?.date_livraison).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Palette className="h-3 w-3 text-pink-500" />
                              <span className="font-medium">{montage.Commande_Montage_commandeIdToCommande?.couleur}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              <span className="font-medium">{montage.Commande_Montage_commandeIdToCommande?.motorisation}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <Cog className="h-3 w-3 text-blue-500" />
                            <span className="font-medium">{montage.Commande_Montage_commandeIdToCommande?.transmission}</span>
                          </div>
                         
                        </div>
                        
                       
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {Object.keys(groupedMontages).length === 0 && (
            <Card className="border-2 border-dashed border-gray-300 bg-white/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                  <Settings className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucun montage en cours</h3>
                <p className="text-gray-500 text-center max-w-md">Les montages actifs apparaîtront ici organisés par étape de progression</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Page