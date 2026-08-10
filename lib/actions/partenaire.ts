"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { isTypePartenaire, type PartenaireFormInput } from "../partenaire-types";
import { prisma } from "../prisma";

/**
 * Stale `prisma generate` (e.g. Windows EPERM on the query engine) can omit `prisma.partenaire`.
 * Raw SQL against `public."Partenaire"` still works as long as the table exists in PostgreSQL.
 */

type PartenaireRow = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  type_partenaire: string;
  createdAt: Date;
  updatedAt: Date;
};

function serialize(p: {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  pays: string | null;
  type_partenaire: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const t = p.type_partenaire;
  if (!isTypePartenaire(t)) {
    throw new Error('Valeur "type_partenaire" inattendue en base');
  }
  return {
    id: p.id,
    nom: p.nom,
    email: p.email,
    telephone: p.telephone,
    adresse: p.adresse,
    ville: p.ville,
    code_postal: p.code_postal,
    pays: p.pays,
    type_partenaire: t,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function createPartenaire(data: PartenaireFormInput) {
  const nom = data.nom?.trim();
  if (!nom) {
    return { success: false as const, error: "Le nom est obligatoire" };
  }

  if (!isTypePartenaire(data.type_partenaire)) {
    return { success: false as const, error: "Type de partenaire invalide" };
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const email = data.email?.trim() || null;
  const telephone = data.telephone?.trim() || null;
  const adresse = data.adresse?.trim() || null;
  const ville = data.ville?.trim() || null;
  const code_postal = data.code_postal?.trim() || null;
  const pays = data.pays?.trim() || null;

  try {
    const inserted = await prisma.$queryRaw<PartenaireRow[]>(Prisma.sql`
      INSERT INTO "Partenaire" (
        id,
        nom,
        email,
        telephone,
        adresse,
        ville,
        code_postal,
        pays,
        type_partenaire,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${id},
        ${nom},
        ${email},
        ${telephone},
        ${adresse},
        ${ville},
        ${code_postal},
        ${pays},
        CAST(${data.type_partenaire} AS "TypePartenaire"),
        ${now},
        ${now}
      )
      RETURNING
        id,
        nom,
        email,
        telephone,
        adresse,
        ville,
        code_postal,
        pays,
        type_partenaire::text AS type_partenaire,
        "createdAt",
        "updatedAt"
    `);
    const row = inserted[0];
    if (!row) {
      return { success: false as const, error: "Enregistrement impossible" };
    }
    revalidatePath("/assistante/repertoire-partenaires");
    return { success: true as const, data: serialize(row) };
  } catch (error) {
    console.error("Error creating partenaire:", error);
    return { success: false as const, error: "Enregistrement impossible" };
  }
}

export async function updatePartenaire(id: string, data: PartenaireFormInput) {
  const nom = data.nom?.trim();
  if (!nom) {
    return { success: false as const, error: "Le nom est obligatoire" };
  }
  if (!isTypePartenaire(data.type_partenaire)) {
    return { success: false as const, error: "Type de partenaire invalide" };
  }

  const now = new Date();
  const email = data.email?.trim() || null;
  const telephone = data.telephone?.trim() || null;
  const adresse = data.adresse?.trim() || null;
  const ville = data.ville?.trim() || null;
  const code_postal = data.code_postal?.trim() || null;
  const pays = data.pays?.trim() || null;

  try {
    const updated = await prisma.$queryRaw<PartenaireRow[]>(Prisma.sql`
      UPDATE "Partenaire"
      SET
        nom = ${nom},
        email = ${email},
        telephone = ${telephone},
        adresse = ${adresse},
        ville = ${ville},
        code_postal = ${code_postal},
        pays = ${pays},
        type_partenaire = CAST(${data.type_partenaire} AS "TypePartenaire"),
        "updatedAt" = ${now}
      WHERE id = ${id}
      RETURNING
        id,
        nom,
        email,
        telephone,
        adresse,
        ville,
        code_postal,
        pays,
        type_partenaire::text AS type_partenaire,
        "createdAt",
        "updatedAt"
    `);
    const row = updated[0];
    if (!row) {
      return { success: false as const, error: "Partenaire introuvable" };
    }
    revalidatePath("/assistante/repertoire-partenaires");
    return { success: true as const, data: serialize(row) };
  } catch (error) {
    console.error("Error updating partenaire:", error);
    return { success: false as const, error: "Mise à jour impossible" };
  }
}

export async function deletePartenaire(id: string) {
  if (!id?.trim()) {
    return { success: false as const, error: "Identifiant invalide" };
  }
  try {
    const removed = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      DELETE FROM "Partenaire"
      WHERE id = ${id}
      RETURNING id
    `);
    if (!removed[0]) {
      return { success: false as const, error: "Partenaire introuvable" };
    }
    revalidatePath("/assistante/repertoire-partenaires");
    return { success: true as const };
  } catch (error) {
    console.error("Error deleting partenaire:", error);
    return { success: false as const, error: "Suppression impossible" };
  }
}

export async function getAllPartenaires() {
  try {
    const rows = await prisma.$queryRaw<PartenaireRow[]>(Prisma.sql`
      SELECT
        id,
        nom,
        email,
        telephone,
        adresse,
        ville,
        code_postal,
        pays,
        type_partenaire::text AS type_partenaire,
        "createdAt",
        "updatedAt"
      FROM "Partenaire"
      ORDER BY "createdAt" DESC
    `);
    return {
      success: true as const,
      data: rows.map(serialize),
    };
  } catch (error) {
    console.error("Error fetching partenaires:", error);
    return { success: false as const, error: "Lecture impossible" };
  }
}
