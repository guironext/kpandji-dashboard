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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  BarChart3
} from "lucide-react"

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
        alert(`✅ Notification envoyée avec succès à ${data.count} commercial(aux)`)
      } else {
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Error notifying commercials:', error)
      alert('❌ Erreur lors de l\'envoi des notifications')
    } finally {
      setIsNotifying(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className=''>
                <p className="text-sm font-medium text-muted-foreground">Total Commandes</p>
                <h3 className="text-3xl font-bold mt-2">{totalStats.totalCommandes}</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Groupes Actifs</p>
                <h3 className="text-3xl font-bold mt-2">{totalStats.totalGroupes}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendus</p>
                <h3 className="text-3xl font-bold mt-2 text-green-600">{totalStats.totalVendus}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                <h3 className="text-3xl font-bold mt-2 text-amber-600">{totalStats.totalDisponibles}</h3>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par modèle ou couleur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="px-4 py-2">
              <Filter className="h-4 w-4 mr-2" />
              {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Commandes Groupées List */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande groupée trouvée</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucune commande groupée disponible pour le moment'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredData.map((commandeGroupee, cgIndex) => {
          const totalVehicules = commandeGroupee.models.reduce((acc, model) => acc + model.stock, 0)
          const totalVendus = commandeGroupee.models.reduce((acc, model) => acc + model.vendus, 0)
          const totalDisponibles = commandeGroupee.models.reduce((acc, model) => acc + model.disponible, 0)
          const tauxVente = totalVehicules > 0 ? Math.round((totalVendus / totalVehicules) * 100) : 0

          return (
            <Card key={commandeGroupee.commandeGroupeeId} className="border-2 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        Commande Groupée #{cgIndex + 1}
                        {tauxVente >= 50 && (
                          <Badge variant="default" className="bg-green-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Performante
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        ID: {commandeGroupee.commandeGroupeeId.substring(0, 12)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-sm px-4 py-2 bg-white dark:bg-slate-900">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(commandeGroupee.date_validation)}
                    </Badge>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Taux de vente</div>
                      <div className="text-lg font-bold text-primary">{tauxVente}%</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 items-center-safe text-center flex">
                    <Package className="h-5 w-5 mx-auto mb-2 text-slate-600" />
                    <div className="text-2xl font-bold mr-2.5">{totalVehicules}</div>
                    <div className="text-xs text-muted-foreground">Total Véhicules</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 items-center-safe text-center flex">
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600 mr-2.5">{totalVendus}</div>
                    <div className="text-xs text-muted-foreground">Vendus</div>
                  </div>
                  <div 
                    onClick={() => handleNotifyCommercials(commandeGroupee.commandeGroupeeId, commandeGroupee.models)}
                    className={`bg-amber-50 dark:bg-amber-950 rounded-lg p-4 items-center-safe text-center flex cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors relative ${isNotifying === commandeGroupee.commandeGroupeeId ? 'opacity-50' : ''}`}
                    title="Cliquez pour notifier les commerciaux"
                  >
                    {isNotifying === commandeGroupee.commandeGroupeeId && (
                      <div className="absolute inset-0 flex items-center justify-center bg-amber-50/80 dark:bg-amber-950/80 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                      </div>
                    )}
                    <ShoppingCart className="h-5 w-5 mx-auto mb-2 text-amber-600" />
                    <div className="text-2xl font-bold text-amber-600 mr-2.5">{totalDisponibles}</div>
                    <div className="text-xs text-muted-foreground">Disponibles</div>
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-900">
                        <TableHead className="font-bold">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Modèle
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-bold">Stock</TableHead>
                        <TableHead className="text-center font-bold">Vendus</TableHead>
                        <TableHead className="font-bold">Configurations</TableHead>
                        <TableHead className="text-center font-bold">Disponible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commandeGroupee.models.map((modelData, modelIndex) => (
                        <TableRow key={modelIndex} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                          <TableCell>
                            <div className="font-semibold text-base flex items-center gap-2">
                              <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center">
                                <Car className="h-4 w-4 text-primary" />
                              </div>
                              {modelData.model}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-base px-4 py-1.5 font-bold">
                              {modelData.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="text-base px-4 py-1.5 bg-green-600 hover:bg-green-700 font-bold">
                              {modelData.vendus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {modelData.details.map((detail, detailIndex) => (
                                <div key={detailIndex} className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg border">
                                  <Badge variant="outline" className="bg-white dark:bg-slate-950 px-3 py-1">
                                    <span className="font-semibold text-base">{detail.couleur}</span>
                                    <span className="ml-2 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-xs font-bold">
                                      ×{detail.count}
                                    </span>
                                  </Badge>
                                  <div className="h-4 w-px bg-slate-300"></div>
                                  <span className="text-sm font-medium">{getMotorisation(detail.motorisation)}</span>
                                  <div className="h-4 w-px bg-slate-300"></div>
                                  <span className="text-sm font-medium">{getTransmission(detail.transmission)}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="text-base px-4 py-1.5 bg-amber-600 hover:bg-amber-700 font-bold">
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
        })
      )}
    </div>
  )
}

export default ListeCommandesGroupeesClient
