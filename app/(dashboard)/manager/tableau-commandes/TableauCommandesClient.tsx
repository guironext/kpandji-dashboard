'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  ShoppingCart,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Car,
  AlertCircle,
  BarChart3,
  Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type CommandeType = {
  id: string
  couleur: string | null
  motorisation: string | null
  transmission: string | null
  nbr_portes: string | null
  prix_unitaire: number | null
  date_livraison: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  etapeCommande: string
  commandeFlag: string
  voitureModel: {
    model: string
  } | null
  client: {
    nom: string
  } | null
  clientEntreprise: {
    nom_entreprise: string
  } | null
}

type Props = {
  commandes: CommandeType[]
}

type GroupedRow = {
  model: string
  couleurs: string[]
  transmissions: string[]
  motorisations: string[]
  portes: string[]
  total: number
  vendu: number
  disponible: number
  enAttente: number
  commandeIds: string[]
  conteneursNeeded: number
}

// Configuration for minimum order quantities and conteneurs
const getOrderConfig = (model: string | null) => {
  if (!model) return { minQuantity: 0, conteneursPerMinOrder: 0 }
  
  const modelUpper = model.toUpperCase().trim()
  
  // Check for exact matches first, then partial matches
  if (modelUpper === 'KPANDJI DJETRAN BVA DIESEL' || modelUpper.includes('KPANDJI DJETRAN BVA DIESEL')) {
    return { minQuantity: 3, conteneursPerMinOrder: 1 }
  }
  if (modelUpper === 'KPANDJI DJETRAN BVM DIESEL' || modelUpper.includes('KPANDJI DJETRAN BVM DIESEL')) {
    return { minQuantity: 3, conteneursPerMinOrder: 1 }
  }
  if (modelUpper === 'KPANDJI DJETRAN BVM ESSENCE' || modelUpper.includes('KPANDJI DJETRAN BVM ESSENCE')) {
    return { minQuantity: 3, conteneursPerMinOrder: 1 }
  }
  if (modelUpper === 'KPANDJI DJETRAN BVA ESSENCE' || modelUpper.includes('KPANDJI DJETRAN BVA ESSENCE')) {
    return { minQuantity: 3, conteneursPerMinOrder: 1 }
  }
  if (modelUpper === 'KPANDJI CAVALLY' || modelUpper.includes('KPANDJI CAVALLY')) {
    return { minQuantity: 8, conteneursPerMinOrder: 3 }
  }
  if (modelUpper === 'KPANDJI LATHAYE' || modelUpper.includes('KPANDJI LATHAYE')) {
    return { minQuantity: 2, conteneursPerMinOrder: 1 }
  }
  
  // Default: no minimum order
  return { minQuantity: 0, conteneursPerMinOrder: 0 }
}

const TableauCommandesClient = ({ commandes }: Props) => {
  const router = useRouter()
  
  // Group commandes by voitureModel only (ignoring color differences)
  const tableData = React.useMemo(() => {
    const groups: Record<string, CommandeType[]> = {}
    
    commandes.forEach((commande) => {
      const model = commande.voitureModel?.model || 'N/A'
      
      // Group only by model
      if (!groups[model]) {
        groups[model] = []
      }
      groups[model].push(commande)
    })
    
    // Convert to table rows - split into groups based on minimum order
    const rows: GroupedRow[] = []
    
    Object.entries(groups).forEach(([model, groupCommandes]) => {
      const config = getOrderConfig(model)
      const minQuantity = config.minQuantity || 0
      
      // Collect all unique values for each characteristic (from all commandes of this model)
      const couleurs = Array.from(new Set(
        groupCommandes
          .map(c => c.couleur)
          .filter(c => c !== null && c !== 'N/A')
      )) as string[]
      
      const transmissions = Array.from(new Set(
        groupCommandes
          .map(c => c.transmission)
          .filter(c => c !== null && c !== 'N/A')
      )) as string[]
      
      const motorisations = Array.from(new Set(
        groupCommandes
          .map(c => c.motorisation)
          .filter(c => c !== null && c !== 'N/A')
      )) as string[]
      
      const portes = Array.from(new Set(
        groupCommandes
          .map(c => c.nbr_portes)
          .filter(c => c !== null && c !== 'N/A')
      )) as string[]
      
      const totalVendu = groupCommandes.filter(c => c.commandeFlag === 'VENDUE').length
      const totalDisponible = groupCommandes.filter(c => c.commandeFlag === 'DISPONIBLE').length
      const totalCommandes = groupCommandes.length
      
      // If no minimum order, create one row with all commandes
      if (minQuantity === 0) {
        rows.push({
          model,
          couleurs,
          transmissions,
          motorisations,
          portes,
          total: 0,
          vendu: totalVendu,
          disponible: totalDisponible,
          enAttente: 0,
          commandeIds: groupCommandes.map(c => c.id),
          conteneursNeeded: 0
        })
      } else {
        // Split commandes into groups based on minimum order
        const completeGroups = Math.floor(totalCommandes / minQuantity)
        const remainingCommandes = totalCommandes % minQuantity
        const conteneursPerGroup = config.conteneursPerMinOrder
        
        // Create a row for each complete group
        for (let i = 0; i < completeGroups; i++) {
          const startIdx = i * minQuantity
          const endIdx = startIdx + minQuantity
          const groupCommandesSlice = groupCommandes.slice(startIdx, endIdx)
          
          const groupVendu = groupCommandesSlice.filter(c => c.commandeFlag === 'VENDUE').length
          const groupDisponible = groupCommandesSlice.filter(c => c.commandeFlag === 'DISPONIBLE').length
          
          rows.push({
            model,
            couleurs,
            transmissions,
            motorisations,
            portes,
            total: minQuantity,
            vendu: groupVendu,
            disponible: groupDisponible,
            enAttente: 0, // Complete group, so enAttente is 0
            commandeIds: groupCommandesSlice.map(c => c.id),
            conteneursNeeded: conteneursPerGroup
          })
        }
        
        // Create a row for remaining commandes if any
        if (remainingCommandes > 0) {
          const startIdx = completeGroups * minQuantity
          const remainingCommandesSlice = groupCommandes.slice(startIdx)
          
          const remainingVendu = remainingCommandesSlice.filter(c => c.commandeFlag === 'VENDUE').length
          const remainingDisponible = remainingCommandesSlice.filter(c => c.commandeFlag === 'DISPONIBLE').length
          
          rows.push({
            model,
            couleurs,
            transmissions,
            motorisations,
            portes,
            total: minQuantity,
            vendu: remainingVendu,
            disponible: remainingDisponible,
            enAttente: remainingCommandes - minQuantity, // Negative if incomplete
            commandeIds: remainingCommandesSlice.map(c => c.id),
            conteneursNeeded: 0 // Incomplete group, no conteneurs needed
          })
        }
      }
    })
    
    // Sort by model name
    return rows.sort((a, b) => a.model.localeCompare(b.model))
  }, [commandes])

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const totalVendu = tableData.reduce((sum, row) => sum + row.vendu, 0)
    const totalDisponible = tableData.reduce((sum, row) => sum + row.disponible, 0)
    const totalRequired = tableData.reduce((sum, row) => sum + row.total, 0)
    const totalEnAttente = tableData.reduce((sum, row) => sum + Math.max(0, -row.enAttente), 0)
    const totalSurplus = tableData.reduce((sum, row) => sum + Math.max(0, row.enAttente), 0)
    const completeGroups = tableData.filter(row => row.enAttente >= 0 && row.total > 0).length
    const incompleteGroups = tableData.filter(row => row.enAttente < 0 && row.total > 0).length

    return {
      totalVendu,
      totalDisponible,
      totalRequired,
      totalEnAttente,
      totalSurplus,
      completeGroups,
      incompleteGroups,
      totalGroups: tableData.length
    }
  }, [tableData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-3 md:p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
              <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Tableau des Commandes Validées
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base lg:text-lg">
                Analyse des commandes groupées par modèle et caractéristiques
              </p>
            </div>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Commandes */}
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Commandes</p>
                  <p className="text-3xl font-bold">{commandes.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Vendu */}
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Total Vendu</p>
                  <p className="text-3xl font-bold">{summaryStats.totalVendu}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Disponible */}
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Total Disponible</p>
                  <p className="text-3xl font-bold">{summaryStats.totalDisponible}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Groupes Complets */}
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Groupes Complets</p>
                  <p className="text-3xl font-bold">{summaryStats.completeGroups}</p>
                  <p className="text-purple-200 text-xs mt-1">
                    {summaryStats.incompleteGroups} incomplets
                  </p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-md border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-700 text-sm font-medium">En Attente</p>
                  <p className="text-2xl font-bold text-orange-600">{summaryStats.totalEnAttente}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Total Requis</p>
                  <p className="text-2xl font-bold text-blue-600">{summaryStats.totalRequired}</p>
                </div>
                <Truck className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 text-sm font-medium">Surplus</p>
                  <p className="text-2xl font-bold text-green-600">{summaryStats.totalSurplus}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 text-white border-0 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl md:text-2xl">Tableau des Commandes</CardTitle>
                  <p className="text-blue-100 text-sm mt-0.5">
                    {tableData.length} ligne{tableData.length > 1 ? 's' : ''} de données • Analyse détaillée par modèle
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                Vue analytique
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {tableData.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 hover:bg-gradient-to-r hover:from-blue-50 hover:via-purple-50 hover:to-blue-50">
                      <TableHead className="font-bold text-gray-900 text-sm md:text-base py-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-600" />
                          <span>Modèle & Caractéristiques</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-center text-sm md:text-base py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span>Total</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-center text-sm md:text-base py-4">
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span>Vendu</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-center text-sm md:text-base py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Package className="h-4 w-4 text-green-500" />
                          <span>Disponible</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-center text-sm md:text-base py-4">
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span>En attente</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-center text-sm md:text-base py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Package className="h-4 w-4 text-purple-500" />
                          <span>Action</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, index) => {
                      const isComplete = row.enAttente >= 0 && row.total > 0
                      const isIncomplete = row.enAttente < 0 && row.total > 0
                      
                      return (
                        <TableRow 
                          key={index}
                          className={`transition-all duration-200 ${
                            isComplete 
                              ? 'bg-green-50/50 hover:bg-green-50 border-l-4 border-l-green-500' 
                              : isIncomplete
                              ? 'bg-orange-50/50 hover:bg-orange-50 border-l-4 border-l-orange-500'
                              : 'hover:bg-blue-50/50 border-l-4 border-l-transparent'
                          }`}
                        >
                          <TableCell className="font-medium py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-bold text-gray-900 text-base">{row.model}</div>
                                {isComplete && (
                                  <Badge className="bg-green-500 text-white text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Complet
                                  </Badge>
                                )}
                                {isIncomplete && (
                                  <Badge className="bg-orange-500 text-white text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Incomplet
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                                {row.couleurs.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {row.couleurs.map((couleur, idx) => (
                                      <Badge key={idx} variant="outline" className="text-gray-600 border-gray-300">
                                        🎨 {couleur}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {row.transmissions.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {row.transmissions.map((transmission, idx) => (
                                      <Badge key={idx} variant="outline" className="text-gray-600 border-gray-300">
                                        ⚙️ {transmission}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {row.motorisations.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {row.motorisations.map((motorisation, idx) => (
                                      <Badge key={idx} variant="outline" className="text-gray-600 border-gray-300">
                                        🔧 {motorisation}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {row.portes.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {row.portes.map((porte, idx) => (
                                      <Badge key={idx} variant="outline" className="text-gray-600 border-gray-300">
                                        🚪 {porte}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-blue-600 text-lg md:text-xl">{row.total || '-'}</span>
                              {row.total > 0 && (
                                <span className="text-xs text-gray-500 mt-1">minimum</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-red-600 text-lg md:text-xl">{row.vendu}</span>
                              {row.vendu > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <TrendingUp className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-gray-500">{((row.vendu / (row.vendu + row.disponible || 1)) * 100).toFixed(0)}%</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-green-600 text-lg md:text-xl">{row.disponible}</span>
                              {row.disponible > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Package className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-gray-500">{((row.disponible / (row.vendu + row.disponible || 1)) * 100).toFixed(0)}%</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <div className="flex flex-col items-center">
                              {row.enAttente === 0 ? (
                                <div className="flex items-center gap-2">
                                  <Minus className="h-5 w-5 text-gray-400" />
                                  <span className="text-gray-400 font-medium">0</span>
                                </div>
                              ) : row.enAttente > 0 ? (
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                    <span className="font-bold text-green-600 text-lg md:text-xl">+{row.enAttente}</span>
                                  </div>
                                  <Badge className="bg-green-100 text-green-700 text-xs mt-1">Surplus</Badge>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    <TrendingDown className="h-4 w-4 text-orange-500" />
                                    <span className="font-bold text-orange-600 text-lg md:text-xl">{row.enAttente}</span>
                                  </div>
                                  <Badge className="bg-orange-100 text-orange-700 text-xs mt-1">Manquant</Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="default"
                                size="sm"
                                disabled={!isComplete || row.total === 0}
                                className={`shadow-md ${
                                  isComplete && row.total > 0
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                onClick={() => {
                                  // Navigate to charger conteneur page with commande IDs and conteneurs needed
                                  const params = new URLSearchParams({
                                    commandeIds: JSON.stringify(row.commandeIds),
                                    model: row.model,
                                    conteneursNeeded: row.conteneursNeeded.toString(),
                                    total: row.total.toString()
                                  })
                                  router.push(`/manager/tableau-commandes/charger-conteneur?${params.toString()}`)
                                }}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Charger
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-full mb-4 shadow-inner">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-center font-semibold text-lg md:text-xl mb-2">Aucune commande validée</p>
                <p className="text-center text-sm md:text-base text-gray-500">
                  Les commandes validées apparaîtront ici une fois disponibles
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TableauCommandesClient
