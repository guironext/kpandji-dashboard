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
  type CommandeWithId = { id: string; [key: string]: unknown };
  const allCommandes = (commandesResult.success ? commandesResult.data || [] : []) as unknown as CommandeWithId[]
  const selectedCommandes = allCommandes.filter(c => commandeIds.includes(c.id))

  return (
    <ChargerConteneurClient
      commandes={selectedCommandes as unknown as Parameters<typeof ChargerConteneurClient>[0]['commandes']}
      model={model}
      conteneursNeeded={conteneursNeeded}
    />
  )
}

