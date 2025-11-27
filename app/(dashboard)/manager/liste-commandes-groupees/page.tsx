import React from 'react'
import { prisma } from '@/lib/prisma'
import ListeCommandesGroupeesClient from './ListeCommandesGroupeesClient'

export default async function ListeCommandesGroupeesPage() {
  // Fetch all commandeGroupee from database, ordered by date_validation (most recent first)
  const commandesGroupees = await prisma.commandeGroupee.findMany({
    include: {
      commandes: {
        include: {
          voitureModel: true,
          client: true,
          clientEntreprise: true
        }
      }
    },
    orderBy: {
      date_validation: 'desc'
    }
  })

  // Serialize dates to strings and Decimal to numbers for client component
  const serializedCommandesGroupees = commandesGroupees.map(cg => ({
    id: cg.id,
    date_validation: cg.date_validation.toISOString(),
    stock_global: cg.stock_global,
    vendue: cg.vendue,
    details: cg.details,
    stock_disponible: cg.stock_disponible,
    createdAt: cg.createdAt.toISOString(),
    updatedAt: cg.updatedAt.toISOString(),
    commandes: cg.commandes.map(cmd => ({
      id: cmd.id,
      couleur: cmd.couleur,
      motorisation: cmd.motorisation,
      transmission: cmd.transmission,
      nbr_portes: cmd.nbr_portes,
      etapeCommande: cmd.etapeCommande,
      commandeFlag: cmd.commandeFlag,
      date_livraison: cmd.date_livraison.toISOString(),
      createdAt: cmd.createdAt.toISOString(),
      updatedAt: cmd.updatedAt.toISOString(),
      prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
      voitureModel: cmd.voitureModel,
      client: cmd.client,
      clientEntreprise: cmd.clientEntreprise,
    }))
  }))

  return (
    <ListeCommandesGroupeesClient commandesGroupees={serializedCommandesGroupees} />
  )
}
