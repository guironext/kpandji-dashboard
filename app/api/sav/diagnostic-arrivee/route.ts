import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET diagnostic-arrivee for a voitureSAV (existing saved items) */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const voitureSAVId = searchParams.get("voitureSAVId");
    if (!voitureSAVId) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId requis" },
        { status: 400 }
      );
    }

    const diagnosticArrivee = await prisma.diagnosticArrivee.findMany({
      where: { voitureSAVId },
      include: {
        catergorieDiagnostic: true,
        DetailDiagnostic: true,
      },
    });
    return NextResponse.json({ success: true, data: diagnosticArrivee });
  } catch (error) {
    console.error("API getDiagnosticArrivee error:", error);
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

/** POST save diagnostic-arrivee: checkedDetailIds = array of DetailDiagnostic template ids */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { voitureSAVId, checkedDetailIds } = body as {
      voitureSAVId: string;
      checkedDetailIds: string[];
    };

    if (!voitureSAVId || !Array.isArray(checkedDetailIds)) {
      return NextResponse.json(
        { success: false, error: "voitureSAVId et checkedDetailIds requis" },
        { status: 400 }
      );
    }

    const templates = await prisma.detailDiagnostic.findMany({
      where: {
        id: { in: checkedDetailIds },
        diagnosticArriveeId: null,
      },
      include: { catergorieDiagnostic: true },
    });

    if (templates.length === 0 && checkedDetailIds.length > 0) {
      return NextResponse.json(
        { success: false, error: "Aucun détail diagnostique trouvé" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const existingArrivees = await tx.diagnosticArrivee.findMany({
        where: { voitureSAVId },
        include: { DetailDiagnostic: true },
      });
      const existingDetails = existingArrivees.flatMap(
        (da) => da.DetailDiagnostic,
      );
      const daByCategory = new Map(
        existingArrivees.map((da) => [da.catergorieDiagnosticId, da.id]),
      );

      let referencedIds = new Set<string>();
      try {
        const rows = await tx.$queryRaw<{ id: string }[]>`
          SELECT DISTINCT "detailDiagnosticId" AS id
          FROM "InterventionDiagnosticOffert"
          WHERE "voitureSAVId" = ${voitureSAVId}
            AND "detailDiagnosticId" IS NOT NULL
        `;
        referencedIds = new Set(rows.map((r) => r.id));
      } catch {
        referencedIds = new Set();
      }

      const keepIds = new Set<string>();

      for (const t of templates) {
        let daId = daByCategory.get(t.catergorieDiagnosticId);
        if (!daId) {
          const createdDa = await tx.diagnosticArrivee.create({
            data: {
              voitureSAVId,
              catergorieDiagnosticId: t.catergorieDiagnosticId,
            },
          });
          daId = createdDa.id;
          daByCategory.set(t.catergorieDiagnosticId, daId);
        }

        const existing = existingDetails.find(
          (d) =>
            d.catergorieDiagnosticId === t.catergorieDiagnosticId &&
            d.nom === t.nom,
        );
        if (existing) {
          keepIds.add(existing.id);
          if (existing.diagnosticArriveeId !== daId) {
            await tx.detailDiagnostic.update({
              where: { id: existing.id },
              data: { diagnosticArriveeId: daId },
            });
          }
          continue;
        }

        const created = await tx.detailDiagnostic.create({
          data: {
            nom: t.nom,
            description: t.description,
            prix_unitaire: t.prix_unitaire,
            catergorieDiagnosticId: t.catergorieDiagnosticId,
            diagnosticArriveeId: daId,
          },
        });
        keepIds.add(created.id);
      }

      for (const d of existingDetails) {
        if (d.garantieSAVId || d.reparationId || referencedIds.has(d.id)) {
          keepIds.add(d.id);
        }
      }

      for (const d of existingDetails) {
        if (keepIds.has(d.id)) continue;
        await tx.detailDiagnostic.delete({ where: { id: d.id } });
      }

      const remainingDas = await tx.diagnosticArrivee.findMany({
        where: { voitureSAVId },
        include: { _count: { select: { DetailDiagnostic: true } } },
      });
      for (const da of remainingDas) {
        if (da._count.DetailDiagnostic === 0) {
          await tx.diagnosticArrivee.delete({ where: { id: da.id } });
        }
      }

      if (templates.length > 0 || keepIds.size > 0) {
        await tx.voitureSAV.update({
          where: { id: voitureSAVId },
          data: { statut: "DIAGNOSTIC_FINI" },
        });
      }
    });

    const saved = await prisma.diagnosticArrivee.findMany({
      where: { voitureSAVId },
      include: { DetailDiagnostic: true, catergorieDiagnostic: true },
    });
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("API saveDiagnosticArrivee error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de l'enregistrement",
      },
      { status: 500 }
    );
  }
}
