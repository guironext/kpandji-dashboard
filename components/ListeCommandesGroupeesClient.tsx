"use client"

import React, { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Package, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  ShoppingCart, 
  Car,
  Search,
  Filter,
  BarChart3,
  Sparkles,
  Bell,
  Layers
} from "lucide-react"
import { toast } from "sonner"

type Commande = {
  id: string
  couleur: string
  motorisation: string
  transmission: string
  commandeFlag: string
  prix_unitaire: string | null
  date_livraison: string
  createdAt: string
  updatedAt: string
  voitureModel: {
    id: string
    model: string
    createdAt: string
    updatedAt: string
  } | null
  commandeGroupee: {
    id: string
    date_validation: string
    createdAt: string
    updatedAt: string
    stock_global: string
    vendue: string
    details: string
    stock_disponible: string
  } | null
}

type GroupedData = {
  commandeGroupeeId: string
  date_validation: string | null
  models: {
    model: string
    stock: number
    vendus: number
    disponible: number
    details: {
      couleur: string
      count: number
      motorisation: string
      transmission: string
    }[]
  }[]
}

interface ListeCommandesGroupeesClientProps {
  commandes: Commande[]
}

const ListeCommandesGroupeesClient = ({ commandes }: ListeCommandesGroupeesClientProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isNotifying, setIsNotifying] = useState<string | null>(null)

  const groupedData = useMemo(() => {
    const grouped: { [key: string]: GroupedData } = {}

    commandes.forEach((commande) => {
      const commandeGroupeeId = commande.commandeGroupee?.id || 'sans-groupe'
      const modelName = commande.voitureModel?.model || 'Modèle Inconnu'
      
      // Initialize commande groupée if not exists
      if (!grouped[commandeGroupeeId]) {
        grouped[commandeGroupeeId] = {
          commandeGroupeeId: commandeGroupeeId,
          date_validation: commande.commandeGroupee?.date_validation || null,
          models: []
        }
      }

      // Find or create model within this commande groupée
      let modelGroup = grouped[commandeGroupeeId].models.find(m => m.model === modelName)
      if (!modelGroup) {
        modelGroup = {
          model: modelName,
          stock: 0,
          vendus: 0,
          disponible: 0,
          details: []
        }
        grouped[commandeGroupeeId].models.push(modelGroup)
      }

      // Increment stock
      modelGroup.stock++

      // Count vendus and disponibles
      if (commande.commandeFlag === 'VENDUE') {
        modelGroup.vendus++
      } else if (commande.commandeFlag === 'DISPONIBLE') {
        modelGroup.disponible++
      }

      // Add to details (case-insensitive grouping by color)
      const couleurLower = commande.couleur.toLowerCase()
      const existingDetail = modelGroup.details.find(
        d => d.couleur.toLowerCase() === couleurLower &&
             d.motorisation === commande.motorisation &&
             d.transmission === commande.transmission
      )

      if (existingDetail) {
        existingDetail.count++
      } else {
        modelGroup.details.push({
          couleur: commande.couleur,
          count: 1,
          motorisation: commande.motorisation,
          transmission: commande.transmission
        })
      }
    })

    return Object.values(grouped)
  }, [commandes])

  const filteredData = useMemo(() => {
    if (!searchTerm) return groupedData
    
    return groupedData.filter(cg => 
      cg.models.some(model => 
        model.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.details.some(detail => 
          detail.couleur.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    )
  }, [groupedData, searchTerm])

  const totalStats = useMemo(() => {
    return {
      totalCommandes: commandes.length,
      totalVendus: filteredData.reduce((acc, cg) => 
        acc + cg.models.reduce((modelAcc, model) => modelAcc + model.vendus, 0), 0
      ),
      totalDisponibles: filteredData.reduce((acc, cg) => 
        acc + cg.models.reduce((modelAcc, model) => modelAcc + model.disponible, 0), 0
      ),
      totalGroupes: filteredData.length
    }
  }, [commandes.length, filteredData])

  const getMotorisation = (motorisation: string) => {
    switch (motorisation) {
      case 'ELECTRIQUE':
        return '⚡ Électrique'
      case 'ESSENCE':
        return '⛽ Essence'
      case 'DIESEL':
        return '🛢️ Diesel'
      case 'HYBRIDE':
        return '🔋 Hybride'
      default:
        return motorisation
    }
  }

  const getTransmission = (transmission: string) => {
    switch (transmission) {
      case 'AUTOMATIQUE':
        return '🔄 Auto'
      case 'MANUEL':
        return '⚙️ Manuel'
      default:
        return transmission
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleNotifyCommercials = async (commandeGroupeeId: string, models: GroupedData['models']) => {
    setIsNotifying(commandeGroupeeId)
    try {
      const response = await fetch('/api/notify-commercials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commandeGroupeeId,
          models: models.map(model => ({
            model: model.model,
            disponible: model.disponible,
            stock: model.stock,
            details: model.details
          }))
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Notification envoyée avec succès à ${data.count} commercial(aux)`)
      } else {
        toast.error(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Error notifying commercials:', error)
      toast.error('Erreur lors de l\'envoi des notifications')
    } finally {
      setIsNotifying(null)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="group border-0 shadow-xl bg-gradient-to-br from-purple-500 via-purple-600 to-violet-600 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Commandes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl md:text-5xl font-bold mb-2">{totalStats.totalCommandes}</p>
                <p className="text-sm opacity-90 font-medium">Commandes enregistrées</p>
              </div>
              <Package className="h-16 w-16 opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Groupes Actifs
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl md:text-5xl font-bold mb-2">{totalStats.totalGroupes}</p>
                <p className="text-sm opacity-90 font-medium">Commandes groupées</p>
              </div>
              <BarChart3 className="h-16 w-16 opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Vendus
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl md:text-5xl font-bold mb-2">{totalStats.totalVendus}</p>
                <p className="text-sm opacity-90 font-medium">Véhicules vendus</p>
              </div>
              <CheckCircle2 className="h-16 w-16 opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Disponibles
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl md:text-5xl font-bold mb-2">{totalStats.totalDisponibles}</p>
                <p className="text-sm opacity-90 font-medium">En stock</p>
              </div>
              <ShoppingCart className="h-16 w-16 opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search Section */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
        <CardContent className="pt-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-600 transition-colors" />
              <Input
                placeholder="Rechercher par modèle ou couleur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-6 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
              />
              {searchTerm && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commandes Groupées List */}
      {filteredData.length === 0 ? (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full">
                <Package className="h-16 w-16 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm ? "Aucun résultat trouvé" : "Aucune commande groupée trouvée"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm
                ? "Aucune commande groupée ne correspond à votre recherche. Essayez avec d'autres termes."
                : "Les commandes groupées apparaîtront ici une fois qu'elles auront été validées dans le système."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200"
              >
                Réinitialiser la recherche
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredData.map((commandeGroupee, cgIndex) => {
            const totalVehicules = commandeGroupee.models.reduce((acc, model) => acc + model.stock, 0)
            const totalVendus = commandeGroupee.models.reduce((acc, model) => acc + model.vendus, 0)
            const totalDisponibles = commandeGroupee.models.reduce((acc, model) => acc + model.disponible, 0)
            const tauxVente = totalVehicules > 0 ? Math.round((totalVendus / totalVehicules) * 100) : 0

            return (
              <Card 
                key={commandeGroupee.commandeGroupeeId} 
                className="group border-0 shadow-lg bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${cgIndex * 50}ms` }}
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 via-blue-100/50 to-indigo-50 border-b border-blue-200/50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg blur opacity-20"></div>
                        <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg shadow-md">
                          <Car className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                          Commande Groupée #{cgIndex + 1}
                          {tauxVente >= 50 && (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-sm">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Performante
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <span className="text-sm text-gray-600 font-mono">
                            ID: {commandeGroupee.commandeGroupeeId.substring(0, 12)}...
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-sm px-4 py-2 bg-white border-2 border-blue-200">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-700">{formatDate(commandeGroupee.date_validation)}</span>
                      </Badge>
                      <div className="text-right bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-4 py-2 border border-blue-200">
                        <div className="text-xs text-gray-600 font-medium">Taux de vente</div>
                        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{tauxVente}%</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Enhanced Stats Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <Package className="h-6 w-6 text-slate-600" />
                        <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-bold text-lg px-3 py-1">
                          {totalVehicules}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Total Véhicules</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 font-bold text-lg px-3 py-1">
                          {totalVendus}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Vendus</p>
                    </div>
                    
                    <div 
                      onClick={() => handleNotifyCommercials(commandeGroupee.commandeGroupeeId, commandeGroupee.models)}
                      className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200 hover:shadow-md transition-all cursor-pointer relative ${isNotifying === commandeGroupee.commandeGroupeeId ? 'opacity-50' : ''}`}
                      title="Cliquez pour notifier les commerciaux"
                    >
                      {isNotifying === commandeGroupee.commandeGroupeeId && (
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-50/80 rounded-xl">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <Bell className="h-6 w-6 text-amber-600" />
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 font-bold text-lg px-3 py-1">
                          {totalDisponibles}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Disponibles</p>
                    </div>
                  </div>

                  {/* Enhanced Table */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b-2 border-gray-200">
                          <TableHead className="font-bold text-gray-900 py-4">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-blue-600" />
                              Modèle
                            </div>
                          </TableHead>
                          <TableHead className="text-center font-bold text-gray-900 py-4">Stock</TableHead>
                          <TableHead className="text-center font-bold text-gray-900 py-4">Vendus</TableHead>
                          <TableHead className="font-bold text-gray-900 py-4">Configurations</TableHead>
                          <TableHead className="text-center font-bold text-gray-900 py-4">Disponible</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commandeGroupee.models.map((modelData, modelIndex) => (
                          <TableRow 
                            key={modelIndex} 
                            className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors border-b border-gray-100"
                          >
                            <TableCell className="py-4">
                              <div className="font-semibold text-base flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center border border-blue-200">
                                  <Car className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="text-gray-900">{modelData.model}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Badge variant="secondary" className="text-base px-4 py-1.5 font-bold bg-slate-100 text-slate-700">
                                {modelData.stock}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Badge className="text-base px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 font-bold shadow-sm">
                                {modelData.vendus}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="space-y-2">
                                {modelData.details.map((detail, detailIndex) => (
                                  <div 
                                    key={detailIndex} 
                                    className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                  >
                                    <Badge variant="outline" className="bg-white border-2 border-blue-200 px-3 py-1">
                                      <span className="font-semibold text-base text-gray-900">{detail.couleur}</span>
                                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        ×{detail.count}
                                      </span>
                                    </Badge>
                                    <div className="h-4 w-px bg-gray-300"></div>
                                    <span className="text-sm font-medium text-gray-700">{getMotorisation(detail.motorisation)}</span>
                                    <div className="h-4 w-px bg-gray-300"></div>
                                    <span className="text-sm font-medium text-gray-700">{getTransmission(detail.transmission)}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Badge className="text-base px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 font-bold shadow-sm">
                                {modelData.disponible}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ListeCommandesGroupeesClient
