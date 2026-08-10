"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";
import type { StatusFacture } from "@prisma/client";

export type ClientFromFacture = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string;
  commercial: string | null;
  status_client: string;
  type: "client";
};

export type ClientEntrepriseFromFacture = {
  id: string;
  nom_entreprise: string;
  sigle: string | null;
  email: string | null;
  telephone: string;
  commercial: string | null;
  status_client: string;
  type: "client_entreprise";
};

export type ClientsFromFacturesResult = {
  clients: ClientFromFacture[];
  clientEntreprises: ClientEntrepriseFromFacture[];
};

/**
 * Fetches all Client and Client_entreprise from factures, filtered by:
 * - status_facture (optional, can be multiple)
 * - commercial (userId)
 * - objectifPeriod (date_facture within period)
 * For RESPONSABLE_COMMERCIAL / ADMIN only.
 */
export async function getClientsFromFacturesByFilters(params: {
  status_facture?: StatusFacture | StatusFacture[];
  commercialId?: string;
  objectifPeriodId?: string;
}): Promise<{
  success: boolean;
  data?: ClientsFromFacturesResult;
  error?: string;
}> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Non authentifié" };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    const allowedRoles = ["RESPONSABLE_COMMERCIAL", "ADMIN"];
    if (!allowedRoles.includes(userResult.data.role)) {
      return { success: false, error: "Non autorisé" };
    }

    const statuses = params.status_facture
      ? Array.isArray(params.status_facture)
        ? params.status_facture
        : [params.status_facture]
      : undefined;

    let period: { objectif_start: Date; objectif_end: Date } | null = null;
    if (params.objectifPeriodId) {
      const p = await prisma.objectifPeriod.findUnique({
        where: { id: params.objectifPeriodId },
        select: { objectif_start: true, objectif_end: true },
      });
      if (p) period = p;
    }

    const where: {
      status_facture?: { in: StatusFacture[] } | StatusFacture;
      userId?: string;
      date_facture?: { gte: Date; lte: Date };
      OR?: Array<{ clientId: { not: null } } | { clientEntrepriseId: { not: null } }>;
    } = {
      OR: [{ clientId: { not: null } }, { clientEntrepriseId: { not: null } }],
    };

    if (statuses?.length) {
      where.status_facture = statuses.length === 1 ? statuses[0]! : { in: statuses };
    }
    if (params.commercialId) {
      where.userId = params.commercialId;
    }
    if (period) {
      where.date_facture = {
        gte: period.objectif_start,
        lte: period.objectif_end,
      };
    }

    const factures = await prisma.facture.findMany({
      where,
      select: {
        clientId: true,
        clientEntrepriseId: true,
      },
    });

    const clientIds = [...new Set(factures.map((f) => f.clientId).filter(Boolean))] as string[];
    const clientEntrepriseIds = [...new Set(factures.map((f) => f.clientEntrepriseId).filter(Boolean))] as string[];

    const [clientsRaw, clientEntreprisesRaw] = await Promise.all([
      clientIds.length
        ? prisma.client.findMany({
            where: { id: { in: clientIds } },
            select: {
              id: true,
              nom: true,
              email: true,
              telephone: true,
              commercial: true,
              status_client: true,
            },
          })
        : [],
      clientEntrepriseIds.length
        ? prisma.client_entreprise.findMany({
            where: { id: { in: clientEntrepriseIds } },
            select: {
              id: true,
              nom_entreprise: true,
              sigle: true,
              email: true,
              telephone: true,
              commercial: true,
              status_client: true,
            },
          })
        : [],
    ]);

    const clients: ClientFromFacture[] = clientsRaw.map((c) => ({
      id: c.id,
      nom: c.nom,
      email: c.email,
      telephone: c.telephone,
      commercial: c.commercial,
      status_client: c.status_client,
      type: "client" as const,
    }));

    const clientEntreprises: ClientEntrepriseFromFacture[] = clientEntreprisesRaw.map((c) => ({
      id: c.id,
      nom_entreprise: c.nom_entreprise,
      sigle: c.sigle,
      email: c.email,
      telephone: c.telephone,
      commercial: c.commercial,
      status_client: c.status_client,
      type: "client_entreprise" as const,
    }));

    return {
      success: true,
      data: { clients, clientEntreprises },
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching clients from factures:", err.message, err.stack);
    const msg = err.message || "";
    if (msg.includes("P1001") || msg.includes("Can't reach") || msg.includes("connect")) {
      return { success: false, error: "Base de données inaccessible. Vérifiez la connexion." };
    }
    if (msg.includes("P2025") || msg.includes("Record to delete")) {
      return { success: false, error: "Données introuvables ou supprimées." };
    }
    return { success: false, error: `Échec du chargement: ${msg}` };
  }
}
