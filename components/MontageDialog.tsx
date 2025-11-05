"use client";

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Settings, Loader2 } from 'lucide-react'

interface Commande {
  id: string;
  nbr_portes: string;
  transmission: string;
  motorisation: string;
  couleur: string;
  client: {
    nom: string;
  };
  voitureModel?: {
    model: string;
  } | null;
}

interface MontageDialogProps {
  onMontageCreated: () => void;
}

export const MontageDialog: React.FC<MontageDialogProps> = ({ onMontageCreated }) => {
  const [open, setOpen] = useState(false)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [selectedCommande, setSelectedCommande] = useState('')
  const [noChassis, setNoChassis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCommandes, setIsLoadingCommandes] = useState(false)

  useEffect(() => {
    if (open) {
      fetchCommandes()
    }
  }, [open])

  const fetchCommandes = async () => {
    setIsLoadingCommandes(true)
    try {
      const response = await fetch('/api/commandes?etape=VERIFIER')
      const data = await response.json()
      setCommandes(data)
    } catch (error) {
      console.error('Error fetching commandes:', error)
    } finally {
      setIsLoadingCommandes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCommande || !noChassis.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/montage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commandeId: selectedCommande,
          no_chassis: noChassis.trim(),
        }),
      })

      if (response.ok) {
        setOpen(false)
        setSelectedCommande('')
        setNoChassis('')
        onMontageCreated()
      } else {
        console.error('Failed to create montage')
      }
    } catch (error) {
      console.error('Error creating montage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <Settings className="h-4 w-4" />
          Ordre Montage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un Ordre de Montage</DialogTitle>
          <DialogDescription>
            Sélectionnez une commande vérifiée et saisissez le numéro de chassis.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="commande">Commande</Label>
            <Select value={selectedCommande} onValueChange={setSelectedCommande} disabled={isLoadingCommandes}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCommandes ? "Chargement..." : "Sélectionner une commande"} />
              </SelectTrigger>
              <SelectContent>
                {commandes.map((commande) => (
                  <SelectItem key={commande.id} value={commande.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{commande.client.nom}</span>
                      <span className="text-sm text-muted-foreground">
                        {commande.voitureModel?.model || 'N/A'} - {commande.nbr_portes} portes - {commande.couleur}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="noChassis">Numéro de Chassis</Label>
            <Input
              id="noChassis"
              value={noChassis}
              onChange={(e) => setNoChassis(e.target.value)}
              placeholder="Saisir le numéro de chassis"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedCommande || !noChassis.trim() || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
