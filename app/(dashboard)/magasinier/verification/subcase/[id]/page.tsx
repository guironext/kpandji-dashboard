"use client";
import React, { useState } from 'react'
import { getSubcase } from '@/lib/actions/subcase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Wrench, ArrowLeft, RefreshCw, QrCode } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import AddSparePartDialog from './AddSparePartDialog'
import AddToolDialog from './AddToolDialog'

import { Edit, Trash2 } from 'lucide-react'
import { updateSparePart, deleteSparePart, updateTool, deleteTool, updateSparePartVerificationStatus } from '@/lib/actions/subcase'
import EditSparePartDialog from '@/components/EditSparePartDialog';
import EditToolDialog from '@/components/EditToolDialog';
import VerificationScanner from '@/components/VerificationScanner'


interface Subcase {
  id: string;
  subcaseNumber: string;
  createdAt: Date;
  updatedAt: Date;
  conteneur?: {
    conteneurNumber: string;
  };
  spareParts: {
    id: string;
    partCode: string;
    partName: string;
    partNameFrench: string | null;
    quantity: number;
    etapeSparePart: string;
    statusVerification: string;
    createdAt: Date;
  }[];
  tools: {
    id: string;
    toolCode: string;
    toolName: string;
    quantity: number;
    etapeTool: string;
    check: boolean;
    createdAt: Date;
  }[];
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function SubcaseDetailsPage({ params }: PageProps) {
  const resolvedParams = React.use(params)
  const router = useRouter()
  const [subcase, setSubcase] = useState<Subcase | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddSparePart, setShowAddSparePart] = useState(false)
  const [showAddTool, setShowAddTool] = useState(false)
  const [showEditSparePart, setShowEditSparePart] = useState(false)
  const [showEditTool, setShowEditTool] = useState(false)
  const [selectedSparePart, setSelectedSparePart] = useState<Subcase['spareParts'][0] | null>(null)
  const [selectedTool, setSelectedTool] = useState<Subcase['tools'][0] | null>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [highlightedSparePart, setHighlightedSparePart] = useState<string | null>(null)


  const fetchSubcase = async () => {
    try {
      setLoading(true)
      const { data, success } = await getSubcase(resolvedParams.id)
      if (success && data) {
        setSubcase(data)
      } else {
        toast.error('Erreur lors du chargement du sous-cas')
      }
    } catch (error) {
      console.error('Error fetching subcase:', error)
      toast.error('Erreur lors du chargement du sous-cas')
    } finally {
      setLoading(false)
    }
  }


  const handleUpdateTool = async (toolId: string, data: {
    toolCode?: string;
    toolName?: string;
    quantity?: number;
    etapeTool?: 'TRANSITE' | 'RENSEIGNE' | 'ARRIVE' | 'VERIFIE' | 'ATTRIBUE' | 'CONSOMME';
    check?: boolean;
  }) => {
    try {
      const { success, error } = await updateTool(toolId, data)
      if (success) {
        fetchSubcase()
        toast.success('Outil mis à jour avec succès')
      } else {
        toast.error(error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating tool:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDeleteTool = async (toolId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet outil ?')) {
      try {
        const { success, error } = await deleteTool(toolId)
        if (success) {
          fetchSubcase()
          toast.success('Outil supprimé avec succès')
        } else {
          toast.error(error || 'Erreur lors de la suppression')
        }
      } catch (error) {
        console.error('Error deleting tool:', error)
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleEditSparePart = (sparePart: Subcase['spareParts'][0]) => {
    setSelectedSparePart(sparePart)
    setShowEditSparePart(true)
  }

  const handleEditTool = (tool: Subcase['tools'][0]) => {
    setSelectedTool(tool)
    setShowEditTool(true)
  }


  // Add these functions after the handleSuccess function
const handleUpdateSparePart = async (sparePartId: string, data: {
  partCode?: string;
  partName?: string;
  partNameFrench?: string;
  quantity?: number;
}) => {
  try {
    const { success, error } = await updateSparePart(sparePartId, data)
    if (success) {
      fetchSubcase()
      toast.success('Pièce de rechange mise à jour avec succès')
    } else {
      toast.error(error || 'Erreur lors de la mise à jour')
    }
  } catch (error) {
    console.error('Error updating spare part:', error)
    toast.error('Erreur lors de la mise à jour')
  }
}

const handleDeleteSparePart = async (sparePartId: string) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette pièce de rechange ?')) {
    try {
      const { success, error } = await deleteSparePart(sparePartId)
      if (success) {
        fetchSubcase()
        toast.success('Pièce de rechange supprimée avec succès')
      } else {
        toast.error(error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting spare part:', error)
      toast.error('Erreur lors de la suppression')
    }
  }
}

  const handleQRScan = (scannedData: string) => {
    if (!subcase) return;
    
    const foundSparePart = subcase.spareParts.find(part => 
      part.partCode.toLowerCase().includes(scannedData.toLowerCase()) ||
      part.partName.toLowerCase().includes(scannedData.toLowerCase()) ||
      (part.partNameFrench && part.partNameFrench.toLowerCase().includes(scannedData.toLowerCase()))
    );

    if (foundSparePart) {
      setHighlightedSparePart(foundSparePart.id);
      toast.success(`Pièce trouvée: ${foundSparePart.partCode} - ${foundSparePart.partName}`);
      
      setTimeout(() => {
        const element = document.getElementById(`spare-part-${foundSparePart.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      
    } else {
      toast.error(`Aucune pièce trouvée pour: ${scannedData}`);
    }
    
    setShowQRScanner(false);
  };


  React.useEffect(() => {
    fetchSubcase()
  }, [resolvedParams.id])

  const handleSuccess = () => {
    fetchSubcase()
    toast.success('Élément ajouté avec succès')
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <p>Chargement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subcase) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Sous-cas non trouvé</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleUpdateVerificationStatus = async (sparePartId: string, status: 'RETROUVE' | 'MODIFIE' | 'NON_RETROUVE') => {
    try {
      const { success, error } = await updateSparePartVerificationStatus(sparePartId, status)
      if (success) {
        fetchSubcase()
        toast.success(`Statut mis à jour: ${status}`)
      } else {
        toast.error(error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating verification status:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Détails du Sous-cas</h1>
            <p className="text-muted-foreground">Numéro: {subcase.subcaseNumber}</p>
          </div>
        </div>
        <div className="flex gap-3">
        <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowQRScanner(true)}
          >
            <QrCode className="h-4 w-4" />
            Scanner QR
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Pièces de Rechange</p>
                <p className="text-2xl font-bold text-blue-700">{subcase.spareParts.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Outils</p>
                <p className="text-2xl font-bold text-orange-700">{subcase.tools.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Conteneur</p>
                <p className="text-lg font-bold text-green-700">{subcase.conteneur?.conteneurNumber || 'N/A'}</p>
              </div>
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subcase Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            Informations du Sous-cas
          </CardTitle>
          <CardDescription>Détails généraux du conteneur et du sous-cas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Numéro du Sous-cas</label>
              <p className="text-lg font-semibold bg-gray-50 p-2 rounded-md">{subcase.subcaseNumber}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Conteneur</label>
              <p className="text-lg font-semibold bg-gray-50 p-2 rounded-md">{subcase.conteneur?.conteneurNumber || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date de création</label>
              <p className="bg-gray-50 p-2 rounded-md">{new Date(subcase.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</label>
              <p className="bg-gray-50 p-2 rounded-md">{new Date(subcase.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spare Parts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Pièces de Rechange ({subcase.spareParts.length})
              </CardTitle>
              <CardDescription>Liste des pièces de rechange associées à ce sous-cas</CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddSparePart(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter Pièces
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subcase.spareParts.length > 0 ? (
            <div className="space-y-3">
              {subcase.spareParts.map((part) => (
                <div 
                  key={part.id} 
                  id={`spare-part-${part.id}`}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    highlightedSparePart === part.id 
                      ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-300' 
                      : part.statusVerification === 'RETROUVE' 
                        ? 'bg-green-50 border-green-200' 
                        : part.statusVerification === 'MODIFIE' 
                          ? 'bg-blue-50 border-blue-200' 
                          : part.statusVerification === 'NON_RETROUVE' 
                            ? 'bg-red-50 border-red-200' 
                            : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-600">{part.partCode}</span>
                      <Badge variant="outline" className="text-xs">{part.etapeSparePart}</Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          part.statusVerification === 'RETROUVE' 
                            ? 'bg-green-100 text-green-800 border-green-300' 
                            : part.statusVerification === 'MODIFIE' 
                              ? 'bg-blue-100 text-blue-800 border-blue-300' 
                              : part.statusVerification === 'NON_RETROUVE' 
                                ? 'bg-red-100 text-red-800 border-red-300' 
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                      >
                        {part.statusVerification}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-1">{part.partName}</p>
                    {part.partNameFrench && (
                      <p className="text-xs text-muted-foreground">{part.partNameFrench}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">Quantité: {part.quantity}</p>
                      <p className="text-xs text-muted-foreground">
                        Ajouté le {new Date(part.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                        onClick={() => handleUpdateVerificationStatus(part.id, 'RETROUVE')}
                      >
                        Retrouver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600"
                        onClick={() => handleEditSparePart(part)}
                      >
                        Modifier
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500 text-red-600 hover:bg-red-50 hover:border-red-600"
                        onClick={() => handleUpdateVerificationStatus(part.id, 'NON_RETROUVE')}
                      >
                        Non Retrouver
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune pièce de rechange ajoutée</p>
              <p className="text-sm">Cliquez sur &quot;Ajouter Pièces&quot; pour commencer</p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Tools Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                Outils ({subcase.tools.length})
              </CardTitle>
              <CardDescription>Liste des outils associés à ce sous-cas</CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddTool(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter Outils
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subcase.tools.length > 0 ? (
            <div className="space-y-3">
              {subcase.tools.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-orange-600">{tool.toolCode}</span>
                      <Badge variant="outline" className="text-xs">{tool.etapeTool}</Badge>
                      {tool.check && <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Vérifié</Badge>}
                    </div>
                    <p className="text-sm font-medium mt-1">{tool.toolName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg text-orange-600">Quantité: {tool.quantity}</p>
                      <p className="text-xs text-muted-foreground">
                        Ajouté le {new Date(tool.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTool(tool)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTool(tool.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun outil ajouté</p>
              <p className="text-sm">Cliquez sur &quot;Ajouter Outils&quot; pour commencer</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddSparePartDialog
        open={showAddSparePart}
        onOpenChange={setShowAddSparePart}
        subcaseId={resolvedParams.id}
        onSuccess={handleSuccess}
      />
      
      <AddToolDialog
        open={showAddTool}
        onOpenChange={setShowAddTool}
        subcaseId={resolvedParams.id}
        onSuccess={handleSuccess}
      />

      <EditSparePartDialog
        open={showEditSparePart}
        onOpenChange={setShowEditSparePart}
        sparePart={selectedSparePart}
        subcaseId={resolvedParams.id}
        onSuccess={handleSuccess}
      />

      <EditToolDialog
        open={showEditTool}
        onOpenChange={setShowEditTool}
        tool={selectedTool}
        onSuccess={handleSuccess}
      />

      {/* QR Scanner Dialog */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scanner QR Code</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQRScanner(false)}
              >
                ×
              </Button>
            </div>
            <VerificationScanner onScan={handleQRScan} />
          </div>
        </div>
      )}
    </div>
  )
}