import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import type { StatutVoitureSAV } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUTS_VOITURE_SAV: StatutVoitureSAV[] = [
  "ARRIVE",
  "DIAGNOSTIC_FINI",
  "DISPATCHE",
  "GARANTIESAV_EN_COURS",
  "GARANTIESAV_TERMINE",
  "EN_TRAITEMENT",
  "TESTE",
  "TERMINE",
  "ANNULE",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statutParam = searchParams.get("statut");
    const includeDiagnostic = searchParams.get("includeDiagnostic") === "1";
    const includeGarantie = searchParams.get("includeGarantie") === "1";

    const where =
      statutParam && STATUTS_VOITURE_SAV.includes(statutParam as StatutVoitureSAV)
        ? { statut: statutParam as StatutVoitureSAV }
        : undefined;

    const include = {
      ClientSAV: true,
      Voiture: true,
      ...(includeDiagnostic
        ? {
            diagnosticArrivee: {
              orderBy: { createdAt: "asc" as const },
              include: {
                catergorieDiagnostic: true,
                DetailDiagnostic: {
                  orderBy: { createdAt: "asc" as const },
                },
                PieceSAV: true,
              },
            },
          }
        : {}),
      ...(includeGarantie
        ? {
            GarantieSAV: {
              orderBy: { createdAt: "desc" as const },
              include: {
                groupePersonnelSAV: {
                  select: { id: true, nom: true },
                },
              },
            },
          }
        : {}),
    } as const;

    let voitures;
    try {
      voitures = await prisma.voitureSAV.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      // Some rows have null chassisNumber while an older Prisma client still
      // typed the column as required. Skip the column so the list can load.
      if (code !== "P2032") throw error;
      voitures = await prisma.voitureSAV.findMany({
        where,
        include,
        omit: { chassisNumber: true },
        orderBy: { createdAt: "desc" },
      });
    }
    return NextResponse.json({ success: true, data: voitures });
  } catch (error) {
    console.error("API getVoitureSAV error:", error);
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
    const { model, motorisation, transmission, couleur, nbr_portes, immatriculation, clientSAVId } = body;

    if (!model || !motorisation || !transmission || !couleur || !nbr_portes || !immatriculation || !clientSAVId) {
      return NextResponse.json(
        {
          success: false,
          error: "Modèle, motorisation, transmission, couleur, nombre de portes, immatriculation et client sont requis",
        },
        { status: 400 }
      );
    }

    const validMotorisations = ["ELECTRIQUE", "ESSENCE", "DIESEL", "HYBRIDE"];
    const validTransmissions = ["AUTOMATIQUE", "MANUEL"];
    if (
      !validMotorisations.includes(motorisation) ||
      !validTransmissions.includes(transmission)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Motorisation ou transmission invalide",
        },
        { status: 400 }
      );
    }

    const voitureId = randomUUID();
    const now = new Date();

    const [voiture, voitureSAV] = await prisma.$transaction([
      prisma.voiture.create({
        data: {
          id: voitureId,
          nbr_portes,
          transmission,
          motorisation,
          couleur,
          updatedAt: now,
          etatVoiture: "PARKING",
        },
      }),
      prisma.voitureSAV.create({
        data: {
          model,
          motorisation,
          transmission,
          couleur,
          nbr_portes,
          immatriculation,
          voitureId,
          clientSAVId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...voitureSAV, Voiture: voiture },
    });
  } catch (error) {
    console.error("API createVoitureSAV error:", error);
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
