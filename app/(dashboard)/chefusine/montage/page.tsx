"use client";

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Clock, 
  Car, 
  User, 
  CheckCircle, 
  Wrench, 
  Filter,
  RefreshCw,
  TrendingUp,
  Calendar,
  Settings,
  Eye,
  CheckCircle2
} from 'lucide-react'

interface Montage {
  id: string;
  no_chassis: string | null;
  etapeMontage: string;
  createdAt: Date;
  commande: {
    id: string;
    nbr_portes: string;
    transmission: string;
    motorisation: string;
    couleur: string;
    client: {
      nom: string;
    };
    voitureModel?: {
      model: string;
    } | null;
  };
}

const Page = () => {
  const [montages, setMontages] = useState<Montage[]>([])
  const [filteredMontages, setFilteredMontages] = useState<Montage[]>([])
  const [validatedMontages, setValidatedMontages] = useState<Montage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchMontages()
    fetchValidatedMontages()
  }, [])

  useEffect(() => {
    filterMontages()
  }, [montages, searchTerm])

  const fetchMontages = async () => {
    try {
      const response = await fetch('/api/montage')
      if (response.ok) {
        const data = await response.json()
        const creationMontages = data.filter((montage: Montage) => montage.etapeMontage === 'CREATION')
        setMontages(creationMontages)
      }
    } catch (error) {
      console.error('Error fetching montages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchValidatedMontages = async () => {
    try {
      const response = await fetch('/api/montage')
      if (response.ok) {
        const data = await response.json()
        const validatedMontages = data.filter((montage: Montage) => montage.etapeMontage === 'VALIDE')
        setValidatedMontages(validatedMontages)
      }
    } catch (error) {
      console.error('Error fetching validated montages:', error)
    }
  }

  const filterMontages = () => {
    let filtered = montages

    if (searchTerm) {
      filtered = filtered.filter(montage =>
        montage.no_chassis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        montage.commande.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        montage.commande.voitureModel?.model.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredMontages(filtered)
  }

  const getStatusBadge = (etape: string) => {
    const statusConfig = {
      CREATION: { label: 'Création', variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
      VALIDE: { label: 'Validé', variant: 'secondary' as const, className: 'bg-green-100 text-green-800 border-green-200' },
      EXECUTION: { label: 'Exécution', variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 border-orange-200' },
      VERIFICATION: { label: 'Vérification', variant: 'outline' as const, className: 'bg-purple-100 text-purple-800 border-purple-200' },
      CORRECTION: { label: 'Correction', variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200' },
      TERMINEE: { label: 'Terminée', variant: 'default' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    
    const config = statusConfig[etape as keyof typeof statusConfig] || { 
      label: etape, 
      variant: 'default' as const, 
      className: 'bg-gray-100 text-gray-800 border-gray-200' 
    }
    return (
      <Badge variant={config.variant} className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    )
  }

  const handleValider = async (montageId: string) => {
    try {
      const response = await fetch(`/api/montage/${montageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ etapeMontage: 'VALIDE' })
      })
      
      if (response.ok) {
        fetchMontages()
        fetchValidatedMontages()
      } else {
        console.error('Failed to validate montage')
      }
    } catch (error) {
      console.error('Error validating montage:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchMontages(), fetchValidatedMontages()])
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Wrench className="h-12 w-12 mx-auto text-blue-600 animate-spin" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Chargement des montages</h3>
            <p className="text-gray-500">Récupération des données en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Montages</h1>
              </div>
              <p className="text-gray-600 text-lg">
                Suivi et validation des montages automobiles
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Création</p>
                  <p className="text-2xl font-bold text-gray-900">{montages.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Validés</p>
                  <p className="text-2xl font-bold text-gray-900">{validatedMontages.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{montages.length + validatedMontages.length}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Montages en Création */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Montages en Création
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {filteredMontages.length} montage{filteredMontages.length !== 1 ? 's' : ''} en attente de validation
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                {filteredMontages.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Search Bar */}
            <div className="p-6 border-b bg-gray-50/50">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par chassis, client ou modèle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            {filteredMontages.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Car className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun montage en création</h3>
                <p className="text-gray-500">Tous les montages ont été validés ou aucun n&apos;est en cours de création.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">N° Chassis</TableHead>
                      <TableHead className="font-semibold text-gray-700">Modèle</TableHead>
                      <TableHead className="font-semibold text-gray-700">Configuration</TableHead>
                      <TableHead className="font-semibold text-gray-700">Client</TableHead>
                      <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMontages.map((montage, index) => (
                      <TableRow key={montage.id} className={`hover:bg-gray-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {montage.no_chassis || (
                              <span className="text-gray-400 italic">Non assigné</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {montage.commande.voitureModel?.model || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {montage.commande.nbr_portes} portes • {montage.commande.transmission}
                            </div>
                            <div className="text-sm text-gray-500">
                              {montage.commande.motorisation} • {montage.commande.couleur}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{montage.commande.client.nom}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(montage.etapeMontage)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(montage.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            onClick={() => handleValider(montage.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Valider
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Montages Validés */}
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Montages Validés
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {validatedMontages.length} montage{validatedMontages.length !== 1 ? 's' : ''} validé{validatedMontages.length !== 1 ? 's' : ''} et prêt{validatedMontages.length !== 1 ? 's' : ''} pour l&apos;exécution
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                {validatedMontages.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {validatedMontages.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun montage validé</h3>
                <p className="text-gray-500">Les montages validés apparaîtront ici une fois qu&apos;ils auront été approuvés.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">N° Chassis</TableHead>
                      <TableHead className="font-semibold text-gray-700">Modèle</TableHead>
                      <TableHead className="font-semibold text-gray-700">Configuration</TableHead>
                      <TableHead className="font-semibold text-gray-700">Client</TableHead>
                      <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date de validation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedMontages.map((montage, index) => (
                      <TableRow key={montage.id} className={`hover:bg-gray-50/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            {montage.no_chassis || (
                              <span className="text-gray-400 italic">Non assigné</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {montage.commande.voitureModel?.model || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {montage.commande.nbr_portes} portes • {montage.commande.transmission}
                            </div>
                            <div className="text-sm text-gray-500">
                              {montage.commande.motorisation} • {montage.commande.couleur}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{montage.commande.client.nom}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(montage.etapeMontage)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {new Date(montage.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Page