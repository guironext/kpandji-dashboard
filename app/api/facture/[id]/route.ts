import { NextRequest, NextResponse } from "next/server";
import { getFactureById, updateFacture } from "@/lib/actions/facture";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getFactureById(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API getFacture error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement de la facture",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await updateFacture(id, {
      clientId: body.clientId,
      nbr_voiture_commande: body.nbr_voiture_commande,
      prix_unitaire: body.prix_unitaire,
      remise: body.remise,
      tva: body.tva,
      avance_payee: body.avance_payee,
      date_facture: body.date_facture
        ? new Date(body.date_facture)
        : undefined,
      date_echeance: body.date_echeance
        ? new Date(body.date_echeance)
        : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API updateFacture error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la modification de la facture",
      },
      { status: 500 }
    );
  }
}
