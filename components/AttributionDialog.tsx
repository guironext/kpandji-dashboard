"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Save } from "lucide-react";
import { toast } from "sonner";

interface SparePart {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  status: string;
}

interface Equipe {
  id: string;
  nomEquipe: string;
  activite: string;
  chefEquipe: {
    nom: string;
    prenoms: string;
  };
}

interface AttributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparePart: SparePart | null;
  montageId: string;
  onSuccess?: () => void;
}

export default function AttributionDialog({ 
  open, 
  onOpenChange, 
  sparePart, 
  montageId,
  onSuccess 
}: AttributionDialogProps) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [formData, setFormData] = useState({
    qte_commandee: "",
    qte_attribue: "",
    qte_restante: "",
    equipe_montage: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEquipes();
      if (sparePart) {
        setFormData({
          qte_commandee: sparePart.quantity.toString(),
          qte_attribue: "",
          qte_restante: sparePart.quantity.toString(),
          equipe_montage: "",
        });
      }
    }
  }, [open, sparePart]);

  const fetchEquipes = async () => {
    try {
      const response = await fetch('/api/equipes');
      const data = await response.json();
      setEquipes(data);
    } catch (error) {
      console.error('Failed to fetch equipes:', error);
      toast.error('Erreur lors du chargement des équipes');
    }
  };

  const handleSave = async () => {
    if (!sparePart || !formData.qte_attribue || !formData.equipe_montage) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/montage-spare-parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          montageId,
          sparePartIds: [sparePart.id],
          qte_commandee: formData.qte_commandee,
          qte_attribue: formData.qte_attribue,
          qte_restante: formData.qte_restante,
          equipe_montage: formData.equipe_montage,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Attribution créée avec succès');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erreur lors de la création de l\'attribution');
      }
    } catch (error) {
      console.error('Error saving attribution:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleQteAttribueChange = (value: string) => {
    const qteAttribue = parseInt(value) || 0;
    const qteCommandee = parseInt(formData.qte_commandee) || 0;
    const qteRestante = Math.max(0, qteCommandee - qteAttribue);
    
    setFormData(prev => ({
      ...prev,
      qte_attribue: value,
      qte_restante: qteRestante.toString()
    }));
  };

  if (!sparePart) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Attribuer Pièce de Rechange
          </DialogTitle>
          <DialogDescription>
            Attribuer la pièce {sparePart.partCode} - {sparePart.partName} à une équipe de montage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Spare Part Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de la Pièce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Code Pièce</Label>
                  <p className="font-mono font-semibold">{sparePart.partCode}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Quantité Totale</Label>
                  <p className="font-semibold">{sparePart.quantity}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Nom de la Pièce</Label>
                <p className="font-semibold">{sparePart.partName}</p>
                {sparePart.partNameFrench && (
                  <p className="text-sm text-gray-600">{sparePart.partNameFrench}</p>
                )}
              </div>
              <div>
                <Badge className={sparePart.status === 'VERIFIE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                  {sparePart.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Attribution Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="qte_commandee">Quantité Commandée</Label>
                  <Input
                    id="qte_commandee"
                    value={formData.qte_commandee}
                    onChange={(e) => setFormData(prev => ({ ...prev, qte_commandee: e.target.value }))}
                    type="number"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="qte_attribue">Quantité Attribuée *</Label>
                  <Input
                    id="qte_attribue"
                    value={formData.qte_attribue}
                    onChange={(e) => handleQteAttribueChange(e.target.value)}
                    type="number"
                    min="0"
                    max={formData.qte_commandee}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="qte_restante">Quantité Restante</Label>
                  <Input
                    id="qte_restante"
                    value={formData.qte_restante}
                    type="number"
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="equipe_montage">Équipe de Montage *</Label>
                <Select
                  value={formData.equipe_montage}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, equipe_montage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{equipe.nomEquipe}</span>
                          <span className="text-sm text-gray-500">
                            {equipe.activite} - Chef: {equipe.chefEquipe.nom} {equipe.chefEquipe.prenoms}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !formData.qte_attribue || !formData.equipe_montage}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


