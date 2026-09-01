import { Prisma } from "@prisma/client";
import { executeWithRetry, prisma } from "@/lib/prisma";

/** Nested voiture fields for facture/proforma — omit `statut` (Prisma enum mapping). */
export const voitureSavFactureSelect = {
  id: true,
  model: true,
  immatriculation: true,
  couleur: true,
  motorisation: true,
  transmission: true,
  ClientSAV: true,
} as const;

export function isUnknownStatutVoitureSavError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("not found in enum") && msg.includes("StatutVoitureSAV")
  );
}

export async function fetchVoitureSavStatuts(
  ids: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const rows = await executeWithRetry(() =>
    prisma.$queryRaw<Array<{ id: string; statut: string }>>(
      Prisma.sql`
        SELECT id, statut::text AS statut
        FROM "VoitureSAV"
        WHERE id IN (${Prisma.join(ids)})
      `
    )
  );
  for (const row of rows) map.set(row.id, row.statut);
  return map;
}

export async function fetchVoitureSavIdsByStatut(
  statut: string
): Promise<string[]> {
  const rows = await executeWithRetry(() =>
    prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id FROM "VoitureSAV"
        WHERE statut::text = ${statut}
      `
    )
  );
  return rows.map((row) => row.id);
}

export async function setVoitureSavStatutSql(id: string, statut: string) {
  const allowed = new Set([
    "ARRIVE",
    "DIAGNOSTIC_FINI",
    "PREPARATION_FINI",
    "DISPATCHE",
    "FIN_INTERVENTION_GARANTIESAV_EN_COURS",
    "GARANTIESAV_EN_COURS",
    "GARANTIESAV_TERMINE",
    "EN_TRAITEMENT",
    "EN_TRAITEMENT_EN_COURS",
    "EN_TRAITEMENT_FINI",
    "EN_MAINTENANCE",
    "EN_MAINTENANCE_EN_ATTENTE",
    "EN_MAINTENANCE_EN_COURS",
    "EN_MAINTENANCE_FINI",
    "TESTE",
    "TESTE_EN_COURS",
    "TESTE_FINAL",
    "TERMINE",
    "ANNULE",
  ]);
  if (!allowed.has(statut)) {
    throw new Error(`Statut véhicule non pris en charge : ${statut}`);
  }
  try {
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "VoitureSAV"
        SET statut = ${Prisma.raw(`'${statut}'::"StatutVoitureSAV"`)},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes("invalid input value for enum")) throw error;
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "StatutVoitureSAV" ADD VALUE IF NOT EXISTS '${statut}'`
    );
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "VoitureSAV"
        SET statut = ${Prisma.raw(`'${statut}'::"StatutVoitureSAV"`)},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    );
  }
}

export async function withVoitureSavStatut<T extends { id: string }>(
  rows: T[]
): Promise<Array<T & { statut: string }>> {
  const statuts = await fetchVoitureSavStatuts(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...row,
    statut: statuts.get(row.id) ?? "",
  }));
}
