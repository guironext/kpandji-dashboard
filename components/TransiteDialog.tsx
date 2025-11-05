"use client";

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllConteneurs, updateConteneur } from '@/lib/actions/conteneur'
import { updateCommandeToTransite } from '@/lib/actions/commande'
import { Loader2, Package } from 'lucide-react'

interface Conteneur {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  etapeConteneur: string;
  dateEmbarquement: Date | null;
  dateArriveProbable: Date | null;
}

interface TransiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandeId: string;
  onSuccess: () => void;
}

const TransiteDialog: React.FC<TransiteDialogProps> = ({
  open,
  onOpenChange,
  commandeId,
  onSuccess
}) => {
  const [conteneurs, setConteneurs] = useState<Conteneur[]>([])
  const [selectedConteneurId, setSelectedConteneurId] = useState<string>('')
  const [isConteneurPlein, setIsConteneurPlein] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchConteneurs()
    }
  }, [open])

  const fetchConteneurs = async () => {
    setIsLoading(true)
    try {
      const result = await getAllConteneurs()
      if (result.success) {
        // Filter only containers with etapeConteneur === "EN_ATTENTE"
        const enAttenteConteneurs = (result.data || []).filter(
          conteneur => conteneur.etapeConteneur === "EN_ATTENTE"
        )
        setConteneurs(enAttenteConteneurs)
      }
    } catch (error) {
      console.error('Error fetching conteneurs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedConteneurId) return

    setIsSubmitting(true)
    try {
      // If "Conteneur Plein" is checked, update container status to "CHARGE"
      if (isConteneurPlein) {
        await updateConteneur(selectedConteneurId, { etapeConteneur: "CHARGE" })
      }

      const result = await updateCommandeToTransite(commandeId, selectedConteneurId)
      if (result.success) {
        onSuccess()
        onOpenChange(false)
        setSelectedConteneurId('')
        setIsConteneurPlein(false)
      }
    } catch (error) {
      console.error('Error updating commande:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mettre en Transit</DialogTitle>
          <DialogDescription>
            Sélectionnez un conteneur pour mettre cette commande en transit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="conteneur">Conteneur</Label>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Chargement des conteneurs...</span>
              </div>
            ) : (
                <Select value={selectedConteneurId} onValueChange={setSelectedConteneurId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un conteneur" />
                </SelectTrigger>
                <SelectContent>
                  {conteneurs.map((conteneur) => (
                    <SelectItem key={conteneur.id} value={conteneur.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{conteneur.conteneurNumber}</span>
                        <span className="text-muted-foreground">
                          (Sceau: {conteneur.sealNumber})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="conteneur-plein"
              checked={isConteneurPlein}
              onCheckedChange={setIsConteneurPlein}
            />
            <Label htmlFor="conteneur-plein" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Conteneur Plein
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedConteneurId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Mise à jour...
              </>
            ) : (
              'Mettre en Transit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TransiteDialog