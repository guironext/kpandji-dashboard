import { NextResponse } from "next/server";
import { StatutGarantie } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";
import { voitureSavFactureSelect } from "@/lib/sav/voitureSavStatutSql";
import { withNestedVoitureSavStatutGarantie } from "@/lib/sav/voitureSavStatutGarantieSql";

export const dynamic = "force-dynamic";

const QUEUE_STATUTS: StatutGarantie[] = [
  "EN_ATTENTE",
  "EN_TRAITEMENT",
  "EN_MAINTENANCE",
];

/**
 * Dossiers GarantieSAV en file atelier, normalisés comme une réparation
 * pour réutiliser l’écran maintenance.
 */
export async function GET() {
  try {
    const garanties = await withNestedVoitureSavStatutGarantie(
      await executeWithRetry(() =>
        prisma.garantieSAV.findMany({
        where: {
          statut: { in: QUEUE_STATUTS },
          voitureSAVId: { not: null },
        },
        orderBy: { updatedAt: "desc" },
        include: {
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
            orderBy: { createdAt: "asc" },
            include: {
              catergorieDiagnostic: true,
              PieceSAV: true,
            },
          },
          PieceSAV: true,
          Maintenance: {
            orderBy: { createdAt: "desc" },
            include: {
              catergorieDiagnostic: true,
              factureProformaSAVs: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      }),
      )
    );

    const data = garanties
      .filter((g): g is typeof g & { voitureSAV: NonNullable<typeof g.voitureSAV> } =>
        g.voitureSAV != null
      )
      .map((g) => ({
        id: g.id,
        kind: "garantie" as const,
        categorie_reparation: g.categorie_garantie,
        horaire_travail_prix: g.prix_unitaire,
        horaire_travail_duration: null,
        voitureSAV: g.voitureSAV,
        DetailDiagnostic: g.DetailDiagnostic,
        Maintenance: g.Maintenance,
      }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API garanties-en-maintenance GET error:", error);
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
