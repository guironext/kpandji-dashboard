import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { pieceSAVAttachReparationOnlyRaw } from "@/lib/pieceSavMouvementSql";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: voitureSAVId } = await params;

    const voiture = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
      include: {
        diagnosticArrivee: {
          include: {
            catergorieDiagnostic: true,
            DetailDiagnostic: true,
            PieceSAV: true,
          },
        },
      },
    });

    if (!voiture) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 }
      );
    }

    const allDetails = voiture.diagnosticArrivee.flatMap((da) => da.DetailDiagnostic);
    if (allDetails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucune ligne de diagnostic à enregistrer pour ce véhicule.",
        },
        { status: 400 }
      );
    }

    const withRep = allDetails.filter((d) => d.reparationId != null);
    if (withRep.length === allDetails.length) {
      const rid = withRep[0]!.reparationId!;
      const rep = await prisma.reparation.findUnique({ where: { id: rid } });
      return NextResponse.json({
        success: true,
        alreadySaved: true,
        data: { reparationId: rid, reparation: rep },
      });
    }
    if (withRep.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "État incohérent : certaines lignes de diagnostic sont déjà liées à une réparation.",
        },
        { status: 409 }
      );
    }

    const diagnosticIds = voiture.diagnosticArrivee.map((d) => d.id);
    const pieceRows =
      diagnosticIds.length === 0
        ? []
        : await prisma.$queryRaw<Array<{ id: string; quantiteSortieDetail: number }>>(
            Prisma.sql`
        SELECT id, "quantiteSortieDetail"
        FROM "PieceSAV"
        WHERE "diagnosticArriveeId" IN (${Prisma.join(diagnosticIds)})
      `
          );

    const categories = [
      ...new Set(
        voiture.diagnosticArrivee.map((da) => da.catergorieDiagnostic?.nom).filter(Boolean)
      ),
    ] as string[];
    const categorie_reparation =
      categories.length > 0 ? categories.join(" · ") : "Réparation atelier";

    const detailLines = voiture.diagnosticArrivee.flatMap((da) =>
      (da.DetailDiagnostic ?? []).map((dd) => {
        const cat = da.catergorieDiagnostic?.nom ?? "";
        return cat ? `${cat} — ${dd.nom}` : dd.nom;
      })
    );
    const detail_reparation = detailLines.join("\n");

    let qtyTotal = 0;
    for (const p of pieceRows) {
      qtyTotal += p.quantiteSortieDetail ?? 0;
    }

    let prixSum = new Decimal(0);
    for (const dd of allDetails) {
      const q = dd.prix_unitaire != null ? Number(dd.prix_unitaire) : 0;
      if (Number.isFinite(q)) {
        prixSum = prixSum.add(new Decimal(q));
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const rep = await tx.reparation.create({
        data: {
          voitureSAVId,
          categorie_reparation,
          detail_reparation: detail_reparation || null,
          quantite: qtyTotal,
          prix_unitaire: prixSum.gt(0) ? prixSum : null,
          statut: "TERMINE",
        },
      });

      await tx.detailDiagnostic.updateMany({
        where: { id: { in: allDetails.map((d) => d.id) } },
        data: { reparationId: rep.id },
      });

      for (const p of pieceRows) {
        await pieceSAVAttachReparationOnlyRaw(p.id, rep.id, tx);
      }

      return rep;
    });

    const reparation = await prisma.reparation.findUnique({
      where: { id: result.id },
    });

    return NextResponse.json({
      success: true,
      alreadySaved: false,
      data: { reparationId: result.id, reparation },
    });
  } catch (error) {
    console.error("API enregistrer-reparation POST error:", error);
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
