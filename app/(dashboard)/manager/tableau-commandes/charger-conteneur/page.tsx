import React from 'react'
import { getCommandesValides } from '@/lib/actions/commande'
import ChargerConteneurClient from './ChargerConteneurClient'

type SearchParams = {
  commandeIds?: string
  model?: string
  conteneursNeeded?: string
}

export default async function ChargerConteneurPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const commandeIdsParam = searchParams.commandeIds || '[]'
  const model = searchParams.model || ''
  const conteneursNeeded = parseInt(searchParams.conteneursNeeded || '0', 10)

  let commandeIds: string[] = []
  try {
    commandeIds = JSON.parse(commandeIdsParam)
  } catch (error) {
    console.error('Error parsing commandeIds:', error)
  }

  // Fetch the commandes
  const commandesResult = await getCommandesValides()
  const allCommandes = commandesResult.success ? commandesResult.data || [] : []
  const selectedCommandes = allCommandes.filter(c => commandeIds.includes(c.id))

  return (
    <ChargerConteneurClient
      commandes={selectedCommandes}
      model={model}
      conteneursNeeded={conteneursNeeded}
    />
  )
}

