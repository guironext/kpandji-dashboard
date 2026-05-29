"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import type { PublicationObjectifGlobalRubriqueStatus } from "@prisma/client";

const INFOGRAPHIE_OBJECTIFS_PATH = "/infographie/objectifs-principaux";
const INFOGRAPHIE_PUBLICATIONS_PATH = "/infographie/publications";
const COMMUNICATION_PERFORMANCES_PATH = "/communication/performances";

export type PublicationObjectifGlobalRubriqueItem = {
  id: string;
  titrePublication: string;
  dateDebutPublication: Date;
  dateFinPublication: Date;
  status: PublicationObjectifGlobalRubriqueStatus;
  objectifGlobalId: string;
  userId: string;
  rubriqueObjectifGlobalId: string | null;
  cycleObjectifGlobalRubriqueId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicationWithObjectifContext = PublicationObjectifGlobalRubriqueItem & {
  objectifTitle: string;
  rubrique: string;
};

export type PublicationValideeTaskItem = {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  orderIndex: number;
};

export type PublicationWithValideeTasks = PublicationWithObjectifContext & {
  valideeTasks: PublicationValideeTaskItem[];
};

export type InactivePublicationPerformanceItem = {
  id: string;
  titrePublication: string;
  dateDebutPublication: Date;
  dateFinPublication: Date;
  updatedAt: Date;
  objectifTitle: string;
  rubrique: string;
  userId: string;
  acteurName: string;
  acteurRole: string;
  monthKey: string;
  monthLabel: string;
};

export type InactivePublicationsByActeurGroup = {
  userId: string;
  acteurName: string;
  acteurRole: string;
  publications: InactivePublicationPerformanceItem[];
};

export type InactivePublicationsByMonthGroup = {
  monthKey: string;
  monthLabel: string;
  byActeur: InactivePublicationsByActeurGroup[];
  totalCount: number;
};

export type InactivePublicationsPerformanceData = {
  totalCount: number;
  byActeur: InactivePublicationsByActeurGroup[];
  byMonth: InactivePublicationsByMonthGroup[];
};

export type PublicationObjectifInput = {
  titrePublication: string;
  dateDebutPublication: Date;
  dateFinPublication: Date;
  status?: PublicationObjectifGlobalRubriqueStatus;
  rubriqueObjectifGlobalId?: string | null;
  cycleObjectifGlobalRubriqueId?: string | null;
};

function revalidatePublicationPaths() {
  for (const path of [
    INFOGRAPHIE_OBJECTIFS_PATH,
    INFOGRAPHIE_PUBLICATIONS_PATH,
    COMMUNICATION_PERFORMANCES_PATH,
  ]) {
    try {
      revalidatePath(path);
    } catch {
      // ignore
    }
  }
}

const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const monthIndex = Number(month) - 1;
  const label = MONTH_LABELS[monthIndex] ?? month;
  return `${label} ${year}`;
}

function mapInactivePublicationRow(row: {
  id: string;
  titrePublication: string;
  dateDebutPublication: Date;
  dateFinPublication: Date;
  updatedAt: Date;
  userId: string;
  User: { firstName: string; lastName: string; role: string };
  ObjectifGlobal: {
    objectif: string;
    CycleObjectifGlobalRubrique: null | {
      RubriqueObjectifGlobal: { rubrique: string };
    };
  };
  rubriqueObjectifGlobal: { rubrique: string } | null;
}): InactivePublicationPerformanceItem {
  const monthKey = monthKeyFromDate(row.dateFinPublication);
  return {
    id: row.id,
    titrePublication: row.titrePublication,
    dateDebutPublication: row.dateDebutPublication,
    dateFinPublication: row.dateFinPublication,
    updatedAt: row.updatedAt,
    objectifTitle: row.ObjectifGlobal.objectif,
    rubrique:
      row.rubriqueObjectifGlobal?.rubrique ??
      row.ObjectifGlobal.CycleObjectifGlobalRubrique?.RubriqueObjectifGlobal
        ?.rubrique ??
      "",
    userId: row.userId,
    acteurName: `${row.User.firstName} ${row.User.lastName}`.trim(),
    acteurRole: row.User.role,
    monthKey,
    monthLabel: monthLabelFromKey(monthKey),
  };
}

function prismaPublicationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("publicationObjectifGlobalRubrique") ||
    message.includes("does not exist") ||
    message.includes("Unknown model")
  ) {
    return "Client Prisma obsolète : arrêtez le serveur de dev, exécutez « npx prisma generate » puis relancez.";
  }
  return message || "Erreur lors de l'enregistrement de la publication.";
}

async function resolveUserIdFromClerk(clerkUserId: string): Promise<
  | { success: true; userId: string }
  | { success: false; error: string }
> {
  if (!clerkUserId?.trim()) {
    return { success: false, error: "Utilisateur non connecté." };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true },
  });

  if (!user) {
    return { success: false, error: "Utilisateur introuvable." };
  }

  return { success: true, userId: user.id };
}

export async function getPublicationsByObjectifId(
  objectifGlobalId: string
): Promise<
  | { success: true; publications: PublicationObjectifGlobalRubriqueItem[] }
  | { success: false; publications: []; error: string }
> {
  try {
    const publications = await prisma.publicationObjectifGlobalRubrique.findMany({
      where: { objectifGlobalId },
      orderBy: { dateDebutPublication: "asc" },
    });
    return { success: true, publications };
  } catch (error) {
    console.error("getPublicationsByObjectifId error:", error);
    return {
      success: false,
      publications: [],
      error: prismaPublicationErrorMessage(error),
    };
  }
}

export async function getPublicationsWithValideeTasksForClerkUser(
  clerkUserId: string
): Promise<
  | { success: true; publications: PublicationWithValideeTasks[] }
  | { success: false; publications: []; error: string }
> {
  const userResult = await resolveUserIdFromClerk(clerkUserId);
  if (!userResult.success) {
    return { success: false, publications: [], error: userResult.error };
  }

  try {
    const rows = await prisma.publicationObjectifGlobalRubrique.findMany({
      where: {
        userId: userResult.userId,
        status: "ACTIVE",
        tasks: { some: { stage: "VALIDEE" } },
      },
      orderBy: { dateDebutPublication: "desc" },
      include: {
        tasks: {
          where: { stage: "VALIDEE" },
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            orderIndex: true,
          },
        },
        ObjectifGlobal: {
          select: {
            objectif: true,
            CycleObjectifGlobalRubrique: {
              select: { RubriqueObjectifGlobal: { select: { rubrique: true } } },
            },
          },
        },
        rubriqueObjectifGlobal: { select: { rubrique: true } },
      },
    });

    const publications: PublicationWithValideeTasks[] = rows.map((row) => ({
      id: row.id,
      titrePublication: row.titrePublication,
      dateDebutPublication: row.dateDebutPublication,
      dateFinPublication: row.dateFinPublication,
      status: row.status,
      objectifGlobalId: row.objectifGlobalId,
      userId: row.userId,
      rubriqueObjectifGlobalId: row.rubriqueObjectifGlobalId,
      cycleObjectifGlobalRubriqueId: row.cycleObjectifGlobalRubriqueId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      objectifTitle: row.ObjectifGlobal.objectif,
      rubrique:
        row.rubriqueObjectifGlobal?.rubrique ??
        row.ObjectifGlobal.CycleObjectifGlobalRubrique?.RubriqueObjectifGlobal
          ?.rubrique ??
        "",
      valideeTasks: row.tasks,
    }));

    return { success: true, publications };
  } catch (error) {
    console.error("getPublicationsWithValideeTasksForClerkUser error:", error);
    return {
      success: false,
      publications: [],
      error: prismaPublicationErrorMessage(error),
    };
  }
}

export async function getPublicationsForClerkUser(
  clerkUserId: string
): Promise<
  | { success: true; publications: PublicationWithObjectifContext[] }
  | { success: false; publications: []; error: string }
> {
  const userResult = await resolveUserIdFromClerk(clerkUserId);
  if (!userResult.success) {
    return { success: false, publications: [], error: userResult.error };
  }

  try {
    const rows = await prisma.publicationObjectifGlobalRubrique.findMany({
      where: { userId: userResult.userId },
      orderBy: { dateDebutPublication: "desc" },
      include: {
        ObjectifGlobal: {
          select: {
            objectif: true,
            CycleObjectifGlobalRubrique: {
              select: { RubriqueObjectifGlobal: { select: { rubrique: true } } },
            },
          },
        },
        rubriqueObjectifGlobal: { select: { rubrique: true } },
      },
    });

    const publications: PublicationWithObjectifContext[] = rows.map((row) => ({
      id: row.id,
      titrePublication: row.titrePublication,
      dateDebutPublication: row.dateDebutPublication,
      dateFinPublication: row.dateFinPublication,
      status: row.status,
      objectifGlobalId: row.objectifGlobalId,
      userId: row.userId,
      rubriqueObjectifGlobalId: row.rubriqueObjectifGlobalId,
      cycleObjectifGlobalRubriqueId: row.cycleObjectifGlobalRubriqueId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      objectifTitle: row.ObjectifGlobal.objectif,
      rubrique:
        row.rubriqueObjectifGlobal?.rubrique ??
        row.ObjectifGlobal.CycleObjectifGlobalRubrique?.RubriqueObjectifGlobal
          ?.rubrique ??
        "",
    }));

    return { success: true, publications };
  } catch (error) {
    console.error("getPublicationsForClerkUser error:", error);
    return {
      success: false,
      publications: [],
      error: prismaPublicationErrorMessage(error),
    };
  }
}

export async function createPublicationForObjectif(
  clerkUserId: string,
  objectifGlobalId: string,
  input: PublicationObjectifInput
): Promise<
  | { success: true; publication: PublicationObjectifGlobalRubriqueItem }
  | { success: false; error: string }
> {
  const titre = input.titrePublication?.trim();
  if (!titre) {
    return { success: false, error: "Le titre de la publication est obligatoire." };
  }
  if (!objectifGlobalId?.trim()) {
    return { success: false, error: "Objectif requis." };
  }
  if (input.dateFinPublication < input.dateDebutPublication) {
    return {
      success: false,
      error: "La date de fin doit être après la date de début.",
    };
  }

  const userResult = await resolveUserIdFromClerk(clerkUserId);
  if (!userResult.success) {
    return { success: false, error: userResult.error };
  }

  try {
    const objectif = await prisma.objectifGlobal.findFirst({
      where: { id: objectifGlobalId, userId: userResult.userId },
      select: {
        id: true,
        cycleObjectifGlobalRubriqueId: true,
        CycleObjectifGlobalRubrique: {
          select: { rubriqueId: true },
        },
      },
    });

    if (!objectif) {
      return { success: false, error: "Objectif introuvable ou non autorisé." };
    }

    const rubriqueObjectifGlobalId =
      input.rubriqueObjectifGlobalId ??
      objectif.CycleObjectifGlobalRubrique?.rubriqueId ??
      null;

    const publication = await prisma.publicationObjectifGlobalRubrique.create({
      data: {
        titrePublication: titre,
        dateDebutPublication: input.dateDebutPublication,
        dateFinPublication: input.dateFinPublication,
        status: input.status ?? "ACTIVE",
        objectifGlobalId,
        userId: userResult.userId,
        rubriqueObjectifGlobalId,
        cycleObjectifGlobalRubriqueId:
          input.cycleObjectifGlobalRubriqueId ??
          objectif.cycleObjectifGlobalRubriqueId ??
          null,
      },
    });

    revalidatePublicationPaths();
    return { success: true, publication };
  } catch (error) {
    console.error("createPublicationForObjectif error:", error);
    return { success: false, error: prismaPublicationErrorMessage(error) };
  }
}

export async function updatePublicationForObjectif(
  publicationId: string,
  clerkUserId: string,
  input: PublicationObjectifInput
): Promise<
  | { success: true; publication: PublicationObjectifGlobalRubriqueItem }
  | { success: false; error: string }
> {
  const titre = input.titrePublication?.trim();
  if (!titre) {
    return { success: false, error: "Le titre de la publication est obligatoire." };
  }
  if (input.dateFinPublication < input.dateDebutPublication) {
    return {
      success: false,
      error: "La date de fin doit être après la date de début.",
    };
  }

  const userResult = await resolveUserIdFromClerk(clerkUserId);
  if (!userResult.success) {
    return { success: false, error: userResult.error };
  }

  try {
    const existing = await prisma.publicationObjectifGlobalRubrique.findFirst({
      where: { id: publicationId, userId: userResult.userId },
    });

    if (!existing) {
      return { success: false, error: "Publication introuvable ou non autorisée." };
    }

    const publication = await prisma.publicationObjectifGlobalRubrique.update({
      where: { id: publicationId },
      data: {
        titrePublication: titre,
        dateDebutPublication: input.dateDebutPublication,
        dateFinPublication: input.dateFinPublication,
        status: input.status ?? existing.status,
      },
    });

    revalidatePublicationPaths();
    return { success: true, publication };
  } catch (error) {
    console.error("updatePublicationForObjectif error:", error);
    return { success: false, error: prismaPublicationErrorMessage(error) };
  }
}

export async function getInactivePublicationsPerformanceData(): Promise<
  | { success: true; data: InactivePublicationsPerformanceData }
  | { success: false; error: string }
> {
  try {
    const rows = await prisma.publicationObjectifGlobalRubrique.findMany({
      where: { status: "INACTIVE" },
      orderBy: [{ dateFinPublication: "desc" }, { updatedAt: "desc" }],
      include: {
        User: {
          select: { firstName: true, lastName: true, role: true },
        },
        ObjectifGlobal: {
          select: {
            objectif: true,
            CycleObjectifGlobalRubrique: {
              select: { RubriqueObjectifGlobal: { select: { rubrique: true } } },
            },
          },
        },
        rubriqueObjectifGlobal: { select: { rubrique: true } },
      },
    });

    const publications = rows.map(mapInactivePublicationRow);

    const acteurMap = new Map<string, InactivePublicationsByActeurGroup>();
    for (const pub of publications) {
      const existing = acteurMap.get(pub.userId);
      if (existing) {
        existing.publications.push(pub);
      } else {
        acteurMap.set(pub.userId, {
          userId: pub.userId,
          acteurName: pub.acteurName,
          acteurRole: pub.acteurRole,
          publications: [pub],
        });
      }
    }

    const byActeur = Array.from(acteurMap.values()).sort((a, b) =>
      a.acteurName.localeCompare(b.acteurName, "fr")
    );

    const monthMap = new Map<string, InactivePublicationPerformanceItem[]>();
    for (const pub of publications) {
      const list = monthMap.get(pub.monthKey) ?? [];
      list.push(pub);
      monthMap.set(pub.monthKey, list);
    }

    const byMonth = Array.from(monthMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([monthKey, monthPublications]) => {
        const monthActeurMap = new Map<string, InactivePublicationsByActeurGroup>();
        for (const pub of monthPublications) {
          const existing = monthActeurMap.get(pub.userId);
          if (existing) {
            existing.publications.push(pub);
          } else {
            monthActeurMap.set(pub.userId, {
              userId: pub.userId,
              acteurName: pub.acteurName,
              acteurRole: pub.acteurRole,
              publications: [pub],
            });
          }
        }

        const monthLabel = monthLabelFromKey(monthKey);
        return {
          monthKey,
          monthLabel,
          byActeur: Array.from(monthActeurMap.values()).sort((a, b) =>
            a.acteurName.localeCompare(b.acteurName, "fr")
          ),
          totalCount: monthPublications.length,
        };
      });

    return {
      success: true,
      data: {
        totalCount: publications.length,
        byActeur,
        byMonth,
      },
    };
  } catch (error) {
    console.error("getInactivePublicationsPerformanceData error:", error);
    return {
      success: false,
      error: prismaPublicationErrorMessage(error),
    };
  }
}

export async function finishPublicationForClerkUser(
  publicationId: string,
  clerkUserId: string
): Promise<
  | { success: true; publication: PublicationObjectifGlobalRubriqueItem }
  | { success: false; error: string }
> {
  if (!publicationId?.trim()) {
    return { success: false, error: "Publication requise." };
  }

  const userResult = await resolveUserIdFromClerk(clerkUserId);
  if (!userResult.success) {
    return { success: false, error: userResult.error };
  }

  try {
    const existing = await prisma.publicationObjectifGlobalRubrique.findFirst({
      where: { id: publicationId, userId: userResult.userId },
    });

    if (!existing) {
      return { success: false, error: "Publication introuvable ou non autorisée." };
    }

    if (existing.status === "INACTIVE") {
      return { success: false, error: "Cette publication est déjà terminée." };
    }

    const publication = await prisma.publicationObjectifGlobalRubrique.update({
      where: { id: publicationId },
      data: { status: "INACTIVE" },
    });

    revalidatePublicationPaths();
    return { success: true, publication };
  } catch (error) {
    console.error("finishPublicationForClerkUser error:", error);
    return { success: false, error: prismaPublicationErrorMessage(error) };
  }
}
