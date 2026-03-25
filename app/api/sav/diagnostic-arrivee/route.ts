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
      await tx.diagnosticArrivee.deleteMany({
        where: { voitureSAVId },
      });

      const byCategory = new Map<string, typeof templates>();
      for (const t of templates) {
        if (!byCategory.has(t.catergorieDiagnosticId)) {
          byCategory.set(t.catergorieDiagnosticId, []);
        }
        byCategory.get(t.catergorieDiagnosticId)!.push(t);
      }

      for (const [catergorieId, items] of byCategory) {
        const diag = await tx.diagnosticArrivee.create({
          data: {
            voitureSAVId,
            catergorieDiagnosticId: catergorieId,
          },
        });
        for (const item of items) {
          await tx.detailDiagnostic.create({
            data: {
              nom: item.nom,
              description: item.description,
              prix_unitaire: item.prix_unitaire,
              catergorieDiagnosticId: item.catergorieDiagnosticId,
              diagnosticArriveeId: diag.id,
            },
          });
        }
      }

      await tx.voitureSAV.update({
        where: { id: voitureSAVId },
        data: { statut: "EN_TRAITEMENT" },
      });
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
