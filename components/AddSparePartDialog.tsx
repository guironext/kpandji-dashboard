"use client";

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addSparePartToSubcase, getCommandesWithModelsForSubcase } from '@/lib/actions/subcase'
import { Package, Loader2, Hash, FileText, Globe, ShoppingCart, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'

interface Commande {
  id: string;
  couleur?: string;
  motorisation?: string;
  nbr_portes?: string;
  transmission?: string;
  voitureModel?: {
    id: string;
    model: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

interface AddSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcaseId: string;
  subcaseNumber: string;
  onSuccess: () => void;
}

const AddSparePartDialog: React.FC<AddSparePartDialogProps> = ({
  open,
  onOpenChange,
  subcaseId,
  subcaseNumber,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    partCode: '',
    partName: '',
    partNameFrench: '',
    quantity: '',
    commandeId: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [loadingCommandes, setLoadingCommandes] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCommandes = useCallback(async () => {
    if (!subcaseId) return
    setLoadingCommandes(true)
    try {
      const result = await getCommandesWithModelsForSubcase(subcaseId)
      if (result.success && result.data) {
        setCommandes(result.data as unknown as Commande[])
      }
    } catch (error) {
      console.error('Error fetching commandes:', error)
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setLoadingCommandes(false)
    }
  }, [subcaseId])

  useEffect(() => {
    if (open && subcaseId) {
      fetchCommandes()
      // Reset form when dialog opens
      setFormData({
        partCode: '',
        partName: '',
        partNameFrench: '',
        quantity: '',
        commandeId: ''
      })
      setErrors({})
    }
  }, [open, subcaseId, fetchCommandes])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.partCode.trim()) {
      newErrors.partCode = 'Le code de la pièce est requis'
    } else if (formData.partCode.trim().length < 2) {
      newErrors.partCode = 'Le code doit contenir au moins 2 caractères'
    }

    if (!formData.partName.trim()) {
      newErrors.partName = 'Le nom de la pièce est requis'
    } else if (formData.partName.trim().length < 3) {
      newErrors.partName = 'Le nom doit contenir au moins 3 caractères'
    }

    if (!formData.quantity) {
      newErrors.quantity = 'La quantité est requise'
    } else {
      const quantity = parseInt(formData.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        newErrors.quantity = 'La quantité doit être un nombre positif'
      } else if (quantity > 10000) {
        newErrors.quantity = 'La quantité ne peut pas dépasser 10000'
      }
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

    const quantity = parseInt(formData.quantity)

    setIsSubmitting(true)
    try {
      const result = await addSparePartToSubcase(subcaseId, {
        partCode: formData.partCode.trim(),
        partName: formData.partName.trim(),
        partNameFrench: formData.partNameFrench.trim() || undefined,
        quantity: quantity,
        commandeId: formData.commandeId || undefined,
      })
      
      if (result.success) {
        toast.success('Pièce de rechange ajoutée avec succès!', {
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
        })
        setFormData({
          partCode: '',
          partName: '',
          partNameFrench: '',
          quantity: '',
          commandeId: ''
        })
        setErrors({})
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Erreur lors de l\'ajout de la pièce de rechange', {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        })
      }
    } catch (error) {
      console.error('Error adding spare part:', error)
      toast.error('Erreur lors de l\'ajout de la pièce de rechange', {
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        partCode: '',
        partName: '',
        partNameFrench: '',
        quantity: '',
        commandeId: ''
      })
      setErrors({})
      onOpenChange(false)
    }
  }

  const selectedCommande = commandes.find(c => c.id === formData.commandeId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-purple-50 via-indigo-50/60 to-blue-50/40 border-b-2 border-purple-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-extrabold text-gray-900">
                Ajouter une Pièce de Rechange
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Sub Case: <span className="font-semibold text-purple-700">{subcaseNumber}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Part Code */}
          <div className="space-y-2">
            <Label htmlFor="partCode" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Hash className="w-4 h-4 text-purple-600" />
              Code de la Pièce <span className="text-red-500">*</span>
            </Label>
            <Input
              id="partCode"
              value={formData.partCode}
              onChange={(e) => {
                setFormData({ ...formData, partCode: e.target.value })
                if (errors.partCode) setErrors({ ...errors, partCode: '' })
              }}
              placeholder="Ex: PR-001, ABC123, XYZ-2024"
              className={`h-11 ${errors.partCode ? 'border-red-300 focus:border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.partCode && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.partCode}
              </p>
            )}
            <p className="text-xs text-gray-500">Identifiant unique de la pièce de rechange</p>
          </div>

          {/* Part Name (English) */}
          <div className="space-y-2">
            <Label htmlFor="partName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Nom de la Pièce (Anglais) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="partName"
              value={formData.partName}
              onChange={(e) => {
                setFormData({ ...formData, partName: e.target.value })
                if (errors.partName) setErrors({ ...errors, partName: '' })
              }}
              placeholder="Ex: Brake Pad, Engine Oil Filter, Spark Plug"
              className={`h-11 ${errors.partName ? 'border-red-300 focus:border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.partName && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.partName}
              </p>
            )}
            <p className="text-xs text-gray-500">Nom de la pièce en anglais</p>
          </div>

          {/* Part Name (French) */}
          <div className="space-y-2">
            <Label htmlFor="partNameFrench" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Nom de la Pièce (Français)
            </Label>
            <Input
              id="partNameFrench"
              value={formData.partNameFrench}
              onChange={(e) => setFormData({ ...formData, partNameFrench: e.target.value })}
              placeholder="Ex: Plaquette de frein, Filtre à huile moteur, Bougie d'allumage"
              className="h-11 border-gray-300"
            />
            <p className="text-xs text-gray-500">Nom de la pièce en français (optionnel)</p>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-600" />
              Quantité <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="10000"
              value={formData.quantity}
              onChange={(e) => {
                setFormData({ ...formData, quantity: e.target.value })
                if (errors.quantity) setErrors({ ...errors, quantity: '' })
              }}
              placeholder="Ex: 1, 2, 10, 50"
              className={`h-11 ${errors.quantity ? 'border-red-300 focus:border-red-500' : 'border-gray-300'}`}
              required
            />
            {errors.quantity && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.quantity}
              </p>
            )}
            <p className="text-xs text-gray-500">Nombre d&apos;unités de cette pièce</p>
          </div>

          {/* Commande Selection */}
          <div className="space-y-2">
            <Label htmlFor="commandeId" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Model de Voiture Associé
            </Label>
            {loadingCommandes ? (
              <Card className="border-gray-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600">Chargement des commandes...</span>
                </CardContent>
              </Card>
            ) : commandes.length > 0 ? (
              <>
                <Select
                  value={formData.commandeId || undefined}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setFormData({ ...formData, commandeId: '' })
                    } else {
                      setFormData({ ...formData, commandeId: value })
                    }
                  }}
                >
                  <SelectTrigger className="h-11 border-gray-300">
                    <SelectValue placeholder="Sélectionner une commande (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-500">Aucune commande</span>
                    </SelectItem>
                    {commandes.map((commande) => (
                      <SelectItem key={commande.id} value={commande.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Commande #{commande.id.slice(0, 8)}</span>
                          {commande.voitureModel?.model && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">{commande.voitureModel.model}</span>
                            </>
                          )}
                          {commande.couleur && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500 text-xs">{commande.couleur}</span>
                            </>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCommande && (
                  <Card className="mt-2 bg-blue-50 border-blue-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900">
                          Commande sélectionnée: <span className="font-semibold">#{selectedCommande.id.slice(0, 8)}</span>
                          {selectedCommande.voitureModel?.model && (
                            <span className="text-blue-700"> - {selectedCommande.voitureModel.model}</span>
                          )}
                          {selectedCommande.couleur && (
                            <span className="text-blue-600"> ({selectedCommande.couleur})</span>
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500 text-center">Aucune commande disponible pour ce conteneur</p>
                </CardContent>
              </Card>
            )}
            <p className="text-xs text-gray-500">Lier cette pièce à une commande spécifique (optionnel)</p>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="bg-gray-50 border-t-2 border-gray-200 px-6 py-4 flex items-center justify-between">
          <Button 
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.partCode.trim() || !formData.partName.trim() || !formData.quantity}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Ajouter la Pièce
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddSparePartDialog
