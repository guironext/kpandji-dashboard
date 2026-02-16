"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "./user";

export async function createClientEntreprise(data: {
  nom_entreprise: string;
  sigle?: string;
  email?: string;
  telephone: string;
  nom_personne_contact?: string;
  fonction_personne_contact?: string;
  email_personne_contact?: string;
  telephone_personne_contact?: string;
  localisation?: string;
  secteur_activite?: string;
  flotte_vehicules?: boolean;
  flotte_vehicules_description?: string;
  commercial?: string;
  status_client?: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE";
  userId: string;
}) {
  try {
    console.log("Creating client_entreprise with data:", data);
    
    // Get or create user if it doesn't exist
    const userResult = await getOrCreateUser(data.userId);
    
    if (!userResult.success || !userResult.data) {
      console.log("Failed to get or create user for clerkId:", data.userId);
      return { success: false, error: userResult.error || "User not found" };
    }
    
    const user = userResult.data;
    console.log("Found/created user:", user.id);
    
    const clientEntrepriseData = {
      id: crypto.randomUUID(),
      nom_entreprise: data.nom_entreprise,
      sigle: data.sigle || null,
      email: data.email || null,
      telephone: data.telephone,
      nom_personne_contact: data.nom_personne_contact || null,
      fonction_personne_contact: data.fonction_personne_contact || null,
      email_personne_contact: data.email_personne_contact || null,
      telephone_personne_contact: data.telephone_personne_contact || null,
      localisation: data.localisation || null,
      secteur_activite: data.secteur_activite || null,
      flotte_vehicules: data.flotte_vehicules || false,
      flotte_vehicules_description: data.flotte_vehicules_description || null,
      commercial: data.commercial || null,
      status_client: data.status_client || "PROSPECT",
      userId: user.id,
      updatedAt: new Date(),
    };
    
    console.log("Creating client_entreprise with data:", clientEntrepriseData);
    

    const clientEntreprise = await prisma.client_entreprise.create({
      data: clientEntrepriseData,
    });

    console.log("Client_entreprise created successfully:", clientEntreprise);
    revalidatePath("/commercial/prospects");
    return { success: true, data: clientEntreprise };
  } catch (error) {
    console.error("Error creating client_entreprise:", error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to create client_entreprise: ${error.message}` };
    }
    return { success: false, error: "Failed to create client_entreprise" };
  }
}

export async function getClientEntreprise(id: string) {
  try {
   
    const clientEntreprise = await prisma.client_entreprise.findUnique({
      where: { id },
      include: { User: true }
    });
    
    if (!clientEntreprise) {
      return { success: false, error: "Client_entreprise not found" };
    }
    
    return { 
      success: true, 
      data: {
        ...clientEntreprise,
        user: (clientEntreprise as { User?: unknown }).User
      } 
    };
  } catch (error) {
    console.error("Error fetching client_entreprise:", error);
    return { success: false, error: "Failed to fetch client_entreprise" };
  }
}

export async function getAllClientEntreprises() {
  try {

    const clientEntreprises = await prisma.client_entreprise.findMany({
      include: { User: true },
      orderBy: { nom_entreprise: 'asc' }
    });
    
    return { 
      success: true, 
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown };
        return {
          ...item,
          user: item.User
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function updateClientEntreprise(id: string, data: {
  nom_entreprise?: string;
  sigle?: string;
  email?: string;
  telephone?: string;
  nom_personne_contact?: string;
  fonction_personne_contact?: string;
  email_personne_contact?: string;
  telephone_personne_contact?: string;
  localisation?: string;
  secteur_activite?: string;
  flotte_vehicules?: boolean;
  flotte_vehicules_description?: string;
  commercial?: string;
  status_client?: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE";
}) {
  try {
    console.log("Updating client_entreprise with ID:", id);
    console.log("Update data:", data);
    
    // First, check if the client_entreprise exists and has a valid user relationship

    const existingClientEntreprise = await prisma.client_entreprise.findUnique({
      where: { id },
      include: { User: true }
    });
    
    if (!existingClientEntreprise) {
      return { success: false, error: "Client_entreprise not found" };
    }
    
    console.log("Existing client_entreprise found:", existingClientEntreprise.nom_entreprise, "User ID:", existingClientEntreprise.userId);
    
    // Verify that the associated user exists (this prevents foreign key constraint violations)
    if (!(existingClientEntreprise as { User?: unknown }).User) {
      console.error("Client_entreprise exists but associated user is null:", existingClientEntreprise.userId);
      return { success: false, error: "Associated user not found. Please contact support." };
    }
    
    // Explicitly exclude userId to prevent foreign key constraint violations
    const { userId, ...safeData } = data as Record<string, unknown> & { userId?: unknown };
    if (userId !== undefined) {
      console.warn("Attempted to update userId field, which is not allowed. Ignoring userId:", userId);
    }
    
    // Clean the data to ensure we don't accidentally update userId
    const updateData = {
      ...(safeData.nom_entreprise !== undefined && { nom_entreprise: safeData.nom_entreprise as string }),
      ...(safeData.sigle !== undefined && { sigle: safeData.sigle as string | null }),
      ...(safeData.email !== undefined && { email: safeData.email as string | null }),
      ...(safeData.telephone !== undefined && { telephone: safeData.telephone as string }),
      ...(safeData.nom_personne_contact !== undefined && { nom_personne_contact: safeData.nom_personne_contact as string | null }),
      ...(safeData.fonction_personne_contact !== undefined && { fonction_personne_contact: safeData.fonction_personne_contact as string | null }),
      ...(safeData.email_personne_contact !== undefined && { email_personne_contact: safeData.email_personne_contact as string | null }),
      ...(safeData.telephone_personne_contact !== undefined && { telephone_personne_contact: safeData.telephone_personne_contact as string | null }),
      ...(safeData.localisation !== undefined && { localisation: safeData.localisation as string | null }),
      ...(safeData.secteur_activite !== undefined && { secteur_activite: safeData.secteur_activite as string | null }),
      ...(safeData.flotte_vehicules !== undefined && { flotte_vehicules: safeData.flotte_vehicules as boolean | null }),
      ...(safeData.flotte_vehicules_description !== undefined && { flotte_vehicules_description: safeData.flotte_vehicules_description as string | null }),
      ...(safeData.commercial !== undefined && { commercial: safeData.commercial as string | null }),
      ...(safeData.status_client !== undefined && { status_client: safeData.status_client as "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE" }),
    };
    
    console.log("Final update data (excluding userId):", updateData);
    
    const clientEntreprise = await prisma.client_entreprise.update({
      where: { id },
      data: updateData
    });
    
    console.log("Client_entreprise updated successfully:", clientEntreprise);
    revalidatePath("/commercial/prospects");
    return { success: true, data: clientEntreprise };
  } catch (error) {
    console.error("Error updating client_entreprise:", error);
    if (error instanceof Error) {
      // Check for specific foreign key constraint error
      if (error.message.includes("Foreign key constraint violated")) {
        return { success: false, error: "Invalid user reference. Please ensure the user exists in the system." };
      }
      return { success: false, error: `Failed to update client_entreprise: ${error.message}` };
    }
    return { success: false, error: "Failed to update client_entreprise" };
  }
}

export async function deleteClientEntreprise(id: string) {
  try {
    await prisma.client_entreprise.delete({
      where: { id }
    });
    
    revalidatePath("/commercial/prospects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting client_entreprise:", error);
    return { success: false, error: "Failed to delete client_entreprise" };
  }
}

export async function getClientEntreprisesByUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
  
    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: {
        userId: user.id,
      },
      include: { 
        User: true,
        Voiture: {
          include: {
            VoitureModel: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }  // Newest to oldest
    });
    
    return { 
      success: true, 
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown; Voiture?: unknown[] };
        return {
          ...item,
          user: item.User,
          voitures: item.Voiture?.map((v: unknown) => {
            const voiture = v as Record<string, unknown> & { VoitureModel?: unknown };
            return {
              ...voiture,
              voitureModel: voiture.VoitureModel
            };
          })
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises by user:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function getClientEntreprisesByStatus(status: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE") {
  try {
    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: {
        status_client: status,
      },
      include: { User: true },
      orderBy: { nom_entreprise: 'asc' }
    });
    
    return { 
      success: true, 
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown };
        return {
          ...item,
          user: item.User
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises by status:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function getClientEntreprisesByStatusWithVoitures(status: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE") {
  try {
    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: { status_client: status },
      include: {
        User: true,
        Voiture: {
          include: { VoitureModel: true }
        }
      },
      orderBy: { nom_entreprise: 'asc' }
    });
    return {
      success: true,
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown; Voiture?: unknown[] };
        return {
          ...item,
          user: item.User,
          voitures: item.Voiture?.map((v: unknown) => {
            const voiture = v as Record<string, unknown> & { VoitureModel?: unknown };
            return { ...voiture, voitureModel: voiture.VoitureModel };
          })
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises by status with voitures:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function reassignClientEntrepriseProspect(
  id: string,
  newUserId: string,
  newCommercialName: string
) {
  try {
    const clientEntreprise = await prisma.client_entreprise.update({
      where: { id },
      data: {
        userId: newUserId,
        commercial: newCommercialName,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/commercial/prospects");
    revalidatePath("/responsablecommercial/prospects");
    return { success: true, data: clientEntreprise };
  } catch (error) {
    console.error("Error reassigning client_entreprise prospect:", error);
    return { success: false, error: "Failed to reassign prospect" };
  }
}

export async function getClientEntreprisesByUserAndStatus(userId: string, status: "CLIENT" | "PROSPECT" | "ABANDONNE") {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    

    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: {
        userId: user.id,
        status_client: status,
      },
      include: { User: true },
      orderBy: { nom_entreprise: 'asc' }
    });
    
    return { 
      success: true, 
      data: (clientEntreprises as unknown[]).map((ce: unknown) => {
        const item = ce as Record<string, unknown> & { User?: unknown };
        return {
          ...item,
          user: item.User
        };
      })
    };
  } catch (error) {
    console.error("Error fetching client_entreprises by user and status:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}

export async function getClientsWithFacturesGroupedByYearMonth() {
  try {
    // Fetch Client_entreprise records
    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: {
        status_client: {
          in: ["CLIENT", "PROSPECT"]
        }
      },
      include: {
        User: true,
        Facture: {
          include: {
            FactureLigne: {
              include: {
                VoitureModel: true
              }
            }
          },
          orderBy: {
            date_facture: "desc"
          }
        }
      },
      orderBy: {
        nom_entreprise: 'asc'
      }
    });

    // Fetch Client records
    const clients = await prisma.client.findMany({
      where: {
        status_client: {
          in: ["CLIENT", "PROSPECT"]
        }
      },
      include: {
        User: true,
        Facture: {
          include: {
            FactureLigne: {
              include: {
                VoitureModel: true
              }
            }
          },
          orderBy: {
            date_facture: "desc"
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Group factures by year and month
    const groupedData: Record<string, Record<string, Array<{
      client: unknown;
      facture: unknown;
    }>>> = {};

    // Process Client_entreprise records
    clientEntreprises.forEach((client) => {
      const factures = (client.Facture || []) as Array<{
        date_facture: Date;
        id: string;
        FactureLigne: Array<{
          id: string;
          voitureModelId: string;
          couleur: string;
          nbr_voiture: number;
          prix_unitaire: unknown;
          montant_ligne: unknown;
          VoitureModel: {
            model: string;
            image?: string;
            description?: string;
          } | null;
        }>;
        total_ttc: unknown;
        [key: string]: unknown;
      }>;

      factures.forEach((facture) => {
        const date = new Date(facture.date_facture);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        if (!groupedData[year]) {
          groupedData[year] = {};
        }
        if (!groupedData[year][month]) {
          groupedData[year][month] = [];
        }

        // Serialize all Decimal fields in facture
        const dateFacture = new Date(facture.date_facture);
        const dateEcheance = (facture as { date_echeance?: Date }).date_echeance 
          ? new Date((facture as { date_echeance?: Date }).date_echeance!)
          : dateFacture;
        
        const serializedFacture = {
          id: facture.id,
          date_facture: dateFacture.toISOString(),
          date_echeance: dateEcheance.toISOString(),
          status_facture: (facture as { status_facture?: string }).status_facture || "",
          nbr_voiture_commande: (facture as { nbr_voiture_commande?: number }).nbr_voiture_commande || 0,
          prix_unitaire: (facture as { prix_unitaire?: unknown }).prix_unitaire ? Number((facture as { prix_unitaire?: unknown }).prix_unitaire) : 0,
          montant_ht: (facture as { montant_ht?: unknown }).montant_ht ? Number((facture as { montant_ht?: unknown }).montant_ht) : 0,
          total_ht: (facture as { total_ht?: unknown }).total_ht ? Number((facture as { total_ht?: unknown }).total_ht) : 0,
          remise: (facture as { remise?: unknown }).remise ? Number((facture as { remise?: unknown }).remise) : 0,
          montant_remise: (facture as { montant_remise?: unknown }).montant_remise ? Number((facture as { montant_remise?: unknown }).montant_remise) : 0,
          montant_net_ht: (facture as { montant_net_ht?: unknown }).montant_net_ht ? Number((facture as { montant_net_ht?: unknown }).montant_net_ht) : 0,
          tva: (facture as { tva?: unknown }).tva ? Number((facture as { tva?: unknown }).tva) : 0,
          montant_tva: (facture as { montant_tva?: unknown }).montant_tva ? Number((facture as { montant_tva?: unknown }).montant_tva) : 0,
          total_ttc: facture.total_ttc ? Number(facture.total_ttc) : 0,
          avance_payee: (facture as { avance_payee?: unknown }).avance_payee ? Number((facture as { avance_payee?: unknown }).avance_payee) : 0,
          reste_payer: (facture as { reste_payer?: unknown }).reste_payer ? Number((facture as { reste_payer?: unknown }).reste_payer) : 0,
          accessoire_description: (facture as { accessoire_description?: string | null }).accessoire_description || null,
          accessoire_nbr: (facture as { accessoire_nbr?: number | null }).accessoire_nbr || null,
          accessoire_nom: (facture as { accessoire_nom?: string | null }).accessoire_nom || null,
          accessoire_prix: (facture as { accessoire_prix?: unknown }).accessoire_prix ? Number((facture as { accessoire_prix?: unknown }).accessoire_prix) : null,
          accessoire_subtotal: (facture as { accessoire_subtotal?: unknown }).accessoire_subtotal ? Number((facture as { accessoire_subtotal?: unknown }).accessoire_subtotal) : null,
          bon_pour_acquis: (facture as { bon_pour_acquis?: boolean }).bon_pour_acquis || false,
          FactureLigne: facture.FactureLigne.map((ligne) => ({
            id: ligne.id,
            voitureModelId: ligne.voitureModelId,
            couleur: ligne.couleur,
            nbr_voiture: ligne.nbr_voiture,
            prix_unitaire: ligne.prix_unitaire ? Number(ligne.prix_unitaire) : 0,
            montant_ligne: ligne.montant_ligne ? Number(ligne.montant_ligne) : 0,
            transmission: (ligne as { transmission?: string | null }).transmission || null,
            motorisation: (ligne as { motorisation?: string | null }).motorisation || null,
            voitureModel: ligne.VoitureModel
          }))
        };

        groupedData[year][month].push({
          client: {
            id: (client as { id?: string }).id || "",
            nom_entreprise: (client as { nom_entreprise?: string }).nom_entreprise || "",
            sigle: (client as { sigle?: string | null }).sigle || null,
            telephone: (client as { telephone?: string }).telephone || null,
            localisation: (client as { localisation?: string | null }).localisation || null,
            commercial: (client as { commercial?: string | null }).commercial || null,
            status_client: (client as { status_client?: string }).status_client || "",
            user: (client as { User?: unknown }).User,
            isEntreprise: true
          },
          facture: serializedFacture
        });
      });
    });

    // Process Client records
    clients.forEach((client) => {
      const factures = (client.Facture || []) as Array<{
        date_facture: Date;
        id: string;
        FactureLigne: Array<{
          id: string;
          voitureModelId: string;
          couleur: string;
          nbr_voiture: number;
          prix_unitaire: unknown;
          montant_ligne: unknown;
          VoitureModel: {
            model: string;
            image?: string;
            description?: string;
          } | null;
        }>;
        total_ttc: unknown;
        [key: string]: unknown;
      }>;

      factures.forEach((facture) => {
        const date = new Date(facture.date_facture);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        if (!groupedData[year]) {
          groupedData[year] = {};
        }
        if (!groupedData[year][month]) {
          groupedData[year][month] = [];
        }

        // Serialize all Decimal fields in facture
        const dateFacture = new Date(facture.date_facture);
        const dateEcheance = (facture as { date_echeance?: Date }).date_echeance 
          ? new Date((facture as { date_echeance?: Date }).date_echeance!)
          : dateFacture;
        
        const serializedFacture = {
          id: facture.id,
          date_facture: dateFacture.toISOString(),
          date_echeance: dateEcheance.toISOString(),
          status_facture: (facture as { status_facture?: string }).status_facture || "",
          nbr_voiture_commande: (facture as { nbr_voiture_commande?: number }).nbr_voiture_commande || 0,
          prix_unitaire: (facture as { prix_unitaire?: unknown }).prix_unitaire ? Number((facture as { prix_unitaire?: unknown }).prix_unitaire) : 0,
          montant_ht: (facture as { montant_ht?: unknown }).montant_ht ? Number((facture as { montant_ht?: unknown }).montant_ht) : 0,
          total_ht: (facture as { total_ht?: unknown }).total_ht ? Number((facture as { total_ht?: unknown }).total_ht) : 0,
          remise: (facture as { remise?: unknown }).remise ? Number((facture as { remise?: unknown }).remise) : 0,
          montant_remise: (facture as { montant_remise?: unknown }).montant_remise ? Number((facture as { montant_remise?: unknown }).montant_remise) : 0,
          montant_net_ht: (facture as { montant_net_ht?: unknown }).montant_net_ht ? Number((facture as { montant_net_ht?: unknown }).montant_net_ht) : 0,
          tva: (facture as { tva?: unknown }).tva ? Number((facture as { tva?: unknown }).tva) : 0,
          montant_tva: (facture as { montant_tva?: unknown }).montant_tva ? Number((facture as { montant_tva?: unknown }).montant_tva) : 0,
          total_ttc: facture.total_ttc ? Number(facture.total_ttc) : 0,
          avance_payee: (facture as { avance_payee?: unknown }).avance_payee ? Number((facture as { avance_payee?: unknown }).avance_payee) : 0,
          reste_payer: (facture as { reste_payer?: unknown }).reste_payer ? Number((facture as { reste_payer?: unknown }).reste_payer) : 0,
          accessoire_description: (facture as { accessoire_description?: string | null }).accessoire_description || null,
          accessoire_nbr: (facture as { accessoire_nbr?: number | null }).accessoire_nbr || null,
          accessoire_nom: (facture as { accessoire_nom?: string | null }).accessoire_nom || null,
          accessoire_prix: (facture as { accessoire_prix?: unknown }).accessoire_prix ? Number((facture as { accessoire_prix?: unknown }).accessoire_prix) : null,
          accessoire_subtotal: (facture as { accessoire_subtotal?: unknown }).accessoire_subtotal ? Number((facture as { accessoire_subtotal?: unknown }).accessoire_subtotal) : null,
          bon_pour_acquis: (facture as { bon_pour_acquis?: boolean }).bon_pour_acquis || false,
          FactureLigne: facture.FactureLigne.map((ligne) => ({
            id: ligne.id,
            voitureModelId: ligne.voitureModelId,
            couleur: ligne.couleur,
            nbr_voiture: ligne.nbr_voiture,
            prix_unitaire: ligne.prix_unitaire ? Number(ligne.prix_unitaire) : 0,
            montant_ligne: ligne.montant_ligne ? Number(ligne.montant_ligne) : 0,
            transmission: (ligne as { transmission?: string | null }).transmission || null,
            motorisation: (ligne as { motorisation?: string | null }).motorisation || null,
            voitureModel: ligne.VoitureModel
          }))
        };

        groupedData[year][month].push({
          client: {
            id: client.id,
            nom: (client as { nom?: string }).nom || "",
            nom_entreprise: (client as { nom?: string }).nom || "",
            sigle: null,
            telephone: (client as { telephone?: string }).telephone || null,
            localisation: (client as { localisation?: string | null }).localisation || null,
            commercial: (client as { commercial?: string | null }).commercial || null,
            status_client: (client as { status_client?: string }).status_client || "",
            user: (client as { User?: unknown }).User,
            isEntreprise: false
          },
          facture: serializedFacture
        });
      });
    });

    // Sort years and months in descending order (latest first)
    const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(b) - parseInt(a));
    const result: Record<string, Record<string, Array<{
      client: unknown;
      facture: unknown;
    }>>> = {};

    sortedYears.forEach((year) => {
      const sortedMonths = Object.keys(groupedData[year]).sort((a, b) => parseInt(b) - parseInt(a));
      result[year] = {};
      sortedMonths.forEach((month) => {
        // Sort factures within each month by date (latest first)
        result[year][month] = groupedData[year][month].sort((a, b) => {
          const dateA = new Date((a.facture as { date_facture: Date }).date_facture);
          const dateB = new Date((b.facture as { date_facture: Date }).date_facture);
          return dateB.getTime() - dateA.getTime();
        });
      });
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching clients with factures grouped by year/month:", error);
    return { success: false, error: "Failed to fetch clients with factures" };
  }
}
