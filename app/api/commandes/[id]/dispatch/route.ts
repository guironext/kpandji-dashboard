import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Update the commande to VALIDE status (dispatch)
    const updatedCommande = await prisma.commande.update({
      where: { id },
      data: {
        etapeCommande: 'VALIDE'
      },
      include: {
        client: true,
        clientEntreprise: true,
        voitureModel: true,
        fournisseurs: true,
      }
    })

    return NextResponse.json(
      { 
        message: 'Commande dispatchée avec succès',
        commande: {
          ...updatedCommande,
          prix_unitaire: updatedCommande.prix_unitaire ? Number(updatedCommande.prix_unitaire) : null,
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error dispatching commande:', error)
    return NextResponse.json(
      { error: 'Erreur lors du dispatch de la commande' },
      { status: 500 }
    )
  }
}

