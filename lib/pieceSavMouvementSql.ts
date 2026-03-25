import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SqlExecutor = Pick<PrismaClient, "$executeRaw">;

/** Row fields needed for diagnostic sortie logic (works even if Prisma Client is stale vs schema). */
export type PieceSAVMouvementRow = {
  id: string;
  quantite_sortie: number;
  quantite_restante: number;
  diagnosticArriveeId: string | null;
  detailDiagnosticId: string | null;
  quantiteSortieDetail: number;
  reparationId: string | null;
};

export async function pieceSAVFindByIdRaw(
  id: string
): Promise<PieceSAVMouvementRow | null> {
  const rows = await prisma.$queryRaw<PieceSAVMouvementRow[]>(
    Prisma.sql`
      SELECT id, "quantite_sortie", "quantite_restante", "diagnosticArriveeId",
             "detailDiagnosticId", "quantiteSortieDetail", "reparationId"
      FROM "PieceSAV" WHERE id = ${id} LIMIT 1
    `
  );
  return rows[0] ?? null;
}

export async function pieceSAVOccupiedByDetailRaw(
  detailDiagnosticId: string
): Promise<{ id: string } | null> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`
      SELECT id FROM "PieceSAV"
      WHERE "detailDiagnosticId" = ${detailDiagnosticId}
      LIMIT 1
    `
  );
  return rows[0] ?? null;
}

export async function pieceSAVUpdateReparationSortieRaw(
  id: string,
  quantite_sortie: number,
  quantite_restante: number,
  reparationId: string,
  db: SqlExecutor = prisma
): Promise<void> {
  await db.$executeRaw(
    Prisma.sql`
      UPDATE "PieceSAV"
      SET "quantite_sortie" = ${quantite_sortie},
          "quantite_restante" = ${quantite_restante},
          "reparationId" = ${reparationId},
          "diagnosticArriveeId" = NULL,
          "detailDiagnosticId" = NULL,
          "quantiteSortieDetail" = 0,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
  );
}

/** Lie la pièce à une réparation sans retirer le lien diagnostic (clôture atelier). */
export async function pieceSAVAttachReparationOnlyRaw(
  id: string,
  reparationId: string,
  db: SqlExecutor = prisma
): Promise<void> {
  await db.$executeRaw(
    Prisma.sql`
      UPDATE "PieceSAV"
      SET "reparationId" = ${reparationId},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
  );
}

export async function pieceSAVUpdateDiagnosticSortieRaw(
  id: string,
  data: {
    quantite_sortie: number;
    quantite_restante: number;
    diagnosticArriveeId: string;
    detailDiagnosticId: string;
    quantiteSortieDetail: number;
  }
): Promise<void> {
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "PieceSAV"
      SET "quantite_sortie" = ${data.quantite_sortie},
          "quantite_restante" = ${data.quantite_restante},
          "diagnosticArriveeId" = ${data.diagnosticArriveeId},
          "detailDiagnosticId" = ${data.detailDiagnosticId},
          "quantiteSortieDetail" = ${data.quantiteSortieDetail},
          "reparationId" = NULL,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
  );
}
