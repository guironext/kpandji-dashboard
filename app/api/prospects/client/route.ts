import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/actions/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let userId = (await auth()).userId;
    const body = await request.json();
    // Fallback: use userId from body when auth() returns null (e.g. fetch from client)
    if (!userId && body.userId) {
      userId = body.userId;
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const result = await createClient({
      nom: body.nom,
      email: body.email || undefined,
      telephone: body.telephone,
      entreprise: body.entreprise || undefined,
      secteur_activite: body.secteur_activite || undefined,
      localisation: body.localisation || undefined,
      commercial: body.commercial || undefined,
      status_client: body.status_client || "PROSPECT",
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API createClient error:", error);
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
