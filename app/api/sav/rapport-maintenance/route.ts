import { NextRequest, NextResponse } from "next/server";
import { StatutVoitureSAV } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const voitureInclude = {
  ClientSAV: true,
  Reparation: {
    orderBy: { createdAt: "asc" as const },
    include: {
      DetailDiagnostic: {
        orderBy: { createdAt: "asc" as const },
        include: { catergorieDiagnostic: true },
      },
      PieceSAV: true,
      Maintenance: {
        orderBy: { createdAt: "asc" as const },
        include: { catergorieDiagnostic: true },
      },
    },
  },
  diagnosticArrivee: {
    orderBy: { createdAt: "asc" as const },
    include: {
      catergorieDiagnostic: true,
      DetailDiagnostic: { select: { nom: true } },
    },
  },
  VisuelDefaut: { orderBy: { createdAt: "asc" as const } },
  RapportMaintenanceSAV: { orderBy: { createdAt: "desc" as const } },
} as const;

/** Véhicules SAV terminés avec données pour rapport + rapports complémentaires. */
export async function GET() {
  try {
    const voitures = await executeWithRetry(() =>
      prisma.voitureSAV.findMany({
        where: { statut: StatutVoitureSAV.TERMINE },
        orderBy: { updatedAt: "desc" },
        include: voitureInclude,
      }),
    );

    return NextResponse.json({ success: true, data: voitures });
  } catch (error) {
    console.error("API rapport-maintenance GET error:", error);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const voitureSAVId =
      typeof body.voitureSAVId === "string" ? body.voitureSAVId.trim() : "";
    const titre = typeof body.titre === "string" ? body.titre.trim() : "";
    const contenu =
      typeof body.contenu === "string" ? body.contenu.trim() || null : null;
    const observations =
      typeof body.observations === "string"
        ? body.observations.trim() || null
        : null;

    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId requis" },
        { status: 400 },
      );
    }
    if (!titre) {
      return NextResponse.json(
        { success: false, error: "Le titre est requis" },
        { status: 400 },
      );
    }

    const voiture = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
      select: { id: true, statut: true },
    });
    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 },
      );
    }
    if (voiture.statut !== StatutVoitureSAV.TERMINE) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Seuls les véhicules au statut « terminé » peuvent recevoir un rapport",
        },
        { status: 400 },
      );
    }

    const rapport = await prisma.rapportMaintenanceSAV.create({
      data: { voitureSAVId, titre, contenu, observations },
    });

    return NextResponse.json({ success: true, data: rapport });
  } catch (error) {
    console.error("API rapport-maintenance POST error:", error);
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
