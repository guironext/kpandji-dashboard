import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { etapeMontage } = await request.json()
    const { id: montageId } = await params

    if (!etapeMontage) {
      return NextResponse.json({ error: 'Missing etapeMontage' }, { status: 400 })
    }

    // Update the montage and its associated commande
    const updatedMontage = await prisma.montage.update({
      where: { id: montageId },
      data: {
        etapeMontage,
        Commande_Montage_commandeIdToCommande: {
          update: {
            etapeCommande: 'VALIDE'
          }
        }
      },
      include: {
        Commande_Montage_commandeIdToCommande: {
          include: {
            Client: true,
            VoitureModel: true
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
