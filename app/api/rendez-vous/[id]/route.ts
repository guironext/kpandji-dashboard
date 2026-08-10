import { NextRequest, NextResponse } from "next/server";
import { updateRendezVous } from "@/lib/actions/rendezvous";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const date = body.date ? new Date(body.date) : undefined;

    const result = await updateRendezVous(id, {
      date,
      duree: body.duree,
      resume_rendez_vous: body.resume_rendez_vous,
      note: body.note,
      statut: body.statut,
    });

    revalidatePath("/commercial/rendez-vous");
    revalidatePath("/commercial/programme");
    return NextResponse.json(result);
  } catch (error) {
    console.error("API updateRendezVous error:", error);
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
