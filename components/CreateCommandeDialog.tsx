'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Car, Palette, Fuel, Settings, DoorOpen, Plus, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface CreateCommandeDialogProps {
  clients: Array<{ id: string; nom: string; telephone: string | null }>
  clientsEntreprise: Array<{ id: string; nom_entreprise: string; telephone: string | null }>
  voitureModels: Array<{ id: string; model: string }>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CreateCommandeDialog({ clients, clientsEntreprise, voitureModels }: CreateCommandeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    voitureModelId: '',
    couleur: '',
    motorisation: 'ESSENCE',
    transmission: 'MANUEL',
    nbr_portes: '4',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Set default date_livraison to 3 months from now
      const defaultDeliveryDate = new Date()
      defaultDeliveryDate.setMonth(defaultDeliveryDate.getMonth() + 4)

      const response = await fetch('/api/commandes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          etapeCommande: 'PROPOSITION',
          commandeFlag: 'DISPONIBLE',
          clientId: null,
          clientEntrepriseId: null,
          date_livraison: defaultDeliveryDate.toISOString(),
          prix_unitaire: null,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la commande')
      }

      toast.success('Commande créée avec succès!')
      setOpen(false)
      setFormData({
        voitureModelId: '',
        couleur: '',
        motorisation: 'ESSENCE',
        transmission: 'MANUEL',
        nbr_portes: '4',
      })
      router.refresh()
    } catch (error) {
      toast.error('Erreur lors de la création de la commande')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-1/2 gap-2 shadow-sm hover:shadow-md transition-shadow">
          <Plus className="h-4 w-4" />
          Créer Commande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-semibold">Nouvelle Commande</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Créer une commande disponible pour proposition
              </DialogDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Proposition
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Disponible
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Livraison: 4 mois
            </Badge>
          </div>
        </DialogHeader>

        <Separator className="my-2" />

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Main Vehicle Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Informations du Véhicule
              </h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Voiture Model */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="voitureModelId" className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  Modèle de Voiture
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.voitureModelId}
                  onValueChange={(value) => setFormData({ ...formData, voitureModelId: value })}
                  required
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sélectionner un modèle de véhicule" />
                  </SelectTrigger>
                  <SelectContent>
                    {voitureModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          {model.model}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Couleur */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="couleur" className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Couleur
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="couleur"
                  value={formData.couleur}
                  onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
                  placeholder="Ex: Blanc Perle, Noir Métallisé, Rouge Passion..."
                  required
                  className="h-11"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Technical Specifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Spécifications Techniques
              </h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Motorisation */}
              <div className="space-y-2">
                <Label htmlFor="motorisation" className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  Motorisation
                </Label>
                <Select
                  value={formData.motorisation}
                  onValueChange={(value) => setFormData({ ...formData, motorisation: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Type de moteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESSENCE">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4" />
                        Essence
                      </div>
                    </SelectItem>
                    <SelectItem value="DIESEL">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4" />
                        Diesel
                      </div>
                    </SelectItem>
                    <SelectItem value="ELECTRIQUE">
                      <div className="flex items-center gap-2">
                        ⚡ Électrique
                      </div>
                    </SelectItem>
                    <SelectItem value="HYBRIDE">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4" />
                        Hybride
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transmission */}
              <div className="space-y-2">
                <Label htmlFor="transmission" className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Transmission
                </Label>
                <Select
                  value={formData.transmission}
                  onValueChange={(value) => setFormData({ ...formData, transmission: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Type de transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUEL">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Manuel
                      </div>
                    </SelectItem>
                    <SelectItem value="AUTOMATIQUE">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Automatique
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nombre de portes */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nbr_portes" className="flex items-center gap-2">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  Nombre de Portes
                </Label>
                <Select
                  value={formData.nbr_portes}
                  onValueChange={(value) => setFormData({ ...formData, nbr_portes: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Nombre de portes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4" />
                        2 portes 
                      </div>
                    </SelectItem>
                    <SelectItem value="4">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4" />
                        4 portes
                      </div>
                    </SelectItem>
                    <SelectItem value="5">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4" />
                        5 portes
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Information de commande
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Cette commande sera créée avec le statut <strong>Proposition</strong> et marquée comme <strong>Disponible</strong>. 
                  La date de livraison est automatiquement fixée à 4 mois à partir d&apos;aujourd&apos;hui.
                </p>
              </div>
            </div>
          </div>
        </form>

        <Separator className="my-4" />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
            className="min-w-[100px]"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            onClick={handleSubmit}
            className="min-w-[140px] gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Créer Commande
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

