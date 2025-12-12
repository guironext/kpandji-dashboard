'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Ship,
  Calendar,
  Weight,
  Hash,
  Truck,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Clock,
  MapPin,
  Car,
  User,
  Building
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type CommandeType = {
  id: string
  couleur: string | null
  motorisation: string | null
  transmission: string | null
  nbr_portes: string | null
  prix_unitaire: number | null
  date_livraison: string | Date
  createdAt: string | Date
  updatedAt: string | Date
  etapeCommande: string
  commandeFlag: string
  voitureModel: {
    model: string
  } | null
  client: {
    nom: string
  } | null
  clientEntreprise?: {
    nom_entreprise: string
  } | null
  conteneur?: {
    id: string
    conteneurNumber: string
  } | null
}

type ConteneurType = {
  id: string
  conteneurNumber: string
  sealNumber: string
  totalPackages: string | null
  grossWeight: string | null
  netWeight: string | null
  stuffingMap: string | null
  etapeConteneur: string
  createdAt: string
  updatedAt: string
  dateEmbarquement: string | null
  dateArriveProbable: string | null
  commandes: CommandeType[]
}

type Props = {
  conteneurs: ConteneurType[]
  commandes: CommandeType[]
}

const ConteneurTransitClient = ({ conteneurs, commandes }: Props) => {
  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalCommandesInConteneurs = conteneurs.reduce((sum, c) => sum + c.commandes.length, 0)
    const totalVendues = commandes.filter(cmd => cmd.commandeFlag === 'VENDUE').length
    const totalDisponibles = commandes.filter(cmd => cmd.commandeFlag === 'DISPONIBLE').length
    const totalPrix = commandes.reduce((sum, cmd) => sum + (cmd.prix_unitaire || 0), 0)

    return {
      totalConteneurs: conteneurs.length,
      totalCommandes: commandes.length,
      totalCommandesInConteneurs,
      totalVendues,
      totalDisponibles,
      totalPrix
    }
  }, [conteneurs, commandes])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-3 md:p-4 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
              <Truck className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Conteneurs et Commandes en Transit
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base lg:text-lg">
                Vue d&apos;ensemble des conteneurs et commandes en transit
              </p>
            </div>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Conteneurs */}
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Conteneurs TRANSITE</p>
                  <p className="text-3xl font-bold">{stats.totalConteneurs}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Ship className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Commandes */}
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Commandes TRANSITE</p>
                  <p className="text-3xl font-bold">{stats.totalCommandes}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Vendues */}
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1">Commandes Vendues</p>
                  <p className="text-3xl font-bold">{stats.totalVendues}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Disponibles */}
          <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Commandes Disponibles</p>
                  <p className="text-3xl font-bold">{stats.totalDisponibles}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteneurs Section */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 text-white border-0 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Ship className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl md:text-2xl">Conteneurs en Transit</CardTitle>
                  <p className="text-purple-100 text-sm mt-0.5">
                    {conteneurs.length} conteneur{conteneurs.length !== 1 ? 's' : ''} trouvé{conteneurs.length !== 1 ? 's' : ''} • {stats.totalCommandesInConteneurs} commande{stats.totalCommandesInConteneurs !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                Vue détaillée
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-6">
              {conteneurs.length > 0 ? (
                conteneurs.map((conteneur, index) => (
                  <div
                    key={conteneur.id}
                    className="group relative bg-gradient-to-br from-white via-purple-50/20 to-blue-50/20 border-2 border-purple-200/60 p-5 md:p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-purple-300/80 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Conteneur Header */}
                    <div className="mb-5 pb-5 border-b border-purple-200/60">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-4 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                            <Ship className="h-7 w-7 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-bold text-gray-900 text-xl md:text-2xl">
                                Conteneur: {conteneur.conteneurNumber}
                              </h3>
                              <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-3 py-1 shadow-sm">
                                {conteneur.etapeConteneur}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                                <Hash className="h-4 w-4 text-purple-600" />
                                <span className="font-medium">Scellé: <span className="text-gray-900">{conteneur.sealNumber}</span></span>
                              </div>
                              {conteneur.dateEmbarquement && (
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">Embarquement: <span className="text-gray-900">{new Date(conteneur.dateEmbarquement).toLocaleDateString('fr-FR')}</span></span>
                                </div>
                              )}
                              {conteneur.dateArriveProbable && (
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg">
                                  <MapPin className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">Arrivée prévue: <span className="text-gray-900">{new Date(conteneur.dateArriveProbable).toLocaleDateString('fr-FR')}</span></span>
                                </div>
                              )}
                            </div>
                            {/* Additional Info */}
                            <div className="flex flex-wrap items-center gap-4 mt-3">
                              {conteneur.totalPackages && (
                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                  <Package className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="font-medium">{conteneur.totalPackages} colis</span>
                                </div>
                              )}
                              {(conteneur.grossWeight || conteneur.netWeight) && (
                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                                  <Weight className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="font-medium">
                                    {conteneur.grossWeight && `Brut: ${conteneur.grossWeight}`}
                                    {conteneur.grossWeight && conteneur.netWeight && ' / '}
                                    {conteneur.netWeight && `Net: ${conteneur.netWeight}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Commandes List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          <Package className="h-5 w-5 text-purple-600" />
                          Commandes dans ce conteneur
                          <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 border-purple-200">
                            {conteneur.commandes.length}
                          </Badge>
                        </h4>
                      </div>
                      {conteneur.commandes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {conteneur.commandes.map((commande) => (
                            <div
                              key={commande.id}
                              className="group bg-gradient-to-br from-white to-blue-50/30 rounded-xl p-4 md:p-5 border-2 border-blue-100/60 hover:border-blue-200 hover:shadow-lg transition-all duration-200"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-2.5 rounded-lg group-hover:scale-110 transition-transform">
                                    <Package className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-base mb-1 truncate">
                                      {commande.voitureModel?.model || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-600 flex items-center gap-1">
                                      <span className="font-medium">Client:</span>
                                      <span className="truncate">{commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'N/A'}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 ml-2">
                                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2.5 py-1 shadow-sm">
                                    {commande.etapeCommande}
                                  </Badge>
                                  <Badge className={`text-xs px-2.5 py-1 shadow-sm ${
                                    commande.commandeFlag === 'VENDUE'
                                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                  }`}>
                                    {commande.commandeFlag}
                                  </Badge>
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/30 rounded-lg p-3 border border-purple-100/50">
                                <div className="grid grid-cols-2 gap-2.5 text-xs md:text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-medium">Couleur:</span>
                                    <span className="font-semibold text-gray-900">{commande.couleur || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-medium">Moteur:</span>
                                    <span className="font-semibold text-gray-900">{commande.motorisation || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-medium">Transmission:</span>
                                    <span className="font-semibold text-gray-900">{commande.transmission || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-500 font-medium">Portes:</span>
                                    <span className="font-semibold text-gray-900">{commande.nbr_portes || 'N/A'}</span>
                                  </div>
                                  {commande.prix_unitaire && (
                                    <div className="flex items-center gap-2 col-span-2">
                                      <span className="text-gray-500 font-medium">Prix unitaire:</span>
                                      <span className="font-bold text-green-600">
                                        {commande.prix_unitaire.toLocaleString('fr-FR')} FCFA
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 col-span-2">
                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-gray-500 font-medium">Livraison:</span>
                                    <span className="font-semibold text-gray-900">
                                      {new Date(commande.date_livraison).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl border-2 border-dashed border-gray-200">
                          <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">Aucune commande dans ce conteneur</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 md:py-32 text-gray-400">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-full mb-6 shadow-inner">
                    <Ship className="h-20 w-20 text-gray-400" />
                  </div>
                  <p className="text-center font-bold text-xl md:text-2xl mb-2 text-gray-600">Aucun conteneur en transit</p>
                  <p className="text-center text-sm md:text-base text-gray-500 max-w-md">
                    Aucun conteneur avec l&apos;étape TRANSITE pour le moment
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Commandes Section */}
        <Card className="shadow-xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white border-0 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl md:text-2xl">Commandes en Transit</CardTitle>
                  <p className="text-blue-100 text-sm mt-0.5">
                    {commandes.length} commande{commandes.length !== 1 ? 's' : ''} trouvée{commandes.length !== 1 ? 's' : ''} avec l&apos;étape TRANSITE
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-sm px-4 py-2">
                <BarChart3 className="h-4 w-4 mr-2" />
                Vue détaillée
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {commandes.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 hover:bg-gradient-to-r hover:from-blue-50 hover:via-purple-50 hover:to-blue-50">
                      <TableHead className="font-bold text-gray-900 text-sm md:text-base py-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-600" />
                          <span>Modèle</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm md:text-base py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span>Client</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm md:text-base py-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span>Caractéristiques</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-center text-sm md:text-base py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Ship className="h-4 w-4 text-blue-600" />
                          <span>Conteneur</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-center text-sm md:text-base py-4">
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span>Statut</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-right text-sm md:text-base py-4">
                        <div className="flex items-center justify-end gap-2">
                          <span>Prix</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commandes.map((commande) => (
                      <TableRow 
                        key={commande.id}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        <TableCell className="font-medium py-4">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold text-gray-900">
                              {commande.voitureModel?.model || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            {commande.client ? (
                              <>
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700">{commande.client.nom}</span>
                              </>
                            ) : commande.clientEntreprise ? (
                              <>
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700">{commande.clientEntreprise.nom_entreprise}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-wrap gap-2">
                            {commande.couleur && (
                              <Badge variant="outline" className="text-xs">
                                🎨 {commande.couleur}
                              </Badge>
                            )}
                            {commande.motorisation && (
                              <Badge variant="outline" className="text-xs">
                                🔧 {commande.motorisation}
                              </Badge>
                            )}
                            {commande.transmission && (
                              <Badge variant="outline" className="text-xs">
                                ⚙️ {commande.transmission}
                              </Badge>
                            )}
                            {commande.nbr_portes && (
                              <Badge variant="outline" className="text-xs">
                                🚪 {commande.nbr_portes}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          {commande.conteneur ? (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              {commande.conteneur.conteneurNumber}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <div className="flex flex-col gap-1 items-center">
                            <Badge className={`text-xs ${
                              commande.commandeFlag === 'VENDUE'
                                ? 'bg-red-500 text-white'
                                : 'bg-green-500 text-white'
                            }`}>
                              {commande.commandeFlag}
                            </Badge>
                            <Badge className="bg-blue-500 text-white text-xs">
                              {commande.etapeCommande}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          {commande.prix_unitaire ? (
                            <span className="font-bold text-green-600">
                              {commande.prix_unitaire.toLocaleString('fr-FR')} FCFA
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-8 rounded-full mb-4 shadow-inner">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-center font-semibold text-lg md:text-xl mb-2">Aucune commande en transit</p>
                <p className="text-center text-sm md:text-base text-gray-500">
                  Les commandes avec l&apos;étape TRANSITE apparaîtront ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ConteneurTransitClient

