import React from 'react'
import { prisma } from '@/lib/prisma'
import StockDisponibleClient from '@/components/StockDisponibleClient'

export const dynamic = 'force-dynamic'

const page = async () => {
  // Fetch all commandes with commandeFlag === 'DISPONIBLE'
  const commandesDisponibles = await prisma.commande.findMany({
    where: {
      commandeFlag: 'DISPONIBLE'
    },
    include: {
      Client: true,
      Client_entreprise: true,
      VoitureModel: true,
      Conteneur: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Serialize the data to convert Decimal to string and Date to ISO string
  const serializedCommandes = commandesDisponibles.map(cmd => ({
    ...cmd,
    prix_unitaire: cmd.prix_unitaire ? cmd.prix_unitaire.toString() : null,
    date_livraison: cmd.date_livraison ? cmd.date_livraison.toISOString() : null,
    createdAt: cmd.createdAt.toISOString(),
    updatedAt: cmd.updatedAt.toISOString(),
    conteneur: cmd.Conteneur ? {
      ...cmd.Conteneur,
      dateEmbarquement: cmd.Conteneur.dateEmbarquement?.toISOString() || null,
      dateArriveProbable: cmd.Conteneur.dateArriveProbable?.toISOString() || null,
      createdAt: cmd.Conteneur.createdAt.toISOString(),
      updatedAt: cmd.Conteneur.updatedAt.toISOString(),
    } : null,
    client: cmd.Client ? {
      ...cmd.Client,
      createdAt: cmd.Client.createdAt.toISOString(),
      updatedAt: cmd.Client.updatedAt.toISOString(),
    } : null,
    clientEntreprise: cmd.Client_entreprise ? {
      ...cmd.Client_entreprise,
      createdAt: cmd.Client_entreprise.createdAt.toISOString(),
      updatedAt: cmd.Client_entreprise.updatedAt.toISOString(),
    } : null,
    voitureModel: cmd.VoitureModel ? {
      ...cmd.VoitureModel,
      createdAt: cmd.VoitureModel.createdAt.toISOString(),
      updatedAt: cmd.VoitureModel.updatedAt.toISOString(),
    } : null,
  }))

  return (
    <div className="container mx-auto p-6">
      <StockDisponibleClient commandes={serializedCommandes} />
    </div>
  )
}

export default page