import React from 'react'
import { getCommandesValides } from '@/lib/actions/commande'
import ChargerConteneurClient from './ChargerConteneurClient'

export const dynamic = 'force-dynamic'

type ChargerConteneurSearchParams = {
  commandeIds?: string
  model?: string
  conteneursNeeded?: string
}

export default async function ChargerConteneurPage({
  searchParams,
}: {
  searchParams: Promise<ChargerConteneurSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const commandeIdsParam = resolvedSearchParams.commandeIds || '[]'
  const model = resolvedSearchParams.model || ''
  const conteneursNeeded = parseInt(resolvedSearchParams.conteneursNeeded || '0', 10)

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

