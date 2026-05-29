"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import type { PlanActionTaskStage as PrismaPlanActionTaskStage } from "@prisma/client";
import type { TaskStageId } from "@/lib/plan-action-task-stage";

export type ObjectifGlobalTaskStage = TaskStageId;

export type ObjectifGlobalTaskItem = {
  id: string;
  objectifId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  stage: ObjectifGlobalTaskStage;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ObjectifGlobalTaskWithContext = ObjectifGlobalTaskItem & {
  objectifTitle: string;
  rubrique: string;
};

export type ObjectifGlobalTaskInput = {
  title: string;
  startDate: Date;
  endDate: Date;
  stage?: ObjectifGlobalTaskStage;
  orderIndex?: number;
};

export type ObjectifGlobalTaskUpsertInput = ObjectifGlobalTaskInput & {
  id?: string;
};

function revalidateObjectifPaths() {
  for (const path of [
    "/communication/objectifs-principaux",
    "/infographie/objectifs-principaux",
    "/infographie/publications",
  ]) {
    try {
      revalidatePath(path);
    } catch {
      // ignore
    }
  }
}

const ROLE_LABELS: Record<string, string> = {
  COMMUNICATION: "Communication",
  INFOGRAPHIE: "Infographie",
  COMMERCIAL: "Commercial",
  COMMUNITY_MANAGER: "Community manager",
};

function roleToJob(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").toLowerCase();
}

function prismaTaskErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("objectifGlobalTask") ||
    message.includes("does not exist") ||
    message.includes("Unknown model") ||
    message.includes("Cannot read properties of undefined (reading 'findMany')")
  ) {
    return "Client Prisma obsolète : arrêtez le serveur de dev, exécutez « npx prisma generate » puis relancez.";
  }
  return message || "Erreur lors du chargement des tâches.";
}

export async function getTasksByObjectifId(
  objectifId: string
): Promise<
  | { success: true; tasks: ObjectifGlobalTaskItem[] }
  | { success: false; tasks: []; error: string }
> {
  try {
    const tasks = await prisma.objectifGlobalTask.findMany({
      where: { objectifId },
      orderBy: { orderIndex: "asc" },
    });
    return { success: true, tasks };
  } catch (error) {
    console.error("getTasksByObjectifId error:", error);
    return { success: false, tasks: [], error: prismaTaskErrorMessage(error) };
  }
}

export async function getTasksByPublicationId(
  publicationId: string
): Promise<
  | { success: true; tasks: ObjectifGlobalTaskItem[] }
  | { success: false; tasks: []; error: string }
> {
  try {
    const tasks = await prisma.objectifGlobalTask.findMany({
      where: { publicationObjectifGlobalRubriqueId: publicationId },
      orderBy: { orderIndex: "asc" },
    });
    return { success: true, tasks };
  } catch (error) {
    console.error("getTasksByPublicationId error:", error);
    return { success: false, tasks: [], error: prismaTaskErrorMessage(error) };
  }
}

export async function saveTasksForObjectif(
  objectifId: string,
  tasks: ObjectifGlobalTaskInput[]
): Promise<{ success: true; tasks: ObjectifGlobalTaskItem[] } | { success: false; error: string }> {
  const validTasks = tasks.filter((t) => t.title.trim());
  for (const t of validTasks) {
    if (t.endDate < t.startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début pour chaque tâche.",
      };
    }
  }

  try {
    await prisma.objectifGlobalTask.deleteMany({ where: { objectifId } });

    if (validTasks.length === 0) {
      revalidateObjectifPaths();
      return { success: true, tasks: [] };
    }

    await prisma.objectifGlobalTask.createMany({
      data: validTasks.map((t, index) => ({
        objectifId,
        title: t.title.trim(),
        startDate: t.startDate,
        endDate: t.endDate,
        stage: (t.stage ?? "EN_ATTENTE_DEBUT") as PrismaPlanActionTaskStage,
        orderIndex: t.orderIndex ?? index,
      })),
    });

    const saved = await prisma.objectifGlobalTask.findMany({
      where: { objectifId },
      orderBy: { orderIndex: "asc" },
    });

    revalidateObjectifPaths();
    return { success: true, tasks: saved };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("saveTasksForObjectif error:", error);
    return { success: false, error: message || "Erreur lors de l'enregistrement des tâches." };
  }
}

export async function saveTasksForPublication(
  objectifId: string,
  publicationId: string,
  tasks: ObjectifGlobalTaskInput[]
): Promise<{ success: true; tasks: ObjectifGlobalTaskItem[] } | { success: false; error: string }> {
  const validTasks = tasks.filter((t) => t.title.trim());
  for (const t of validTasks) {
    if (t.endDate < t.startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début pour chaque tâche.",
      };
    }
  }

  try {
    await prisma.objectifGlobalTask.deleteMany({
      where: { publicationObjectifGlobalRubriqueId: publicationId },
    });

    if (validTasks.length === 0) {
      revalidateObjectifPaths();
      return { success: true, tasks: [] };
    }

    await prisma.objectifGlobalTask.createMany({
      data: validTasks.map((t, index) => ({
        objectifId,
        publicationObjectifGlobalRubriqueId: publicationId,
        title: t.title.trim(),
        startDate: t.startDate,
        endDate: t.endDate,
        stage: (t.stage ?? "EN_ATTENTE_DEBUT") as PrismaPlanActionTaskStage,
        orderIndex: t.orderIndex ?? index,
      })),
    });

    const saved = await prisma.objectifGlobalTask.findMany({
      where: { publicationObjectifGlobalRubriqueId: publicationId },
      orderBy: { orderIndex: "asc" },
    });

    revalidateObjectifPaths();
    return { success: true, tasks: saved };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("saveTasksForPublication error:", error);
    return { success: false, error: message || "Erreur lors de l'enregistrement des tâches." };
  }
}

export async function updateTasksForPublication(
  objectifId: string,
  publicationId: string,
  tasks: ObjectifGlobalTaskUpsertInput[]
): Promise<{ success: true; tasks: ObjectifGlobalTaskItem[] } | { success: false; error: string }> {
  const validTasks = tasks.filter((t) => t.title.trim());
  for (const t of validTasks) {
    if (t.endDate < t.startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début pour chaque tâche.",
      };
    }
  }

  try {
    const keptIds = validTasks.map((t) => t.id).filter((id): id is string => Boolean(id));

    await prisma.objectifGlobalTask.deleteMany({
      where: {
        publicationObjectifGlobalRubriqueId: publicationId,
        ...(keptIds.length > 0 ? { id: { notIn: keptIds } } : {}),
      },
    });

    for (let index = 0; index < validTasks.length; index++) {
      const t = validTasks[index];
      const data = {
        title: t.title.trim(),
        startDate: t.startDate,
        endDate: t.endDate,
        stage: (t.stage ?? "EN_ATTENTE_DEBUT") as PrismaPlanActionTaskStage,
        orderIndex: t.orderIndex ?? index,
        publicationObjectifGlobalRubriqueId: publicationId,
      };

      if (t.id) {
        const existing = await prisma.objectifGlobalTask.findFirst({
          where: {
            id: t.id,
            objectifId,
            publicationObjectifGlobalRubriqueId: publicationId,
          },
        });
        if (existing) {
          await prisma.objectifGlobalTask.update({
            where: { id: t.id },
            data,
          });
          continue;
        }
      }

      await prisma.objectifGlobalTask.create({
        data: { objectifId, ...data },
      });
    }

    const saved = await prisma.objectifGlobalTask.findMany({
      where: { publicationObjectifGlobalRubriqueId: publicationId },
      orderBy: { orderIndex: "asc" },
    });

    revalidateObjectifPaths();
    return { success: true, tasks: saved };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateTasksForPublication error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour des tâches." };
  }
}

export async function updateTasksForObjectif(
  objectifId: string,
  tasks: ObjectifGlobalTaskUpsertInput[]
): Promise<{ success: true; tasks: ObjectifGlobalTaskItem[] } | { success: false; error: string }> {
  const validTasks = tasks.filter((t) => t.title.trim());
  for (const t of validTasks) {
    if (t.endDate < t.startDate) {
      return {
        success: false,
        error: "La date de fin doit être après la date de début pour chaque tâche.",
      };
    }
  }

  try {
    const keptIds = validTasks.map((t) => t.id).filter((id): id is string => Boolean(id));

    await prisma.objectifGlobalTask.deleteMany({
      where: {
        objectifId,
        ...(keptIds.length > 0 ? { id: { notIn: keptIds } } : {}),
      },
    });

    for (let index = 0; index < validTasks.length; index++) {
      const t = validTasks[index];
      const data = {
        title: t.title.trim(),
        startDate: t.startDate,
        endDate: t.endDate,
        stage: (t.stage ?? "EN_ATTENTE_DEBUT") as PrismaPlanActionTaskStage,
        orderIndex: t.orderIndex ?? index,
      };

      if (t.id) {
        const existing = await prisma.objectifGlobalTask.findFirst({
          where: { id: t.id, objectifId },
        });
        if (existing) {
          await prisma.objectifGlobalTask.update({
            where: { id: t.id },
            data,
          });
          continue;
        }
      }

      await prisma.objectifGlobalTask.create({
        data: { objectifId, ...data },
      });
    }

    const saved = await prisma.objectifGlobalTask.findMany({
      where: { objectifId },
      orderBy: { orderIndex: "asc" },
    });

    revalidateObjectifPaths();
    return { success: true, tasks: saved };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateTasksForObjectif error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour des tâches." };
  }
}

export async function updateObjectifGlobalTaskStage(
  taskId: string,
  stage: ObjectifGlobalTaskStage
): Promise<
  | { success: true; task: ObjectifGlobalTaskItem }
  | { success: false; error: string }
> {
  try {
    const task = await prisma.objectifGlobalTask.update({
      where: { id: taskId },
      data: { stage: stage as PrismaPlanActionTaskStage },
    });
    revalidateObjectifPaths();
    return { success: true, task };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateObjectifGlobalTaskStage error:", error);
    return { success: false, error: message || "Erreur lors de la mise à jour de l'étape." };
  }
}

export async function getTasksForObjectifIds(
  objectifIds: string[]
): Promise<
  | { success: true; tasks: ObjectifGlobalTaskWithContext[] }
  | { success: false; tasks: []; error: string }
> {
  if (objectifIds.length === 0) {
    return { success: true, tasks: [] };
  }

  try {
    const rows = await prisma.objectifGlobalTask.findMany({
      where: { objectifId: { in: objectifIds } },
      orderBy: [{ objectifId: "asc" }, { orderIndex: "asc" }],
    });

    const objectifs = await prisma.objectifGlobal.findMany({
      where: { id: { in: objectifIds } },
      select: {
        id: true,
        objectif: true,
        CycleObjectifGlobalRubrique: {
          select: { RubriqueObjectifGlobal: { select: { rubrique: true } } },
        },
      },
    });

    const objectifById = new Map(objectifs.map((o) => [o.id, o]));

    const tasks: ObjectifGlobalTaskWithContext[] = rows.map((row) => {
      const objectif = objectifById.get(row.objectifId);
      return {
        ...row,
        objectifTitle: objectif?.objectif ?? "",
        rubrique:
          objectif?.CycleObjectifGlobalRubrique?.RubriqueObjectifGlobal?.rubrique ??
          "",
      };
    });

    return { success: true, tasks };
  } catch (error) {
    console.error("getTasksForObjectifIds error:", error);
    return { success: false, tasks: [], error: prismaTaskErrorMessage(error) };
  }
}

export async function getAllTasksForClerkUser(
  clerkUserId: string
): Promise<
  | { success: true; tasks: ObjectifGlobalTaskWithContext[] }
  | { success: false; error: string; tasks: [] }
> {
  if (!clerkUserId?.trim()) {
    return { success: false, error: "Utilisateur non connecté.", tasks: [] };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "Utilisateur introuvable.", tasks: [] };
    }

    const objectifs = await prisma.objectifGlobal.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const objectifIds = objectifs.map((o) => o.id);
    const tasksResult = await getTasksForObjectifIds(objectifIds);
    if (!tasksResult.success) {
      return {
        success: false,
        error: tasksResult.error ?? "Erreur lors du chargement des tâches.",
        tasks: [],
      };
    }

    return { success: true, tasks: tasksResult.tasks };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getAllTasksForClerkUser error:", error);
    return { success: false, error: message || "Erreur lors du chargement des tâches.", tasks: [] };
  }
}

export type ActeurWithObjectifGlobalTasks = {
  userId: string;
  name: string;
  email: string;
  role: string;
  job: string;
  department: string;
  tasks: ObjectifGlobalTaskWithContext[];
};

export type SerializedObjectifGlobalTask = {
  id: string;
  objectifId: string;
  title: string;
  startDate: string;
  endDate: string;
  stage: ObjectifGlobalTaskStage;
  orderIndex: number;
};

export type ObjectifGlobalMiseEnOeuvreObjectifGroup = {
  id: string;
  title: string;
  rubrique: string;
  startDate: string;
  endDate: string;
  assignedActors: {
    id: string;
    name: string;
    department: string;
    job: string;
  }[];
  tasks: SerializedObjectifGlobalTask[];
};

export type ObjectifGlobalMiseEnOeuvreActorGroup = {
  actor: {
    id: string;
    name: string;
    department: string;
    job: string;
  };
  objectifs: {
    id: string;
    title: string;
    rubrique: string;
    tasks: SerializedObjectifGlobalTask[];
  }[];
};

export type ObjectifGlobalMiseEnOeuvreData = {
  byObjectif: ObjectifGlobalMiseEnOeuvreObjectifGroup[];
  byActor: ObjectifGlobalMiseEnOeuvreActorGroup[];
};

const MISE_EN_OEUVRE_OBJECTIF_TASK_STAGE: ObjectifGlobalTaskStage = "EN_ATTENTE_VALIDATION";

type TaskUserRow = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  Employee: { poste: string | null }[];
};

type EnrichedObjectifGlobalTask = {
  task: SerializedObjectifGlobalTask;
  objectifId: string;
  objectifTitle: string;
  rubrique: string;
  actor: {
    id: string;
    name: string;
    department: string;
    job: string;
  };
};

function serializeDate(d: Date): string {
  return d instanceof Date ? d.toISOString() : String(d);
}

function mapActorFromUser(userId: string, user: TaskUserRow) {
  const poste = user.Employee[0]?.poste?.trim();
  return {
    id: userId,
    name: `${user.firstName} ${user.lastName}`.trim(),
    department: user.department?.trim() || "Non renseigné",
    job: poste || roleToJob(user.role),
  };
}

function buildMiseEnOeuvreData(enrichedTasks: EnrichedObjectifGlobalTask[]): ObjectifGlobalMiseEnOeuvreData {
  const objectifMap = new Map<
    string,
    {
      title: string;
      rubrique: string;
      tasks: SerializedObjectifGlobalTask[];
      actors: Map<string, EnrichedObjectifGlobalTask["actor"]>;
    }
  >();
  const actorMap = new Map<
    string,
    {
      actor: EnrichedObjectifGlobalTask["actor"];
      objectifs: Map<
        string,
        { title: string; rubrique: string; tasks: SerializedObjectifGlobalTask[] }
      >;
    }
  >();

  for (const entry of enrichedTasks) {
    const objectifGroup = objectifMap.get(entry.objectifId);
    if (objectifGroup) {
      objectifGroup.tasks.push(entry.task);
      objectifGroup.actors.set(entry.actor.id, entry.actor);
    } else {
      objectifMap.set(entry.objectifId, {
        title: entry.objectifTitle,
        rubrique: entry.rubrique,
        tasks: [entry.task],
        actors: new Map([[entry.actor.id, entry.actor]]),
      });
    }

    const actorGroup = actorMap.get(entry.actor.id);
    if (actorGroup) {
      const objectif = actorGroup.objectifs.get(entry.objectifId);
      if (objectif) {
        objectif.tasks.push(entry.task);
      } else {
        actorGroup.objectifs.set(entry.objectifId, {
          title: entry.objectifTitle,
          rubrique: entry.rubrique,
          tasks: [entry.task],
        });
      }
    } else {
      actorMap.set(entry.actor.id, {
        actor: entry.actor,
        objectifs: new Map([
          [
            entry.objectifId,
            {
              title: entry.objectifTitle,
              rubrique: entry.rubrique,
              tasks: [entry.task],
            },
          ],
        ]),
      });
    }
  }

  const byObjectif = Array.from(objectifMap.entries())
    .map(([id, group]) => {
      const startDate = group.tasks.reduce(
        (min, task) => (task.startDate < min ? task.startDate : min),
        group.tasks[0]?.startDate ?? new Date().toISOString()
      );
      const endDate = group.tasks.reduce(
        (max, task) => (task.endDate > max ? task.endDate : max),
        group.tasks[0]?.endDate ?? new Date().toISOString()
      );
      return {
        id,
        title: group.title,
        rubrique: group.rubrique,
        startDate,
        endDate,
        assignedActors: Array.from(group.actors.values()).sort((a, b) =>
          a.name.localeCompare(b.name, "fr")
        ),
        tasks: [...group.tasks].sort((a, b) => a.orderIndex - b.orderIndex),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));

  const byActor = Array.from(actorMap.values())
    .map((row) => ({
      actor: row.actor,
      objectifs: Array.from(row.objectifs.entries())
        .map(([id, objectif]) => ({
          id,
          title: objectif.title,
          rubrique: objectif.rubrique,
          tasks: [...objectif.tasks].sort((a, b) => a.orderIndex - b.orderIndex),
        }))
        .sort((a, b) => a.title.localeCompare(b.title, "fr")),
    }))
    .sort((a, b) => a.actor.name.localeCompare(b.actor.name, "fr"));

  return { byObjectif, byActor };
}

export async function getObjectifGlobalMiseEnOeuvreData(): Promise<
  | { success: true; data: ObjectifGlobalMiseEnOeuvreData; totalTasks: number }
  | { success: false; error: string; data: null; totalTasks: 0 }
> {
  try {
    const rows = await prisma.objectifGlobalTask.findMany({
      where: { stage: MISE_EN_OEUVRE_OBJECTIF_TASK_STAGE },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      include: {
        ObjectifGlobal: {
          select: {
            id: true,
            objectif: true,
            userId: true,
            User: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                department: true,
                Employee: { select: { poste: true }, take: 1 },
              },
            },
            CycleObjectifGlobalRubrique: {
              select: {
                RubriqueObjectifGlobal: { select: { rubrique: true } },
              },
            },
          },
        },
        PublicationObjectifGlobalRubrique: {
          select: {
            titrePublication: true,
            userId: true,
            User: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                department: true,
                Employee: { select: { poste: true }, take: 1 },
              },
            },
            ObjectifGlobal: {
              select: {
                id: true,
                objectif: true,
                CycleObjectifGlobalRubrique: {
                  select: {
                    RubriqueObjectifGlobal: { select: { rubrique: true } },
                  },
                },
              },
            },
            rubriqueObjectifGlobal: { select: { rubrique: true } },
          },
        },
      },
    });

    const enrichedTasks: EnrichedObjectifGlobalTask[] = [];

    for (const row of rows) {
      let userId: string | null = null;
      let user: TaskUserRow | null = null;
      let objectifId = row.objectifId;
      let objectifTitle = "";
      let rubrique = "";

      if (row.ObjectifGlobal) {
        userId = row.ObjectifGlobal.userId;
        user = row.ObjectifGlobal.User;
        objectifId = row.ObjectifGlobal.id;
        objectifTitle = row.ObjectifGlobal.objectif;
        rubrique =
          row.ObjectifGlobal.CycleObjectifGlobalRubrique?.RubriqueObjectifGlobal?.rubrique ?? "";
      } else if (row.PublicationObjectifGlobalRubrique) {
        const pub = row.PublicationObjectifGlobalRubrique;
        userId = pub.userId;
        user = pub.User;
        objectifId = pub.ObjectifGlobal?.id ?? row.objectifId;
        objectifTitle = pub.ObjectifGlobal?.objectif ?? pub.titrePublication;
        rubrique =
          pub.rubriqueObjectifGlobal?.rubrique ??
          pub.ObjectifGlobal?.CycleObjectifGlobalRubrique?.RubriqueObjectifGlobal?.rubrique ??
          "";
      }

      if (!userId || !user || !objectifId) continue;

      enrichedTasks.push({
        objectifId,
        objectifTitle,
        rubrique,
        actor: mapActorFromUser(userId, user),
        task: {
          id: row.id,
          objectifId,
          title: row.title,
          startDate: serializeDate(row.startDate),
          endDate: serializeDate(row.endDate),
          stage: row.stage as ObjectifGlobalTaskStage,
          orderIndex: row.orderIndex,
        },
      });
    }

    return {
      success: true,
      data: buildMiseEnOeuvreData(enrichedTasks),
      totalTasks: enrichedTasks.length,
    };
  } catch (error) {
    console.error("getObjectifGlobalMiseEnOeuvreData error:", error);
    return {
      success: false,
      error: prismaTaskErrorMessage(error),
      data: null,
      totalTasks: 0,
    };
  }
}

export async function getAllObjectifGlobalTasksGroupedByActeur(): Promise<
  | { success: true; acteurs: ActeurWithObjectifGlobalTasks[]; totalTasks: number }
  | { success: false; error: string; acteurs: []; totalTasks: 0 }
> {
  const result = await getObjectifGlobalMiseEnOeuvreData();
  if (!result.success || !result.data) {
    return { success: false, error: result.error, acteurs: [], totalTasks: 0 };
  }

  const acteurs: ActeurWithObjectifGlobalTasks[] = result.data.byActor.map((row) => ({
    userId: row.actor.id,
    name: row.actor.name,
    email: "",
    role: "",
    job: row.actor.job,
    department: row.actor.department,
    tasks: row.objectifs.flatMap((objectif) =>
      objectif.tasks.map((task) => ({
        id: task.id,
        objectifId: task.objectifId,
        title: task.title,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        stage: task.stage,
        orderIndex: task.orderIndex,
        createdAt: new Date(task.startDate),
        updatedAt: new Date(task.endDate),
        objectifTitle: objectif.title,
        rubrique: objectif.rubrique,
      }))
    ),
  }));

  return { success: true, acteurs, totalTasks: result.totalTasks };
}
