import { Prisma } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";

export const DEPLACEMENTS_SAV = [
  "ARRIVEE",
  "DIAGNOSTIQUE",
  "PREPARATION",
  "PROFORMA",
  "MAINTENANCE",
  "SORTIE_MAINTENANCE",
  "TEST_FINAL",
  "RAPPORT_FINAL",
  "RETOUR_EN_SAV",
] as const;

export type DeplacementSAVValue = (typeof DEPLACEMENTS_SAV)[number];

const allowed = new Set<string>(DEPLACEMENTS_SAV);

let schemaReady: Promise<void> | null = null;

export function isDeplacementSAV(value: string): value is DeplacementSAVValue {
  return allowed.has(value);
}

export function ensureDeplacementSavSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "DeplacementSAV" AS ENUM (
            'ARRIVEE',
            'DIAGNOSTIQUE',
            'PREPARATION',
            'PROFORMA',
            'MAINTENANCE',
            'SORTIE_MAINTENANCE',
            'TEST_FINAL',
            'RAPPORT_FINAL',
            'RETOUR_EN_SAV'
          );
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `);
      for (const value of DEPLACEMENTS_SAV) {
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "DeplacementSAV" ADD VALUE IF NOT EXISTS '${value}'`
        );
      }
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "VoitureSAV"
        ADD COLUMN IF NOT EXISTS "deplacementSAV" "DeplacementSAV" DEFAULT 'ARRIVEE'
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export async function fetchVoitureSavIdsByDeplacement(
  deplacement: string
): Promise<string[]> {
  if (!isDeplacementSAV(deplacement)) return [];
  const query = () =>
    executeWithRetry(() =>
      prisma.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          SELECT id FROM "VoitureSAV"
          WHERE "deplacementSAV"::text = ${deplacement}
        `
      )
    );
  try {
    return (await query()).map((row) => row.id);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!/deplacementSAV|DeplacementSAV/i.test(msg)) throw error;
    await ensureDeplacementSavSchema();
    return (await query()).map((row) => row.id);
  }
}

export async function fetchVoitureSavDeplacements(
  ids: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const query = () =>
    executeWithRetry(() =>
      prisma.$queryRaw<Array<{ id: string; deplacementSAV: string | null }>>(
        Prisma.sql`
          SELECT id, "deplacementSAV"::text AS "deplacementSAV"
          FROM "VoitureSAV"
          WHERE id IN (${Prisma.join(ids)})
        `
      )
    );
  try {
    const rows = await query();
    for (const row of rows) map.set(row.id, row.deplacementSAV ?? "");
    return map;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!/deplacementSAV|DeplacementSAV/i.test(msg)) throw error;
    await ensureDeplacementSavSchema();
    const rows = await query();
    for (const row of rows) map.set(row.id, row.deplacementSAV ?? "");
    return map;
  }
}

export async function withVoitureSavDeplacement<T extends { id: string }>(
  rows: T[]
): Promise<Array<T & { deplacementSAV: string }>> {
  const deplacements = await fetchVoitureSavDeplacements(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...row,
    deplacementSAV: deplacements.get(row.id) ?? "",
  }));
}

export async function setVoitureSavDeplacementSql(
  id: string,
  deplacement: string
) {
  if (!isDeplacementSAV(deplacement)) {
    throw new Error(`Déplacement véhicule non pris en charge : ${deplacement}`);
  }
  const update = () =>
    prisma.$executeRaw(
      Prisma.sql`
        UPDATE "VoitureSAV"
        SET "deplacementSAV" = ${Prisma.raw(`'${deplacement}'::"DeplacementSAV"`)},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    );
  try {
    await update();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      !/invalid input value for enum|deplacementSAV|DeplacementSAV/i.test(msg)
    ) {
      throw error;
    }
    await ensureDeplacementSavSchema();
    await update();
  }
}
