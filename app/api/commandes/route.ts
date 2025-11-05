import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const etape = searchParams.get('etape')

    const whereClause = etape ? { etapeCommande: etape as 'VERIFIER' } : {}

    const commandes = await prisma.commande.findMany({
      where: whereClause,
      include: {
        client: true,
        voitureModel: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(commandes)
  } catch (error) {
    console.error('Error fetching commandes:', error)
    return NextResponse.json({ error: 'Failed to fetch commandes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { commandeId, no_chassis } = await request.json()

    if (!commandeId || !no_chassis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the commande exists and has etapeCommande === 'VERIFIER'
    const commande = await prisma.commande.findFirst({
      where: {
        id: commandeId,
        etapeCommande: 'VERIFIER'
      }
    })

    if (!commande) {
      return NextResponse.json({ error: 'Commande not found or not verified' }, { status: 404 })
    }

    // Create the montage
    const montage = await prisma.montage.create({
      data: {
        commandeId,
        no_chassis,
        etapeMontage: 'CREATION'
      },
      include: {
        commande: {
          include: {
            client: true,
            voitureModel: true
          }
        }
      }
    })

    return NextResponse.json(montage, { status: 201 })
  } catch (error) {
    console.error('Error creating montage:', error)
    return NextResponse.json({ error: 'Failed to create montage' }, { status: 500 })
  }
}
