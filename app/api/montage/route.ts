import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const montages = await prisma.montage.findMany({
      include: {
        commande: {
          include: {
            client: true,
            voitureModel: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(montages)
  } catch (error) {
    console.error('Error fetching montages:', error)
    return NextResponse.json({ error: 'Failed to fetch montages' }, { status: 500 })
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
