'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, ClipboardList } from 'lucide-react'

type NumeroChassisType = {
  id: string
  chassisNumber: string
  motorisation: string
  numeroConteneur: string
  createdAt: Date | string
}

type CommandeType = {
  id: string
  couleur: string | null
  motorisation: string | null
  transmission: string | null
  nbr_portes: string | null
  voitureModel: { model: string } | null
  client: { nom: string } | null
  clientEntreprise: { nom_entreprise: string } | null
}

type VoitureType = {
  id: string
  couleur: string | null
  motorisation: string | null
  transmission: string | null
  nbr_portes: string | null
  voitureModel: { model: string } | null
}

type OrdreMontageType = {
  id: string
  createdAt: Date | string
  numeroChassis: NumeroChassisType
  commande: CommandeType
  voiture: VoitureType
}

type Props = {
  ordreMontages: OrdreMontageType[]
  commandes: CommandeType[]
  voitures: VoitureType[]
}

const MOTORISATION_OPTIONS = ['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE']

const OrdreMontageClient = ({ ordreMontages, commandes, voitures }: Props) => {
  const router = useRouter()
  const [numeroDialogOpen, setNumeroDialogOpen] = React.useState(false)
  const [ordreDialogOpen, setOrdreDialogOpen] = React.useState(false)
  const [isSavingNumero, setIsSavingNumero] = React.useState(false)
  const [isSavingOrdre, setIsSavingOrdre] = React.useState(false)
  const [createdNumeroChassis, setCreatedNumeroChassis] = React.useState<NumeroChassisType | null>(null)
  const [numeroForm, setNumeroForm] = React.useState({
    chassisNumber: '',
    motorisation: 'ESSENCE',
    numeroConteneur: '',
  })
  const [ordreForm, setOrdreForm] = React.useState({
    commandeId: '',
    voitureId: '',
  })

  const formatDateTime = (value: Date | string) =>
    new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))

  const getCommandeLabel = (commande: CommandeType) => {
    const clientName = commande.client?.nom || commande.clientEntreprise?.nom_entreprise || 'Client inconnu'
    const modelName = commande.voitureModel?.model || 'Modèle inconnu'
    return `${modelName} - ${clientName}`
  }

  const getVoitureLabel = (voiture: VoitureType) => {
    const modelName = voiture.voitureModel?.model || 'Modèle inconnu'
    const couleur = voiture.couleur || 'Couleur N/A'
    return `${modelName} - ${couleur}`
  }

  const handleStartCreation = () => {
    setNumeroForm({
      chassisNumber: '',
      motorisation: 'ESSENCE',
      numeroConteneur: '',
    })
    setOrdreForm({
      commandeId: '',
      voitureId: '',
    })
    setCreatedNumeroChassis(null)
    setNumeroDialogOpen(true)
  }

  const handleCreateNumeroChassis = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSavingNumero(true)

    try {
      const response = await fetch('/api/numero-chassis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chassisNumber: numeroForm.chassisNumber.trim(),
          motorisation: numeroForm.motorisation,
          numeroConteneur: numeroForm.numeroConteneur.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Erreur lors de la création du numéro de châssis')
      }

      const data: NumeroChassisType = await response.json()
      toast.success('Numéro de châssis créé avec succès')
      setCreatedNumeroChassis(data)
      setNumeroDialogOpen(false)
      setOrdreDialogOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du numéro de châssis')
    } finally {
      setIsSavingNumero(false)
    }
  }

  const handleCreateOrdreMontage = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!createdNumeroChassis) {
      toast.error('Veuillez créer un numéro de châssis avant')
      return
    }

    setIsSavingOrdre(true)

    try {
      const response = await fetch('/api/ordre-montage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commandeId: ordreForm.commandeId,
          voitureId: ordreForm.voitureId,
          numeroChassisId: createdNumeroChassis.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Erreur lors de la création de l'ordre de montage")
      }

      toast.success("Ordre de montage créé avec succès")
      setOrdreDialogOpen(false)
      setCreatedNumeroChassis(null)
      setNumeroForm({
        chassisNumber: '',
        motorisation: 'ESSENCE',
        numeroConteneur: '',
      })
      setOrdreForm({
        commandeId: '',
        voitureId: '',
      })
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création de l'ordre de montage")
    } finally {
      setIsSavingOrdre(false)
    }
  }

  const handleCancelOrdre = () => {
    setOrdreDialogOpen(false)
    setCreatedNumeroChassis(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-8">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Ordre de Montage</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Créez un numéro de châssis puis enregistrez un ordre de montage
            </p>
          </div>
          <Button onClick={handleStartCreation} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer Ordre de Montage
          </Button>
        </div>

        <Card className="shadow-lg border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Tous les Ordres de Montage</CardTitle>
                  <p className="text-purple-100 text-sm mt-0.5">Liste complète des ordres enregistrés</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-lg font-bold">{ordreMontages.length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {ordreMontages.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aucun ordre de montage enregistré.</div>
            ) : (
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro châssis</TableHead>
                      <TableHead>Motorisation</TableHead>
                      <TableHead>Conteneur</TableHead>
                      <TableHead>Commande</TableHead>
                      <TableHead>Voiture</TableHead>
                      <TableHead>Créé le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordreMontages.map((ordre) => (
                      <TableRow key={ordre.id}>
                        <TableCell className="font-medium">{ordre.numeroChassis?.chassisNumber}</TableCell>
                        <TableCell>{ordre.numeroChassis?.motorisation}</TableCell>
                        <TableCell>{ordre.numeroChassis?.numeroConteneur}</TableCell>
                        <TableCell>{getCommandeLabel(ordre.commande)}</TableCell>
                        <TableCell>{getVoitureLabel(ordre.voiture)}</TableCell>
                        <TableCell>{formatDateTime(ordre.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={numeroDialogOpen} onOpenChange={setNumeroDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un numéro de châssis</DialogTitle>
            <DialogDescription>
              Renseignez le numéro de châssis avant de créer un ordre de montage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNumeroChassis} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chassisNumber">Numéro de châssis</Label>
              <Input
                id="chassisNumber"
                value={numeroForm.chassisNumber}
                onChange={(event) => setNumeroForm({ ...numeroForm, chassisNumber: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motorisation">Motorisation</Label>
              <Select
                value={numeroForm.motorisation}
                onValueChange={(value) => setNumeroForm({ ...numeroForm, motorisation: value })}
              >
                <SelectTrigger id="motorisation">
                  <SelectValue placeholder="Sélectionner une motorisation" />
                </SelectTrigger>
                <SelectContent>
                  {MOTORISATION_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroConteneur">Numéro conteneur</Label>
              <Input
                id="numeroConteneur"
                value={numeroForm.numeroConteneur}
                onChange={(event) => setNumeroForm({ ...numeroForm, numeroConteneur: event.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNumeroDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSavingNumero}>
                {isSavingNumero ? 'Enregistrement...' : 'Continuer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={ordreDialogOpen} onOpenChange={setOrdreDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un ordre de montage</DialogTitle>
            <DialogDescription>
              Associez le numéro de châssis à une commande et une voiture.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrdreMontage} className="space-y-4">
            <div className="space-y-2">
              <Label>Numéro de châssis créé</Label>
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {createdNumeroChassis?.chassisNumber || 'Aucun numéro de châssis sélectionné'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commandeId">Commande</Label>
              <Select
                value={ordreForm.commandeId}
                onValueChange={(value) => setOrdreForm({ ...ordreForm, commandeId: value })}
              >
                <SelectTrigger id="commandeId">
                  <SelectValue placeholder="Sélectionner une commande" />
                </SelectTrigger>
                <SelectContent>
                  {commandes.map((commande) => (
                    <SelectItem key={commande.id} value={commande.id}>
                      {getCommandeLabel(commande)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voitureId">Voiture</Label>
              <Select
                value={ordreForm.voitureId}
                onValueChange={(value) => setOrdreForm({ ...ordreForm, voitureId: value })}
              >
                <SelectTrigger id="voitureId">
                  <SelectValue placeholder="Sélectionner une voiture" />
                </SelectTrigger>
                <SelectContent>
                  {voitures.map((voiture) => (
                    <SelectItem key={voiture.id} value={voiture.id}>
                      {getVoitureLabel(voiture)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancelOrdre}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSavingOrdre || !ordreForm.commandeId || !ordreForm.voitureId}
              >
                {isSavingOrdre ? 'Enregistrement...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrdreMontageClient
