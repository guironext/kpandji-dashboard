"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TableauChuteReporterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableauChuteId: string | null;
  onUpdate: () => void;
}

export function TableauChuteReporterDialog({ 
  open, 
  onOpenChange, 
  tableauChuteId,
  onUpdate 
}: TableauChuteReporterDialogProps) {
  const [moisChute, setMoisChute] = useState('');
  const [loading, setLoading] = useState(false);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const years = [2025, 2026, 2027, 2028, 2029];

  // Generate month-year combinations starting from December 2025
  const monthYearOptions = [];
  for (const year of years) {
    if (year === 2025) {
      // For 2025, only include December
      monthYearOptions.push({ value: 'Décembre 2025', label: 'Décembre 2025' });
    } else {
      // For other years, include all months
      for (const month of months) {
        monthYearOptions.push({ value: `${month} ${year}`, label: `${month} ${year}` });
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableauChuteId || !moisChute) {
      toast.error("Veuillez sélectionner un mois");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tableau-chute/update-mois', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tableauChuteId, mois_chute: moisChute }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Mois de chute mis à jour avec succès");
        onUpdate();
        onOpenChange(false);
        setMoisChute('');
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error('Error updating mois chute:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reporter le rendez-vous</DialogTitle>
          <DialogDescription>
            Sélectionnez le nouveau mois de chute pour ce rendez-vous
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mois_chute">Mois de Chute</Label>
            <Select value={moisChute} onValueChange={setMoisChute} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un mois" />
              </SelectTrigger>
              <SelectContent>
                {monthYearOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
