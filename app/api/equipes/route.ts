import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface MembreInput {
  employeeId: string
  isChef?: boolean
  fonction?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const whereClause = status ? { stautsEquipe: status } : {}

    const equipes = await prisma.equipe.findMany({
      where: whereClause,
      include: {
        chefEquipe: true,
        membres: {
          include: {
            employee: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(equipes)
  } catch (error) {
    console.error('Error fetching equipes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nomEquipe, mission, chefEquipeId, taches_accomplies, membres, montageId, activite } = body

    if (!nomEquipe || !chefEquipeId || !membres || membres.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: nomEquipe, chefEquipeId, membres are required' },
        { status: 400 }
      )
    }

    const equipe = await prisma.equipe.create({
      data: {
        nomEquipe,
        mission: mission || '',
        chefEquipeId,
        taches_accomplies: taches_accomplies || '',
        activite: activite || 'montage',
        montageId,
        membres: {
          create: (membres as MembreInput[]).map((membre) => ({
            employeeId: membre.employeeId,
            qualite: membre.isChef ? 'CHEF_EQUIPE' : 'MEMBRE_EQUIPE',
            fonction: membre.fonction || ''
          }))
        }
      },
      include: {
        chefEquipe: true,
        membres: {
          include: {
            employee: true
          }
        }
      }
    })

    return NextResponse.json(equipe)
  } catch (error) {
    console.error('Error creating equipe:', error)
    return NextResponse.json(
      { error: 'Failed to create equipe' },
      { status: 500 }
    )
  }
}