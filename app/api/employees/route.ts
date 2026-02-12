import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        nom: true,
        prenoms: true,
        specialite: true,
      },
      orderBy: { nom: 'asc' },
    })

    return NextResponse.json(employees, { status: 200 })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des employés' },
      { status: 500 }
    )
  }
}