import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";
import {
  fetchVoitureSavStatuts,
  voitureSavFactureSelect,
} from "@/lib/sav/voitureSavStatutSql";
import { fetchVoitureSavDeplacements } from "@/lib/sav/voitureSavDeplacementSql";

export const dynamic = "force-dynamic";

/** Réparations dont le véhicule est PREPARATION_FINI, EN_MAINTENANCE ou EN_MAINTENANCE_EN_ATTENTE */
export async function GET() {
  try {
    const reparations = await executeWithRetry(async () => {
      const ids = await prisma.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT id FROM "VoitureSAV"
          WHERE statut::text IN (
            'PREPARATION_FINI',
            'EN_MAINTENANCE',
            'EN_MAINTENANCE_EN_ATTENTE'
          )
        `
      );
      if (ids.length === 0) return [];

      const rows = await prisma.reparation.findMany({
        where: { voitureSAVId: { in: ids.map((r) => r.id) } },
        orderBy: { createdAt: "desc" },
        include: {
          voitureSAV: {
            select: voitureSavFactureSelect,
          },
          DetailDiagnostic: {
            orderBy: { createdAt: "asc" },
            include: {
              catergorieDiagnostic: true,
            },
          },
          PieceSAV: true,
        },
      });

      const voitureIds = rows.map((r) => r.voitureSAV.id);
      const [statuts, deplacements] = await Promise.all([
        fetchVoitureSavStatuts(voitureIds),
        fetchVoitureSavDeplacements(voitureIds),
      ]);
      return rows.map((r) => ({
        ...r,
        voitureSAV: {
          ...r.voitureSAV,
          statut: statuts.get(r.voitureSAV.id) ?? "",
          deplacementSAV: deplacements.get(r.voitureSAV.id) ?? "",
        },
      }));
    });

    return NextResponse.json({ success: true, data: reparations });
  } catch (error) {
    console.error("API proforma-reparations GET error:", error);
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
