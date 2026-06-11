import React from 'react'
import { getAllCommandesProposition } from '@/lib/actions/commande'
import { getAllClients } from '@/lib/actions/client'
import { getAllClientEntreprises } from '@/lib/actions/client_entreprise'
import { getAllModele } from '@/lib/actions/modele'
import CommandesTabsClient from './CommandesTabsClient'
import type { ComponentProps } from 'react'

type CommandesTabsProps = ComponentProps<typeof CommandesTabsClient>

export default async function CommandesPage() {
  // Fetch all required data
  const [commandesResult, clientsResult, clientsEntrepriseResult, modelesResult] = await Promise.all([
    getAllCommandesProposition(),
    getAllClients(),
    getAllClientEntreprises(),
    getAllModele(),
  ])

  const commandes = (commandesResult.success ? commandesResult.data || [] : []) as unknown as CommandesTabsProps['commandes']
  const clients = (clientsResult.success ? clientsResult.data || [] : []) as unknown as Array<{ id: string; nom: string; telephone: string }>
  const clientsEntreprise = (clientsEntrepriseResult.success ? clientsEntrepriseResult.data || [] : []) as unknown as Array<{ id: string; nom_entreprise: string; telephone: string }>
  const voitureModels = (modelesResult.success ? modelesResult.data || [] : []) as unknown as Array<{ id: string; model: string }>

  return (
    <CommandesTabsClient
      commandes={commandes}
      clients={clients.map(c => ({ id: c.id, nom: c.nom, telephone: c.telephone }))}
      clientsEntreprise={clientsEntreprise.map(c => ({ id: c.id, nom_entreprise: c.nom_entreprise, telephone: c.telephone }))}
      voitureModels={voitureModels.map(m => ({ id: m.id, model: m.model }))}
    />
  )
}
