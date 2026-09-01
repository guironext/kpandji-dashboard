import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { isGarantieOffertDetailLocked } from "@/lib/sav/garantieOffertMatch";
import { withVoitureSavStatutGarantie } from "@/lib/sav/voitureSavStatutGarantieSql";

export const dynamic = "force-dynamic";

/** Neon/PgBouncer-safe: one statement, no mixed Prisma+$executeRaw $transaction. */
async function persistPreparationFini(params: {
  reparationId: string;
  voitureSAVId: string;
  detailIds: string[];
  pieceIds: string[];
}) {
  const { reparationId, voitureSAVId, detailIds, pieceIds } = params;
  const piecesCte =
    pieceIds.length === 0
      ? Prisma.sql``
      : Prisma.sql`, pieces AS (
          UPDATE "PieceSAV"
          SET "reparationId" = ${reparationId},
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE id IN (${Prisma.join(pieceIds)})
          RETURNING id
        )`;

  await prisma.$executeRaw(
    Prisma.sql`
      WITH details AS (
        UPDATE "DetailDiagnostic"
        SET "reparationId" = ${reparationId},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id IN (${Prisma.join(detailIds)})
        RETURNING id
      ),
      voiture AS (
        UPDATE "VoitureSAV"
        SET statut = 'PREPARATION_FINI'::"StatutVoitureSAV",
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${voitureSAVId}
        RETURNING id
      )
      ${piecesCte}
      SELECT 1
    `
  );
}

async function setVoiturePreparationFini(voitureSAVId: string) {
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "VoitureSAV"
      SET statut = 'PREPARATION_FINI'::"StatutVoitureSAV",
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${voitureSAVId}
    `
  );
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: voitureSAVId } = await params;

    const voitureRow = await prisma.voitureSAV.findUnique({
      where: { id: voitureSAVId },
      include: {
        GarantieSAV: true,
        diagnosticArrivee: {
          include: {
            catergorieDiagnostic: true,
            DetailDiagnostic: true,
            PieceSAV: true,
          },
        },
      },
      omit: { StatutGarantie: true },
    });

    if (!voitureRow) {
      return NextResponse.json(
        { success: false, error: "Véhicule introuvable" },
        { status: 404 }
      );
    }
    const [voiture] = await withVoitureSavStatutGarantie([voitureRow]);

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
      if (voiture.statut === "DIAGNOSTIC_FINI") {
        await setVoiturePreparationFini(voitureSAVId);
      }
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

    if (voiture.statut !== "DIAGNOSTIC_FINI") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Seuls les véhicules au statut DIAGNOSTIC_FINI peuvent enregistrer la préparation.",
        },
        { status: 400 }
      );
    }

    const piecesByDetailId = new Set(
      voiture.diagnosticArrivee.flatMap((da) =>
        (da.PieceSAV ?? [])
          .map((p) => p.detailDiagnosticId)
          .filter((id): id is string => Boolean(id))
      )
    );
    const catalog = await prisma.garantieSAV.findMany({
      select: {
        nom_garantie: true,
        statut: true,
        voitureSAVId: true,
      },
    });
    const detailsNeedingPieces = allDetails.filter(
      (d) =>
        !isGarantieOffertDetailLocked(
          voiture.StatutGarantie,
          d,
          voiture.GarantieSAV,
          catalog
        )
    );
    const detailsWithoutPiece = detailsNeedingPieces.filter(
      (d) => !piecesByDetailId.has(d.id)
    );
    if (detailsWithoutPiece.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ajoutez une pièce à chaque ligne de diagnostic (${detailsWithoutPiece.length} restante${detailsWithoutPiece.length > 1 ? "s" : ""}).`,
        },
        { status: 400 }
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

    const rep = await prisma.reparation.create({
      data: {
        voitureSAVId,
        categorie_reparation,
        detail_reparation: detail_reparation || null,
        quantite: qtyTotal,
        prix_unitaire: prixSum.gt(0) ? prixSum : null,
        statut: "EN_ATTENTE",
      },
    });

    try {
      await persistPreparationFini({
        reparationId: rep.id,
        voitureSAVId,
        detailIds: allDetails.map((d) => d.id),
        pieceIds: pieceRows.map((p) => p.id),
      });
    } catch (e) {
      await prisma.reparation.delete({ where: { id: rep.id } }).catch(() => {});
      throw e;
    }

    const reparation = await prisma.reparation.findUnique({
      where: { id: rep.id },
    });

    return NextResponse.json({
      success: true,
      alreadySaved: false,
      data: { reparationId: rep.id, reparation },
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
