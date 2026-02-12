import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nomEquipe, mission, taches_accomplies, stautsEquipe, membres } = body

    // Update equipe
    const updatedEquipe = await prisma.equipe.update({
      where: { id },
      data: {
        nomEquipe,
        mission,
        taches_accomplies,
        stautsEquipe,
      },
      include: {
        membres: {
          include: {
            employee: true
          }
        },
        chefEquipe: true
      }
    })

    // If membres are provided, update them
    if (membres) {
      // Delete existing membres
      await prisma.equipeMembre.deleteMany({
        where: { equipeId: id }
      })

      // Create new membres
      for (const membre of membres) {
        await prisma.equipeMembre.create({
          data: {
            equipeId: id,
            employeeId: membre.employeeId,
            qualite: membre.isChef ? 'CHEF_EQUIPE' : 'MEMBRE_EQUIPE',
            fonction: membre.fonction,
          }
        })
      }
    }

    return NextResponse.json(updatedEquipe)
  } catch (error) {
    console.error('Error updating equipe:', error)
    return NextResponse.json(
      { error: 'Failed to update equipe' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params

    // Delete equipe with its membres in a transaction
    await prisma.$transaction(async (tx) => {
      // First delete all EquipeMembre records associated with this equipe
      await tx.equipeMembre.deleteMany({
        where: { equipeId: id }
      })

      // Then delete the equipe
      await tx.equipe.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting equipe:', error)
    return NextResponse.json(
      { error: 'Failed to delete equipe' },
      { status: 500 }
    )
  }
}