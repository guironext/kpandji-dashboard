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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PackageIcon, MapPinIcon, Save } from "lucide-react";
import { toast } from "sonner";

interface Storage {
  id: string;
  storageNumber: string | null;
  porte_Number: string | null;
  rayon: string | null;
  etage: string | null;
  caseNumber: string | null;
  spareParts: {
    id: string;
    partCode: string;
    partName: string;
    partNameFrench: string | null;
    quantity: number;
    status: string;
    voiture?: {
      voitureModel?: {
        model: string;
      };
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

interface SparePart {
  id: string;
  partCode: string;
  partName: string;
  partNameFrench: string | null;
  quantity: number;
  status: string;
  voiture: {
    voitureModel?: {
      model: string;
    };
  };
}

interface StorageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparePart: SparePart | null;
  onSuccess?: () => void;
}

export default function StorageDialog({ 
  open, 
  onOpenChange, 
  sparePart, 
  onSuccess 
}: StorageDialogProps) {
  const [storages, setStorages] = useState<Storage[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newStorage, setNewStorage] = useState({
    storageNumber: "",
    porte_Number: "",
    rayon: "",
    etage: "",
    caseNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStorages();
    }
  }, [open]);

  const fetchStorages = async () => {
    try {
      setLoading(true);
      // Temporarily skip API call and show empty list
      setStorages([]);
    } catch (error) {
      console.error('Failed to fetch storages:', error);
      setStorages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sparePart) return;

    if (isCreatingNew) {
      // Create new storage and assign spare part
      try {
        setSaving(true);
        const response = await fetch('/api/storage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStorage),
        });

        if (!response.ok) throw new Error('Failed to create storage');

        const createdStorage = await response.json();
        
        // Assign spare part to the new storage
        const assignResponse = await fetch('/api/spare-parts', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: sparePart.id,
            storageId: createdStorage.id,
          }),
        });

        if (!assignResponse.ok) throw new Error('Failed to assign spare part');

        toast.success('Zone de stockage créée et pièce assignée avec succès');
        onSuccess?.();
        onOpenChange(false);
        resetForm();
      } catch (error) {
        console.error('Error saving storage:', error);
        toast.error('Erreur lors de la sauvegarde');
      } finally {
        setSaving(false);
      }
    } else {
      // Assign spare part to existing storage
      if (!selectedStorage) {
        toast.error('Veuillez sélectionner une zone de stockage');
        return;
      }

      try {
        setSaving(true);
        const response = await fetch('/api/spare-parts', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: sparePart.id,
            storageId: selectedStorage,
          }),
        });

        if (!response.ok) throw new Error('Failed to assign spare part');

        toast.success('Pièce assignée à la zone de stockage avec succès');
        onSuccess?.();
        onOpenChange(false);
        resetForm();
      } catch (error) {
        console.error('Error assigning spare part:', error);
        toast.error('Erreur lors de l\'assignation');
      } finally {
        setSaving(false);
      }
    }
  };

  const resetForm = () => {
    setSelectedStorage("");
    setIsCreatingNew(false);
    setNewStorage({
      storageNumber: "",
      porte_Number: "",
      rayon: "",
      etage: "",
      caseNumber: "",
    });
  };

  const getStorageDisplayName = (storage: Storage) => {
    const parts = [];
    if (storage.storageNumber) parts.push(`Zone ${storage.storageNumber}`);
    if (storage.porte_Number) parts.push(`Porte ${storage.porte_Number}`);
    if (storage.rayon) parts.push(`Rayon ${storage.rayon}`);
    if (storage.etage) parts.push(`Étage ${storage.etage}`);
    if (storage.caseNumber) parts.push(`Casier ${storage.caseNumber}`);
    
    return parts.length > 0 ? parts.join(' - ') : `Storage ${storage.id.slice(0, 8)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PackageIcon className="w-5 h-5 text-blue-600" />
            </div>
            Ranger en Stockage
          </DialogTitle>
          <DialogDescription>
            Assigner la pièce à une zone de stockage existante ou créer une nouvelle zone
          </DialogDescription>
        </DialogHeader>

        {sparePart && (
          <div className="space-y-6">
            {/* Spare Part Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations de la pièce</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Code pièce</Label>
                    <p className="font-mono font-bold text-blue-600">{sparePart.partCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nom</Label>
                    <p className="font-semibold">{sparePart.partName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nom français</Label>
                    <p className="text-gray-600">{sparePart.partNameFrench || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Quantité</Label>
                    <Badge variant="outline" className="font-bold">
                      {sparePart.quantity}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Modèle véhicule</Label>
                    <p className="text-gray-600">
                      {sparePart.voiture?.voitureModel?.model || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Statut</Label>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {sparePart.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5" />
                  Zone de stockage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant={!isCreatingNew ? "default" : "outline"}
                    onClick={() => setIsCreatingNew(false)}
                    className="flex-1"
                  >
                    Sélectionner existante
                  </Button>
                  <Button
                    variant={isCreatingNew ? "default" : "outline"}
                    onClick={() => setIsCreatingNew(true)}
                    className="flex-1"
                  >
                    Créer nouvelle
                  </Button>
                </div>

                {!isCreatingNew ? (
                  <div className="space-y-3">
                    <Label>Zones de stockage disponibles</Label>
                    {loading ? (
                      <p className="text-gray-500">Chargement...</p>
                    ) : storages.length === 0 ? (
                      <p className="text-gray-500">Aucune zone de stockage disponible</p>
                    ) : (
                      <div className="grid gap-2 max-h-48 overflow-y-auto">
                        {storages.map((storage) => (
                          <div
                            key={storage.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedStorage === storage.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedStorage(storage.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{getStorageDisplayName(storage)}</p>
                                <p className="text-sm text-gray-500">
                                  {storage.spareParts.length} pièce{storage.spareParts.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="w-4 h-4 border-2 rounded-full border-gray-300">
                                {selectedStorage === storage.id && (
                                  <div className="w-full h-full bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label>Nouvelles informations de stockage</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="storageNumber">Numéro de stockage</Label>
                        <Input
                          id="storageNumber"
                          value={newStorage.storageNumber}
                          onChange={(e) => setNewStorage(prev => ({ ...prev, storageNumber: e.target.value }))}
                          placeholder="ex: ST001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="porte_Number">Numéro de porte</Label>
                        <Input
                          id="porte_Number"
                          value={newStorage.porte_Number}
                          onChange={(e) => setNewStorage(prev => ({ ...prev, porte_Number: e.target.value }))}
                          placeholder="ex: P01"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rayon">Rayon</Label>
                        <Input
                          id="rayon"
                          value={newStorage.rayon}
                          onChange={(e) => setNewStorage(prev => ({ ...prev, rayon: e.target.value }))}
                          placeholder="ex: R01"
                        />
                      </div>
                      <div>
                        <Label htmlFor="etage">Étage</Label>
                        <Input
                          id="etage"
                          value={newStorage.etage}
                          onChange={(e) => setNewStorage(prev => ({ ...prev, etage: e.target.value }))}
                          placeholder="ex: E01"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="caseNumber">Numéro de casier</Label>
                        <Input
                          id="caseNumber"
                          value={newStorage.caseNumber}
                          onChange={(e) => setNewStorage(prev => ({ ...prev, caseNumber: e.target.value }))}
                          placeholder="ex: C001"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

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
            disabled={saving || (!isCreatingNew && !selectedStorage)}
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
