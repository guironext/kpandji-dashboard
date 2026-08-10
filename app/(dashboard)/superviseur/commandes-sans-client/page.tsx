import React from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Calendar, 
  Package, 
  User, 
  Building2,
  Car,
  Tag,
  AlertCircle,
  Palette,
  Gauge,
  Settings,
  DoorOpen,
  TrendingUp,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  FileText
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatCurrency = (amount: number | string | null | { toString(): string }) => {
  if (!amount) return 'N/A'
  const num = typeof amount === 'string' ? parseFloat(amount) : typeof amount === 'number' ? amount : parseFloat(amount.toString())
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(num)
}

export default async function CommandesSansClientPage() {
  // Fetch all commandes with commandeFlag === 'DISPONIBLE'
  const commandesDisponibles = await prisma.commande.findMany({
    where: {
      commandeFlag: 'DISPONIBLE'
    },
    include: {
      Client: {
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      Client_entreprise: {
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      VoitureModel: true,
      Conteneur: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const totalCommandes = commandesDisponibles.length
  const totalValue = commandesDisponibles.reduce((sum, cmd) => {
    const prix = cmd.prix_unitaire ? Number(cmd.prix_unitaire.toString()) : 0
    return sum + prix
  }, 0)
  const averageValue = totalCommandes > 0 ? totalValue / totalCommandes : 0
  const commandesAvecClient = commandesDisponibles.filter(cmd => cmd.Client || cmd.Client_entreprise).length
  const commandesSansClient = totalCommandes - commandesAvecClient

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Enhanced Header Section */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform">
                  <ShoppingCart className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-2">
                    Commandes Fournisseur Disponibles
                  </h1>
                  <p className="text-slate-600 text-lg font-medium">
                    Gestion complète du stock disponible et suivi des commandes
                  </p>
                </div>
              </div>
              {totalCommandes > 0 && (
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">
                    {totalCommandes} {totalCommandes > 1 ? 'Commandes' : 'Commande'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-cyan-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 group-hover:from-blue-600/30 group-hover:to-cyan-600/30 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white/90">Total Commandes</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">{totalCommandes}</div>
              <p className="text-xs text-white/80 font-medium">
                Commandes disponibles
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-emerald-500 to-teal-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 group-hover:from-emerald-600/30 group-hover:to-teal-600/30 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white/90">Valeur Totale</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-white mb-1">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-white/80 font-medium">
                Valeur totale du stock
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-pink-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white/90">Valeur Moyenne</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(averageValue)}
              </div>
              <p className="text-xs text-white/80 font-medium">
                Par commande
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-orange-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20 group-hover:from-amber-600/30 group-hover:to-orange-600/30 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white/90">Sans Client</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">{commandesSansClient}</div>
              <p className="text-xs text-white/80 font-medium">
                Nécessitent attribution
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commandes List */}
        {totalCommandes === 0 ? (
          <Card className="border-dashed border-2 border-slate-300 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-24">
              <div className="p-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6 shadow-lg">
                <ShoppingCart className="h-20 w-20 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-slate-900">Aucune commande disponible</h3>
              <p className="text-slate-600 text-center max-w-md text-lg">
                Il n&apos;y a actuellement aucune commande avec le statut &quot;DISPONIBLE&quot;.
                Les nouvelles commandes disponibles apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {commandesDisponibles.map((commande) => {
              const client = commande.Client
              const clientEntreprise = commande.Client_entreprise
              const voitureModel = commande.VoitureModel
              const conteneur = commande.Conteneur
              const hasClient = !!(client || clientEntreprise)

              return (
                <Card 
                  key={commande.id} 
                  className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm group"
                >
                  {/* Header Section */}
                  <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 border-b border-slate-200/50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                          <Car className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-slate-900 mb-2">
                            {voitureModel?.model || 'Modèle non spécifié'}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3 mt-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold px-3 py-1">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {commande.commandeFlag}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold px-3 py-1">
                              <FileText className="h-3 w-3 mr-1" />
                              {commande.etapeCommande}
                            </Badge>
                            {!hasClient && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-3 py-1">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Sans Client
                              </Badge>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right md:text-left md:ml-auto">
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                          {formatCurrency(commande.prix_unitaire ? Number(commande.prix_unitaire) : null)}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Prix unitaire</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Client Information */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                          {client ? (
                            <>
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <span>Client Particulier</span>
                            </>
                          ) : clientEntreprise ? (
                            <>
                              <div className="p-2 bg-indigo-100 rounded-lg">
                                <Building2 className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span>Client Entreprise</span>
                            </>
                          ) : (
                            <>
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                              </div>
                              <span>Sans Client</span>
                            </>
                          )}
                        </div>
                        {client && (
                          <div className="space-y-2 pl-2">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="font-semibold text-slate-900 text-sm mb-1">
                                {client.User?.firstName} {client.User?.lastName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Phone className="h-3 w-3" />
                                <span>{client.telephone}</span>
                              </div>
                              {client.User?.email && (
                                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{client.User.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {clientEntreprise && (
                          <div className="space-y-2 pl-2">
                            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                              <p className="font-semibold text-slate-900 text-sm mb-1">
                                {clientEntreprise.nom_entreprise}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Phone className="h-3 w-3" />
                                <span>{clientEntreprise.telephone}</span>
                              </div>
                              {clientEntreprise.User?.email && (
                                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{clientEntreprise.User.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {!hasClient && (
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <p className="text-xs text-amber-700 font-medium italic">
                              Cette commande nécessite l&apos;attribution d&apos;un client
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Vehicle Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Car className="h-4 w-4 text-purple-600" />
                          </div>
                          <span>Détails Véhicule</span>
                        </div>
                        <div className="space-y-2 pl-2">
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                              <Palette className="h-3 w-3 text-purple-600" />
                              <span className="text-slate-500">Couleur</span>
                            </div>
                            <p className="font-semibold text-slate-900">{commande.couleur}</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                              <Gauge className="h-3 w-3 text-purple-600" />
                              <span className="text-slate-500">Motorisation</span>
                            </div>
                            <p className="font-semibold text-slate-900">{commande.motorisation}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                <Settings className="h-3 w-3 text-purple-600" />
                                <span>Transmission</span>
                              </div>
                              <p className="font-semibold text-slate-900 text-xs">{commande.transmission}</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                <DoorOpen className="h-3 w-3 text-purple-600" />
                                <span>Portes</span>
                              </div>
                              <p className="font-semibold text-slate-900 text-xs">{commande.nbr_portes}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-orange-600" />
                          </div>
                          <span>Dates Importantes</span>
                        </div>
                        <div className="space-y-2 pl-2">
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                              <Clock className="h-3 w-3 text-orange-600" />
                              <span>Livraison prévue</span>
                            </div>
                            <p className="font-semibold text-slate-900">{formatDate(commande.date_livraison)}</p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                              <FileText className="h-3 w-3 text-orange-600" />
                              <span>Créée le</span>
                            </div>
                            <p className="font-semibold text-slate-900">{formatDate(commande.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Conteneur Information */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Package className="h-4 w-4 text-green-600" />
                          </div>
                          <span>Conteneur</span>
                        </div>
                        {conteneur ? (
                          <div className="space-y-2 pl-2">
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                <Tag className="h-3 w-3 text-green-600" />
                                <span>Numéro</span>
                              </div>
                              <p className="font-semibold text-slate-900">{conteneur.conteneurNumber}</p>
                            </div>
                            {conteneur.sealNumber && (
                              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  <span>Sceau</span>
                                </div>
                                <p className="font-semibold text-slate-900">{conteneur.sealNumber}</p>
                              </div>
                            )}
                            <Badge variant="outline" className="w-full justify-center bg-green-50 text-green-700 border-green-200 font-semibold">
                              {conteneur.etapeConteneur}
                            </Badge>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 italic text-center">
                              Aucun conteneur assigné
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
