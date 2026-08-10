import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClientEntreprise } from "@/lib/actions/client_entreprise";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let userId = (await auth()).userId;
    const body = await request.json();
    if (!userId && body.userId) {
      userId = body.userId;
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const result = await createClientEntreprise({
      nom_entreprise: body.nom_entreprise,
      sigle: body.sigle || undefined,
      email: body.email || undefined,
      telephone: body.telephone,
      nom_personne_contact: body.nom_personne_contact || undefined,
      fonction_personne_contact: body.fonction_personne_contact || undefined,
      email_personne_contact: body.email_personne_contact || undefined,
      telephone_personne_contact: body.telephone_personne_contact || undefined,
      localisation: body.localisation || undefined,
      secteur_activite: body.secteur_activite || undefined,
      flotte_vehicules: body.flotte_vehicules || false,
      flotte_vehicules_description:
        body.flotte_vehicules_description || undefined,
      commercial: body.commercial || undefined,
      status_client: body.status_client || "PROSPECT",
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API createClientEntreprise error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 }
    );
  }
}
