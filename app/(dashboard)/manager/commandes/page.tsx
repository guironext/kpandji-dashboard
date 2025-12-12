import React from 'react'
import { getAllCommandesProposition } from '@/lib/actions/commande'
import { getAllClients } from '@/lib/actions/client'
import { getAllClientEntreprises } from '@/lib/actions/client_entreprise'
import { getAllModele } from '@/lib/actions/modele'
import CommandesPageClient from './CommandesPageClient'

export default async function CommandesPage() {
  // Fetch all required data
  const [commandesResult, clientsResult, clientsEntrepriseResult, modelesResult] = await Promise.all([
    getAllCommandesProposition(),
    getAllClients(),
    getAllClientEntreprises(),
    getAllModele(),
  ])

  const commandes = commandesResult.success ? commandesResult.data || [] : []
  const clients = clientsResult.success ? clientsResult.data || [] : []
  const clientsEntreprise = clientsEntrepriseResult.success ? clientsEntrepriseResult.data || [] : []
  const voitureModels = modelesResult.success ? modelesResult.data || [] : []

  return (
    <CommandesPageClient
      commandes={commandes}
      clients={clients.map(c => ({ id: c.id, nom: c.nom, telephone: c.telephone }))}
      clientsEntreprise={clientsEntreprise.map(c => ({ id: c.id, nom_entreprise: c.nom_entreprise, telephone: c.telephone }))}
      voitureModels={voitureModels.map(m => ({ id: m.id, model: m.model }))}
    />
  )
}
