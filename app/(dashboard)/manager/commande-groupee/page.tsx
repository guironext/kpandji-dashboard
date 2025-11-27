import React from 'react'
import { getCommandesVenduesProposition, getCommandesDisponiblesProposition } from '@/lib/actions/commande'
import { getAllClients } from '@/lib/actions/client'
import { getAllClientEntreprises } from '@/lib/actions/client_entreprise'
import { getAllModele } from '@/lib/actions/modele'
import CommandeGroupeePageClient from './CommandeGroupeePageClient'

export default async function CommandeGroupeePage() {
  // Fetch all required data
  const [venduesResult, disponiblesResult, clientsResult, clientsEntrepriseResult, modelesResult] = await Promise.all([
    getCommandesVenduesProposition(),
    getCommandesDisponiblesProposition(),
    getAllClients(),
    getAllClientEntreprises(),
          getAllModele(),
        ])

  const commandesVendues = venduesResult.success ? venduesResult.data || [] : []
  const commandesDisponibles = disponiblesResult.success ? disponiblesResult.data || [] : []
  const clients = clientsResult.success ? clientsResult.data || [] : []
  const clientsEntreprise = clientsEntrepriseResult.success ? clientsEntrepriseResult.data || [] : []
  const voitureModels = modelesResult.success ? modelesResult.data || [] : []

  return (
    <CommandeGroupeePageClient
      commandesVendues={commandesVendues}
      commandesDisponibles={commandesDisponibles}
      clients={clients.map(c => ({ id: c.id, nom: c.nom, telephone: c.telephone }))}
      clientsEntreprise={clientsEntreprise.map(c => ({ id: c.id, nom_entreprise: c.nom_entreprise, telephone: c.telephone }))}
      voitureModels={voitureModels.map(m => ({ id: m.id, model: m.model }))}
    />
  )
}
