// Quick script to check which VoitureModels have images
// Run with: npx tsx scripts/check-images.ts

import { prisma } from '../lib/prisma'

async function checkImages() {
  const models = await prisma.voitureModel.findMany({
    select: {
      id: true,
      model: true,
      image: true,
    }
  })

  console.log('\n=== VoitureModel Images Check ===\n')
  console.log(`Total models: ${models.length}`)
  
  const withImages = models.filter(m => m.image)
  const withoutImages = models.filter(m => !m.image)
  
  console.log(`Models with images: ${withImages.length}`)
  console.log(`Models without images: ${withoutImages.length}\n`)
  
  if (withImages.length > 0) {
    console.log('✅ Models with images:')
    withImages.forEach(m => {
      console.log(`  - ${m.model}: ${m.image}`)
    })
  }
  
  if (withoutImages.length > 0) {
    console.log('\n❌ Models without images:')
    withoutImages.forEach(m => {
      console.log(`  - ${m.model}`)
    })
  }
  
  await prisma.$disconnect()
}

checkImages()

