import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { ordreMontageFlag } = await request.json()

    if (!ordreMontageFlag) {
      return NextResponse.json(
        { error: 'ordreMontageFlag est requis' },
        { status: 400 }
      )
    }

    const ordreMontage = await prisma.ordreMontage.update({
      where: { id: params.id },
      data: { ordreMontageFlag },
      include: {
        numeroChassis: true,
        commande: {
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true,
            montage: true,
          },
        },
        voiture: {
          include: {
            voitureModel: true,
          },
        },
      },
    })

    // Update related models
    await prisma.commande.update({
      where: { id: ordreMontage.commandeId },
      data: { etapeCommande: 'MONTAGE' },
    })

    if (ordreMontage.commande.montage) {
      await prisma.montage.update({
        where: { id: ordreMontage.commande.montage.id },
        data: { etapeMontage: 'EXECUTION' },
      })
    }

    await prisma.voiture.update({
      where: { id: ordreMontage.voitureId },
      data: { etatVoiture: 'MONTAGE' },
    })

    return NextResponse.json(ordreMontage, { status: 200 })
  } catch (error) {
    console.error('Error updating ordre montage:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'ordre de montage' },
      { status: 500 }
    )
  }
}