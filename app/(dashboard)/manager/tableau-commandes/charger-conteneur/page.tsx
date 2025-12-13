import React from 'react'
import { getCommandesValides } from '@/lib/actions/commande'
import ChargerConteneurClient from './ChargerConteneurClient'

type SearchParams = {
  commandeIds?: string
  model?: string
  conteneursNeeded?: string
}

interface Props {
  readonly searchParams: Promise<SearchParams>
}

export default async function ChargerConteneurPage({
  searchParams,
}: Props) {
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

