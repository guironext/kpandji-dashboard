"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma, executeWithRetry } from "../prisma";
import { getOrCreateUser } from "./user";
import {
  validateActiviteDatesInProjetRange,
  type ProjetDateBounds,
} from "../projet-ponctuel-dates";
import {
  isStatutProjetPonctuelActivite,
  type StatutProjetPonctuelActivite,
} from "../projet-ponctuel-activite-statut";
import {
  tryCompleteProjetIfAllActivitesTerminees,
  type ProjetPonctuelListItem,
} from "./projet-ponctuel";

const PROJETS_PONCTUELS_PATH = "/communication/projets-ponctuels";
const DESIGNER_PROJET_PONCTUEL_PATH = "/designer/projet-ponctuel";
const COMMUNITY_MANAGER_PROJET_PONCTUEL_PATH = "/communityManager/projet-ponctuel";
const INFOGRAPHIE_PROJET_PONCTUEL_PATH = "/infographie/projet-ponctuel";
const MARKETING_PROJET_PONCTUEL_PATH = "/marketing";

/** Responsable added well after activity creation → likely a transfer/reassignment */
const TRANSFER_ASSIGNMENT_THRESHOLD_MS = 30_000;

export type ProjetPonctuelActiviteInput = {
  projetPonctuelId: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateCloture?: string | null;
  responsableUserIds?: string[];
};

export type ProjetPonctuelResponsableItem = {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type ProjetPonctuelActiviteItem = {
  id: string;
  projetPonctuelId: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateCloture: string | null;
  statutActivite: StatutProjetPonctuelActivite;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  responsables: ProjetPonctuelResponsableItem[];
};

export type ProjetPonctuelActiviteWithProjetItem = ProjetPonctuelActiviteItem & {
  projet: { id: string; titre: string };
  isTransferred?: boolean;
};

export type { StatutProjetPonctuelActivite, ProjetPonctuelListItem };

async function maybeCompleteProjet(projetPonctuelId: string) {
  return tryCompleteProjetIfAllActivitesTerminees(projetPonctuelId);
}

function revalidatePaths() {
  try {
    revalidatePath(PROJETS_PONCTUELS_PATH);
    revalidatePath(DESIGNER_PROJET_PONCTUEL_PATH);
    revalidatePath(COMMUNITY_MANAGER_PROJET_PONCTUEL_PATH);
    revalidatePath(INFOGRAPHIE_PROJET_PONCTUEL_PATH);
    revalidatePath(MARKETING_PROJET_PONCTUEL_PATH);
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

function parseDates(dateDebut: string, dateCloture?: string | null) {
  const debut = new Date(dateDebut);
  if (Number.isNaN(debut.getTime())) {
    return { error: "La date de début est invalide." as const };
  }

  let cloture: Date | null = null;
  if (dateCloture?.trim()) {
    cloture = new Date(dateCloture);
    if (Number.isNaN(cloture.getTime())) {
      return { error: "La date de clôture est invalide." as const };
    }
    if (cloture < debut) {
      return {
        error: "La date de clôture doit être postérieure à la date de début.",
      } as const;
    }
  }

  return { dateDebut: debut, dateCloture: cloture };
}

function serializeActivite(row: {
  id: string;
  projetPonctuelId: string;
  titre: string;
  description: string;
  dateDebut: Date;
  dateCloture: Date | null;
  statutActivite: StatutProjetPonctuelActivite;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  responsableResponsable: Array<{
    id: string;
    userId: string;
    user: { firstName: string; lastName: string; email: string };
  }>;
}): ProjetPonctuelActiviteItem {
  return {
    id: row.id,
    projetPonctuelId: row.projetPonctuelId,
    titre: row.titre,
    description: row.description,
    dateDebut: row.dateDebut.toISOString(),
    dateCloture: row.dateCloture ? row.dateCloture.toISOString() : null,
    statutActivite: row.statutActivite ?? "NOUVEAU",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
    user: row.user,
    responsables: row.responsableResponsable.map((r) => ({
      id: r.id,
      userId: r.userId,
      user: r.user,
    })),
  };
}

const activiteInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  responsableResponsable: {
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

function isTransferredAssignment(
  activityCreatedAt: Date,
  responsableCreatedAt: Date
): boolean {
  return (
    responsableCreatedAt.getTime() - activityCreatedAt.getTime() >
    TRANSFER_ASSIGNMENT_THRESHOLD_MS
  );
}

function serializeActiviteWithProjet(
  row: {
    id: string;
    projetPonctuelId: string;
    titre: string;
    description: string;
    dateDebut: Date;
    dateCloture: Date | null;
    statutActivite: StatutProjetPonctuelActivite;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: { id: string; firstName: string; lastName: string; email: string };
    responsableResponsable: Array<{
      id: string;
      userId: string;
      createdAt: Date;
      user: { firstName: string; lastName: string; email: string };
    }>;
    projetPonctuel: { id: string; titre: string };
  },
  currentUserId?: string
): ProjetPonctuelActiviteWithProjetItem {
  const myResponsable = currentUserId
    ? row.responsableResponsable.find((r) => r.userId === currentUserId)
    : undefined;

  return {
    ...serializeActivite(row),
    projet: {
      id: row.projetPonctuel.id,
      titre: row.projetPonctuel.titre,
    },
    isTransferred: myResponsable
      ? isTransferredAssignment(row.createdAt, myResponsable.createdAt)
      : false,
  };
}

export async function getActivitesForCurrentResponsable(
  clerkUserId?: string
): Promise<
  | { success: true; activites: ProjetPonctuelActiviteWithProjetItem[] }
  | { success: false; error: string; activites: [] }
> {
  try {
    const clerkId = await resolveClerkUserId(clerkUserId);
    if (!clerkId) {
      return { success: false, error: "Vous devez être connecté.", activites: [] };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error ?? "Utilisateur introuvable.",
        activites: [],
      };
    }

    const rows = await executeWithRetry(() =>
      prisma.projetPonctuelActivite.findMany({
        where: {
          responsableResponsable: {
            some: { userId: userResult.data.id },
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          ...activiteInclude,
          projetPonctuel: { select: { id: true, titre: true } },
        },
      })
    );

    return {
      success: true,
      activites: rows.map((row) =>
        serializeActiviteWithProjet(row, userResult.data.id)
      ),
    };
  } catch (error) {
    console.error("getActivitesForCurrentResponsable error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement.",
      activites: [],
    };
  }
}

export async function getActivitesByProjetId(projetPonctuelId: string): Promise<
  | { success: true; activites: ProjetPonctuelActiviteItem[] }
  | { success: false; error: string; activites: [] }
> {
  if (!projetPonctuelId) {
    return { success: false, error: "Projet introuvable.", activites: [] };
  }

  try {
    const rows = await prisma.projetPonctuelActivite.findMany({
      where: { projetPonctuelId },
      orderBy: { dateDebut: "asc" },
      include: activiteInclude,
    });

    return {
      success: true,
      activites: rows.map(serializeActivite),
    };
  } catch (error) {
    console.error("getActivitesByProjetId error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement.",
      activites: [],
    };
  }
}

export async function createProjetPonctuelActivite(
  data: ProjetPonctuelActiviteInput,
  clerkUserId?: string
): Promise<
  | { success: true; activite: ProjetPonctuelActiviteItem }
  | { success: false; error: string }
> {
  const titre = data.titre?.trim();
  const description = data.description?.trim();

  if (!data.projetPonctuelId) {
    return { success: false, error: "Veuillez sélectionner un projet." };
  }
  if (!titre) {
    return { success: false, error: "Le titre de l'activité est obligatoire." };
  }
  if (!description) {
    return { success: false, error: "La description de l'activité est obligatoire." };
  }
  if (!data.dateDebut) {
    return { success: false, error: "La date de début est obligatoire." };
  }

  const parsed = parseDates(data.dateDebut, data.dateCloture);
  if ("error" in parsed) {
    return { success: false, error: parsed.error ?? "Erreur de date." };
  }

  const responsableUserIds = [...new Set(data.responsableUserIds ?? [])];

  try {
    const clerkId = await resolveClerkUserId(clerkUserId);
    if (!clerkId) {
      return { success: false, error: "Vous devez être connecté." };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error ?? "Utilisateur introuvable.",
      };
    }

    const projet = await prisma.projetPonctuel.findUnique({
      where: { id: data.projetPonctuelId },
      select: { id: true, dateDebut: true, dateCloture: true },
    });
    if (!projet) {
      return { success: false, error: "Projet introuvable." };
    }

    const projetBounds: ProjetDateBounds = {
      dateDebut: projet.dateDebut.toISOString(),
      dateCloture: projet.dateCloture ? projet.dateCloture.toISOString() : null,
    };
    const rangeError = validateActiviteDatesInProjetRange(
      data.dateDebut,
      data.dateCloture,
      projetBounds
    );
    if (rangeError) {
      return { success: false, error: rangeError };
    }

    if (responsableUserIds.length > 0) {
      const usersCount = await prisma.user.count({
        where: { id: { in: responsableUserIds } },
      });
      if (usersCount !== responsableUserIds.length) {
        return { success: false, error: "Un ou plusieurs responsables sont invalides." };
      }
    }

    const row = await prisma.$transaction(async (tx) => {
      const activite = await tx.projetPonctuelActivite.create({
        data: {
          titre,
          description,
          dateDebut: parsed.dateDebut,
          dateCloture: parsed.dateCloture,
          projetPonctuelId: data.projetPonctuelId,
          userId: userResult.data!.id,
          statutActivite: "NOUVEAU",
        },
      });

      if (responsableUserIds.length > 0) {
        await tx.projetPonctuelResponsable.createMany({
          data: responsableUserIds.map((userId) => ({
            userId,
            projetPonctuelId: data.projetPonctuelId,
            projetPonctuelActiviteId: activite.id,
          })),
        });
      }

      return tx.projetPonctuelActivite.findUniqueOrThrow({
        where: { id: activite.id },
        include: activiteInclude,
      });
    });

    revalidatePaths();
    return { success: true, activite: serializeActivite(row) };
  } catch (error) {
    console.error("createProjetPonctuelActivite error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création.",
    };
  }
}

export async function setActiviteResponsables(
  activiteId: string,
  projetPonctuelId: string,
  responsableUserIds: string[]
): Promise<
  | { success: true; activite: ProjetPonctuelActiviteItem }
  | { success: false; error: string }
> {
  if (!activiteId || !projetPonctuelId) {
    return { success: false, error: "Activité ou projet introuvable." };
  }

  const uniqueUserIds = [...new Set(responsableUserIds)];

  try {
    const activite = await prisma.projetPonctuelActivite.findFirst({
      where: { id: activiteId, projetPonctuelId },
      select: { id: true },
    });
    if (!activite) {
      return { success: false, error: "Activité introuvable." };
    }

    if (uniqueUserIds.length > 0) {
      const usersCount = await prisma.user.count({
        where: { id: { in: uniqueUserIds } },
      });
      if (usersCount !== uniqueUserIds.length) {
        return { success: false, error: "Un ou plusieurs responsables sont invalides." };
      }
    }

    const row = await prisma.$transaction(async (tx) => {
      await tx.projetPonctuelResponsable.deleteMany({
        where: { projetPonctuelActiviteId: activiteId },
      });

      if (uniqueUserIds.length > 0) {
        await tx.projetPonctuelResponsable.createMany({
          data: uniqueUserIds.map((userId) => ({
            userId,
            projetPonctuelId,
            projetPonctuelActiviteId: activiteId,
          })),
        });
      }

      return tx.projetPonctuelActivite.findUniqueOrThrow({
        where: { id: activiteId },
        include: activiteInclude,
      });
    });

    revalidatePaths();
    return { success: true, activite: serializeActivite(row) };
  } catch (error) {
    console.error("setActiviteResponsables error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la mise à jour.",
    };
  }
}

export async function updateActiviteStatut(
  activiteId: string,
  projetPonctuelId: string,
  statutActivite: StatutProjetPonctuelActivite
): Promise<
  | { success: true; activite: ProjetPonctuelActiviteItem; projet: ProjetPonctuelListItem | null }
  | { success: false; error: string }
> {
  if (!activiteId || !projetPonctuelId) {
    return { success: false, error: "Activité ou projet introuvable." };
  }
  if (!isStatutProjetPonctuelActivite(statutActivite)) {
    return { success: false, error: "Statut d'activité invalide." };
  }

  try {
    const existing = await prisma.projetPonctuelActivite.findFirst({
      where: { id: activiteId, projetPonctuelId },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Activité introuvable." };
    }

    const row = await prisma.projetPonctuelActivite.update({
      where: { id: activiteId },
      data: { statutActivite },
      include: activiteInclude,
    });

    revalidatePaths();
    const projet =
      statutActivite === "TERMINEE"
        ? await maybeCompleteProjet(projetPonctuelId)
        : null;
    return { success: true, activite: serializeActivite(row), projet };
  } catch (error) {
    console.error("updateActiviteStatut error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut.",
    };
  }
}

async function getCurrentDbUser(clerkUserId?: string) {
  const clerkId = await resolveClerkUserId(clerkUserId);
  if (!clerkId) return { error: "Vous devez être connecté." as const };

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { error: userResult.error ?? "Utilisateur introuvable." as const };
  }

  return { user: userResult.data };
}

export async function validateActivite(
  activiteId: string,
  projetPonctuelId: string,
  clerkUserId?: string
): Promise<
  | { success: true; activite: ProjetPonctuelActiviteItem }
  | { success: false; error: string }
> {
  if (!activiteId || !projetPonctuelId) {
    return { success: false, error: "Activité ou projet introuvable." };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const existing = await prisma.projetPonctuelActivite.findFirst({
      where: { id: activiteId, projetPonctuelId },
      select: { id: true, statutActivite: true, userId: true },
    });
    if (!existing) {
      return { success: false, error: "Activité introuvable." };
    }
    if (existing.statutActivite !== "EN_ATTENTE_VALIDATION") {
      return {
        success: false,
        error: "Seules les activités en attente de validation peuvent être validées.",
      };
    }

    const isCreator = existing.userId === current.user.id;
    if (!isCreator) {
      return { success: false, error: "Seul le créateur peut valider cette activité." };
    }

    const row = await prisma.projetPonctuelActivite.update({
      where: { id: activiteId },
      data: { statutActivite: "VALIDEE" },
      include: activiteInclude,
    });

    revalidatePaths();
    return { success: true, activite: serializeActivite(row) };
  } catch (error) {
    console.error("validateActivite error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la validation.",
    };
  }
}

export async function transferActiviteToResponsable(
  activiteId: string,
  projetPonctuelId: string,
  newResponsableUserId: string,
  clerkUserId?: string
): Promise<
  | { success: true; activite: ProjetPonctuelActiviteItem }
  | { success: false; error: string }
> {
  if (!activiteId || !projetPonctuelId) {
    return { success: false, error: "Activité ou projet introuvable." };
  }
  if (!newResponsableUserId) {
    return { success: false, error: "Veuillez sélectionner un responsable." };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const existing = await prisma.projetPonctuelActivite.findFirst({
      where: { id: activiteId, projetPonctuelId },
      select: { id: true, statutActivite: true },
    });
    if (!existing) {
      return { success: false, error: "Activité introuvable." };
    }
    if (existing.statutActivite !== "VALIDEE") {
      return {
        success: false,
        error: "Seules les activités validées peuvent être transférées.",
      };
    }

    const isResponsable = await prisma.projetPonctuelResponsable.findFirst({
      where: { projetPonctuelActiviteId: activiteId, userId: current.user.id },
      select: { id: true },
    });
    if (!isResponsable) {
      return { success: false, error: "Seul le responsable actuel peut transférer l'activité." };
    }

    const newUser = await prisma.user.findUnique({
      where: { id: newResponsableUserId },
      select: { id: true },
    });
    if (!newUser) {
      return { success: false, error: "Le responsable sélectionné est invalide." };
    }

    const row = await prisma.$transaction(async (tx) => {
      await tx.projetPonctuelResponsable.deleteMany({
        where: { projetPonctuelActiviteId: activiteId },
      });
      await tx.projetPonctuelResponsable.create({
        data: {
          userId: newResponsableUserId,
          projetPonctuelId,
          projetPonctuelActiviteId: activiteId,
        },
      });
      return tx.projetPonctuelActivite.update({
        where: { id: activiteId },
        data: { statutActivite: "NOUVEAU" },
        include: activiteInclude,
      });
    });

    revalidatePaths();
    return { success: true, activite: serializeActivite(row) };
  } catch (error) {
    console.error("transferActiviteToResponsable error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du transfert.",
    };
  }
}

export async function terminerActivite(
  activiteId: string,
  projetPonctuelId: string,
  clerkUserId?: string
): Promise<
  | { success: true; activite: ProjetPonctuelActiviteItem; projet: ProjetPonctuelListItem | null }
  | { success: false; error: string }
> {
  if (!activiteId || !projetPonctuelId) {
    return { success: false, error: "Activité ou projet introuvable." };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const existing = await prisma.projetPonctuelActivite.findFirst({
      where: { id: activiteId, projetPonctuelId },
      select: { id: true, statutActivite: true },
    });
    if (!existing) {
      return { success: false, error: "Activité introuvable." };
    }
    if (existing.statutActivite !== "VALIDEE") {
      return {
        success: false,
        error: "Seules les activités validées peuvent être terminées.",
      };
    }

    const isResponsable = await prisma.projetPonctuelResponsable.findFirst({
      where: { projetPonctuelActiviteId: activiteId, userId: current.user.id },
      select: { id: true },
    });
    if (!isResponsable) {
      return { success: false, error: "Seul le responsable peut terminer l'activité." };
    }

    const row = await prisma.projetPonctuelActivite.update({
      where: { id: activiteId },
      data: { statutActivite: "TERMINEE" },
      include: activiteInclude,
    });

    revalidatePaths();
    const projet = await maybeCompleteProjet(projetPonctuelId);
    return { success: true, activite: serializeActivite(row), projet };
  } catch (error) {
    console.error("terminerActivite error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la clôture.",
    };
  }
}

export async function deleteProjetPonctuelActivite(
  activiteId: string,
  projetPonctuelId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const activite = await prisma.projetPonctuelActivite.findFirst({
      where: { id: activiteId, projetPonctuelId },
      select: { id: true },
    });
    if (!activite) {
      return { success: false, error: "Activité introuvable." };
    }

    await prisma.projetPonctuelActivite.delete({ where: { id: activiteId } });
    revalidatePaths();
    return { success: true };
  } catch (error) {
    console.error("deleteProjetPonctuelActivite error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la suppression.",
    };
  }
}
