"use client";

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSubcase } from '@/lib/actions/subcase'
import { Package } from 'lucide-react'

interface SubCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conteneurId: string;
  conteneurNumber: string;
  sealNumber: string;
  onSuccess: () => void;
}

const SubCaseDialog: React.FC<SubCaseDialogProps> = ({
  open,
  onOpenChange,
  conteneurId,
  conteneurNumber,
  sealNumber,
  onSuccess
}) => {
  const [subcaseNumber, setSubcaseNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subcaseNumber.trim()) return

    setIsSubmitting(true)
    try {
      const result = await createSubcase({
        subcaseNumber: subcaseNumber.trim(),
        conteneurId
      })
      
      if (result.success) {
        setSubcaseNumber('')
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error creating subcase:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Créer Sub Case
          </DialogTitle>
          <DialogDescription>
            Conteneur: {conteneurNumber} | Sceau: {sealNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subcaseNumber">Numéro de Sub Case</Label>
            <Input
              id="subcaseNumber"
              value={subcaseNumber}
              onChange={(e) => setSubcaseNumber(e.target.value)}
              placeholder="Ex: SC-001, SC-2024-001"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting || !subcaseNumber.trim()}
            className="w-full"
          >
            {isSubmitting ? 'Création...' : 'Créer Sub Case'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SubCaseDialog
