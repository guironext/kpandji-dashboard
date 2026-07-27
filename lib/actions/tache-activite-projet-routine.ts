"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { StatutTacheActiviteProjetRoutine } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";
import {
  isStatutTacheActiviteProjetRoutine,
  type StatutTacheActiviteProjetRoutine as StatutTache,
} from "../tache-activite-projet-routine-statut";

const ACTIVITES_ROUTINEES_PATH = "/communication/activites-routinees";
const TACHES_EN_COURS_PATH = "/communication/taches-en-cours";
const DESIGNER_PROJET_PERMANENT_PATH = "/designer/projet-permanent";
const COMMUNITY_MANAGER_PROJET_PERMANENT_PATH = "/communityManager/projet-permanent";
const INFOGRAPHIE_PROJET_PERMANENT_PATH = "/infographie/projet-permanent";
const MARKETING_PROJET_PERMANENT_PATH = "/marketing/projet-permanent";

export type TacheResponsableItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
};

const TRANSFER_ASSIGNMENT_THRESHOLD_MS = 30_000;

export type TacheActiviteProjetRoutineListItem = {
  id: string;
  libelle: string;
  description: string | null;
  dateDebut: string;
  dateCloture: string | null;
  statutTache: StatutTacheActiviteProjetRoutine;
  activiteProjetRoutineId: string;
  activiteLibelle: string;
  activiteMois: string | null;
  roleMissionLibelle: string;
  activiteResponsableUserId: string | null;
  createdByUserId: string | null;
  responsables: TacheResponsableItem[];
  isTransferred?: boolean;
};

function isRoleLevelResponsable(responsable: {
  activiteProjetRoutineId?: string | null;
  tacheActiviteProjetRoutineId?: string | null;
}) {
  return responsable.activiteProjetRoutineId == null && responsable.tacheActiviteProjetRoutineId == null;
}

const tacheInclude = {
  activiteProjetRoutine: {
    include: {
      roleMissionProjetRoutine: {
        select: {
          libelle: true,
          id: true,
          responsableProjetRoutine: {
            include: {
              user: {
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
        },
      },
    },
  },
  responsableTacheResponsable: {
    include: {
      user: {
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
} as const;

function revalidateTachePaths() {
  try {
    revalidatePath(ACTIVITES_ROUTINEES_PATH);
    revalidatePath(TACHES_EN_COURS_PATH);
    revalidatePath(DESIGNER_PROJET_PERMANENT_PATH);
    revalidatePath(COMMUNITY_MANAGER_PROJET_PERMANENT_PATH);
    revalidatePath(INFOGRAPHIE_PROJET_PERMANENT_PATH);
    revalidatePath(MARKETING_PROJET_PERMANENT_PATH);
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

async function getCurrentDbUser(clerkUserId?: string) {
  const clerkId = await resolveClerkUserId(clerkUserId);
  if (!clerkId) return { error: "Vous devez être connecté." as const };

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { error: userResult.error ?? "Utilisateur introuvable." as const };
  }

  return { user: userResult.data };
}

function isTransferredAssignment(tacheCreatedAt: Date, responsableCreatedAt: Date) {
  return responsableCreatedAt.getTime() - tacheCreatedAt.getTime() > TRANSFER_ASSIGNMENT_THRESHOLD_MS;
}

function getRoleLevelResponsableUserId(
  responsables: Array<{
    activiteProjetRoutineId?: string | null;
    tacheActiviteProjetRoutineId?: string | null;
    user: { id: string };
  }>
) {
  return (
    responsables.find(isRoleLevelResponsable)?.user.id ?? null
  );
}

function serializeTache(
  row: {
  id: string;
  libelle: string;
  description: string | null;
  dateDebut: Date;
  dateCloture: Date | null;
  statutTache: StatutTacheActiviteProjetRoutine;
  activiteProjetRoutineId: string;
  createdAt: Date;
  createdByUserId?: string | null;
  activiteProjetRoutine: {
    libelle: string;
    mois: string | null;
    roleMissionProjetRoutine: {
      libelle: string;
      responsableProjetRoutine: Array<{
        activiteProjetRoutineId?: string | null;
        tacheActiviteProjetRoutineId?: string | null;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          role: UserRole;
        };
      }>;
    };
  };
  responsableTacheResponsable: Array<{
    id: string;
    createdAt: Date;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: UserRole;
    };
  }>;
},
  currentUserId?: string
): TacheActiviteProjetRoutineListItem {
  const roleResponsableUserId = getRoleLevelResponsableUserId(
    row.activiteProjetRoutine.roleMissionProjetRoutine.responsableProjetRoutine
  );

  const myResponsable = currentUserId
    ? row.responsableTacheResponsable.find((r) => r.user.id === currentUserId)
    : undefined;

  return {
    id: row.id,
    libelle: row.libelle,
    description: row.description,
    dateDebut: row.dateDebut.toISOString(),
    dateCloture: row.dateCloture ? row.dateCloture.toISOString() : null,
    statutTache: row.statutTache,
    activiteProjetRoutineId: row.activiteProjetRoutineId,
    activiteLibelle: row.activiteProjetRoutine.libelle,
    activiteMois: row.activiteProjetRoutine.mois,
    roleMissionLibelle: row.activiteProjetRoutine.roleMissionProjetRoutine.libelle,
    activiteResponsableUserId: roleResponsableUserId,
    createdByUserId: row.createdByUserId ?? null,
    responsables: row.responsableTacheResponsable.map((r) => ({
      id: r.id,
      userId: r.user.id,
      userName: `${r.user.firstName} ${r.user.lastName}`.trim(),
      userEmail: r.user.email,
      userRole: r.user.role,
    })),
    isTransferred: myResponsable
      ? isTransferredAssignment(row.createdAt, myResponsable.createdAt)
      : false,
  };
}

export async function getTachesActiviteProjetRoutine(): Promise<
  | { success: true; taches: TacheActiviteProjetRoutineListItem[] }
  | { success: false; taches: []; error: string }
> {
  try {
    const rows = await prisma.tacheActiviteProjetRoutine.findMany({
      orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
      include: tacheInclude,
    });

    return {
      success: true,
      taches: rows.map((row) => serializeTache(row)),
    };
  } catch (error) {
    console.error("getTachesActiviteProjetRoutine error:", error);
    return {
      success: false,
      taches: [],
      error: error instanceof Error ? error.message : "Erreur lors du chargement des tâches.",
    };
  }
}

export async function getTachesForCurrentResponsable(
  clerkUserId?: string
): Promise<
  | { success: true; taches: TacheActiviteProjetRoutineListItem[] }
  | { success: false; error: string; taches: [] }
> {
  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable.", taches: [] };
    }

    const rows = await prisma.tacheActiviteProjetRoutine.findMany({
      where: {
        responsableTacheResponsable: {
          some: { userId: current.user.id },
        },
      },
      orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
      include: tacheInclude,
    });

    return {
      success: true,
      taches: rows.map((row) => serializeTache(row, current.user.id)),
    };
  } catch (error) {
    console.error("getTachesForCurrentResponsable error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement.",
      taches: [],
    };
  }
}

export async function updateTacheStatut(
  tacheId: string,
  activiteProjetRoutineId: string,
  statutTache: StatutTache,
  clerkUserId?: string
): Promise<
  | { success: true; tache: TacheActiviteProjetRoutineListItem }
  | { success: false; error: string }
> {
  if (!tacheId || !activiteProjetRoutineId) {
    return { success: false, error: "Tâche ou activité introuvable." };
  }
  if (!isStatutTacheActiviteProjetRoutine(statutTache)) {
    return { success: false, error: "Statut de tâche invalide." };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const existing = await prisma.tacheActiviteProjetRoutine.findFirst({
      where: {
        id: tacheId,
        activiteProjetRoutineId,
        responsableTacheResponsable: {
          some: { userId: current.user.id },
        },
      },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Tâche introuvable ou accès refusé." };
    }

    const row = await prisma.tacheActiviteProjetRoutine.update({
      where: { id: tacheId },
      data: { statutTache },
      include: tacheInclude,
    });

    revalidateTachePaths();
    return { success: true, tache: serializeTache(row, current.user.id) };
  } catch (error) {
    console.error("updateTacheStatut error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut.",
    };
  }
}

/** Vue communication : mise à jour du statut sans être responsable de la tâche. */
export async function updateTacheStatutOverview(
  tacheId: string,
  activiteProjetRoutineId: string,
  statutTache: StatutTache,
  clerkUserId?: string
): Promise<
  | { success: true; tache: TacheActiviteProjetRoutineListItem }
  | { success: false; error: string }
> {
  if (!tacheId || !activiteProjetRoutineId) {
    return { success: false, error: "Tâche ou activité introuvable." };
  }
  if (!isStatutTacheActiviteProjetRoutine(statutTache)) {
    return { success: false, error: "Statut de tâche invalide." };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const existing = await prisma.tacheActiviteProjetRoutine.findFirst({
      where: { id: tacheId, activiteProjetRoutineId },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Tâche introuvable." };
    }

    const row = await prisma.tacheActiviteProjetRoutine.update({
      where: { id: tacheId },
      data: { statutTache },
      include: tacheInclude,
    });

    revalidateTachePaths();
    return { success: true, tache: serializeTache(row, current.user.id) };
  } catch (error) {
    console.error("updateTacheStatutOverview error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la mise à jour du statut.",
    };
  }
}

export async function terminerTache(
  tacheId: string,
  activiteProjetRoutineId: string,
  clerkUserId?: string
): Promise<
  | { success: true; tache: TacheActiviteProjetRoutineListItem }
  | { success: false; error: string }
> {
  if (!tacheId || !activiteProjetRoutineId) {
    return { success: false, error: "Tâche ou activité introuvable." };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const existing = await prisma.tacheActiviteProjetRoutine.findFirst({
      where: {
        id: tacheId,
        activiteProjetRoutineId,
        responsableTacheResponsable: {
          some: { userId: current.user.id },
        },
      },
      select: { id: true, statutTache: true },
    });
    if (!existing) {
      return { success: false, error: "Tâche introuvable ou accès refusé." };
    }
    if (existing.statutTache !== "VALIDEE") {
      return {
        success: false,
        error: "Seules les tâches validées peuvent être marquées comme terminées.",
      };
    }

    const row = await prisma.tacheActiviteProjetRoutine.update({
      where: { id: tacheId },
      data: { statutTache: "TERMINEE" },
      include: tacheInclude,
    });

    revalidateTachePaths();
    return { success: true, tache: serializeTache(row) };
  } catch (error) {
    console.error("terminerTache error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la clôture.",
    };
  }
}

export type CreateTacheActiviteProjetRoutineInput = {
  libelle: string;
  description?: string;
  dateDebut: string;
  dateCloture?: string | null;
  statutTache?: StatutTacheActiviteProjetRoutine;
  activiteProjetRoutineId: string;
  userId: string;
};

export type CreateTacheActiviteProjetRoutineBatchInput = {
  taches: CreateTacheActiviteProjetRoutineInput[];
};

function parseDate(value: string, label: string): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} : date invalide.`);
  }
  return date;
}

export async function createTacheActiviteProjetRoutineBatch(
  input: CreateTacheActiviteProjetRoutineBatchInput
): Promise<
  | { success: true; taches: TacheActiviteProjetRoutineListItem[]; createdCount: number }
  | { success: false; error: string }
> {
  if (!input.taches?.length) {
    return { success: false, error: "Ajoutez au moins une tâche." };
  }

  try {
    const current = await getCurrentDbUser();
    if ("error" in current) {
      return { success: false, error: current.error ?? "Vous devez être connecté." };
    }

    const activiteIds = [...new Set(input.taches.map((t) => t.activiteProjetRoutineId?.trim()))];
    const userIds = [...new Set(input.taches.map((t) => t.userId?.trim()))];

    const [activites, users] = await Promise.all([
      prisma.activiteProjetRoutine.findMany({
        where: { id: { in: activiteIds.filter(Boolean) as string[] } },
        select: { id: true },
      }),
      prisma.user.findMany({
        where: { id: { in: userIds.filter(Boolean) as string[] } },
        select: { id: true },
      }),
    ]);

    const activiteSet = new Set(activites.map((a) => a.id));
    const userSet = new Set(users.map((u) => u.id));

    const payloads = input.taches.map((item, index) => {
      const libelle = item.libelle?.trim();
      if (!libelle) {
        throw new Error(`Tâche ${index + 1} : le libellé est obligatoire.`);
      }

      const activiteProjetRoutineId = item.activiteProjetRoutineId?.trim();
      if (!activiteProjetRoutineId) {
        throw new Error(`Tâche ${index + 1} : sélectionnez une activité.`);
      }
      if (!activiteSet.has(activiteProjetRoutineId)) {
        throw new Error(`Tâche ${index + 1} : activité introuvable.`);
      }

      const userId = item.userId?.trim();
      if (!userId) {
        throw new Error(`Tâche ${index + 1} : sélectionnez un responsable.`);
      }
      if (!userSet.has(userId)) {
        throw new Error(`Tâche ${index + 1} : utilisateur introuvable.`);
      }

      const dateDebut = parseDate(item.dateDebut, `Tâche ${index + 1} — date de début`);
      if (!dateDebut) {
        throw new Error(`Tâche ${index + 1} : la date de début est obligatoire.`);
      }

      let dateCloture: Date | null = null;
      if (item.dateCloture?.trim()) {
        dateCloture = parseDate(item.dateCloture, `Tâche ${index + 1} — date de clôture`);
      }

      if (dateCloture && dateCloture < dateDebut) {
        throw new Error(
          `Tâche ${index + 1} : la date de clôture doit être postérieure à la date de début.`
        );
      }

      return {
        libelle,
        description: item.description?.trim() || null,
        dateDebut,
        dateCloture,
        statutTache: item.statutTache ?? ("NOUVEAU" as StatutTacheActiviteProjetRoutine),
        createdBy: { connect: { id: current.user.id } },
        activiteProjetRoutine: { connect: { id: activiteProjetRoutineId } },
        responsableTacheResponsable: {
          create: [{ user: { connect: { id: userId } } }],
        },
      };
    });

    const createdRows = await prisma.$transaction(
      payloads.map((data) =>
        prisma.tacheActiviteProjetRoutine.create({
          data,
          include: tacheInclude,
        })
      )
    );

    revalidateTachePaths();

    return {
      success: true,
      createdCount: createdRows.length,
      taches: createdRows.map((row) => serializeTache(row)),
    };
  } catch (error) {
    console.error("createTacheActiviteProjetRoutineBatch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création des tâches.",
    };
  }
}

export async function validateTache(
  tacheId: string,
  activiteProjetRoutineId: string,
  clerkUserId?: string
): Promise<
  | { success: true; tache: TacheActiviteProjetRoutineListItem }
  | { success: false; error: string }
> {
  if (!tacheId || !activiteProjetRoutineId) {
    return { success: false, error: "Tâche ou activité introuvable." };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const existing = await prisma.tacheActiviteProjetRoutine.findFirst({
      where: { id: tacheId, activiteProjetRoutineId },
      include: tacheInclude,
    });
    if (!existing) {
      return { success: false, error: "Tâche introuvable." };
    }
    if (existing.statutTache !== "EN_ATTENTE_VALIDATION") {
      return {
        success: false,
        error: "Seules les tâches en attente de validation peuvent être validées.",
      };
    }

    const creatorId =
      existing.createdByUserId ??
      getRoleLevelResponsableUserId(
        existing.activiteProjetRoutine.roleMissionProjetRoutine.responsableProjetRoutine
      );

    const isLegacyCommunicationValidation =
      !existing.createdByUserId && current.user.role === UserRole.COMMUNICATION;

    if (!isLegacyCommunicationValidation && (!creatorId || creatorId !== current.user.id)) {
      return { success: false, error: "Seul le créateur de la tâche peut valider." };
    }

    const row = await prisma.tacheActiviteProjetRoutine.update({
      where: { id: tacheId },
      data: { statutTache: "VALIDEE" },
      include: tacheInclude,
    });

    revalidateTachePaths();
    return { success: true, tache: serializeTache(row) };
  } catch (error) {
    console.error("validateTache error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la validation.",
    };
  }
}

export async function transferTacheToResponsable(
  tacheId: string,
  activiteProjetRoutineId: string,
  newResponsableUserId: string,
  clerkUserId?: string
): Promise<
  | { success: true; tache: TacheActiviteProjetRoutineListItem }
  | { success: false; error: string }
> {
  if (!tacheId || !activiteProjetRoutineId) {
    return { success: false, error: "Tâche ou activité introuvable." };
  }
  if (!newResponsableUserId) {
    return { success: false, error: "Veuillez sélectionner un responsable." };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const existing = await prisma.tacheActiviteProjetRoutine.findFirst({
      where: { id: tacheId, activiteProjetRoutineId },
      select: { id: true, statutTache: true },
    });
    if (!existing) {
      return { success: false, error: "Tâche introuvable." };
    }
    if (existing.statutTache !== "VALIDEE") {
      return {
        success: false,
        error: "Seules les tâches validées peuvent être transférées.",
      };
    }

    const isResponsable = await prisma.responsableTacheResponsable.findFirst({
      where: { tacheActiviteProjetRoutineId: tacheId, userId: current.user.id },
      select: { id: true },
    });
    if (!isResponsable) {
      return { success: false, error: "Seul le responsable actuel peut transférer la tâche." };
    }

    const newUser = await prisma.user.findUnique({
      where: { id: newResponsableUserId },
      select: { id: true },
    });
    if (!newUser) {
      return { success: false, error: "Le responsable sélectionné est invalide." };
    }

    const row = await prisma.$transaction(async (tx) => {
      await tx.responsableTacheResponsable.deleteMany({
        where: { tacheActiviteProjetRoutineId: tacheId },
      });
      await tx.responsableTacheResponsable.create({
        data: {
          userId: newResponsableUserId,
          tacheActiviteProjetRoutineId: tacheId,
        },
      });
      return tx.tacheActiviteProjetRoutine.update({
        where: { id: tacheId },
        data: { statutTache: "NOUVEAU" },
        include: tacheInclude,
      });
    });

    revalidateTachePaths();
    return { success: true, tache: serializeTache(row) };
  } catch (error) {
    console.error("transferTacheToResponsable error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du transfert.",
    };
  }
}

export async function deleteTacheActiviteProjetRoutine(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.tacheActiviteProjetRoutine.delete({ where: { id } });
    revalidateTachePaths();
    return { success: true };
  } catch (error) {
    console.error("deleteTacheActiviteProjetRoutine error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la suppression.",
    };
  }
}
