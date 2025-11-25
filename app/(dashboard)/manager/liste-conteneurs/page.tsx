import React from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Calendar, Ship, ArrowRight, TrendingUp, CheckCircle2, Clock, FileCheck, Box, Hash, Layers, Activity } from "lucide-react"
import { EtapeConteneur } from '@/lib/generated/prisma'
import { RenseignerButton } from './RenseignerButton'


async function getConteneurs() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      include: {
        commandes: {
          include: {
            voitureModel: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Serialize dates and Decimal fields for client component
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      ...conteneur,
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
      commandes: conteneur.commandes.map((commande) => ({
        ...commande,
        prix_unitaire: commande.prix_unitaire ? Number(commande.prix_unitaire) : null,
        date_livraison: commande.date_livraison.toISOString(),
        createdAt: commande.createdAt.toISOString(),
        updatedAt: commande.updatedAt.toISOString(),
      })),
    }))

    return { success: true, data: serializedConteneurs }
  } catch (error) {
    console.error("Error fetching conteneurs:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch conteneurs" }
  }
}

const getEtapeConteneurLabel = (etape: EtapeConteneur): string => {
  const labels: Record<EtapeConteneur, string> = {
    EN_ATTENTE: "En Attente",
    CHARGE: "Chargé",
    TRANSITE: "En Transit",
    RENSEIGNE: "Renseigné",
    ARRIVE: "Arrivé",
    DECHARGE: "Déchargé",
    VERIFIE: "Vérifié",
  }
  return labels[etape] || etape
}

const getEtapeConteneurBadgeVariant = (etape: EtapeConteneur): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<EtapeConteneur, "default" | "secondary" | "destructive" | "outline"> = {
    EN_ATTENTE: "outline",
    CHARGE: "secondary",
    TRANSITE: "default",
    RENSEIGNE: "secondary",
    ARRIVE: "default",
    DECHARGE: "secondary",
    VERIFIE: "default",
  }
  return variants[etape] || "default"
}

const getEtapeConteneurColor = (etape: EtapeConteneur): string => {
  const colors: Record<EtapeConteneur, string> = {
    EN_ATTENTE: "bg-gray-50 border-gray-200",
    CHARGE: "bg-blue-50 border-blue-200",
    TRANSITE: "bg-purple-50 border-purple-200",
    RENSEIGNE: "bg-yellow-50 border-yellow-200",
    ARRIVE: "bg-green-50 border-green-200",
    DECHARGE: "bg-orange-50 border-orange-200",
    VERIFIE: "bg-emerald-50 border-emerald-200",
  }
  return colors[etape] || "bg-gray-50 border-gray-200"
}

const getEtapeConteneurIcon = (etape: EtapeConteneur) => {
  const icons: Record<EtapeConteneur, typeof Package> = {
    EN_ATTENTE: Clock,
    CHARGE: Package,
    TRANSITE: Ship,
    RENSEIGNE: FileCheck,
    ARRIVE: CheckCircle2,
    DECHARGE: Box,
    VERIFIE: CheckCircle2,
  }
  return icons[etape] || Package
}

const getEtapeConteneurIconColor = (etape: EtapeConteneur): string => {
  const colors: Record<EtapeConteneur, string> = {
    EN_ATTENTE: "text-gray-600",
    CHARGE: "text-blue-600",
    TRANSITE: "text-purple-600",
    RENSEIGNE: "text-yellow-600",
    ARRIVE: "text-green-600",
    DECHARGE: "text-orange-600",
    VERIFIE: "text-emerald-600",
  }
  return colors[etape] || "text-gray-600"
}

const getEtapeConteneurGradient = (etape: EtapeConteneur): string => {
  const gradients: Record<EtapeConteneur, string> = {
    EN_ATTENTE: "from-gray-400 to-gray-300",
    CHARGE: "from-blue-500 to-blue-400",
    TRANSITE: "from-purple-500 to-purple-400",
    RENSEIGNE: "from-yellow-500 to-yellow-400",
    ARRIVE: "from-green-500 to-green-400",
    DECHARGE: "from-orange-500 to-orange-400",
    VERIFIE: "from-emerald-500 to-emerald-400",
  }
  return gradients[etape] || "from-gray-400 to-gray-300"
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getRelativeTime = (dateString: string | null): string => {
  if (!dateString) return ""
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return "Aujourd'hui"
  if (diffInDays === 1) return "Hier"
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`
  if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`
  if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`
  return `Il y a ${Math.floor(diffInDays / 365)} ans`
}

export default async function Page() {
  const result = await getConteneurs()

  if (!result.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center p-6">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl max-w-2xl w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative p-6 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl shadow-xl">
                  <Package className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-700 to-orange-700 bg-clip-text text-transparent">
                  Erreur de connexion à la base de données
                </h1>
                <p className="text-red-700 text-lg">
                  Impossible de se connecter au serveur de base de données.
                </p>
              </div>
              <div className="w-full bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm font-mono text-slate-800 break-all text-left">
                  {result.error}
                </p>
              </div>                                                                                                                                                  
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const conteneurs = result.data || []

  // Group conteneurs by etapeConteneur
  const groupedConteneurs = conteneurs.reduce((acc, conteneur) => {
    const etape = conteneur.etapeConteneur
    if (!acc[etape]) {
      acc[etape] = []
    }
    acc[etape].push(conteneur)
    return acc
  }, {} as Record<EtapeConteneur, typeof conteneurs>)

  // Calculate statistics
  const stats = {
    total: conteneurs.length,
    enAttente: groupedConteneurs[EtapeConteneur.EN_ATTENTE]?.length || 0,
    charge: groupedConteneurs[EtapeConteneur.CHARGE]?.length || 0,
    transit: groupedConteneurs[EtapeConteneur.TRANSITE]?.length || 0,
    renseigne: groupedConteneurs[EtapeConteneur.RENSEIGNE]?.length || 0,
    arrive: groupedConteneurs[EtapeConteneur.ARRIVE]?.length || 0,
    decharge: groupedConteneurs[EtapeConteneur.DECHARGE]?.length || 0,
    verifie: groupedConteneurs[EtapeConteneur.VERIFIE]?.length || 0,
    totalCommandes: conteneurs.reduce((sum, c) => sum + c.commandes.length, 0),
  }

  // Define the order of etapes
  const etapeOrder: EtapeConteneur[] = [
    EtapeConteneur.EN_ATTENTE,
    EtapeConteneur.CHARGE,
    EtapeConteneur.TRANSITE,
    EtapeConteneur.RENSEIGNE,
    EtapeConteneur.ARRIVE,
    EtapeConteneur.DECHARGE,
    EtapeConteneur.VERIFIE,
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-[1920px] space-y-6 md:space-y-8">
        {/* Premium Header with Animated Background */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl"></div>
                    <div className="relative p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/30">
                      <Package className="h-8 w-8 md:h-10 md:w-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-xl tracking-tight">
                      Liste des Conteneurs
                    </h1>
                    <p className="text-blue-100/90 text-base md:text-lg mt-2 font-medium">
                      Vue d&apos;ensemble complète classée par étape de progression
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Stats Cards */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <Card className="border-0 bg-white/20 backdrop-blur-md shadow-xl hover:bg-white/25 transition-all duration-300">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 md:p-3 bg-white/30 rounded-xl">
                        <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-blue-100/90 font-medium">Total</p>
                        <p className="text-2xl md:text-3xl font-bold text-white">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-white/20 backdrop-blur-md shadow-xl hover:bg-white/25 transition-all duration-300">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 md:p-3 bg-white/30 rounded-xl">
                        <Layers className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-blue-100/90 font-medium">Commandes</p>
                        <p className="text-2xl md:text-3xl font-bold text-white">{stats.totalCommandes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Conteneurs Classified by EtapeConteneur */}
      {etapeOrder.map((etape, etapeIndex) => {
        const conteneursInEtape = groupedConteneurs[etape] || []
        const count = conteneursInEtape.length
        const totalCommandesInEtape = conteneursInEtape.reduce((sum, c) => sum + c.commandes.length, 0)
        const totalPackagesInEtape = conteneursInEtape.reduce((sum, c) => sum + (Number(c.totalPackages) || 0), 0)
        
        const Icon = getEtapeConteneurIcon(etape)
        const iconColor = getEtapeConteneurIconColor(etape)

        // Skip empty etapes
        if (count === 0) return null

        return (
          <div key={etape} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${etapeIndex * 100}ms` }}>
            {/* Enhanced Statistics Cards for this Etape */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Main Etape Card */}
              <Card 
                className={`${getEtapeConteneurColor(etape)} border-2 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getEtapeConteneurGradient(etape)} opacity-10 rounded-full blur-2xl`}></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg bg-white/60 ${iconColor}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {getEtapeConteneurLabel(etape)}
                        </p>
                      </div>
                      <p className="text-4xl md:text-5xl font-bold group-hover:scale-110 transition-transform duration-300 mb-1">
                        {count}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        conteneur{count > 1 ? 's' : ''} actif{count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className={`p-4 rounded-xl bg-white/60 group-hover:bg-white/80 transition-all duration-300 shadow-lg ${iconColor}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Commandes Summary for this Etape */}
              {totalCommandesInEtape > 0 && (
                <Card className={`border-0 shadow-xl bg-gradient-to-br ${getEtapeConteneurGradient(etape)} overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative group`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-white/80" />
                          <p className="text-xs font-bold text-white/90 uppercase tracking-wider">
                            Commandes
                          </p>
                        </div>
                        <p className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                          {totalCommandesInEtape}
                        </p>
                        <p className="text-xs text-white/70 mt-1 font-medium">
                          dans cette étape
                        </p>
                      </div>
                      <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all shadow-lg">
                        <Package className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Packages Summary for this Etape */}
              {totalPackagesInEtape > 0 && (
                <Card className={`border-0 shadow-xl bg-gradient-to-br ${getEtapeConteneurGradient(etape)} overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative group`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Box className="h-4 w-4 text-white/80" />
                          <p className="text-xs font-bold text-white/90 uppercase tracking-wider">
                            Colis
                          </p>
                        </div>
                        <p className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                          {totalPackagesInEtape}
                        </p>
                        <p className="text-xs text-white/70 mt-1 font-medium">
                          au total
                        </p>
                      </div>
                      <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-all shadow-lg">
                        <Box className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Enhanced Conteneurs Table for this Etape */}
            <Card 
              className={`w-full border-0 shadow-2xl bg-white/95 backdrop-blur-xl overflow-hidden hover:shadow-3xl transition-all duration-500 group`}
            >
              {/* Animated top border */}
              <div className={`h-2 bg-gradient-to-r ${getEtapeConteneurGradient(etape)} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
              
              <CardHeader className="pb-5 pt-6 px-6 bg-gradient-to-br from-white via-slate-50/50 to-white border-b border-slate-200/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`relative p-3.5 rounded-xl bg-gradient-to-br ${getEtapeConteneurColor(etape)} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${getEtapeConteneurGradient(etape)} opacity-20 rounded-xl`}></div>
                      <Icon className={`h-6 w-6 ${iconColor} relative z-10`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                        {getEtapeConteneurLabel(etape)}
                      </CardTitle>
                      <CardDescription className="mt-1.5 text-sm md:text-base flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5" />
                          {count} conteneur{count > 1 ? 's' : ''}
                        </span>
                        {totalCommandesInEtape > 0 && (
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-400">•</span>
                            <Package className="h-3.5 w-3.5" />
                            {totalCommandesInEtape} commande{totalCommandesInEtape > 1 ? 's' : ''}
                          </span>
                        )}
                        {totalPackagesInEtape > 0 && (
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-400">•</span>
                            <Box className="h-3.5 w-3.5" />
                            {totalPackagesInEtape} colis
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={getEtapeConteneurBadgeVariant(etape)} 
                    className="text-sm md:text-base px-4 py-2 font-bold shadow-lg w-fit"
                  >
                    {count} {count > 1 ? 'éléments' : 'élément'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 via-slate-100/80 to-slate-50 border-b-2 border-slate-200 hover:bg-slate-100/50">
                        <TableHead className="font-bold text-slate-700 py-4 text-sm md:text-base whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Numéro
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-700 py-4 text-sm md:text-base whitespace-nowrap">Scellé</TableHead>
                        <TableHead className="font-bold text-slate-700 py-4 text-sm md:text-base whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Création
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-700 py-4 text-sm md:text-base whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Ship className="h-4 w-4" />
                            Embarquement
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-700 py-4 text-sm md:text-base whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            Arrivée
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-700 py-4 text-sm md:text-base whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4" />
                            Colis
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-700 py-4 text-center text-sm md:text-base whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Package className="h-4 w-4" />
                            Commandes
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-700 py-4 text-center text-sm md:text-base whitespace-nowrap">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conteneursInEtape.map((conteneur, index) => (
                        <TableRow 
                          key={conteneur.id} 
                          className={`border-b border-slate-100/80 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-200 group/row ${
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          }`}
                        >
                          <TableCell className="font-semibold py-5 text-sm md:text-base">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-blue-100 group-hover/row:bg-blue-200 transition-colors">
                                <Hash className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-slate-900 font-bold">{conteneur.conteneurNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <Badge variant="outline" className="font-mono text-xs md:text-sm bg-slate-50 border-slate-300 hover:bg-slate-100 transition-colors">
                              {conteneur.sealNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-900">{formatDate(conteneur.createdAt)}</span>
                              </div>
                              <span className="text-xs text-slate-500 ml-6">
                                {getRelativeTime(conteneur.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            {conteneur.dateEmbarquement ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Ship className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-slate-900">{formatDate(conteneur.dateEmbarquement)}</span>
                                </div>
                                <span className="text-xs text-slate-500 ml-6">
                                  {getRelativeTime(conteneur.dateEmbarquement)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm italic flex items-center gap-1">
                                <span>—</span>
                                <span className="hidden sm:inline">Non défini</span>
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-5">
                            {conteneur.dateArriveProbable ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-slate-900">{formatDate(conteneur.dateArriveProbable)}</span>
                                </div>
                                <span className="text-xs text-slate-500 ml-6">
                                  {getRelativeTime(conteneur.dateArriveProbable)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm italic flex items-center gap-1">
                                <span>—</span>
                                <span className="hidden sm:inline">Non défini</span>
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-5">
                            {conteneur.totalPackages ? (
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-purple-100 group-hover/row:bg-purple-200 transition-colors">
                                  <Box className="h-4 w-4 text-purple-600" />
                                </div>
                                <span className="font-semibold text-slate-900">{conteneur.totalPackages}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-5">
                            <Badge 
                              variant="secondary" 
                              className="flex items-center gap-1.5 w-fit mx-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-md hover:shadow-lg font-bold px-3 py-1.5 transition-all duration-200"
                            >
                              <Package className="h-3.5 w-3.5" />
                              <span>{conteneur.commandes.length}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-5">
                            <RenseignerButton 
                              conteneurId={conteneur.id}
                              currentEtape={conteneur.etapeConteneur}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}

        {conteneurs.length === 0 && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50/80 to-white backdrop-blur-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400"></div>
            <CardContent className="flex flex-col items-center justify-center py-24 px-6">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="relative p-8 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-3xl shadow-2xl border border-white/50">
                  <Package className="h-20 w-20 text-blue-600" />
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-4 text-center">
                Aucun conteneur trouvé
              </h3>
              <p className="text-slate-600 text-center max-w-lg text-lg leading-relaxed">
                Il n&apos;y a actuellement aucun conteneur dans le système. Les conteneurs apparaîtront ici une fois créés et seront automatiquement classés par étape.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}