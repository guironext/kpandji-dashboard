import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const ordreMontages = await prisma.ordreMontage.findMany({
      where: {
        ordreMontageFlag: 'VALIDE'
      },
      include: {
        NumeroChassis: true,
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true
          }
        },
        Voiture: {
          include: {
            VoitureModel: true
          }
        }
      }
    })

    return NextResponse.json(ordreMontages)
  } catch (error) {
    console.error('Error fetching ordre montages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des ordres de montage' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { commandeId, numeroChassisId } = body

    if (!commandeId || !numeroChassisId) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    // Find the commande and its associated voitures
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId },
      include: {
        Voiture: true,
        Client: true,
        Client_entreprise: true,
        VoitureModel: true
      }
    })

    if (!commande) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    let voitureId: string;

    // If no voitures exist for this commande, create one
    if ((commande as { Voiture: unknown[] }).Voiture.length === 0) {   
      const nouvelleVoiture = await prisma.voiture.create({
        data: {
          id: crypto.randomUUID(),
          commandeId: commande.id,
          voitureModelId: commande.voitureModelId,
          clientId: commande.clientId,
          clientEntrepriseId: commande.clientEntrepriseId,
          couleur: commande.couleur || 'Non spécifiée',
          nbr_portes: commande.nbr_portes || '5',
          transmission: commande.transmission || 'AUTOMATIQUE',
          motorisation: commande.motorisation || 'ESSENCE',
          etatVoiture: 'MONTAGE',
          updatedAt: new Date(),
        }
      })
      voitureId = nouvelleVoiture.id;
    } else {
      // Use the first voiture (there should typically be only one)
      voitureId = (commande as { Voiture: Array<{ id: string }> }).Voiture[0].id;
    }

    // Update the numero chassis flag to OCCUPE
    await prisma.numeroChassis.update({
      where: { id: numeroChassisId },
      data: { 
        chassisFlag: 'OCCUPE',
        updatedAt: new Date(),
      }
    })

    // Create the ordre de montage
    const ordreMontage = await prisma.ordreMontage.create({
      data: {
        id: crypto.randomUUID(),
        commandeId,
        voitureId,
        numeroChassisId,
        updatedAt: new Date(),
      },
      include: {
        NumeroChassis: true,
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
      },
    })

    return NextResponse.json(ordreMontage, { status: 201 })
  } catch (error) {
    console.error('Error creating ordre montage:', error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'ordre de montage" },
      { status: 500 }
    )
  }
}
