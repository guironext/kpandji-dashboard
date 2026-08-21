import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const offertInclude = {
  voitureSAV: {
    select: {
      id: true,
      model: true,
      immatriculation: true,
      chassisNumber: true,
    },
  },
} as const;

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

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

    if (body.detailDiagnosticId !== undefined) {
      const detailDiagnosticId =
        typeof body.detailDiagnosticId === "string" && body.detailDiagnosticId.trim()
          ? body.detailDiagnosticId.trim()
          : "";
      if (!detailDiagnosticId) {
        return NextResponse.json(
          { success: false, error: "Sélectionnez un détail diagnostique" },
          { status: 400 }
        );
      }
      const detail = await prisma.detailDiagnostic.findUnique({
        where: { id: detailDiagnosticId },
        select: { nom: true },
      });
      if (!detail) {
        return NextResponse.json(
          { success: false, error: "Détail diagnostique introuvable" },
          { status: 400 }
        );
      }
      updateData.libelle = detail.nom;
    } else if (body.libelle !== undefined) {
      const libelle = typeof body.libelle === "string" ? body.libelle.trim() : "";
      if (!libelle) {
        return NextResponse.json(
          { success: false, error: "Le libellé est requis" },
          { status: 400 }
        );
      }
      updateData.libelle = libelle;
    }

    if (body.date_activation !== undefined) {
      const date_activation = parseDate(body.date_activation);
      if (!date_activation) {
        return NextResponse.json(
          { success: false, error: "Date d'activation invalide" },
          { status: 400 }
        );
      }
      updateData.date_activation = date_activation;
    }

    if (body.date_fin !== undefined) {
      const date_fin = parseDate(body.date_fin);
      if (!date_fin) {
        return NextResponse.json(
          { success: false, error: "Date de fin invalide" },
          { status: 400 }
        );
      }
      updateData.date_fin = date_fin;
    }

    if (body.voitureSAVId !== undefined) {
      updateData.voitureSAVId =
        typeof body.voitureSAVId === "string" && body.voitureSAVId.trim()
          ? body.voitureSAVId.trim()
          : null;
    }

    const item = await prisma.diagnosticOffert.update({
      where: { id },
      data: updateData,
      include: offertInclude,
    });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("API updateDiagnosticOffert error:", error);
    const notFound = isPrismaNotFound(error);
    return NextResponse.json(
      {
        success: false,
        error: notFound
          ? "Garantie Offert introuvable"
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
    await prisma.diagnosticOffert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API deleteDiagnosticOffert error:", error);
    const notFound = isPrismaNotFound(error);
    return NextResponse.json(
      {
        success: false,
        error: notFound
          ? "Garantie Offert introuvable ou déjà supprimée"
          : error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
      },
      { status: notFound ? 404 : 500 }
    );
  }
}
