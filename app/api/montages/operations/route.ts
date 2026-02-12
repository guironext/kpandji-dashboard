import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const montages = await prisma.montage.findMany({
      where: {
        etapeMontage: 'EXECUTION'
      },
      include: {
        Commande_Montage_commandeIdToCommande: {
          include: {
            Client: true,
            Client_entreprise: true,
            VoitureModel: true,
            OrdreMontage: {
              include: {
                NumeroChassis: true
              }
            }
          }
        },
        Equipe: {
          where: {
            stautsEquipe: 'ACTIVE'
          },
          include: {
            Employee: true,
            EquipeMembre: {
              include: {
                Employee: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(montages)
  } catch (error) {
    console.error('Error fetching montage operations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch montage operations' },
      { status: 500 }
    )
  }
}