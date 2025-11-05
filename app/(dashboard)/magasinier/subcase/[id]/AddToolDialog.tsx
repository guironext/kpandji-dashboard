"use client";

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addToolToSubcase } from '@/lib/actions/subcase'
import { Wrench, Save } from 'lucide-react'
import { toast } from 'sonner'

interface AddToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcaseId: string;
  onSuccess: () => void;
}

const AddToolDialog: React.FC<AddToolDialogProps> = ({
  open,
  onOpenChange,
  subcaseId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    toolCode: '',
    toolName: '',
    quantity: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.toolCode.trim() || !formData.toolName.trim() || !formData.quantity) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addToolToSubcase(subcaseId, {
        toolCode: formData.toolCode.trim(),
        toolName: formData.toolName.trim(),
        quantity: parseInt(formData.quantity)
      })
      
      if (result.success) {
        setFormData({ toolCode: '', toolName: '', quantity: '' })
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Erreur lors de l\'ajout de l\'outil')
      }
    } catch (error) {
      console.error('Error adding tool:', error)
      toast.error('Erreur lors de l\'ajout de l\'outil')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ toolCode: '', toolName: '', quantity: '' })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            Ajouter un Outil
          </DialogTitle>
          <DialogDescription>
            Ajouter un nouvel outil à ce sous-cas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="toolCode">Code de l&apos;Outil *</Label>
            <Input
              id="toolCode"
              value={formData.toolCode}
              onChange={(e) => setFormData(prev => ({ ...prev, toolCode: e.target.value }))}
              placeholder="Ex: T001, T-2024-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toolName">Nom de l&apos;Outil *</Label>
            <Input
              id="toolName"
              value={formData.toolName}
              onChange={(e) => setFormData(prev => ({ ...prev, toolName: e.target.value }))}
              placeholder="Ex: Clé dynamométrique, Tournevis cruciforme"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Ex: 1, 2, 5"
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
              disabled={isSubmitting || !formData.toolCode.trim() || !formData.toolName.trim() || !formData.quantity}
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

export default AddToolDialog


