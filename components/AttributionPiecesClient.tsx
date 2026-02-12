"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package,  Car } from "lucide-react"
import { attributeSparePart } from "@/lib/actions/stock"
import { toast } from "sonner"

type SparePart = {
  id: string
  partCode: string
  partName: string
  partNameFrench: string | null
  verificationName: string | null
  quantity: number
  etapeSparePart: string
  statusVerification: string
  createdAt: string
  updatedAt: string
  voiture: {
    id: string
    couleur: string
    motorisation: string
    transmission: string
    nbr_portes: string
    etatVoiture: string
    createdAt: string
    updatedAt: string
    voitureModel: {
      id: string
      model: string
      image: string | null
      description: string | null
      createdAt: string
      updatedAt: string
    } | null
  } | null
}

type Equipe = {
  id: string
  nomEquipe: string
  mission: string
  chefEquipeId: string
  taches_accomplies: string
  activite: string
  stautsEquipe: string
  createdAt: string
  updatedAt: string
  chefEquipe: {
    id: string
    nom: string
    prenoms: string
  }
  montage: unknown | null
}

type OrdreMontage = {
  id: string
  ordreMontageFlag: string
  createdAt: string
  updatedAt: string
  commandeId: string
  commande: {
    id: string
    couleur: string
    motorisation: string
    nbr_portes: string
    transmission: string
    voitureModel: {
      id: string
      model: string
    } | null
  }
  voitureId: string
  voiture: {
    id: string
    couleur: string
    motorisation: string
    nbr_portes: string
    transmission: string
    voitureModel: {
      id: string
      model: string
    } | null
  }
  numeroChassisId: string
  numeroChassis: {
    id: string
    chassisNumber: string
  }
}

type Attribution = {
  id: string
  createdAt: string
  updatedAt: string
  equipe: {
    id: string
    nomEquipe: string
    chefEquipe: {
      id: string
      nom: string
      prenoms: string
    }
    montage: {
      ordreMontage: OrdreMontage
    } | null
  }
  sparePart: SparePart[]
}

interface AttributionPiecesClientProps {
  spareParts: SparePart[]
  equipes: Equipe[]
  ordreMontages: OrdreMontage[]
  attributions: Attribution[]
}

const 
AttributionPiecesClient = ({ spareParts, equipes, ordreMontages, attributions }: AttributionPiecesClientProps) => {
  const [selectedSparePart, setSelectedSparePart] = useState<SparePart | null>(null)
  const [selectedEquipe, setSelectedEquipe] = useState<string>('')
  const [selectedOrdreMontage, setSelectedOrdreMontage] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleAttribution = async () => {
    if (!selectedSparePart || !selectedEquipe || !selectedOrdreMontage || !quantity) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    const qty = parseInt(quantity)
    if (qty <= 0 || qty > selectedSparePart.quantity) {
      toast.error("Quantité invalide")
      return
    }

    const result = await attributeSparePart({
      sparePartId: selectedSparePart.id,
      equipeId: selectedEquipe,
      ordreMontageId: selectedOrdreMontage,
      quantity: qty
    })

    if (result.success) {
      toast.success("Pièce attribuée avec succès")
      // Reset form
      setSelectedEquipe('')
      setSelectedOrdreMontage('')
      setQuantity('')
      setDialogOpen(false)
      // TODO: Refresh the list or update state
    } else {
      toast.error(result.error || "Erreur lors de l'attribution")
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spareParts.map((sparePart) => (
          <Card key={sparePart.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{sparePart.partName}</span>
                <Badge variant="secondary">{sparePart.partCode}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Package className="h-4 w-4" />
                  <span>Quantité: {sparePart.quantity}</span>
                </div>
                {sparePart.voiture && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Car className="h-4 w-4" />
                    <span>{sparePart.voiture.voitureModel?.model} - {sparePart.voiture.couleur}</span>
                  </div>
                )}
                <Dialog open={dialogOpen && selectedSparePart?.id === sparePart.id} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full mt-4"
                      onClick={() => setSelectedSparePart(sparePart)}
                    >
                      Attribution
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Attribuer {sparePart.partName}</DialogTitle>
                      <DialogDescription>
                        Sélectionnez l&apos;équipe et l&apos;ordre de montage pour attribuer cette pièce.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="equipe">Équipe</Label>
                        <Select value={selectedEquipe} onValueChange={setSelectedEquipe}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une équipe" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipes.map((equipe) => (
                              <SelectItem key={equipe.id} value={equipe.id}>
                                {equipe.nomEquipe} - Chef: {equipe.chefEquipe.nom} {equipe.chefEquipe.prenoms}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ordreMontage">Ordre de Montage</Label>
                        <Select value={selectedOrdreMontage} onValueChange={setSelectedOrdreMontage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un ordre de montage" />
                          </SelectTrigger>
                          <SelectContent>
                            {ordreMontages.map((om) => (
                              <SelectItem key={om.id} value={om.id}>
                                {om.numeroChassis.chassisNumber} - {om.voiture.voitureModel?.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantité à attribuer</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="Quantité"
                          max={sparePart.quantity}
                          min="1"
                        />
                      </div>
                      <Button onClick={handleAttribution} className="w-full">
                        Attribuer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attributions Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Attributions Existantes</h2>
        {attributions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Aucune attribution trouvée
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(
              attributions.reduce((acc, attr) => {
                if (attr.equipe.montage?.ordreMontage) {
                  const ordreId = attr.equipe.montage.ordreMontage.id
                  if (!acc[ordreId]) {
                    acc[ordreId] = {
                      ordreMontage: attr.equipe.montage.ordreMontage,
                      attributions: []
                    }
                  }
                  acc[ordreId].attributions.push(attr)
                }
                return acc
              }, {} as Record<string, { ordreMontage: OrdreMontage; attributions: Attribution[] }>)
            ).map(([ordreId, { ordreMontage, attributions: ordreAttributions }]) => (
              <Card key={ordreId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Ordre de Montage: {ordreMontage.commande.voitureModel?.model || 'N/A'} - {ordreMontage.numeroChassis.chassisNumber}</span>
                    <Badge variant="secondary">{ordreAttributions.length} attribution(s)</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ordreAttributions.map((attr) => (
                      <div key={attr.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Équipe: {attr.equipe.nomEquipe}</p>
                            <p className="text-sm text-gray-600">Chef: {attr.equipe.chefEquipe.nom} {attr.equipe.chefEquipe.prenoms}</p>
                          </div>
                          <Badge variant="outline">{new Date(attr.createdAt).toLocaleDateString()}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Pièces attribuées:</p>
                          <div className="flex flex-wrap gap-1">
                            {attr.sparePart.map((sp) => (
                              <Badge key={sp.id} variant="secondary" className="text-xs">
                                {sp.partName} ({sp.partCode})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AttributionPiecesClient