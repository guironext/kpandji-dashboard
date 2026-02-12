import React from 'react'
import { prisma } from '@/lib/prisma'
import StockDisponibleSparePartsClient from '@/components/StockDisponibleSparePartsClient'


export const dynamic = 'force-dynamic'

const page = async () => {
  // Fetch all spare parts in storage (etapeSparePart: 'RANGE')
  const sparePartsInStorage = await prisma.sparePart.findMany({
    where: {
      etapeSparePart: 'RANGE'
    },
    include: {
      voiture: {
        include: {
          voitureModel: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Serialize the data
  const serializedSpareParts = sparePartsInStorage.map(sp => ({
    ...sp,
    createdAt: sp.createdAt.toISOString(),
    updatedAt: sp.updatedAt.toISOString(),
    voiture: sp.voiture ? {
      ...sp.voiture,
      createdAt: sp.voiture.createdAt.toISOString(),
      updatedAt: sp.voiture.updatedAt.toISOString(),
      voitureModel: sp.voiture.voitureModel ? {
        ...sp.voiture.voitureModel,
        createdAt: sp.voiture.voitureModel.createdAt.toISOString(),
        updatedAt: sp.voiture.voitureModel.updatedAt.toISOString(),
      } : null
    } : null
  }))

  return (
    <div>
      <StockDisponibleSparePartsClient spareParts={serializedSpareParts} />
    </div>
  )
}

export default page