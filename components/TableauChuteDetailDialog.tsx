"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TableauChuteRendezVousData {
  id: string;
  mois_chute: string;
  modeles_discutes: unknown;
  rapportRendezVous: {
    id: string;
    nom_prenom_client: string;
    telephone_client: string;
    email_client?: string;
    profession_societe?: string;
    type_client: string;
    motivations_achat?: string;
    points_positifs?: string;
    objections_freins?: string;
    degre_interet?: string;
    decision_attendue?: string;
    commentaire_global?: string;
    client?: {
      id: string;
      nom: string;
      telephone: string;
    };
    clientEntreprise?: {
      id: string;
      nom_entreprise: string;
      telephone: string;
    };
    rendezVous: {
      id: string;
      date: string;
      statut: string;
    };
  };
}

interface TableauChuteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TableauChuteRendezVousData | null;
}

export function TableauChuteDetailDialog({ open, onOpenChange, data }: TableauChuteDetailDialogProps) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du Rapport de Rendez-vous</DialogTitle>
          <DialogDescription>
            Informations complètes sur le client et le rendez-vous
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informations Client
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Nom complet</p>
                  <p className="font-medium">{data.rapportRendezVous.nom_prenom_client}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Type de client</p>
                  <Badge variant="outline">{data.rapportRendezVous.type_client}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Téléphone</p>
                  <p className="font-medium">{data.rapportRendezVous.telephone_client}</p>
                </div>
                {data.rapportRendezVous.email_client && (
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{data.rapportRendezVous.email_client}</p>
                  </div>
                )}
                {data.rapportRendezVous.profession_societe && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Profession / Société</p>
                    <p className="font-medium">{data.rapportRendezVous.profession_societe}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Impressions et Besoins */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Impressions et Besoins du Client
            </h3>
            
            {data.rapportRendezVous.degre_interet && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Degré d&apos;intérêt</p>
                <Badge variant="outline">{data.rapportRendezVous.degre_interet}</Badge>
              </div>
            )}

            {data.rapportRendezVous.decision_attendue && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Décision attendue</p>
                <p className="font-medium">{data.rapportRendezVous.decision_attendue}</p>
              </div>
            )}

            {data.rapportRendezVous.motivations_achat && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-2">Motivations d&apos;achat</p>
                <p className="text-sm">{data.rapportRendezVous.motivations_achat}</p>
              </div>
            )}

            {data.rapportRendezVous.points_positifs && (
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-2">Points positifs</p>
                <p className="text-sm">{data.rapportRendezVous.points_positifs}</p>
              </div>
            )}

            {data.rapportRendezVous.objections_freins && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-2">Objections / Freins</p>
                <p className="text-sm">{data.rapportRendezVous.objections_freins}</p>
              </div>
            )}
          </div>

          {data.rapportRendezVous.commentaire_global && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Commentaire Global
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm">{data.rapportRendezVous.commentaire_global}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
