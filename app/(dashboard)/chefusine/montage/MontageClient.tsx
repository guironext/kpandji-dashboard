'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, User, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export type OrdreMontage = {
  id: string
  ordreMontageFlag: string
  chassisNumber: string
  voiture: {
    voitureModel: {
      model: string
    }
  }
  commande: {
    id: string
    client: {
      nom: string
    } | null
    clientEntreprise: {
      nom_entreprise: string
    } | null
    montage: {
      etapeMontage: string
    } | null
  }
}

interface MontageClientProps {
  ordreMontages: OrdreMontage[]
}

const MontageClient: React.FC<MontageClientProps> = ({ ordreMontages }) => {
  const [launchedProductions, setLaunchedProductions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState<Set<string>>(new Set())

  const handleLancerProduction = async (ordreMontage: OrdreMontage) => {
    const ordreMontageId = ordreMontage.id
    setIsLoading(prev => new Set(prev).add(ordreMontageId))

    try {
      const response = await fetch(`/api/ordre-montage/${ordreMontageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ordreMontageFlag: 'EXECUTION' }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      setLaunchedProductions(prev => new Set(prev).add(ordreMontageId))
      toast.success('Montage lancé avec succès')
    } catch (error) {
      console.error('Error updating ordre montage:', error)
      toast.error('Erreur lors du lancement du montage')
    } finally {
      setIsLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(ordreMontageId)
        return newSet
      })
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ordreMontages.map((ordreMontage) => {
        const ordreMontageId = ordreMontage.id
        const isLaunched = launchedProductions.has(ordreMontageId)
        const isLoadingThis = isLoading.has(ordreMontageId)

        return (
          <Card key={ordreMontage.id} className="w-full hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {ordreMontage.voiture.voitureModel.model}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Chassis:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                  {ordreMontage.chassisNumber}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <User className="h-4 w-4" />
                <span>
                  Client: {ordreMontage.commande.client?.nom || ordreMontage.commande.clientEntreprise?.nom_entreprise || 'N/A'}
                </span>
              </div>
              <Button
                onClick={() => handleLancerProduction(ordreMontage)}
                disabled={isLaunched || isLoadingThis}
                className={`w-full transition-colors duration-200 ${
                  isLaunched
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoadingThis ? (
                  'Chargement...'
                ) : isLaunched ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Montage en Cour
                  </>
                ) : (
                  'Lancer Production'
                )}
              </Button>
            </CardContent>
          </Card>
        )
      })}
      {ordreMontages.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500">Aucun ordre de montage en exécution</p>
        </div>
      )}
    </div>
  )
}

export default MontageClient