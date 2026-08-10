import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Identifiant manquant" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const data: Record<string, string | null> = {};

    if (typeof body.titre === "string") {
      const titre = body.titre.trim();
      if (!titre) {
        return NextResponse.json(
          { success: false, error: "Le titre ne peut pas être vide" },
          { status: 400 },
        );
      }
      data.titre = titre;
    }
    if (typeof body.contenu === "string") {
      data.contenu = body.contenu.trim() || null;
    }
    if (typeof body.observations === "string") {
      data.observations = body.observations.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucune donnée à mettre à jour" },
        { status: 400 },
      );
    }

    const rapport = await prisma.rapportMaintenanceSAV.update({
      where: { id: id.trim() },
      data,
    });

    return NextResponse.json({ success: true, data: rapport });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Rapport introuvable" },
        { status: 404 },
      );
    }
    console.error("API rapport-maintenance PATCH error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la mise à jour",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json(
        { success: false, error: "Identifiant manquant" },
        { status: 400 },
      );
    }

    await prisma.rapportMaintenanceSAV.delete({ where: { id: id.trim() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";
    if (code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Rapport introuvable" },
        { status: 404 },
      );
    }
    console.error("API rapport-maintenance DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la suppression",
      },
      { status: 500 },
    );
  }
}
