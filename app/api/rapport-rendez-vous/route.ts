import { NextResponse } from "next/server";
import { createRapportRendezVousComplet } from "@/lib/actions/rendezvous";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await createRapportRendezVousComplet({
      rendezVousId: body.rendezVousId,
      clientId: body.clientId,
      clientEntrepriseId: body.clientEntrepriseId,
      date_rendez_vous: body.date_rendez_vous,
      heure_rendez_vous: body.heure_rendez_vous,
      lieu_rendez_vous: body.lieu_rendez_vous,
      lieu_autre: body.lieu_autre,
      conseiller_commercial: body.conseiller_commercial,
      duree_rendez_vous: body.duree_rendez_vous,
      nom_prenom_client: body.nom_prenom_client,
      telephone_client: body.telephone_client,
      email_client: body.email_client,
      profession_societe: body.profession_societe,
      type_client: body.type_client,
      Com_Pres: body.Com_Pres,
      Com_Drive: body.Com_Drive,
      Com_Achat: body.Com_Achat,
      Com_Livre: body.Com_Livre,
      Com_APV: body.Com_APV,
      Com_Office: body.Com_Office,
      Com_Close: body.Com_Close,
      objet_autre: body.objet_autre,
      modeles_discutes: body.modeles_discutes || [],
      motivations_achat: body.motivations_achat,
      points_positifs: body.points_positifs,
      objections_freins: body.objections_freins,
      degre_interet: body.degre_interet,
      decision_attendue: body.decision_attendue,
      devis_offre_remise: body.devis_offre_remise,
      propositions_faites: body.propositions_faites,
      reference_offre: body.reference_offre,
      financement_propose: body.financement_propose,
      assurance_entretien: body.assurance_entretien,
      reprise_ancien_vehicule: body.reprise_ancien_vehicule,
      suivi_actions: body.suivi_actions,
      actions_suivi: body.actions_suivi || [],
      commentaire_global: body.commentaire_global,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API createRapportRendezVous error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création du rapport",
      },
      { status: 500 }
    );
  }
}
