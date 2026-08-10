"use server";

import { prisma } from "@/lib/prisma";
import {
  EtapeCommande,
  EtapeConteneur,
  EtapeCommandeGroupee,
} from "@prisma/client";
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
        VoitureModel: true,
        Client: true,
        Client_entreprise: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serialize Decimal values
    const serializedCommandes = (commandes as unknown[]).map((commande: unknown) => {
      const cmd = commande as Record<string, unknown> & {
        prix_unitaire?: unknown;
        VoitureModel?: unknown;
        Client?: unknown;
        Client_entreprise?: unknown;
      };
      return {
        ...cmd,
        prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
        voitureModel: cmd.VoitureModel,
        client: cmd.Client,
        clientEntreprise: cmd.Client_entreprise,
      };
    });

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
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serialize Decimal values in commandes
    const serializedConteneurs = (conteneurs as unknown[]).map((conteneur: unknown) => {
      const c = conteneur as Record<string, unknown> & { Commande?: unknown[] };
      return {
        ...c,
        commandes: (c.Commande || []).map((commande: unknown) => {
          const cmd = commande as Record<string, unknown> & {
            prix_unitaire?: unknown;
            VoitureModel?: unknown;
            Client?: unknown;
            Client_entreprise?: unknown;
          };
          return {
            ...cmd,
            prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
            voitureModel: cmd.VoitureModel,
            client: cmd.Client,
            clientEntreprise: cmd.Client_entreprise,
          };
        }),
      };
    });

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
  conteneurId: string,
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

// Fetch all VALIDE commandeGroupee with their commandes
export async function getValideCommandesGroupees() {
  try {
    const commandesGroupees = await prisma.commandeGroupee.findMany({
      where: {
        etapeCommandeGroupee: EtapeCommandeGroupee.VALIDE,
      },
      include: {
        Commande: {
          include: {
            VoitureModel: true,
            Client: true,
            Client_entreprise: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Serialize Decimal values and dates
    const serialized = (commandesGroupees as unknown[]).map((cg: unknown) => {
      const group = cg as Record<string, unknown> & {
        date_validation: Date;
        createdAt: Date;
        updatedAt: Date;
        Commande?: unknown[];
      };
      return {
        ...group,
        date_validation: (group.date_validation as Date).toISOString(),
        createdAt: (group.createdAt as Date).toISOString(),
        updatedAt: (group.updatedAt as Date).toISOString(),
        commandes: (group.Commande || []).map((cmd: unknown) => {
          const c = cmd as Record<string, unknown> & {
            prix_unitaire?: unknown;
            date_livraison?: Date;
            createdAt: Date;
            updatedAt: Date;
            VoitureModel?: unknown;
            Client?: unknown;
            Client_entreprise?: unknown;
          };
          return {
            ...c,
            prix_unitaire: c.prix_unitaire ? Number(c.prix_unitaire) : null,
            date_livraison: c.date_livraison
              ? (c.date_livraison as Date).toISOString()
              : null,
            createdAt: (c.createdAt as Date).toISOString(),
            updatedAt: (c.updatedAt as Date).toISOString(),
            voitureModel: c.VoitureModel,
            client: c.Client,
            clientEntreprise: c.Client_entreprise,
          };
        }),
      };
    });

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching VALIDE commandes groupées:", error);
    return { success: false, error: "Failed to fetch commandes groupées" };
  }
}

// Update commandeGroupee and its commandes to TRANSITE when empty
export async function updateCommandeGroupeeToTransite(
  commandeGroupeeId: string,
) {
  try {
    // Check if commandeGroupee has any commandes left
    const commandeGroupee = await prisma.commandeGroupee.findUnique({
      where: { id: commandeGroupeeId },
      include: {
        Commande: true,
      },
    });

    if (!commandeGroupee) {
      return { success: false, error: "Commande groupée not found" };
    }

    // If there are no commandes left, update to TRANSITE
    if (((commandeGroupee as unknown) as { Commande: unknown[] }).Commande.length === 0) {
      await prisma.commandeGroupee.update({
        where: { id: commandeGroupeeId },
        data: {
          etapeCommandeGroupee: EtapeCommandeGroupee.TRANSITE,
        },
      });
    }

    revalidatePath("/manager/conteneurisation");
    return { success: true };
  } catch (error) {
    console.error("Error updating commande groupée to TRANSITE:", error);
    return { success: false, error: "Failed to update commande groupée" };
  }
}
