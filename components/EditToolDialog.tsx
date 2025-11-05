"use client";

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { updateTool } from '@/lib/actions/subcase'
import { Wrench, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Tool {
  id: string;
  toolCode: string;
  toolName: string;
  quantity: number;
  etapeTool: string;
  check: boolean;
  createdAt: Date;
}

interface EditToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool | null;
  onSuccess: () => void;
}

const EditToolDialog: React.FC<EditToolDialogProps> = ({
  open,
  onOpenChange,
  tool,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    toolCode: '',
    toolName: '',
    quantity: '',
    etapeTool: '',
    check: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const etapeOptions = [
    { value: 'TRANSITE', label: 'En transit' },
    { value: 'RENSEIGNE', label: 'Renseigné' },
    { value: 'ARRIVE', label: 'Arrivé' },
    { value: 'VERIFIE', label: 'Vérifié' },
    { value: 'ATTRIBUE', label: 'Attribué' },
    { value: 'CONSOMME', label: 'Consommé' }
  ]

  useEffect(() => {
    if (tool && open) {
      setFormData({
        toolCode: tool.toolCode,
        toolName: tool.toolName,
        quantity: tool.quantity.toString(),
        etapeTool: tool.etapeTool,
        check: tool.check
      })
    }
  }, [tool, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.toolCode.trim() || !formData.toolName.trim() || !formData.quantity) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!tool) return

    setIsSubmitting(true)
    try {
      const result = await updateTool(tool.id, {
        toolCode: formData.toolCode.trim(),
        toolName: formData.toolName.trim(),
        quantity: parseInt(formData.quantity),
        etapeTool: formData.etapeTool as 'TRANSITE' | 'RENSEIGNE' | 'ARRIVE' | 'VERIFIE' | 'ATTRIBUE' | 'CONSOMME',
        check: formData.check
      })
      
      if (result.success) {
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating tool:', error)
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            Modifier l&apos;Outil
          </DialogTitle>
          <DialogDescription>
            Modifier les informations de cet outil
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

          <div className="space-y-2">
            <Label htmlFor="etapeTool">Étape</Label>
            <Select
              value={formData.etapeTool}
              onValueChange={(value) => setFormData(prev => ({ ...prev, etapeTool: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une étape" />
              </SelectTrigger>
              <SelectContent>
                {etapeOptions.map((etape) => (
                  <SelectItem key={etape.value} value={etape.value}>
                    {etape.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="check"
              checked={formData.check}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, check: checked as boolean }))}
            />
            <Label htmlFor="check">Vérifié</Label>
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
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditToolDialog