import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { ordreMontageFlag } = await request.json()

    if (!ordreMontageFlag) {
      return NextResponse.json(
        { error: 'ordreMontageFlag est requis' },
        { status: 400 }
      )
    }

    const ordreMontage = await prisma.ordreMontage.update({
      where: { id },
      data: { ordreMontageFlag },
      include: {
        NumeroChassis: true,
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
            Montage_Commande_montageIdToMontage: true,
          },
        },
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
      },
    })

    // Update related models
    await prisma.commande.update({
      where: { id: ordreMontage.commandeId },
      data: { etapeCommande: 'MONTAGE' },
    })

    const montage = ordreMontage.Commande?.Montage_Commande_montageIdToMontage;
    if (montage) {
      await prisma.montage.update({
        where: { id: montage.id },
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