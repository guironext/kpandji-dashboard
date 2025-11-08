"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function createClient(data: {
  nom: string;
  email?: string;
  telephone: string;
  entreprise?: string;
  secteur_activite?: string;
  localisation?: string;
  commercial?: string;
  status_client?: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE";
  userId: string;
}) {
  try {
    console.log("Creating client with data:", data);
    
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
    
    const clientData = {
      nom: data.nom,
      email: data.email || null,
      telephone: data.telephone,
      entreprise: data.entreprise || null,
      secteur_activite: data.secteur_activite || null,
      localisation: data.localisation || null,
      commercial: data.commercial || null,
      status_client: data.status_client || "PROSPECT", // Add status with default
      userId: user.id,
    };
    
    console.log("Creating client with data:", clientData);
    
    const client = await prisma.client.create({
      data: clientData,
    });

    console.log("Client created successfully:", client);
    revalidatePath("/manager");
    return { success: true, data: client };
  } catch (error) {
    console.error("Error creating client:", error);
    if (error instanceof Error) {
      return { success: false, error: `Failed to create client: ${error.message}` };
    }
    return { success: false, error: "Failed to create client" };
  }
}

export async function getClient(id: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!client) {
      return { success: false, error: "Client not found" };
    }
    
    return { success: true, data: client };
  } catch (error) {
    console.error("Error fetching client:", error);
    return { success: false, error: "Failed to fetch client" };
  }
}

export async function getAllClients() {
  try {
    const clients = await prisma.client.findMany({
      include: { user: true },
      orderBy: { nom: 'asc' }
    });
    
    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Failed to fetch clients" };
  }
}

export async function updateClient(id: string, data: {
  nom?: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  secteur_activite?: string;
  localisation?: string;
  commercial?: string;
  status_client?: "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE";
}) {
  try {
    console.log("Updating client with ID:", id);
    console.log("Update data:", data);
    
    // First, check if the client exists and has a valid user relationship
    const existingClient = await prisma.client.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!existingClient) {
      return { success: false, error: "Client not found" };
    }
    
    console.log("Existing client found:", existingClient.nom, "User ID:", existingClient.userId);
    
    // Verify that the associated user exists (this prevents foreign key constraint violations)
    if (!existingClient.user) {
      console.error("Client exists but associated user is null:", existingClient.userId);
      return { success: false, error: "Associated user not found. Please contact support." };
    }
    
    // Explicitly exclude userId to prevent foreign key constraint violations
    const { userId, ...safeData } = data as Record<string, unknown> & { userId?: unknown };
    if (userId !== undefined) {
      console.warn("Attempted to update userId field, which is not allowed. Ignoring userId:", userId);
    }
    
    // Clean the data to ensure we don't accidentally update userId
    const updateData = {
      ...(safeData.nom !== undefined && { nom: safeData.nom as string }),
      ...(safeData.email !== undefined && { email: safeData.email as string | null }),
      ...(safeData.telephone !== undefined && { telephone: safeData.telephone as string }),
      ...(safeData.entreprise !== undefined && { entreprise: safeData.entreprise as string | null }),
      ...(safeData.secteur_activite !== undefined && { secteur_activite: safeData.secteur_activite as string | null }),
      ...(safeData.localisation !== undefined && { localisation: safeData.localisation as string | null }),
      ...(safeData.commercial !== undefined && { commercial: safeData.commercial as string | null }),
      ...(safeData.status_client !== undefined && { status_client: safeData.status_client as "CLIENT" | "PROSPECT" | "FAVORABLE" | "A_SUIVRE" | "ABANDONNE" }),
    };
    
    console.log("Final update data (excluding userId):", updateData);
    
    const client = await prisma.client.update({
      where: { id },
      data: updateData
    });
    
    console.log("Client updated successfully:", client);
    revalidatePath("/manager");
    revalidatePath("/commercial/programme");
    revalidatePath("/commercial/prospects");
    return { success: true, data: client };
  } catch (error) {
    console.error("Error updating client:", error);
    if (error instanceof Error) {
      // Check for specific foreign key constraint error
      if (error.message.includes("Foreign key constraint violated")) {
        return { success: false, error: "Invalid user reference. Please ensure the user exists in the system." };
      }
      return { success: false, error: `Failed to update client: ${error.message}` };
    }
    return { success: false, error: "Failed to update client" };
  }
}

export async function deleteClient(id: string) {
  try {
    await prisma.client.delete({
      where: { id }
    });
    
    revalidatePath("/manager");
    revalidatePath("/commercial/prospects");
    return { success: true };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { success: false, error: "Failed to delete client" };
  }
}

export async function getClientsByUserAndStatus(userId: string, status: "CLIENT" | "PROSPECT" | "ABANDONNE") {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    const clients = await prisma.client.findMany({
      where: {
        userId: user.id,
        status_client: status,
      },
      include: { user: true },
      orderBy: { nom: 'asc' }
    });
    
    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching clients by user and status:", error);
    return { success: false, error: "Failed to fetch clients" };
  }
}

export async function getProspectsByCommercial(commercialName: string) {
  try {
    const clients = await prisma.client.findMany({
      where: {
        commercial: commercialName,
        status_client: "PROSPECT",
      },
      include: { user: true },
      orderBy: { nom: 'asc' }
    });
    
    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching prospects by commercial:", error);
    return { success: false, error: "Failed to fetch prospects" };
  }
}

export async function getClientsByUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    const clients = await prisma.client.findMany({
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
    
    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching clients by user:", error);
    return { success: false, error: "Failed to fetch clients" };
  }
}

