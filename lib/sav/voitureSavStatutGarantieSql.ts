import { Prisma } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";

export const STATUTS_GARANTIE_SAV = [
  "EN_COURS",
  "FIN_INTERVENTION_GARANTIESAV_EN_COURS",
  "GARANTIESAV_EN_COURS",
  "GARANTIESAV_TERMINE",
  "PAS_DE_GARANTIE",
] as const;

export type StatutGarantieSAVValue = (typeof STATUTS_GARANTIE_SAV)[number];

const allowed = new Set<string>(STATUTS_GARANTIE_SAV);

let schemaReady: Promise<void> | null = null;

export function isStatutGarantieSAV(
  value: string
): value is StatutGarantieSAVValue {
  return allowed.has(value);
}

export function isUnknownStatutGarantieSavError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("StatutGarantieSAV") && msg.includes("not found in enum");
}

export function ensureStatutGarantieSavSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "StatutGarantieSAV" AS ENUM (
            'EN_COURS',
            'FIN_INTERVENTION_GARANTIESAV_EN_COURS',
            'GARANTIESAV_EN_COURS',
            'GARANTIESAV_TERMINE',
            'PAS_DE_GARANTIE'
          );
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `);
      for (const value of STATUTS_GARANTIE_SAV) {
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "StatutGarantieSAV" ADD VALUE IF NOT EXISTS '${value}'`
        );
      }
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "VoitureSAV"
        ADD COLUMN IF NOT EXISTS "StatutGarantie" "StatutGarantieSAV" DEFAULT 'EN_COURS'
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export async function fetchVoitureSavStatutsGarantie(
  ids: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const rows = await executeWithRetry(() =>
    prisma.$queryRaw<Array<{ id: string; StatutGarantie: string | null }>>(
      Prisma.sql`
        SELECT id, "StatutGarantie"::text AS "StatutGarantie"
        FROM "VoitureSAV"
        WHERE id IN (${Prisma.join(ids)})
      `
    )
  );
  for (const row of rows) map.set(row.id, row.StatutGarantie ?? "");
  return map;
}

export async function withVoitureSavStatutGarantie<T extends { id: string }>(
  rows: T[]
): Promise<Array<T & { StatutGarantie: string }>> {
  const map = await fetchVoitureSavStatutsGarantie(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...row,
    StatutGarantie: map.get(row.id) ?? "",
  }));
}

type WithNestedStatutGarantie<T extends { voitureSAV?: { id: string } | null }> =
  Omit<T, "voitureSAV"> & {
    voitureSAV: T["voitureSAV"] extends infer V
      ? V extends { id: string }
        ? V & { StatutGarantie: string }
        : V
      : T["voitureSAV"];
  };

export async function withNestedVoitureSavStatutGarantie<
  T extends { voitureSAV?: { id: string } | null },
>(rows: T[]): Promise<Array<WithNestedStatutGarantie<T>>> {
  const ids = [
    ...new Set(
      rows
        .map((r) => r.voitureSAV?.id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const map = await fetchVoitureSavStatutsGarantie(ids);
  return rows.map((row) => {
    if (!row.voitureSAV) {
      return row as unknown as WithNestedStatutGarantie<T>;
    }
    return {
      ...row,
      voitureSAV: {
        ...row.voitureSAV,
        StatutGarantie: map.get(row.voitureSAV.id) ?? "",
      },
    } as unknown as WithNestedStatutGarantie<T>;
  });
}

export async function setVoitureSavStatutGarantieSql(
  id: string,
  statut: string
) {
  if (!isStatutGarantieSAV(statut)) {
    throw new Error(`Statut garantie non pris en charge : ${statut}`);
  }
  const update = () =>
    prisma.$executeRaw(
      Prisma.sql`
        UPDATE "VoitureSAV"
        SET "StatutGarantie" = ${Prisma.raw(`'${statut}'::"StatutGarantieSAV"`)},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    );
  try {
    await update();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      !/invalid input value for enum|StatutGarantie|StatutGarantieSAV/i.test(msg)
    ) {
      throw error;
    }
    await ensureStatutGarantieSavSchema();
    await update();
  }
}
