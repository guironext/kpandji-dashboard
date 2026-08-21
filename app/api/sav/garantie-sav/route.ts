import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const items = await prisma.garantieSAV.findMany({
      include: garantieInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("API getGarantieSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const categorie_garantie =
      typeof body.categorie_garantie === "string"
        ? body.categorie_garantie.trim()
        : "";
    const nom_garantie =
      typeof body.nom_garantie === "string" ? body.nom_garantie.trim() : "";
    const groupePersonnelSAVId =
      typeof body.groupePersonnelSAVId === "string"
        ? body.groupePersonnelSAVId.trim()
        : "";
    const statutRaw =
      typeof body.statut === "string" ? body.statut.trim() : "";
    const quantite_garantie_offert = parseOptionalInt(
      body.quantite_garantie_offert,
    );
    const prix_unitaire = parseOptionalDecimal(body.prix_unitaire);

    if (!categorie_garantie) {
      return NextResponse.json(
        { success: false, error: "La catégorie de garantie est requise" },
        { status: 400 },
      );
    }

    if (quantite_garantie_offert === undefined) {
      return NextResponse.json(
        { success: false, error: "quantite_garantie_offert invalide" },
        { status: 400 },
      );
    }
    if (prix_unitaire === undefined) {
      return NextResponse.json(
        { success: false, error: "prix_unitaire invalide" },
        { status: 400 },
      );
    }

    const statut: StatutGarantie =
      statutRaw && STATUTS_GARANTIE.includes(statutRaw as StatutGarantie)
        ? (statutRaw as StatutGarantie)
        : "EN_TRAITEMENT";

    if (groupePersonnelSAVId) {
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
    }

    const item = await prisma.garantieSAV.create({
      data: {
        categorie_garantie,
        nom_garantie: nom_garantie || null,
        quantite_garantie_offert,
        prix_unitaire,
        statut,
        ...(groupePersonnelSAVId ? { groupePersonnelSAVId } : {}),
      },
      include: garantieInclude,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("API createGarantieSAV error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 },
    );
  }
}
