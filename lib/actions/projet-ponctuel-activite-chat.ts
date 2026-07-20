"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { TypeMessageProjetPonctuelActivite } from "@prisma/client";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";
import type { StatutProjetPonctuelActivite } from "../projet-ponctuel-activite-statut";

const PROJETS_PONCTUELS_HREF = "/communication/projets-ponctuels";
const PROJETS_PONCTUELS_PATH = "/communication/projets-ponctuels";
const DESIGNER_PROJET_PONCTUEL_PATH = "/designer/projet-ponctuel";

export type ActiviteChatMessageItem = {
  id: string;
  content: string;
  createdAt: string;
  typeMessage: TypeMessageProjetPonctuelActivite;
  senderId: string;
  sender: { id: string; firstName: string; lastName: string; email: string };
};

export type ActiviteChatThread = {
  activiteId: string;
  activiteTitre: string;
  creator: { id: string; firstName: string; lastName: string; email: string };
  responsables: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  currentUserId: string;
  messages: ActiviteChatMessageItem[];
};

async function resolveClerkUserId(clerkUserId?: string) {
  if (clerkUserId) return clerkUserId;
  const authResult = await auth();
  if (authResult?.userId) return authResult.userId;
  const clerkUser = await currentUser();
  return clerkUser?.id;
}

function serializeMessage(row: {
  id: string;
  message: string;
  createdAt: Date;
  typeMessage: TypeMessageProjetPonctuelActivite;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}): ActiviteChatMessageItem {
  return {
    id: row.id,
    content: row.message,
    createdAt: row.createdAt.toISOString(),
    typeMessage: row.typeMessage,
    senderId: row.userId,
    sender: row.user,
  };
}

const messageInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

export async function getActiviteChatThread(
  activiteId: string,
  clerkUserId?: string
): Promise<
  | { success: true; thread: ActiviteChatThread }
  | { success: false; error: string }
> {
  if (!activiteId) {
    return { success: false, error: "Activité introuvable." };
  }

  const clerkId = await resolveClerkUserId(clerkUserId);
  if (!clerkId) {
    return { success: false, error: "Utilisateur non authentifié." };
  }

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { success: false, error: userResult.error ?? "Utilisateur introuvable." };
  }

  try {
    const activite = await prisma.projetPonctuelActivite.findUnique({
      where: { id: activiteId },
      select: {
        id: true,
        titre: true,
        userId: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        responsableResponsable: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!activite) {
      return { success: false, error: "Activité introuvable." };
    }

    const currentUserId = userResult.data.id;
    const creatorId = activite.userId;

    const rows = await prisma.projetPonctuelActiviteMessage.findMany({
      where: {
        projetPonctuelActiviteId: activiteId,
        typeMessage: { not: "SUPPRIME" },
      },
      include: messageInclude,
      orderBy: { createdAt: "asc" },
    });

    if (currentUserId === creatorId) {
      await prisma.projetPonctuelActiviteMessage.updateMany({
        where: {
          projetPonctuelActiviteId: activiteId,
          typeMessage: "NON_LU",
          userId: { not: creatorId },
        },
        data: { typeMessage: "LU" },
      });
    }

    return {
      success: true,
      thread: {
        activiteId: activite.id,
        activiteTitre: activite.titre,
        creator: activite.user,
        responsables: activite.responsableResponsable.map((r) => r.user),
        currentUserId,
        messages: rows.map(serializeMessage),
      },
    };
  } catch (error) {
    console.error("getActiviteChatThread error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement du chat.",
    };
  }
}

export async function sendActiviteChatMessage(
  activiteId: string,
  content: string,
  clerkUserId?: string
): Promise<
  | {
      success: true;
      message: ActiviteChatMessageItem;
      statutActivite: StatutProjetPonctuelActivite;
    }
  | { success: false; error: string }
> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: "Le message ne peut pas être vide." };
  }
  if (!activiteId) {
    return { success: false, error: "Activité introuvable." };
  }

  const clerkId = await resolveClerkUserId(clerkUserId);
  if (!clerkId) {
    return { success: false, error: "Utilisateur non authentifié." };
  }

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { success: false, error: userResult.error ?? "Utilisateur introuvable." };
  }

  try {
    const activite = await prisma.projetPonctuelActivite.findUnique({
      where: { id: activiteId },
      select: { id: true, userId: true, titre: true, statutActivite: true },
    });

    if (!activite) {
      return { success: false, error: "Activité introuvable." };
    }

    const senderId = userResult.data.id;
    const creatorId = activite.userId;
    const isCreator = senderId === creatorId;

    if (isCreator) {
      const responsables = await prisma.projetPonctuelResponsable.findMany({
        where: { projetPonctuelActiviteId: activiteId },
        select: { userId: true },
      });
      if (responsables.length === 0) {
        return {
          success: false,
          error: "Aucun responsable assigné — impossible d'envoyer un message.",
        };
      }
    }

    const typeMessage: TypeMessageProjetPonctuelActivite = isCreator ? "REPONDU" : "NON_LU";

    const row = await prisma.projetPonctuelActiviteMessage.create({
      data: {
        message: trimmed,
        typeMessage,
        userId: senderId,
        projetPonctuelActiviteId: activiteId,
      },
      include: messageInclude,
    });

    let statutActivite = activite.statutActivite as StatutProjetPonctuelActivite;

    if (!isCreator && statutActivite === "EN_ATTENTE") {
      const updated = await prisma.projetPonctuelActivite.update({
        where: { id: activiteId },
        data: { statutActivite: "EN_ATTENTE_VALIDATION" },
        select: { statutActivite: true },
      });
      statutActivite = updated.statutActivite as StatutProjetPonctuelActivite;
      revalidatePath(PROJETS_PONCTUELS_PATH);
      revalidatePath(DESIGNER_PROJET_PONCTUEL_PATH);
    }

    if (!isCreator) {
      const preview = trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
      await prisma.notification.create({
        data: {
          type: "MESSAGE",
          title: `Nouveau message · ${activite.titre}`,
          message: preview,
          href: PROJETS_PONCTUELS_HREF,
          senderId,
          receiverId: creatorId,
          read: false,
        },
      });
    }

    return { success: true, message: serializeMessage(row), statutActivite };
  } catch (error) {
    console.error("sendActiviteChatMessage error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'envoi du message.",
    };
  }
}

export async function getActiviteChatUnreadMap(
  activiteIds: string[],
  clerkUserId?: string
): Promise<Record<string, boolean>> {
  const empty = Object.fromEntries(activiteIds.map((id) => [id, false]));
  if (activiteIds.length === 0) return empty;

  const clerkId = await resolveClerkUserId(clerkUserId);
  if (!clerkId) return empty;

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) return empty;

  const currentUserId = userResult.data.id;

  try {
    const unreadMessages = await prisma.projetPonctuelActiviteMessage.findMany({
      where: {
        projetPonctuelActiviteId: { in: activiteIds },
        typeMessage: "NON_LU",
        userId: { not: currentUserId },
        projetPonctuelActivite: { userId: currentUserId },
      },
      select: { projetPonctuelActiviteId: true },
      distinct: ["projetPonctuelActiviteId"],
    });

    const unreadSet = new Set(unreadMessages.map((m) => m.projetPonctuelActiviteId));
    return Object.fromEntries(activiteIds.map((id) => [id, unreadSet.has(id)]));
  } catch (error) {
    console.error("getActiviteChatUnreadMap error:", error);
    return empty;
  }
}

export async function getEnAttenteChatPromptActiviteIds(
  activiteIds: string[],
  clerkUserId?: string
): Promise<string[]> {
  if (activiteIds.length === 0) return [];

  const clerkId = await resolveClerkUserId(clerkUserId);
  if (!clerkId) return [];

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) return [];

  const currentUserId = userResult.data.id;

  try {
    const activites = await prisma.projetPonctuelActivite.findMany({
      where: {
        id: { in: activiteIds },
        statutActivite: "EN_ATTENTE",
        userId: { not: currentUserId },
        responsableResponsable: { some: { userId: currentUserId } },
      },
      select: { id: true },
    });

    if (activites.length === 0) return [];

    const candidateIds = activites.map((a) => a.id);

    const replied = await prisma.projetPonctuelActiviteMessage.findMany({
      where: {
        projetPonctuelActiviteId: { in: candidateIds },
        userId: currentUserId,
        typeMessage: { not: "SUPPRIME" },
      },
      select: { projetPonctuelActiviteId: true },
      distinct: ["projetPonctuelActiviteId"],
    });

    const repliedSet = new Set(replied.map((r) => r.projetPonctuelActiviteId));
    return candidateIds.filter((id) => !repliedSet.has(id));
  } catch (error) {
    console.error("getEnAttenteChatPromptActiviteIds error:", error);
    return [];
  }
}
