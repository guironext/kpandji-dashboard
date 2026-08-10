"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { StatutProjetPonctuel } from "@prisma/client";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";

const PROJETS_PONCTUELS_PATH = "/communication/projets-ponctuels";

export type ProjetPonctuelInput = {
  titre: string;
  description: string;
  dateDebut: string;
  dateCloture?: string | null;
  statutProjet?: StatutProjetPonctuel;
};

export type ProjetPonctuelListItem = {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateCloture: string | null;
  statutProjet: StatutProjetPonctuel;
  createdAt: string;
  updatedAt: string;
  user: { firstName: string; lastName: string };
};

function serializeProjet(row: {
  id: string;
  titre: string;
  description: string;
  dateDebut: Date;
  dateCloture: Date | null;
  statutProjet: StatutProjetPonctuel;
  createdAt: Date;
  updatedAt: Date;
  user: { firstName: string; lastName: string };
}): ProjetPonctuelListItem {
  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    dateDebut: row.dateDebut.toISOString(),
    dateCloture: row.dateCloture ? row.dateCloture.toISOString() : null,
    statutProjet: row.statutProjet,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: row.user,
  };
}

function revalidateProjetPonctuelPaths() {
  try {
    revalidatePath(PROJETS_PONCTUELS_PATH);
  } catch {
    // ignore
  }
}

async function resolveClerkUserId(clerkUserId?: string) {
  if (clerkUserId) return clerkUserId;

  const authResult = await auth();
  if (authResult?.userId) return authResult.userId;

  const clerkUser = await currentUser();
  return clerkUser?.id;
}

export async function getProjetPonctuels(): Promise<
  | { success: true; projects: ProjetPonctuelListItem[] }
  | { success: false; error: string; projects: [] }
> {
  try {
    const rows = await prisma.projetPonctuel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      success: true,
      projects: rows.map(serializeProjet),
    };
  } catch (error) {
    console.error("getProjetPonctuels error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement des projets.",
      projects: [],
    };
  }
}

/** When every activity is TERMINEE, mark the project as TERMINEE. */
export async function tryCompleteProjetIfAllActivitesTerminees(
  projetPonctuelId: string
): Promise<ProjetPonctuelListItem | null> {
  if (!projetPonctuelId) return null;

  try {
    const activites = await prisma.projetPonctuelActivite.findMany({
      where: { projetPonctuelId },
      select: { statutActivite: true },
    });

    if (activites.length === 0) return null;
    if (!activites.every((a) => a.statutActivite === "TERMINEE")) return null;

    const existing = await prisma.projetPonctuel.findUnique({
      where: { id: projetPonctuelId },
      select: { statutProjet: true },
    });
    if (!existing) return null;

    if (existing.statutProjet === "TERMINEE") {
      const row = await prisma.projetPonctuel.findUniqueOrThrow({
        where: { id: projetPonctuelId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      return serializeProjet(row);
    }

    const row = await prisma.projetPonctuel.update({
      where: { id: projetPonctuelId },
      data: { statutProjet: "TERMINEE" },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    revalidateProjetPonctuelPaths();
    return serializeProjet(row);
  } catch (error) {
    console.error("tryCompleteProjetIfAllActivitesTerminees error:", error);
    return null;
  }
}

export async function createProjetPonctuel(
  data: ProjetPonctuelInput,
  clerkUserId?: string
): Promise<
  | { success: true; project: ProjetPonctuelListItem }
  | { success: false; error: string }
> {
  const titre = data.titre?.trim();
  const description = data.description?.trim();

  if (!titre) {
    return { success: false, error: "Le titre du projet est obligatoire." };
  }
  if (!description) {
    return { success: false, error: "La description du projet est obligatoire." };
  }
  if (!data.dateDebut) {
    return { success: false, error: "La date de début est obligatoire." };
  }

  const dateDebut = new Date(data.dateDebut);
  if (Number.isNaN(dateDebut.getTime())) {
    return { success: false, error: "La date de début est invalide." };
  }

  let dateCloture: Date | null = null;
  if (data.dateCloture) {
    dateCloture = new Date(data.dateCloture);
    if (Number.isNaN(dateCloture.getTime())) {
      return { success: false, error: "La date de clôture est invalide." };
    }
    if (dateCloture < dateDebut) {
      return {
        success: false,
        error: "La date de clôture doit être postérieure à la date de début.",
      };
    }
  }

  try {
    const clerkId = await resolveClerkUserId(clerkUserId);
    if (!clerkId) {
      return { success: false, error: "Vous devez être connecté pour créer un projet." };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error ?? "Utilisateur introuvable.",
      };
    }

    const row = await prisma.projetPonctuel.create({
      data: {
        titre,
        description,
        dateDebut,
        dateCloture,
        statutProjet: data.statutProjet ?? "EN_ATTENTE",
        userId: userResult.data.id,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    revalidateProjetPonctuelPaths();

    return { success: true, project: serializeProjet(row) };
  } catch (error) {
    console.error("createProjetPonctuel error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création du projet.",
    };
  }
}
