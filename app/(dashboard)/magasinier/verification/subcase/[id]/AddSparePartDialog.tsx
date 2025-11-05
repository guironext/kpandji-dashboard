"use client";

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addSparePartToSubcase, getCommandesWithModelsForSubcase } from '@/lib/actions/subcase'
import { Package, Save } from 'lucide-react'
import { toast } from 'sonner'

interface VoitureModel {
  id: string;
  model: string;
  fiche_technique: string | null;
}

interface Commande {
  id: string;
  voitureModel: VoitureModel | null;
}

interface AddSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcaseId: string;
  onSuccess: () => void;
}

const AddSparePartDialog: React.FC<AddSparePartDialogProps> = ({
  open,
  onOpenChange,
  subcaseId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    partCode: '',
    partName: '',
    partNameFrench: '',
    quantity: '',
    commandeId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  useEffect(() => {
    if (open && subcaseId) {
      fetchCommandes()
    }
  }, [open, subcaseId])

  const fetchCommandes = async () => {
    setLoadingModels(true)
    try {
      const result = await getCommandesWithModelsForSubcase(subcaseId)
      if (result.success && result.data) {
        setCommandes(result.data)
      }
    } catch (error) {
      console.error('Error fetching commandes:', error)
    } finally {
      setLoadingModels(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.partCode.trim() || !formData.partName.trim() || !formData.quantity) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addSparePartToSubcase(subcaseId, {
        partCode: formData.partCode.trim(),
        partName: formData.partName.trim(),
        partNameFrench: formData.partNameFrench.trim() || undefined,
        quantity: parseInt(formData.quantity),
        commandeId: formData.commandeId || undefined
      })
      
      if (result.success) {
        setFormData({ partCode: '', partName: '', partNameFrench: '', quantity: '', commandeId: '' })
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Erreur lors de l\'ajout de la pièce')
      }
    } catch (error) {
      console.error('Error adding spare part:', error)
      toast.error('Erreur lors de l\'ajout de la pièce')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ partCode: '', partName: '', partNameFrench: '', quantity: '', commandeId: '' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            Ajouter une Pièce de Rechange
          </DialogTitle>
          <DialogDescription>
            Ajouter une nouvelle pièce de rechange à ce sous-cas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partCode">Code de la Pièce *</Label>
            <Input
              id="partCode"
              value={formData.partCode}
              onChange={(e) => setFormData(prev => ({ ...prev, partCode: e.target.value }))}
              placeholder="Ex: P001, P-2024-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partName">Nom de la Pièce *</Label>
            <Input
              id="partName"
              value={formData.partName}
              onChange={(e) => setFormData(prev => ({ ...prev, partName: e.target.value }))}
              placeholder="Ex: Filtre à air, Courroie de distribution"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partNameFrench">Nom en Français</Label>
            <Input
              id="partNameFrench"
              value={formData.partNameFrench}
              onChange={(e) => setFormData(prev => ({ ...prev, partNameFrench: e.target.value }))}
              placeholder="Ex: Filtre à air, Courroie de distribution"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commande">Commande (Modèle de Voiture)</Label>
            <Select
              value={formData.commandeId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, commandeId: value }))}
              disabled={loadingModels}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingModels ? "Chargement..." : "Sélectionner une commande"} />
              </SelectTrigger>
              <SelectContent>
                {commandes.map((commande) => (
                  commande.voitureModel && (
                    <SelectItem key={commande.id} value={commande.id}>
                      {commande.voitureModel.model}
                    </SelectItem>
                  )
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Ex: 1, 5, 10"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.partCode.trim() || !formData.partName.trim() || !formData.quantity}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddSparePartDialog