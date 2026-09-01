import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function asPhotoUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
}

/** Photos prises pendant le teste final (CheckListsSAV type FINALE). */
export async function fetchTesteFinalPhotosByVoiture(
  ids: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (ids.length === 0) return map;
  const rows = await prisma.$queryRaw<
    Array<{ voitureSAVId: string; photos: string[] | null }>
  >(
    Prisma.sql`
      SELECT "voitureSAVId", photos
      FROM "CheckListsSAV"
      WHERE "voitureSAVId" IN (${Prisma.join(ids)})
        AND type::text = 'FINALE'
      ORDER BY "createdAt" DESC
    `,
  );
  for (const row of rows) {
    const photos = asPhotoUrls(row.photos);
    if (photos.length === 0) continue;
    const existing = map.get(row.voitureSAVId) ?? [];
    map.set(row.voitureSAVId, [...existing, ...photos]);
  }
  return map;
}
