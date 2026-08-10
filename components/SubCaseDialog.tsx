"use client";

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSubcase } from '@/lib/actions/subcase'
import { Package, Loader2, Box, Hash, Ship, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!subcaseNumber.trim()) {
      newErrors.subcaseNumber = 'Le numéro de sub-case est requis'
    } else if (subcaseNumber.trim().length < 2) {
      newErrors.subcaseNumber = 'Le numéro doit contenir au moins 2 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createSubcase({
        subcaseNumber: subcaseNumber.trim(),
        conteneurId
      })
      
      if (result.success) {
        toast.success('Sub-case créé avec succès!', {
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
        })
        setSubcaseNumber('')
        setErrors({})
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Erreur lors de la création du sub-case', {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        })
      }
    } catch (error) {
      console.error('Error creating subcase:', error)
      toast.error('Erreur lors de la création du sub-case', {
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSubcaseNumber('')
      setErrors({})
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Enhanced Header */}
        <DialogHeader className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white border-0 pb-6 pt-6 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 px-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Box className="w-7 h-7 md:w-8 md:h-8" />
                </div>
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl md:text-3xl font-extrabold mb-2">
                  Créer un nouveau Sub Case
                </DialogTitle>
                <DialogDescription className="text-white/90 text-sm md:text-base">
                  Ajoutez un sub case pour organiser les pièces de rechange
                </DialogDescription>
              </div>
            </div>
            
            {/* Container Info Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Card className="bg-white/15 backdrop-blur-sm border-white/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-xs text-white/80 uppercase tracking-wide">Conteneur</span>
                      <span className="text-sm font-bold">{conteneurNumber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/15 backdrop-blur-sm border-white/20 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-xs text-white/80 uppercase tracking-wide">Sceau</span>
                      <span className="text-sm font-bold">{sealNumber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gradient-to-br from-gray-50 to-white">
          {/* Subcase Number Input */}
          <div className="space-y-2">
            <Label htmlFor="subcaseNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Hash className="w-4 h-4 text-purple-600" />
              Numéro de Sub Case <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="subcaseNumber"
                value={subcaseNumber}
                onChange={(e) => {
                  setSubcaseNumber(e.target.value)
                  if (errors.subcaseNumber) setErrors({ ...errors, subcaseNumber: '' })
                }}
                placeholder="Ex: SC-001, SC-2024-001, SUB-001"
                className={`h-12 text-base ${errors.subcaseNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-purple-400 focus:ring-purple-200'}`}
                required
                disabled={isSubmitting}
              />
              {subcaseNumber && !errors.subcaseNumber && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            {errors.subcaseNumber && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.subcaseNumber}
              </p>
            )}
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" />
              Identifiant unique pour ce sub case dans le conteneur
            </p>
          </div>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-purple-50 via-indigo-50/50 to-blue-50/50 border-2 border-purple-200/60">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">À propos des Sub Cases</p>
                  <p className="text-xs text-gray-600">
                    Les sub cases permettent d&apos;organiser et de regrouper les pièces de rechange dans un conteneur. 
                    Vous pourrez ensuite ajouter des pièces de rechange à chaque sub case créé.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Enhanced Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200 px-6 py-4 flex items-center justify-between">
          <Button 
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !subcaseNumber.trim()}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-8 transform hover:scale-105 disabled:hover:scale-100 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Créer le Sub Case
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SubCaseDialog
