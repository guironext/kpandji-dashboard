import React from 'react'
import { getAllConteneursForCourrier, getCommandesForCourrier } from '@/lib/actions/courrier'
import NouveauCourrierClient from './NouveauCourrierClient'

export default async function NouveauCourrierPage() {
  const conteneursResult = await getAllConteneursForCourrier()
  const commandesResult = await getCommandesForCourrier()
  
  const conteneurs = conteneursResult.success && Array.isArray(conteneursResult.data) 
    ? conteneursResult.data 
    : []
  
  const commandes = commandesResult.success && Array.isArray(commandesResult.data) 
    ? commandesResult.data 
    : []

  return (
    <NouveauCourrierClient 
      conteneurs={conteneurs} 
      commandes={commandes}
    />
  )
}

