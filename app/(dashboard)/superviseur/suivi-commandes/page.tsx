import React from 'react'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Calendar, 
  Package, 
  User, 
  Building2,
  Car,
  AlertCircle,
  DollarSign,
  Sparkles,
  Phone,
  Mail,
  Users,
  Briefcase
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

const getEtapeBadgeColor = (etape: string) => {
  switch (etape) {
    case 'PROPOSITION':
      return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0'
    case 'VALIDE':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
    case 'TRANSITE':
      return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0'
    case 'RENSEIGNEE':
      return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
    case 'ARRIVE':
      return 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0'
    case 'VERIFIER':
      return 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0'
    case 'MONTAGE':
      return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0'
    case 'TESTE':
      return 'bg-gradient-to-r from-lime-500 to-green-500 text-white border-0'
    case 'PARKING':
      return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0'
    case 'CORRECTION':
      return 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0'
    case 'VENTE':
      return 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0'
    default:
      return 'bg-gradient-to-r from-slate-500 to-gray-500 text-white border-0'
  }
}

const etapeOrder = [
  'PROPOSITION', 'VALIDE', 'TRANSITE', 'RENSEIGNEE', 'ARRIVE', 
  'VERIFIER', 'MONTAGE', 'TESTE', 'PARKING', 'CORRECTION', 'VENTE',
  'DECHARGE', 'CHARGE', 'TRANSITE_NON_RENSEIGNE', 'TRANSITE_DEJA_RENSEIGNE', 'DEPOTAGE_EN_COURS'
]

type CommandeWithRelations = Prisma.CommandeGetPayload<{
  include: {
    Client: {
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }
    Client_entreprise: {
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }
    VoitureModel: true
    Conteneur: true
  }
}>

export default async function SuiviCommandesPage() {
  let commandes: CommandeWithRelations[] = []
  let error: string | null = null

  try {
    // Fetch all commandes from commercial users
    commandes = await prisma.commande.findMany({
      where: {
        OR: [
          {
            Client: {
              User: {
                role: 'COMMERCIAL'
              }
            }
          },
          {
            Client_entreprise: {
              User: {
                role: 'COMMERCIAL'
              }
            }
          }
        ]
      },
      include: {
        Client: {
          include: {
            User: {
              select: {
                id: true,
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
                id: true,
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
  } catch (err) {
    console.error('Error fetching commandes:', err)
    error = err instanceof Error ? err.message : 'Erreur lors de la récupération des commandes'
  }

  // Group commandes by commercial and etapeCommande
  type GroupedCommandes = Record<string, Record<string, CommandeWithRelations[]>>
  const groupedByCommercial: GroupedCommandes = {}

  commandes.forEach((commande) => {
    const commercial = commande.Client?.User || commande.Client_entreprise?.User
    if (!commercial) return

    const commercialKey = `${commercial.id}_${commercial.firstName}_${commercial.lastName}`
    const etape = commande.etapeCommande

    if (!groupedByCommercial[commercialKey]) {
      groupedByCommercial[commercialKey] = {}
    }
    if (!groupedByCommercial[commercialKey][etape]) {
      groupedByCommercial[commercialKey][etape] = []
    }
    groupedByCommercial[commercialKey][etape].push(commande)
  })

  // Calculate statistics
  const totalCommandes = commandes.length
  const totalValue = commandes.reduce((sum, cmd) => {
    const prix = cmd.prix_unitaire ? Number(cmd.prix_unitaire.toString()) : 0
    return sum + prix
  }, 0)
  const uniqueCommercials = Object.keys(groupedByCommercial).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
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
                    Suivi des Commandes Commerciales
                  </h1>
                  <p className="text-slate-600 text-lg font-medium">
                    Vue d&apos;ensemble des commandes par commercial et étape
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
                Commandes commerciales
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
                Valeur totale du portefeuille
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-pink-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all duration-300"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-white/90">Commerciaux</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-1">{uniqueCommercials}</div>
              <p className="text-xs text-white/80 font-medium">
                Commerciaux actifs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-2 border-red-300 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-24">
              <div className="p-8 bg-gradient-to-br from-red-100 to-rose-100 rounded-full mb-6 shadow-lg">
                <AlertCircle className="h-20 w-20 text-red-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-slate-900">Erreur de connexion à la base de données</h3>
              <p className="text-slate-600 text-center max-w-md text-lg mb-4">
                {error}
              </p>
              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 max-w-2xl">
                <p className="font-semibold mb-2">Solutions possibles :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Vérifiez que votre fichier <code className="bg-slate-200 px-1 rounded">.env.local</code> contient la variable <code className="bg-slate-200 px-1 rounded">DATABASE_URL</code></li>
                  <li>Vérifiez que le serveur de base de données est accessible</li>
                  <li>Si vous utilisez Neon, vérifiez que la base de données n&apos;est pas en pause</li>
                  <li>Vérifiez votre connexion internet</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commandes grouped by commercial */}
        {!error && totalCommandes === 0 ? (
          <Card className="border-dashed border-2 border-slate-300 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-24">
              <div className="p-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6 shadow-lg">
                <ShoppingCart className="h-20 w-20 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-slate-900">Aucune commande commerciale</h3>
              <p className="text-slate-600 text-center max-w-md text-lg">
                Il n&apos;y a actuellement aucune commande associée aux commerciaux.
              </p>
            </CardContent>
          </Card>
        ) : !error && (
          <div className="space-y-6">
            {Object.entries(groupedByCommercial).map(([commercialKey, etapes]) => {
              const [, firstName, lastName] = commercialKey.split('_')
              const commercialName = `${firstName} ${lastName}`
              
              // Get commercial info from first commande
              const firstCommande = Object.values(etapes).flat()[0]
              const commercial = firstCommande?.Client?.User || firstCommande?.Client_entreprise?.User
              
              // Count total commandes for this commercial
              const totalCommandeForCommercial = Object.values(etapes).reduce((sum, arr) => sum + arr.length, 0)
              const totalValueForCommercial = Object.values(etapes).flat().reduce((sum, cmd) => {
                const prix = cmd.prix_unitaire ? Number(cmd.prix_unitaire.toString()) : 0
                return sum + prix
              }, 0)

              return (
                <Card 
                  key={commercialKey}
                  className="overflow-hidden border-0 shadow-xl bg-white/90 backdrop-blur-sm"
                >
                  <CardHeader className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 border-b border-slate-200/50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                          <User className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                            {commercialName}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold px-3 py-1">
                              <Briefcase className="h-3 w-3 mr-1" />
                              Commercial
                            </Badge>
                            {commercial?.email && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="h-3 w-3" />
                                <span>{commercial.email}</span>
                              </div>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 md:items-center">
                        <div className="text-center md:text-right">
                          <div className="text-2xl font-bold text-slate-900">{totalCommandeForCommercial}</div>
                          <p className="text-xs text-slate-500 font-medium">Commandes</p>
                        </div>
                        <div className="text-center md:text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {formatCurrency(totalValueForCommercial)}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Valeur totale</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <Accordion type="multiple" className="w-full">
                      {etapeOrder
                        .filter(etape => etapes[etape] && etapes[etape].length > 0)
                        .map((etape) => {
                          const commandesForEtape = etapes[etape]
                          const count = commandesForEtape.length
                          const value = commandesForEtape.reduce((sum, cmd) => {
                            const prix = cmd.prix_unitaire ? Number(cmd.prix_unitaire.toString()) : 0
                            return sum + prix
                          }, 0)

                          return (
                            <AccordionItem key={etape} value={etape} className="border-slate-200">
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-3">
                                    <Badge className={getEtapeBadgeColor(etape)}>
                                      {etape}
                                    </Badge>
                                    <span className="text-sm font-medium text-slate-600">
                                      {count} {count > 1 ? 'commandes' : 'commande'}
                                    </span>
                                  </div>
                                  <div className="text-sm font-semibold text-green-600">
                                    {formatCurrency(value)}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-4">
                                  {commandesForEtape.map((commande) => {
                                    const client = commande.Client
                                    const clientEntreprise = commande.Client_entreprise
                                    const voitureModel = commande.VoitureModel
                                    const conteneur = commande.Conteneur

                                    return (
                                      <Card 
                                        key={commande.id}
                                        className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                                      >
                                        <CardHeader className="pb-3">
                                          <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                              <div className="p-2 bg-purple-100 rounded-lg">
                                                <Car className="h-5 w-5 text-purple-600" />
                                              </div>
                                              <div>
                                                <CardTitle className="text-lg font-bold text-slate-900">
                                                  {voitureModel?.model || 'Modèle non spécifié'}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                  <div className="flex items-center gap-2 text-xs">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Livraison: {formatDate(commande.date_livraison)}</span>
                                                  </div>
                                                </CardDescription>
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-xl font-bold text-green-600">
                                                {formatCurrency(commande.prix_unitaire ? Number(commande.prix_unitaire) : null)}
                                              </div>
                                            </div>
                                          </div>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Client Info */}
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                {client ? (
                                                  <>
                                                    <User className="h-3 w-3 text-blue-600" />
                                                    <span>Client Particulier</span>
                                                  </>
                                                ) : clientEntreprise ? (
                                                  <>
                                                    <Building2 className="h-3 w-3 text-indigo-600" />
                                                    <span>Client Entreprise</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <AlertCircle className="h-3 w-3 text-amber-600" />
                                                    <span>Sans Client</span>
                                                  </>
                                                )}
                                              </div>
                                              {client && (
                                                <div className="p-2 bg-blue-50 rounded-lg text-xs">
                                                  <p className="font-semibold text-slate-900">{client.nom}</p>
                                                  <div className="flex items-center gap-1 text-slate-600 mt-1">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{client.telephone}</span>
                                                  </div>
                                                </div>
                                              )}
                                              {clientEntreprise && (
                                                <div className="p-2 bg-indigo-50 rounded-lg text-xs">
                                                  <p className="font-semibold text-slate-900">{clientEntreprise.nom_entreprise}</p>
                                                  <div className="flex items-center gap-1 text-slate-600 mt-1">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{clientEntreprise.telephone}</span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {/* Vehicle Details */}
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                <Car className="h-3 w-3 text-purple-600" />
                                                <span>Détails Véhicule</span>
                                              </div>
                                              <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2 bg-purple-50 rounded-lg">
                                                  <div className="text-slate-500 mb-1">Couleur</div>
                                                  <div className="font-semibold text-slate-900">{commande.couleur}</div>
                                                </div>
                                                <div className="p-2 bg-purple-50 rounded-lg">
                                                  <div className="text-slate-500 mb-1">Motorisation</div>
                                                  <div className="font-semibold text-slate-900">{commande.motorisation}</div>
                                                </div>
                                                <div className="p-2 bg-purple-50 rounded-lg">
                                                  <div className="text-slate-500 mb-1">Transmission</div>
                                                  <div className="font-semibold text-slate-900">{commande.transmission}</div>
                                                </div>
                                                <div className="p-2 bg-purple-50 rounded-lg">
                                                  <div className="text-slate-500 mb-1">Portes</div>
                                                  <div className="font-semibold text-slate-900">{commande.nbr_portes}</div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Conteneur Info */}
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                                                <Package className="h-3 w-3 text-green-600" />
                                                <span>Conteneur</span>
                                              </div>
                                              {conteneur ? (
                                                <div className="p-2 bg-green-50 rounded-lg text-xs">
                                                  <div className="font-semibold text-slate-900">{conteneur.conteneurNumber}</div>
                                                  <Badge variant="outline" className="mt-2 text-xs bg-green-50 text-green-700 border-green-200">
                                                    {conteneur.etapeConteneur}
                                                  </Badge>
                                                </div>
                                              ) : (
                                                <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-500 italic">
                                                  Aucun conteneur assigné
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    )
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )
                        })}
                    </Accordion>
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
