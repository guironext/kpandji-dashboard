'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Calendar,
  ShoppingCart,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type CommandeGroupeeType = {
  id: string
  date_validation: string
  stock_global: string
  vendue: string
  details: string
  stock_disponible: string
  createdAt: string
  updatedAt: string
  commandes: Array<{
    id: string
    couleur: string
    motorisation: string
    transmission: string
    nbr_portes: string
    etapeCommande: string
    commandeFlag: string
    date_livraison: string
    voitureModel: {
      model: string
    } | null
    client: {
      nom: string
    } | null
    clientEntreprise: {
      nom_entreprise: string
    } | null
  }>
}

type Props = {
  commandesGroupees: CommandeGroupeeType[]
}

const ListeCommandesGroupeesClient = ({ commandesGroupees }: Props) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())

  // Group commandesGroupees by date (date_validation)
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, CommandeGroupeeType[]>()
    
    commandesGroupees.forEach(cg => {
      const dateKey = format(new Date(cg.date_validation), 'yyyy-MM-dd', { locale: fr })
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(cg)
    })

    // Convert to array and sort by date (most recent first)
    return Array.from(groups.entries())
      .map(([date, items]) => ({
        date,
        formattedDate: format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr }),
        items: items.sort((a, b) => 
          new Date(b.date_validation).getTime() - new Date(a.date_validation).getTime()
        )
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [commandesGroupees])

  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(date)) {
        newSet.delete(date)
      } else {
        newSet.add(date)
      }
      return newSet
    })
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "d MMMM yyyy 'à' HH:mm", { locale: fr })
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMMM yyyy', { locale: fr })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-8">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Liste des Commandes Groupées
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Toutes les commandes groupées classées par date de validation
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {commandesGroupees.length} commande{commandesGroupees.length > 1 ? 's' : ''} groupée{commandesGroupees.length > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Commandes Groupées List */}
        {groupedByDate.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">Aucune commande groupée trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedByDate.map(({ date, formattedDate, items }) => (
              <div key={date} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900 capitalize">
                      {formattedDate}
                    </h2>
                    <Badge variant="secondary" className="ml-2">
                      {items.length} commande{items.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Commandes Groupées for this date */}
                <div className="grid gap-4">
                  {items.map((cg) => {
                    const isExpanded = expandedGroups.has(cg.id)
                    return (
                      <Card 
                        key={cg.id} 
                        className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
                      >
                        <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(cg.id)}>
                          <CollapsibleTrigger asChild>
                            <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <Package className="h-6 w-6" />
                                  </div>
                                  <div className="text-left">
                                    <CardTitle className="text-white text-xl mb-1">
                                      Commande Groupée #{cg.id.slice(0, 8)}
                                    </CardTitle>
                                    <p className="text-blue-100 text-sm">
                                      Validée le {formatDateTime(cg.date_validation)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex gap-3">
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-center">
                                      <div className="text-xs text-blue-100 mb-1">Stock Global</div>
                                      <div className="text-xl font-bold">{cg.stock_global}</div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-center">
                                      <div className="text-xs text-blue-100 mb-1">Vendues</div>
                                      <div className="text-xl font-bold text-green-200">{cg.vendue}</div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-center">
                                      <div className="text-xs text-blue-100 mb-1">Disponibles</div>
                                      <div className="text-xl font-bold text-yellow-200">{cg.stock_disponible}</div>
                                    </div>
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="h-6 w-6" />
                                  ) : (
                                    <ChevronDown className="h-6 w-6" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="p-6 space-y-4">
                              {/* Details */}
                              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex items-start gap-2 mb-2">
                                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                  <h3 className="font-semibold text-gray-900">Détails</h3>
                                </div>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{cg.details}</p>
                              </div>

                              {/* Commandes List */}
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <TrendingUp className="h-5 w-5 text-gray-600" />
                                  <h3 className="font-semibold text-gray-900">
                                    Commandes ({cg.commandes.length})
                                  </h3>
                                </div>
                                <div className="grid gap-3">
                                  {cg.commandes.map((commande) => (
                                    <div
                                      key={commande.id}
                                      className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                                    >
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                          <div className="bg-blue-100 p-2 rounded-lg">
                                            <Package className="h-4 w-4 text-blue-600" />
                                          </div>
                                          <div>
                                            <p className="font-bold text-gray-900">
                                              {commande.voitureModel?.model || 'N/A'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              Client: {commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'N/A'}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Badge 
                                            variant={commande.etapeCommande === 'VALIDE' ? 'default' : 'secondary'}
                                            className="text-xs"
                                          >
                                            {commande.etapeCommande}
                                          </Badge>
                                          <Badge 
                                            variant={commande.commandeFlag === 'VENDUE' ? 'destructive' : 'outline'}
                                            className="text-xs"
                                          >
                                            {commande.commandeFlag}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-500">Couleur:</span>
                                          <span className="font-semibold text-gray-900">{commande.couleur || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-500">Moteur:</span>
                                          <span className="font-semibold text-gray-900">{commande.motorisation || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-500">Trans:</span>
                                          <span className="font-semibold text-gray-900">{commande.transmission || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-500">Portes:</span>
                                          <span className="font-semibold text-gray-900">{commande.nbr_portes || 'N/A'}</span>
                                        </div>
                                      </div>
                                      <div className="mt-2 text-xs text-gray-500">
                                        Livraison prévue: {formatDate(commande.date_livraison)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ListeCommandesGroupeesClient

