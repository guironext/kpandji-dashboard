'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Package } from 'lucide-react'
import CommandesPageClient from './CommandesPageClient'
import LettreCommandePage from '@/app/(dashboard)/responsablecommercial/lettre-commande/page'

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
  clients: Array<{ id: string; nom: string; telephone: string | null }>
  clientsEntreprise: Array<{ id: string; nom_entreprise: string; telephone: string | null }>
  voitureModels: Array<{ id: string; model: string }>
}

const CommandesTabsClient = ({
  commandes,
  clients,
  clientsEntreprise,
  voitureModels,
}: Props) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-[1600px] mx-auto space-y-6 p-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Commandes</h2>
          <p className="mt-1 text-slate-500">
            Gérez les commandes fournisseur et les lettres de commande
          </p>
        </div>

        <Tabs defaultValue="lettres" className="space-y-6">
          <TabsList className="grid h-auto w-full max-w-md grid-cols-2 gap-1 bg-white p-1 shadow-sm">
            <TabsTrigger
              value="lettres"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-black"
            >
              <FileText className="h-4 w-4" />
              Lettres de commande
            </TabsTrigger>
            <TabsTrigger
              value="commandes"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              Commandes fournisseur
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lettres" className="mt-0">
            <LettreCommandePage embedded managerMode />
          </TabsContent>

          <TabsContent value="commandes" className="mt-0">
            <CommandesPageClient
              commandes={commandes}
              clients={clients}
              clientsEntreprise={clientsEntreprise}
              voitureModels={voitureModels}
              embedded
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default CommandesTabsClient
