import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pieces = await prisma.pieceSAV.findMany({
      orderBy: [{ nom: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        nom: true,
        model_voiture: true,
        marque_piece: true,
        part_code: true,
        quantite_restante: true,
        quantite_sortie: true,
      },
    });
    return NextResponse.json({ success: true, data: pieces });
  } catch (error) {
    console.error("API piece-sav GET error:", error);
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
    const body = await request.json();
    const {
      nom,
      model_voiture,
      marque_piece,
      part_code,
      description,
      prix_achat,
      prix_vente,
      quantite_entree,
    } = body;

    if (typeof nom !== "string" || !nom.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Le nom de la pièce est requis",
        },
        { status: 400 }
      );
    }

    let qe = 0;
    if (quantite_entree != null && quantite_entree !== "") {
      const n = Number(quantite_entree);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return NextResponse.json(
          {
            success: false,
            error: "La quantité entrée doit être un entier positif ou zéro",
          },
          { status: 400 }
        );
      }
      qe = n;
    }

    const piece = await prisma.pieceSAV.create({
      data: {
        nom: nom.trim(),
        quantite_entree: qe,
        quantite_restante: qe,
        model_voiture:
          typeof model_voiture === "string" && model_voiture.trim()
            ? model_voiture.trim()
            : null,
        marque_piece:
          typeof marque_piece === "string" && marque_piece.trim()
            ? marque_piece.trim()
            : null,
        part_code:
          typeof part_code === "string" && part_code.trim()
            ? part_code.trim()
            : null,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        prix_achat:
          prix_achat != null && prix_achat !== ""
            ? String(prix_achat)
            : undefined,
        prix_vente:
          prix_vente != null && prix_vente !== ""
            ? String(prix_vente)
            : undefined,
      },
    });

    return NextResponse.json({ success: true, data: piece });
  } catch (error) {
    console.error("API piece-sav POST error:", error);
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
