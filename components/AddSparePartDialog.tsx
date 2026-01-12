"use client";

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addSparePartToSubcase, getCommandesWithModelsForSubcase } from '@/lib/actions/subcase'
import { Package, Loader2, Hash, FileText, Globe, ShoppingCart, X, CheckCircle2, AlertCircle, Sparkles, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { translateToFrench } from '@/lib/utils'

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
  const [isTranslating, setIsTranslating] = useState(false)
  const [isManualFrenchEdit, setIsManualFrenchEdit] = useState(true)

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
      setIsManualFrenchEdit(true)
    }
  }, [open, subcaseId, fetchCommandes])

  // Auto-translate partName to French when partName changes
  useEffect(() => {
    // Only auto-translate if:
    // 1. partName has content
    // 2. User hasn't manually edited the French field
    // 3. French field is empty or matches a previous translation
    if (formData.partName.trim() && !isManualFrenchEdit && open) {
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
  }, [formData.partName, isManualFrenchEdit, open])

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
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Enhanced Header */}
        <DialogHeader className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white px-6 py-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-xl border border-white/30">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-white mb-1.5 flex items-center gap-2">
                Ajouter une Pièce de Rechange
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              </DialogTitle>
              <DialogDescription className="text-purple-100 text-sm flex items-center gap-2">
                <Badge variant="outline" className="bg-white/10 border-white/30 text-white font-medium">
                  Sub Case: {subcaseNumber}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content with Sections */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-600" />
                Informations de Base
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
            </div>

            {/* Part Code */}
            <div className="space-y-2">
              <Label htmlFor="partCode" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <Hash className="w-3.5 h-3.5 text-purple-600" />
                </div>
                Code de la Pièce <span className="text-red-500 font-bold">*</span>
              </Label>
              <Input
                id="partCode"
                value={formData.partCode}
                onChange={(e) => {
                  setFormData({ ...formData, partCode: e.target.value })
                  if (errors.partCode) setErrors({ ...errors, partCode: '' })
                }}
                placeholder="Ex: PR-001, ABC123, XYZ-2024"
                className={`h-12 text-base transition-all duration-200 ${
                  errors.partCode 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200 hover:border-gray-400'
                }`}
                required
              />
              {errors.partCode ? (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{errors.partCode}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 ml-1">Identifiant unique de la pièce de rechange</p>
              )}
            </div>

            {/* Part Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="partName" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Nom de la Pièce (Anglais) <span className="text-red-500 font-bold">*</span>
              </Label>
              <Input
                id="partName"
                value={formData.partName}
                onChange={(e) => {
                  setFormData({ ...formData, partName: e.target.value })
                  if (errors.partName) setErrors({ ...errors, partName: '' })
                }}
                placeholder="Ex: Brake Pad, Engine Oil Filter, Spark Plug"
                className={`h-12 text-base transition-all duration-200 ${
                  errors.partName 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-gray-400'
                }`}
                required
              />
              {errors.partName ? (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{errors.partName}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 ml-1">Nom de la pièce en anglais</p>
              )}
            </div>

            {/* Part Name (French) */}
            <div className="space-y-2">
              <Label htmlFor="partNameFrench" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-md">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                Nom de la Pièce (Français)
                {isTranslating && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 ml-1" />
                )}
              </Label>
              <div className="relative">
                <Input
                  id="partNameFrench"
                  value={formData.partNameFrench}
                  onChange={(e) => {
                    setIsManualFrenchEdit(true)
                    setFormData({ ...formData, partNameFrench: e.target.value })
                  }}
                  onFocus={() => setIsManualFrenchEdit(true)}
                  placeholder="Ex: Plaquette de frein, Filtre à huile moteur, Bougie d'allumage"
                  className="h-12 text-base border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 hover:border-gray-400 transition-all duration-200 pr-10"
                />
                {isTranslating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>
              <div className={`flex items-start gap-2 p-2 rounded-md ${
                isManualFrenchEdit 
                  ? 'bg-amber-50 border border-amber-200' 
                  : 'bg-indigo-50 border border-indigo-200'
              }`}>
                <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isManualFrenchEdit ? 'text-amber-600' : 'text-indigo-600'
                }`} />
                <p className={`text-xs ${
                  isManualFrenchEdit ? 'text-amber-700' : 'text-indigo-700'
                }`}>
                  {isManualFrenchEdit 
                    ? "Traduction automatique désactivée (modification manuelle)" 
                    : "Traduit automatiquement depuis l'anglais (optionnel)"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Section 2: Quantity & Association */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-green-600" />
                Quantité & Association
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-md">
                  <ShoppingCart className="w-3.5 h-3.5 text-green-600" />
                </div>
                Quantité <span className="text-red-500 font-bold">*</span>
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
                className={`h-12 text-base transition-all duration-200 ${
                  errors.quantity 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-200 hover:border-gray-400'
                }`}
                required
              />
              {errors.quantity ? (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{errors.quantity}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 ml-1">Nombre d&apos;unités de cette pièce</p>
              )}
            </div>

            {/* Commande Selection */}
            <div className="space-y-2">
              <Label htmlFor="commandeId" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                </div>
                Modèle de Voiture Associé
              </Label>
              {loadingCommandes ? (
                <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardContent className="p-5 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Chargement des commandes...</span>
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
                    <SelectTrigger className="h-12 text-base border-gray-300 hover:border-purple-400 focus:border-purple-500 transition-all duration-200">
                      <SelectValue placeholder="Sélectionner une commande (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-gray-500 italic">Aucune commande</span>
                      </SelectItem>
                      {commandes.map((commande) => (
                        <SelectItem key={commande.id} value={commande.id}>
                          <div className="flex items-center gap-2 py-1">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              #{commande.id.slice(0, 8)}
                            </Badge>
                            {commande.voitureModel?.model && (
                              <span className="font-medium text-gray-700">{commande.voitureModel.model}</span>
                            )}
                            {commande.couleur && (
                              <Badge variant="secondary" className="text-xs">
                                {commande.couleur}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCommande && (
                    <Card className="mt-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                              Commande sélectionnée
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                                #{selectedCommande.id.slice(0, 8)}
                              </Badge>
                              {selectedCommande.voitureModel?.model && (
                                <span className="text-sm text-blue-800 font-medium">
                                  {selectedCommande.voitureModel.model}
                                </span>
                              )}
                              {selectedCommande.couleur && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  {selectedCommande.couleur}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
                  <CardContent className="p-5 text-center">
                    <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Aucune commande disponible pour ce conteneur</p>
                  </CardContent>
                </Card>
              )}
              <p className="text-xs text-gray-500 ml-1">Lier cette pièce à une commande spécifique (optionnel)</p>
            </div>
          </div>
        </form>

        {/* Enhanced Footer */}
        <DialogFooter className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
          <Button 
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-medium px-6 h-11 transition-all duration-200"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.partCode.trim() || !formData.partName.trim() || !formData.quantity}
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-8 h-11 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
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
