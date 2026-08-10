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
    const { model, motorisation, transmission, couleur, nbr_portes, immatriculation, clientSAVId } = body;

    const voitureSAV = await prisma.voitureSAV.findUnique({
      where: { id },
      include: { Voiture: true },
    });
    if (!voitureSAV) {
      return NextResponse.json(
        { success: false, error: "Véhicule non trouvé" },
        { status: 404 }
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

    const updated = await prisma.voitureSAV.findUnique({
      where: { id },
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
    const voitureSAV = await prisma.voitureSAV.findUnique({
      where: { id },
    });
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
