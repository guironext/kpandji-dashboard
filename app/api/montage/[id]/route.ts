import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { etapeMontage } = await request.json()
    const montageId = params.id

    if (!etapeMontage) {
      return NextResponse.json({ error: 'Missing etapeMontage' }, { status: 400 })
    }

    // Update the montage and its associated commande
    const updatedMontage = await prisma.montage.update({
      where: { id: montageId },
      data: {
        etapeMontage,
        commande: {
          update: {
            etapeCommande: 'VALIDE'
          }
        }
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

    return NextResponse.json(updatedMontage)
  } catch (error) {
    console.error('Error updating montage:', error)
    return NextResponse.json({ error: 'Failed to update montage' }, { status: 500 })
  }
}
