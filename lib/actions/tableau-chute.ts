"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function createTableauChute(data: {
  mois_chute: string;
  rendezVousId: string;
  clientId: string;
  voitureId: string;
  clerkUserId: string;
}) {
  try {
    // Get user from clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: data.clerkUserId },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if RapportRendezVous exists, if not create one
    let rapportRendezVous = await prisma.rapportRendezVous.findFirst({
      where: {
        rendezVousId: data.rendezVousId,
        voitureId: data.voitureId,
      },
    });

    if (!rapportRendezVous) {
      // Get the rendez-vous to get the client info
      const rendezVous = await prisma.rendezVous.findUnique({
        where: { id: data.rendezVousId },
        include: {
          client: true,
          clientEntreprise: true,
        }
      });

      if (!rendezVous) {
        return { success: false, error: "Rendez-vous not found" };
      }

      rapportRendezVous = await prisma.rapportRendezVous.create({
        data: {
          rendezVousId: data.rendezVousId,
          clientId: rendezVous.clientId,
          clientEntrepriseId: rendezVous.clientEntrepriseId,
          voitureId: data.voitureId,
          // Add required fields with default values
          date_rendez_vous: rendezVous.date,
          heure_rendez_vous: "00:00",
          lieu_rendez_vous: "Showroom",
          conseiller_commercial: "Commercial",
          duree_rendez_vous: "1h",
          nom_prenom_client: rendezVous.client?.nom || rendezVous.clientEntreprise?.nom_entreprise || "Client",
          telephone_client: rendezVous.client?.telephone || rendezVous.clientEntreprise?.telephone || "",
          type_client: rendezVous.client ? "Particulier" : "Professionnel",
          presentation_gamme: false,
          essai_vehicule: false,
          negociation_commerciale: false,
          livraison_vehicule: false,
          service_apres_vente: false,
          devis_offre_remise: false,
          assurance_entretien: false,
          reprise_ancien_vehicule: false,
        },
      });
    }

    // Create Tableau_chute
    const tableauChute = await prisma.tableau_chute.create({
      data: {
        mois_chute: data.mois_chute,
        rapportRendezVousId: rapportRendezVous.id,
        clientId: data.clientId,
        voitureId: data.voitureId,
        userId: user.id,
      },
    });

    revalidatePath("/commercial/programme");
    revalidatePath("/commercial/tableau-chute");
    return { success: true, data: tableauChute };
  } catch (error) {
    console.error("Error creating tableau chute:", error);
    return { success: false, error: "Failed to create tableau chute" };
  }
}

export async function getTableauChuteByUser(clerkUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const tableauxChute = await prisma.tableau_chute.findMany({
      where: {
        userId: user.id,
      },
      include: {
        client: true,
        voiture: {
          include: {
            voitureModel: true,
          },
        },
        rapportRendezVous: {
          include: {
            rendezVous: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: tableauxChute };
  } catch (error) {
    console.error("Error fetching tableau chute:", error);
    return { success: false, error: "Failed to fetch tableau chute" };
  }
}

export async function deferTableauChute(data: {
  tableauChuteId: string;
  newMonth: string;
  newDate: Date;
}) {
  try {
    // Get the tableau chute with its relations
    const tableauChute = await prisma.tableau_chute.findUnique({
      where: { id: data.tableauChuteId },
      include: {
        rapportRendezVous: {
          include: {
            rendezVous: true,
          },
        },
      },
    });

    if (!tableauChute) {
      return { success: false, error: "Tableau chute not found" };
    }

    // Update the rendezvous date
    await prisma.rendezVous.update({
      where: { id: tableauChute.rapportRendezVous.rendezVous.id },
      data: { date: data.newDate },
    });

    // Update the mois_chute
    await prisma.tableau_chute.update({
      where: { id: data.tableauChuteId },
      data: { mois_chute: data.newMonth },
    });

    revalidatePath("/commercial/tableau-chute");
    return { success: true };
  } catch (error) {
    console.error("Error deferring tableau chute:", error);
    return { success: false, error: "Failed to defer tableau chute" };
  }
}

export async function getAllTableauChute() {
  try {
    const tableauxChute = await prisma.tableau_chute.findMany({
      select: {
        id: true,
        rapportRendezVousId: true,
        createdAt: true,
        updatedAt: true,
        mois_chute: true,
        userId: true,
        clientId: true,
        clientEntrepriseId: true,
        voitureId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            email: true,
            status_client: true,
            entreprise: true,
            localisation: true,
          },
        },
        voiture: {
          include: {
            voitureModel: {
              select: {
                model: true,
                image: true,
              },
            },
          },
        },
        rapportRendezVous: {
          include: {
            rendezVous: {
              select: {
                date: true,
                statut: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: tableauxChute };
  } catch (error) {
    console.error("Error fetching all tableau chute:", error);
    return { success: false, error: "Failed to fetch tableau chute" };
  }
}

export async function createTableauChuteRendezVous(data: {
  rapportRendezVousId: string;
  mois_chute: string;
  modeles_discutes?: unknown;
  clerkUserId: string;
}) {
  try {
    // Get user from clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: data.clerkUserId },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Create Tableau_chute_rendez_vous
    const tableauChuteRendezVous = await prisma.tableau_chute_rendez_vous.create({
      data: {
        mois_chute: data.mois_chute,
        modeles_discutes: data.modeles_discutes as never,
        rapportRendezVousId: data.rapportRendezVousId,
        userId: user.id,
      },
    });

    revalidatePath("/commercial/suivi-rendez-vous");
    return { success: true, data: tableauChuteRendezVous };
  } catch (error) {
    console.error("Error creating tableau chute rendez-vous:", error);
    return { success: false, error: "Failed to create tableau chute rendez-vous" };
  }
}

export async function getTableauChuteRendezVousByUser(clerkUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const tableauxChuteRendezVous = await prisma.tableau_chute_rendez_vous.findMany({
      where: {
        userId: user.id,
      },
      include: {
        rapportRendezVous: {
          include: {
            client: true,
            clientEntreprise: true,
            rendezVous: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: tableauxChuteRendezVous };
  } catch (error) {
    console.error("Error fetching tableau chute rendez-vous:", error);
    return { success: false, error: "Failed to fetch tableau chute rendez-vous" };
  }
}

export async function getAllTableauChuteRendezVous() {
  try {
    const tableauxChuteRendezVous = await prisma.tableau_chute_rendez_vous.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rapportRendezVous: {
          include: {
            client: true,
            clientEntreprise: true,
            rendezVous: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: tableauxChuteRendezVous };
  } catch (error) {
    console.error("Error fetching all tableau chute rendez-vous:", error);
    return { success: false, error: "Failed to fetch tableau chute rendez-vous" };
  }
}

export async function updateTableauChuteRendezVousMois(data: {
  id: string;
  mois_chute: string;
}) {
  try {
    const updatedRecord = await prisma.tableau_chute_rendez_vous.update({
      where: { id: data.id },
      data: { mois_chute: data.mois_chute },
    });

    revalidatePath("/commercial/tableau-chute");
    return { success: true, data: updatedRecord };
  } catch (error) {
    console.error("Error updating tableau chute rendez-vous:", error);
    return { success: false, error: "Failed to update tableau chute rendez-vous" };
  }
}