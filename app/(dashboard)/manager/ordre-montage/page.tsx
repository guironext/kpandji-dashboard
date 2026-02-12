'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Settings, Car, Package, CheckCircle, Clock, Search } from 'lucide-react'
import { toast } from 'sonner'

type NumeroChassis = {
  id: string
  chassisNumber: string
  motorisation: string
  numeroConteneur: string
  chassisFlag: string
  createdAt: string
  ordreMontages: Array<{
    id: string
    ordreMontageFlag: string
    voiture: {
      voitureModel: {
        model: string
      }
    }
    commande: {
      client: {
        nom: string
      } | null
      clientEntreprise: {
        nom_entreprise: string
      } | null
    }
  }>
}

type Commande = {
  id: string
  couleur: string | null
  motorisation: string | null
  transmission: string | null
  nbr_portes: string | null
  prix_unitaire: number | null
  etapeCommande: string
  voitureModel: {
    model: string
  } | null
  client: {
    nom: string
  } | null
  clientEntreprise: {
    nom_entreprise: string
  } | null
}

const MOTORISATIONS = ['ELECTRIQUE', 'ESSENCE', 'DIESEL', 'HYBRIDE'] as const

const OrdreMontagePage = () => {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [chassisNumber, setChassisNumber] = React.useState('')
  const [motorisation, setMotorisation] = React.useState('')
  const [numeroConteneur, setNumeroConteneur] = React.useState('')
  const [numeroChassisList, setNumeroChassisList] = React.useState<NumeroChassis[]>([])
  const [fieldErrors, setFieldErrors] = React.useState<{
    chassisNumber: string
    motorisation: string
    numeroConteneur: string
  }>({
    chassisNumber: '',
    motorisation: '',
    numeroConteneur: ''
  })

  // Ordre de Montage dialog state
  const [ordreMontageOpen, setOrdreMontageOpen] = React.useState(false)
  const [isOrdreMontageSubmitting, setIsOrdreMontageSubmitting] = React.useState(false)
  const [selectedChassis, setSelectedChassis] = React.useState('')
  const [selectedCommande, setSelectedCommande] = React.useState('')
  const [commandes, setCommandes] = React.useState<Commande[]>([])
  const [isLoadingCommandes, setIsLoadingCommandes] = React.useState(false)
  const [isLoadingChassis, setIsLoadingChassis] = React.useState(true)
  const [ordreMontageErrors, setOrdreMontageErrors] = React.useState<{
    chassis: string
    commande: string
  }>({
    chassis: '',
    commande: ''
  })

  // Search state
  const [searchTerm, setSearchTerm] = React.useState('')

  const fetchNumeroChassis = React.useCallback(async () => {
    setIsLoadingChassis(true)
    try {
      const response = await fetch('/api/numero-chassis', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Erreur lors du chargement')
      }
      const data = await response.json()
      setNumeroChassisList(data)
    } catch (error) {
      console.error('Error fetching numero chassis:', error)
      toast.error('Erreur lors du chargement des numéros de châssis')
    } finally {
      setIsLoadingChassis(false)
    }
  }, [])

  const fetchCommandesVerifier = React.useCallback(async () => {
    setIsLoadingCommandes(true)
    try {
      const response = await fetch('/api/commandes?etape=VERIFIER', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des commandes')
      }
      const data = await response.json()
      setCommandes(data)
    } catch (error) {
      console.error('Error fetching commandes:', error)
      toast.error('Erreur lors du chargement des commandes')
    } finally {
      setIsLoadingCommandes(false)
    }
  }, [])

  const handleCreateMontage = async (ordreMontageId: string) => {
    try {
      const response = await fetch('/api/montage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ordreMontageId }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création du montage')
      }

      toast.success('Montage créé avec succès')
      fetchNumeroChassis()
    } catch (error) {
      console.error('Error creating montage:', error)
      toast.error('Erreur lors de la création du montage')
    }
  }

  // Form validation helpers
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'chassisNumber':
        if (!value.trim()) return 'Le numéro de châssis est requis'
        return ''
      case 'motorisation':
        if (!value) return 'La motorisation est requise'
        return ''
      case 'numeroConteneur':
        if (!value.trim()) return 'Le numéro de conteneur est requis'
        return ''
      default:
        return ''
    }
  }

  const hasUnsavedChanges = chassisNumber.trim() || motorisation || numeroConteneur.trim()
  const hasOrdreMontageUnsavedChanges = selectedChassis || selectedCommande

  const resetForm = () => {
    setChassisNumber('')
    setMotorisation('')
    setNumeroConteneur('')
    setFieldErrors({
      chassisNumber: '',
      motorisation: '',
      numeroConteneur: ''
    })
  }

  const resetOrdreMontageForm = () => {
    setSelectedChassis('')
    setSelectedCommande('')
    setOrdreMontageErrors({
      chassis: '',
      commande: ''
    })
  }

  React.useEffect(() => {
    fetchNumeroChassis()
  }, [fetchNumeroChassis])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N to open dialog
      if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !open) {
        event.preventDefault()
        setOpen(true)
      }

      // Escape to close dialog
      if (event.key === 'Escape' && open && !isSubmitting) {
        if (!hasUnsavedChanges || window.confirm(
          "Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer cette fenêtre ?"
        )) {
          setOpen(false)
          resetForm()
        }
      }

      // Enter to submit form (when dialog is open and focused)
      if (event.key === 'Enter' && open && !isSubmitting &&
          motorisation && chassisNumber.trim() && numeroConteneur.trim()) {
        event.preventDefault()
        const form = document.querySelector('form') as HTMLFormElement
        if (form) form.requestSubmit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, isSubmitting, hasUnsavedChanges, motorisation, chassisNumber, numeroConteneur])

  React.useEffect(() => {
    if (ordreMontageOpen) {
      fetchCommandesVerifier()
    }
  }, [ordreMontageOpen, fetchCommandesVerifier])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Validate all fields
    const errors = {
      chassisNumber: validateField('chassisNumber', chassisNumber),
      motorisation: validateField('motorisation', motorisation),
      numeroConteneur: validateField('numeroConteneur', numeroConteneur)
    }

    setFieldErrors(errors)

    // Check if there are any errors
    if (Object.values(errors).some(error => error)) {
      toast.error('Veuillez corriger les erreurs dans le formulaire')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/numero-chassis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chassisNumber: chassisNumber.trim(),
          motorisation,
          numeroConteneur: numeroConteneur.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      toast.success('Numéro de châssis créé avec succès', {
        description: `Le châssis ${chassisNumber} a été ajouté au système.`,
        duration: 4000,
      })

      setOpen(false)
      resetForm()
      await fetchNumeroChassis()
    } catch (error) {
      console.error('Error creating numero chassis:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création'
      toast.error(errorMessage, {
        description: 'Veuillez réessayer ou contacter le support si le problème persiste.',
        duration: 5000,
      })

      // Set field error if it's a duplicate chassis number
      if (errorMessage.includes('châssis') && errorMessage.includes('existe')) {
        setFieldErrors(prev => ({
          ...prev,
          chassisNumber: 'Ce numéro de châssis existe déjà'
        }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrdreMontageSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Validate selections
    const errors = {
      chassis: selectedChassis ? '' : 'Veuillez sélectionner un numéro de châssis',
      commande: selectedCommande ? '' : 'Veuillez sélectionner une commande'
    }

    setOrdreMontageErrors(errors)

    // Check if there are any errors
    if (Object.values(errors).some(error => error)) {
      toast.error('Veuillez corriger les erreurs dans le formulaire')
      return
    }

    setIsOrdreMontageSubmitting(true)
    try {
      const response = await fetch('/api/ordre-montage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandeId: selectedCommande,
          numeroChassisId: selectedChassis,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      toast.success('Ordre de montage créé avec succès', {
        description: `Le châssis et la commande ont été associés avec succès.`,
        duration: 4000,
      })

      setOrdreMontageOpen(false)
      resetOrdreMontageForm()
      await fetchNumeroChassis() // Refresh to show updated chassis status
    } catch (error) {
      console.error('Error creating ordre montage:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création'
      toast.error(errorMessage, {
        description: 'Veuillez réessayer ou contacter le support si le problème persiste.',
        duration: 5000,
      })

      // Set field error if it's a specific error
      if (errorMessage.includes('voiture') && errorMessage.includes('associée')) {
        setOrdreMontageErrors(prev => ({
          ...prev,
          commande: 'Aucune voiture associée à cette commande'
        }))
      }
    } finally {
      setIsOrdreMontageSubmitting(false)
    }
  }

  const disponibleChassis = numeroChassisList.filter(
    (item) => item.chassisFlag === 'DISPONIBLE'
  )

  const filteredOccupiedChassis = numeroChassisList
    .filter(chassis => chassis.chassisFlag === 'OCCUPE')
    .filter(chassis => {
      const ordreMontage = chassis.ordreMontages[0]
      return ordreMontage?.ordreMontageFlag === 'CREER'
    })
    .filter(chassis => {
      if (!searchTerm) return true
      const ordreMontage = chassis.ordreMontages[0]
      const clientName = ordreMontage?.commande?.client?.nom ||
                        ordreMontage?.commande?.clientEntreprise?.nom_entreprise || ''
      const voitureModel = ordreMontage?.voiture?.voitureModel?.model || ''

      return chassis.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
             clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             voitureModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
             chassis.motorisation.toLowerCase().includes(searchTerm.toLowerCase())
    })

  const totalChassis = numeroChassisList.length
  const disponibleCount = disponibleChassis.length
  const occupeCount = numeroChassisList.filter(chassis => chassis.chassisFlag === 'OCCUPE').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Gestion des Ordres de Montage
              </h1>
              <p className="text-gray-600 mt-2">Associez les châssis disponibles aux commandes vérifiées</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 p-3 rounded-xl">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">{totalChassis}</div>
                  <div className="text-sm text-blue-700">Total Châssis</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/60 border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900">{disponibleCount}</div>
                  <div className="text-sm text-green-700">Disponibles</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100/60 border border-purple-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="bg-purple-500 p-3 rounded-xl">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900">{occupeCount}</div>
                  <div className="text-sm text-purple-700">En Montage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-0 pb-6">
              <CardTitle className="text-white text-xl">Ordre de Montage</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Dialog open={ordreMontageOpen} onOpenChange={(newOpen) => {
                // Prevent closing if form has unsaved changes and is not submitting
                if (!newOpen && hasOrdreMontageUnsavedChanges && !isOrdreMontageSubmitting) {
                  const confirmClose = window.confirm(
                    "Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer cette fenêtre ?"
                  );
                  if (!confirmClose) return;
                }
                setOrdreMontageOpen(newOpen);
                if (!newOpen) {
                  // Reset form when closing
                  resetOrdreMontageForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group focus:ring-4 focus:ring-indigo-500/30 focus:outline-none">
                    <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors duration-200">
                      <Settings className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Créer Ordre de Montage</span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[650px] p-0 gap-0 border-0 shadow-2xl max-h-[90vh] overflow-hidden">
                  {/* Enhanced Header */}
                  <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white rounded-t-lg relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 right-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/15 rounded-full blur-lg"></div>
                    </div>

                    <DialogHeader className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-lg">
                            <Settings className="h-7 w-7" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-bold text-white leading-tight">
                              Créer un Ordre de Montage
                            </DialogTitle>
                            <DialogDescription className="text-indigo-100 mt-1 text-base">
                              Associez un numéro de châssis disponible à une commande vérifiée
                            </DialogDescription>
                          </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-indigo-100">Étape 1/1</span>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>

                  {/* Form Content with Enhanced Layout */}
                  <div className="p-6 bg-white overflow-y-auto max-h-[calc(90vh-200px)]">
                    <form onSubmit={handleOrdreMontageSubmit} className="space-y-7">
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out" style={{width: '100%'}}></div>
                      </div>

                      {/* Chassis Selection - Enhanced */}
                      <div className="space-y-3 group">
                        <Label htmlFor="chassis" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full transition-colors group-focus-within:bg-indigo-600"></div>
                          Numéro de châssis disponible <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={selectedChassis}
                          onValueChange={(value) => {
                            setSelectedChassis(value);
                            setOrdreMontageErrors(prev => ({...prev, chassis: ''}));
                          }}
                          disabled={isLoadingCommandes}
                        >
                          <SelectTrigger
                            id="chassis"
                            className={`h-12 border-2 transition-all duration-200 ${
                              ordreMontageErrors.chassis
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                            } ${isLoadingCommandes ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <SelectValue placeholder={
                              isLoadingCommandes
                                ? "Chargement des châssis disponibles..."
                                : disponibleChassis.length === 0
                                  ? "Aucun châssis disponible"
                                  : "Sélectionner un numéro de châssis"
                            } />
                          </SelectTrigger>
                          <SelectContent className="border-2 border-gray-200 shadow-xl max-h-[200px]">
                            {disponibleChassis.length > 0 ? (
                              disponibleChassis.map((chassis) => (
                                <SelectItem
                                  key={chassis.id}
                                  value={chassis.id}
                                  className="hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer py-3 px-4 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                                      <span className="text-white font-bold text-xs">
                                        {chassis.chassisNumber.split('-')[2]}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-900 truncate">
                                        {chassis.chassisNumber}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-gray-600">
                                        <div>
                                          <span className="font-medium">Motorisation:</span> {chassis.motorisation}
                                        </div>
                                        <div>
                                          <span className="font-medium">Conteneur:</span> {chassis.numeroConteneur}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="py-6 text-center text-gray-500">
                                <div className="text-2xl mb-2">📦</div>
                                <p className="font-medium">Aucun châssis disponible</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Tous les châssis sont actuellement occupés
                                </p>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {ordreMontageErrors.chassis && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <span className="text-red-500">⚠</span> {ordreMontageErrors.chassis}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 ml-4 flex items-center gap-1">
                          <span className="text-indigo-500">💡</span> Seuls les châssis avec le statut &quot;DISPONIBLE&quot; sont affichés
                        </p>
                      </div>

                      {/* Commande Selection - Enhanced */}
                      <div className="space-y-3 group">
                        <Label htmlFor="commande" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full transition-colors group-focus-within:bg-indigo-600"></div>
                          Commande vérifiée <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={selectedCommande}
                          onValueChange={(value) => {
                            setSelectedCommande(value);
                            setOrdreMontageErrors(prev => ({...prev, commande: ''}));
                          }}
                          disabled={isLoadingCommandes}
                        >
                          <SelectTrigger
                            id="commande"
                            className={`h-12 border-2 transition-all duration-200 ${
                              ordreMontageErrors.commande
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                            } ${isLoadingCommandes ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <SelectValue placeholder={
                              isLoadingCommandes
                                ? "Chargement des commandes..."
                                : commandes.length === 0
                                  ? "Aucune commande vérifiée"
                                  : "Sélectionner une commande"
                            } />
                          </SelectTrigger>
                          <SelectContent className="border-2 border-gray-200 shadow-xl max-h-[200px]">
                            {commandes.length > 0 ? (
                              commandes.map((commande) => (
                                <SelectItem
                                  key={commande.id}
                                  value={commande.id}
                                  className="hover:bg-indigo-50 focus:bg-indigo-50 cursor-pointer py-3 px-4 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                      <span className="text-white font-bold text-xs">
                                        {commande.etapeCommande === 'VERIFIER' ? '✓' : '?'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-gray-900 truncate">
                                        {commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'Client inconnu'}
                                      </div>
                                      <div className="grid grid-cols-1 gap-1 mt-1 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">Modèle:</span>
                                          <span>{commande.voitureModel?.model || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">Spécifications:</span>
                                          <span>{commande.nbr_portes} portes - {commande.couleur}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="py-6 text-center text-gray-500">
                                <div className="text-2xl mb-2">📋</div>
                                <p className="font-medium">Aucune commande vérifiée</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Les commandes doivent être vérifiées avant le montage
                                </p>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {ordreMontageErrors.commande && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <span className="text-red-500">⚠</span> {ordreMontageErrors.commande}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 ml-4 flex items-center gap-1">
                          <span className="text-indigo-500">💡</span> Seules les commandes avec l&apos;étape &quot;VERIFIER&quot; sont affichées
                        </p>
                      </div>

                      {/* Selection Summary */}
                      {selectedChassis && selectedCommande && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="font-semibold text-indigo-900">Sélection confirmée</span>
                          </div>
                          <div className="text-sm text-indigo-700 space-y-1">
                            <div>Châssis: <span className="font-medium">
                              {disponibleChassis.find(c => c.id === selectedChassis)?.chassisNumber}
                            </span></div>
                            <div>Commande: <span className="font-medium">
                              {commandes.find(c => c.id === selectedCommande)?.client?.nom ||
                               commandes.find(c => c.id === selectedCommande)?.clientEntreprise?.nom_entreprise ||
                               'Client inconnu'}
                            </span></div>
                          </div>
                        </div>
                      )}

                      {/* Form Actions - Enhanced */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <div className="flex gap-3 w-full sm:w-auto">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (hasOrdreMontageUnsavedChanges && !isOrdreMontageSubmitting) {
                                const confirmClose = window.confirm(
                                  "Vous avez des modifications non enregistrées. Voulez-vous vraiment annuler ?"
                                );
                                if (!confirmClose) return;
                              }
                              setOrdreMontageOpen(false);
                              resetOrdreMontageForm();
                            }}
                            className="flex-1 sm:flex-none px-6 py-3 h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-gray-500/20"
                            disabled={isOrdreMontageSubmitting}
                          >
                            <span className="font-medium">Annuler</span>
                          </Button>

                          <Button
                            type="submit"
                            disabled={isOrdreMontageSubmitting || !selectedChassis || !selectedCommande}
                            className="flex-1 sm:flex-none px-8 py-3 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:ring-4 focus:ring-indigo-500/30 focus:outline-none"
                          >
                            {isOrdreMontageSubmitting ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="font-medium">Association en cours...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Settings className="h-5 w-5" />
                                <span className="font-medium">Créer l&apos;Ordre de Montage</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0 pb-6">
              <CardTitle className="text-white text-xl">Numéro de Châssis</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Dialog open={open} onOpenChange={(newOpen) => {
                // Prevent closing if form has unsaved changes and is not submitting
                if (!newOpen && hasUnsavedChanges && !isSubmitting) {
                  const confirmClose = window.confirm(
                    "Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer cette fenêtre ?"
                  );
                  if (!confirmClose) return;
                }
                setOpen(newOpen);
                if (!newOpen) {
                  // Reset form when closing
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group focus:ring-4 focus:ring-emerald-500/30 focus:outline-none">
                    <div className="bg-white/20 p-1.5 rounded-full group-hover:bg-white/30 transition-colors duration-200">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Créer Numéro Chassis</span>
                    <kbd className="hidden sm:inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-xs font-mono">
                      <span>⌘</span><span>N</span>
                    </kbd>
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[600px] p-0 gap-0 border-0 shadow-2xl max-h-[90vh] overflow-hidden">
                  {/* Enhanced Header */}
                  <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-6 text-white rounded-t-lg relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 right-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                      <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/15 rounded-full blur-lg"></div>
                    </div>

                    <DialogHeader className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-lg">
                            <Plus className="h-7 w-7" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-bold text-white leading-tight">
                              Créer un numéro de châssis
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100 mt-1 text-base">
                              Ajoutez un nouveau numéro de châssis au système d&apos;inventaire
                            </DialogDescription>
                          </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-emerald-100">Étape 1/1</span>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>

                  {/* Form Content with Enhanced Layout */}
                  <div className="p-6 bg-white overflow-y-auto max-h-[calc(90vh-200px)]">
                    <form onSubmit={handleSubmit} className="space-y-7">
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out" style={{width: '100%'}}></div>
                      </div>

                      {/* Chassis Number Field - Enhanced */}
                      <div className="space-y-3 group">
                        <Label htmlFor="chassisNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full transition-colors group-focus-within:bg-emerald-600"></div>
                          Numéro de châssis <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="chassisNumber"
                            value={chassisNumber}
                            onChange={(e) => {
                              setChassisNumber(e.target.value.toUpperCase());
                              setFieldErrors(prev => ({...prev, chassisNumber: ''}));
                            }}
                            placeholder="Entrez le numéro de châssis"
                            className={`h-12 pl-4 pr-10 border-2 transition-all duration-200 ${
                              fieldErrors.chassisNumber
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                            }`}
                            required
                            autoFocus
                          />
                          {chassisNumber && (
                            <button
                              type="button"
                              onClick={() => setChassisNumber('')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        {fieldErrors.chassisNumber && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <span className="text-red-500">⚠</span> {fieldErrors.chassisNumber}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 ml-4 flex items-center gap-1">
                          <span className="text-emerald-500">💡</span> Entrez un numéro de châssis unique
                        </p>
                      </div>

                      {/* Motorisation Field - Enhanced */}
                      <div className="space-y-3 group">
                        <Label htmlFor="motorisation" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full transition-colors group-focus-within:bg-emerald-600"></div>
                          Motorisation <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={motorisation}
                          onValueChange={(value) => {
                            setMotorisation(value);
                            setFieldErrors(prev => ({...prev, motorisation: ''}));
                          }}
                        >
                          <SelectTrigger
                            id="motorisation"
                            className={`h-12 border-2 transition-all duration-200 ${
                              fieldErrors.motorisation
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                            }`}
                          >
                            <SelectValue placeholder="Sélectionnez une motorisation" />
                          </SelectTrigger>
                          <SelectContent className="border-2 border-gray-200 shadow-xl">
                            {MOTORISATIONS.map((value) => (
                              <SelectItem
                                key={value}
                                value={value}
                                className="hover:bg-emerald-50 focus:bg-emerald-50 cursor-pointer py-3 px-4 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm"></div>
                                  <div>
                                    <span className="font-semibold text-gray-900">{value}</span>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {value === 'ELECTRIQUE' && 'Écologique et silencieux'}
                                      {value === 'ESSENCE' && 'Performant et polyvalent'}
                                      {value === 'DIESEL' && 'Économique et endurant'}
                                      {value === 'HYBRIDE' && 'Écologique et efficient'}
                                    </p>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.motorisation && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <span className="text-red-500">⚠</span> {fieldErrors.motorisation}
                          </p>
                        )}
                      </div>

                      {/* Container Number Field - Enhanced */}
                      <div className="space-y-3 group">
                        <Label htmlFor="numeroConteneur" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full transition-colors group-focus-within:bg-emerald-600"></div>
                          Numéro de conteneur <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="numeroConteneur"
                            value={numeroConteneur}
                            onChange={(e) => {
                              setNumeroConteneur(e.target.value.toUpperCase());
                              setFieldErrors(prev => ({...prev, numeroConteneur: ''}));
                            }}
                            placeholder="Entrez le numéro de conteneur"
                            className={`h-12 pl-4 pr-10 border-2 transition-all duration-200 ${
                              fieldErrors.numeroConteneur
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                            }`}
                            required
                          />
                          {numeroConteneur && (
                            <button
                              type="button"
                              onClick={() => setNumeroConteneur('')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        {fieldErrors.numeroConteneur && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <span className="text-red-500">⚠</span> {fieldErrors.numeroConteneur}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 ml-4 flex items-center gap-1">
                          <span className="text-emerald-500">💡</span> Entrez un numéro de conteneur unique
                        </p>
                      </div>

                      {/* Form Actions - Enhanced */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-gray-100">
                        <div className="flex gap-3 w-full sm:w-auto">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (hasUnsavedChanges && !isSubmitting) {
                                const confirmClose = window.confirm(
                                  "Vous avez des modifications non enregistrées. Voulez-vous vraiment annuler ?"
                                );
                                if (!confirmClose) return;
                              }
                              setOpen(false);
                              resetForm();
                            }}
                            className="flex-1 sm:flex-none px-6 py-3 h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-gray-500/20"
                            disabled={isSubmitting}
                          >
                            <span className="font-medium">Annuler</span>
                            <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                              Esc
                            </kbd>
                          </Button>

                          <Button
                            type="submit"
                            disabled={isSubmitting || !motorisation || !chassisNumber.trim() || !numeroConteneur.trim()}
                            className="flex-1 sm:flex-none px-8 py-3 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:ring-4 focus:ring-emerald-500/30 focus:outline-none"
                          >
                            {isSubmitting ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="font-medium">Création en cours...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Plus className="h-5 w-5" />
                                <span className="font-medium">Créer le châssis</span>
                                <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                  ↵ Enter
                                </kbd>
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div className="text-lg font-semibold text-emerald-800">
                    Châssis Disponibles ({disponibleChassis.length})
                  </div>
                </div>
                {disponibleChassis.length > 0 ? (
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {disponibleChassis.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white/90 border border-emerald-200 rounded-xl p-4 hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                                {item.chassisNumber}
                              </div>
                              <div className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                                LIBRE
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600 font-medium">Motorisation:</span>
                                <span className="text-emerald-800">{item.motorisation}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600 font-medium">Conteneur:</span>
                                <span className="text-emerald-800">{item.numeroConteneur}</span>
                              </div>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Settings className="h-5 w-5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
                    <p className="text-sm text-emerald-700/70 font-medium">
                      Aucun numéro de châssis disponible
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Créez de nouveaux châssis pour commencer
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Numéros de Châssis </CardTitle>
                  <p className="text-purple-100 text-sm mt-0.5">Ordres de montage</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-purple-600" />
                  <div className="text-lg font-semibold text-purple-800">
                    Ordres de Montage à Dispatcher ({filteredOccupiedChassis.length})
                  </div>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                  <Input
                    placeholder="Rechercher par châssis, client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>
              <div className="max-h-[500px] overflow-auto space-y-4">
                {isLoadingChassis ? (
                  // Skeleton loader
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="bg-gradient-to-br from-purple-50 to-purple-100/60 border-2 border-purple-200/60 p-6 rounded-2xl animate-pulse">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="bg-purple-200 h-8 w-24 rounded-xl"></div>
                            <div className="bg-purple-200 h-6 w-20 rounded-full"></div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-white/60 rounded-lg p-3">
                              <div className="bg-purple-200 h-4 w-20 mb-2 rounded"></div>
                              <div className="bg-purple-200 h-4 w-16 rounded"></div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                              <div className="bg-purple-200 h-4 w-16 mb-2 rounded"></div>
                              <div className="bg-purple-200 h-4 w-24 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredOccupiedChassis.length > 0 ? (
                  filteredOccupiedChassis.map((chassis) => {
                      // Get the first ordre montage (should typically be only one)
                      const ordreMontage = chassis.ordreMontages[0]
                      const voitureModel = ordreMontage?.voiture?.voitureModel?.model || 'N/A'
                      const clientName = ordreMontage?.commande?.client?.nom ||
                                       ordreMontage?.commande?.clientEntreprise?.nom_entreprise ||
                                       'Client inconnu'

                      return (
                        <div
                          key={chassis.id}
                          className="bg-gradient-to-br from-purple-50 to-purple-100/60 border-2 border-purple-200/60 p-6 rounded-2xl hover:shadow-lg hover:border-purple-300 transition-all duration-300 group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                                  {chassis.chassisNumber}
                                </div>
                                <div className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Just créé
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="bg-white/60 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-600 font-medium">Motorisation:</span>
                                    <span className="text-purple-800 font-semibold">{chassis.motorisation}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-purple-600 font-medium">Conteneur:</span>
                                    <span className="text-purple-800">{chassis.numeroConteneur}</span>
                                  </div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-purple-600 font-medium">Modèle:</span>
                                    <span className="text-purple-800 font-semibold">{voitureModel}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-purple-600 font-medium">Client:</span>
                                    <span className="text-purple-800">{clientName}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4 opacity-100 transition-all duration-300 transform group-hover:scale-105">
                              <Button
                                onClick={() => handleCreateMontage(ordreMontage.id)}
                                size="sm"
                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 rounded-full px-4 py-2 text-xs font-medium"
                              >
                                <Car className="h-3 w-3 mr-1" />
                                Dispatch
                              </Button>
                            </div>
                            
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="text-center py-12">
                    <Car className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-purple-700/70">
                      Aucun châssis en montage
                    </p>
                    <p className="text-sm text-purple-600 mt-2">
                      Les châssis assignés aux commandes apparaîtront ici
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default OrdreMontagePage