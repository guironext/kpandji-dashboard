import React from 'react'
import { getAllCourriers } from '@/lib/actions/courrier'
import CourriersClient from './CourriersClient'

export default async function CourriersPage() {
  const courriersResult = await getAllCourriers()
  
  const courriers = (courriersResult.success && Array.isArray(courriersResult.data) 
    ? courriersResult.data 
    : []) as unknown as Parameters<typeof CourriersClient>[0]['courriers']

  return (
    <CourriersClient courriers={courriers} />
  )
}

