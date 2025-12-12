'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateCommandeDialog } from '@/components/CreateCommandeDialog'
import { 
  Package, 
  ShoppingCart,
  Plus,
  Trash2,
  Send
} from 'lucide-react'
import { toast } from 'sonner'

type CommandeType = {
  id: string
  couleur: string | null
  motorisation: string | null
  transmission: string | null
  nbr_portes: string | null
  prix_unitaire: number | null
  date_livraison: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  etapeCommande: string
  commandeFlag: string
  voitureModel: {
    model: string
  } | null
  client: {
    nom: string
  } | null
  clientEntreprise: {
    nom_entreprise: string
  } | null
}

type Props = {
  commandes: CommandeType[]
  clients: Array<{ id: string; nom: string; telephone: string | null }>
  clientsEntreprise: Array<{ id: string; nom_entreprise: string; telephone: string | null }>
  voitureModels: Array<{ id: string; model: string }>
}

const CommandesPageClient = ({
  commandes,
  clients,
  clientsEntreprise,
  voitureModels
}: Props) => {
  const router = useRouter()
  const [deletingCommandeId, setDeletingCommandeId] = React.useState<string | null>(null)
  const [dispatchingCommandeId, setDispatchingCommandeId] = React.useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [commandeToDelete, setCommandeToDelete] = React.useState<string | null>(null)

  const handleDeleteClick = (commandeId: string) => {
    setCommandeToDelete(commandeId)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!commandeToDelete) return

    setDeletingCommandeId(commandeToDelete)
    setShowDeleteDialog(false)
    
    try {
      const response = await fetch(`/api/commandes/${commandeToDelete}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast.success('Commande supprimée avec succès')
      router.refresh()
    } catch (error) {
      console.error('Error deleting commande:', error)
      toast.error('Erreur lors de la suppression de la commande')
    } finally {
      setDeletingCommandeId(null)
      setCommandeToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteDialog(false)
    setCommandeToDelete(null)
  }

  const handleDispatchCommande = async (commandeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir dispatcher cette commande ?')) {
      return
    }

    setDispatchingCommandeId(commandeId)
    
    try {
      const response = await fetch(`/api/commandes/${commandeId}/dispatch`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du dispatch')
      }

      toast.success('Commande dispatchée avec succès')
      router.refresh()
    } catch (error) {
      console.error('Error dispatching commande:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du dispatch de la commande')
    } finally {
      setDispatchingCommandeId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-8">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Commandes Fournisseur
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Créez et gérez vos commandes fournisseur
              </p>
            </div>
          </div>
        </div>

        {/* Top Section - Nouveau Commande Fournisseur */}
        <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Nouveau Commande Fournisseur</CardTitle>
                  <p className="text-blue-100 text-sm mt-0.5">Créer une nouvelle commande </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <CreateCommandeDialog 
                clients={clients}
                clientsEntreprise={clientsEntreprise}
                voitureModels={voitureModels}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section - All Commandes with etapeCommande === PROPOSITION */}
        <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Toutes les Commandes Proposition</CardTitle>
                  
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-lg font-bold">{commandes.length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="max-h-[600px] overflow-auto space-y-3">
              {commandes.length > 0 ? (
                commandes.map((commande) => (
                  <div
                    key={commande.id}
                    className="group relative bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200/60 p-5 rounded-2xl transition-all duration-300 hover:shadow-md"
                  >
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(commande.id)}
                        disabled={deletingCommandeId === commande.id}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        {deletingCommandeId === commande.id ? 'Suppression...' : 'Supprimer'}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDispatchCommande(commande.id)}
                        disabled={dispatchingCommandeId === commande.id}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
                      >
                        <Send className="mr-1 h-4 w-4" />
                        {dispatchingCommandeId === commande.id ? 'Dispatch...' : 'Dispatch'}
                      </Button>
                    </div>
                    <div className="pr-32">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-purple-100 p-2 rounded-xl">
                            <Package className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{commande.voitureModel?.model || 'N/A'}</p>
                            <p className="text-xs text-gray-500">
                              Client: {commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full font-medium shadow-sm">
                            {commande.etapeCommande}
                          </span>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-medium shadow-sm ${
                            commande.commandeFlag === 'VENDUE'
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          }`}>
                            {commande.commandeFlag}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/80 rounded-xl p-3 border border-purple-100">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Couleur:</span>
                            <span className="font-semibold text-gray-900">{commande.couleur || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Moteur:</span>
                            <span className="font-semibold text-gray-900">{commande.motorisation || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Trans:</span>
                            <span className="font-semibold text-gray-900">{commande.transmission || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Portes:</span>
                            <span className="font-semibold text-gray-900">{commande.nbr_portes || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <Package className="h-16 w-16" />
                  </div>
                  <p className="text-center font-semibold text-lg mb-1">Aucune commande proposition</p>
                  <p className="text-center text-sm">Créez une commande pour commencer</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Confirmation de suppression
              </DialogTitle>
              <DialogDescription className="pt-2">
                Êtes-vous sûr de vouloir supprimer la commande ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                className="w-full sm:w-auto"
              >
                Non
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                Oui
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default CommandesPageClient

