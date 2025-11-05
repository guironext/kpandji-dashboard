"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateSparePart } from "@/lib/actions/sparepart";
import { Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Voiture {
  id: string;
  couleur: string;
  voitureModel?: {
    model: string;
  } | null;
}

interface SparePart {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  subcaseId: string | null;
  voitureId: string;
  voiture?: {
    couleur: string;
    voitureModel?: {
      model: string;
    } | null;
  } | null;
}

interface UpdateSparePartFormProps {
  sparePart: SparePart;
  voitures: Voiture[];
}

export function UpdateSparePartForm({ sparePart, voitures }: UpdateSparePartFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    partCode: sparePart.partCode,
    partName: sparePart.partName,
    partNameFrench: sparePart.partNameFrench || "",
    quantity: sparePart.quantity,
    voitureId: sparePart.voitureId,
  });

  useEffect(() => {
    setFormData({
      partCode: sparePart.partCode,
      partName: sparePart.partName,
      partNameFrench: sparePart.partNameFrench || "",
      quantity: sparePart.quantity,
      voitureId: sparePart.voitureId,
    });
  }, [sparePart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateSparePart(sparePart.id, {
        ...formData,
        status: 'MODIFIE' // Add this line to set status to MODIFIE
      });

      if (result.success) {
        toast.success("Pièce modifiée avec succès");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la modification de la pièce");
      }
    } catch (_error) {
      toast.error("Erreur lors de la modification de la pièce");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Modifier la pièce
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partCode">Code de la pièce</Label>
              <Input
                id="partCode"
                value={formData.partCode}
                onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partName">Nom de la pièce (Anglais)</Label>
            <Input
              id="partName"
              value={formData.partName}
              onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partNameFrench">Nom de la pièce (Français)</Label>
            <Input
              id="partNameFrench"
              value={formData.partNameFrench}
              onChange={(e) => setFormData({ ...formData, partNameFrench: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voitureId">Véhicule assigné</Label>
            <Select
              value={formData.voitureId}
              onValueChange={(value) => setFormData({ ...formData, voitureId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un véhicule" />
              </SelectTrigger>
              <SelectContent>
                {voitures.map((voiture) => (
                  <SelectItem key={voiture.id} value={voiture.id}>
                    {voiture.voitureModel?.model || "Modèle inconnu"} - {voiture.couleur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Modification..." : "Modifier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
