"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

function toStoredString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function createRendezVous(data: {
  date: Date;
  statut?: "EN_ATTENTE" | "CONFIRME" | "DEPLACE" | "EFFECTUE" | "ANNULE";
  clientId?: string;
  clientEntrepriseId?: string;
  voitureIds?: string[];
  voitureModelIds?: string[];
}) {
  try {
    const rendezVous = await prisma.rendezVous.create({
      data: {
        id: crypto.randomUUID(),
        date: data.date,
        statut: data.statut || "EN_ATTENTE",
        clientId: data.clientId || null,
        clientEntrepriseId: data.clientEntrepriseId || null,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        Client_entreprise: true,
      },
    });

    // Remap for frontend compatibility
    const serializedRendezVous = {
      ...rendezVous,
      clientEntreprise: ((rendezVous as unknown) as { Client_entreprise: unknown }).Client_entreprise,
    };

    // Link existing voitures to rendezvous if provided
    if (data.voitureIds && data.voitureIds.length > 0) {
      await prisma.voiture.updateMany({
        where: { id: { in: data.voitureIds } },
        data: { rendezVousId: rendezVous.id },
      });
    }

    // Create voitures from voitureModelIds if provided
    if (data.voitureModelIds && data.voitureModelIds.length > 0) {
      const clientId = data.clientId || data.clientEntrepriseId;
      if (clientId) {
        await Promise.all(
          data.voitureModelIds.map(async (modelId) => {
            await prisma.voiture.create({
              data: {
                id: crypto.randomUUID(),
                nbr_portes: "5", // Default values
                transmission: "AUTOMATIQUE",
                motorisation: "ESSENCE",
                etatVoiture: "PIECES",
                couleur: "Non spécifiée",
                clientId: data.clientId || null,
                clientEntrepriseId: data.clientEntrepriseId || null,
                voitureModelId: modelId,
                rendezVousId: rendezVous.id,
                updatedAt: new Date(),
              },
            });
          }),
        );
      }
    }

    revalidatePath("/commercial/rendez-vous");
    return { success: true, data: serializedRendezVous };
  } catch (error) {
    console.error("Error creating rendez-vous:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    const msg =
      errMsg.includes("Foreign key") || errMsg.includes("constraint")
        ? "Client ou entreprise introuvable. Vérifiez la sélection."
        : errMsg.includes("connect") || errMsg.includes("database")
          ? "Impossible de joindre la base de données. Réessayez plus tard."
          : `Erreur : ${errMsg}`;
    return { success: false, error: msg };
  }
}

export async function getRendezVousByClient(clientId: string) {
  try {
    const rendezVous = await prisma.rendezVous.findMany({
      where: { clientId },
      include: { client: true },
      orderBy: { date: "desc" },
    });

    return { success: true, data: rendezVous };
  } catch (error) {
    console.error("Error fetching rendez-vous:", error);
    return { success: false, error: "Failed to fetch appointments" };
  }
}

export async function getAllRendezVous() {
  try {
    const rendezVous = await prisma.rendezVous.findMany({
      include: {
        client: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        Client_entreprise: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Remap User to user for frontend compatibility
    const serializedRendezVous = (rendezVous as unknown[]).map((rv: unknown) => {
      const r = rv as Record<string, unknown> & {
        client?: Record<string, unknown> & { User?: unknown };
        Client_entreprise?: Record<string, unknown> & { User?: unknown };
      };
      const commercial = r.client?.User || r.Client_entreprise?.User;
      const commercialName = commercial
        ? `${(commercial as { firstName?: string }).firstName || ""} ${(commercial as { lastName?: string }).lastName || ""}`.trim()
        : "Non assigné";
      return {
        ...r,
        client: r.client ? { ...r.client, user: r.client.User } : null,
        clientEntreprise: r.Client_entreprise
          ? { ...r.Client_entreprise, user: r.Client_entreprise.User }
          : null,
        commercialName,
      };
    });

    return { success: true, data: serializedRendezVous };
  } catch (error) {
    console.error("Error fetching rendez-vous:", error);
    return { success: false, error: "Failed to fetch appointments" };
  }
}

export async function getRendezVousByUser(clerkUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const rendezVous = await prisma.rendezVous.findMany({
      where: {
        OR: [
          {
            client: {
              userId: user.id,
            },
          },
          {
            Client_entreprise: {
              userId: user.id,
            },
          },
        ],
      },
      include: {
        client: {
          include: {
            Voiture: {
              include: {
                VoitureModel: true,
              },
            },
          },
        },
        Client_entreprise: {
          include: {
            Voiture: {
              include: {
                VoitureModel: true,
              },
            },
          },
        },
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        RapportRendezVous: true,
      },
      orderBy: [{ statut: "desc" }, { date: "desc" }],
    });

    // Remap for frontend compatibility
    const serializedRendezVous = (rendezVous as unknown[]).map((rv: unknown) => {
      const r = rv as Record<string, unknown> & {
        client?: Record<string, unknown> & { Voiture?: unknown };
        Client_entreprise?: Record<string, unknown> & { Voiture?: unknown };
        Voiture?: unknown;
        RapportRendezVous?: unknown;
      };
      return {
        ...r,
        client: r.client ? {
          ...r.client,
          voitures: r.client.Voiture,
        } : null,
        clientEntreprise: r.Client_entreprise ? {
          ...r.Client_entreprise,
          voitures: r.Client_entreprise.Voiture,
        } : null,
        voitures_souhaitees: r.Voiture,
        rapportRendezVous: r.RapportRendezVous,
      };
    });

    return { success: true, data: serializedRendezVous };
  } catch (error) {
    console.error("Error fetching rendez-vous by user:", error);
    return { success: false, error: "Failed to fetch appointments" };
  }
}

export async function updateRendezVous(
  id: string,
  data: {
    date?: Date;
    duree?: string;
    resume_rendez_vous?: string;
    note?: string;
    statut?: "EN_ATTENTE" | "CONFIRME" | "DEPLACE" | "EFFECTUE" | "ANNULE";
  },
) {
  try {
    const { duree, ...validData } = data;
    void duree;
    const rendezVous = await prisma.rendezVous.update({
      where: { id },
      data: {
        ...validData,
        updatedAt: new Date(),
      },
      include: { client: true },
    });

    revalidatePath("/commercial/programme");
    return { success: true, data: rendezVous };
  } catch (error) {
    console.error("Error updating rendez-vous:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    const msg =
      errMsg.includes("Record to update not found")
        ? "Rendez-vous introuvable."
        : errMsg.includes("connect") || errMsg.includes("database")
          ? "Impossible de joindre la base de données. Réessayez plus tard."
          : `Erreur : ${errMsg}`;
    return { success: false, error: msg };
  }
}

export async function deleteRendezVous(id: string) {
  try {
    await prisma.rendezVous.delete({
      where: { id },
    });

    revalidatePath("/commercial/programme");
    return { success: true };
  } catch (error) {
    console.error("Error deleting rendez-vous:", error);
    return { success: false, error: "Failed to delete appointment" };
  }
}

export async function getFavorableClientsWithConfirmedAppointments(
  clerkUserId: string,
) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const clients = await prisma.client.findMany({
      where: {
        status_client: "FAVORABLE",
        userId: user.id,
      },
      include: {
        rendezVous: {
          where: { statut: "CONFIRME" },
          orderBy: { date: "desc" },
        },
      },
    });

    // Remap for frontend compatibility
    const serializedClients = (clients as unknown[]).map((client: unknown) => {
      const c = client as Record<string, unknown> & { rendezVous?: unknown };
      return {
        ...c,
        rendez_vous: c.rendezVous,
      };
    });

    return { success: true, data: serializedClients };
  } catch (error) {
    console.error("Error fetching favorable clients:", error);
    return { success: false, error: "Failed to fetch data" };
  }
}

export async function getClientsByUser(clerkUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { nom: "asc" },
    });

    return { success: true, data: clients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Failed to fetch clients" };
  }
}

export async function getClientEntreprisesByUser(clerkUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const clientEntreprises = await prisma.client_entreprise.findMany({
      where: { userId: user.id },
      orderBy: { nom_entreprise: "asc" },
    });

    return { success: true, data: clientEntreprises };
  } catch (error) {
    console.error("Error fetching client entreprises:", error);
    return { success: false, error: "Failed to fetch client entreprises" };
  }
}

export async function createRapportRendezVous(
  rendezVousId: string,
  voitureIds: string[],
) {
  try {
    const rendezVous = await prisma.rendezVous.findUnique({
      where: { id: rendezVousId },
      include: { client: true, Client_entreprise: true },
    });

    if (!rendezVous) {
      return { success: false, error: "Rendez-vous not found" };
    }

    if (!voitureIds.length) {
      return { success: false, error: "At least one voiture must be selected" };
    }

    const clientInfo = rendezVous.client || ((rendezVous as unknown) as { Client_entreprise: Record<string, unknown> & { telephone: string } }).Client_entreprise;
    if (!clientInfo) {
      return { success: false, error: "Client information not found" };
    }

    const clientName = rendezVous.client
      ? rendezVous.client.nom
      : ((rendezVous as unknown) as { Client_entreprise?: { nom_entreprise: string } }).Client_entreprise?.nom_entreprise || "Non spécifié";

    const clientPhone = clientInfo.telephone;
    const clientType = rendezVous.client ? "Particulier" : "Entreprise";

    // Create a rapport for each selected voiture
    const rapports = await Promise.all(
      voitureIds.map(async (voitureId) => {
        return await prisma.rapportRendezVous.create({
          data: {
            id: crypto.randomUUID(),
            date_rendez_vous: rendezVous.date,
            heure_rendez_vous: new Date(rendezVous.date).toLocaleTimeString(
              "fr-FR",
              { hour: "2-digit", minute: "2-digit" },
            ),
            lieu_rendez_vous: "Concession",
            conseiller_commercial: "Commercial",
            duree_rendez_vous: "30 min",
            nom_prenom_client: clientName,
            telephone_client: clientPhone,
            type_client: clientType,
            rendezVousId,
            clientId: rendezVous.clientId,
            clientEntrepriseId: rendezVous.clientEntrepriseId,
            voitureId,
            updatedAt: new Date(),
          },
        });
      }),
    );

    revalidatePath("/commercial/programme");
    revalidatePath("/commercial/rapport-rendez-vous");
    revalidatePath("/responsablecommercial/rapport-rendez-vous");
    return { success: true, data: rapports };
  } catch (error) {
    console.error("Error creating rapport rendez-vous:", error);
    return { success: false, error: "Failed to create appointment report" };
  }
}

export async function createRapportRendezVousComplet(data: {
  rendezVousId: string;
  clientId?: string;
  clientEntrepriseId?: string;
  date_rendez_vous: string;
  heure_rendez_vous: string;
  lieu_rendez_vous: string;
  lieu_autre?: string;
  conseiller_commercial: string;
  duree_rendez_vous: string;
  nom_prenom_client: string;
  telephone_client: string;
  email_client?: string;
  profession_societe?: string;
  type_client: string;
  Com_Pres: boolean;
  Com_Drive: boolean;
  Com_Achat: boolean;
  Com_Livre: boolean;
  Com_APV: boolean;
  Com_Office: boolean;
  Com_Close: boolean;
  objet_autre?: string;
  modeles_discutes?: unknown;
  motivations_achat?: string;
  points_positifs?: string;
  objections_freins?: string;
  degre_interet?: string;
  decision_attendue?: string;
  devis_offre_remise: boolean;
  propositions_faites?: string;
  reference_offre?: string;
  financement_propose?: string;
  assurance_entretien: boolean;
  reprise_ancien_vehicule: boolean;
  suivi_actions?: string;
  actions_suivi?: unknown;
  commentaire_global?: string;
}) {
  try {
    const dateRendezVous =
      typeof data.date_rendez_vous === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(data.date_rendez_vous)
        ? (() => {
            const [y, m, d] = data.date_rendez_vous.split("-").map(Number);
            return new Date(y, m - 1, d);
          })()
        : new Date(data.date_rendez_vous);

    const rapport = await prisma.rapportRendezVous.create({
      data: {
        id: crypto.randomUUID(),
        rendezVousId: data.rendezVousId,
        clientId: data.clientId || undefined,
        clientEntrepriseId: data.clientEntrepriseId || undefined,
        date_rendez_vous: dateRendezVous,
        heure_rendez_vous: data.heure_rendez_vous || "00:00",
        lieu_rendez_vous: data.lieu_rendez_vous || "Showroom",
        lieu_autre: data.lieu_autre || undefined,
        conseiller_commercial: data.conseiller_commercial || "Non renseigné",
        duree_rendez_vous: data.duree_rendez_vous || "0",
        nom_prenom_client: data.nom_prenom_client || "Non renseigné",
        telephone_client: data.telephone_client || "Non renseigné",
        email_client: data.email_client,
        profession_societe: data.profession_societe,
        type_client: data.type_client || "Particulier",
        Com_Pres: data.Com_Pres ?? false,
        Com_Drive: data.Com_Drive ?? false,
        Com_Achat: data.Com_Achat ?? false,
        Com_Livre: data.Com_Livre ?? false,
        Com_APV: data.Com_APV ?? false,
        Com_Office: data.Com_Office ?? false,
        Com_Close: data.Com_Close ?? false,
        objet_autre: data.objet_autre,
        modeles_discutes: toStoredString(data.modeles_discutes),
        motivations_achat: data.motivations_achat,
        points_positifs: data.points_positifs,
        objections_freins: data.objections_freins,
        degre_interet: data.degre_interet,
        decision_attendue: data.decision_attendue,
        devis_offre_remise: data.devis_offre_remise ?? false,
        propositions_faites: data.propositions_faites,
        reference_offre: data.reference_offre,
        financement_propose: data.financement_propose,
        assurance_entretien: data.assurance_entretien ?? false,
        reprise_ancien_vehicule: data.reprise_ancien_vehicule ?? false,
        suivi_actions: data.suivi_actions,
        actions_suivi: toStoredString(data.actions_suivi),
        commentaire_global: data.commentaire_global,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/commercial/rapport-rendez-vous");
    revalidatePath("/responsablecommercial/rapport-rendez-vous");
    return { success: true, data: rapport };
  } catch (error) {
    console.error("Error creating complete rapport rendez-vous:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    const prismaCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: string }).code
        : undefined;
    return {
      success: false,
      error: prismaCode
        ? `Erreur base de données (${prismaCode}): ${message}`
        : message || "Failed to create complete appointment report",
    };
  }
}

export async function getRapportRendezVousByUser(clerkUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const rapports = await prisma.rapportRendezVous.findMany({
      where: {
        OR: [
          {
            Client: {
              userId: user.id,
            },
          },
          {
            Client_entreprise: {
              userId: user.id,
            },
          },
        ],
      },
      include: {
        Client: true,
        Client_entreprise: true,
        RendezVous: true,
        Voiture: {
          select: {
            id: true,
            VoitureModel: {
              select: {
                model: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remap for frontend compatibility
    const serializedRapports = (rapports as unknown[]).map((rapport: unknown) => {
      const r = rapport as Record<string, unknown> & {
        Client?: unknown;
        Client_entreprise?: unknown;
        RendezVous?: unknown;
        Voiture?: Record<string, unknown> & { VoitureModel?: unknown };
      };
      return {
        ...r,
        client: r.Client,
        clientEntreprise: r.Client_entreprise,
        rendezVous: r.RendezVous,
        voiture: r.Voiture ? {
          ...r.Voiture,
          voitureModel: r.Voiture.VoitureModel,
        } : null,
      };
    });

    return { success: true, data: serializedRapports };
  } catch (error) {
    console.error("Error fetching rapport rendez-vous by user:", error);
    return { success: false, error: "Failed to fetch appointment reports" };
  }
}

export async function updateRapportRendezVousComplet(
  rapportId: string,
  data: {
    date_rendez_vous?: string;
    heure_rendez_vous?: string;
    lieu_rendez_vous?: string;
    lieu_autre?: string;
    conseiller_commercial?: string;
    duree_rendez_vous?: string;
    nom_prenom_client?: string;
    telephone_client?: string;
    email_client?: string;
    profession_societe?: string;
    type_client?: string;
    Com_Pres?: boolean;
    Com_Drive?: boolean;
    Com_Achat?: boolean;
    Com_Livre?: boolean;
    Com_APV?: boolean;
    Com_Office?: boolean;
    Com_Close?: boolean;
    objet_autre?: string;
    modeles_discutes?: unknown;
    motivations_achat?: string;
    points_positifs?: string;
    objections_freins?: string;
    degre_interet?: string;
    decision_attendue?: string;
    devis_offre_remise?: boolean;
    propositions_faites?: string;
    reference_offre?: string;
    financement_propose?: string;
    assurance_entretien?: boolean;
    reprise_ancien_vehicule?: boolean;
    suivi_actions?: string;
    actions_suivi?: unknown;
    commentaire_global?: string;
  },
) {
  try {
    const updateData: Prisma.RapportRendezVousUpdateInput = {};

    if (data.date_rendez_vous) {
      updateData.date_rendez_vous = new Date(data.date_rendez_vous);
    }
    if (data.heure_rendez_vous !== undefined)
      updateData.heure_rendez_vous = data.heure_rendez_vous;
    if (data.lieu_rendez_vous !== undefined)
      updateData.lieu_rendez_vous = data.lieu_rendez_vous;
    if (data.lieu_autre !== undefined) updateData.lieu_autre = data.lieu_autre;
    if (data.conseiller_commercial !== undefined)
      updateData.conseiller_commercial = data.conseiller_commercial;
    if (data.duree_rendez_vous !== undefined)
      updateData.duree_rendez_vous = data.duree_rendez_vous;
    if (data.nom_prenom_client !== undefined)
      updateData.nom_prenom_client = data.nom_prenom_client;
    if (data.telephone_client !== undefined)
      updateData.telephone_client = data.telephone_client;
    if (data.email_client !== undefined)
      updateData.email_client = data.email_client;
    if (data.profession_societe !== undefined)
      updateData.profession_societe = data.profession_societe;
    if (data.type_client !== undefined)
      updateData.type_client = data.type_client;
    if (data.Com_Pres !== undefined)
      updateData.Com_Pres = data.Com_Pres;
    if (data.Com_Drive !== undefined)
      updateData.Com_Drive = data.Com_Drive;
    if (data.Com_Achat !== undefined)
      updateData.Com_Achat = data.Com_Achat;
    if (data.Com_Livre !== undefined)
      updateData.Com_Livre = data.Com_Livre;
    if (data.Com_APV !== undefined)
      updateData.Com_APV = data.Com_APV;
    if (data.Com_Office !== undefined)
      updateData.Com_Office = data.Com_Office;
    if (data.Com_Close !== undefined)
      updateData.Com_Close = data.Com_Close;
    if (data.objet_autre !== undefined)
      updateData.objet_autre = data.objet_autre;
    if (data.modeles_discutes !== undefined)
      updateData.modeles_discutes = toStoredString(data.modeles_discutes);
    if (data.motivations_achat !== undefined)
      updateData.motivations_achat = data.motivations_achat;
    if (data.points_positifs !== undefined)
      updateData.points_positifs = data.points_positifs;
    if (data.objections_freins !== undefined)
      updateData.objections_freins = data.objections_freins;
    if (data.degre_interet !== undefined)
      updateData.degre_interet = data.degre_interet;
    if (data.decision_attendue !== undefined)
      updateData.decision_attendue = data.decision_attendue;
    if (data.devis_offre_remise !== undefined)
      updateData.devis_offre_remise = data.devis_offre_remise;
    if (data.propositions_faites !== undefined)
      updateData.propositions_faites = data.propositions_faites;
    if (data.reference_offre !== undefined)
      updateData.reference_offre = data.reference_offre;
    if (data.financement_propose !== undefined)
      updateData.financement_propose = data.financement_propose;
    if (data.assurance_entretien !== undefined)
      updateData.assurance_entretien = data.assurance_entretien;
    if (data.reprise_ancien_vehicule !== undefined)
      updateData.reprise_ancien_vehicule = data.reprise_ancien_vehicule;
    if (data.suivi_actions !== undefined)
      updateData.suivi_actions = data.suivi_actions;
    if (data.actions_suivi !== undefined)
      updateData.actions_suivi = toStoredString(data.actions_suivi);
    if (data.commentaire_global !== undefined)
      updateData.commentaire_global = data.commentaire_global;

    updateData.updatedAt = new Date();

    const rapport = await prisma.rapportRendezVous.update({
      where: { id: rapportId },
      data: updateData,
    });

    revalidatePath("/commercial/suivi-rendez-vous");
    revalidatePath("/commercial/rapport-rendez-vous");
    revalidatePath("/responsablecommercial/rapport-rendez-vous");
    return { success: true, data: rapport };
  } catch (error) {
    console.error("Error updating complete rapport rendez-vous:", error);
    return { success: false, error: "Failed to update appointment report" };
  }
}

export async function getAllRapportRendezVous() {
  try {
    const rapports = await prisma.rapportRendezVous.findMany({
      include: {
        Client: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        Client_entreprise: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        RendezVous: {
          select: {
            id: true,
            date: true,
            statut: true,
          },
        },
        Voiture: {
          select: {
            id: true,
            couleur: true,
            motorisation: true,
            transmission: true,
            VoitureModel: {
              select: {
                model: true,
              },
            },
          },
        },
      },
      orderBy: {
        date_rendez_vous: "desc",
      },
    });

    // Remap for frontend compatibility
    const serializedRapports = (rapports as unknown[]).map((rapport: unknown) => {
      const r = rapport as Record<string, unknown> & {
        Client?: Record<string, unknown> & { User?: unknown };
        Client_entreprise?: Record<string, unknown> & { User?: unknown };
        RendezVous?: unknown;
        Voiture?: Record<string, unknown> & { VoitureModel?: unknown };
      };
      return {
        ...r,
        client: r.Client ? {
          ...r.Client,
          user: r.Client.User,
        } : null,
        clientEntreprise: r.Client_entreprise ? {
          ...r.Client_entreprise,
          user: r.Client_entreprise.User,
        } : null,
        rendezVous: r.RendezVous,
        voiture: r.Voiture ? {
          ...r.Voiture,
          voitureModel: r.Voiture.VoitureModel,
        } : null,
      };
    });

    return { success: true, data: serializedRapports };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Error fetching all rapport rendez-vous:", error);

    // User-friendly message for connection issues (e.g. Neon DB asleep or unreachable)
    if (
      message.includes("Can't reach database server") ||
      message.includes("connection") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT") ||
      message.includes("connect")
    ) {
      return {
        success: false,
        error:
          "La base de données est temporairement indisponible. Vérifiez votre connexion ou réessayez dans quelques instants (base Neon peut être en veille).",
      };
    }

    return { success: false, error: "Impossible de charger les rapports de rendez-vous." };
  }
}

/**
 * All appointment reports created for clients owned by users with role COMMERCIAL.
 * Grouped by the commercial user.
 */
export async function getRapportRendezVousByCommercialUsers() {
  try {
    const rapports = await prisma.rapportRendezVous.findMany({
      where: {
        OR: [
          { Client: { User: { role: "COMMERCIAL" } } },
          { Client_entreprise: { User: { role: "COMMERCIAL" } } },
        ],
      },
      include: {
        Client: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        Client_entreprise: {
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        RendezVous: {
          select: {
            id: true,
            date: true,
            statut: true,
          },
        },
        Voiture: {
          select: {
            id: true,
            couleur: true,
            motorisation: true,
            transmission: true,
            VoitureModel: {
              select: { model: true },
            },
          },
        },
      },
      orderBy: {
        date_rendez_vous: "desc",
      },
    });

    type CommercialUser = {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };

    type SerializedRapport = {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      date_rendez_vous: Date;
      heure_rendez_vous: string;
      lieu_rendez_vous: string;
      lieu_autre: string | null;
      conseiller_commercial: string;
      duree_rendez_vous: string;
      nom_prenom_client: string;
      telephone_client: string;
      email_client: string | null;
      profession_societe: string | null;
      type_client: string;
      Com_Pres: boolean;
      Com_Drive: boolean;
      Com_Achat: boolean;
      Com_Livre: boolean;
      Com_APV: boolean;
      Com_Office: boolean;
      Com_Close: boolean;
      objet_autre: string | null;
      modeles_discutes: unknown;
      motivations_achat: string | null;
      points_positifs: string | null;
      objections_freins: string | null;
      degre_interet: string | null;
      decision_attendue: string | null;
      devis_offre_remise: boolean;
      propositions_faites: string | null;
      reference_offre: string | null;
      financement_propose: string | null;
      assurance_entretien: boolean;
      reprise_ancien_vehicule: boolean;
      suivi_actions: string | null;
      actions_suivi: unknown;
      commentaire_global: string | null;
      commercialUser: CommercialUser | null;
      client: unknown;
      clientEntreprise: unknown;
      rendezVous: unknown;
      voiture: {
        id: string;
        couleur?: string | null;
        motorisation?: string | null;
        transmission?: string | null;
        voitureModel?: { model: string } | null;
      } | null;
    };

    const serializedRapports: SerializedRapport[] = rapports.map((r) => {
      const commercialUser =
        r.Client?.User?.role === "COMMERCIAL"
          ? r.Client.User
          : r.Client_entreprise?.User?.role === "COMMERCIAL"
            ? r.Client_entreprise.User
            : null;

      return {
        id: r.id,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        date_rendez_vous: r.date_rendez_vous,
        heure_rendez_vous: r.heure_rendez_vous,
        lieu_rendez_vous: r.lieu_rendez_vous,
        lieu_autre: r.lieu_autre,
        conseiller_commercial: r.conseiller_commercial,
        duree_rendez_vous: r.duree_rendez_vous,
        nom_prenom_client: r.nom_prenom_client,
        telephone_client: r.telephone_client,
        email_client: r.email_client,
        profession_societe: r.profession_societe,
        type_client: r.type_client,
        Com_Pres: r.Com_Pres,
        Com_Drive: r.Com_Drive,
        Com_Achat: r.Com_Achat,
        Com_Livre: r.Com_Livre,
        Com_APV: r.Com_APV,
        Com_Office: r.Com_Office,
        Com_Close: r.Com_Close,
        objet_autre: r.objet_autre,
        modeles_discutes: r.modeles_discutes,
        motivations_achat: r.motivations_achat,
        points_positifs: r.points_positifs,
        objections_freins: r.objections_freins,
        degre_interet: r.degre_interet,
        decision_attendue: r.decision_attendue,
        devis_offre_remise: r.devis_offre_remise,
        propositions_faites: r.propositions_faites,
        reference_offre: r.reference_offre,
        financement_propose: r.financement_propose,
        assurance_entretien: r.assurance_entretien,
        reprise_ancien_vehicule: r.reprise_ancien_vehicule,
        suivi_actions: r.suivi_actions,
        actions_suivi: r.actions_suivi,
        commentaire_global: r.commentaire_global,
        commercialUser,
        client: r.Client
          ? {
              ...r.Client,
              user: r.Client.User,
            }
          : null,
        clientEntreprise: r.Client_entreprise
          ? {
              ...r.Client_entreprise,
              user: r.Client_entreprise.User,
            }
          : null,
        rendezVous: r.RendezVous,
        voiture: r.Voiture
          ? {
              id: r.Voiture.id,
              couleur: r.Voiture.couleur,
              motorisation: r.Voiture.motorisation,
              transmission: r.Voiture.transmission,
              voitureModel: r.Voiture.VoitureModel,
            }
          : null,
      };
    });

    const grouped = new Map<
      string,
      {
        conseiller_commercial: string;
        totalReports: number;
        reports: SerializedRapport[];
      }
    >();

    for (const rapport of serializedRapports) {
      const user = rapport.commercialUser;
      const groupKey = user
        ? user.id
        : rapport.conseiller_commercial || "non-assigne";
      const displayName = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : rapport.conseiller_commercial || "Non assigné";

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          conseiller_commercial: displayName,
          totalReports: 0,
          reports: [],
        });
      }

      grouped.get(groupKey)!.reports.push(rapport);
    }

    const reportsByUser = Array.from(grouped.values())
      .map((group) => ({
        ...group,
        totalReports: group.reports.length,
        reports: group.reports.sort(
          (a, b) =>
            new Date(b.date_rendez_vous).getTime() -
            new Date(a.date_rendez_vous).getTime()
        ),
      }))
      .sort((a, b) =>
        a.conseiller_commercial.localeCompare(b.conseiller_commercial, "fr")
      );

    return {
      success: true,
      data: {
        totalReports: serializedRapports.length,
        totalCommercials: reportsByUser.length,
        reportsByUser,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Error fetching commercial rapport rendez-vous:", error);

    if (
      message.includes("Can't reach database server") ||
      message.includes("connection") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT") ||
      message.includes("connect")
    ) {
      return {
        success: false,
        error:
          "La base de données est temporairement indisponible. Vérifiez votre connexion ou réessayez dans quelques instants.",
      };
    }

    return {
      success: false,
      error: "Impossible de charger les rapports de rendez-vous des commerciaux.",
    };
  }
}
