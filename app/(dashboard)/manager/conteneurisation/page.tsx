import React from 'react'
import { getValideCommandesGroupees } from '@/lib/actions/conteneurisation'
import ConteneurisationClient from './ConteneurisationClient'

export default async function ConteneurisationPage() {
  const result = await getValideCommandesGroupees()
  const commandesGroupees = result.success ? result.data || [] : []

  return (
    <ConteneurisationClient commandesGroupees={commandesGroupees} />
  )
}