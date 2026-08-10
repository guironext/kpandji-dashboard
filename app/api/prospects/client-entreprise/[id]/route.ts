import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  updateClientEntreprise,
  deleteClientEntreprise,
} from "@/lib/actions/client_entreprise";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let userId = (await auth()).userId;
    const body = await request.json();
    if (!userId && body.userId) userId = body.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await updateClientEntreprise(id, {
      nom_entreprise: body.nom_entreprise,
      sigle: body.sigle,
      email: body.email,
      telephone: body.telephone,
      nom_personne_contact: body.nom_personne_contact,
      fonction_personne_contact: body.fonction_personne_contact,
      email_personne_contact: body.email_personne_contact,
      telephone_personne_contact: body.telephone_personne_contact,
      localisation: body.localisation,
      secteur_activite: body.secteur_activite,
      flotte_vehicules: body.flotte_vehicules,
      flotte_vehicules_description: body.flotte_vehicules_description,
      commercial: body.commercial,
      status_client: body.status_client,
    });

    revalidatePath("/commercial/prospects");
    return NextResponse.json(result);
  } catch (error) {
    console.error("API updateClientEntreprise error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la mise à jour",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await auth()).userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await deleteClientEntreprise(id);

    revalidatePath("/commercial/prospects");
    return NextResponse.json(result);
  } catch (error) {
    console.error("API deleteClientEntreprise error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la suppression",
      },
      { status: 500 }
    );
  }
}
