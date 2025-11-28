import React from 'react'
import { prisma } from '@/lib/prisma'
import ListeCommandesGroupeesClient from './ListeCommandesGroupeesClient'
import Link from 'next/link'

export default async function ListeCommandesGroupeesPage() {
  try {
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
  } catch (error: unknown) {
    console.error('Database connection error:', error)
    
    // Check if it's a connection error
    const isConnectionError = 
      (error instanceof Error && error.message?.includes('Can\'t reach database server')) ||
      (typeof error === 'object' && error !== null && 'code' in error && (error.code === 'P1001' || error.code === 'P1017'))
    
    if (isConnectionError) {
      // Return a user-friendly error page
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 border-2 border-red-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de connexion à la base de données</h2>
            <p className="text-gray-700 mb-4">
              Impossible de se connecter au serveur de base de données. Veuillez vérifier:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Que le serveur de base de données est en cours d&apos;exécution</li>
              <li>Que votre connexion Internet est active</li>
              <li>Que la variable d&apos;environnement DATABASE_URL est correctement configurée</li>
            </ul>
            <Link
              href="/manager/liste-commandes-groupees"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
            >
              Réessayer
            </Link>
          </div>
        </div>
      )
    }
    
    // For other errors, throw to show Next.js error page
    throw error
  }
}
