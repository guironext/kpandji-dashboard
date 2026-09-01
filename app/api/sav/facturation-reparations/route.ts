import { NextResponse } from "next/server";
import { executeWithRetry, prisma } from "@/lib/prisma";
import {
  fetchVoitureSavIdsByStatut,
  voitureSavFactureSelect,
} from "@/lib/sav/voitureSavStatutSql";
import { mergeVoitureSavReparationsForFacture } from "@/lib/sav/savFactureLines";

export const dynamic = "force-dynamic";

/** Une facture par véhicule SAV au statut TERMINE. */
export async function GET() {
  try {
    const factures = await executeWithRetry(async () => {
      const termineIds = await fetchVoitureSavIdsByStatut("TERMINE");
      if (termineIds.length === 0) return [];

      const vehicles = await prisma.voitureSAV.findMany({
        where: { id: { in: termineIds } },
        orderBy: { updatedAt: "desc" },
        select: {
          ...voitureSavFactureSelect,
          updatedAt: true,
          Reparation: {
            orderBy: { createdAt: "asc" },
            include: {
              DetailDiagnostic: {
                orderBy: { createdAt: "asc" },
                include: {
                  catergorieDiagnostic: true,
                },
              },
              PieceSAV: true,
              Maintenance: {
                orderBy: { createdAt: "asc" },
                include: { catergorieDiagnostic: true },
              },
              FactureProformaSAV: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      return vehicles.map((v) => mergeVoitureSavReparationsForFacture(v));
    });

    return NextResponse.json({ success: true, data: factures });
  } catch (error) {
    console.error("API facturation-reparations GET error:", error);
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
