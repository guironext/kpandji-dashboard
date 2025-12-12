'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Truck, 
  Package, 
  Save, 
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr as datePickerFr } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('fr', datePickerFr)

type CommandeType = {
  id: string
  couleur: string | null
  motorisation: string | null
  transmission: string | null
  nbr_portes: string | null
  prix_unitaire: number | null
  date_livraison: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  etapeCommande: string
  commandeFlag: string
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

type Props = {
  commandes: CommandeType[]
  model: string
  conteneursNeeded: number
}

type ConteneurFormData = {
  conteneurNumber: string
  sealNumber: string
  totalPackages: string
  grossWeight: string
  netWeight: string
  stuffingMap: string
  dateEmbarquement: Date | null
  dateArriveProbable: Date | null
}

const ChargerConteneurClient = ({ commandes, model, conteneursNeeded }: Props) => {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [conteneurs, setConteneurs] = useState<ConteneurFormData[]>([])
  
  // Initialize conteneurs array based on conteneursNeeded
  React.useEffect(() => {
    if (conteneursNeeded > 0 && conteneurs.length === 0) {
      const initialConteneurs: ConteneurFormData[] = Array.from({ length: conteneursNeeded }, () => ({
        conteneurNumber: '',
        sealNumber: '',
        totalPackages: '',
        grossWeight: '',
        netWeight: '',
        stuffingMap: '',
        dateEmbarquement: null,
        dateArriveProbable: null,
      }))
      setConteneurs(initialConteneurs)
    }
  }, [conteneursNeeded, conteneurs.length])

  const updateConteneur = (index: number, field: keyof ConteneurFormData, value: string | Date | null) => {
    setConteneurs(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSave = async () => {
    // Validate all conteneurs
    for (let i = 0; i < conteneurs.length; i++) {
      const conteneur = conteneurs[i]
      if (!conteneur.conteneurNumber || !conteneur.sealNumber) {
        toast.error(`Le numéro de conteneur et le numéro de scellé sont requis pour le conteneur ${i + 1}`)
        return
      }
    }

    if (commandes.length === 0) {
      toast.error('Aucune commande sélectionnée')
      return
    }

    setIsSaving(true)

    try {
      // Distribute commandes across conteneurs
      const commandesPerConteneur = Math.ceil(commandes.length / conteneurs.length)
      
      for (let i = 0; i < conteneurs.length; i++) {
        const startIdx = i * commandesPerConteneur
        const endIdx = Math.min(startIdx + commandesPerConteneur, commandes.length)
        const conteneurCommandes = commandes.slice(startIdx, endIdx)
        const commandeIds = conteneurCommandes.map(c => c.id)

        const conteneur = conteneurs[i]
        
        const response = await fetch('/api/conteneur', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conteneurNumber: conteneur.conteneurNumber,
            sealNumber: conteneur.sealNumber,
            totalPackages: conteneur.totalPackages || undefined,
            grossWeight: conteneur.grossWeight || undefined,
            netWeight: conteneur.netWeight || undefined,
            stuffingMap: conteneur.stuffingMap || undefined,
            dateEmbarquement: conteneur.dateEmbarquement ? conteneur.dateEmbarquement.toISOString() : undefined,
            dateArriveProbable: conteneur.dateArriveProbable ? conteneur.dateArriveProbable.toISOString() : undefined,
            commandeIds,
            updateToTransite: true // Flag to update commandes to TRANSITE
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || `Erreur lors de la création du conteneur ${i + 1}`)
        }
      }

      toast.success(`${conteneurs.length} conteneur(s) créé(s) avec succès! ${commandes.length} commande(s) mise(s) en transit`)
      router.push('/manager/tableau-commandes')
    } catch (error) {
      console.error('Error creating conteneurs:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création des conteneurs')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-blue-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Charger Conteneur(s)
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Modèle: {model} • {commandes.length} commande(s) • {conteneursNeeded} conteneur(s) requis
              </p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="shadow-lg border-0 bg-white/90">
          <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5" />
              Résumé
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Modèle</p>
                <p className="text-lg font-bold text-gray-900">{model}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Commandes</p>
                <p className="text-lg font-bold text-green-600">{commandes.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Conteneurs requis</p>
                <p className="text-lg font-bold text-purple-600">{conteneursNeeded}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteneurs Forms */}
        {conteneursNeeded > 0 ? (
          <div className="space-y-6">
            {conteneurs.map((conteneur, index) => (
              <Card key={index} className="shadow-lg border-0 bg-white/90">
                <CardHeader className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Conteneur {index + 1} / {conteneursNeeded}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`conteneurNumber-${index}`}>Numéro de conteneur *</Label>
                      <Input
                        id={`conteneurNumber-${index}`}
                        value={conteneur.conteneurNumber}
                        onChange={(e) => updateConteneur(index, 'conteneurNumber', e.target.value)}
                        placeholder="Ex: CONT-001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sealNumber-${index}`}>Numéro de scellé *</Label>
                      <Input
                        id={`sealNumber-${index}`}
                        value={conteneur.sealNumber}
                        onChange={(e) => updateConteneur(index, 'sealNumber', e.target.value)}
                        placeholder="Ex: SEAL-001"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`totalPackages-${index}`}>Nombre de colis</Label>
                      <Input
                        id={`totalPackages-${index}`}
                        value={conteneur.totalPackages}
                        onChange={(e) => updateConteneur(index, 'totalPackages', e.target.value)}
                        placeholder="Ex: 10"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`grossWeight-${index}`}>Poids brut (kg)</Label>
                      <Input
                        id={`grossWeight-${index}`}
                        value={conteneur.grossWeight}
                        onChange={(e) => updateConteneur(index, 'grossWeight', e.target.value)}
                        placeholder="Ex: 5000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`netWeight-${index}`}>Poids net (kg)</Label>
                      <Input
                        id={`netWeight-${index}`}
                        value={conteneur.netWeight}
                        onChange={(e) => updateConteneur(index, 'netWeight', e.target.value)}
                        placeholder="Ex: 4500"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`stuffingMap-${index}`}>Plan de chargement</Label>
                      <Input
                        id={`stuffingMap-${index}`}
                        value={conteneur.stuffingMap}
                        onChange={(e) => updateConteneur(index, 'stuffingMap', e.target.value)}
                        placeholder="Référence du plan"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Date d&apos;embarquement</Label>
                      <DatePicker
                        selected={conteneur.dateEmbarquement}
                        onChange={(date) => updateConteneur(index, 'dateEmbarquement', date)}
                        locale="fr"
                        dateFormat="dd/MM/yyyy"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        placeholderText="Sélectionner une date"
                      />
                    </div>
                    <div>
                      <Label>Date d&apos;arrivée probable</Label>
                      <DatePicker
                        selected={conteneur.dateArriveProbable}
                        onChange={(date) => updateConteneur(index, 'dateArriveProbable', date)}
                        locale="fr"
                        dateFormat="dd/MM/yyyy"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        placeholderText="Sélectionner une date"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg border-0 bg-white/90">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">Aucun conteneur requis pour ce groupe</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || conteneursNeeded === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Création en cours...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Créer {conteneursNeeded} conteneur(s) et mettre en transit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChargerConteneurClient

