import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setVoitureSavStatutSql } from "@/lib/sav/voitureSavStatutSql";

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

    let shouldMarkDiagnosticFini = false;

    await prisma.$transaction(
      async (tx) => {
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

        const missingCategoryIds = [
          ...new Set(templates.map((t) => t.catergorieDiagnosticId)),
        ].filter((catId) => !daByCategory.has(catId));

        if (missingCategoryIds.length > 0) {
          await tx.diagnosticArrivee.createMany({
            data: missingCategoryIds.map((catergorieDiagnosticId) => ({
              voitureSAVId,
              catergorieDiagnosticId,
            })),
          });
          const createdDas = await tx.diagnosticArrivee.findMany({
            where: {
              voitureSAVId,
              catergorieDiagnosticId: { in: missingCategoryIds },
            },
            select: { id: true, catergorieDiagnosticId: true },
          });
          for (const da of createdDas) {
            daByCategory.set(da.catergorieDiagnosticId, da.id);
          }
        }

        const detailsToCreate: Array<{
          nom: string;
          description: string | null;
          prix_unitaire: typeof templates[number]["prix_unitaire"];
          catergorieDiagnosticId: string;
          diagnosticArriveeId: string;
        }> = [];
        const detailsToRelink: Array<{ id: string; diagnosticArriveeId: string }> =
          [];

        for (const t of templates) {
          const daId = daByCategory.get(t.catergorieDiagnosticId);
          if (!daId) continue;

          const existing = existingDetails.find(
            (d) =>
              d.catergorieDiagnosticId === t.catergorieDiagnosticId &&
              d.nom === t.nom,
          );
          if (existing) {
            keepIds.add(existing.id);
            if (existing.diagnosticArriveeId !== daId) {
              detailsToRelink.push({
                id: existing.id,
                diagnosticArriveeId: daId,
              });
            }
            continue;
          }

          detailsToCreate.push({
            nom: t.nom,
            description: t.description,
            prix_unitaire: t.prix_unitaire,
            catergorieDiagnosticId: t.catergorieDiagnosticId,
            diagnosticArriveeId: daId,
          });
        }

        if (detailsToCreate.length > 0) {
          await tx.detailDiagnostic.createMany({ data: detailsToCreate });
        }

        for (const relink of detailsToRelink) {
          await tx.detailDiagnostic.update({
            where: { id: relink.id },
            data: { diagnosticArriveeId: relink.diagnosticArriveeId },
          });
        }

        for (const d of existingDetails) {
          if (d.garantieSAVId || d.reparationId || referencedIds.has(d.id)) {
            keepIds.add(d.id);
          }
        }

        const idsToDelete = existingDetails
          .filter((d) => !keepIds.has(d.id))
          .map((d) => d.id);
        if (idsToDelete.length > 0) {
          await tx.detailDiagnostic.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        await tx.diagnosticArrivee.deleteMany({
          where: {
            voitureSAVId,
            DetailDiagnostic: { none: {} },
          },
        });

        shouldMarkDiagnosticFini = templates.length > 0 || keepIds.size > 0;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    if (shouldMarkDiagnosticFini) {
      await setVoitureSavStatutSql(voitureSAVId, "DIAGNOSTIC_FINI");
    }

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
