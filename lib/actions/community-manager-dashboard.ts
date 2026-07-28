"use server";

import type {
  StatutActiviteProjetRoutine,
  StatutProjetPonctuel,
  StatutTacheActiviteProjetRoutine,
} from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";
import type { StatutProjetPonctuelActivite } from "../projet-ponctuel-activite-statut";

export type CmDashboardPerson = {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type CmProjetPonctuelItem = {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateCloture: string | null;
  statutProjet: StatutProjetPonctuel;
  responsables: CmDashboardPerson[];
};

export type CmProjetPonctuelActiviteItem = {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateCloture: string | null;
  statutActivite: StatutProjetPonctuelActivite;
  projetId: string;
  projetTitre: string;
  responsables: CmDashboardPerson[];
};

export type CmActiviteRoutineItem = {
  id: string;
  libelle: string;
  description: string | null;
  dateDebut: string;
  dateCloture: string | null;
  mois: string | null;
  statutActivite: StatutActiviteProjetRoutine;
  roleMissionLibelle: string;
  responsables: CmDashboardPerson[];
};

export type CmTacheRoutineItem = {
  id: string;
  libelle: string;
  description: string | null;
  dateDebut: string;
  dateCloture: string | null;
  statutTache: StatutTacheActiviteProjetRoutine;
  activiteLibelle: string;
  roleMissionLibelle: string;
  responsables: CmDashboardPerson[];
};

export type CommunityManagerDashboardData = {
  projetsPonctuels: CmProjetPonctuelItem[];
  activitesPonctuelles: CmProjetPonctuelActiviteItem[];
  activitesRoutine: CmActiviteRoutineItem[];
  tachesRoutine: CmTacheRoutineItem[];
};

function toPerson(user: {
  id: string;
  firstName: string;
  lastName: string;
}): CmDashboardPerson {
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
  };
}

function emptyData(): CommunityManagerDashboardData {
  return {
    projetsPonctuels: [],
    activitesPonctuelles: [],
    activitesRoutine: [],
    tachesRoutine: [],
  };
}

export async function getCommunityManagerDashboard(
  clerkUserId?: string
): Promise<
  | { success: true; data: CommunityManagerDashboardData }
  | { success: false; error: string; data: CommunityManagerDashboardData }
> {
  const empty = emptyData();

  try {
    const clerkId =
      clerkUserId ?? (await auth()).userId ?? undefined;
    if (!clerkId) {
      return { success: false, error: "Non authentifié", data: empty };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error ?? "Utilisateur introuvable.",
        data: empty,
      };
    }

    const userId = userResult.data.id;
    const currentUserPerson = toPerson({
      id: userResult.data.id,
      firstName: userResult.data.firstName,
      lastName: userResult.data.lastName,
    });

    const [projets, activitesPonctuelles, activitesRoutine, tachesRoutine] =
      await Promise.all([
        // Only projets where the current user is assigned as responsable
        prisma.projetPonctuel.findMany({
          where: {
            responsableResponsable: { some: { userId } },
          },
          orderBy: { createdAt: "desc" },
          include: {
            responsableResponsable: {
              where: { userId },
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        }),
        // Only activités where the current user is assigned as responsable
        prisma.projetPonctuelActivite.findMany({
          where: {
            responsableResponsable: { some: { userId } },
          },
          orderBy: { createdAt: "desc" },
          include: {
            projetPonctuel: { select: { id: true, titre: true } },
            responsableResponsable: {
              where: { userId },
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        }),
        // Only routine activités where the current user is directly assigned
        // (or has at least one tâche assigned) — not all activités of a role mission
        prisma.activiteProjetRoutine.findMany({
          where: {
            OR: [
              {
                responsableProjetRoutine: {
                  some: {
                    userId,
                    activiteProjetRoutineId: { not: null },
                  },
                },
              },
              {
                tacheActiviteProjetRoutine: {
                  some: {
                    responsableTacheResponsable: { some: { userId } },
                  },
                },
              },
            ],
          },
          orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
          include: {
            roleMissionProjetRoutine: { select: { libelle: true } },
            responsableProjetRoutine: {
              where: { userId },
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        }),
        // Only tâches where the current user is assigned as responsable
        prisma.tacheActiviteProjetRoutine.findMany({
          where: {
            responsableTacheResponsable: { some: { userId } },
          },
          orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
          include: {
            activiteProjetRoutine: {
              select: {
                libelle: true,
                roleMissionProjetRoutine: { select: { libelle: true } },
              },
            },
            responsableTacheResponsable: {
              where: { userId },
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        }),
      ]);

    const projetsMap = new Map<string, CmProjetPonctuelItem>();
    for (const projet of projets) {
      projetsMap.set(projet.id, {
        id: projet.id,
        titre: projet.titre,
        description: projet.description,
        dateDebut: projet.dateDebut.toISOString(),
        dateCloture: projet.dateCloture?.toISOString() ?? null,
        statutProjet: projet.statutProjet,
        responsables: [currentUserPerson],
      });
    }

    const data: CommunityManagerDashboardData = {
      projetsPonctuels: Array.from(projetsMap.values()),
      activitesPonctuelles: activitesPonctuelles.map((activite) => ({
        id: activite.id,
        titre: activite.titre,
        description: activite.description,
        dateDebut: activite.dateDebut.toISOString(),
        dateCloture: activite.dateCloture?.toISOString() ?? null,
        statutActivite: activite.statutActivite as StatutProjetPonctuelActivite,
        projetId: activite.projetPonctuel.id,
        projetTitre: activite.projetPonctuel.titre,
        responsables: [currentUserPerson],
      })),
      activitesRoutine: activitesRoutine.map((activite) => ({
        id: activite.id,
        libelle: activite.libelle,
        description: activite.description,
        dateDebut: activite.dateDebut.toISOString(),
        dateCloture: activite.dateCloture?.toISOString() ?? null,
        mois: activite.mois,
        statutActivite: activite.statutActivite,
        roleMissionLibelle: activite.roleMissionProjetRoutine.libelle,
        responsables: [currentUserPerson],
      })),
      tachesRoutine: tachesRoutine.map((tache) => ({
        id: tache.id,
        libelle: tache.libelle,
        description: tache.description,
        dateDebut: tache.dateDebut.toISOString(),
        dateCloture: tache.dateCloture?.toISOString() ?? null,
        statutTache: tache.statutTache,
        activiteLibelle: tache.activiteProjetRoutine.libelle,
        roleMissionLibelle:
          tache.activiteProjetRoutine.roleMissionProjetRoutine.libelle,
        responsables: [currentUserPerson],
      })),
    };

    return { success: true, data };
  } catch (error) {
    console.error("getCommunityManagerDashboard error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement du tableau de bord.",
      data: empty,
    };
  }
}
