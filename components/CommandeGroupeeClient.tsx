'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCommandeDialog } from '@/components/CreateCommandeDialog'
import { 
  X, 
  Package, 
  CheckCircle2, 
  Grip, 
  Plus, 
  Save, 
  CalendarIcon, 
  TrendingUp, 
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type CommandeType = {
  id: string
  couleur: string | null
  motorisation: string | null
  transmission: string | null
  nbr_portes: string | null
  prix_unitaire: string | null
  date_livraison: string
  createdAt: string
  updatedAt: string
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
  commandesProposition: CommandeType[]
  commandesDisponibles: CommandeType[]
  clients: { id: string; nom: string; telephone: string | null }[]
  clientsEntreprise: { id: string; nom_entreprise: string; telephone: string | null }[]
  voitureModels: { id: string; model: string }[]
}

const CommandeGroupeeClient = ({
  commandesProposition,
  commandesDisponibles,
  clients,
  clientsEntreprise,
  voitureModels
}: Props) => {
  const router = useRouter()
  const [isCreatingGroupee, setIsCreatingGroupee] = useState(false)
  const [droppedCommandes, setDroppedCommandes] = useState<CommandeType[]>([])
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [deletingCommandeId, setDeletingCommandeId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [validationDate, setValidationDate] = useState<Date | undefined>(undefined)

  const handleDragStart = (e: React.DragEvent, commande: CommandeType) => {
    e.dataTransfer.setData('commande', JSON.stringify(commande))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    
    const commandeData = e.dataTransfer.getData('commande')
    if (commandeData) {
      const commande = JSON.parse(commandeData) as CommandeType
      // Check if commande is already in the list
      if (!droppedCommandes.find(c => c.id === commande.id)) {
        setDroppedCommandes([...droppedCommandes, commande])
      }
    }
  }

  const handleRemoveCommande = (commandeId: string) => {
    setDroppedCommandes(droppedCommandes.filter(c => c.id !== commandeId))
  }

  const handleCreateGroupee = () => {
    setIsCreatingGroupee(true)
    setDroppedCommandes([])
  }

  const handleSaveGroupee = async () => {
    // Validate that we have a validation date
    if (!validationDate) {
      toast.error('Veuillez sélectionner une date de validation')
      return
    }

    // Validate that we have at least one commande
    if (droppedCommandes.length === 0) {
      toast.error('Veuillez ajouter au moins une commande')
      return
    }

    setIsSaving(true)

    try {
      const commandeIds = droppedCommandes.map(cmd => cmd.id)
      
      const response = await fetch('/api/commande-groupee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commandeIds,
          validationDate: validationDate.toISOString()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      await response.json()
      
      toast.success(`Commande groupée créée avec succès! ${droppedCommandes.length} commande(s) validée(s)`)
      
      // Reset the UI
      setIsCreatingGroupee(false)
      setDroppedCommandes([])
      setValidationDate(undefined)
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error saving commande groupée:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création de la commande groupée')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCommande = async (commandeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      return
    }

    setDeletingCommandeId(commandeId)
    
    try {
      const response = await fetch(`/api/commandes/${commandeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      toast.success('Commande supprimée avec succès')
      router.refresh() // Refresh the page to get updated data
    } catch (error) {
      console.error('Error deleting commande:', error)
      toast.error('Erreur lors de la suppression de la commande')
    } finally {
      setDeletingCommandeId(null)
    }
  }

  // Filter out commands that are already in the dropped list
  const availableCommandesProposition = commandesProposition.filter(
    cmd => !droppedCommandes.find(d => d.id === cmd.id)
  )
  
  const availableCommandesDisponibles = commandesDisponibles.filter(
    cmd => !droppedCommandes.find(d => d.id === cmd.id)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="flex flex-col p-8 gap-6 max-w-[1920px] mx-auto">
        {/* Header Section with Statistics */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
                  <ShoppingCart className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Gestion des Commandes Groupées
                  </h1>
                  <p className="text-gray-600 mt-1 text-lg">
                    Créez et gérez vos commandes groupées par glisser-déposer
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <CreateCommandeDialog 
                clients={clients}
                clientsEntreprise={clientsEntreprise}
                voitureModels={voitureModels}
              />
              <Button 
                size="lg"
                onClick={handleCreateGroupee}
                disabled={isCreatingGroupee}
                className={`${
                  isCreatingGroupee 
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/50' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'
                } transition-all duration-300`}
              >
                {isCreatingGroupee ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                    Mode Création Activé
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Créer Commande Groupée
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">Commandes Vendues</p>
                    <p className="text-3xl font-bold text-blue-900">{availableCommandesProposition.length}</p>
                  </div>
                  <div className="bg-blue-600 p-3 rounded-2xl">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-1">Commandes Disponibles</p>
                    <p className="text-3xl font-bold text-purple-900">{availableCommandesDisponibles.length}</p>
                  </div>
                  <div className="bg-purple-600 p-3 rounded-2xl">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-700 mb-1">Total Disponible</p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {availableCommandesProposition.length + availableCommandesDisponibles.length}
                    </p>
                  </div>
                  <div className="bg-emerald-600 p-3 rounded-2xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Helper Info Banner */}
        {isCreatingGroupee && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 text-white">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Glissez les commandes depuis les listes ci-dessous vers la zone de dépôt pour créer une commande groupée
              </p>
            </div>
          </div>
        )}

        {/* Top Section - Split into 2 columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Side - Commandes Vendues */}
          <div className="flex flex-col">
            <Card className="flex-1 shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Commandes Vendues</CardTitle>
                      <p className="text-blue-100 text-sm mt-0.5">Commandes confirmées par les clients</p>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-lg font-bold">{availableCommandesProposition.length}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 max-h-[600px] overflow-auto custom-scrollbar">
                <div className="space-y-3">
                  {availableCommandesProposition.length > 0 ? (
                    availableCommandesProposition.map((commande, index) => (
                      <div
                        key={commande.id}
                        draggable={isCreatingGroupee}
                        onDragStart={(e) => handleDragStart(e, commande)}
                        className={`group relative bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200/60 p-5 rounded-2xl transition-all duration-300 ${
                          isCreatingGroupee 
                            ? 'cursor-grab active:cursor-grabbing hover:shadow-2xl hover:scale-[1.03] hover:border-blue-400 hover:-translate-y-1' 
                            : 'hover:shadow-md'
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {isCreatingGroupee && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-blue-100 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Grip className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        <div className={`${isCreatingGroupee ? 'ml-8' : ''}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="bg-blue-100 p-2 rounded-xl">
                                <Package className="h-5 w-5 text-blue-600" />
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
                              <span className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-full font-medium shadow-sm">
                                {commande.commandeFlag}
                              </span>
                            </div>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 border border-blue-100">
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
                      <p className="text-center font-semibold text-lg mb-1">Aucune commande vendue</p>
                      <p className="text-center text-sm">Les commandes vendues apparaîtront ici</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Commandes Disponibles */}
          <div className="flex flex-col">
            <Card className="flex-1 shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Commandes Disponibles</CardTitle>
                      <p className="text-purple-100 text-sm mt-0.5">Commandes en attente de validation</p>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-lg font-bold">{availableCommandesDisponibles.length}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 max-h-[600px] overflow-auto custom-scrollbar">
                <div className="space-y-3">
                  {availableCommandesDisponibles.length > 0 ? (
                    availableCommandesDisponibles.map((commande, index) => (
                      <div
                        key={commande.id}
                        draggable={isCreatingGroupee}
                        onDragStart={(e) => handleDragStart(e, commande)}
                        className={`group relative bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200/60 p-5 rounded-2xl transition-all duration-300 ${
                          isCreatingGroupee 
                            ? 'cursor-grab active:cursor-grabbing hover:shadow-2xl hover:scale-[1.03] hover:border-purple-400 hover:-translate-y-1' 
                            : 'hover:shadow-md'
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {isCreatingGroupee && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-purple-100 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Grip className="h-4 w-4 text-purple-600" />
                          </div>
                        )}
                        <div className={`${isCreatingGroupee ? 'ml-8' : ''}`}>
                          {!isCreatingGroupee && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCommande(commande.id)}
                              disabled={deletingCommandeId === commande.id}
                              className="mb-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md"
                            >
                              <X className="mr-1 h-4 w-4" />
                              {deletingCommandeId === commande.id ? 'Suppression...' : 'Supprimer'}
                            </Button>
                          )}
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
                              <span className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-full font-medium shadow-sm">
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
                      <p className="text-center font-semibold text-lg mb-1">Aucune commande disponible</p>
                      <p className="text-center text-sm">Les commandes disponibles apparaîtront ici</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Drop Zone Section - Commandes Groupées */}
        {isCreatingGroupee && (
          <div className="animate-in slide-in-from-top duration-500">
            <Card className="shadow-2xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-br from-emerald-600 to-green-600 text-white border-0 pb-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                      <Sparkles className="h-7 w-7 animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-2xl mb-1">Nouvelle Commande Groupée</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-sm font-semibold">{droppedCommandes.length} commande(s)</span>
                        </div>
                        {droppedCommandes.length > 0 && (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingGroupee(false)
                      setDroppedCommandes([])
                      setValidationDate(undefined)
                    }}
                    className="hover:bg-white/20 text-white hover:text-white border border-white/30"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
              </CardHeader>

              <div className="px-8 py-6 bg-gradient-to-br from-emerald-50/50 to-green-50/30 border-b border-emerald-100">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-emerald-100 p-2.5 rounded-xl">
                      <CalendarIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Date de validation de la commande groupée
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-medium border-2 ${
                              !validationDate 
                                ? 'text-muted-foreground border-gray-300' 
                                : 'border-emerald-300 bg-white'
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {validationDate ? (
                              format(validationDate, 'PPP', { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={validationDate}
                            onSelect={setValidationDate}
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent 
                className="p-8 min-h-[400px]"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div 
                  className={`border-4 border-dashed rounded-3xl p-8 min-h-[350px] transition-all duration-300 ${
                    isDraggingOver 
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 shadow-2xl scale-[1.01]' 
                      : 'border-gray-300 bg-gradient-to-br from-gray-50/50 to-emerald-50/20'
                  }`}
                >
                  {droppedCommandes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16">
                      <div className={`mb-6 p-6 rounded-full transition-all duration-300 ${
                        isDraggingOver 
                          ? 'bg-emerald-100 scale-110' 
                          : 'bg-gray-100'
                      }`}>
                        <Package className={`h-20 w-20 transition-colors duration-300 ${
                          isDraggingOver 
                            ? 'text-emerald-600' 
                            : 'text-gray-400'
                        }`} />
                      </div>
                      <p className={`text-center font-bold text-2xl mb-2 transition-colors duration-300 ${
                        isDraggingOver 
                          ? 'text-emerald-600' 
                          : 'text-gray-400'
                      }`}>
                        {isDraggingOver ? '✨ Déposez ici! ✨' : 'Zone de Dépôt'}
                      </p>
                      <p className="text-center text-gray-500 text-base max-w-md">
                        Glissez et déposez les commandes depuis les listes ci-dessus pour créer une commande groupée
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {droppedCommandes.map((commande, index) => (
                        <div 
                          key={commande.id} 
                          className="relative bg-gradient-to-br from-white to-emerald-50/30 border-2 border-emerald-300 p-5 rounded-2xl hover:shadow-2xl transition-all duration-300 animate-in fade-in-50 slide-in-from-top-2 hover:scale-[1.02] hover:-translate-y-1"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-2.5 rounded-xl shadow-md">
                                <Package className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-lg">{commande.voitureModel?.model || 'N/A'}</p>
                                <p className="text-xs text-gray-500">
                                  {commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCommande(commande.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-full transition-all"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 border border-emerald-100">
                            <div className="grid grid-cols-2 gap-2 text-sm">
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
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>

              {droppedCommandes.length > 0 && (
                <div className="px-8 pb-8 bg-gradient-to-br from-emerald-50/30 to-green-50/20">
                  <Button 
                    onClick={handleSaveGroupee} 
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-700 text-white shadow-2xl h-14 text-lg font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        Sauvegarde en cours...
                      </>
                    ) : (
                      <>
                        <Save className="mr-3 h-6 w-6" />
                        Créer la commande groupée ({droppedCommandes.length} commande{droppedCommandes.length > 1 ? 's' : ''})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default CommandeGroupeeClient

