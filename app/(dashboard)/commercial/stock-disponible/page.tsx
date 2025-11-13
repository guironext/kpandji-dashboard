import React from 'react'
import { prisma } from '@/lib/prisma'
import StockDisponibleClient from '@/components/StockDisponibleClient'

const page = async () => {
  // Fetch all commandes with commandeFlag === 'DISPONIBLE'
  const commandesDisponibles = await prisma.commande.findMany({
    where: {
      commandeFlag: 'DISPONIBLE'
    },
    include: {
      client: true,
      clientEntreprise: true,
      voitureModel: true,
      conteneur: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Serialize the data to convert Decimal to string and Date to ISO string
  const serializedCommandes = commandesDisponibles.map(cmd => ({
    ...cmd,
    prix_unitaire: cmd.prix_unitaire ? cmd.prix_unitaire.toString() : null,
    date_livraison: cmd.date_livraison.toISOString(),
    createdAt: cmd.createdAt.toISOString(),
    updatedAt: cmd.updatedAt.toISOString(),
    conteneur: cmd.conteneur ? {
      ...cmd.conteneur,
      dateEmbarquement: cmd.conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: cmd.conteneur.dateArriveProbable?.toISOString() || null,
      createdAt: cmd.conteneur.createdAt.toISOString(),
      updatedAt: cmd.conteneur.updatedAt.toISOString(),
    } : null,
    client: cmd.client ? {
      ...cmd.client,
      createdAt: cmd.client.createdAt.toISOString(),
      updatedAt: cmd.client.updatedAt.toISOString(),
    } : null,
    clientEntreprise: cmd.clientEntreprise ? {
      ...cmd.clientEntreprise,
      createdAt: cmd.clientEntreprise.createdAt.toISOString(),
      updatedAt: cmd.clientEntreprise.updatedAt.toISOString(),
    } : null,
    voitureModel: cmd.voitureModel ? {
      ...cmd.voitureModel,
      createdAt: cmd.voitureModel.createdAt.toISOString(),
      updatedAt: cmd.voitureModel.updatedAt.toISOString(),
    } : null,
  }))

  return (
    <div className="container mx-auto p-6">
      <StockDisponibleClient commandes={serializedCommandes} />
    </div>
  )
}

export default page