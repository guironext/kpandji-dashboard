"use client";

import { useState } from "react";
import { updateConteneur } from "@/lib/actions/conteneur";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type Conteneur = {
  id: string;
  conteneurNumber: string;
  sealNumber: string;
  totalPackages: string | null;
  grossWeight: string | null;
  netWeight: string | null;
  stuffingMap: string | null;
  etapeConteneur: string;
  dateEmbarquement: Date | string | null;
  dateArriveProbable: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  commandes: unknown[];
  subcases: unknown[];
  verifications: unknown[];
  voitures: unknown[];
};

const ETAPE_ORDER = [
  "EN_ATTENTE",
  "CHARGE",
  "TRANSITE",
  "RENSEIGNE",
  "ARRIVE",
  "DECHARGE",
  "VERIFIE",
];

const ETAPE_LABELS: Record<string, string> = {
  EN_ATTENTE: "En Attente",
  CHARGE: "Chargé",
  TRANSITE: "En Transit",
  RENSEIGNE: "Renseigné",
  ARRIVE: "Arrivé",
  DECHARGE: "Déchargé",
  VERIFIE: "Vérifié",
};

interface StatusUpdateButtonProps {
  conteneur: Conteneur;
  onUpdate: () => void;
}

export function StatusUpdateButton({ conteneur, onUpdate }: StatusUpdateButtonProps) {
  const [loading, setLoading] = useState(false);

  const getNextStatus = (currentStatus: string): string | null => {
    const currentIndex = ETAPE_ORDER.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === ETAPE_ORDER.length - 1) {
      return null; // No next status
    }
    return ETAPE_ORDER[currentIndex + 1];
  };

  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus(conteneur.etapeConteneur);
    
    if (!nextStatus) {
      toast.error("Ce conteneur est déjà à la dernière étape");
      return;
    }

    setLoading(true);
    try {
      const result = await updateConteneur(conteneur.id, {
        etapeConteneur: nextStatus as "EN_ATTENTE" | "CHARGE" | "TRANSITE" | "RENSEIGNE" | "ARRIVE" | "DECHARGE" | "VERIFIE",
      });

      if (result.success) {
        toast.success(
          `Conteneur ${conteneur.conteneurNumber} mis à jour vers "${ETAPE_LABELS[nextStatus]}"`
        );
        onUpdate();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating conteneur status:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const nextStatus = getNextStatus(conteneur.etapeConteneur);
  const isDisabled = conteneur.etapeConteneur === "TRANSITE" && nextStatus === "RENSEIGNE";

  if (!nextStatus) {
    return (
      <Badge variant="outline" className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border-gray-300 font-semibold px-3 py-1 shadow-sm">
        Dernière étape
      </Badge>
    );
  }

  return (
    <Button
      onClick={handleStatusUpdate}
      disabled={loading || isDisabled}
      size="sm"
      className="group gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
      variant="default"
      title={isDisabled ? "Cette action n'est pas disponible pour les conteneurs en transit" : undefined}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Mise à jour...</span>
        </>
      ) : (
        <>
          <span>Passer à {ETAPE_LABELS[nextStatus]}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </Button>
  );
}
