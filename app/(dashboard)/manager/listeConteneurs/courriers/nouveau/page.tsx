import React from 'react'
import { getAllConteneursForCourrier, getCommandesForCourrier } from '@/lib/actions/courrier'
import NouveauCourrierClient from './NouveauCourrierClient'

export default async function NouveauCourrierPage() {
  const conteneursResult = await getAllConteneursForCourrier()
  const commandesResult = await getCommandesForCourrier()
  
  const conteneurs = (conteneursResult.success && Array.isArray(conteneursResult.data) 
    ? conteneursResult.data 
    : []) as unknown as Parameters<typeof NouveauCourrierClient>[0]['conteneurs']
  
  const commandes = (commandesResult.success && Array.isArray(commandesResult.data) 
    ? commandesResult.data 
    : []) as unknown as Parameters<typeof NouveauCourrierClient>[0]['commandes']

  return (
    <NouveauCourrierClient 
      conteneurs={conteneurs} 
      commandes={commandes}
    />
  )
}

