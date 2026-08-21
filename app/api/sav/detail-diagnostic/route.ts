import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogOnly = searchParams.get("catalog") === "1";

    const details = await prisma.detailDiagnostic.findMany({
      where: catalogOnly
        ? {
            diagnosticArriveeId: null,
            reparationId: null,
            garantieSAVId: null,
          }
        : undefined,
      include: {
        catergorieDiagnostic: true,
      },
      orderBy: [{ catergorieDiagnostic: { nom: "asc" } }, { nom: "asc" }],
    });
    return NextResponse.json({ success: true, data: details });
  } catch (error) {
    console.error("API getDetailDiagnostic error:", error);
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
    const { nom, description, prix_unitaire, catergorieDiagnosticId } = body;

    if (!nom?.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom est requis" },
        { status: 400 }
      );
    }
    if (!catergorieDiagnosticId) {
      return NextResponse.json(
        { success: false, error: "La catégorie est requise" },
        { status: 400 }
      );
    }

    const prix = prix_unitaire != null ? Number(prix_unitaire) : 0;

    const detail = await prisma.detailDiagnostic.create({
      data: {
        nom: nom.trim(),
        description: description?.trim() || null,
        prix_unitaire: prix,
        catergorieDiagnosticId,
        diagnosticArriveeId: null,
      },
    });
    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error("API createDetailDiagnostic error:", error);
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
