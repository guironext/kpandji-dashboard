import { NextResponse } from "next/server";
import { executeWithRetry, prisma } from "@/lib/prisma";
import { fetchTesteFinalPhotosByVoiture } from "@/lib/sav/fetchTesteFinalPhotos";
import { signSavRapportToken } from "@/lib/sav/savRapportShareToken";
import {
  fetchVoitureSavIdsByStatut,
  withVoitureSavStatut,
} from "@/lib/sav/voitureSavStatutSql";
import { withVoitureSavStatutGarantie } from "@/lib/sav/voitureSavStatutGarantieSql";

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
      FactureProformaSAV: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
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

/** Véhicules SAV au statut TERMINE, avec rapports, facture et image. */
export async function GET() {
  try {
    const termineIds = await fetchVoitureSavIdsByStatut("TERMINE");
    if (termineIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const where = {
      id: { in: termineIds },
    };

    let voitures;
    try {
      voitures = await executeWithRetry(() =>
        prisma.voitureSAV.findMany({
          where,
          include: voitureInclude,
          omit: { statut: true, StatutGarantie: true },
          orderBy: { updatedAt: "desc" },
        }),
      );
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: string }).code
          : undefined;
      if (code !== "P2032") throw error;
      voitures = await executeWithRetry(() =>
        prisma.voitureSAV.findMany({
          where,
          include: voitureInclude,
          omit: { chassisNumber: true, statut: true, StatutGarantie: true },
          orderBy: { updatedAt: "desc" },
        }),
      );
    }

    voitures = await withVoitureSavStatut(voitures);
    voitures = await withVoitureSavStatutGarantie(voitures);

    const photosByVoiture = await fetchTesteFinalPhotosByVoiture(
      voitures.map((v) => v.id),
    );

    const data = voitures.map((v) => {
      const photos = photosByVoiture.get(v.id) ?? [];
      const garantie =
        "VoitureSavGarantie" in v
          ? (v as { VoitureSavGarantie?: { garantieSAVbadge?: boolean | null } | null })
              .VoitureSavGarantie
          : null;
      return {
        ...v,
        chassisNumber:
          "chassisNumber" in v
            ? (v as { chassisNumber?: string | null }).chassisNumber
            : null,
        image: photos[0] ?? null,
        photos,
        shareToken: signSavRapportToken(v.id),
        sousGarantie: Boolean(garantie && garantie.garantieSAVbadge !== false),
        VoitureSavGarantie: garantie ?? null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API voiture-sav-termine GET error:", error);
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
