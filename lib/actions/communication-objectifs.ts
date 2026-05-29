"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import type { UserForActorOption } from "./communication-actor";

const OBJECTIFS_PATH = "/communication/objectifs-principaux";
const INFOGRAPHIE_OBJECTIFS_PATH = "/infographie/objectifs-principaux";

const OBJECTIF_ASSIGNEE_ROLES: UserRole[] = [
  UserRole.COMMUNICATION,
  UserRole.INFOGRAPHIE,
  UserRole.COMMERCIAL,
  UserRole.COMMUNITY_MANAGER,
];

const ROLE_LABELS: Record<string, string> = {
  COMMUNICATION: "Communication",
  INFOGRAPHIE: "Infographie",
  COMMERCIAL: "Commercial",
  COMMUNITY_MANAGER: "Community manager",
};

function roleToJob(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").toLowerCase();
}

function revalidateObjectifs() {
  try {
    revalidatePath(OBJECTIFS_PATH);
    revalidatePath(INFOGRAPHIE_OBJECTIFS_PATH);
  } catch {
    // ignore
  }
}

export type ObjectifPrincipauxItem = {
  id: string;
  titre: string;
  description: string | null;
  createdAt: Date;
};

export type ObjectifAssigneeUser = UserForActorOption & {
  role: string;
};

export type ObjectifGlobalItem = {
  id: string;
  objectif: string;
  frequence: string;
  plateforme: string;
  style_Thon: string;
  cycleObjectifGlobalRubriqueId?: string | null;
  rubriqueId?: string | null;
  createdAt?: Date;
  rubrique?: string;
  cycleTitre?: string | null;
  userId?: string;
  userName?: string;
  userRole?: string;
};

export type RubriqueItem = {
  id: string;
  rubrique: string;
  createdAt: Date;
  objectifCount: number;
};

export type CycleObjectifItem = {
  id: string;
  titreCycle: string;
  dateDebutCycle: Date;
  dateFinCycle: Date;
  rubriqueId: string;
  rubrique: string;
  objectifCount: number;
  createdAt: Date;
};

export type RubriqueWithObjectifs = {
  id: string;
  rubrique: string;
  objectifs: ObjectifGlobalItem[];
};

export type ActeurWithObjectifs = {
  userId: string;
  name: string;
  email: string;
  role: string;
  job: string;
  department: string;
  objectifs: ObjectifGlobalItem[];
};

export type ObjectifsPrincipauxPageData = {
  users: ObjectifAssigneeUser[];
  rubriques: RubriqueItem[];
  cycles: CycleObjectifItem[];
  objectifs: ObjectifGlobalItem[];
  acteurs: ActeurWithObjectifs[];
};

export type UserObjectifsData = {
  objectifs: ObjectifGlobalItem[];
};

export type GetUsersForObjectifsResult =
  | { success: true; users: ObjectifAssigneeUser[] }
  | { success: false; users: []; error: string };

export async function getUsersForCommunicationObjectifs(): Promise<GetUsersForObjectifsResult> {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: OBJECTIF_ASSIGNEE_ROLES } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        role: true,
        Employee: { select: { poste: true }, take: 1 },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const options: ObjectifAssigneeUser[] = users.map((user) => {
      const poste = user.Employee[0]?.poste?.trim();
      const department = user.department?.trim() || "Non renseigné";
      const job = poste || roleToJob(user.role);
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        department,
        job,
        role: user.role,
      };
    });

    return { success: true, users: options };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getUsersForCommunicationObjectifs error:", error);
    return { success: false, users: [], error: message || "Erreur lors du chargement des utilisateurs" };
  }
}

function mapObjectifGlobal(
  row: {
    id: string;
    objectif: string;
    frequence: string;
    plateforme: string;
    style_Thon: string;
    userId: string;
    createdAt: Date;
    cycleObjectifGlobalRubriqueId: string | null;
    CycleObjectifGlobalRubrique: null | {
      id: string;
      titreCycle: string;
      rubriqueId: string;
      RubriqueObjectifGlobal: { rubrique: string };
    };
    User: { firstName: string; lastName: string; role: string };
  }
): ObjectifGlobalItem {
  const cycle = row.CycleObjectifGlobalRubrique;
  return {
    id: row.id,
    objectif: row.objectif,
    frequence: row.frequence,
    plateforme: row.plateforme,
    style_Thon: row.style_Thon,
    cycleObjectifGlobalRubriqueId: row.cycleObjectifGlobalRubriqueId,
    rubriqueId: cycle?.rubriqueId ?? null,
    createdAt: row.createdAt,
    rubrique: cycle?.RubriqueObjectifGlobal?.rubrique ?? undefined,
    cycleTitre: cycle?.titreCycle ?? null,
    userId: row.userId,
    userName: `${row.User.firstName} ${row.User.lastName}`.trim(),
    userRole: row.User.role,
  };
}

export async function getObjectifsPrincipauxPageData(): Promise<
  | { success: true; data: ObjectifsPrincipauxPageData }
  | { success: false; error: string }
> {
  try {
    const [usersResult, rubriquesRaw, cyclesRaw, objectifsRaw] = await Promise.all([
      getUsersForCommunicationObjectifs(),
      prisma.rubriqueObjectifGlobal.findMany({
        orderBy: { rubrique: "asc" },
        select: {
          id: true,
          rubrique: true,
          createdAt: true,
          CycleObjectifGlobalRubrique: {
            select: {
              id: true,
              _count: { select: { ObjectifGlobal: true } },
            },
          },
        },
      }),
      prisma.cycleObjectifGlobalRubrique.findMany({
        orderBy: [{ dateDebutCycle: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          titreCycle: true,
          dateDebutCycle: true,
          dateFinCycle: true,
          rubriqueId: true,
          createdAt: true,
          RubriqueObjectifGlobal: { select: { rubrique: true } },
          _count: { select: { ObjectifGlobal: true } },
        },
      }),
      prisma.objectifGlobal.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          objectif: true,
          frequence: true,
          plateforme: true,
          style_Thon: true,
          userId: true,
          createdAt: true,
          cycleObjectifGlobalRubriqueId: true,
          CycleObjectifGlobalRubrique: {
            select: {
              id: true,
              titreCycle: true,
              rubriqueId: true,
              RubriqueObjectifGlobal: { select: { rubrique: true } },
            },
          },
          User: { select: { firstName: true, lastName: true, role: true, email: true, department: true, Employee: { select: { poste: true }, take: 1 } } },
        },
      }),
    ]);

    const rubriques: RubriqueItem[] = rubriquesRaw.map((r) => ({
      id: r.id,
      rubrique: r.rubrique,
      createdAt: r.createdAt,
      objectifCount: r.CycleObjectifGlobalRubrique.reduce(
        (sum, c) => sum + c._count.ObjectifGlobal,
        0
      ),
    }));

    const cycles: CycleObjectifItem[] = cyclesRaw.map((c) => ({
      id: c.id,
      titreCycle: c.titreCycle,
      dateDebutCycle: c.dateDebutCycle,
      dateFinCycle: c.dateFinCycle,
      rubriqueId: c.rubriqueId,
      rubrique: c.RubriqueObjectifGlobal.rubrique,
      objectifCount: c._count.ObjectifGlobal,
      createdAt: c.createdAt,
    }));

    const objectifs = objectifsRaw.map(mapObjectifGlobal);

    const acteurMap = new Map<string, ActeurWithObjectifs>();
    for (const obj of objectifsRaw) {
      const existing = acteurMap.get(obj.userId);
      const mapped = mapObjectifGlobal(obj);
      if (existing) {
        existing.objectifs.push(mapped);
        continue;
      }
      const poste = obj.User.Employee[0]?.poste?.trim();
      acteurMap.set(obj.userId, {
        userId: obj.userId,
        name: `${obj.User.firstName} ${obj.User.lastName}`.trim(),
        email: obj.User.email,
        role: obj.User.role,
        job: poste || roleToJob(obj.User.role),
        department: obj.User.department?.trim() || "Non renseigné",
        objectifs: [mapped],
      });
    }

    const acteurs = Array.from(acteurMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr")
    );

    return {
      success: true,
      data: {
        users: usersResult.success ? usersResult.users : [],
        rubriques,
        cycles,
        objectifs,
        acteurs,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getObjectifsPrincipauxPageData error:", error);
    return { success: false, error: message || "Erreur lors du chargement des données" };
  }
}

export type GetUserObjectifsResult =
  | { success: true; data: UserObjectifsData }
  | { success: false; error: string };

export async function getObjectifsForUser(userId: string): Promise<GetUserObjectifsResult> {
  if (!userId?.trim()) {
    return { success: false, error: "Utilisateur requis." };
  }

  try {
    const objectifsRaw = await prisma.objectifGlobal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        objectif: true,
        frequence: true,
        plateforme: true,
        style_Thon: true,
        userId: true,
        createdAt: true,
        cycleObjectifGlobalRubriqueId: true,
        CycleObjectifGlobalRubrique: {
          select: {
            id: true,
            titreCycle: true,
            rubriqueId: true,
            RubriqueObjectifGlobal: { select: { rubrique: true } },
          },
        },
        User: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return {
      success: true,
      data: {
        objectifs: objectifsRaw.map(mapObjectifGlobal),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getObjectifsForUser error:", error);
    return { success: false, error: message || "Erreur lors du chargement des objectifs" };
  }
}

export async function getObjectifsForClerkUser(
  clerkUserId: string
): Promise<GetUserObjectifsResult> {
  if (!clerkUserId?.trim()) {
    return { success: false, error: "Utilisateur non connecté." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "Utilisateur introuvable." };
    }
    return getObjectifsForUser(user.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getObjectifsForClerkUser error:", error);
    return { success: false, error: message || "Erreur lors du chargement des objectifs" };
  }
}

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function createObjectifPrincipaux(input: {
  userId: string;
  titre: string;
  description?: string;
}): Promise<ActionResult<ObjectifPrincipauxItem>> {
  const titre = input.titre?.trim();
  if (!input.userId?.trim()) return { success: false, error: "Utilisateur requis." };
  if (!titre) return { success: false, error: "Le titre est obligatoire." };

  try {
    const created = await prisma.objectifPrincipaux.create({
      data: {
        userId: input.userId,
        titre,
        description: input.description?.trim() || null,
      },
      select: { id: true, titre: true, description: true, createdAt: true },
    });
    revalidateObjectifs();
    return { success: true, data: created };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createObjectifPrincipaux error:", error);
    return { success: false, error: message || "Erreur lors de la création" };
  }
}

export async function updateObjectifPrincipaux(input: {
  id: string;
  titre: string;
  description?: string;
}): Promise<ActionResult<ObjectifPrincipauxItem>> {
  const titre = input.titre?.trim();
  if (!input.id?.trim()) return { success: false, error: "Identifiant requis." };
  if (!titre) return { success: false, error: "Le titre est obligatoire." };

  try {
    const updated = await prisma.objectifPrincipaux.update({
      where: { id: input.id },
      data: {
        titre,
        description: input.description?.trim() || null,
      },
      select: { id: true, titre: true, description: true, createdAt: true },
    });
    revalidateObjectifs();
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateObjectifPrincipaux error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour" };
  }
}

export async function deleteObjectifPrincipaux(id: string): Promise<ActionResult> {
  if (!id?.trim()) return { success: false, error: "Identifiant requis." };
  try {
    await prisma.objectifPrincipaux.delete({ where: { id } });
    revalidateObjectifs();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deleteObjectifPrincipaux error:", error);
    return { success: false, error: message || "Erreur lors de la suppression" };
  }
}

export async function createRubriqueObjectifGlobal(input: {
  rubrique: string;
  userId?: string;
}): Promise<ActionResult<{ id: string; rubrique: string }>> {
  const rubrique = input.rubrique?.trim();
  if (!rubrique) return { success: false, error: "Le nom de la rubrique est obligatoire." };

  try {
    const created = await prisma.rubriqueObjectifGlobal.create({
      data: {
        rubrique,
        ...(input.userId?.trim() ? { userId: input.userId.trim() } : {}),
      },
      select: { id: true, rubrique: true },
    });
    revalidateObjectifs();
    return { success: true, data: created };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createRubriqueObjectifGlobal error:", error);
    return { success: false, error: message || "Erreur lors de la création de la rubrique" };
  }
}

export async function updateRubriqueObjectifGlobal(input: {
  id: string;
  rubrique: string;
}): Promise<ActionResult<{ id: string; rubrique: string }>> {
  const rubrique = input.rubrique?.trim();
  if (!input.id?.trim()) return { success: false, error: "Identifiant requis." };
  if (!rubrique) return { success: false, error: "Le nom de la rubrique est obligatoire." };

  try {
    const updated = await prisma.rubriqueObjectifGlobal.update({
      where: { id: input.id },
      data: { rubrique },
      select: { id: true, rubrique: true },
    });
    revalidateObjectifs();
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateRubriqueObjectifGlobal error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour" };
  }
}

export async function createCycleObjectifGlobalRubrique(input: {
  rubriqueId: string;
  titreCycle: string;
  dateDebutCycle: string;
  dateFinCycle: string;
}): Promise<ActionResult<{ id: string }>> {
  const titreCycle = input.titreCycle?.trim();
  const rubriqueId = input.rubriqueId?.trim();
  if (!rubriqueId) return { success: false, error: "La rubrique est obligatoire." };
  if (!titreCycle) return { success: false, error: "Le titre du cycle est obligatoire." };

  const dateDebutCycle = new Date(input.dateDebutCycle);
  const dateFinCycle = new Date(input.dateFinCycle);
  if (Number.isNaN(dateDebutCycle.getTime()) || Number.isNaN(dateFinCycle.getTime())) {
    return { success: false, error: "Les dates du cycle sont invalides." };
  }
  if (dateFinCycle < dateDebutCycle) {
    return { success: false, error: "La date de fin doit être après la date de début." };
  }

  try {
    const rubrique = await prisma.rubriqueObjectifGlobal.findUnique({
      where: { id: rubriqueId },
      select: { id: true },
    });
    if (!rubrique) return { success: false, error: "Rubrique introuvable." };

    const created = await prisma.cycleObjectifGlobalRubrique.create({
      data: {
        rubriqueId,
        titreCycle,
        dateDebutCycle,
        dateFinCycle,
      },
      select: { id: true },
    });
    revalidateObjectifs();
    return { success: true, data: created };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createCycleObjectifGlobalRubrique error:", error);
    return { success: false, error: message || "Erreur lors de la création du cycle." };
  }
}

export async function updateCycleObjectifGlobalRubrique(input: {
  id: string;
  rubriqueId: string;
  titreCycle: string;
  dateDebutCycle: string;
  dateFinCycle: string;
}): Promise<ActionResult<{ id: string }>> {
  const titreCycle = input.titreCycle?.trim();
  const rubriqueId = input.rubriqueId?.trim();
  if (!input.id?.trim()) return { success: false, error: "Identifiant requis." };
  if (!rubriqueId) return { success: false, error: "La rubrique est obligatoire." };
  if (!titreCycle) return { success: false, error: "Le titre du cycle est obligatoire." };

  const dateDebutCycle = new Date(input.dateDebutCycle);
  const dateFinCycle = new Date(input.dateFinCycle);
  if (Number.isNaN(dateDebutCycle.getTime()) || Number.isNaN(dateFinCycle.getTime())) {
    return { success: false, error: "Les dates du cycle sont invalides." };
  }
  if (dateFinCycle < dateDebutCycle) {
    return { success: false, error: "La date de fin doit être après la date de début." };
  }

  try {
    const updated = await prisma.cycleObjectifGlobalRubrique.update({
      where: { id: input.id },
      data: {
        rubriqueId,
        titreCycle,
        dateDebutCycle,
        dateFinCycle,
      },
      select: { id: true },
    });
    revalidateObjectifs();
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateCycleObjectifGlobalRubrique error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour du cycle." };
  }
}

export async function deleteCycleObjectifGlobalRubrique(id: string): Promise<ActionResult> {
  if (!id?.trim()) return { success: false, error: "Identifiant requis." };
  try {
    await prisma.cycleObjectifGlobalRubrique.delete({ where: { id } });
    revalidateObjectifs();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deleteCycleObjectifGlobalRubrique error:", error);
    return { success: false, error: message || "Erreur lors de la suppression du cycle." };
  }
}

export async function deleteRubriqueObjectifGlobal(id: string): Promise<ActionResult> {
  if (!id?.trim()) return { success: false, error: "Identifiant requis." };
  try {
    await prisma.rubriqueObjectifGlobal.delete({ where: { id } });
    revalidateObjectifs();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deleteRubriqueObjectifGlobal error:", error);
    return { success: false, error: message || "Erreur lors de la suppression" };
  }
}

async function resolveCycleIdForObjectif(input: {
  rubriqueId: string;
  cycleObjectifGlobalRubriqueId?: string | null;
}): Promise<ActionResultWithData<{ cycleId: string }>> {
  const rubriqueId = input.rubriqueId.trim();
  const cycleId = input.cycleObjectifGlobalRubriqueId?.trim();

  if (cycleId) {
    const cycle = await prisma.cycleObjectifGlobalRubrique.findUnique({
      where: { id: cycleId },
      select: { id: true, rubriqueId: true },
    });
    if (!cycle) return { success: false, error: "Cycle introuvable." };
    if (cycle.rubriqueId !== rubriqueId) {
      return { success: false, error: "Le cycle ne correspond pas à la rubrique sélectionnée." };
    }
    return { success: true, data: { cycleId: cycle.id } };
  }

  return getOrCreateDefaultCycleForRubriqueId(rubriqueId);
}

export async function createObjectifGlobal(input: {
  userId: string;
  // Backward-compatible: the UI sends a RubriqueObjectifGlobal id.
  rubriqueId: string;
  cycleObjectifGlobalRubriqueId?: string | null;
  objectif: string;
  frequence: string;
  plateforme: string;
  style_Thon: string;
}): Promise<ActionResult<ObjectifGlobalItem>> {
  const objectif = input.objectif?.trim();
  if (!input.userId?.trim()) return { success: false, error: "Utilisateur requis." };
  if (!input.rubriqueId?.trim()) return { success: false, error: "Rubrique requise." };
  if (!objectif) return { success: false, error: "L'objectif est obligatoire." };

  try {
    const cycleIdResult = await resolveCycleIdForObjectif({
      rubriqueId: input.rubriqueId,
      cycleObjectifGlobalRubriqueId: input.cycleObjectifGlobalRubriqueId,
    });
    if (!cycleIdResult.success) return { success: false, error: cycleIdResult.error };

    const assignee = await prisma.user.findUnique({
      where: { id: input.userId.trim() },
      select: { role: true },
    });
    if (!assignee) return { success: false, error: "Utilisateur introuvable." };
    if (!OBJECTIF_ASSIGNEE_ROLES.includes(assignee.role)) {
      return {
        success: false,
        error: "Seuls les utilisateurs Communication, Infographie ou Commercial peuvent recevoir un objectif.",
      };
    }

    const created = await prisma.objectifGlobal.create({
      data: {
        userId: input.userId,
        cycleObjectifGlobalRubriqueId: cycleIdResult.data.cycleId,
        objectif,
        frequence: input.frequence?.trim() || "",
        plateforme: input.plateforme?.trim() || "",
        style_Thon: input.style_Thon?.trim() || "",
      },
      select: {
        id: true,
        objectif: true,
        frequence: true,
        plateforme: true,
        style_Thon: true,
        userId: true,
        createdAt: true,
        cycleObjectifGlobalRubriqueId: true,
        CycleObjectifGlobalRubrique: {
          select: {
            id: true,
            titreCycle: true,
            rubriqueId: true,
            RubriqueObjectifGlobal: { select: { rubrique: true } },
          },
        },
        User: { select: { firstName: true, lastName: true, role: true } },
      },
    });
    revalidateObjectifs();
    return { success: true, data: mapObjectifGlobal(created) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createObjectifGlobal error:", error);
    return { success: false, error: message || "Erreur lors de la création de l'objectif global" };
  }
}

export async function createObjectifGlobalForUsers(input: {
  userIds: string[];
  // Backward-compatible: the UI sends a RubriqueObjectifGlobal id.
  rubriqueId: string;
  cycleObjectifGlobalRubriqueId?: string | null;
  objectif: string;
  frequence: string;
  plateforme: string;
  style_Thon: string;
}): Promise<ActionResult<{ createdCount: number }>> {
  const objectif = input.objectif?.trim();
  const userIds = [...new Set(input.userIds.map((id) => id.trim()).filter(Boolean))];

  if (userIds.length === 0) {
    return { success: false, error: "Sélectionnez au moins un utilisateur." };
  }
  if (!input.rubriqueId?.trim()) return { success: false, error: "Rubrique requise." };
  if (!objectif) return { success: false, error: "L'objectif est obligatoire." };

  try {
    const cycleIdResult = await resolveCycleIdForObjectif({
      rubriqueId: input.rubriqueId,
      cycleObjectifGlobalRubriqueId: input.cycleObjectifGlobalRubriqueId,
    });
    if (!cycleIdResult.success) return { success: false, error: cycleIdResult.error };

    const assignees = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true },
    });

    if (assignees.length !== userIds.length) {
      return { success: false, error: "Un ou plusieurs utilisateurs sont introuvables." };
    }

    const invalid = assignees.filter((a) => !OBJECTIF_ASSIGNEE_ROLES.includes(a.role));
    if (invalid.length > 0) {
      return {
        success: false,
        error:
          "Seuls les utilisateurs Communication, Infographie ou Commercial peuvent recevoir un objectif.",
      };
    }

    const data = {
      cycleObjectifGlobalRubriqueId: cycleIdResult.data.cycleId,
      objectif,
      frequence: input.frequence?.trim() || "",
      plateforme: input.plateforme?.trim() || "",
      style_Thon: input.style_Thon?.trim() || "",
    };

    const result = await prisma.objectifGlobal.createMany({
      data: userIds.map((userId) => ({ ...data, userId })),
    });

    revalidateObjectifs();
    return { success: true, data: { createdCount: result.count } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createObjectifGlobalForUsers error:", error);
    return { success: false, error: message || "Erreur lors de la création des objectifs" };
  }
}

export async function updateObjectifGlobal(input: {
  id: string;
  rubriqueId?: string;
  cycleObjectifGlobalRubriqueId?: string | null;
  objectif: string;
  frequence: string;
  plateforme: string;
  style_Thon: string;
}): Promise<ActionResult<ObjectifGlobalItem>> {
  const objectif = input.objectif?.trim();
  if (!input.id?.trim()) return { success: false, error: "Identifiant requis." };
  if (!objectif) return { success: false, error: "L'objectif est obligatoire." };

  try {
    const updateData: {
      objectif: string;
      frequence: string;
      plateforme: string;
      style_Thon: string;
      cycleObjectifGlobalRubriqueId?: string;
    } = {
      objectif,
      frequence: input.frequence?.trim() || "",
      plateforme: input.plateforme?.trim() || "",
      style_Thon: input.style_Thon?.trim() || "",
    };

    if (input.rubriqueId?.trim()) {
      const cycleIdResult = await resolveCycleIdForObjectif({
        rubriqueId: input.rubriqueId,
        cycleObjectifGlobalRubriqueId: input.cycleObjectifGlobalRubriqueId,
      });
      if (!cycleIdResult.success) return { success: false, error: cycleIdResult.error };
      updateData.cycleObjectifGlobalRubriqueId = cycleIdResult.data.cycleId;
    }

    const updated = await prisma.objectifGlobal.update({
      where: { id: input.id },
      data: updateData,
      select: {
        id: true,
        objectif: true,
        frequence: true,
        plateforme: true,
        style_Thon: true,
        userId: true,
        createdAt: true,
        cycleObjectifGlobalRubriqueId: true,
        CycleObjectifGlobalRubrique: {
          select: {
            id: true,
            titreCycle: true,
            rubriqueId: true,
            RubriqueObjectifGlobal: { select: { rubrique: true } },
          },
        },
        User: { select: { firstName: true, lastName: true, role: true } },
      },
    });
    revalidateObjectifs();
    return { success: true, data: mapObjectifGlobal(updated) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateObjectifGlobal error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour" };
  }
}

type ActionResultWithData<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getOrCreateDefaultCycleForRubriqueId(
  rubriqueObjectifGlobalId: string
): Promise<ActionResultWithData<{ cycleId: string }>> {
  try {
    const rubrique = await prisma.rubriqueObjectifGlobal.findUnique({
      where: { id: rubriqueObjectifGlobalId },
      select: { id: true },
    });
    if (!rubrique) {
      return { success: false, error: "Rubrique introuvable." };
    }

    const existing = await prisma.cycleObjectifGlobalRubrique.findFirst({
      where: { rubriqueId: rubrique.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existing) return { success: true, data: { cycleId: existing.id } };

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1);

    const created = await prisma.cycleObjectifGlobalRubrique.create({
      data: {
        rubriqueId: rubrique.id,
        titreCycle: `Cycle ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        dateDebutCycle: start,
        dateFinCycle: end,
      },
      select: { id: true },
    });

    return { success: true, data: { cycleId: created.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message || "Erreur lors de la création du cycle." };
  }
}

export async function deleteObjectifGlobal(id: string): Promise<ActionResult> {
  if (!id?.trim()) return { success: false, error: "Identifiant requis." };
  try {
    await prisma.objectifGlobal.delete({ where: { id } });
    revalidateObjectifs();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deleteObjectifGlobal error:", error);
    return { success: false, error: message || "Erreur lors de la suppression" };
  }
}
