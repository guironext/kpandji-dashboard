import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chassisNumber, motorisation, numeroConteneur } = body

    if (!chassisNumber || !motorisation || !numeroConteneur) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    const numeroChassis = await prisma.numeroChassis.create({
      data: {
        chassisNumber,
        motorisation,
        numeroConteneur,
      },
    })

    return NextResponse.json(numeroChassis, { status: 201 })
  } catch (error) {
    console.error('Error creating numero chassis:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du numéro de châssis' },
      { status: 500 }
    )
  }
}
