"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export async function getAllCourriers() {
  try {
    const courriers = await prisma.courrieAvantage.findMany({
      include: {
        Conteneur: {
          select: {
            id: true,
            conteneurNumber: true,
            sealNumber: true,
          },
        },
        Commande: {
          include: {
            VoitureModel: {
              select: {
                model: true,
              },
            },
            Client: {
              select: {
                nom: true,
              },
            },
            Client_entreprise: {
              select: {
                nom_entreprise: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Date objects and Decimal values
    const serializedCourriers = (courriers as unknown[]).map((courrier: unknown) => {
      const c = courrier as Record<string, unknown> & {
        date_livraison: Date | null;
        createdAt: Date;
        updatedAt: Date;
        Conteneur?: unknown;
        Commande?: Record<string, unknown> & {
          date_livraison: Date | null;
          createdAt: Date;
          updatedAt: Date;
          prix_unitaire: unknown;
          VoitureModel?: unknown;
          Client?: unknown;
          Client_entreprise?: unknown;
        };
      };
      return {
        id: c.id,
        date_livraison: c.date_livraison
          ? (c.date_livraison as Date).toISOString()
          : null,
        reference: c.reference,
        numero_conteneur: c.numero_conteneur,
        vin: c.vin,
        moteur: c.moteur,
        createdAt: (c.createdAt as Date).toISOString(),
        updatedAt: (c.updatedAt as Date).toISOString(),
        conteneurId: c.conteneurId,
        commandeId: c.commandeId,
        conteneur: c.Conteneur,
        commande: c.Commande
          ? {
              id: c.Commande.id,
              etapeCommande: c.Commande.etapeCommande,
              date_livraison: c.Commande.date_livraison
                ? (c.Commande.date_livraison as Date).toISOString()
                : null,
              createdAt: (c.Commande.createdAt as Date).toISOString(),
              updatedAt: (c.Commande.updatedAt as Date).toISOString(),
              clientId: c.Commande.clientId,
              conteneurId: c.Commande.conteneurId,
              commandeLocalId: c.Commande.commandeLocalId,
              couleur: c.Commande.couleur,
              montageId: c.Commande.montageId,
              motorisation: c.Commande.motorisation,
              nbr_portes: c.Commande.nbr_portes,
              transmission: c.Commande.transmission,
              voitureModelId: c.Commande.voitureModelId,
              clientEntrepriseId: c.Commande.clientEntrepriseId,
              factureId: c.Commande.factureId,
              prix_unitaire: c.Commande.prix_unitaire
                ? Number(c.Commande.prix_unitaire)
                : null,
              numChassis: c.Commande.numChassis,
              commandeFlag: c.Commande.commandeFlag,
              commandeGroupeeId: c.Commande.commandeGroupeeId,
              voitureModel: c.Commande.VoitureModel,
              client: c.Commande.Client,
              clientEntreprise: c.Commande.Client_entreprise,
            }
          : null,
      };
    });

    return { success: true, data: serializedCourriers };
  } catch (error) {
    console.error("Error fetching courriers:", error);
    return { success: false, error: "Failed to fetch courriers" };
  }
}

export async function createCourrier(data: {
  date_livraison: Date;
  reference: string;
  numero_conteneur: string;
  vin: string;
  moteur: string;
  conteneurId: string;
  commandeId?: string;
}) {
  try {
    const courrier = await prisma.courrieAvantage.create({
      data: {
        id: crypto.randomUUID(),
        date_livraison: data.date_livraison,
        reference: data.reference,
        numero_conteneur: data.numero_conteneur,
        vin: data.vin,
        moteur: data.moteur,
        conteneurId: data.conteneurId,
        commandeId: data.commandeId,
        updatedAt: new Date(),
      },
      include: {
        Conteneur: {
          select: {
            id: true,
            conteneurNumber: true,
            sealNumber: true,
          },
        },
        Commande: {
          include: {
            VoitureModel: {
              select: {
                model: true,
              },
            },
            Client: {
              select: {
                nom: true,
              },
            },
            Client_entreprise: {
              select: {
                nom_entreprise: true,
              },
            },
          },
        },
      },
    });

    revalidatePath("/manager/listeConteneurs/courriers");
    return { success: true, data: courrier };
  } catch (error) {
    console.error("Error creating courrier:", error);
    return { success: false, error: "Failed to create courrier" };
  }
}

export async function getAllConteneursForCourrier() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      select: {
        id: true,
        conteneurNumber: true,
        sealNumber: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs:", error);
    return { success: false, error: "Failed to fetch conteneurs" };
  }
}

export async function getCommandesForCourrier(conteneurId?: string) {
  try {
    const where: Prisma.CommandeWhereInput = {};
    if (conteneurId) {
      where.conteneurId = conteneurId;
    }

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        VoitureModel: {
          select: {
            model: true,
          },
        },
        Client: {
          select: {
            nom: true,
          },
        },
        Client_entreprise: {
          select: {
            nom_entreprise: true,
          },
        },
        Conteneur: {
          select: {
            id: true,
            conteneurNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const c = cmd as Record<string, unknown> & {
        prix_unitaire: unknown;
        date_livraison: Date | null;
        createdAt: Date;
        updatedAt: Date;
        VoitureModel?: unknown;
        Client?: unknown;
        Client_entreprise?: unknown;
        Conteneur?: unknown;
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
        conteneur: c.Conteneur,
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching commandes:", error);
    return { success: false, error: "Failed to fetch commandes" };
  }
}

export async function createMultipleCourriers(
  courriers: Array<{
    date_livraison: Date;
    reference: string;
    numero_conteneur: string;
    vin: string;
    moteur: string;
    conteneurId: string;
    commandeId?: string;
  }>,
) {
  try {
    const createdCourriers = await prisma.$transaction(
      courriers.map((data) =>
        prisma.courrieAvantage.create({
          data: {
            id: crypto.randomUUID(),
            date_livraison: data.date_livraison,
            reference: data.reference,
            numero_conteneur: data.numero_conteneur,
            vin: data.vin,
            moteur: data.moteur,
            conteneurId: data.conteneurId,
            commandeId: data.commandeId,
            updatedAt: new Date(),
          },
        }),
      ),
    );

    revalidatePath("/manager/listeConteneurs/courriers");
    return { success: true, data: createdCourriers };
  } catch (error) {
    console.error("Error creating multiple courriers:", error);
    return { success: false, error: "Failed to create courriers" };
  }
}

/**
 * Generate numero_courrier: 4 digits (sequential) + 2 last digits of year
 * Format: 000126 (for year 2026, sequence 0001)
 */
async function generateNumeroCourrier(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2); // Last 2 digits of year

  // Find the highest numero_courrier for this year
  const yearPrefix = currentYear.toString().slice(0, 2); // First 2 digits of year
  const allCourriers = await prisma.numeroCourrier.findMany({
    where: {
      numero_courrier: {
        endsWith: yearSuffix,
      },
    },
    orderBy: {
      numero_courrier: "desc",
    },
    take: 1,
  });

  let sequence = 1;
  if (allCourriers.length > 0) {
    const lastNumero = allCourriers[0].numero_courrier;
    const lastSequence = parseInt(lastNumero.slice(0, 4));
    sequence = lastSequence + 1;
  }

  // Format: 0001 + 26 = 000126
  const sequenceStr = sequence.toString().padStart(4, "0");
  return `${sequenceStr}${yearSuffix}`;
}

export async function createNumeroCourrier(data: {
  destinataire: string;
  objet: string;
  date: Date;
  username: string;
  userId: string;
}) {
  try {
    const numero_courrier = await generateNumeroCourrier();

    const courrier = await prisma.numeroCourrier.create({
      data: {
        id: crypto.randomUUID(),
        destinataire: data.destinataire,
        objet: data.objet,
        numero_courrier: numero_courrier,
        date: data.date,
        username: data.username,
        userId: data.userId,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    revalidatePath("/communication/numero-courrier");
    return { success: true, data: courrier };
  } catch (error) {
    console.error("Error creating numero courrier:", error);
    return { success: false, error: "Failed to create numero courrier" };
  }
}

export async function getNumeroCourrierById(id: string) {
  try {
    const courrier = await prisma.numeroCourrier.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!courrier) {
      return { success: false, error: "Courrier not found" };
    }

    return {
      success: true,
      data: {
        ...courrier,
        date: courrier.date.toISOString(),
        createdAt: courrier.createdAt.toISOString(),
        updatedAt: courrier.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching numero courrier:", error);
    return { success: false, error: "Failed to fetch numero courrier" };
  }
}

export async function getAllNumeroCourriers() {
  try {
    const courriers = await prisma.numeroCourrier.findMany({
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedCourriers = courriers.map((courrier) => ({
      ...courrier,
      date: courrier.date.toISOString(),
      createdAt: courrier.createdAt.toISOString(),
      updatedAt: courrier.updatedAt.toISOString(),
    }));

    return { success: true, data: serializedCourriers };
  } catch (error) {
    console.error("Error fetching numero courriers:", error);
    return { success: false, error: "Failed to fetch numero courriers" };
  }
}
