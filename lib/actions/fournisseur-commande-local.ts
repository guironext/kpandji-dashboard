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
        id: crypto.randomUUID(),
        nom: data.nom.trim(),
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        ville: data.ville || null,
        code_postal: data.code_postal || null,
        pays: data.pays || null,
        type_Activite: data.type_Activite || null,
        commandeLocalId: data.commandeLocalId || null,
        updatedAt: new Date(),
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

    const serialized = (fournisseurs as unknown[]).map((f: unknown) => {
      const fournisseur = f as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
      };
      return {
        ...fournisseur,
        createdAt: (fournisseur.createdAt as Date).toISOString(),
        updatedAt: (fournisseur.updatedAt as Date).toISOString(),
      };
    });

    return { success: true, data: serialized };
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

    const serialized = {
      ...fournisseur,
      createdAt: (fournisseur.createdAt as Date).toISOString(),
      updatedAt: (fournisseur.updatedAt as Date).toISOString(),
    };

    return { success: true, data: serialized };
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
        updatedAt: new Date(),
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

function parseLocalDate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (match) {
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function serializeCommandeLocal(commande: {
  id: string;
  article: string;
  description: string;
  quantity: number;
  price: unknown;
  total: unknown;
  date_livraison: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: commande.id,
    article: commande.article,
    description: commande.description,
    quantity: commande.quantity,
    price: Number(commande.price),
    total: Number(commande.total),
    date_livraison: commande.date_livraison.toISOString(),
    createdAt: commande.createdAt.toISOString(),
    updatedAt: commande.updatedAt.toISOString(),
  };
}

export async function createCommandeLocal(data: {
  article: string;
  description: string;
  quantity: number;
  price: number;
  date_livraison: string;
}) {
  try {
    const article = data.article?.trim() ?? "";
    const description = data.description?.trim() ?? "";
    const quantity = Number(data.quantity);
    const price = Number(data.price);
    const dateLivraison = parseLocalDate(data.date_livraison);

    if (!article) {
      return { success: false, error: "L'article est requis" };
    }
    if (!description) {
      return { success: false, error: "La description est requise" };
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        success: false,
        error: "La quantité doit être un entier positif",
      };
    }
    if (!Number.isFinite(price) || price < 0) {
      return { success: false, error: "Le prix unitaire est invalide" };
    }
    if (!dateLivraison || Number.isNaN(dateLivraison.getTime())) {
      return { success: false, error: "La date de livraison est requise" };
    }

    const total = Math.round(quantity * price * 100) / 100;
    const now = new Date();

    const commandeLocal = await prisma.commandeLocal.create({
      data: {
        id: crypto.randomUUID(),
        article,
        description,
        quantity,
        price,
        total,
        date_livraison: dateLivraison,
        updatedAt: now,
      },
    });

    revalidatePath("/sav/achat-local");
    revalidatePath("/comptable/commandes-locaux");

    return {
      success: true,
      data: serializeCommandeLocal(commandeLocal),
    };
  } catch (error: unknown) {
    console.error("Error creating commande local:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erreur lors de la création de l'achat local";
    return { success: false, error: errorMessage };
  }
}

export async function getAllCommandeLocaux() {
  try {
    const commandeLocaux = await prisma.commandeLocal.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const serialized = (commandeLocaux as unknown[]).map((commande: unknown) => {
      const c = commande as Record<string, unknown> & {
        price: unknown;
        total: unknown;
        date_livraison: Date;
        createdAt: Date;
        updatedAt: Date;
      };
      return {
        ...c,
        price: Number(c.price),
        total: Number(c.total),
        date_livraison: (c.date_livraison as Date).toISOString(),
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
      };
    });

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

    const serialized = (fournisseurs as unknown[]).map((f: unknown) => {
      const fournisseur = f as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
      };
      return {
        ...fournisseur,
        createdAt: (fournisseur.createdAt as Date).toISOString(),
        updatedAt: (fournisseur.updatedAt as Date).toISOString(),
      };
    });

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching fournisseurs:", error);
    return { success: false, error: "Erreur lors de la récupération des fournisseurs" };
  }
}

