import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if the commande exists
    const existingCommande = await prisma.commande.findUnique({
      where: { id }
    })

    if (!existingCommande) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    // Delete the commande
    await prisma.commande.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Commande supprimée avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting commande:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la commande' },
      { status: 500 }
    )
  }
}

