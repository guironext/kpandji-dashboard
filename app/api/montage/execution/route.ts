import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { montageId } = await request.json()

    if (!montageId) {
      return NextResponse.json(
        { error: 'montageId is required' },
        { status: 400 }
      )
    }

    // Update montage, ordre montage, and spare parts in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update montage etape using the ordreMontageId
      await tx.montage.updateMany({
        where: { no_chassis: montageId },
        data: { etapeMontage: 'EXECUTION' }
      })

      // Update ordre montage flag
      await tx.ordreMontage.update({
        where: { id: montageId },
        data: { ordreMontageFlag: 'EXECUTION' }
      })

      // Get the commande ID from ordre montage to update spare parts
      const ordreMontage = await tx.ordreMontage.findUnique({
        where: { id: montageId },
        select: { commandeId: true }
      })

      if (ordreMontage) {
        // Update spare parts related to the commande
        await tx.sparePart.updateMany({
          where: { commandeId: ordreMontage.commandeId },
          data: { etapeSparePart: 'ATTRIBUE' }
        })
      }

      return { success: true }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating montage to execution:', error)
    return NextResponse.json(
      { error: 'Failed to update montage to execution' },
      { status: 500 }
    )
  }
}