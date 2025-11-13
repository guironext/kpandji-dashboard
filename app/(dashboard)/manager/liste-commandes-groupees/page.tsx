import React from 'react'
import { prisma } from '@/lib/prisma'
import ListeCommandesGroupeesClient from '@/components/ListeCommandesGroupeesClient'

async function getCommandesGroupees() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        commandeGroupeeId: {
          not: null
        }
      },
      include: {
        voitureModel: true,
        commandeGroupee: true
      }
    })

    // Sort commandes by commandeGroupee date_validation (most recent first)
    const sortedCommandes = [...commandes].sort((a, b) => {
      const dateA = a.commandeGroupee?.date_validation?.getTime() || 0
      const dateB = b.commandeGroupee?.date_validation?.getTime() || 0
      return dateB - dateA // Descending order (most recent first)
    })

    // Serialize Decimal values to strings for client component
    const serializedCommandes = sortedCommandes.map(commande => ({
      ...commande,
      prix_unitaire: commande.prix_unitaire?.toString() || null,
      date_livraison: commande.date_livraison.toISOString(),
      createdAt: commande.createdAt.toISOString(),
      updatedAt: commande.updatedAt.toISOString(),
      commandeGroupee: commande.commandeGroupee ? {
        ...commande.commandeGroupee,
        date_validation: commande.commandeGroupee.date_validation.toISOString(),
        createdAt: commande.commandeGroupee.createdAt.toISOString(),
        updatedAt: commande.commandeGroupee.updatedAt.toISOString(),
      } : null,
      voitureModel: commande.voitureModel ? {
        ...commande.voitureModel,
        createdAt: commande.voitureModel.createdAt.toISOString(),
        updatedAt: commande.voitureModel.updatedAt.toISOString(),
      } : null
    }))

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Database connection error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Database connection failed" };
  }
}

const page = async () => {
  const result = await getCommandesGroupees()
  
  if (!result.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Erreur de connexion à la base de données</h1>
          <p className="text-red-700 mb-4">
            Impossible de se connecter au serveur de base de données.
          </p>
          <div className="bg-white rounded p-4 mb-4">
            <p className="text-sm font-mono text-gray-800 break-all">
              {result.error}
            </p>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Vérifications à effectuer :</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Vérifiez que votre variable d&apos;environnement DATABASE_URL est correcte</li>
              <li>Vérifiez que votre base de données Neon est active (non suspendue)</li>
              <li>Vérifiez votre connexion internet</li>
              <li>Vérifiez les paramètres de pare-feu si nécessaire</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
  
  // TypeScript guard: result.data is guaranteed to exist when success is true
  const commandes = result.success ? result.data : []
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Liste des Commandes Groupées</h1>
      <ListeCommandesGroupeesClient commandes={commandes as Parameters<typeof ListeCommandesGroupeesClient>[0]['commandes']} />
    </div>
  )
}

export default page