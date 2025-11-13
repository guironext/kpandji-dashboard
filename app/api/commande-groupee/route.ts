import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { commandeIds, validationDate } = body

    // Validate required fields
    if (!commandeIds || !Array.isArray(commandeIds) || commandeIds.length === 0) {
      return NextResponse.json(
        { error: 'Au moins une commande doit être fournie' },
        { status: 400 }
      )
    }

    if (!validationDate) {
      return NextResponse.json(
        { error: 'La date de validation est requise' },
        { status: 400 }
      )
    }

    // Fetch all commandes to get their details
    const commandes = await prisma.commande.findMany({
      where: {
        id: {
          in: commandeIds
        }
      },
      include: {
        voitureModel: true
      }
    })

    if (commandes.length === 0) {
      return NextResponse.json(
        { error: 'Aucune commande trouvée' },
        { status: 404 }
      )
    }
    
    // Group commandes by model, color, motorisation, and transmission for analysis
    const groupedBySpecs = commandes.reduce((acc, cmd) => {
      const key = `${cmd.voitureModel?.model}-${cmd.couleur}-${cmd.motorisation}-${cmd.transmission}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(cmd)
      return acc
    }, {} as Record<string, typeof commandes>)

    // Calculate stats
    const totalCommandes = commandes.length
    const venduCount = commandes.filter(c => c.commandeFlag === 'VENDUE').length
    const disponibleCount = commandes.filter(c => c.commandeFlag === 'DISPONIBLE').length

    // Create details string
    const details = Object.entries(groupedBySpecs)
      .map(([key, cmds]) => {
        const [model, couleur, motorisation, transmission] = key.split('-')
        return `${model} - ${couleur} - ${motorisation} - ${transmission}: ${cmds.length} unité(s)`
      })
      .join('; ')

    // Create the CommandeGroupee
    const commandeGroupee = await prisma.commandeGroupee.create({
      data: {
        date_validation: new Date(validationDate),
        stock_global: totalCommandes.toString(),
        vendue: venduCount.toString(),
        stock_disponible: disponibleCount.toString(),
        details: details
      }
    })

    // Update all commandes to link them to the new commandeGroupee and set etapeCommande to VALIDE
    await prisma.commande.updateMany({
      where: {
        id: {
          in: commandeIds
        }
      },
      data: {
        commandeGroupeeId: commandeGroupee.id,
        etapeCommande: 'VALIDE'
      }
    })

    // Fetch the updated commandeGroupee with related commandes
    const updatedCommandeGroupee = await prisma.commandeGroupee.findUnique({
      where: {
        id: commandeGroupee.id
      },
      include: {
        commandes: {
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true
          }
        }
      }
    })

    return NextResponse.json(updatedCommandeGroupee, { status: 201 })
  } catch (error) {
    console.error('Error creating commande groupée:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande groupée' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const commandeGroupees = await prisma.commandeGroupee.findMany({
      include: {
        commandes: {
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(commandeGroupees, { status: 200 })
  } catch (error) {
    console.error('Error fetching commande groupées:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes groupées' },
      { status: 500 }
    )
  }
}

