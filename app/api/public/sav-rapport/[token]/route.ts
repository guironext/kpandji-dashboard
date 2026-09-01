import { NextRequest, NextResponse } from "next/server";
import { executeWithRetry, prisma } from "@/lib/prisma";
import { fetchTesteFinalPhotosByVoiture } from "@/lib/sav/fetchTesteFinalPhotos";
import { verifySavRapportToken } from "@/lib/sav/savRapportShareToken";
import { withVoitureSavStatut } from "@/lib/sav/voitureSavStatutSql";

export const dynamic = "force-dynamic";

const voitureInclude = {
  ClientSAV: true,
  VoitureSavGarantie: true,
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const voitureSAVId = verifySavRapportToken(token);
    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "Lien invalide" },
        { status: 404 },
      );
    }

    let row;
    try {
      row = await executeWithRetry(() =>
        prisma.voitureSAV.findUnique({
          where: { id: voitureSAVId },
          include: voitureInclude,
          omit: { statut: true },
        }),
      );
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      if (code !== "P2032") throw error;
      row = await executeWithRetry(() =>
        prisma.voitureSAV.findUnique({
          where: { id: voitureSAVId },
          include: voitureInclude,
          omit: { chassisNumber: true, statut: true },
        }),
      );
    }

    if (!row) {
      return NextResponse.json(
        { success: false, error: "Rapport introuvable" },
        { status: 404 },
      );
    }

    const [withStatut] = await withVoitureSavStatut([row]);
    if (withStatut.statut !== "TERMINE") {
      return NextResponse.json(
        { success: false, error: "Rapport non disponible" },
        { status: 404 },
      );
    }

    const photosByVoiture = await fetchTesteFinalPhotosByVoiture([row.id]);
    const photos = photosByVoiture.get(row.id) ?? [];
    const garantie =
      "VoitureSavGarantie" in withStatut
        ? (
            withStatut as {
              VoitureSavGarantie?: { garantieSAVbadge?: boolean | null } | null;
            }
          ).VoitureSavGarantie
        : null;

    const client = withStatut.ClientSAV;

    return NextResponse.json({
      success: true,
      data: {
        id: withStatut.id,
        model: withStatut.model,
        immatriculation: withStatut.immatriculation ?? "",
        chassisNumber:
          "chassisNumber" in withStatut
            ? (withStatut as { chassisNumber?: string | null }).chassisNumber
            : null,
        couleur: withStatut.couleur,
        motorisation: withStatut.motorisation,
        transmission: withStatut.transmission,
        nbr_portes: withStatut.nbr_portes,
        statut: withStatut.statut,
        StatutGarantie: withStatut.StatutGarantie,
        sousGarantie: Boolean(garantie && garantie.garantieSAVbadge !== false),
        createdAt: withStatut.createdAt,
        updatedAt: withStatut.updatedAt,
        image: photos[0] ?? null,
        ClientSAV: {
          nom: client?.nom ?? "",
          prenom: client?.prenom ?? "",
          contact: client?.contact ?? "",
          email: client?.email ?? null,
          entreprise: client?.entreprise ?? null,
        },
        Reparation: withStatut.Reparation,
        diagnosticArrivee: withStatut.diagnosticArrivee,
        VisuelDefaut: withStatut.VisuelDefaut,
        RapportMaintenanceSAV: withStatut.RapportMaintenanceSAV,
      },
    });
  } catch (error) {
    console.error("API public sav-rapport GET error:", error);
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
