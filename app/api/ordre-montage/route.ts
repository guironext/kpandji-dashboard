import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { commandeId, voitureId, numeroChassisId } = body

    if (!commandeId || !voitureId || !numeroChassisId) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    const ordreMontage = await (prisma as any).ordreMontage.create({
      data: {
        commandeId,
        voitureId,
        numeroChassisId,
      },
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
    })

    return NextResponse.json(ordreMontage, { status: 201 })
  } catch (error) {
    console.error('Error creating ordre montage:', error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'ordre de montage" },
      { status: 500 }
    )
  }
}
