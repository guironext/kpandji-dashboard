import React from 'react'
import { prisma } from '@/lib/prisma'
import CommandeGroupeeClient from '@/components/CommandeGroupeeClient'

const page = async () => {
  // Fetch commandes with PROPOSITION and VENDUE status
  const commandesProposition = await prisma.commande.findMany({
    where: {
      etapeCommande: 'PROPOSITION',
      commandeFlag: 'VENDUE'
    },
    include: {
      client: true,
      clientEntreprise: true,
      voitureModel: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Fetch commandes with PROPOSITION and DISPONIBLE for the right side
  const commandesDisponibles = await prisma.commande.findMany({
    where: {
      etapeCommande: 'PROPOSITION',
      commandeFlag: 'DISPONIBLE'
    },
    include: {
      client: true,
      clientEntreprise: true,
      voitureModel: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Fetch data for the dialog form
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      nom: true,
      telephone: true,
    },
    orderBy: {
      nom: 'asc'
    }
  })

  const clientsEntreprise = await prisma.client_entreprise.findMany({
    select: {
      id: true,
      nom_entreprise: true,
      telephone: true,
    },
    orderBy: {
      nom_entreprise: 'asc'
    }
  })

  const voitureModels = await prisma.voitureModel.findMany({
    select: {
      id: true,
      model: true,
    },
    orderBy: {
      model: 'asc'
    }
  })

  // Serialize the data to convert Decimal to string
  const serializedCommandesProposition = commandesProposition.map(cmd => ({
    ...cmd,
    prix_unitaire: cmd.prix_unitaire ? cmd.prix_unitaire.toString() : null,
    date_livraison: cmd.date_livraison.toISOString(),
    createdAt: cmd.createdAt.toISOString(),
    updatedAt: cmd.updatedAt.toISOString(),
  }))

  const serializedCommandesDisponibles = commandesDisponibles.map(cmd => ({
    ...cmd,
    prix_unitaire: cmd.prix_unitaire ? cmd.prix_unitaire.toString() : null,
    date_livraison: cmd.date_livraison.toISOString(),
    createdAt: cmd.createdAt.toISOString(),
    updatedAt: cmd.updatedAt.toISOString(),
  }))

  return (
    <CommandeGroupeeClient
      commandesProposition={serializedCommandesProposition}
      commandesDisponibles={serializedCommandesDisponibles}
      clients={clients}
      clientsEntreprise={clientsEntreprise}
      voitureModels={voitureModels}
    />
  )
}

export default page