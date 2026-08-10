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
    const { nom, description } = body;

    const updateData: Record<string, unknown> = {};
    if (nom !== undefined) updateData.nom = nom.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const category = await prisma.catergorieDiagnostic.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("API updateCatergorieDiagnostic error:", error);
    const isNotFound =
      typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2025";
    return NextResponse.json(
      {
        success: false,
        error: isNotFound
          ? "Catégorie introuvable"
          : error instanceof Error ? error.message : "Erreur lors de la mise à jour",
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.catergorieDiagnostic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API deleteCatergorieDiagnostic error:", error);
    // P2025 = record not found
    const isNotFound =
      typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2025";
    return NextResponse.json(
      {
        success: false,
        error: isNotFound
          ? "Catégorie introuvable ou déjà supprimée"
          : error instanceof Error ? error.message : "Erreur lors de la suppression",
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}
