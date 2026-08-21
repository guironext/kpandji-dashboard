import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nom, description, prix_unitaire, catergorieDiagnosticId } = body;

    const updateData: Record<string, unknown> = {};
    if (nom !== undefined) updateData.nom = nom.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (prix_unitaire !== undefined) updateData.prix_unitaire = Number(prix_unitaire);
    if (catergorieDiagnosticId !== undefined) updateData.catergorieDiagnosticId = catergorieDiagnosticId;

    const detail = await prisma.detailDiagnostic.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error("API updateDetailDiagnostic error:", error);
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
    const { id } = await params;
    const existing = await prisma.detailDiagnostic.findUnique({
      where: { id },
      select: {
        diagnosticArriveeId: true,
        reparationId: true,
        garantieSAVId: true,
      },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Détail diagnostique introuvable" },
        { status: 404 },
      );
    }
    if (existing.diagnosticArriveeId || existing.reparationId || existing.garantieSAVId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ce détail est déjà utilisé sur un diagnostic véhicule et ne peut pas être supprimé",
        },
        { status: 409 },
      );
    }
    await prisma.detailDiagnostic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API deleteDetailDiagnostic error:", error);
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
