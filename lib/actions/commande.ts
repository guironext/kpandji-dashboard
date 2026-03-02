"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function createCommande(data: {
  nbr_portes: string;
  transmission: "AUTOMATIQUE" | "MANUEL";
  etapeCommande:
    | "PROPOSITION"
    | "VALIDE"
    | "TRANSITE"
    | "RENSEIGNEE"
    | "ARRIVE"
    | "VERIFIER"
    | "MONTAGE"
    | "TESTE"
    | "PARKING"
    | "CORRECTION"
    | "VENTE"
    | "DECHARGE";
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
      return {
        success: false,
        error: "Un client ou une entreprise cliente est requis",
      };
    }

    
    const commande = await prisma.commande.create({
      data: {
        id: crypto.randomUUID(),
        nbr_portes: data.nbr_portes,
        transmission: data.transmission,
        etapeCommande: data.etapeCommande,
        motorisation: data.motorisation,
        couleur: data.couleur.trim(),
        date_livraison: data.date_livraison,
        updatedAt: new Date(),
        ...(data.clientId && { clientId: data.clientId }),
        ...(data.clientEntrepriseId && {
          clientEntrepriseId: data.clientEntrepriseId,
        }),
        ...(data.voitureModelId && { voitureModelId: data.voitureModelId }),
        ...(data.factureId && { factureId: data.factureId }),
        ...(data.prix_unitaire && { prix_unitaire: data.prix_unitaire }),
        ...(data.fournisseurIds &&
          data.fournisseurIds.length > 0 && {
            Fournisseur: {
              connect: data.fournisseurIds.map((id) => ({ id })),
            },
          }),
      },
    });

    // Link accessories after commande is created (if accessoires exist in schema)
    if (data.accessoireIds && data.accessoireIds.length > 0) {
      try {
        
        await prisma.commande.update({
          where: { id: commande.id },
          data: {
            Accessoire: {
              connect: data.accessoireIds.map((id) => ({ id })),
            },
            updatedAt: new Date(),
          },
        });
      } catch (accessoireError) {
        console.log(
          "Accessoires not yet available in schema, skipping:",
          accessoireError,
        );
      }
    }

    revalidatePath("/manager");
    revalidatePath("/comptable");
    revalidatePath("/comptable/facture");
    revalidatePath("/comptable/commandes");

    // Convert Decimal to number for serialization
    const serializedCommande = {
      ...commande,
      prix_unitaire: commande.prix_unitaire
        ? Number(commande.prix_unitaire)
        : null,
    };

    return { success: true, data: serializedCommande };
  } catch (error: unknown) {
    console.error("Error creating commande:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erreur lors de la création de la commande";
    return { success: false, error: errorMessage };
  }
}

export async function getAllCommandes() {
  try {
    const commandes = await prisma.commande.findMany({
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        prix_unitaire?: unknown;
        Client?: { createdAt: Date; updatedAt: Date } & Record<string, unknown>;
        Client_entreprise?: { createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >;
        VoitureModel?: { createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >;
        Fournisseur?: Array<{ createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >>;
      };
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        client: item.Client
          ? {
              ...item.Client,
              createdAt: item.Client.createdAt.toISOString(),
              updatedAt: item.Client.updatedAt.toISOString(),
            }
          : null,
        clientEntreprise: item.Client_entreprise
          ? {
              ...item.Client_entreprise,
              createdAt: item.Client_entreprise.createdAt.toISOString(),
              updatedAt: item.Client_entreprise.updatedAt.toISOString(),
            }
          : null,
        voitureModel: item.VoitureModel
          ? {
              ...item.VoitureModel,
              createdAt: item.VoitureModel.createdAt.toISOString(),
              updatedAt: item.VoitureModel.updatedAt.toISOString(),
            }
          : null,
        fournisseurs: item.Fournisseur
          ? item.Fournisseur.map((f) => ({
              ...f,
              createdAt: f.createdAt.toISOString(),
              updatedAt: f.updatedAt.toISOString(),
            }))
          : [],
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching commandes:", error);
    return { success: false, error: "Failed to fetch commandes" };
  }
}

export async function getCommandesProposees() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "PROPOSITION",
        commandeFlag: "DISPONIBLE",
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Try to fetch accessories for each commande (will work once Prisma client is regenerated)
    const commandesWithAccessoires = await Promise.all(
      (commandes as unknown[]).map(async (cmd: unknown) => {
        const item = cmd as Record<string, unknown> & {
          id: string;
          prix_unitaire?: unknown;
          Client?: { createdAt: Date; updatedAt: Date } & Record<string, unknown>;
          Client_entreprise?: { createdAt: Date; updatedAt: Date } & Record<
            string,
            unknown
          >;
          VoitureModel?: { createdAt: Date; updatedAt: Date } & Record<
            string,
            unknown
          >;
          Fournisseur?: Array<{ createdAt: Date; updatedAt: Date } & Record<
            string,
            unknown
          >>;
        };
        try {
          const accessoires = await prisma.accessoire.findMany({
            where: { commandeId: item.id },
          });
          return {
            ...item,
            accessoires,
            prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
            client: item.Client
              ? {
                  ...item.Client,
                  createdAt: item.Client.createdAt.toISOString(),
                  updatedAt: item.Client.updatedAt.toISOString(),
                }
              : null,
            clientEntreprise: item.Client_entreprise
              ? {
                  ...item.Client_entreprise,
                  createdAt: item.Client_entreprise.createdAt.toISOString(),
                  updatedAt: item.Client_entreprise.updatedAt.toISOString(),
                }
              : null,
            voitureModel: item.VoitureModel
              ? {
                  ...item.VoitureModel,
                  createdAt: item.VoitureModel.createdAt.toISOString(),
                  updatedAt: item.VoitureModel.updatedAt.toISOString(),
                }
              : null,
            fournisseurs: item.Fournisseur
              ? item.Fournisseur.map((f) => ({
                  ...f,
                  createdAt: f.createdAt.toISOString(),
                  updatedAt: f.updatedAt.toISOString(),
                }))
              : [],
          };
        } catch {
          return {
            ...item,
            accessoires: [],
            prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
            client: item.Client
              ? {
                  ...item.Client,
                  createdAt: item.Client.createdAt.toISOString(),
                  updatedAt: item.Client.updatedAt.toISOString(),
                }
              : null,
            clientEntreprise: item.Client_entreprise
              ? {
                  ...item.Client_entreprise,
                  createdAt: item.Client_entreprise.createdAt.toISOString(),
                  updatedAt: item.Client_entreprise.updatedAt.toISOString(),
                }
              : null,
            voitureModel: item.VoitureModel
              ? {
                  ...item.VoitureModel,
                  createdAt: item.VoitureModel.createdAt.toISOString(),
                  updatedAt: item.VoitureModel.updatedAt.toISOString(),
                }
              : null,
            fournisseurs: item.Fournisseur
              ? item.Fournisseur.map((f) => ({
                  ...f,
                  createdAt: f.createdAt.toISOString(),
                  updatedAt: f.updatedAt.toISOString(),
                }))
              : [],
          };
        }
      }),
    );

    return { success: true, data: commandesWithAccessoires };
  } catch (error) {
    console.error("Error fetching commandes proposees:", error);
    return { success: false, error: "Failed to fetch commandes proposees" };
  }
}

export async function updateCommandeStatus(
  commandeId: string,
  fournisseurIds: string[],
) {
  try {
    
    const commande = await prisma.commande.update({
      where: { id: commandeId },
      data: {
        etapeCommande: "VALIDE",
        updatedAt: new Date(),
        Fournisseur: {
          set: fournisseurIds.map((id) => ({ id })),
        },
      },
      include: {
        Client: true,
        VoitureModel: true,
        Fournisseur: true,
      },
    });

    // Serialize Decimal fields
    const serializedCommande = {
      ...commande,
      prix_unitaire: commande.prix_unitaire
        ? Number(commande.prix_unitaire)
        : null,
      client: (commande as Record<string, unknown>).Client,
      voitureModel: (commande as Record<string, unknown>).VoitureModel,
      fournisseurs:
        (
          commande as Record<string, unknown> & {
            Fournisseur?: unknown[];
          }
        ).Fournisseur || [],
    };

    revalidatePath("/manager/commandes-proposees");
    return { success: true, data: serializedCommande };
  } catch (error) {
    console.error("Error updating commande status:", error);
    return { success: false, error: "Failed to update commande status" };
  }
}

// ... existing code ...

export async function getCommandesValides() {
  try {
    // Ensure connection is active
    await prisma.$connect().catch(() => {
      // Connection might already be established
    });

    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "VALIDE",
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        prix_unitaire?: unknown;
        Client?: { createdAt: Date; updatedAt: Date } & Record<string, unknown>;
        Client_entreprise?: { createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >;
        VoitureModel?: { createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >;
        Fournisseur?: Array<{ createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >>;
      };
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        date_livraison: (item.date_livraison as Date).toISOString(),
        createdAt: (item.createdAt as Date).toISOString(),
        updatedAt: (item.updatedAt as Date).toISOString(),
        client: item.Client
          ? {
              ...item.Client,
              createdAt: item.Client.createdAt.toISOString(),
              updatedAt: item.Client.updatedAt.toISOString(),
            }
          : null,
        clientEntreprise: item.Client_entreprise
          ? {
              ...item.Client_entreprise,
              createdAt: item.Client_entreprise.createdAt.toISOString(),
              updatedAt: item.Client_entreprise.updatedAt.toISOString(),
            }
          : null,
        voitureModel: item.VoitureModel
          ? {
              ...item.VoitureModel,
              createdAt: item.VoitureModel.createdAt.toISOString(),
              updatedAt: item.VoitureModel.updatedAt.toISOString(),
            }
          : null,
        fournisseurs: item.Fournisseur
          ? item.Fournisseur.map((f) => ({
              ...f,
              createdAt: f.createdAt.toISOString(),
              updatedAt: f.updatedAt.toISOString(),
            }))
          : [],
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error: unknown) {
    console.error("Error fetching commandes valides:", error);

    // Check if it's a connection error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;
    const errorString = String(error).toLowerCase();

    // Check for various connection error patterns
    const isConnectionError =
      errorCode === "P1001" ||
      errorMessage.includes("connection") ||
      errorMessage.includes("connexion") ||
      errorMessage.includes("Closed") ||
      errorMessage.includes("closed") ||
      errorMessage.includes("reset") ||
      errorMessage.includes("Reset") ||
      errorString.includes("kind: closed") ||
      errorString.includes("kind: connectionreset") ||
      errorString.includes("connectionreset") ||
      errorString.includes("connection closed");

    if (isConnectionError) {
      // Try to reconnect
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        console.log("Database reconnected, retrying query...");
        // Retry the query once
        const commandes = await prisma.commande.findMany({
          where: {
            etapeCommande: "VALIDE",
          },
          include: {
            Client: true,
            Client_entreprise: true,
            VoitureModel: true,
            Fournisseur: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
          const item = cmd as Record<string, unknown> & {
            prix_unitaire?: unknown;
            Client?: { createdAt: Date; updatedAt: Date } & Record<string, unknown>;
            Client_entreprise?: { createdAt: Date; updatedAt: Date } & Record<
              string,
              unknown
            >;
            VoitureModel?: { createdAt: Date; updatedAt: Date } & Record<
              string,
              unknown
            >;
            Fournisseur?: Array<{ createdAt: Date; updatedAt: Date } & Record<
              string,
              unknown
            >>;
          };
          return {
            ...item,
            prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
            date_livraison: (item.date_livraison as Date).toISOString(),
            createdAt: (item.createdAt as Date).toISOString(),
            updatedAt: (item.updatedAt as Date).toISOString(),
            client: item.Client
              ? {
                  ...item.Client,
                  createdAt: item.Client.createdAt.toISOString(),
                  updatedAt: item.Client.updatedAt.toISOString(),
                }
              : null,
            clientEntreprise: item.Client_entreprise
              ? {
                  ...item.Client_entreprise,
                  createdAt: item.Client_entreprise.createdAt.toISOString(),
                  updatedAt: item.Client_entreprise.updatedAt.toISOString(),
                }
              : null,
            voitureModel: item.VoitureModel
              ? {
                  ...item.VoitureModel,
                  createdAt: item.VoitureModel.createdAt.toISOString(),
                  updatedAt: item.VoitureModel.updatedAt.toISOString(),
                }
              : null,
            fournisseurs: item.Fournisseur
              ? item.Fournisseur.map((f) => ({
                  ...f,
                  createdAt: f.createdAt.toISOString(),
                  updatedAt: f.updatedAt.toISOString(),
                }))
              : [],
          };
        });

        return { success: true, data: serializedCommandes };
      } catch (retryError) {
        console.error("Retry failed:", retryError);
        const retryErrorString = String(retryError).toLowerCase();

        // Provide more specific error message
        if (
          retryErrorString.includes("kind: closed") ||
          retryErrorString.includes("connection closed")
        ) {
          return {
            success: false,
            error:
              "La connexion à la base de données a été fermée. Veuillez vérifier que le serveur de base de données est en cours d'exécution.",
          };
        }

        return {
          success: false,
          error:
            "Échec de la connexion à la base de données. Veuillez vérifier votre serveur de base de données et réessayer.",
        };
      }
    }

    // Provide more specific error message for non-connection errors
    // Reuse errorString already defined above
    if (
      errorString.includes("kind: closed") ||
      errorString.includes("connection closed")
    ) {
      return {
        success: false,
        error:
          "La connexion à la base de données a été fermée. Veuillez réessayer.",
      };
    }

    return {
      success: false,
      error: "Échec du chargement des commandes validées. Veuillez réessayer.",
    };
  }
}

export async function getCommandesTransites() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "TRANSITE",
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
        Conteneur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        prix_unitaire?: unknown;
        Client?: unknown;
        Client_entreprise?: unknown;
        VoitureModel?: unknown;
        Fournisseur?: unknown[];
        Conteneur?: unknown;
      };
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        client: item.Client,
        clientEntreprise: item.Client_entreprise,
        voitureModel: item.VoitureModel,
        fournisseurs:
          item.Fournisseur || [],
        conteneur: item.Conteneur,
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching commandes transites:", error);
    return { success: false, error: "Failed to fetch commandes transites" };
  }
}

export async function updateCommandeToTransite(
  commandeId: string,
  conteneurId: string,
) {
  try {
    
    const commande = await prisma.commande.update({
      where: { id: commandeId },
      data: {
        etapeCommande: "TRANSITE",
        conteneurId: conteneurId,
        updatedAt: new Date(),
      },
      include: {
        Client: true,
        VoitureModel: true,
        Fournisseur: true,
        Conteneur: true,
      },
    });

    // Serialize Decimal fields
    const serializedCommande = {
      ...commande,
      prix_unitaire: commande.prix_unitaire
        ? Number(commande.prix_unitaire)
        : null,
    };

    revalidatePath("/manager/commandes-transites");
    return { success: true, data: serializedCommande };
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
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
        Conteneur: true,
      },
    });

    if (!commande) {
      return { success: false, error: "Commande not found" };
    }

    // Serialize Decimal fields
    const item = commande as Record<string, unknown> & {
      prix_unitaire?: unknown;
      Client?: unknown;
      Client_entreprise?: unknown;
      VoitureModel?: unknown;
      Fournisseur?: unknown[];
      Conteneur?: unknown;
    };
    const serializedCommande = {
      ...item,
      prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
      client: item.Client,
      clientEntreprise: item.Client_entreprise,
      voitureModel: item.VoitureModel,
      fournisseurs:
        item.Fournisseur || [],
      conteneur: item.Conteneur,
    };

    return { success: true, data: serializedCommande };
  } catch (error) {
    console.error("Error fetching commande:", error);
    return { success: false, error: "Failed to fetch commande" };
  }
}

export async function updateCommande(
  id: string,
  data: {
    nbr_portes?: string;
    transmission?: "AUTOMATIQUE" | "MANUEL";
    etapeCommande?:
      | "PROPOSITION"
      | "VALIDE"
      | "TRANSITE"
      | "RENSEIGNEE"
      | "ARRIVE"
      | "VERIFIER"
      | "MONTAGE"
      | "TESTE"
      | "PARKING"
      | "CORRECTION"
      | "VENTE";
    motorisation?: "ELECTRIQUE" | "ESSENCE" | "DIESEL" | "HYBRIDE";
    couleur?: string;
    date_livraison?: Date;
    clientId?: string;
    voitureModelId?: string;
    fournisseurIds?: string[];
  },
) {
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
      updatedAt: new Date(),
    };

    
    const commande = await prisma.commande.update({
      where: { id },
      data: updateData,
      include: {
        Client: true,
        VoitureModel: true,
        Fournisseur: true,
        Conteneur: true,
      },
    });

    // Update fournisseurs if provided
    if (data.fournisseurIds) {
      
      await prisma.commande.update({
        where: { id },
        data: {
          Fournisseur: {
            set: data.fournisseurIds.map((id) => ({ id })),
          },
        },
      });
    }

    // Serialize Decimal fields
    const updateItem = commande as Record<string, unknown> & {
      prix_unitaire?: unknown;
      Client?: unknown;
      VoitureModel?: unknown;
      Fournisseur?: unknown[];
      Conteneur?: unknown;
    };
    const serializedCommande = {
      ...updateItem,
      prix_unitaire: updateItem.prix_unitaire
        ? Number(updateItem.prix_unitaire)
        : null,
      client: updateItem.Client,
      voitureModel: updateItem.VoitureModel,
      fournisseurs:
        updateItem.Fournisseur || [],
      conteneur: updateItem.Conteneur,
    };

    revalidatePath("/manager");
    return { success: true, data: serializedCommande };
  } catch (error) {
    console.error("Error updating commande:", error);
    return { success: false, error: "Failed to update commande" };
  }
}

export async function deleteCommande(id: string) {
  try {
    await prisma.commande.delete({
      where: { id },
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
        Client: {
          userId: userId,
        },
      },
      include: {
        Client: true,
        VoitureModel: true,
        Fournisseur: true,
        Conteneur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        prix_unitaire?: unknown;
        Client?: unknown;
        VoitureModel?: unknown;
        Fournisseur?: unknown[];
        Conteneur?: unknown;
      };
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        client: item.Client,
        voitureModel: item.VoitureModel,
        fournisseurs:
          item.Fournisseur || [],
        conteneur: item.Conteneur,
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching user commandes:", error);
    return { success: false, error: "Failed to fetch user commandes" };
  }
}

export async function getAllCommandesGrouped() {
  try {
    const commandes = await prisma.commande.findMany({
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
        Conteneur: true,
      },
      orderBy: { date_livraison: "asc" },
    });

    // Convert Decimal to number and serialize all data
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        etapeCommande: string;
        prix_unitaire?: unknown;
        Client?: unknown;
        Client_entreprise?: unknown;
        VoitureModel?: unknown;
        Fournisseur?: unknown[];
        Conteneur?: unknown;
      };
      // Create a plain object with all Decimal fields converted
      const serialized = {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        client: item.Client,
        clientEntreprise: item.Client_entreprise,
        voitureModel: item.VoitureModel,
        conteneur: item.Conteneur,
        fournisseurs:
          item.Fournisseur || [],
      };
      return serialized;
    });

    // Group by etapeCommande
    const grouped: Record<string, unknown[]> = {};

    (serializedCommandes as Array<Record<string, unknown>>).forEach((cmd) => {
      const etape = String(cmd.etapeCommande || "UNKNOWN");
      if (!grouped[etape]) {
        grouped[etape] = [];
      }
      grouped[etape].push(cmd);
    });

    return { success: true, data: grouped };
  } catch (error) {
    console.error("Error fetching grouped commandes:", error);
    return { success: false, error: "Failed to fetch grouped commandes" };
  }
}

export async function getCommandesDisponibles() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        commandeFlag: "DISPONIBLE",
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
        Conteneur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        prix_unitaire?: unknown;
        Client?: unknown;
        Client_entreprise?: unknown;
        VoitureModel?: unknown;
        Fournisseur?: unknown[];
        Conteneur?: unknown;
      };
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        client: item.Client,
        clientEntreprise: item.Client_entreprise,
        voitureModel: item.VoitureModel,
        fournisseurs:
          item.Fournisseur || [],
        conteneur: item.Conteneur,
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching commandes disponibles:", error);
    return { success: false, error: "Failed to fetch commandes disponibles" };
  }
}

export async function getCommandesVenduesProposition() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "PROPOSITION",
        commandeFlag: "VENDUE",
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        prix_unitaire?: unknown;
        Client?: unknown;
        Client_entreprise?: unknown;
        VoitureModel?: unknown;
        Fournisseur?: unknown[];
      };
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        client: item.Client,
        clientEntreprise: item.Client_entreprise,
        voitureModel: item.VoitureModel,
        fournisseurs:
          item.Fournisseur || [],
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching commandes vendues proposition:", error);
    return {
      success: false,
      error: "Failed to fetch commandes vendues proposition",
    };
  }
}

export async function getCommandesDisponiblesProposition() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "PROPOSITION",
        commandeFlag: "DISPONIBLE",
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        prix_unitaire?: unknown;
        Client?: unknown;
        Client_entreprise?: unknown;
        VoitureModel?: unknown;
        Fournisseur?: unknown[];
      };
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        client: item.Client,
        clientEntreprise: item.Client_entreprise,
        voitureModel: item.VoitureModel,
        fournisseurs:
          item.Fournisseur || [],
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching commandes disponibles proposition:", error);
    return {
      success: false,
      error: "Failed to fetch commandes disponibles proposition",
    };
  }
}

export async function getAllCommandesProposition() {
  try {
    const commandes = await prisma.commande.findMany({
      where: {
        etapeCommande: "PROPOSITION",
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal fields and Dates
    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as Record<string, unknown> & {
        prix_unitaire?: unknown;
        Client?: { createdAt: Date; updatedAt: Date } & Record<string, unknown>;
        Client_entreprise?: { createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >;
        VoitureModel?: { createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >;
        Fournisseur?: Array<{ createdAt: Date; updatedAt: Date } & Record<
          string,
          unknown
        >>;
      };
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        date_livraison: (item.date_livraison as Date).toISOString(),
        createdAt: (item.createdAt as Date).toISOString(),
        updatedAt: (item.updatedAt as Date).toISOString(),
        client: item.Client
          ? {
              ...item.Client,
              createdAt: item.Client.createdAt.toISOString(),
              updatedAt: item.Client.updatedAt.toISOString(),
            }
          : null,
        clientEntreprise: item.Client_entreprise
          ? {
              ...item.Client_entreprise,
              createdAt: item.Client_entreprise.createdAt.toISOString(),
              updatedAt: item.Client_entreprise.updatedAt.toISOString(),
            }
          : null,
        voitureModel: item.VoitureModel
          ? {
              ...item.VoitureModel,
              createdAt: item.VoitureModel.createdAt.toISOString(),
              updatedAt: item.VoitureModel.updatedAt.toISOString(),
            }
          : null,
        fournisseurs: item.Fournisseur
          ? item.Fournisseur.map((f) => ({
              ...f,
              createdAt: f.createdAt.toISOString(),
              updatedAt: f.updatedAt.toISOString(),
            }))
          : [],
      };
    });

    return { success: true, data: serializedCommandes };
  } catch (error) {
    console.error("Error fetching all commandes proposition:", error);
    return {
      success: false,
      error: "Failed to fetch all commandes proposition",
    };
  }
}

export async function attribuerCommande(
  commandeId: string,
  factureId: string,
  clientId?: string,
  clientEntrepriseId?: string,
) {
  try {
    if (!clientId && !clientEntrepriseId) {
      return {
        success: false,
        error: "Un client ou une entreprise cliente est requis",
      };
    }

    
    const commande = await prisma.commande.update({
      where: { id: commandeId },
      data: {
        commandeFlag: "VENDUE",
        factureId: factureId,
        updatedAt: new Date(),
        ...(clientId && { clientId }),
        ...(clientEntrepriseId && { clientEntrepriseId }),
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
        Fournisseur: true,
        Conteneur: true,
      },
    });

    // Serialize Decimal fields
    const attrItem = commande as Record<string, unknown> & {
      prix_unitaire?: unknown;
      Client?: unknown;
      Client_entreprise?: unknown;
      VoitureModel?: unknown;
      Fournisseur?: unknown[];
      Conteneur?: unknown;
    };
    const serializedCommande = {
      ...attrItem,
      prix_unitaire: attrItem.prix_unitaire
        ? Number(attrItem.prix_unitaire)
        : null,
      client: attrItem.Client,
      clientEntreprise: attrItem.Client_entreprise,
      voitureModel: attrItem.VoitureModel,
      fournisseurs:
        attrItem.Fournisseur || [],
      conteneur: attrItem.Conteneur,
    };

    revalidatePath("/comptable/facture");
    return { success: true, data: serializedCommande };
  } catch (error) {
    console.error("Error attribuing commande:", error);
    return { success: false, error: "Failed to attribute commande" };
  }
}
