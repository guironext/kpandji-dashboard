"use client";

import React, { useState } from 'react'
import { getConteneursVerifies } from '@/lib/actions/conteneur'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Package, Container, Calendar, Hash, CheckCircle, AlertCircle, Archive, Box } from 'lucide-react'
import StorageDialog from '@/components/StorageDialog'

interface Conteneur {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  totalPackages?: string | null;
  dateArriveProbable?: Date | null;
  subcases: {
    id: string;
    subcaseNumber: string;
    spareParts: {
      id: string;
      partCode: string;
      partName: string;
      partNameFrench: string | null;
      quantity: number;
      etapeSparePart: string;
      voiture?: {
        voitureModel?: {
          model: string;
        };
      };
    }[];
  }[];
}

const StockagePage = () => {
  const [selectedSparePart, setSelectedSparePart] = useState<unknown>(null)
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getConteneursVerifies()
        if (result.success && result.data) {
          setConteneurs(result.data)
        } else {
          setError(result.error || 'Erreur de chargement')
        }
      } catch (err) {
        setError('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRangerClick = (sparePart: unknown) => {
    const sparePartWithStatus = {
      ...(sparePart as Record<string, unknown>),
      status: (sparePart as Record<string, unknown>).etapeSparePart || 'UNKNOWN'
    }
    setSelectedSparePart(sparePartWithStatus)
    setIsDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    // Refresh the data after successful storage assignment
    const fetchData = async () => {
      try {
        const result = await getConteneursVerifies()
        if (result.success && result.data) {
          setConteneurs(result.data)
        }
      } catch (err) {
        console.error('Error refreshing data:', err)
      }
    }
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-destructive mb-2">Erreur de chargement</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Archive className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stockage & Rangement</h1>
            <p className="text-muted-foreground">Gestion des pièces par subcase - Conteneurs vérifiés</p>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Container className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{conteneurs.length}</p>
                <p className="text-sm text-muted-foreground">Conteneurs vérifiés</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {conteneurs.reduce((acc, c) => acc + c.subcases.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Subcases totales</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Hash className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {conteneurs.reduce((acc, c) => c.subcases.reduce((subAcc, s) => subAcc + s.spareParts.length, 0) + acc, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Pièces totales</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground">Taux de vérification</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      {conteneurs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun conteneur vérifié</h3>
            <p className="text-muted-foreground">Les conteneurs vérifiés apparaîtront ici pour le stockage</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {conteneurs.map((conteneur) => (
            <Card key={conteneur.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Container className="w-5 h-5 text-blue-600" />
                      Conteneur {conteneur.conteneurNumber}
                    </CardTitle>
                    <CardDescription>
                      Seal: {conteneur.sealNumber} • {conteneur.subcases.length} subcase{conteneur.subcases.length > 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                </div>
                
                {/* Container Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-100 dark:border-blue-800">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Packages totaux</p>
                    <p className="text-lg font-semibold">{conteneur.totalPackages || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Date d&apos;arrivée</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {conteneur.dateArriveProbable ? new Date(conteneur.dateArriveProbable).toLocaleDateString('fr-FR') : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Pièces totales</p>
                    <p className="text-lg font-semibold">
                      {conteneur.subcases.reduce((acc, s) => acc + s.spareParts.length, 0)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {conteneur.subcases.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Aucune subcase trouvée dans ce conteneur</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {conteneur.subcases.map((subcase, index) => (
                      <div key={subcase.id} className="border rounded-xl p-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            Subcase {subcase.subcaseNumber}
                          </h4>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {subcase.spareParts.length} pièce{subcase.spareParts.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        
                        {subcase.spareParts.length === 0 ? (
                          <div className="text-center py-6">
                            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Aucune pièce de rechange dans cette subcase</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="font-semibold">Code Pièce</TableHead>
                                  <TableHead className="font-semibold">Nom Pièce / Nom Français</TableHead>
                                  <TableHead className="font-semibold text-center">Quantité</TableHead>
                                  <TableHead className="font-semibold">Étape</TableHead>
                                  <TableHead className="font-semibold text-center">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subcase.spareParts.map((sparePart) => (
                                  <TableRow key={sparePart.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium font-mono text-sm">
                                      {sparePart.partCode}
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                      <div className="space-y-1">
                                        <div className="font-medium" title={sparePart.partName}>
                                          {sparePart.partName}
                                        </div>
                                        {sparePart.partNameFrench && (
                                          <div className="text-sm text-muted-foreground italic" title={sparePart.partNameFrench}>
                                            {sparePart.partNameFrench}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        {sparePart.quantity}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          sparePart.etapeSparePart === 'VERIFIE' 
                                            ? 'bg-green-100 text-green-800 border-green-200' 
                                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }
                                      >
                                        {sparePart.etapeSparePart}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button 
                                        size="sm" 
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 font-medium"
                                        onClick={() => handleRangerClick(sparePart)}
                                      >
                                        <Box className="w-4 h-4 mr-1.5" />
                                        Ranger
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Storage Dialog */}
      <StorageDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        // @ts-expect-error Type mismatch between unknown and SparePart
        sparePart={selectedSparePart}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}

export default StockagePage