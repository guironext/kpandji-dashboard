import React from 'react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Calendar, Ship, ArrowRight, TrendingUp, CheckCircle2, Clock, FileCheck, Box, Weight, Hash } from "lucide-react"
import { EtapeConteneur } from '@/lib/generated/prisma'

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

    // Serialize dates for client component
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      ...conteneur,
      createdAt: conteneur.createdAt.toISOString(),
      updatedAt: conteneur.updatedAt.toISOString(),
      dateEmbarquement: conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: conteneur.dateArriveProbable?.toISOString() || null,
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
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Erreur de connexion à la base de données</h1>
          <p className="text-red-700 mb-4">
            Impossible de se connecter au serveur de base de données.
          </p>
          <div className="bg-white rounded p-4 mb-4">
            <p className="text-sm font-mono text-gray-800 break-all">
              {result.error}
            </p>
          </div>
        </div>
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            Liste des Conteneurs
          </h1>
          <p className="text-muted-foreground mt-2">
            Vue d&apos;ensemble de tous les conteneurs classés par étape
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {etapeOrder.map((etape) => {
          const count = groupedConteneurs[etape]?.length || 0
          const Icon = getEtapeConteneurIcon(etape)
          const iconColor = getEtapeConteneurIconColor(etape)
          
          return (
            <Card key={etape} className={`${getEtapeConteneurColor(etape)} border-2 hover:shadow-md transition-shadow`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {getEtapeConteneurLabel(etape)}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Card */}
      {stats.totalCommandes > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total des Commandes</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalCommandes}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Réparties sur</p>
                <p className="text-xl font-semibold">{stats.total} conteneur{stats.total > 1 ? 's' : ''}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteneurs by Status */}
      {etapeOrder.map((etape) => {
        const conteneursInEtape = groupedConteneurs[etape] || []
        if (conteneursInEtape.length === 0) return null

        const Icon = getEtapeConteneurIcon(etape)
        const iconColor = getEtapeConteneurIconColor(etape)

        return (
          <Card key={etape} className={`w-full ${getEtapeConteneurColor(etape)} border-2 shadow-sm`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{getEtapeConteneurLabel(etape)}</CardTitle>
                    <CardDescription className="mt-1">
                      {conteneursInEtape.length} conteneur{conteneursInEtape.length > 1 ? 's' : ''} dans cette étape
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={getEtapeConteneurBadgeVariant(etape)} className="text-sm px-3 py-1">
                  {conteneursInEtape.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Numéro Conteneur</TableHead>
                      <TableHead className="font-semibold">Scellé</TableHead>
                      <TableHead className="font-semibold">Création</TableHead>
                      <TableHead className="font-semibold">Embarquement</TableHead>
                      <TableHead className="font-semibold">Arrivée Probable</TableHead>
                      <TableHead className="font-semibold">Colis</TableHead>
                      <TableHead className="font-semibold">Poids Brut</TableHead>
                      <TableHead className="font-semibold">Poids Net</TableHead>
                      <TableHead className="font-semibold text-center">Commandes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conteneursInEtape.map((conteneur, index) => (
                      <TableRow 
                        key={conteneur.id} 
                        className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}
                      >
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            {conteneur.conteneurNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {conteneur.sealNumber}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{formatDate(conteneur.createdAt)}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(conteneur.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {conteneur.dateEmbarquement ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Ship className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-sm">{formatDate(conteneur.dateEmbarquement)}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(conteneur.dateEmbarquement)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non défini</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {conteneur.dateArriveProbable ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-sm">{formatDate(conteneur.dateArriveProbable)}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {getRelativeTime(conteneur.dateArriveProbable)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non défini</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {conteneur.totalPackages ? (
                            <div className="flex items-center gap-1.5">
                              <Box className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{conteneur.totalPackages}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {conteneur.grossWeight ? (
                            <div className="flex items-center gap-1.5">
                              <Weight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{conteneur.grossWeight} kg</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {conteneur.netWeight ? (
                            <div className="flex items-center gap-1.5">
                              <Weight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{conteneur.netWeight} kg</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="flex items-center gap-1.5 w-fit mx-auto">
                            <Package className="h-3 w-3" />
                            <span className="font-semibold">{conteneur.commandes.length}</span>
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

      {conteneurs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun conteneur trouvé</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Il n&apos;y a actuellement aucun conteneur dans le système. Les conteneurs apparaîtront ici une fois créés.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}