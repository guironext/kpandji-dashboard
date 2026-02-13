import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const numeroChassis = await prisma.numeroChassis.findMany({
      include: {
        OrdreMontage: {
          select: {
            id: true,
            ordreMontageFlag: true,
            Voiture: {
              include: {
                VoitureModel: true
              }
            },
            Commande: {
              include: {
                Client: true,
                Client_entreprise: true,
                Montage_Commande_montageIdToMontage: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(numeroChassis, { status: 200 })
  } catch (error) {
    console.error('Error fetching numero chassis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des numéros de châssis', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chassisNumber, motorisation, numeroConteneur } = body

    if (!chassisNumber || !motorisation || !numeroConteneur) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    const numeroChassis = await prisma.numeroChassis.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        chassisNumber,
        motorisation,
        numeroConteneur,
      },
    })

    return NextResponse.json(numeroChassis, { status: 201 })
  } catch (error) {
    console.error('Error creating numero chassis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du numéro de châssis' },
      { status: 500 }
    )
  }
}
