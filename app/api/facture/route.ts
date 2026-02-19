import { NextRequest, NextResponse } from "next/server";
import {
  createFactureWithMultipleLines,
  getFacturesByUser,
} from "@/lib/actions/facture";

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
    const result = await getFacturesByUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API getFactures error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des factures",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const date_facture = body.date_facture
      ? new Date(body.date_facture)
      : undefined;
    const date_echeance = body.date_echeance
      ? new Date(body.date_echeance)
      : undefined;

    if (!date_facture || isNaN(date_facture.getTime())) {
      return NextResponse.json(
        { success: false, error: "Date de facture invalide" },
        { status: 400 }
      );
    }
    if (!date_echeance || isNaN(date_echeance.getTime())) {
      return NextResponse.json(
        { success: false, error: "Date d'échéance invalide" },
        { status: 400 }
      );
    }
    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: "Utilisateur requis" },
        { status: 400 }
      );
    }
    if (!body.lignes?.length) {
      return NextResponse.json(
        { success: false, error: "Au moins une ligne est requise" },
        { status: 400 }
      );
    }

    const result = await createFactureWithMultipleLines({
      clientId: body.clientId,
      clientEntrepriseId: body.clientEntrepriseId,
      userId: body.userId,
      date_facture,
      date_echeance,
      remise: body.remise ?? 0,
      tva: body.tva ?? 18,
      avance_payee: body.avance_payee ?? 0,
      status_facture: body.status_facture ?? "PROFORMA",
      lignes: body.lignes,
      accessoires: body.accessoires,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API createFacture error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de la création de la facture",
      },
      { status: 500 }
    );
  }
}
