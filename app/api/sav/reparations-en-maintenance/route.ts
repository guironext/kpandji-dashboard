import { NextResponse } from "next/server";
import { StatutReparation } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Réparations au statut EN_MAINTENANCE avec client, véhicule, diagnostics, pièces et maintenances */
export async function GET() {
  try {
    const reparations = await executeWithRetry(() =>
      prisma.reparation.findMany({
        where: { statut: StatutReparation.EN_MAINTENANCE },
        orderBy: { updatedAt: "desc" },
        include: {
          voitureSAV: {
            include: {
              ClientSAV: true,
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
