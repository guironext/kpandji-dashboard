import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function asPhotoUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
}

function photosArraySql(photos: string[]) {
  if (photos.length === 0) return Prisma.sql`ARRAY[]::text[]`;
  return Prisma.sql`ARRAY[${Prisma.join(photos)}]::text[]`;
}

export async function getCheckListPhotos(id: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ photos: string[] | null }>>(
    Prisma.sql`SELECT photos FROM "CheckListsSAV" WHERE id = ${id}`,
  );
  return asPhotoUrls(rows[0]?.photos);
}

export async function setCheckListPhotos(
  id: string,
  photos: string[],
): Promise<string[]> {
  const next = asPhotoUrls(photos);
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "CheckListsSAV"
      SET photos = ${photosArraySql(next)},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `,
  );
  return next;
}

export async function appendCheckListPhoto(
  id: string,
  url: string,
): Promise<string[]> {
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "CheckListsSAV"
      SET photos = array_append(COALESCE(photos, ARRAY[]::text[]), ${url}),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `,
  );
  return getCheckListPhotos(id);
}

export async function removeCheckListPhoto(
  id: string,
  url: string,
): Promise<string[]> {
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE "CheckListsSAV"
      SET photos = array_remove(COALESCE(photos, ARRAY[]::text[]), ${url}),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `,
  );
  return getCheckListPhotos(id);
}

export async function attachCheckListPhotos<T extends { id: string } | null>(
  row: T,
): Promise<(T & { photos: string[] }) | null> {
  if (!row) return null;
  const photos = await getCheckListPhotos(row.id);
  return { ...row, photos };
}
