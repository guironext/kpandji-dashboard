import { NextResponse } from "next/server";
import { StatutMaintenance } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Réparations avec au moins une maintenance terminée (facturation SAV). */
export async function GET() {
  try {
    const reparations = await executeWithRetry(() =>
      prisma.reparation.findMany({
        where: {
          Maintenance: { some: { statut: StatutMaintenance.TERMINEE } },
        },
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
            },
          },
          PieceSAV: true,
          Maintenance: {
            where: { statut: StatutMaintenance.TERMINEE },
            orderBy: { createdAt: "asc" },
            include: { catergorieDiagnostic: true },
          },
          FactureProformaSAV: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    );

    return NextResponse.json({ success: true, data: reparations });
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
