"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function createCommande(data: {
  nbr_portes: string;
  transmission: "AUTOMATIQUE" | "MANUEL";
  etapeCommande: "PROPOSITION" | "VALIDE" | "TRANSITE" | "RENSEIGNEE" | "ARRIVE" | "VERIFIER" | "MONTAGE" | "TESTE" | "PARKING" | "CORRECTION" | "VENTE" | "DECHARGE";
  motorisation: "ELECTRIQUE" | "ESSENCE" | "DIESEL" | "HYBRIDE";
  couleur: string;
  date_livraison: Date;
  clientId?: string;
  clientEntrepriseId?: string;
  voitureModelId?: string;
  fournisseurIds?: string[];
  factureId?: string;
  prix_unitaire?: number;
  accessoireIds?: string[];
}) {
  try {
    // Validation
    if (!data.couleur || !data.couleur.trim()) {
      return { success: false, error: "La couleur est requise" };
    }

    if (!data.date_livraison) {
      return { success: false, error: "La date de livraison est requise" };
    }

    if (!data.clientId && !data.clientEntrepriseId) {
      return { success: false, error: "Un client ou une entreprise cliente est requis" };
    }

    const commande = await prisma.commande.create({
      data: {
        nbr_portes: data.nbr_portes,
        transmission: data.transmission,
        etapeCommande: data.etapeCommande,
        motorisation: data.motorisation,
        couleur: data.couleur.trim(),
        date_livraison: data.date_livraison,
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.clientEntrepriseId && { clientEntrepriseId: data.clientEntrepriseId }),
        ...(data.voitureModelId && { voitureModelId: data.voitureModelId }),
        ...(data.factureId && { factureId: data.factureId }),
        ...(data.prix_unitaire && { prix_unitaire: data.prix_unitaire }),
        ...(data.fournisseurIds && data.fournisseurIds.length > 0 && {
          fournisseurs: {
            connect: data.fournisseurIds.map(id => ({ id }))
          }
        }),
      },
    });

    // Link accessories after commande is created (if accessoires exist in schema)
    if (data.accessoireIds && data.accessoireIds.length > 0) {
      try {
        await prisma.commande.update({
          where: { id: commande.id },
          data: {
            accessoires: {
              connect: data.accessoireIds.map(id => ({ id }))
            }
          }
        });
      } catch (accessoireError) {
        console.log("Accessoires not yet available in schema, skipping:", accessoireError);
      }
    }

    revalidatePath("/manager");
    revalidatePath("/comptable");
    revalidatePath("/comptable/facture");
    revalidatePath("/comptable/commandes");
    
    // Convert Decimal to number for serialization
    const serializedCommande = {
      ...commande,
      prix_unitaire: commande.prix_unitaire ? Number(commande.prix_unitaire) : null,
    };
    
    return { success: true, data: serializedCommande };
  } catch (error: any) {
    console.error("Error creating commande:", error);
    const errorMessage = error?.message || "Erreur lors de la création de la commande";
    return { success: false, error: errorMessage };
  }
}

export async function getAllCommandes() {
  try {
    const commandes = await prisma.commande.findMany({
      include: {
        client: true,
        voitureModel: true,
        fournisseurs: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, data: commandes };
  } catch (error) {
    console.error("Error fetching commandes:", error);
    return { success: false, error: "Failed to fetch commandes" };
  }
}

export async function getCommandesProposees() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "PROPOSITION"
      },
      include: {
        client: true,
        clientEntreprise: true,
        voitureModel: true,
        fournisseurs: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Try to fetch accessories for each commande (will work once Prisma client is regenerated)
    const commandesWithAccessoires = await Promise.all(
      commandes.map(async (cmd) => {
        try {
          const accessoires = await prisma.accessoire.findMany({
            where: { commandeId: cmd.id }
          });
          return {
            ...cmd,
            accessoires,
            prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
          };
        } catch {
          return {
            ...cmd,
            accessoires: [],
            prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
          };
        }
      })
    );
    
    return { success: true, data: commandesWithAccessoires };
  } catch (error) {
    console.error("Error fetching commandes proposees:", error);
    return { success: false, error: "Failed to fetch commandes proposees" };
  }
}

export async function updateCommandeStatus(commandeId: string, fournisseurIds: string[]) {
  try {
    const commande = await prisma.commande.update({
      where: { id: commandeId },
      data: {
        etapeCommande: "VALIDE",
        fournisseurs: {
          set: fournisseurIds.map(id => ({ id }))
        }
      },
      include: {
        client: true,
        voitureModel: true,
        fournisseurs: true,
      }
    });

    revalidatePath("/manager/commandes-proposees");
    return { success: true, data: commande };
  } catch (error) {
    console.error("Error updating commande status:", error);
    return { success: false, error: "Failed to update commande status" };
  }
}

// ... existing code ...

export async function getCommandesValides() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "VALIDE"
      },
      include: {
        client: true,
        voitureModel: true,
        fournisseurs: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, data: commandes };
  } catch (error) {
    console.error("Error fetching commandes valides:", error);
    return { success: false, error: "Failed to fetch commandes valides" };
  }
}

export async function getCommandesTransites() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "TRANSITE"
      },
      include: {
        client: true,
        voitureModel: true,
        fournisseurs: true,
        conteneur: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, data: commandes };
  } catch (error) {
    console.error("Error fetching commandes transites:", error);
    return { success: false, error: "Failed to fetch commandes transites" };
  }
}

export async function updateCommandeToTransite(commandeId: string, conteneurId: string) {
  try {
    const commande = await prisma.commande.update({
      where: { id: commandeId },
      data: {
        etapeCommande: "TRANSITE",
        conteneurId: conteneurId
      },
      include: {
        client: true,
        voitureModel: true,
        fournisseurs: true,
        conteneur: true,
      }
    });

    revalidatePath("/manager/commandes-transites");
    return { success: true, data: commande };
  } catch (error) {
    console.error("Error updating commande to transite:", error);
    return { success: false, error: "Failed to update commande to transite" };
  }
}

export async function getCommande(id: string) {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id },
      include: {
        client: true,
        voitureModel: true,
        fournisseurs: true,
        conteneur: true,
      }
    });
    
    if (!commande) {
      return { success: false, error: "Commande not found" };
    }
    
    return { success: true, data: commande };
  } catch (error) {
    console.error("Error fetching commande:", error);
    return { success: false, error: "Failed to fetch commande" };
  }
}

export async function updateCommande(id: string, data: {
  nbr_portes?: string;
  transmission?: "AUTOMATIQUE" | "MANUEL";
  etapeCommande?: "PROPOSITION" | "VALIDE" | "TRANSITE" | "RENSEIGNEE" | "ARRIVE" | "VERIFIER" | "MONTAGE" | "TESTE" | "PARKING" | "CORRECTION" | "VENTE";
  motorisation?: "ELECTRIQUE" | "ESSENCE" | "DIESEL" | "HYBRIDE";
  couleur?: string;
  date_livraison?: Date;
  clientId?: string;
  voitureModelId?: string;
  fournisseurIds?: string[];
}) {
  try {
    const updateData = {
      ...(data.nbr_portes && { nbr_portes: data.nbr_portes }),
      ...(data.transmission && { transmission: data.transmission }),
      ...(data.etapeCommande && { etapeCommande: data.etapeCommande }),
      ...(data.motorisation && { motorisation: data.motorisation }),
      ...(data.couleur && { couleur: data.couleur }),
      ...(data.date_livraison && { date_livraison: data.date_livraison }),
      ...(data.clientId && { clientId: data.clientId }),
      ...(data.voitureModelId && { voitureModelId: data.voitureModelId }),
    };

    const commande = await prisma.commande.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        voitureModel: true,
        fournisseurs: true,
        conteneur: true,
      }
    });

    // Update fournisseurs if provided
    if (data.fournisseurIds) {
      await prisma.commande.update({
        where: { id },
        data: {
          fournisseurs: {
            set: data.fournisseurIds.map(id => ({ id }))
          }
        }
      });
    }

    revalidatePath("/manager");
    return { success: true, data: commande };
  } catch (error) {
    console.error("Error updating commande:", error);
    return { success: false, error: "Failed to update commande" };
  }
}

export async function deleteCommande(id: string) {
  try {
    await prisma.commande.delete({
      where: { id }
    });
    
    revalidatePath("/manager");
    return { success: true };
  } catch (error) {
    console.error("Error deleting commande:", error);
    return { success: false, error: "Failed to delete commande" };
  }
}

export async function getCommandesByUserId(userId: string) {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        client: {
          userId: userId
        }
      },
      include: {
        client: true,
        voitureModel: true,
        fournisseurs: true,
        conteneur: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, data: commandes };
  } catch (error) {
    console.error("Error fetching user commandes:", error);
    return { success: false, error: "Failed to fetch user commandes" };
  }
}

export async function getAllCommandesGrouped() {
  try {
    const commandes = await prisma.commande.findMany({
      include: {
        client: true,
        clientEntreprise: true,
        voitureModel: true,
        fournisseurs: true,
        conteneur: true,
      },
      orderBy: { date_livraison: 'asc' }
    });

    // Convert Decimal to number and serialize all data
    const serializedCommandes = commandes.map(cmd => {
      // Create a plain object with all Decimal fields converted
      const serialized: any = {
        id: cmd.id,
        etapeCommande: cmd.etapeCommande,
        date_livraison: cmd.date_livraison,
        createdAt: cmd.createdAt,
        updatedAt: cmd.updatedAt,
        clientId: cmd.clientId,
        conteneurId: cmd.conteneurId,
        commandeLocalId: cmd.commandeLocalId,
        couleur: cmd.couleur,
        montageId: cmd.montageId,
        motorisation: cmd.motorisation,
        nbr_portes: cmd.nbr_portes,
        transmission: cmd.transmission,
        voitureModelId: cmd.voitureModelId,
        clientEntrepriseId: cmd.clientEntrepriseId,
        factureId: cmd.factureId,
        prix_unitaire: cmd.prix_unitaire ? Number(cmd.prix_unitaire) : null,
        client: cmd.client,
        clientEntreprise: cmd.clientEntreprise,
        voitureModel: cmd.voitureModel,
        conteneur: cmd.conteneur,
        fournisseurs: cmd.fournisseurs,
      };
      return serialized;
    });

    // Group by etapeCommande
    const grouped = serializedCommandes.reduce((acc, cmd) => {
      const etape = cmd.etapeCommande;
      if (!acc[etape]) {
        acc[etape] = [];
      }
      acc[etape].push(cmd);
      return acc;
    }, {} as Record<string, any[]>);

    return { success: true, data: grouped };
  } catch (error) {
    console.error("Error fetching grouped commandes:", error);
    return { success: false, error: "Failed to fetch grouped commandes" };
  }
}