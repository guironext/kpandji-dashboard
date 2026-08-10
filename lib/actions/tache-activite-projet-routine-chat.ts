"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { TypeMessageTacheActiviteProjetRoutine } from "@prisma/client";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";
import type { StatutTacheActiviteProjetRoutine } from "../tache-activite-projet-routine-statut";

const ACTIVITES_ROUTINEES_PATH = "/communication/activites-routinees";
const DESIGNER_PROJET_PERMANENT_PATH = "/designer/projet-permanent";

export type TacheChatMessageItem = {
  id: string;
  content: string;
  createdAt: string;
  typeMessage: TypeMessageTacheActiviteProjetRoutine;
  senderId: string;
  sender: { id: string; firstName: string; lastName: string; email: string };
};

export type TacheChatThread = {
  tacheId: string;
  tacheLibelle: string;
  creator: { id: string; firstName: string; lastName: string; email: string };
  responsables: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  currentUserId: string;
  messages: TacheChatMessageItem[];
};


async function resolveClerkUserId(clerkUserId?: string) {
  if (clerkUserId) return clerkUserId;
  const authResult = await auth();
  if (authResult?.userId) return authResult.userId;
  const clerkUser = await currentUser();
  return clerkUser?.id;
}

function revalidateTacheChatPaths() {
  try {
    revalidatePath(ACTIVITES_ROUTINEES_PATH);
    revalidatePath(DESIGNER_PROJET_PERMANENT_PATH);
  } catch {
    // ignore
  }
}

function serializeMessage(row: {
  id: string;
  message: string;
  createdAt: Date;
  typeMessage: TypeMessageTacheActiviteProjetRoutine;
  responsableProjetRoutine: {
    user: { id: string; firstName: string; lastName: string; email: string };
  };
}): TacheChatMessageItem {
  return {
    id: row.id,
    content: row.message,
    createdAt: row.createdAt.toISOString(),
    typeMessage: row.typeMessage,
    senderId: row.responsableProjetRoutine.user.id,
    sender: row.responsableProjetRoutine.user,
  };
}

const messageInclude = {
  responsableProjetRoutine: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
} as const;

async function resolveSenderResponsableProjetRoutine(
  tacheId: string,
  userId: string,
  roleMissionProjetRoutineId: string,
  creatorUserId: string | null
) {
  const isCreator = creatorUserId === userId;

  if (isCreator) {
    const roleResponsable = await prisma.responsableProjetRoutine.findFirst({
      where: {
        userId,
        roleMissionProjetRoutineId,
        activiteProjetRoutineId: null,
        tacheActiviteProjetRoutineId: null,
      },
      select: { id: true },
    });
    if (roleResponsable) return roleResponsable.id;

    const created = await prisma.responsableProjetRoutine.create({
      data: {
        userId,
        roleMissionProjetRoutineId,
      },
      select: { id: true },
    });
    return created.id;
  }

  const taskResponsable = await prisma.responsableTacheResponsable.findFirst({
    where: { tacheActiviteProjetRoutineId: tacheId, userId },
    select: { id: true },
  });
  if (!taskResponsable) return null;

  const existing = await prisma.responsableProjetRoutine.findFirst({
    where: {
      userId,
      roleMissionProjetRoutineId,
      tacheActiviteProjetRoutineId: tacheId,
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.responsableProjetRoutine.create({
    data: {
      userId,
      roleMissionProjetRoutineId,
      tacheActiviteProjetRoutineId: tacheId,
    },
    select: { id: true },
  });
  return created.id;
}

export async function getTacheChatThread(
  tacheId: string,
  clerkUserId?: string
): Promise<
  | { success: true; thread: TacheChatThread }
  | { success: false; error: string }
> {
  if (!tacheId) {
    return { success: false, error: "Tâche introuvable." };
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
    const tache = await prisma.tacheActiviteProjetRoutine.findUnique({
      where: { id: tacheId },
      select: {
        id: true,
        libelle: true,
        activiteProjetRoutine: {
          select: {
            roleMissionProjetRoutine: {
              select: {
                responsableProjetRoutine: {
                  where: {
                    activiteProjetRoutineId: null,
                    tacheActiviteProjetRoutineId: null,
                  },
                  include: {
                    user: {
                      select: { id: true, firstName: true, lastName: true, email: true },
                    },
                  },
                },
              },
            },
          },
        },
        responsableTacheResponsable: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!tache) {
      return { success: false, error: "Tâche introuvable." };
    }

    const creator =
      tache.activiteProjetRoutine.roleMissionProjetRoutine.responsableProjetRoutine[0]?.user ??
      null;
    if (!creator) {
      return { success: false, error: "Responsable de l'activité introuvable." };
    }

    const currentUserId = userResult.data.id;

    const rows = await prisma.tacheActiviteProjetRoutineMessage.findMany({
      where: {
        tacheActiviteProjetRoutineId: tacheId,
        typeMessage: { not: "SUPPRIME" },
      },
      include: messageInclude,
      orderBy: { createdAt: "asc" },
    });

    if (currentUserId === creator.id) {
      await prisma.tacheActiviteProjetRoutineMessage.updateMany({
        where: {
          tacheActiviteProjetRoutineId: tacheId,
          typeMessage: "NON_LU",
          responsableProjetRoutine: { userId: { not: creator.id } },
        },
        data: { typeMessage: "LU" },
      });
    }

    return {
      success: true,
      thread: {
        tacheId: tache.id,
        tacheLibelle: tache.libelle,
        creator,
        responsables: tache.responsableTacheResponsable.map((r) => r.user),
        currentUserId,
        messages: rows.map(serializeMessage),
      },
    };
  } catch (error) {
    console.error("getTacheChatThread error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement du chat.",
    };
  }
}

export async function sendTacheChatMessage(
  tacheId: string,
  content: string,
  clerkUserId?: string
): Promise<
  | {
      success: true;
      message: TacheChatMessageItem;
      statutTache: StatutTacheActiviteProjetRoutine;
    }
  | { success: false; error: string }
> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: "Le message ne peut pas être vide." };
  }
  if (!tacheId) {
    return { success: false, error: "Tâche introuvable." };
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
    const tache = await prisma.tacheActiviteProjetRoutine.findUnique({
      where: { id: tacheId },
      select: {
        id: true,
        libelle: true,
        statutTache: true,
        activiteProjetRoutine: {
          select: {
            roleMissionProjetRoutineId: true,
            roleMissionProjetRoutine: {
              select: {
                responsableProjetRoutine: {
                  where: {
                    activiteProjetRoutineId: null,
                    tacheActiviteProjetRoutineId: null,
                  },
                  select: { userId: true },
                },
              },
            },
          },
        },
        responsableTacheResponsable: { select: { userId: true } },
      },
    });

    if (!tache) {
      return { success: false, error: "Tâche introuvable." };
    }

    const senderId = userResult.data.id;
    const creatorId =
      tache.activiteProjetRoutine.roleMissionProjetRoutine.responsableProjetRoutine[0]?.userId ??
      null;
    const isCreator = senderId === creatorId;

    if (isCreator && tache.responsableTacheResponsable.length === 0) {
      return {
        success: false,
        error: "Aucun responsable assigné — impossible d'envoyer un message.",
      };
    }

    const responsableProjetRoutineId = await resolveSenderResponsableProjetRoutine(
      tacheId,
      senderId,
      tache.activiteProjetRoutine.roleMissionProjetRoutineId,
      creatorId
    );
    if (!responsableProjetRoutineId) {
      return { success: false, error: "Vous n'êtes pas autorisé à participer à ce chat." };
    }

    const typeMessage: TypeMessageTacheActiviteProjetRoutine = isCreator ? "REPONDU" : "NON_LU";

    const row = await prisma.tacheActiviteProjetRoutineMessage.create({
      data: {
        message: trimmed,
        typeMessage,
        responsableProjetRoutineId,
        tacheActiviteProjetRoutineId: tacheId,
      },
      include: messageInclude,
    });

    let statutTache = tache.statutTache as StatutTacheActiviteProjetRoutine;

    if (!isCreator && statutTache === "EN_ATTENTE") {
      const updated = await prisma.tacheActiviteProjetRoutine.update({
        where: { id: tacheId },
        data: { statutTache: "EN_ATTENTE_VALIDATION" },
        select: { statutTache: true },
      });
      statutTache = updated.statutTache as StatutTacheActiviteProjetRoutine;
      revalidateTacheChatPaths();
    }

    if (!isCreator && creatorId) {
      const preview = trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
      await prisma.notification.create({
        data: {
          type: "MESSAGE",
          title: `Nouveau message · ${tache.libelle}`,
          message: preview,
          href: ACTIVITES_ROUTINEES_PATH,
          senderId,
          receiverId: creatorId,
          read: false,
        },
      });
    }

    return { success: true, message: serializeMessage(row), statutTache };
  } catch (error) {
    console.error("sendTacheChatMessage error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de l'envoi du message.",
    };
  }
}

export async function getEnAttenteChatPromptTacheIds(
  tacheIds: string[],
  clerkUserId?: string
): Promise<string[]> {
  if (tacheIds.length === 0) return [];

  const clerkId = await resolveClerkUserId(clerkUserId);
  if (!clerkId) return [];

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) return [];

  const currentUserId = userResult.data.id;

  try {
    const taches = await prisma.tacheActiviteProjetRoutine.findMany({
      where: {
        id: { in: tacheIds },
        statutTache: "EN_ATTENTE",
        responsableTacheResponsable: { some: { userId: currentUserId } },
      },
      select: { id: true },
    });

    if (taches.length === 0) return [];

    const candidateIds = taches.map((t) => t.id);

    const responsableRecords = await prisma.responsableProjetRoutine.findMany({
      where: {
        userId: currentUserId,
        tacheActiviteProjetRoutineId: { in: candidateIds },
      },
      select: { id: true, tacheActiviteProjetRoutineId: true },
    });

    if (responsableRecords.length === 0) return candidateIds;

    const responsableIds = responsableRecords.map((r) => r.id);
    const replied = await prisma.tacheActiviteProjetRoutineMessage.findMany({
      where: {
        responsableProjetRoutineId: { in: responsableIds },
        typeMessage: { not: "SUPPRIME" },
      },
      select: { tacheActiviteProjetRoutineId: true },
      distinct: ["tacheActiviteProjetRoutineId"],
    });

    const repliedSet = new Set(replied.map((r) => r.tacheActiviteProjetRoutineId));
    return candidateIds.filter((id) => !repliedSet.has(id));
  } catch (error) {
    console.error("getEnAttenteChatPromptTacheIds error:", error);
    return [];
  }
}
