import { NextRequest, NextResponse } from "next/server";
import { createRendezVous, getRendezVousByUser } from "@/lib/actions/rendezvous";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId requis" },
        { status: 400 }
      );
    }
    const result = await getRendezVousByUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API getRendezVous error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Middleware is skipped for this route to avoid fetch failures; form is behind auth
    const body = await request.json();
    const date = body.date ? new Date(body.date) : undefined;
    if (!date || isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: "Date invalide" },
        { status: 400 }
      );
    }

    const result = await createRendezVous({
      date,
      statut: body.statut || "EN_ATTENTE",
      clientId: body.clientId || undefined,
      clientEntrepriseId: body.clientEntrepriseId || undefined,
      voitureIds: body.voitureIds,
      voitureModelIds: body.voitureModelIds,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API createRendezVous error:", error);
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
