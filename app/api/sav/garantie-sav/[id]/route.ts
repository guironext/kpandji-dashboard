import { NextRequest, NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import type { StatutGarantie } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUTS_GARANTIE: StatutGarantie[] = [
  "EN_ATTENTE",
  "EN_TRAITEMENT",
  "TESTE",
  "TERMINE",
  "ANNULE",
  "EN_MAINTENANCE",
];

const garantieInclude = {
  groupePersonnelSAV: { select: { id: true, nom: true } },
} as const;

function isPrismaNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  );
}

function parseOptionalInt(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

function parseOptionalDecimal(value: unknown): Decimal | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return new Decimal(n);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.categorie_garantie !== undefined) {
      const categorie_garantie =
        typeof body.categorie_garantie === "string"
          ? body.categorie_garantie.trim()
          : "";
      if (!categorie_garantie) {
        return NextResponse.json(
          { success: false, error: "La catégorie de garantie est requise" },
          { status: 400 },
        );
      }
      updateData.categorie_garantie = categorie_garantie;
    }

    if (body.nom_garantie !== undefined) {
      updateData.nom_garantie =
        typeof body.nom_garantie === "string" && body.nom_garantie.trim()
          ? body.nom_garantie.trim()
          : null;
    }

    if (body.quantite_garantie_offert !== undefined) {
      const quantite = parseOptionalInt(body.quantite_garantie_offert);
      if (quantite === undefined) {
        return NextResponse.json(
          { success: false, error: "quantite_garantie_offert invalide" },
          { status: 400 },
        );
      }
      updateData.quantite_garantie_offert = quantite;
    }

    if (body.prix_unitaire !== undefined) {
      const prix = parseOptionalDecimal(body.prix_unitaire);
      if (prix === undefined) {
        return NextResponse.json(
          { success: false, error: "prix_unitaire invalide" },
          { status: 400 },
        );
      }
      updateData.prix_unitaire = prix;
    }

    if (body.statut !== undefined) {
      const statutRaw = typeof body.statut === "string" ? body.statut.trim() : "";
      if (!STATUTS_GARANTIE.includes(statutRaw as StatutGarantie)) {
        return NextResponse.json(
          { success: false, error: "Statut de garantie invalide" },
          { status: 400 },
        );
      }
      updateData.statut = statutRaw;
    }

    if (body.groupePersonnelSAVId !== undefined) {
      const groupePersonnelSAVId =
        typeof body.groupePersonnelSAVId === "string"
          ? body.groupePersonnelSAVId.trim()
          : "";
      if (!groupePersonnelSAVId) {
        updateData.groupePersonnelSAVId = null;
      } else {
        const groupe = await prisma.groupePersonnelSAV.findUnique({
          where: { id: groupePersonnelSAVId },
          select: { id: true },
        });
        if (!groupe) {
          return NextResponse.json(
            { success: false, error: "Groupe personnel introuvable" },
            { status: 404 },
          );
        }
        updateData.groupePersonnelSAVId = groupePersonnelSAVId;
      }
    }

    const item = await prisma.garantieSAV.update({
      where: { id },
      data: updateData,
      include: garantieInclude,
    });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("API updateGarantieSAV error:", error);
    const notFound = isPrismaNotFound(error);
    return NextResponse.json(
      {
        success: false,
        error: notFound
          ? "Garantie introuvable"
          : error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour",
      },
      { status: notFound ? 404 : 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.garantieSAV.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API deleteGarantieSAV error:", error);
    const notFound = isPrismaNotFound(error);
    return NextResponse.json(
      {
        success: false,
        error: notFound
          ? "Garantie introuvable ou déjà supprimée"
          : error instanceof Error
            ? error.message
            : "Erreur lors de la suppression",
      },
      { status: notFound ? 404 : 500 },
    );
  }
}
