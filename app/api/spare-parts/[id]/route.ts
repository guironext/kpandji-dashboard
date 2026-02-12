import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sparePart = await prisma.sparePart.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        etapeSparePart: true,
      },
    })

    if (!sparePart) {
      return NextResponse.json({ error: 'Spare part not found' }, { status: 404 })
    }

    return NextResponse.json(sparePart)
  } catch (error) {
    console.error('Error fetching spare part:', error)
    return NextResponse.json({ error: 'Failed to fetch spare part' }, { status: 500 })
  }
}