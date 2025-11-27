'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  X, 
  Package, 
  Grip, 
  Save, 
  Container,
  Info,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr as datePickerFr } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

// Register French locale for react-datepicker
registerLocale('fr', datePickerFr)

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
  commandeGroupeeId: string | null
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

type CommandeGroupeeType = {
  id: string
  date_validation: string
  stock_global: string
  vendue: string
  details: string
  stock_disponible: string
  createdAt: string
  updatedAt: string
  etapeCommandeGroupee: string
  commandes: CommandeType[]
}

type Props = {
  commandesGroupees: CommandeGroupeeType[]
}

const ConteneurisationClient = ({ commandesGroupees }: Props) => {
  const router = useRouter()
  const [droppedCommandes, setDroppedCommandes] = useState<CommandeType[]>([])
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isCreatingConteneur, setIsCreatingConteneur] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [conteneurNumber, setConteneurNumber] = useState('')
  const [sealNumber, setSealNumber] = useState('')
  const [totalPackages, setTotalPackages] = useState('')
  const [grossWeight, setGrossWeight] = useState('')
  const [netWeight, setNetWeight] = useState('')
  const [stuffingMap, setStuffingMap] = useState('')
  const [dateEmbarquement, setDateEmbarquement] = useState<Date | null>(null)
  const [dateArriveProbable, setDateArriveProbable] = useState<Date | null>(null)
  const [conteneurNumberError, setConteneurNumberError] = useState<string | null>(null)
  
  // Ref for container number input to focus on error
  const conteneurNumberRef = useRef<HTMLInputElement>(null)

  // Track which commandes have been removed from which commandeGroupee
  const [removedCommandeIds, setRemovedCommandeIds] = useState<Set<string>>(new Set())

  // Filter commandesGroupees to only show commandes that haven't been removed
  const filteredCommandesGroupees = commandesGroupees.map(cg => ({
    ...cg,
    commandes: cg.commandes.filter(cmd => !removedCommandeIds.has(cmd.id))
  })).filter(cg => cg.commandes.length > 0)


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
        setRemovedCommandeIds(new Set([...removedCommandeIds, commande.id]))
      }
    }
  }

  const handleRemoveCommande = (commandeId: string) => {
    setDroppedCommandes(droppedCommandes.filter(c => c.id !== commandeId))
    setRemovedCommandeIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(commandeId)
      return newSet
    })
  }

  const handleCreateConteneur = async () => {
    // Clear previous errors
    setConteneurNumberError(null)
    
    // Validate required fields
    if (!conteneurNumber || !sealNumber) {
      toast.error('Le numéro de conteneur et le numéro de scellé sont requis')
      return
    }

    if (droppedCommandes.length === 0) {
      toast.error('Veuillez ajouter au moins une commande')
      return
    }

    setIsSaving(true)

    try {
      const commandeIds = droppedCommandes.map(cmd => cmd.id)
      
      const response = await fetch('/api/conteneur', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conteneurNumber,
          sealNumber,
          totalPackages: totalPackages || undefined,
          grossWeight: grossWeight || undefined,
          netWeight: netWeight || undefined,
          stuffingMap: stuffingMap || undefined,
          dateEmbarquement: dateEmbarquement ? dateEmbarquement.toISOString() : undefined,
          dateArriveProbable: dateArriveProbable ? dateArriveProbable.toISOString() : undefined,
          commandeIds
        })
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.error || 'Erreur lors de la création'
        
        // Check if it's a duplicate container number error
        if (errorMessage.includes('existe déjà')) {
          setConteneurNumberError(errorMessage)
          conteneurNumberRef.current?.focus()
          conteneurNumberRef.current?.select()
        }
        
        throw new Error(errorMessage)
      }

      await response.json()
      
      toast.success(`Conteneur créé avec succès! ${droppedCommandes.length} commande(s) assignée(s)`)
      
      // Reset the UI
      setIsCreatingConteneur(false)
      setDroppedCommandes([])
      setRemovedCommandeIds(new Set())
      setConteneurNumber('')
      setSealNumber('')
      setTotalPackages('')
      setGrossWeight('')
      setNetWeight('')
      setStuffingMap('')
      setDateEmbarquement(null)
      setDateArriveProbable(null)
      setConteneurNumberError(null)
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      // Error is already handled above for duplicate case
      // For other errors, just show toast
      if (!(error instanceof Error && error.message.includes('existe déjà'))) {
        toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du conteneur')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-8">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Container className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Conteneurisation
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Créez des conteneurs en glissant des commandes depuis les commandes groupées
              </p>
            </div>
          </div>
        </div>

        {/* Top Section - Commandes Groupées */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Commandes Groupées Validées</h2>
          {filteredCommandesGroupees.length === 0 ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Aucune commande groupée validée disponible</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCommandesGroupees.map((cg) => (
                <Card key={cg.id} className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                          <Package className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-xl">
                            Commande Groupée #{cg.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-blue-100 text-sm mt-0.5">
                            Validée le {format(new Date(cg.date_validation), 'PPP', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-center">
                          <div className="text-xs text-blue-100 mb-1">Stock Global</div>
                          <div className="text-xl font-bold">{cg.stock_global}</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-center">
                          <div className="text-xs text-blue-100 mb-1">Commandes</div>
                          <div className="text-xl font-bold">{cg.commandes.length}</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cg.commandes.map((commande) => (
                        <div
                          key={commande.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, commande)}
                          className="group relative bg-gradient-to-br from-white to-blue-50/30 border-2 border-blue-200/60 p-4 rounded-xl transition-all duration-300 cursor-grab active:cursor-grabbing hover:shadow-xl hover:scale-[1.02] hover:border-blue-400 hover:-translate-y-1"
                        >
                          <div className="absolute left-2 top-2 bg-blue-100 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <Grip className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-8">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-gray-900">{commande.voitureModel?.model || 'N/A'}</p>
                                <p className="text-xs text-gray-500">
                                  {commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="bg-white/80 rounded-lg p-2 border border-blue-100">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-500">Couleur:</span>
                                  <span className="font-semibold text-gray-900 ml-1">{commande.couleur || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Moteur:</span>
                                  <span className="font-semibold text-gray-900 ml-1">{commande.motorisation || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Trans:</span>
                                  <span className="font-semibold text-gray-900 ml-1">{commande.transmission || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Portes:</span>
                                  <span className="font-semibold text-gray-900 ml-1">{commande.nbr_portes || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Helper Info Banner */}
        {droppedCommandes.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 text-white">
              <Info className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {droppedCommandes.length} commande(s) sélectionnée(s). Cliquez sur &quot;Créer Conteneur&quot; pour continuer.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Section - Drag and Drop Zone */}
        <Card className="shadow-2xl border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-br from-emerald-600 to-green-600 text-white border-0 pb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <Container className="h-7 w-7 animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-white text-2xl mb-1">Zone de Dépôt</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold">{droppedCommandes.length} commande(s)</span>
                    </div>
                  </div>
                </div>
              </div>
              {droppedCommandes.length > 0 && (
                <Dialog open={isCreatingConteneur} onOpenChange={setIsCreatingConteneur}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg"
                      size="lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Créer Conteneur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-visible">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Créer un Conteneur</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="conteneurNumber">Numéro de Conteneur *</Label>
                          <Input
                            ref={conteneurNumberRef}
                            id="conteneurNumber"
                            value={conteneurNumber}
                            onChange={(e) => {
                              setConteneurNumber(e.target.value)
                              // Clear error when user starts typing
                              if (conteneurNumberError) {
                                setConteneurNumberError(null)
                              }
                            }}
                            placeholder="Ex: CONT-001"
                            required
                            className={conteneurNumberError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                          />
                          {conteneurNumberError && (
                            <p className="text-sm text-red-500 mt-1">{conteneurNumberError}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="sealNumber">Numéro de Scellé *</Label>
                          <Input
                            id="sealNumber"
                            value={sealNumber}
                            onChange={(e) => setSealNumber(e.target.value)}
                            placeholder="Ex: SEAL-001"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="totalPackages">Nombre Total de Colis</Label>
                          <Input
                            id="totalPackages"
                            value={totalPackages}
                            onChange={(e) => setTotalPackages(e.target.value)}
                            placeholder="Ex: 50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="grossWeight">Poids Brut (kg)</Label>
                          <Input
                            id="grossWeight"
                            value={grossWeight}
                            onChange={(e) => setGrossWeight(e.target.value)}
                            placeholder="Ex: 25000"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="netWeight">Poids Net (kg)</Label>
                          <Input
                            id="netWeight"
                            value={netWeight}
                            onChange={(e) => setNetWeight(e.target.value)}
                            placeholder="Ex: 23000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="stuffingMap">Plan de Chargement</Label>
                          <Input
                            id="stuffingMap"
                            value={stuffingMap}
                            onChange={(e) => setStuffingMap(e.target.value)}
                            placeholder="Référence du plan"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Date d&apos;Embarquement</Label>
                          <DatePicker
                            selected={dateEmbarquement}
                            onChange={(date) => setDateEmbarquement(date)}
                            dateFormat="PPP"
                            locale="fr"
                            placeholderText="Sélectionner une date"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            wrapperClassName="w-full"
                            showPopperArrow={false}
                            popperClassName="z-[100]"
                          />
                        </div>
                        <div>
                          <Label>Date d&apos;Arrivée Probable</Label>
                          <DatePicker
                            selected={dateArriveProbable}
                            onChange={(date) => setDateArriveProbable(date)}
                            dateFormat="PPP"
                            locale="fr"
                            placeholderText="Sélectionner une date"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            wrapperClassName="w-full"
                            showPopperArrow={false}
                            popperClassName="z-[100]"
                          />
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreatingConteneur(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleCreateConteneur}
                          disabled={isSaving}
                          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              Création...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Créer Conteneur
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>

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
                    Glissez et déposez les commandes depuis les commandes groupées ci-dessus pour créer un conteneur
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {droppedCommandes.map((commande, index) => (
                    <div 
                      key={commande.id} 
                      className="relative bg-gradient-to-br from-white to-emerald-50/30 border-2 border-emerald-300 p-4 rounded-xl hover:shadow-xl transition-all duration-300 animate-in fade-in-50 slide-in-from-top-2 hover:scale-[1.02] hover:-translate-y-1"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-2 rounded-lg shadow-md">
                            <Package className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{commande.voitureModel?.model || 'N/A'}</p>
                            <p className="text-xs text-gray-500">
                              {commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCommande(commande.id)}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 rounded-full transition-all"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="bg-white/80 rounded-lg p-2 border border-emerald-100">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Couleur:</span>
                            <span className="font-semibold text-gray-900 ml-1">{commande.couleur || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Moteur:</span>
                            <span className="font-semibold text-gray-900 ml-1">{commande.motorisation || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Trans:</span>
                            <span className="font-semibold text-gray-900 ml-1">{commande.transmission || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Portes:</span>
                            <span className="font-semibold text-gray-900 ml-1">{commande.nbr_portes || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ConteneurisationClient

