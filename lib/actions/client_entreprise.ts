"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

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
    
    const user = await prisma.user.findUnique({
      where: {
        clerkId: data.userId,
      },
    });
    
    if (!user) {
      console.log("User not found for clerkId:", data.userId);
      return { success: false, error: "User not found" };
    }
    
    console.log("Found user:", user.id);
    
    const clientEntrepriseData = {
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
      include: { user: true }
    });
    
    if (!clientEntreprise) {
      return { success: false, error: "Client_entreprise not found" };
    }
    
    return { success: true, data: clientEntreprise };
  } catch (error) {
    console.error("Error fetching client_entreprise:", error);
    return { success: false, error: "Failed to fetch client_entreprise" };
  }
}

export async function getAllClientEntreprises() {
  try {
    const clientEntreprises = await prisma.client_entreprise.findMany({
      include: { user: true },
      orderBy: { nom_entreprise: 'asc' }
    });
    
    return { success: true, data: clientEntreprises };
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
      include: { user: true }
    });
    
    if (!existingClientEntreprise) {
      return { success: false, error: "Client_entreprise not found" };
    }
    
    console.log("Existing client_entreprise found:", existingClientEntreprise.nom_entreprise, "User ID:", existingClientEntreprise.userId);
    
    // Verify that the associated user exists (this prevents foreign key constraint violations)
    if (!existingClientEntreprise.user) {
      console.error("Client_entreprise exists but associated user is null:", existingClientEntreprise.userId);
      return { success: false, error: "Associated user not found. Please contact support." };
    }
    
    // Explicitly exclude userId to prevent foreign key constraint violations
    const { userId, ...safeData } = data as any;
    if (userId !== undefined) {
      console.warn("Attempted to update userId field, which is not allowed. Ignoring userId:", userId);
    }
    
    // Clean the data to ensure we don't accidentally update userId
    const updateData = {
      ...(safeData.nom_entreprise !== undefined && { nom_entreprise: safeData.nom_entreprise }),
      ...(safeData.sigle !== undefined && { sigle: safeData.sigle }),
      ...(safeData.email !== undefined && { email: safeData.email }),
      ...(safeData.telephone !== undefined && { telephone: safeData.telephone }),
      ...(safeData.nom_personne_contact !== undefined && { nom_personne_contact: safeData.nom_personne_contact }),
      ...(safeData.fonction_personne_contact !== undefined && { fonction_personne_contact: safeData.fonction_personne_contact }),
      ...(safeData.email_personne_contact !== undefined && { email_personne_contact: safeData.email_personne_contact }),
      ...(safeData.telephone_personne_contact !== undefined && { telephone_personne_contact: safeData.telephone_personne_contact }),
      ...(safeData.localisation !== undefined && { localisation: safeData.localisation }),
      ...(safeData.secteur_activite !== undefined && { secteur_activite: safeData.secteur_activite }),
      ...(safeData.flotte_vehicules !== undefined && { flotte_vehicules: safeData.flotte_vehicules }),
      ...(safeData.flotte_vehicules_description !== undefined && { flotte_vehicules_description: safeData.flotte_vehicules_description }),
      ...(safeData.commercial !== undefined && { commercial: safeData.commercial }),
      ...(safeData.status_client !== undefined && { status_client: safeData.status_client }),
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
        user: true,
        voitures: {
          include: {
            voitureModel: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }  // Newest to oldest
    });
    
    return { success: true, data: clientEntreprises };
  } catch (error) {
    console.error("Error fetching client_entreprises by user:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
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
      include: { user: true },
      orderBy: { nom_entreprise: 'asc' }
    });
    
    return { success: true, data: clientEntreprises };
  } catch (error) {
    console.error("Error fetching client_entreprises by user and status:", error);
    return { success: false, error: "Failed to fetch client_entreprises" };
  }
}
