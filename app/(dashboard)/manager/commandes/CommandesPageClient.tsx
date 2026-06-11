'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateCommandeDialog } from '@/components/CreateCommandeDialog'
import {
  Package,
  Plus,
  Trash2,
  Send,
  Palette,
  Cog,
  Settings2,
  DoorOpen,
  User,
  Building2,
  Inbox,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  embedded?: boolean
}

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

const CommandesPageClient = ({
  commandes,
  clients,
  clientsEntreprise,
  voitureModels,
  embedded = false,
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

  const content = (
    <div className={cn('space-y-6', embedded ? 'p-4 sm:p-6' : 'max-w-[1600px] mx-auto space-y-6 p-8')}>
      {!embedded && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Commandes Fournisseur</h2>
          <p className="mt-1 text-slate-500">Créez et gérez vos commandes fournisseur</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,360px)_1fr]">
        {/* Create panel */}
        <Card className="h-fit overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b border-blue-100/80 bg-gradient-to-br from-blue-600 to-indigo-700 pb-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Nouvelle commande</CardTitle>
                <CardDescription className="text-blue-100/90">
                  Client, entreprise ou commande interne
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Package className="h-8 w-8" />
            </div>
            <p className="text-center text-sm leading-relaxed text-slate-500">
              Lancez une proposition de commande fournisseur en sélectionnant le modèle, le client
              et les caractéristiques du véhicule.
            </p>
            <CreateCommandeDialog
              clients={clients}
              clientsEntreprise={clientsEntreprise}
              voitureModels={voitureModels}
            />
          </CardContent>
        </Card>

        {/* List panel */}
        <Card className="overflow-hidden border-slate-200/80 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Inbox className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900">Commandes en proposition</CardTitle>
                  <CardDescription>
                    {commandes.length} commande{commandes.length !== 1 ? 's' : ''} en attente de dispatch
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="w-fit px-3 py-1 text-sm font-semibold">
                {commandes.length} total
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {commandes.length > 0 ? (
              <div className="grid gap-4">
                {commandes.map((commande) => {
                  const clientName =
                    commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'N/A'
                  const isEntreprise = Boolean(commande.clientEntreprise?.nom_entreprise)
                  const isVendue = commande.commandeFlag === 'VENDUE'

                  return (
                    <article
                      key={commande.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/50"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />

                      <div className="p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                              <Package className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-lg font-bold text-slate-900">
                                {commande.voitureModel?.model || 'N/A'}
                              </h3>
                              <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                {isEntreprise ? (
                                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                                ) : (
                                  <User className="h-3.5 w-3.5 shrink-0" />
                                )}
                                <span className="truncate">{clientName}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700"
                            >
                              {commande.etapeCommande}
                            </Badge>
                            <Badge
                              className={cn(
                                'border-0 text-white',
                                isVendue
                                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                              )}
                            >
                              {commande.commandeFlag}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                          <SpecItem icon={Palette} label="Couleur" value={commande.couleur || 'N/A'} />
                          <SpecItem icon={Cog} label="Moteur" value={commande.motorisation || 'N/A'} />
                          <SpecItem icon={Settings2} label="Transmission" value={commande.transmission || 'N/A'} />
                          <SpecItem icon={DoorOpen} label="Portes" value={commande.nbr_portes || 'N/A'} />
                        </div>

                        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(commande.id)}
                            disabled={deletingCommandeId === commande.id}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            {deletingCommandeId === commande.id ? 'Suppression…' : 'Supprimer'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDispatchCommande(commande.id)}
                            disabled={dispatchingCommandeId === commande.id}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm"
                          >
                            <Send className="mr-1.5 h-4 w-4" />
                            {dispatchingCommandeId === commande.id ? 'Dispatch…' : 'Dispatcher'}
                          </Button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Package className="h-8 w-8" />
                </div>
                <p className="text-lg font-semibold text-slate-700">Aucune commande en proposition</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Utilisez le panneau de gauche pour créer votre première commande fournisseur.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Confirmation de suppression
            </DialogTitle>
            <DialogDescription className="pt-2">
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelDelete} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {content}
    </div>
  )
}

export default CommandesPageClient
