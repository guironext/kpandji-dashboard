"use client";

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSparePart, updateSparePart } from '@/lib/actions/subcase'
import { Package, Save, Loader2, Globe, CheckCircle2, AlertCircle, Hash, FileText, ShoppingCart, Info, X, Sparkles, RotateCcw, Languages, Zap, Edit2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { translateToFrench } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'

interface SparePart {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  verificationName: string | null;
  quantity: number;
  etapeSparePart: string;
  createdAt: Date;
}

interface EditSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparePart?: SparePart | null;
  subcaseId?: string;
  onSuccess?: () => void;
}

const EditSparePartDialog: React.FC<EditSparePartDialogProps> = ({
  open,
  onOpenChange,
  sparePart,
  subcaseId,
  onSuccess
}) => {
  const isEditMode = !!sparePart
  const [formData, setFormData] = useState({
    partCode: '',
    partName: '',
    partNameFrench: '',
    quantity: '',
    verificationName: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isManualFrenchEdit, setIsManualFrenchEdit] = useState(false)
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true) // New state for auto-translate toggle
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isTranslationUpdate = useRef(false)

  // Reset form when dialog opens or when sparePart changes
  useEffect(() => {
    if (open) {
      if (sparePart) {
        // Edit mode: populate form with existing data
        isTranslationUpdate.current = true
        setIsManualFrenchEdit(false)
        const hasFrenchTranslation = !!sparePart.partNameFrench
        
        setFormData({
          partCode: sparePart.partCode,
          partName: sparePart.partName,
          partNameFrench: sparePart.partNameFrench || '',
          quantity: sparePart.quantity.toString(),
          verificationName: sparePart.verificationName || `${sparePart.partCode}${sparePart.partName}`
        })
        
        // If no French translation exists, translate immediately
        if (!hasFrenchTranslation && sparePart.partName.trim()) {
          setTimeout(async () => {
            setIsTranslating(true)
            isTranslationUpdate.current = true
            try {
              const translated = await translateToFrench(sparePart.partName.trim())
              if (translated && translated !== sparePart.partName) {
                setFormData(prev => ({ ...prev, partNameFrench: translated }))
                toast.success('Traduction automatique effectuée', {
                  icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
                  duration: 2000,
                })
              }
            } catch (error) {
              console.error('Translation error:', error)
              toast.error('Erreur lors de la traduction automatique', {
                icon: <AlertCircle className="w-4 h-4 text-red-600" />,
                duration: 3000,
              })
            } finally {
              setIsTranslating(false)
              setTimeout(() => {
                isTranslationUpdate.current = false
              }, 300)
            }
          }, 100) // Faster initial translation
        } else {
          setTimeout(() => {
            isTranslationUpdate.current = false
          }, 100)
        }
      } else {
        // Create mode: reset form
        setFormData({
          partCode: '',
          partName: '',
          partNameFrench: '',
          quantity: '',
          verificationName: ''
        })
        setIsManualFrenchEdit(false)
        isTranslationUpdate.current = false
      }
      setAutoTranslateEnabled(true) // Reset to enabled when dialog opens
      setErrors({})
    }
  }, [open, sparePart])

  // Auto-translate partName to French immediately when partName changes
  useEffect(() => {
    // Auto-translate if:
    // 1. partName has content
    // 2. User hasn't manually edited the French field
    // 3. Auto-translate is enabled
    // 4. Dialog is open
    if (formData.partName.trim() && !isManualFrenchEdit && autoTranslateEnabled && open) {
      const translatePartName = async () => {
        setIsTranslating(true)
        // Set flag BEFORE translation to prevent onChange from setting manual edit
        isTranslationUpdate.current = true
        try {
          const translated = await translateToFrench(formData.partName.trim())
          if (translated && translated !== formData.partName) {
            // Keep flag set while updating formData
            setFormData(prev => ({ ...prev, partNameFrench: translated }))
            // Show success feedback
            toast.success('Traduction automatique effectuée', {
              icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
              duration: 2000,
            })
          }
        } catch (error) {
          console.error('Translation error:', error)
          toast.error('Erreur lors de la traduction automatique', {
            icon: <AlertCircle className="w-4 h-4 text-red-600" />,
            duration: 3000,
          })
        } finally {
          setIsTranslating(false)
          // Reset flag after a delay to ensure all state updates complete
          setTimeout(() => {
            isTranslationUpdate.current = false
          }, 300)
        }
      }

      // Faster translation with minimal debounce (100ms instead of 200ms)
      const timeoutId = setTimeout(translatePartName, 100)
      return () => clearTimeout(timeoutId)
    } else if (!formData.partName.trim() && open) {
      // Clear French field if English field is empty
      setFormData(prev => ({ ...prev, partNameFrench: '' }))
    }
  }, [formData.partName, isManualFrenchEdit, autoTranslateEnabled, open])

  // Auto-translate when auto-translate is re-enabled
  useEffect(() => {
    if (autoTranslateEnabled && !isManualFrenchEdit && formData.partName.trim() && open && !isTranslating) {
      const translateOnEnable = async () => {
        // Only translate if French field is empty or different from what would be translated
        if (!formData.partNameFrench.trim() || formData.partNameFrench === formData.partName) {
          setIsTranslating(true)
          isTranslationUpdate.current = true
          try {
            const translated = await translateToFrench(formData.partName.trim())
            if (translated && translated !== formData.partName) {
              setFormData(prev => ({ ...prev, partNameFrench: translated }))
            }
          } catch (error) {
            console.error('Translation error:', error)
          } finally {
            setIsTranslating(false)
            setTimeout(() => {
              isTranslationUpdate.current = false
            }, 300)
          }
        }
      }
      // Small delay to avoid race conditions
      const timeoutId = setTimeout(translateOnEnable, 150)
      return () => clearTimeout(timeoutId)
    }
  }, [autoTranslateEnabled, isManualFrenchEdit, formData.partName, formData.partNameFrench, isTranslating, open])

  // Auto-update verificationName to be partCode + partName
  useEffect(() => {
    if (open) {
      const verificationName = `${formData.partCode.trim()}${formData.partName.trim()}`
      setFormData(prev => {
        // Only update if it's different to avoid unnecessary re-renders
        if (prev.verificationName !== verificationName) {
          return { ...prev, verificationName }
        }
        return prev
      })
    }
  }, [formData.partCode, formData.partName, open])

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

    setIsSubmitting(true)
    try {
      let result
      
      if (isEditMode && sparePart) {
        // Update existing spare part
        result = await updateSparePart(sparePart.id, {
          partCode: formData.partCode.trim(),
          partName: formData.partName.trim(),
          partNameFrench: formData.partNameFrench.trim() || undefined,
          verificationName: formData.verificationName.trim() || undefined,
          quantity: parseInt(formData.quantity),
          statusVerification: 'MODIFIE'
        })
      } else {
        // Create new spare part
        result = await createSparePart({
          partCode: formData.partCode.trim(),
          partName: formData.partName.trim(),
          partNameFrench: formData.partNameFrench.trim() || undefined,
          verificationName: formData.verificationName.trim() || undefined,
          quantity: parseInt(formData.quantity),
          subcaseId: subcaseId,
        })
      }
      
      if (result.success) {
        toast.success(
          isEditMode 
            ? 'Pièce de rechange modifiée avec succès!' 
            : 'Pièce de rechange enregistrée avec succès!',
          {
            icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
          }
        )
        // Reset form
        setFormData({
          partCode: '',
          partName: '',
          partNameFrench: '',
          quantity: '',
          verificationName: ''
        })
        setErrors({})
        setIsManualFrenchEdit(false)
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast.error(result.error || `Erreur lors de l'${isEditMode ? 'édition' : 'enregistrement'}`, {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        })
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} spare part:`, error)
      toast.error(`Erreur lors de l'${isEditMode ? 'édition' : 'enregistrement'}`, {
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset flags when closing
      isTranslationUpdate.current = false
      setIsManualFrenchEdit(false)
      setFormData({
        partCode: '',
        partName: '',
        partNameFrench: '',
        quantity: '',
        verificationName: ''
      })
      setErrors({})
      onOpenChange(false)
    }
  }

  const handleSaveClick = () => {
    // Create a synthetic event for handleSubmit
    const syntheticEvent = {
      preventDefault: () => {}
    } as React.FormEvent
    handleSubmit(syntheticEvent)
  }

  // Custom Switch Component for Auto-Translate
  const Switch = ({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`
          relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 
          focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked 
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/50' 
            : 'bg-gray-300 dark:bg-gray-600'
          }
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-7' : 'translate-x-0.5'}
          `}
        />
        {checked && (
          <Zap className="absolute left-1.5 h-3.5 w-3.5 text-indigo-600 animate-pulse" />
        )}
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[96vh] overflow-hidden flex flex-col p-0 gap-0 shadow-2xl">
        {/* Enhanced Header with Better Visual Design */}
        <DialogHeader className={`px-8 py-6 relative overflow-hidden ${
          isEditMode 
            ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600' 
            : 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600'
        } text-white`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
          <div className="relative flex items-center gap-5">
            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 transform hover:scale-105 transition-transform duration-200">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                {isEditMode ? 'Modifier la Pièce de Rechange' : 'Enregistrer une Pièce de Rechange'}
                {!isEditMode && <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />}
              </DialogTitle>
              <DialogDescription className="text-purple-100 text-base">
                {isEditMode 
                  ? 'Modifier les informations de cette pièce de rechange'
                  : 'Remplissez le formulaire pour enregistrer une nouvelle pièce de rechange'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Auto-Translate Toggle Card - Prominent Placement */}
        <Card className="mx-6 mt-6 mb-4 border-2 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2.5 rounded-xl transition-all duration-200 ${
                  autoTranslateEnabled 
                    ? 'bg-gradient-to-br from-indigo-100 to-purple-100' 
                    : 'bg-gray-100'
                }`}>
                  <Languages className={`w-5 h-5 transition-colors duration-200 ${
                    autoTranslateEnabled ? 'text-indigo-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 text-base">
                      Traduction Automatique
                    </h4>
                    {isTranslating && (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {autoTranslateEnabled 
                      ? 'La traduction française sera générée automatiquement depuis l\'anglais'
                      : 'Mode manuel activé - Saisissez la traduction manuellement'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium transition-colors duration-200 ${
                  autoTranslateEnabled ? 'text-gray-500' : 'text-gray-900'
                }`}>
                  Manuel
                </span>
                <Switch 
                  checked={autoTranslateEnabled}
                  onCheckedChange={(checked) => {
                    setAutoTranslateEnabled(checked)
                    setIsManualFrenchEdit(false)
                    // If enabling, translate immediately
                    if (checked && formData.partName.trim()) {
                      setIsTranslating(true)
                      isTranslationUpdate.current = true
                      translateToFrench(formData.partName.trim())
                        .then(translated => {
                          if (translated && translated !== formData.partName) {
                            setFormData(prev => ({ ...prev, partNameFrench: translated }))
                            toast.success('Traduction automatique activée et effectuée', {
                              icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
                              duration: 2000,
                            })
                          }
                        })
                        .catch(error => {
                          console.error('Translation error:', error)
                          toast.error('Erreur lors de la traduction automatique', {
                            icon: <AlertCircle className="w-4 h-4 text-red-600" />,
                            duration: 3000,
                          })
                        })
                        .finally(() => {
                          setIsTranslating(false)
                          setTimeout(() => {
                            isTranslationUpdate.current = false
                          }, 300)
                        })
                    } else if (!checked) {
                      toast.info('Mode manuel activé - Vous pouvez modifier le champ français', {
                        icon: <Pencil className="w-4 h-4 text-amber-600" />,
                        duration: 2000,
                      })
                    }
                  }}
                  disabled={isTranslating}
                />
                <span className={`text-sm font-medium transition-colors duration-200 ${
                  autoTranslateEnabled ? 'text-indigo-600 font-semibold' : 'text-gray-500'
                }`}>
                  Auto
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Content with Enhanced Sections */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
          {/* Section 1: Basic Information */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
                <Info className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider">
                  Informations de Base
                </h3>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
            </div>

            {/* Part Code */}
            <div className="space-y-2.5">
              <Label htmlFor="partCode" className="text-sm font-semibold text-gray-800 flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 rounded-lg shadow-sm">
                  <Hash className="w-4 h-4 text-purple-600" />
                </div>
                <span>Code de la Pièce</span>
                <span className="text-red-500 font-bold text-base">*</span>
              </Label>
              <Input
                id="partCode"
                value={formData.partCode}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, partCode: e.target.value }))
                  if (errors.partCode) setErrors({ ...errors, partCode: '' })
                }}
                placeholder="Ex: PR-001, ABC123, XYZ-2024"
                className={`h-12 text-base transition-all duration-200 shadow-sm ${
                  errors.partCode 
                    ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
                    : 'border-2 border-gray-300 focus:border-purple-500 focus:ring-purple-200 hover:border-purple-400 bg-white'
                }`}
                required
              />
              {errors.partCode ? (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{errors.partCode}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Identifiant unique de la pièce de rechange
                </p>
              )}
            </div>

            {/* Part Name (English) */}
            <div className="space-y-2.5">
              <Label htmlFor="partName" className="text-sm font-semibold text-gray-800 flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span>Nom de la Pièce (Anglais)</span>
                <span className="text-red-500 font-bold text-base">*</span>
              </Label>
              <Input
                id="partName"
                value={formData.partName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, partName: e.target.value }))
                  if (errors.partName) setErrors({ ...errors, partName: '' })
                }}
                placeholder="Ex: Brake Pad, Engine Oil Filter, Spark Plug"
                className={`h-12 text-base transition-all duration-200 shadow-sm ${
                  errors.partName 
                    ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
                    : 'border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-blue-400 bg-white'
                }`}
                required
              />
              {errors.partName ? (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{errors.partName}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Nom de la pièce en anglais
                </p>
              )}
            </div>

            {/* Part Name (French) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="partNameFrench" className="text-sm font-semibold text-gray-800 flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg shadow-sm transition-all duration-200 ${
                    autoTranslateEnabled && !isManualFrenchEdit
                      ? 'bg-gradient-to-br from-indigo-100 to-purple-100'
                      : isManualFrenchEdit
                      ? 'bg-amber-100'
                      : 'bg-indigo-100'
                  }`}>
                    <Globe className={`w-4 h-4 transition-colors duration-200 ${
                      autoTranslateEnabled && !isManualFrenchEdit
                        ? 'text-indigo-600'
                        : isManualFrenchEdit
                        ? 'text-amber-600'
                        : 'text-indigo-500'
                    }`} />
                  </div>
                  <span>Nom de la Pièce (Français)</span>
                  {isTranslating && (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600 ml-1" />
                  )}
                </Label>
                {/* Manual Edit Button */}
                {autoTranslateEnabled && !isManualFrenchEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsManualFrenchEdit(true)
                      toast.info('Mode édition manuelle activé - Vous pouvez maintenant modifier le champ français', {
                        icon: <Pencil className="w-4 h-4 text-indigo-600" />,
                        duration: 3000,
                      })
                    }}
                    className="h-8 px-3 text-xs font-medium border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-200"
                    title="Activer l'édition manuelle"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Modifier manuellement
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="partNameFrench"
                  value={formData.partNameFrench}
                  onChange={(e) => {
                    const newValue = e.target.value
                    if (!isTranslationUpdate.current) {
                      setIsManualFrenchEdit(true)
                    }
                    setFormData(prev => ({ ...prev, partNameFrench: newValue }))
                  }}
                  placeholder="Ex: Plaquette de frein, Filtre à huile moteur, Bougie d'allumage"
                  className={`h-12 text-base border-2 transition-all duration-200 shadow-sm ${
                    isManualFrenchEdit
                      ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-200 hover:border-amber-400 bg-amber-50/30 pr-12'
                      : autoTranslateEnabled && !isManualFrenchEdit
                      ? 'border-indigo-300 focus:border-indigo-500 focus:ring-indigo-200 hover:border-indigo-400 bg-indigo-50/30 pr-12'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 hover:border-gray-400 bg-white pr-12'
                  }`}
                />
                {isTranslating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  </div>
                )}
                {!isTranslating && isManualFrenchEdit && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2" title="Mode édition manuelle">
                    <Pencil className="w-5 h-5 text-amber-600" />
                  </div>
                )}
                {!isTranslating && !isManualFrenchEdit && autoTranslateEnabled && formData.partNameFrench && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2" title="Traduit automatiquement">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              <div className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                !autoTranslateEnabled || isManualFrenchEdit
                  ? 'bg-amber-50 border-amber-200 shadow-sm' 
                  : 'bg-indigo-50 border-indigo-200 shadow-sm'
              }`}>
                <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  !autoTranslateEnabled || isManualFrenchEdit ? 'text-amber-600' : 'text-indigo-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-xs font-medium ${
                    !autoTranslateEnabled || isManualFrenchEdit ? 'text-amber-800' : 'text-indigo-800'
                  }`}>
                    {!autoTranslateEnabled
                      ? "Traduction automatique désactivée - Mode manuel activé"
                      : isManualFrenchEdit
                      ? "✓ Mode édition manuelle activé - Vous pouvez modifier librement le champ français" 
                      : isTranslating
                      ? "⏳ Traduction en cours..."
                      : formData.partNameFrench
                      ? "✓ Traduit automatiquement depuis l'anglais - La traduction se met à jour automatiquement quand vous modifiez le champ anglais"
                      : "⏳ En attente de traduction - Saisissez le nom en anglais pour traduire automatiquement"}
                  </p>
                  {isManualFrenchEdit && (
                    <div className="flex items-center gap-2 mt-2.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setAutoTranslateEnabled(true)
                          setIsManualFrenchEdit(false)
                          setIsTranslating(true)
                          isTranslationUpdate.current = true
                          try {
                            const translated = await translateToFrench(formData.partName.trim())
                            if (translated && translated !== formData.partName) {
                              setFormData(prev => ({ ...prev, partNameFrench: translated }))
                            }
                            toast.success('Traduction automatique réactivée', {
                              icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
                            })
                          } catch (error) {
                            console.error('Translation error:', error)
                            toast.error('Erreur lors de la traduction')
                          } finally {
                            setIsTranslating(false)
                            setTimeout(() => {
                              isTranslationUpdate.current = false
                            }, 300)
                          }
                        }}
                        className="h-8 text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 border border-amber-200"
                        disabled={!formData.partName.trim() || isTranslating}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Réactiver la traduction automatique
                      </Button>
                      <span className="text-xs text-amber-600 font-medium">
                        ou tapez directement dans le champ ci-dessus
                      </span>
                    </div>
                  )}
                  {!autoTranslateEnabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        setAutoTranslateEnabled(true)
                        setIsManualFrenchEdit(false)
                        setIsTranslating(true)
                        isTranslationUpdate.current = true
                        try {
                          const translated = await translateToFrench(formData.partName.trim())
                          if (translated && translated !== formData.partName) {
                            setFormData(prev => ({ ...prev, partNameFrench: translated }))
                          }
                        } catch (error) {
                          console.error('Translation error:', error)
                        } finally {
                          setIsTranslating(false)
                          setTimeout(() => {
                            isTranslationUpdate.current = false
                          }, 300)
                        }
                      }}
                      className="mt-2.5 h-8 text-xs font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100 border border-amber-200"
                      disabled={!formData.partName.trim() || isTranslating}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Réactiver la traduction automatique
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {/* Verification Name */}
            <div className="space-y-2.5">
              <Label htmlFor="verificationName" className="text-sm font-semibold text-gray-800 flex items-center gap-2.5">
                <div className="p-2 bg-green-100 rounded-lg shadow-sm">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <span>Nom de la vérification</span>
              </Label>
              <Input
                id="verificationName"
                value={formData.verificationName}
                readOnly
                placeholder="Généré automatiquement"
                className={`h-12 text-base transition-all duration-200 shadow-sm bg-gray-50 border-2 border-gray-300 text-gray-700 cursor-not-allowed ${
                  errors.verificationName 
                    ? 'border-red-400 bg-red-50/50' 
                    : ''
                }`}
              />
              {errors.verificationName ? (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{errors.verificationName}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Généré automatiquement à partir du code et du nom de la pièce
                </p>
              )}
            </div>
          </div>

          <Separator className="my-7 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Section 2: Quantity */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-200">
                <ShoppingCart className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider">
                  Quantité
                </h3>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
            </div>
            

            {/* Quantity */}
            <div className="space-y-2.5">
              <Label htmlFor="quantity" className="text-sm font-semibold text-gray-800 flex items-center gap-2.5">
                <div className="p-2 bg-green-100 rounded-lg shadow-sm">
                  <ShoppingCart className="w-4 h-4 text-green-600" />
                </div>
                <span>Quantité</span>
                <span className="text-red-500 font-bold text-base">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10000"
                value={formData.quantity}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, quantity: e.target.value }))
                  if (errors.quantity) setErrors({ ...errors, quantity: '' })
                }}
                placeholder="Ex: 1, 2, 10, 50"
                className={`h-12 text-base transition-all duration-200 shadow-sm ${
                  errors.quantity 
                    ? 'border-2 border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
                    : 'border-2 border-gray-300 focus:border-green-500 focus:ring-green-200 hover:border-green-400 bg-white'
                }`}
                required
              />
              {errors.quantity ? (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border-2 border-red-200 rounded-lg shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium">{errors.quantity}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Nombre d&apos;unités de cette pièce
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Enhanced Footer */}
        <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t-2 border-gray-200 px-8 py-5 flex items-center justify-between gap-4 shadow-lg">
          <Button 
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold px-8 h-12 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <X className="w-5 h-5 mr-2" />
            Annuler
          </Button>
          <Button 
            type="button"
            onClick={handleSaveClick}
            disabled={isSubmitting || !formData.partCode.trim() || !formData.partName.trim() || !formData.quantity}
            className={`font-bold shadow-lg hover:shadow-xl transition-all duration-300 px-10 h-12 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg text-base ${
              isEditMode
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isEditMode ? 'Mise à jour...' : 'Enregistrement...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditSparePartDialog
