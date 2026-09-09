"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createFournisseur(data: {
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  type_Activite?: string;
}) {
  try {
    const nom = data.nom?.trim();
    if (!nom) {
      return { success: false, error: "Le nom du fournisseur est requis." };
    }

    const fournisseur = await prisma.fournisseur.create({
      data: {
        id: crypto.randomUUID(),
        nom,
        email: emptyToNull(data.email),
        telephone: emptyToNull(data.telephone),
        adresse: emptyToNull(data.adresse),
        ville: emptyToNull(data.ville),
        code_postal: emptyToNull(data.code_postal),
        pays: emptyToNull(data.pays),
        type_Activite: emptyToNull(data.type_Activite),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/sav/fournisseurs");
    return { success: true, data: serializeFournisseur(fournisseur) };
  } catch (error) {
    console.error("Error creating fournisseur:", error);
    return {
      success: false,
      error: "Erreur lors de la création du fournisseur.",
    };
  }
}

function serializeFournisseur(fournisseur: unknown) {
  const f = fournisseur as Record<string, unknown> & {
    createdAt: Date;
    updatedAt: Date;
  };
  return {
    ...f,
    createdAt: (f.createdAt as Date).toISOString(),
    updatedAt: (f.updatedAt as Date).toISOString(),
  };
}

export async function getFournisseur(id: string) {
  try {
    const fournisseur = await prisma.fournisseur.findUnique({
      where: { id },
    });
    if (!fournisseur) {
      return { success: false, error: "Fournisseur not found" };
    }
    return { success: true, data: serializeFournisseur(fournisseur) };
  } catch (error) {
    console.error("Error fetching fournisseur:", error);
    return { success: false, error: "Failed to fetch fournisseur" };
  }
}

export async function getAllFournisseurs() {
  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const serialized = (fournisseurs as unknown[]).map(serializeFournisseur);
    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching fournisseurs:", error);
    return { success: false, error: "Failed to fetch fournisseurs" };
  }
}

export async function updateFournisseur(id: string, data: {
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  type_Activite?: string;
}) {
  try {
    const fournisseur = await prisma.fournisseur.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return { success: true, data: serializeFournisseur(fournisseur) };
  } catch (error) {
    console.error("Error updating fournisseur:", error);
    return { success: false, error: "Failed to update fournisseur" };
  }
}

export async function deleteFournisseur(id: string) {
  try {
    await prisma.fournisseur.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting fournisseur:", error);
    return { success: false, error: "Failed to delete fournisseur" };
  }
}
