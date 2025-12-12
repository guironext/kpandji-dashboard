import React from 'react'
import { getConteneursTransite } from '@/lib/actions/conteneur'
import { getCommandesTransites } from '@/lib/actions/commande'
import ConteneurTransitClient from './ConteneurTransitClient'

/**
 * Page displaying all containers with etapeConteneur === "TRANSITE"
 * Fetches containers filtered by TRANSITE status and their associated transit orders
 */
export default async function ConteneurTransitPage() {
  // Fetch containers with etapeConteneur === "TRANSITE"
  const [conteneursResult, commandesResult] = await Promise.all([
    getConteneursTransite(), // Filters by etapeConteneur: "TRANSITE"
    getCommandesTransites()
  ])
  
  const conteneurs = conteneursResult.success && Array.isArray(conteneursResult.data) 
    ? conteneursResult.data 
    : []
  
  const commandes = commandesResult.success && Array.isArray(commandesResult.data)
    ? commandesResult.data
    : []

  return (
    <ConteneurTransitClient conteneurs={conteneurs} commandes={commandes} />
  )
}