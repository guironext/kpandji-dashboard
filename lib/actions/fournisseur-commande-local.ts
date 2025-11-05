"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function createFournisseurCommandeLocal(data: {
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  type_Activite?: string;
  commandeLocalId?: string;
}) {
  try {
    if (!data.nom || !data.nom.trim()) {
      return { success: false, error: "Le nom est requis" };
    }

    const fournisseurCommandeLocal = await prisma.fournisseurCommandeLocal.create({
      data: {
        nom: data.nom.trim(),
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        code_postal: data.code_postal || null,
        pays: data.pays || null,
        type_Activite: data.type_Activite || null,
        commandeLocalId: data.commandeLocalId || null,
      },
    });

    revalidatePath("/comptable/fournisseur-locaux");
    return { success: true, data: fournisseurCommandeLocal };
  } catch (error: unknown) {
    console.error("Error creating fournisseur commande local:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création du fournisseur";
    return { success: false, error: errorMessage };
  }
}

export async function getAllFournisseurCommandeLocal() {
  try {
    const fournisseurs = await prisma.fournisseurCommandeLocal.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: fournisseurs };
  } catch (error) {
    console.error("Error fetching fournisseurs:", error);
    return { success: false, error: "Erreur lors de la récupération des fournisseurs" };
  }
}

export async function getFournisseurCommandeLocalById(id: string) {
  try {
    const fournisseur = await prisma.fournisseurCommandeLocal.findUnique({
      where: { id },
    });

    if (!fournisseur) {
      return { success: false, error: "Fournisseur non trouvé" };
    }

    return { success: true, data: fournisseur };
  } catch (error) {
    console.error("Error fetching fournisseur:", error);
    return { success: false, error: "Erreur lors de la récupération du fournisseur" };
  }
}

export async function updateFournisseurCommandeLocal(
  id: string,
  data: {
    nom?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
    pays?: string;
    type_Activite?: string;
  }
) {
  try {
    const fournisseur = await prisma.fournisseurCommandeLocal.update({
      where: { id },
      data: {
        ...(data.nom && { nom: data.nom.trim() }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.telephone !== undefined && { telephone: data.telephone || null }),
        ...(data.adresse !== undefined && { adresse: data.adresse || null }),
        ...(data.ville !== undefined && { ville: data.ville || null }),
        ...(data.code_postal !== undefined && { code_postal: data.code_postal || null }),
        ...(data.pays !== undefined && { pays: data.pays || null }),
        ...(data.type_Activite !== undefined && { type_Activite: data.type_Activite || null }),
      },
    });

    revalidatePath("/comptable/fournisseur-locaux");
    return { success: true, data: fournisseur };
  } catch (error: unknown) {
    console.error("Error updating fournisseur:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la mise à jour" };
  }
}

export async function deleteFournisseurCommandeLocal(id: string) {
  try {
    await prisma.fournisseurCommandeLocal.delete({
      where: { id },
    });

    revalidatePath("/comptable/fournisseur-locaux");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fournisseur:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

export async function getAllCommandeLocaux() {
  try {
    const commandeLocaux = await prisma.commandeLocal.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const serialized = commandeLocaux.map((c) => ({
      ...c,
      price: Number(c.price),
      total: Number(c.total),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching commande locaux:", error);
    return { success: false, error: "Erreur lors de la récupération des commandes locales" };
  }
}

export async function getAllFournisseurs() {
  try {
    const fournisseurs = await prisma.fournisseur.findMany({
      orderBy: {
        nom: "asc",
      },
    });

    return { success: true, data: fournisseurs };
  } catch (error) {
    console.error("Error fetching fournisseurs:", error);
    return { success: false, error: "Erreur lors de la récupération des fournisseurs" };
  }
}

