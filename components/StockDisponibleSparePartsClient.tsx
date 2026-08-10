"use client"

import React, { useState, useMemo } from 'react'
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
  Package,
  Search,
  Filter,
  Grid3x3,
  LayoutList,
  Wrench,
  Car,
  Hash,
  Palette,
  Zap,
  Cog,
  BarChart3,
  TrendingUp,
  Archive
} from "lucide-react"

type SparePart = {
  id: string
  partCode: string
  partName: string
  partNameFrench: string | null
  verificationName: string | null
  quantity: number
  etapeSparePart: string
  statusVerification: string
  createdAt: string
  updatedAt: string
  voiture: {
    id: string
    couleur: string
    motorisation: string
    transmission: string
    nbr_portes: string
    etatVoiture: string
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
  } | null
}

interface StockDisponibleSparePartsClientProps {
  spareParts: SparePart[]
}

const StockDisponibleSparePartsClient = ({ spareParts }: StockDisponibleSparePartsClientProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterModel, setFilterModel] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const models = useMemo(() => {
    return Array.from(new Set(spareParts.map(sp => sp.voiture?.voitureModel?.model).filter((model): model is string => model != null)))
  }, [spareParts])

  const filteredSpareParts = useMemo(() => {
    return spareParts.filter(sparePart => {
      const matchSearch =
        sparePart.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sparePart.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sparePart.partNameFrench?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (sparePart.voiture?.voitureModel?.model?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())

      const matchModel = filterModel === 'all' || sparePart.voiture?.voitureModel?.model === filterModel

      return matchSearch && matchModel
    })
  }, [spareParts, searchTerm, filterModel])

  const groupedSpareParts = useMemo(() => {
    const grouped = filteredSpareParts.reduce((acc, sp) => {
      const model = sp.voiture?.voitureModel?.model || 'Modèle inconnu'
      if (!acc[model]) {
        acc[model] = []
      }
      acc[model].push(sp)
      return acc
    }, {} as Record<string, SparePart[]>)

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredSpareParts])

  const statistics = useMemo(() => {
    const totalParts = filteredSpareParts.length
    const totalQuantity = filteredSpareParts.reduce((sum, part) => sum + part.quantity, 0)
    const uniqueModels = new Set(filteredSpareParts.map(p => p.voiture?.voitureModel?.model).filter(Boolean)).size
    const uniqueParts = new Set(filteredSpareParts.map(p => p.partCode)).size
    
    return { totalParts, totalQuantity, uniqueModels, uniqueParts }
  }, [filteredSpareParts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-blue-600/5"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Stock Disponible
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">Gestion des pièces de rechange en stock</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{statistics.totalParts}</div>
                  <div className="text-sm text-gray-500">Pièces totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.totalQuantity}</div>
                  <div className="text-sm text-gray-500">Quantité totale</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{statistics.uniqueModels}</div>
                  <div className="text-sm text-gray-500">Modèles</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pièces Totales</p>
                  <p className="text-3xl font-bold text-emerald-600">{statistics.totalParts}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Archive className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quantité Totale</p>
                  <p className="text-3xl font-bold text-blue-600">{statistics.totalQuantity}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Modèles</p>
                  <p className="text-3xl font-bold text-indigo-600">{statistics.uniqueModels}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Car className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 overflow-hidden bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Types Uniques</p>
                  <p className="text-3xl font-bold text-purple-600">{statistics.uniqueParts}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-slate-900 text-white">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <Filter className="h-5 w-5" />
              </div>
              <span>Filtres et Recherche</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nom, code, modèle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Modèle</label>
                <Select value={filterModel} onValueChange={setFilterModel}>
                  <SelectTrigger className="border-2 focus:border-blue-500">
                    <SelectValue placeholder="Tous les modèles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modèles</SelectItem>
                    {models.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Mode d&apos;affichage</label>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="flex-1"
                  >
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    Grille
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="flex-1"
                  >
                    <LayoutList className="h-4 w-4 mr-2" />
                    Liste
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Résultats</label>
                <div className="flex items-center justify-center h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                  <Badge variant="secondary" className="text-base px-4 py-2 bg-white/80">
                    {filteredSpareParts.length} pièces trouvées
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Spare Parts by Model */}
        <div className="space-y-8">
          {groupedSpareParts.length > 0 ? (
            groupedSpareParts.map(([model, parts], modelIndex) => (
              <Card 
                key={model} 
                className="shadow-2xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm"
                style={{ animationDelay: `${modelIndex * 200}ms` }}
              >
                <CardHeader className="bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 text-white">
                  <CardTitle className="flex items-center space-x-4 text-xl">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Car className="h-6 w-6" />
                    </div>
                    <span className="font-bold">{model}</span>
                    <Badge variant="secondary" className="ml-auto bg-white/30 text-white border-white/20 text-base px-3 py-1">
                      {parts.length} pièces
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-slate-50/50 ">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {parts.map((part, index) => (
                        <div 
                          key={part.id} 
                          className="group relative bg-white rounded-2xl p-6 shadow-lg  hover:shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <Wrench className="h-5 w-5 text-blue-600" />
                              </div>
                              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold px-3 py-1">
                                Qté: {part.quantity}
                              </Badge>
                            </div>
                            
                            <div className="space-y-3">
                              <h3 className="font-bold text-gray-900 text-lg leading-tight">{part.partName}</h3>
                              
                              <div className="flex items-center space-x-2 text-gray-600">
                                <Hash className="h-3 w-3 text-gray-500" />
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{part.partCode}</span>
                              </div>
                              
                              {part.partNameFrench && (
                                <p className="text-sm text-gray-600 italic">{part.partNameFrench}</p>
                              )}
                              
                              {part.voiture && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Palette className="h-3 w-3 text-pink-500" />
                                    <span className="font-medium">{part.voiture.couleur}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Zap className="h-3 w-3 text-yellow-500" />
                                    <span className="font-medium">{part.voiture.motorisation}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Cog className="h-3 w-3 text-blue-500" />
                                    <span className="font-medium">{part.voiture.transmission}</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <BarChart3 className="h-3 w-3 text-green-500" />
                                    <span className="font-medium">{part.voiture.nbr_portes} portes</span>
                                  </div>
                                  model: {part.voiture.voitureModel?.model}
                                  
                                  

                                </div>
                                
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {parts.map((part, index) => (
                        <div 
                          key={part.id} 
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Wrench className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{part.partName}</p>
                              <div className="flex items-center space-x-3 text-sm text-gray-600">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{part.partCode}</span>
                                {part.partNameFrench && <span className="italic">{part.partNameFrench}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold">
                              Qté: {part.quantity}
                            </Badge>
                            {part.voiture && (
                              <div className="text-sm text-gray-600">
                                {part.voiture.couleur} • {part.voiture.motorisation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-2 border-dashed border-gray-300 bg-white/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Aucune pièce trouvée</h3>
                <p className="text-gray-500 text-center max-w-md">Aucune pièce ne correspond aux critères de recherche sélectionnés</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default StockDisponibleSparePartsClient