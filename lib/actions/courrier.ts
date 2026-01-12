"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "../generated/prisma";

export async function getAllCourriers() {
  try {
    const courriers = await prisma.courrieAvantage.findMany({
      include: {
        conteneur: {
          select: {
            id: true,
            conteneurNumber: true,
            sealNumber: true,
          }
        },
        commande: {
          include: {
            voitureModel: {
              select: {
                model: true,
              }
            },
            client: {
              select: {
                nom: true,
              }
            },
            clientEntreprise: {
              select: {
                nom_entreprise: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Serialize Date objects and Decimal values
    const serializedCourriers = courriers.map((courrier) => ({
      id: courrier.id,
      date_livraison: courrier.date_livraison.toISOString(),
      reference: courrier.reference,
      numero_conteneur: courrier.numero_conteneur,
      vin: courrier.vin,
      moteur: courrier.moteur,
      createdAt: courrier.createdAt.toISOString(),
      updatedAt: courrier.updatedAt.toISOString(),
      conteneurId: courrier.conteneurId,
      commandeId: courrier.commandeId,
      conteneur: courrier.conteneur,
      commande: courrier.commande ? {
        id: courrier.commande.id,
        etapeCommande: courrier.commande.etapeCommande,
        date_livraison: courrier.commande.date_livraison.toISOString(),
        createdAt: courrier.commande.createdAt.toISOString(),
        updatedAt: courrier.commande.updatedAt.toISOString(),
        clientId: courrier.commande.clientId,
        conteneurId: courrier.commande.conteneurId,
        commandeLocalId: courrier.commande.commandeLocalId,
        couleur: courrier.commande.couleur,
        montageId: courrier.commande.montageId,
        motorisation: courrier.commande.motorisation,
        nbr_portes: courrier.commande.nbr_portes,
        transmission: courrier.commande.transmission,
        voitureModelId: courrier.commande.voitureModelId,
        clientEntrepriseId: courrier.commande.clientEntrepriseId,
        factureId: courrier.commande.factureId,
        prix_unitaire: courrier.commande.prix_unitaire ? Number(courrier.commande.prix_unitaire) : null,
        numChassis: courrier.commande.numChassis,
        commandeFlag: courrier.commande.commandeFlag,
        commandeGroupeeId: courrier.commande.commandeGroupeeId,
        voitureModel: courrier.commande.voitureModel,
        client: courrier.commande.client,
        clientEntreprise: courrier.commande.clientEntreprise,
      } : null,
    }));
    
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
        date_livraison: data.date_livraison,
        reference: data.reference,
        numero_conteneur: data.numero_conteneur,
        vin: data.vin,
        moteur: data.moteur,
        conteneurId: data.conteneurId,
        commandeId: data.commandeId,
      },
      include: {
        conteneur: {
          select: {
            id: true,
            conteneurNumber: true,
            sealNumber: true,
          }
        },
        commande: {
          include: {
            voitureModel: {
              select: {
                model: true,
              }
            },
            client: {
              select: {
                nom: true,
              }
            },
            clientEntreprise: {
              select: {
                nom_entreprise: true,
              }
            }
          }
        }
      }
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
      orderBy: { createdAt: 'desc' },
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
        voitureModel: {
          select: {
            model: true,
          }
        },
        client: {
          select: {
            nom: true,
          }
        },
        clientEntreprise: {
          select: {
            nom_entreprise: true,
          }
        },
        conteneur: {
          select: {
            id: true,
            conteneurNumber: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const serializedCommandes = commandes.map((cmd) => ({
      ...cmd,
      prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
      date_livraison: cmd.date_livraison.toISOString(),
      createdAt: cmd.createdAt.toISOString(),
      updatedAt: cmd.updatedAt.toISOString(),
    }));
    
    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching commandes:", error);
    return { success: false, error: "Failed to fetch commandes" };
  }
}

export async function createMultipleCourriers(courriers: Array<{
  date_livraison: Date;
  reference: string;
  numero_conteneur: string;
  vin: string;
  moteur: string;
  conteneurId: string;
  commandeId?: string;
}>) {
  try {
    const createdCourriers = await prisma.$transaction(
      courriers.map((data) =>
        prisma.courrieAvantage.create({
          data: {
            date_livraison: data.date_livraison,
            reference: data.reference,
            numero_conteneur: data.numero_conteneur,
            vin: data.vin,
            moteur: data.moteur,
            conteneurId: data.conteneurId,
            commandeId: data.commandeId,
          },
        })
      )
    );
    
    revalidatePath("/manager/listeConteneurs/courriers");
    return { success: true, data: createdCourriers };
  } catch (error) {
    console.error("Error creating multiple courriers:", error);
    return { success: false, error: "Failed to create courriers" };
  }
}

