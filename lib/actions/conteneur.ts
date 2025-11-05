"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function createConteneur(data: {
  conteneurNumber: string;
  sealNumber: string;
  totalPackages?: string;
  grossWeight?: string;
  netWeight?: string;
  stuffingMap?: string;
  etapeConteneur?: "EN_ATTENTE" | "CHARGE" | "TRANSITE" | "RENSEIGNE" | "ARRIVE" | "DECHARGE" | "VERIFIE";
  dateEmbarquement?: Date;
  dateArriveProbable?: Date;
}) {
  try {
    const conteneur = await prisma.conteneur.create({
      data: {
        conteneurNumber: data.conteneurNumber,
        sealNumber: data.sealNumber,
        totalPackages: data.totalPackages,
        grossWeight: data.grossWeight,
        netWeight: data.netWeight,
        stuffingMap: data.stuffingMap,
        etapeConteneur: data.etapeConteneur || "EN_ATTENTE",
        dateEmbarquement: data.dateEmbarquement,
        dateArriveProbable: data.dateArriveProbable,
      },
    });
    
    revalidatePath("/manager/ajouter-conteneur");
    return { success: true, data: conteneur };
  } catch (error) {
    console.error("Error creating conteneur:", error);
    return { success: false, error: "Failed to create conteneur" };
  }
}

export async function getConteneur(id: string) {
  try {
    const conteneur = await prisma.conteneur.findUnique({
      where: { id },
      include: {
        commandes: true,
        subcases: true,
        verifications: true,
        voitures: true,
      }
    });
    
    if (!conteneur) {
      return { success: false, error: "Conteneur not found" };
    }
    
    return { success: true, data: conteneur };
  } catch (error) {
    console.error("Error fetching conteneur:", error);
    return { success: false, error: "Failed to fetch conteneur" };
  }
}

export async function getAllConteneurs() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      include: {
        commandes: true,
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs:", error);
    return { success: false, error: "Failed to fetch conteneurs" };
  }
}

export async function updateConteneur(id: string, data: {
  conteneurNumber?: string;
  sealNumber?: string;
  totalPackages?: string;
  grossWeight?: string;
  netWeight?: string;
  stuffingMap?: string;
  etapeConteneur?: "EN_ATTENTE" | "CHARGE" | "TRANSITE" | "RENSEIGNE" | "ARRIVE" | "DECHARGE" | "VERIFIE";
  dateEmbarquement?: Date;
  dateArriveProbable?: Date;
}) {
  try {
    const conteneur = await prisma.conteneur.update({
      where: { id },
      data,
    });
    
    revalidatePath("/manager/ajouter-conteneur");
    return { success: true, data: conteneur };
  } catch (error) {
    console.error("Error updating conteneur:", error);
    return { success: false, error: "Failed to update conteneur" };
  }
}

export async function deleteConteneur(id: string) {
  try {
    await prisma.conteneur.delete({
      where: { id }
    });
    
    revalidatePath("/manager/ajouter-conteneur");
    return { success: true };
  } catch (error) {
    console.error("Error deleting conteneur:", error);
    return { success: false, error: "Failed to delete conteneur" };
  }
}

export async function getConteneursRenseignes() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "RENSEIGNE"
      },
      include: {
        commandes: {
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs renseignes:", error);
    return { success: false, error: "Failed to fetch conteneurs renseignes" };
  }
}

export async function markConteneurAsArrive(conteneurId: string) {
  try {
    // Update all spare parts in subcases of this conteneur
    await prisma.sparePart.updateMany({
      where: {
        subcase: {
          conteneurId: conteneurId
        }
      },
      data: {
        etapeSparePart: 'RENSEIGNE'
      }
    });

    // Update conteneur status to ARRIVE
    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: {
        etapeConteneur: 'ARRIVE'
      }
    });

    // Update all commandes in this conteneur to ARRIVE
    await prisma.commande.updateMany({
      where: {
        conteneurId: conteneurId
      },
      data: {
        etapeCommande: 'ARRIVE'
      }
    });
    
    revalidatePath("/manager/commandes-transites-renseignees");
    return { success: true };
  } catch (error) {
    console.error("Error marking conteneur as arrive:", error);
    return { success: false, error: "Failed to mark conteneur as arrive" };
  }
}

export async function getConteneursArrives() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "ARRIVE"
      },
      include: {
        commandes: {
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs arrives:", error);
    return { success: false, error: "Failed to fetch conteneurs arrives" };
  }
}

export async function markConteneurAsDecharge(conteneurId: string) {
  try {
    await prisma.sparePart.updateMany({
      where: { subcase: { conteneurId } },
      data: { etapeSparePart: 'DECHARGE' }
    });

    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: { etapeConteneur: 'DECHARGE' }
    });

    await prisma.commande.updateMany({
      where: { conteneurId },
      data: { etapeCommande: 'DECHARGE' }
    });
    
    revalidatePath("/manager/commandes-arrivees");
    return { success: true };
  } catch (error) {
    console.error("Error marking conteneur as decharge:", error);
    return { success: false, error: "Failed to mark conteneur as decharge" };
  }
}

export async function getConteneursDecharge() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "DECHARGE"
      },
      include: {
        commandes: {
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: {
          include: {
            spareParts: true,
            tools: true
          }
        },
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs decharge:", error);
    return { success: false, error: "Failed to fetch conteneurs decharge" };
  }
}

export async function markConteneurAsVerifie(conteneurId: string) {
  try {
    await prisma.sparePart.updateMany({
      where: { subcase: { conteneurId } },
      data: { etapeSparePart: 'VERIFIE' }
    });

    await prisma.conteneur.update({
      where: { id: conteneurId },
      data: { etapeConteneur: 'VERIFIE' }
    });

    await prisma.commande.updateMany({
      where: { conteneurId },
      data: { etapeCommande: 'VERIFIER' }
    });
    
    revalidatePath("/magasinier/verification");
    return { success: true };
  } catch (error) {
    console.error("Error marking conteneur as verifie:", error);
    return { success: false, error: "Failed to mark conteneur as verifie" };
  }
}

export async function getConteneursVerifies() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        etapeConteneur: "VERIFIE"
      },
      include: {
        commandes: {
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: {
          include: {
            spareParts: true,
            tools: true
          }
        },
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs verifies:", error);
    return { success: false, error: "Failed to fetch conteneurs verifies" };
  }
}

export async function getSparePartsRanges() {
  try {
    const spareParts = await prisma.sparePart.findMany({
      where: {
        etapeSparePart: "RANGE"
      },
      include: {
        commande: {
          include: {
            voitureModel: true,
            client: true
          }
        },
        voiture: {
          include: {
            voitureModel: true,
            commande: {
              include: {
                client: true
              }
            }
          }
        },
        Storage: true,
        subcase: {
          include: {
            conteneur: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return { success: true, data: spareParts };
  } catch (error) {
    console.error("Error fetching spare parts ranges:", error);
    return { success: false, error: "Failed to fetch spare parts ranges" };
  }
}

export async function getConteneursValides() {
  try {
    const conteneurs = await prisma.conteneur.findMany({
      where: {
        commandes: {
          some: {
            etapeCommande: "VALIDE"
          }
        }
      },
      include: {
        commandes: {
          where: {
            etapeCommande: "VALIDE"
          },
          include: {
            client: true,
            voitureModel: true,
            fournisseurs: true
          }
        },
        subcases: true,
        verifications: true,
        voitures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: conteneurs };
  } catch (error) {
    console.error("Error fetching conteneurs with VALIDE commandes:", error);
    return { success: false, error: "Failed to fetch conteneurs with VALIDE commandes" };
  }
}
