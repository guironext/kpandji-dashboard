import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateClient, deleteClient } from "@/lib/actions/client";
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
    const result = await updateClient(id, {
      nom: body.nom,
      email: body.email,
      telephone: body.telephone,
      entreprise: body.entreprise,
      secteur_activite: body.secteur_activite,
      localisation: body.localisation,
      commercial: body.commercial,
      status_client: body.status_client,
    });

    revalidatePath("/commercial/prospects");
    return NextResponse.json(result);
  } catch (error) {
    console.error("API updateClient error:", error);
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
    const result = await deleteClient(id);

    revalidatePath("/commercial/prospects");
    return NextResponse.json(result);
  } catch (error) {
    console.error("API deleteClient error:", error);
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
