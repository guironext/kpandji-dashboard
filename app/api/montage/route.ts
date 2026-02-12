import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const montages = await prisma.montage.findMany({
      select: {
        etapeMontage: true,
        no_chassis: true,
        Commande_Montage_commandeIdToCommande: {
          select: {
            date_livraison: true,
            couleur: true,
            motorisation: true,
            transmission: true,
            VoitureModel: {
              select: {
                model: true
              }
            },
            Client: {
              select: {
                nom: true
              }
            },
            Client_entreprise: {
              select: {
                nom_entreprise: true
              }
            }
          }
        }
      },
      orderBy: {
        etapeMontage: 'asc'
      }
    })

    return NextResponse.json(montages)
  } catch (error) {
    console.error('Error fetching montages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des montages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ordreMontageId } = await request.json()

    if (!ordreMontageId) {
      return NextResponse.json(
        { error: 'ordreMontageId is required' },
        { status: 400 }
      )
    }

    // Get the ordre montage with related data
    const ordreMontage = await prisma.ordreMontage.findUnique({
      where: { id: ordreMontageId },
      include: {
        commande: true,
        numeroChassis: true
      }
    })

    if (!ordreMontage) {
      return NextResponse.json(
        { error: 'Ordre montage not found' },
        { status: 404 }
      )
    }

    // Create the montage and update related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create new montage
      const montage = await tx.montage.create({
        data: {
          commandeId: ordreMontage.commandeId,
          no_chassis: ordreMontage.id,
          etapeMontage: 'VALIDE'
        }
      })

      // Update ordre montage flag
      await tx.ordreMontage.update({
        where: { id: ordreMontageId },
        data: { ordreMontageFlag: 'VALIDE' }
      })

      // Update commande etape
      await tx.commande.update({
        where: { id: ordreMontage.commandeId },
        data: { etapeCommande: 'MONTAGE' }
      })

      return montage
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error creating montage:', error)
    return NextResponse.json(
      { error: 'Failed to create montage' },
      { status: 500 }
    )
  }
}