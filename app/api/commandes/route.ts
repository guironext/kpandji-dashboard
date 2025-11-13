import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      clientId,
      clientEntrepriseId,
      voitureModelId,
      couleur,
      motorisation,
      transmission,
      nbr_portes,
      date_livraison,
      prix_unitaire,
      etapeCommande,
      commandeFlag,
    } = body

    // Validate required fields
    if (!voitureModelId || !couleur || !motorisation || !transmission || !nbr_portes || !date_livraison) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Create the commande
    const commande = await prisma.commande.create({
      data: {
        clientId: clientId || null,
        clientEntrepriseId: clientEntrepriseId || null,
        voitureModelId,
        couleur,
        motorisation,
        transmission,
        nbr_portes,
        date_livraison: new Date(date_livraison),
        prix_unitaire: prix_unitaire ? parseFloat(prix_unitaire) : null,
        etapeCommande: etapeCommande || 'PROPOSITION',
        commandeFlag: commandeFlag || 'DISPONIBLE',
      },
      include: {
        client: true,
        clientEntreprise: true,
        voitureModel: true,
      },
    })

    return NextResponse.json(commande, { status: 201 })
  } catch (error) {
    console.error('Error creating commande:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    )
  }
}
