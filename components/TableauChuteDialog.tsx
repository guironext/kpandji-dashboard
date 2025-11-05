"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Building2, Save, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createTableauChute } from '@/lib/actions/tableau-chute';
import { useUser } from '@clerk/nextjs';

interface Client {
  id: string;
  nom?: string;
  nom_entreprise?: string;
  telephone: string;
  email?: string | null;
  type: 'client' | 'client_entreprise';
}

interface TableauChuteDialogProps {
  clients: Client[];
  rapportId: string;
  voitureId?: string;
  rendezVousId: string;
  onSuccess?: () => void;
  isDisabled?: boolean;
}

const MONTHS = [
  { value: 'janvier', label: 'Janvier' },
  { value: 'fevrier', label: 'Février' },
  { value: 'mars', label: 'Mars' },
  { value: 'avril', label: 'Avril' },
  { value: 'mai', label: 'Mai' },
  { value: 'juin', label: 'Juin' },
  { value: 'juillet', label: 'Juillet' },
  { value: 'aout', label: 'Août' },
  { value: 'septembre', label: 'Septembre' },
  { value: 'octobre', label: 'Octobre' },
  { value: 'novembre', label: 'Novembre' },
  { value: 'decembre', label: 'Décembre' },
];

export function TableauChuteDialog({ 
  clients, 
  rapportId, 
  voitureId, 
  rendezVousId, 
  onSuccess,
  isDisabled = false
}: TableauChuteDialogProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleMonthChange = (clientId: string, month: string) => {
    setSelectedMonths(prev => ({
      ...prev,
      [clientId]: month
    }));
  };

  const handleSave = async () => {
    if (!clients.length) {
      toast.error('Aucun client sélectionné');
      return;
    }

    if (!voitureId) {
      toast.error('Aucune voiture associée à ce rapport. Veuillez d\'abord associer une voiture au rapport.');
      return;
    }

    if (!rendezVousId) {
      toast.error('Aucun rendez-vous associé à ce rapport');
      return;
    }

    const clientsWithoutMonth = clients.filter(client => !selectedMonths[client.id]);
    if (clientsWithoutMonth.length > 0) {
      toast.error('Veuillez sélectionner un mois pour tous les clients');
      return;
    }

    setSaving(true);
    try {
      const promises = clients.map(async (client) => {
        const result = await createTableauChute({
          mois_chute: selectedMonths[client.id],
          rendezVousId,
          clientId: client.id,
          voitureId,
          clerkUserId: user?.id || '',
        });

        if (!result.success) {
          throw new Error(`Erreur pour ${client.type === 'client' ? client.nom : client.nom_entreprise}: ${result.error || 'Erreur lors de la sauvegarde'}`);
        }

        return result.data;
      });

      await Promise.all(promises);
      
      toast.success('Tableau chute créé avec succès');
      setOpen(false);
      setSelectedMonths({});
      onSuccess?.();
    } catch (error) {
      console.error('Error saving tableau chute:', error);
      toast.error('Erreur lors de la sauvegarde du tableau chute');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMonths({});
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`${
            isDisabled 
              ? voitureId 
                ? 'border-green-300 bg-green-50 text-green-700 cursor-not-allowed'
                : 'border-orange-300 bg-orange-50 text-orange-700 cursor-not-allowed'
              : 'border-gray-300 hover:border-blue-500 hover:text-blue-600'
          }`}
          disabled={isDisabled}
        >
          {isDisabled ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
          {isDisabled 
            ? (voitureId ? 'Tableau Chute (Créé)' : 'Tableau Chute (Pas de voiture)')
            : 'Tableau Chute'
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Créer un Tableau Chute
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sélectionnez le mois de chute pour chaque client sélectionné.
          </p>
          
          <div className="grid gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {client.type === 'client' ? (
                        <User className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Building2 className="h-5 w-5 text-green-600" />
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          {client.type === 'client' ? client.nom : client.nom_entreprise}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{client.telephone}</span>
                          {client.email && <span>• {client.email}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant={client.type === 'client' ? 'default' : 'secondary'}>
                      {client.type === 'client' ? 'Particulier' : 'Entreprise'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      Mois de chute:
                    </label>
                    <Select
                      value={selectedMonths[client.id] || ''}
                      onValueChange={(value) => handleMonthChange(client.id, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sélectionner un mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || clients.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
