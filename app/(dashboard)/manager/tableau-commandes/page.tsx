import React from 'react'
import { getCommandesValides } from '@/lib/actions/commande'
import TableauCommandesClient from './TableauCommandesClient'

export default async function TableauCommandesPage() {
  // Fetch all commandes with etapeCommande === "VALIDE"
  let commandesResult
  let error: string | null = null
  
  try {
    commandesResult = await getCommandesValides()
    
    if (!commandesResult.success) {
      error = (commandesResult as { error?: string }).error || 'Erreur lors du chargement des commandes'
    }
  } catch (err) {
    console.error('Error in TableauCommandesPage:', err)
    const errorMessage = err instanceof Error ? err.message : String(err)
    
    // Check for connection errors - comprehensive check
    const errorString = errorMessage.toLowerCase()
    const isConnectionError = 
      errorMessage.includes('connection') || 
      errorMessage.includes('connexion') || 
      errorMessage.includes('Closed') ||
      errorMessage.includes('closed') ||
      errorMessage.includes('reset') ||
      errorMessage.includes('Reset') ||
      errorMessage.includes('P1001') ||
      errorString.includes('kind: closed') ||
      errorString.includes('kind: connectionreset') ||
      errorString.includes('connectionreset') ||
      errorString.includes('connection closed') ||
      errorString.includes('postgresql connection')
    
    if (isConnectionError) {
      error = 'Erreur de connexion à la base de données. La connexion a été fermée. Veuillez réessayer.'
    } else {
      error = 'Une erreur inattendue s\'est produite lors du chargement des données.'
    }
  }
  
  const commandes = commandesResult?.success ? commandesResult.data || [] : []
  type CommandeProp = React.ComponentProps<typeof TableauCommandesClient>['commandes']
  const commandesTyped: CommandeProp = commandes as unknown as CommandeProp

  return (
    <TableauCommandesClient 
      commandes={commandesTyped} 
      error={error}
      isLoading={false}
    />
  )
}
