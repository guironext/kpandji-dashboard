"use client";

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSparePart } from '@/lib/actions/subcase'
import { Package, Save, Loader2, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { translateToFrench } from '@/lib/utils'

interface SparePart {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  etapeSparePart: string;
  createdAt: Date;
}

interface EditSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparePart: SparePart | null;
  subcaseId: string;
  onSuccess: () => void;
}

const EditSparePartDialog: React.FC<EditSparePartDialogProps> = ({
  open,
  onOpenChange,
  sparePart,
  // subcaseId, // Unused but kept in interface for future use
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
  const [isTranslating, setIsTranslating] = useState(false)
  const [isManualFrenchEdit, setIsManualFrenchEdit] = useState(false)
  const [initialFrenchValue, setInitialFrenchValue] = useState('')

  useEffect(() => {
    if (sparePart && open) {
      const frenchValue = sparePart.partNameFrench || ''
      setFormData({
        partCode: sparePart.partCode,
        partName: sparePart.partName,
        partNameFrench: frenchValue,
        quantity: sparePart.quantity.toString(),
        commandeId: ''
      })
      setInitialFrenchValue(frenchValue)
      setIsManualFrenchEdit(false)
    }
  }, [sparePart, open])

  // Auto-translate partName to French when partName changes
  useEffect(() => {
    // Only auto-translate if:
    // 1. partName has content
    // 2. User hasn't manually edited the French field
    // 3. Dialog is open
    if (formData.partName.trim() && !isManualFrenchEdit && open && sparePart) {
      const translatePartName = async () => {
        setIsTranslating(true)
        try {
          const translated = await translateToFrench(formData.partName.trim())
          if (translated && translated !== formData.partName) {
            setFormData(prev => ({ ...prev, partNameFrench: translated }))
          }
        } catch (error) {
          console.error('Translation error:', error)
        } finally {
          setIsTranslating(false)
        }
      }

      // Debounce translation to avoid too many API calls
      const timeoutId = setTimeout(translatePartName, 800)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.partName, isManualFrenchEdit, open, sparePart])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.partCode.trim() || !formData.partName.trim() || !formData.quantity) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!sparePart) return

    setIsSubmitting(true)
    try {
      const result = await updateSparePart(sparePart.id, {
        partCode: formData.partCode.trim(),
        partName: formData.partName.trim(),
        partNameFrench: formData.partNameFrench.trim() || undefined,
        quantity: parseInt(formData.quantity),
        statusVerification: 'MODIFIE'
      })
      
      if (result.success) {
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating spare part:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
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
            Modifier la Pièce de Rechange
          </DialogTitle>
          <DialogDescription>
            Modifier les informations de cette pièce de rechange
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
            <Label htmlFor="partNameFrench" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Nom en Français
              {isTranslating && (
                <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
              )}
            </Label>
            <div className="relative">
              <Input
                id="partNameFrench"
                value={formData.partNameFrench}
                onChange={(e) => {
                  setIsManualFrenchEdit(true)
                  setFormData(prev => ({ ...prev, partNameFrench: e.target.value }))
                }}
                onFocus={() => setIsManualFrenchEdit(true)}
                placeholder="Ex: Filtre à air, Courroie de distribution"
                className="pr-10"
              />
              {isTranslating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {isManualFrenchEdit 
                ? "Traduction automatique désactivée (modification manuelle)" 
                : "Traduit automatiquement depuis l'anglais"}
            </p>
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
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditSparePartDialog