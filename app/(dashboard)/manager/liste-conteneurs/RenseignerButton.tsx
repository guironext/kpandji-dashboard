"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { FileEdit } from "lucide-react"
import { updateConteneur } from '@/lib/actions/conteneur'
import { EtapeConteneur } from '@/lib/generated/prisma'
import { toast } from "sonner"

interface RenseignerButtonProps {
  conteneurId: string
  currentEtape: EtapeConteneur
}

export function RenseignerButton({ conteneurId, currentEtape }: RenseignerButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDisabled, setIsDisabled] = useState(currentEtape === EtapeConteneur.RENSEIGNE)

  const handleClick = () => {
    if (isDisabled || isPending) return

    startTransition(async () => {
      try {
        const result = await updateConteneur(conteneurId, {
          etapeConteneur: EtapeConteneur.RENSEIGNE
        })

        if (result.success) {
          setIsDisabled(true)
          toast.success("Conteneur marqué comme renseigné avec succès")
          router.refresh()
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour")
        }
      } catch (error) {
        console.error("Error updating conteneur:", error)
        toast.error("Une erreur est survenue")
      }
    })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled || isPending}
      variant="outline"
      size="sm"
      className={`bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 hover:from-yellow-100 hover:to-orange-100 hover:border-yellow-400 text-yellow-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
    >
      <FileEdit className="h-4 w-4 mr-2" />
      {isPending ? (
        <span className="hidden sm:inline">Mise à jour...</span>
      ) : isDisabled ? (
        <span className="hidden sm:inline">Renseigné</span>
      ) : (
        <>
          <span className="hidden sm:inline">Renseigner</span>
          <span className="sm:hidden">Edit</span>
        </>
      )}
    </Button>
  )
}

