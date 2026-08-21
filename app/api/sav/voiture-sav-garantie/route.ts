import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.voitureSavGarantie.findMany({
      include: {
        _count: { select: { VoitureSAV: true } },
      },
      orderBy: { modelVoiture: "asc" },
    });
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("API getVoitureSavGarantie error:", error);
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
    const marqueVoiture =
      typeof body.marqueVoiture === "string" && body.marqueVoiture.trim()
        ? body.marqueVoiture.trim()
        : "KPANDJI";
    const modelVoiture =
      typeof body.modelVoiture === "string" ? body.modelVoiture.trim() : "";
    const couleur =
      typeof body.couleur === "string" ? body.couleur.trim() : "";
    const chassisNumber =
      typeof body.chassisNumber === "string" && body.chassisNumber.trim()
        ? body.chassisNumber.trim()
        : null;
    const immatriculation =
      typeof body.immatriculation === "string" && body.immatriculation.trim()
        ? body.immatriculation.trim()
        : null;

    if (!modelVoiture) {
      return NextResponse.json(
        { success: false, error: "Le modèle est requis" },
        { status: 400 }
      );
    }
    if (!couleur) {
      return NextResponse.json(
        { success: false, error: "La couleur est requise" },
        { status: 400 }
      );
    }

    const item = await prisma.voitureSavGarantie.create({
      data: {
        marqueVoiture,
        modelVoiture,
        couleur,
        chassisNumber,
        immatriculation,
      },
      include: {
        _count: { select: { VoitureSAV: true } },
      },
    });
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("API createVoitureSavGarantie error:", error);
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
