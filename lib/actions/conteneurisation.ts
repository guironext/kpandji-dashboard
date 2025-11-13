"use server";

import { prisma } from "@/lib/prisma";
import { EtapeCommande, EtapeConteneur } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

// Fetch all validated commandes
export async function getValidatedCommandes() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: EtapeCommande.VALIDE,
        conteneurId: null,
      },
      include: {
        voitureModel: true,
        client: true,
        clientEntreprise: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Serialize Decimal values
    const serializedCommandes = commandes.map((commande) => ({
      ...commande,
      prix_unitaire: commande.prix_unitaire ? Number(commande.prix_unitaire) : null,
    }));
    
    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching validated commandes:", error);
    return { success: false, error: "Failed to fetch commandes" };
  }
}

// Fetch all conteneurs (excluding TRANSITE status)
export async function getAllConteneurs() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: {
          not: EtapeConteneur.TRANSITE,
        },
      },
      include: {
        commandes: {
          include: {
            voitureModel: true,
            client: true,
            clientEntreprise: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Serialize Decimal values in commandes
    const serializedConteneurs = conteneurs.map((conteneur) => ({
      ...conteneur,
      commandes: conteneur.commandes.map((commande) => ({
        ...commande,
        prix_unitaire: commande.prix_unitaire ? Number(commande.prix_unitaire) : null,
      })),
    }));
    
    return { success: true, data: serializedConteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs:", error);
    return { success: false, error: "Failed to fetch conteneurs" };
  }
}

// Create a new conteneur
export async function createConteneur(data: {
  conteneurNumber: string;
  sealNumber: string;
  totalPackages?: string;
  grossWeight?: string;
  netWeight?: string;
  stuffingMap?: string;
  dateEmbarquement?: Date;
  dateArriveProbable?: Date;
}) {
  try {
    const conteneur = await prisma.conteneur.create({
      data: {
        ...data,
        etapeConteneur: EtapeConteneur.EN_ATTENTE,
      },
    });
    revalidatePath("/manager/conteneurisation");
    return { success: true, data: conteneur };
  } catch (error) {
    console.error("Error creating conteneur:", error);
    return { success: false, error: "Failed to create conteneur" };
  }
}

// Assign commande to conteneur
export async function assignCommandeToConteneur(
  commandeId: string,
  conteneurId: string
) {
  try {
    // Update the commande with conteneurId
    await prisma.commande.update({
      where: { id: commandeId },
      data: {
        conteneurId: conteneurId,
      },
    });

    // Update conteneur status to CHARGE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: EtapeConteneur.CHARGE,
      },
    });

    revalidatePath("/manager/conteneurisation");
    return { success: true };
  } catch (error) {
    console.error("Error assigning commande to conteneur:", error);
    return { success: false, error: "Failed to assign commande" };
  }
}

// Remove commande from conteneur
export async function removeCommandeFromConteneur(commandeId: string) {
  try {
    await prisma.commande.update({
      where: { id: commandeId },
      data: {
        conteneurId: null,
      },
    });

    revalidatePath("/manager/conteneurisation");
    return { success: true };
  } catch (error) {
    console.error("Error removing commande from conteneur:", error);
    return { success: false, error: "Failed to remove commande" };
  }
}

// Send conteneur (update status to TRANSITE)
export async function sendConteneur(conteneurId: string) {
  try {
    // Update conteneur status to TRANSITE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: EtapeConteneur.TRANSITE,
      },
    });

    // Update all commandes in this conteneur to TRANSITE
    await prisma.commande.updateMany({
      where: { conteneurId: conteneurId },
      data: {
        etapeCommande: EtapeCommande.TRANSITE,
      },
    });

    revalidatePath("/manager/conteneurisation");
    return { success: true };
  } catch (error) {
    console.error("Error sending conteneur:", error);
    return { success: false, error: "Failed to send conteneur" };
  }
}

