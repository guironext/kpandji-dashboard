import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isPrismaNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.marqueVoiture !== undefined) {
      updateData.marqueVoiture =
        typeof body.marqueVoiture === "string" && body.marqueVoiture.trim()
          ? body.marqueVoiture.trim()
          : "KPANDJI";
    }
    if (body.modelVoiture !== undefined) {
      const modelVoiture =
        typeof body.modelVoiture === "string" ? body.modelVoiture.trim() : "";
      if (!modelVoiture) {
        return NextResponse.json(
          { success: false, error: "Le modèle est requis" },
          { status: 400 }
        );
      }
      updateData.modelVoiture = modelVoiture;
    }
    if (body.couleur !== undefined) {
      const couleur =
        typeof body.couleur === "string" ? body.couleur.trim() : "";
      if (!couleur) {
        return NextResponse.json(
          { success: false, error: "La couleur est requise" },
          { status: 400 }
        );
      }
      updateData.couleur = couleur;
    }
    if (body.chassisNumber !== undefined) {
      updateData.chassisNumber =
        typeof body.chassisNumber === "string" && body.chassisNumber.trim()
          ? body.chassisNumber.trim()
          : null;
    }
    if (body.immatriculation !== undefined) {
      updateData.immatriculation =
        typeof body.immatriculation === "string" && body.immatriculation.trim()
          ? body.immatriculation.trim()
          : null;
    }

    const item = await prisma.voitureSavGarantie.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { VoitureSAV: true } },
      },
    });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("API updateVoitureSavGarantie error:", error);
    const notFound = isPrismaNotFound(error);
    return NextResponse.json(
      {
        success: false,
        error: notFound
          ? "Véhicule sous garantie introuvable"
          : error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour",
      },
      { status: notFound ? 404 : 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.voitureSavGarantie.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API deleteVoitureSavGarantie error:", error);
    const notFound = isPrismaNotFound(error);
    return NextResponse.json(
      {
        success: false,
        error: notFound
          ? "Véhicule sous garantie introuvable ou déjà supprimé"
          : error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
      },
      { status: notFound ? 404 : 500 }
    );
  }
}
