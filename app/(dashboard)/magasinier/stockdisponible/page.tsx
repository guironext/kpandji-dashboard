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
      Voiture: {
        include: {
          VoitureModel: true
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
    voiture: sp.Voiture ? {
      ...sp.Voiture,
      createdAt: sp.Voiture.createdAt.toISOString(),
      updatedAt: sp.Voiture.updatedAt.toISOString(),
      voitureModel: sp.Voiture.VoitureModel ? {
        ...sp.Voiture.VoitureModel,
        createdAt: sp.Voiture.VoitureModel.createdAt.toISOString(),
        updatedAt: sp.Voiture.VoitureModel.updatedAt.toISOString(),
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