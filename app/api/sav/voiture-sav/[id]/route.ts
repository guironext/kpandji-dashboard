import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

function isPrismaP2032(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2032"
  );
}

/** Some VoitureSAV rows have null chassisNumber; skip the column if Prisma rejects it. */
async function findVoitureSavById<T extends Record<string, unknown>>(
  id: string,
  extra: T = {} as T,
) {
  const args = { where: { id }, ...extra };
  try {
    return await prisma.voitureSAV.findUnique(args);
  } catch (error) {
    if (!isPrismaP2032(error)) throw error;
    return prisma.voitureSAV.findUnique({
      ...args,
      omit: { chassisNumber: true },
    });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const voitureSAV = await findVoitureSavById(id, {
      include: {
        ClientSAV: true,
        Voiture: true,
        diagnosticArrivee: {
          orderBy: { createdAt: "asc" as const },
          include: {
            catergorieDiagnostic: true,
            DetailDiagnostic: { orderBy: { createdAt: "asc" as const } },
          },
        },
        GarantieSAV: {
          orderBy: { createdAt: "desc" as const },
          include: { groupePersonnelSAV: true },
        },
      },
    });
    if (!voitureSAV) {
      return NextResponse.json(
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: voitureSAV });
  } catch (error) {
    console.error("API getVoitureSAV by id error:", error);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      model,
      motorisation,
      transmission,
      couleur,
      nbr_portes,
      immatriculation,
      clientSAVId,
      statut,
    } = body;

    const voitureSAV = await findVoitureSavById(id, {
      include: { Voiture: true },
    });
    if (!voitureSAV) {
      return NextResponse.json(
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
      );
    }

    if (
      statut !== undefined &&
      !STATUTS_VOITURE_SAV.includes(statut as StatutVoitureSAV)
    ) {
      return NextResponse.json(
        { success: false, error: "Statut invalide" },
        { status: 400 }
      );
    }

    const updateVoitureSAV: Record<string, unknown> = {};
    if (model !== undefined) updateVoitureSAV.model = model;
    if (motorisation !== undefined) updateVoitureSAV.motorisation = motorisation;
    if (transmission !== undefined) updateVoitureSAV.transmission = transmission;
    if (couleur !== undefined) updateVoitureSAV.couleur = couleur;
    if (nbr_portes !== undefined) updateVoitureSAV.nbr_portes = nbr_portes;
    if (immatriculation !== undefined) updateVoitureSAV.immatriculation = immatriculation;
    if (clientSAVId !== undefined) updateVoitureSAV.clientSAVId = clientSAVId;
    if (statut !== undefined) updateVoitureSAV.statut = statut;

    const updateVoiture: Record<string, unknown> = {};
    if (nbr_portes !== undefined) updateVoiture.nbr_portes = nbr_portes;
    if (transmission !== undefined) updateVoiture.transmission = transmission;
    if (motorisation !== undefined) updateVoiture.motorisation = motorisation;
    if (couleur !== undefined) updateVoiture.couleur = couleur;
    updateVoiture.updatedAt = new Date();

    await prisma.$transaction([
      prisma.voitureSAV.update({
        where: { id },
        data: updateVoitureSAV,
      }),
      prisma.voiture.update({
        where: { id: voitureSAV.voitureId },
        data: updateVoiture,
      }),
    ]);

    const updated = await findVoitureSavById(id, {
      include: { ClientSAV: true, Voiture: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("API updateVoitureSAV error:", error);
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
    const voitureSAV = await findVoitureSavById(id);
    if (!voitureSAV) {
      return NextResponse.json(
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.voitureSAV.delete({ where: { id } }),
      prisma.voiture.delete({ where: { id: voitureSAV.voitureId } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API deleteVoitureSAV error:", error);
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
