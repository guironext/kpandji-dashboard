"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Car, FileText, Save, X, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTableauChuteRendezVous } from '@/lib/actions/tableau-chute';
import { useUser } from '@clerk/nextjs';

interface RapportRendezVous {
  id: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client?: string | null;
  profession_societe?: string | null;
  type_client: string;
  modeles_discutes?: unknown;
  motivations_achat?: string | null;
  points_positifs?: string | null;
  objections_freins?: string | null;
  degre_interet?: string | null;
  decision_attendue?: string | null;
}

interface TableauChuteRendezVousDialogProps {
  rapport: RapportRendezVous;
  onSuccess?: () => void;
  disabled?: boolean;
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

export function TableauChuteRendezVousDialog({ 
  rapport, 
  onSuccess,
  disabled
}: TableauChuteRendezVousDialogProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedMonth) {
      toast.error('Veuillez sélectionner un mois');
      return;
    }

    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setSaving(true);
    try {
      const result = await createTableauChuteRendezVous({
        rapportRendezVousId: rapport.id,
        mois_chute: selectedMonth,
        modeles_discutes: rapport.modeles_discutes,
        clerkUserId: user.id,
      });

      if (result.success) {
        toast.success('Tableau de chute créé avec succès');
        setOpen(false);
        setSelectedMonth('');
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving tableau chute:', error);
      toast.error('Erreur lors de la sauvegarde du tableau de chute');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMonth('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
          disabled={disabled}
        >
          <Table2 className="h-4 w-4 mr-2" />
          Tableau de chute
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table2 className="h-5 w-5" />
            Créer un Tableau de Chute
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Client Information */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Informations sur le client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <strong>Nom:</strong> {rapport.nom_prenom_client}
                </div>
                <div>
                  <strong>Téléphone:</strong> {rapport.telephone_client}
                </div>
                <div>
                  <strong>Email:</strong> {rapport.email_client || 'Non renseigné'}
                </div>
                <div>
                  <strong>Type:</strong> {rapport.type_client}
                </div>
                {rapport.profession_societe && (
                  <div className="md:col-span-2">
                    <strong>Profession/Société:</strong> {rapport.profession_societe}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Modèles discutés */}
          {(rapport.modeles_discutes as unknown[])?.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-600" />
                  Modèles discutés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Modèle</th>
                        <th className="text-left p-2">Motorisation</th>
                        <th className="text-left p-2">Transmission</th>
                        <th className="text-left p-2">Couleur</th>
                        <th className="text-left p-2">Observation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rapport.modeles_discutes as unknown[])?.map((modele: unknown, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{(modele as Record<string, unknown>).modele as string || ''}</td>
                          <td className="p-2">{(modele as Record<string, unknown>).motorisation as string || ''}</td>
                          <td className="p-2">{(modele as Record<string, unknown>).transmission as string || ''}</td>
                          <td className="p-2">{(modele as Record<string, unknown>).couleur as string || ''}</td>
                          <td className="p-2">{(modele as Record<string, unknown>).observation as string || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impressions et besoins du client */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Impressions et besoins du client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rapport.motivations_achat && (
                <div>
                  <strong>Motivations d&apos;achat:</strong>
                  <p className="mt-1 text-gray-700">{rapport.motivations_achat}</p>
                </div>
              )}
              {rapport.points_positifs && (
                <div>
                  <strong>Points positifs:</strong>
                  <p className="mt-1 text-gray-700">{rapport.points_positifs}</p>
                </div>
              )}
              {rapport.objections_freins && (
                <div>
                  <strong>Objections/Freins:</strong>
                  <p className="mt-1 text-gray-700">{rapport.objections_freins}</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <strong>Intérêt:</strong>
                  <Badge variant={rapport.degre_interet === 'Fort' ? 'default' : rapport.degre_interet === 'Moyen' ? 'secondary' : 'outline'}>
                    {rapport.degre_interet || 'Non renseigné'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <strong>Décision:</strong>
                  <Badge variant={rapport.decision_attendue === 'Immédiate' ? 'default' : 'secondary'}>
                    {rapport.decision_attendue || 'Non renseigné'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Month Selection */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Sélection du mois de chute
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Mois de chute:
                </label>
                <Select
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
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
              disabled={saving || !selectedMonth}
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
