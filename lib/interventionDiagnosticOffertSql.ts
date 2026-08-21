import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

type SqlClient = Pick<PrismaClient, "$executeRaw" | "$queryRaw">;

export type InterventionOffertRow = {
  id: string;
  date_Intervention: Date;
  typeProduitUtilise: string;
  niveau_Intervention: number;
  voitureSAVId: string;
  detailDiagnosticId: string | null;
  groupePersonnelSAVId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

let schemaReady: Promise<void> | null = null;

/** Create table/columns the generated Prisma client may not know yet. */
export function ensureInterventionOffertSchema(db: SqlClient = prisma) {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS "InterventionDiagnosticOffert" (
          "id" TEXT NOT NULL,
          "date_Intervention" TIMESTAMP(3) NOT NULL,
          "typeProduitUtilise" TEXT NOT NULL,
          "niveau_Intervention" INTEGER NOT NULL DEFAULT 1,
          "voitureSAVId" TEXT NOT NULL,
          "detailDiagnosticId" TEXT,
          "groupePersonnelSAVId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "InterventionDiagnosticOffert_pkey" PRIMARY KEY ("id")
        )
      `;
      await db.$executeRaw`
        ALTER TABLE "InterventionDiagnosticOffert"
          ADD COLUMN IF NOT EXISTS "niveau_Intervention" INTEGER DEFAULT 1
      `;
      await db.$executeRaw`
        ALTER TABLE "InterventionDiagnosticOffert"
          ADD COLUMN IF NOT EXISTS "detailDiagnosticId" TEXT
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export async function listInterventionsOffertRaw(
  voitureSAVId: string,
  detailDiagnosticId?: string | null,
  db: SqlClient = prisma,
): Promise<InterventionOffertRow[]> {
  await ensureInterventionOffertSchema(db);
  const detailFilter = detailDiagnosticId
    ? Prisma.sql`AND i."detailDiagnosticId" = ${detailDiagnosticId}`
    : Prisma.sql``;

  return db.$queryRaw<InterventionOffertRow[]>(Prisma.sql`
    SELECT
      i.id,
      i."date_Intervention",
      i."typeProduitUtilise",
      COALESCE(i."niveau_Intervention", 1) AS "niveau_Intervention",
      i."voitureSAVId",
      i."detailDiagnosticId",
      i."groupePersonnelSAVId",
      i."createdAt",
      i."updatedAt"
    FROM "InterventionDiagnosticOffert" i
    WHERE i."voitureSAVId" = ${voitureSAVId}
    ${detailFilter}
    ORDER BY COALESCE(i."niveau_Intervention", 1) ASC, i."createdAt" ASC
  `);
}

export async function maxInterventionNiveauRaw(
  voitureSAVId: string,
  detailDiagnosticId?: string | null,
  db: SqlClient = prisma,
): Promise<number> {
  await ensureInterventionOffertSchema(db);
  const detailFilter = detailDiagnosticId
    ? Prisma.sql`AND "detailDiagnosticId" = ${detailDiagnosticId}`
    : Prisma.sql``;

  const rows = await db.$queryRaw<{ max: number | null }[]>(Prisma.sql`
    SELECT COALESCE(MAX("niveau_Intervention"), 0)::int AS max
    FROM "InterventionDiagnosticOffert"
    WHERE "voitureSAVId" = ${voitureSAVId}
    ${detailFilter}
  `);
  return rows[0]?.max ?? 0;
}

export async function createInterventionOffertRaw(
  data: {
    typeProduitUtilise: string;
    niveau_Intervention: number;
    voitureSAVId: string;
    detailDiagnosticId?: string | null;
    groupePersonnelSAVId?: string | null;
  },
  db: SqlClient = prisma,
): Promise<InterventionOffertRow> {
  await ensureInterventionOffertSchema(db);
  const id = randomUUID();
  const now = new Date();
  const rows = await db.$queryRaw<InterventionOffertRow[]>(Prisma.sql`
    INSERT INTO "InterventionDiagnosticOffert" (
      id,
      "date_Intervention",
      "typeProduitUtilise",
      "niveau_Intervention",
      "voitureSAVId",
      "detailDiagnosticId",
      "groupePersonnelSAVId",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${id},
      ${now},
      ${data.typeProduitUtilise},
      ${data.niveau_Intervention},
      ${data.voitureSAVId},
      ${data.detailDiagnosticId ?? null},
      ${data.groupePersonnelSAVId ?? null},
      ${now},
      ${now}
    )
    RETURNING
      id,
      "date_Intervention",
      "typeProduitUtilise",
      COALESCE("niveau_Intervention", 1) AS "niveau_Intervention",
      "voitureSAVId",
      "detailDiagnosticId",
      "groupePersonnelSAVId",
      "createdAt",
      "updatedAt"
  `);
  return rows[0];
}
