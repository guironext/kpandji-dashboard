import { NextRequest, NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { voitureModelId, qteCommandeEnAttente, commandeId } = body

    // Validate required fields
    if (!voitureModelId || qteCommandeEnAttente === undefined || !commandeId) {
      return NextResponse.json(
        { error: 'voitureModelId, qteCommandeEnAttente et commandeId sont requis' },
        { status: 400 }
      )
    }

    // Use executeWithRetry to handle connection errors
    const result = await executeWithRetry(async () => {
      // Check if CommandeEnAttente already exists for this commandeId
      const existing = await prisma.commandeEnAttente.findUnique({
        where: { commandeId },
      })

      if (existing) {
        // Update existing record
        const updated = await prisma.commandeEnAttente.update({
          where: { commandeId },
          data: {
            voitureModelId,
            qteCommandeEnAttente,
          },
          include: {
            VoitureModel: true,
          },
        })
        return { data: updated, status: 200 }
      }

      // Create new CommandeEnAttente
      const commandeEnAttente = await prisma.commandeEnAttente.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          commandeId,
          voitureModelId,
          qteCommandeEnAttente,
        },
        include: {
          VoitureModel: true,
        },
      })
      return { data: commandeEnAttente, status: 201 }
    })

    return NextResponse.json(result.data, { status: result.status })
  } catch (error) {
    console.error('Error creating/updating CommandeEnAttente:', error)
    
    // Check if it's a connection error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorString = errorMessage.toLowerCase()
    const isConnectionError = 
      errorString.includes('connection') ||
      errorString.includes('closed') ||
      errorString.includes('kind: closed') ||
      errorString.includes('p1001') ||
      errorString.includes('p1017') ||
      errorString.includes('p1008')

    if (isConnectionError) {
      return NextResponse.json(
        { error: 'Erreur de connexion à la base de données. Veuillez réessayer.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création/mise à jour de la commande en attente' },
      { status: 500 }
    )
  }
}

