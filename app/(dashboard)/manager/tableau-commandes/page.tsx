import React from 'react'
import { getCommandesValides } from '@/lib/actions/commande'
import TableauCommandesClient from './TableauCommandesClient'

export default async function TableauCommandesPage() {
  // Fetch all commandes with etapeCommande === "VALIDE"
  const commandesResult = await getCommandesValides()
  
  const commandes = commandesResult.success ? commandesResult.data || [] : []

  return (
    <TableauCommandesClient commandes={commandes} />
  )
}
