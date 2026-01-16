import React from 'react'
import { executeWithRetry, prisma } from '@/lib/prisma'
import OrdreMontageClient from './ordre-montage-client'

type CommandeWithRelations = {
  id: string
  etapeCommande: string
  date_livraison: Date
  createdAt: Date
  updatedAt: Date
  clientId: string | null
  conteneurId: string | null
  commandeLocalId: string | null
  couleur: string
  montageId: string | null
  motorisation: string
  nbr_portes: string
  transmission: string
  voitureModelId: string | null
  clientEntrepriseId: string | null
  factureId: string | null
  prix_unitaire: { toNumber: () => number } | null
  numChassis: string | null
  commandeFlag: string
  commandeGroupeeId: string | null
  voitureModel: { model: string } | null
  client: { nom: string } | null
  clientEntreprise: { nom_entreprise: string } | null
}

const serializeCommande = (commande: CommandeWithRelations) => ({
  ...commande,
  prix_unitaire: commande.prix_unitaire ? commande.prix_unitaire.toNumber() : null,
})

export default async function OrdreMontagePage() {
  const prismaClient = prisma as typeof prisma & { ordreMontage: typeof prisma.commande }
  const [ordreMontages, commandes, voitures] = await Promise.all([
    executeWithRetry(() =>
      prismaClient.ordreMontage.findMany({
        include: {
          numeroChassis: true,
          commande: {
            include: {
              voitureModel: true,
              client: true,
              clientEntreprise: true,
            },
          },
          voiture: {
            include: {
              voitureModel: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    ),
    executeWithRetry(() =>
      prisma.commande.findMany({
        include: {
          voitureModel: true,
          client: true,
          clientEntreprise: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    ),
    executeWithRetry(() =>
      prisma.voiture.findMany({
        include: {
          voitureModel: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    ),
  ])

  const serializedCommandes = (commandes as CommandeWithRelations[]).map(serializeCommande)
  const serializedOrdres = ordreMontages.map((ordre) => ({
    ...ordre,
    commande: serializeCommande(ordre.commande as CommandeWithRelations),
  }))

  return <OrdreMontageClient ordreMontages={serializedOrdres} commandes={serializedCommandes} voitures={voitures} />
}