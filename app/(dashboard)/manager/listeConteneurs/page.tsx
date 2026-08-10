import React from 'react'
import { getAllConteneursCharge } from '@/lib/actions/conteneur'
import ListeConteneursClient from './ListeConteneursClient'

export default async function ListeConteneursPage() {
  const conteneursResult = await getAllConteneursCharge()
  
  const conteneurs = conteneursResult.success && Array.isArray(conteneursResult.data) 
    ? conteneursResult.data 
    : []

  return (
    <ListeConteneursClient conteneurs={conteneurs} />
  )
}