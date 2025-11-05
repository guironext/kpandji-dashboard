import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCommandesByUserId } from '@/lib/actions/commande'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'

const etapeColors = {
  PROPOSITION: { 
    gradient: 'from-slate-400 via-slate-500 to-slate-600',
    cardBg: 'bg-gradient-to-br from-slate-50 to-slate-100',
    badge: 'bg-slate-500',
    icon: '📋',
    shadow: 'shadow-slate-200'
  },
  VALIDE: { 
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
    badge: 'bg-blue-500',
    icon: '✅',
    shadow: 'shadow-blue-200'
  },
  TRANSITE: { 
    gradient: 'from-amber-400 via-amber-500 to-amber-600',
    cardBg: 'bg-gradient-to-br from-amber-50 to-amber-100',
    badge: 'bg-amber-500',
    icon: '🚢',
    shadow: 'shadow-amber-200'
  },
  RENSEIGNEE: { 
    gradient: 'from-purple-400 via-purple-500 to-purple-600',
    cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
    badge: 'bg-purple-500',
    icon: '📝',
    shadow: 'shadow-purple-200'
  },
  ARRIVE: { 
    gradient: 'from-indigo-400 via-indigo-500 to-indigo-600',
    cardBg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    badge: 'bg-indigo-500',
    icon: '🎯',
    shadow: 'shadow-indigo-200'
  },
  DECHARGE: { 
    gradient: 'from-pink-400 via-pink-500 to-pink-600',
    cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100',
    badge: 'bg-pink-500',
    icon: '📦',
    shadow: 'shadow-pink-200'
  },
  VERIFIER: { 
    gradient: 'from-orange-400 via-orange-500 to-orange-600',
    cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
    badge: 'bg-orange-500',
    icon: '🔍',
    shadow: 'shadow-orange-200'
  },
  MONTAGE: { 
    gradient: 'from-cyan-400 via-cyan-500 to-cyan-600',
    cardBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
    badge: 'bg-cyan-500',
    icon: '🔧',
    shadow: 'shadow-cyan-200'
  },
  TESTE: { 
    gradient: 'from-teal-400 via-teal-500 to-teal-600',
    cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100',
    badge: 'bg-teal-500',
    icon: '🧪',
    shadow: 'shadow-teal-200'
  },
  PARKING: { 
    gradient: 'from-lime-400 via-lime-500 to-lime-600',
    cardBg: 'bg-gradient-to-br from-lime-50 to-lime-100',
    badge: 'bg-lime-500',
    icon: '🅿️',
    shadow: 'shadow-lime-200'
  },
  CORRECTION: { 
    gradient: 'from-rose-400 via-rose-500 to-rose-600',
    cardBg: 'bg-gradient-to-br from-rose-50 to-rose-100',
    badge: 'bg-rose-500',
    icon: '🔨',
    shadow: 'shadow-rose-200'
  },
  VENTE: { 
    gradient: 'from-emerald-400 via-emerald-500 to-emerald-600',
    cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    badge: 'bg-emerald-500',
    icon: '💰',
    shadow: 'shadow-emerald-200'
  },
}

const etapeLabels = {
  PROPOSITION: 'Proposition',
  VALIDE: 'Validé',
  TRANSITE: 'En Transit',
  RENSEIGNEE: 'Renseignée',
  ARRIVE: 'Arrivée',
  DECHARGE: 'Déchargé',
  VERIFIER: 'À Vérifier',
  MONTAGE: 'En Montage',
  TESTE: 'Testé',
  PARKING: 'Au Parking',
  CORRECTION: 'En Correction',
  VENTE: 'Vendu',
}

async function Page() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    redirect('/onboarding')
  }

  const result = await getCommandesByUserId(user.id)

  if (!result.success || !result.data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Suivi de Mes Commandes</h1>
        <p className="text-gray-500">Erreur lors du chargement des commandes</p>
      </div>
    )
  }

  const commandes = result.data

  // Group commandes by etapeCommande
  const groupedCommandes = commandes.reduce((acc, commande) => {
    const etape = commande.etapeCommande
    if (!acc[etape]) {
      acc[etape] = []
    }
    acc[etape].push(commande)
    return acc
  }, {} as Record<string, typeof commandes>)

  // Order of stages
  const etapeOrder = [
    'PROPOSITION', 'VALIDE', 'TRANSITE', 'RENSEIGNEE', 'ARRIVE', 
    'DECHARGE', 'VERIFIER', 'MONTAGE', 'TESTE', 'PARKING', 'CORRECTION', 'VENTE'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
      {/* Header Section with Gradient */}
      <div className="mb-8 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
    <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
              🚗 Suivi de Mes Commandes
            </h1>
            <p className="text-white/90 text-lg">
              Suivez l&apos;évolution de vos commandes en temps réel
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/30">
            <p className="text-white/70 text-sm">Total</p>
            <p className="text-4xl font-bold text-white">{commandes.length}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {etapeOrder.map((etape) => {
          const commandesInEtape = groupedCommandes[etape] || []
          if (commandesInEtape.length === 0) return null

          const colors = etapeColors[etape as keyof typeof etapeColors]

          return (
            <div key={etape} className="animate-fadeIn">
              <Card className={`border-0 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300 ${colors.shadow}`}>
                {/* Stage Header with Gradient */}
                <CardHeader className={`bg-gradient-to-r ${colors.gradient} p-6`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <CardTitle className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                      <span className="text-4xl">{colors.icon}</span>
                      {etapeLabels[etape as keyof typeof etapeLabels]}
                    </CardTitle>
                    <Badge className="bg-white/20 backdrop-blur-lg text-white border-white/30 px-4 py-2 text-lg">
                      {commandesInEtape.length} commande{commandesInEtape.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>

                {/* Cards Grid */}
                <CardContent className={`p-6 ${colors.cardBg}`}>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {commandesInEtape.map((commande, index) => (
                      <Card 
                        key={commande.id} 
                        className="group bg-white border-0 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Color Accent Bar */}
                        <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                        
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Model and Color */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">🚘</span>
                                <span className="text-lg font-bold text-gray-800 line-clamp-2">
                                  {commande.voitureModel?.model || 'Modèle non spécifié'}
                                </span>
                              </div>
                              <Badge className={`${colors.badge} text-white shrink-0`}>
                                {commande.couleur}
                              </Badge>
                            </div>

                            {/* Main Info */}
                            <div className="space-y-2 bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-lg">👤</span>
                                <span className="font-semibold text-gray-700">{commande.client?.nom || "N/A"}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <span>⚙️</span>
                                  <span>{commande.transmission}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>⚡</span>
                                  <span>{commande.motorisation}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>🚪</span>
                                  <span>{commande.nbr_portes} portes</span>
                                </div>
                              </div>
                            </div>

                            {/* Container Info */}
                            {commande.conteneur && (
                              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-200">
                                <p className="text-xs font-semibold text-blue-700 mb-1">📦 Conteneur</p>
                                <p className="text-sm font-bold text-blue-900">{commande.conteneur.conteneurNumber}</p>
                              </div>
                            )}

                            {/* Suppliers */}
                            {commande.fournisseurs.length > 0 && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200">
                                <p className="text-xs font-semibold text-green-700 mb-1">🏭 Fournisseur(s)</p>
                                <div className="space-y-1">
                                  {commande.fournisseurs.map((f) => (
                                    <p key={f.id} className="text-sm text-green-900 flex items-center gap-1">
                                      <span className="text-green-500">•</span>
                                      {f.nom}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dates */}
                            <div className="border-t pt-3 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 flex items-center gap-1">
                                  📅 Créée
                                </span>
                                <span className="font-semibold text-gray-700">
                                  {new Date(commande.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 flex items-center gap-1">
                                  🚚 Livraison
                                </span>
                                <span className="font-semibold text-gray-700">
                                  {new Date(commande.date_livraison).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {commandes.length === 0 && (
        <Card className="border-0 shadow-2xl">
          <CardContent className="py-20 text-center">
            <div className="text-8xl mb-4">📭</div>
            <p className="text-2xl font-semibold text-gray-700 mb-2">Aucune commande trouvée</p>
            <p className="text-gray-500">Vos commandes apparaîtront ici</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Page