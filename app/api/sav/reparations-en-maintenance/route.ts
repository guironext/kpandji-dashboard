import { NextRequest, NextResponse } from "next/server";
import { StatutReparation } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";
import { voitureSavFactureSelect } from "@/lib/sav/voitureSavStatutSql";
import { withNestedVoitureSavStatutGarantie } from "@/lib/sav/voitureSavStatutGarantieSql";

export const dynamic = "force-dynamic";

const QUEUE_STATUTS: StatutReparation[] = [
  StatutReparation.EN_ATTENTE,
  StatutReparation.EN_TRAITEMENT,
  StatutReparation.EN_MAINTENANCE,
];

const reparationInclude = {
  voitureSAV: {
    select: {
              ...voitureSavFactureSelect,
              GarantieSAV: {
        select: {
          nom_garantie: true,
          statut: true,
          voitureSAVId: true,
        },
      },
    },
  },
  DetailDiagnostic: {
    orderBy: { createdAt: "asc" as const },
    include: {
      catergorieDiagnostic: true,
      PieceSAV: true,
    },
  },
  PieceSAV: true,
  Maintenance: {
    orderBy: { createdAt: "desc" as const },
    include: {
      catergorieDiagnostic: true,
      factureProformaSAVs: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
      },
    },
  },
};

function parseStatuts(
  raw: string | null,
  fallback: StatutReparation[]
): StatutReparation[] {
  if (!raw?.trim()) return fallback;
  const parsed = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is StatutReparation =>
      QUEUE_STATUTS.includes(s as StatutReparation)
    );
  return parsed.length > 0 ? parsed : fallback;
}

/** Réparations atelier (attente / traitement / maintenance) avec client, véhicule, diagnostics, pièces */
export async function GET(request: NextRequest) {
  try {
    const voitureSAVId = request.nextUrl.searchParams.get("voitureSAVId")?.trim();
    const statuts = parseStatuts(
      request.nextUrl.searchParams.get("statut"),
      voitureSAVId ? QUEUE_STATUTS : [StatutReparation.EN_MAINTENANCE]
    );
    const reparations = await withNestedVoitureSavStatutGarantie(
      await executeWithRetry(() =>
        prisma.reparation.findMany({
          where: {
            ...(voitureSAVId ? { voitureSAVId } : {}),
            statut: statuts.length === 1 ? statuts[0] : { in: statuts },
          },
          orderBy: { updatedAt: "desc" },
          include: reparationInclude,
        }),
      )
    );

    return NextResponse.json({ success: true, data: reparations });
  } catch (error) {
    console.error("API reparations-en-maintenance GET error:", error);
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
