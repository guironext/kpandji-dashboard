"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { updateCommandeStatus } from '@/lib/actions/commande';
import { toast } from 'sonner';

interface Fournisseur {
  id: string;
  nom: string;
  email: string | null; // Change from string | undefined to string | null
  telephone: string | null; // Change from string | undefined to string | null
}

interface ValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandeId: string;
  fournisseurs: Fournisseur[];
  onSuccess: () => void;
}

export function ValidationDialog({
  open,
  onOpenChange,
  commandeId,
  fournisseurs,
  onSuccess
}: ValidationDialogProps) {
  const [selectedFournisseurs, setSelectedFournisseurs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFournisseurToggle = (fournisseurId: string) => {
    setSelectedFournisseurs(prev => 
      prev.includes(fournisseurId)
        ? prev.filter(id => id !== fournisseurId)
        : [...prev, fournisseurId]
    );
  };

  const handleSubmit = async () => {
    if (selectedFournisseurs.length === 0) {
      toast.error("Veuillez sélectionner au moins un fournisseur");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCommandeStatus(commandeId, selectedFournisseurs);
      
      if (result.success) {
        toast.success("Commande validée avec succès");
        onSuccess();
        onOpenChange(false);
        setSelectedFournisseurs([]);
      } else {
        toast.error(result.error || "Erreur lors de la validation");
      }
    } catch (_error) {
      toast.error("Erreur lors de la validation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Valider la commande</DialogTitle>
          <DialogDescription>
            Sélectionnez les fournisseurs pour cette commande. La commande sera marquée comme validée.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {fournisseurs.map((fournisseur) => (
              <div key={fournisseur.id} className="flex items-center space-x-2">
                <Checkbox
                  id={fournisseur.id}
                  checked={selectedFournisseurs.includes(fournisseur.id)}
                  onCheckedChange={() => handleFournisseurToggle(fournisseur.id)}
                />
                <Label
                  htmlFor={fournisseur.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <div>
                    <div className="font-medium">{fournisseur.nom}</div>
                    {fournisseur.email && (
                      <div className="text-xs text-muted-foreground">{fournisseur.email}</div>
                    )}
                    {fournisseur.telephone && (
                      <div className="text-xs text-muted-foreground">{fournisseur.telephone}</div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedFournisseurs.length === 0}
          >
            {isLoading ? "Validation..." : "Valider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
