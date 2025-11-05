"use client";

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Car, User, Search, Filter, Clock, CheckCircle, AlertCircle, XCircle, Play, Pause, RotateCcw } from 'lucide-react'
import { MontageDialog } from '@/components/MontageDialog'

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
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchMontages()
  }, [])

  useEffect(() => {
    filterMontages()
  }, [montages, searchTerm, statusFilter])

  const fetchMontages = async () => {
    try {
      const response = await fetch('/api/montage')
      const data = await response.json()
      setMontages(data)
    } catch (error) {
      console.error('Error fetching montages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterMontages = () => {
    let filtered = montages

    if (searchTerm) {
      filtered = filtered.filter(montage => 
        montage.no_chassis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        montage.commande.voitureModel?.model?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(montage => montage.etapeMontage === statusFilter)
    }

    setFilteredMontages(filtered)
  }

  const getEtapeBadgeVariant = (etape: string) => {
    switch (etape) {
      case 'CREATION': return 'secondary'
      case 'VALIDE': return 'default'
      case 'EXECUTION': return 'default'
      case 'VERIFICATION': return 'secondary'
      case 'CORRECTION': return 'destructive'
      case 'TERMINEE': return 'default'
      default: return 'secondary'
    }
  }

  const getEtapeIcon = (etape: string) => {
    switch (etape) {
      case 'CREATION': return <Clock className="h-3 w-3" />
      case 'VALIDE': return <CheckCircle className="h-3 w-3" />
      case 'EXECUTION': return <Play className="h-3 w-3" />
      case 'VERIFICATION': return <AlertCircle className="h-3 w-3" />
      case 'CORRECTION': return <RotateCcw className="h-3 w-3" />
      case 'TERMINEE': return <CheckCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getStatusCounts = () => {
    const counts = {
      TOTAL: montages.length,
      CREATION: montages.filter(m => m.etapeMontage === 'CREATION').length,
      VALIDE: montages.filter(m => m.etapeMontage === 'VALIDE').length,
      EXECUTION: montages.filter(m => m.etapeMontage === 'EXECUTION').length,
      VERIFICATION: montages.filter(m => m.etapeMontage === 'VERIFICATION').length,
      CORRECTION: montages.filter(m => m.etapeMontage === 'CORRECTION').length,
      TERMINEE: montages.filter(m => m.etapeMontage === 'TERMINEE').length,
    }
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Montage
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Gestion des ordres de montage et suivi de production
            </p>
          </div>
          <MontageDialog onMontageCreated={fetchMontages} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{statusCounts.TOTAL}</p>
                </div>
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Car className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Création</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{statusCounts.CREATION}</p>
                </div>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Validé</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{statusCounts.VALIDE}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Exécution</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{statusCounts.EXECUTION}</p>
                </div>
                <Play className="h-4 w-4 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Vérification</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{statusCounts.VERIFICATION}</p>
                </div>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Correction</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{statusCounts.CORRECTION}</p>
                </div>
                <RotateCcw className="h-4 w-4 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Terminé</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{statusCounts.TERMINEE}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Rechercher par chassis ou modèle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="CREATION">Création</SelectItem>
                    <SelectItem value="VALIDE">Validé</SelectItem>
                    <SelectItem value="EXECUTION">Exécution</SelectItem>
                    <SelectItem value="VERIFICATION">Vérification</SelectItem>
                    <SelectItem value="CORRECTION">Correction</SelectItem>
                    <SelectItem value="TERMINEE">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Table Card */}
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
            <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Ordres de Montage
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {filteredMontages.length} montage{filteredMontages.length !== 1 ? 's' : ''} trouvé{filteredMontages.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-slate-600 dark:text-slate-400">Chargement des montages...</span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">N° Chassis</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Modèle</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Caractéristiques</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Étape</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Date Création</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMontages.map((montage, index) => (
                      <TableRow 
                        key={montage.id} 
                        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/30'
                        }`}
                      >
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            {montage.no_chassis || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {montage.commande.voitureModel?.model || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {montage.commande.nbr_portes} portes
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                              <div>{montage.commande.transmission}</div>
                              <div>{montage.commande.motorisation}</div>
                              <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded-full border" style={{backgroundColor: montage.commande.couleur.toLowerCase()}}></div>
                                {montage.commande.couleur}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getEtapeBadgeVariant(montage.etapeMontage)}
                            className="flex items-center gap-1 font-medium"
                          >
                            {getEtapeIcon(montage.etapeMontage)}
                            {montage.etapeMontage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              {new Date(montage.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
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