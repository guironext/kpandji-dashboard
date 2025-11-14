"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { updateRapportRendezVousComplet } from '@/lib/actions/rendezvous';
import { RapportRendezVousForm } from './RapportRendezVousForm';
import { Prisma } from '@prisma/client';

interface RapportRendezVous {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  date_rendez_vous: Date;
  heure_rendez_vous: string;
  lieu_rendez_vous: string;
  lieu_autre?: string | null;
  conseiller_commercial: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client?: string | null;
  profession_societe?: string | null;
  type_client: string;
  presentation_gamme: boolean;
  essai_vehicule: boolean;
  negociation_commerciale: boolean;
  livraison_vehicule: boolean;
  service_apres_vente: boolean;
  objet_autre?: string | null;
  modeles_discutes?: unknown;
  motivations_achat?: string | null;
  points_positifs?: string | null;
  objections_freins?: string | null;
  degre_interet?: string | null;
  decision_attendue?: string | null;
  devis_offre_remise: boolean;
  reference_offre?: string | null;
  financement_propose?: string | null;
  assurance_entretien: boolean;
  reprise_ancien_vehicule: boolean;
  actions_suivi?: unknown;
  commentaire_global?: string | null;
  rendezVous?: {
    id: string;
    date: Date;
    statut: string;
  } | null;
  client?: {
    id: string;
    nom: string;
    telephone: string;
    email?: string | null;
    entreprise?: string | null;
  } | null;
  clientEntreprise?: {
    id: string;
    nom_entreprise: string;
    telephone: string;
    email?: string | null;
  } | null;
}

interface EditRapportRendezVousDialogProps {
  rapport: RapportRendezVous;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditRapportRendezVousDialog({ 
  rapport, 
  onSuccess,
  trigger
}: EditRapportRendezVousDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (data: {
    rendezVousId: string;
    clientId?: string;
    clientEntrepriseId?: string;
    date_rendez_vous: string;
    heure_rendez_vous: string;
    lieu_rendez_vous: string;
    lieu_autre?: string;
    conseiller_commercial: string;
    duree_rendez_vous: string;
    nom_prenom_client: string;
    telephone_client: string;
    email_client?: string;
    profession_societe?: string;
    type_client: string;
    presentation_gamme: boolean;
    essai_vehicule: boolean;
    negociation_commerciale: boolean;
    livraison_vehicule: boolean;
    service_apres_vente: boolean;
    objet_autre?: string;
    modeles_discutes: Array<{
      modele: string;
      motorisation: string;
      transmission: string;
      couleur: string;
      observation: string;
    }>;
    motivations_achat?: string;
    points_positifs?: string;
    objections_freins?: string;
    degre_interet?: string;
    decision_attendue?: string;
    devis_offre_remise: boolean;
    reference_offre?: string;
    financement_propose?: string;
    assurance_entretien: boolean;
    reprise_ancien_vehicule: boolean;
    actions_suivi: Array<{
      action: string;
      responsable: string;
      echeance: string;
      statut: string;
    }>;
    commentaire_global?: string;
  }) => {
    try {
      const result = await updateRapportRendezVousComplet(rapport.id, {
        date_rendez_vous: data.date_rendez_vous,
        heure_rendez_vous: data.heure_rendez_vous,
        lieu_rendez_vous: data.lieu_rendez_vous,
        lieu_autre: data.lieu_autre,
        conseiller_commercial: data.conseiller_commercial,
        duree_rendez_vous: data.duree_rendez_vous,
        nom_prenom_client: data.nom_prenom_client,
        telephone_client: data.telephone_client,
        email_client: data.email_client,
        profession_societe: data.profession_societe,
        type_client: data.type_client,
        presentation_gamme: data.presentation_gamme,
        essai_vehicule: data.essai_vehicule,
        negociation_commerciale: data.negociation_commerciale,
        livraison_vehicule: data.livraison_vehicule,
        service_apres_vente: data.service_apres_vente,
        objet_autre: data.objet_autre,
        modeles_discutes: data.modeles_discutes as unknown as Prisma.InputJsonValue[],
        motivations_achat: data.motivations_achat,
        points_positifs: data.points_positifs,
        objections_freins: data.objections_freins,
        degre_interet: data.degre_interet,
        decision_attendue: data.decision_attendue,
        devis_offre_remise: data.devis_offre_remise,
        reference_offre: data.reference_offre,
        financement_propose: data.financement_propose,
        assurance_entretien: data.assurance_entretien,
        reprise_ancien_vehicule: data.reprise_ancien_vehicule,
        actions_suivi: data.actions_suivi as unknown as Prisma.InputJsonValue[],
        commentaire_global: data.commentaire_global,
      });

      if (result.success) {
        toast.success('Rapport modifié avec succès');
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      console.error('Error updating rapport:', error);
      toast.error('Erreur lors de la modification du rapport');
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Create a mock rendezVous object for the form
  const mockRendezVous = {
    id: rapport.rendezVous?.id || '',
    date: rapport.date_rendez_vous,
    client: rapport.client || null,
    clientEntreprise: rapport.clientEntreprise || null,
  };

  // Prepare initial data from rapport
  const initialData = {
    date_rendez_vous: new Date(rapport.date_rendez_vous).toISOString().split('T')[0],
    heure_rendez_vous: rapport.heure_rendez_vous,
    lieu_rendez_vous: rapport.lieu_rendez_vous,
    lieu_autre: rapport.lieu_autre || '',
    conseiller_commercial: rapport.conseiller_commercial,
    duree_rendez_vous: rapport.duree_rendez_vous,
    nom_prenom_client: rapport.nom_prenom_client,
    telephone_client: rapport.telephone_client,
    email_client: rapport.email_client || '',
    profession_societe: rapport.profession_societe || '',
    type_client: rapport.type_client,
    presentation_gamme: rapport.presentation_gamme,
    essai_vehicule: rapport.essai_vehicule,
    negociation_commerciale: rapport.negociation_commerciale,
    livraison_vehicule: rapport.livraison_vehicule,
    service_apres_vente: rapport.service_apres_vente,
    objet_autre: rapport.objet_autre || '',
    modeles_discutes: (rapport.modeles_discutes as Array<{
      modele: string;
      motorisation: string;
      transmission: string;
      couleur: string;
      observation: string;
    }>) || [],
    motivations_achat: rapport.motivations_achat || '',
    points_positifs: rapport.points_positifs || '',
    objections_freins: rapport.objections_freins || '',
    degre_interet: rapport.degre_interet || '',
    decision_attendue: rapport.decision_attendue || '',
    devis_offre_remise: rapport.devis_offre_remise,
    reference_offre: rapport.reference_offre || '',
    financement_propose: rapport.financement_propose || '',
    assurance_entretien: rapport.assurance_entretien,
    reprise_ancien_vehicule: rapport.reprise_ancien_vehicule,
    actions_suivi: (rapport.actions_suivi as Array<{
      action: string;
      responsable: string;
      echeance: string;
      statut: string;
    }>) || [],
    commentaire_global: rapport.commentaire_global || '',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 h-11 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      )}
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Pencil className="h-6 w-6 text-emerald-600" />
            Modifier le rapport de rendez-vous
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <RapportRendezVousForm
            rendezVous={mockRendezVous}
            onClose={handleClose}
            onSubmit={handleSubmit}
            initialData={initialData}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

