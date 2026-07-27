"use server";

import type {
  StatutActiviteProjetRoutine,
  StatutProjetPonctuel,
  StatutTacheActiviteProjetRoutine,
} from "@prisma/client";
import { prisma } from "../prisma";
import type { StatutProjetPonctuelActivite } from "../projet-ponctuel-activite-statut";

export type IndicateurPerson = {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type IndicateurProjetPonctuelItem = {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateCloture: string | null;
  statutProjet: StatutProjetPonctuel;
  responsables: IndicateurPerson[];
};

export type IndicateurProjetPonctuelActiviteItem = {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateCloture: string | null;
  statutActivite: StatutProjetPonctuelActivite;
  projetId: string;
  projetTitre: string;
  responsables: IndicateurPerson[];
};

export type IndicateurActiviteRoutineItem = {
  id: string;
  libelle: string;
  description: string | null;
  dateDebut: string;
  dateCloture: string | null;
  mois: string | null;
  statutActivite: StatutActiviteProjetRoutine;
  roleMissionLibelle: string;
  responsable: IndicateurPerson | null;
};

export type IndicateurTacheRoutineItem = {
  id: string;
  libelle: string;
  description: string | null;
  dateDebut: string;
  dateCloture: string | null;
  statutTache: StatutTacheActiviteProjetRoutine;
  activiteLibelle: string;
  roleMissionLibelle: string;
  responsables: IndicateurPerson[];
};

export type CommunicationIndicateursData = {
  projetsPonctuels: IndicateurProjetPonctuelItem[];
  activitesPonctuelles: IndicateurProjetPonctuelActiviteItem[];
  activitesRoutine: IndicateurActiviteRoutineItem[];
  tachesRoutine: IndicateurTacheRoutineItem[];
};

function toPerson(user: {
  id: string;
  firstName: string;
  lastName: string;
}): IndicateurPerson {
  return {
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
  };
}

function isRoleLevelResponsable(responsable: {
  activiteProjetRoutineId?: string | null;
  tacheActiviteProjetRoutineId?: string | null;
}) {
  return (
    responsable.activiteProjetRoutineId == null &&
    responsable.tacheActiviteProjetRoutineId == null
  );
}

export async function getCommunicationIndicateurs(): Promise<
  | { success: true; data: CommunicationIndicateursData }
  | { success: false; error: string; data: CommunicationIndicateursData }
> {
  const empty: CommunicationIndicateursData = {
    projetsPonctuels: [],
    activitesPonctuelles: [],
    activitesRoutine: [],
    tachesRoutine: [],
  };

  try {
    const [projets, activitesPonctuelles, activitesRoutine, tachesRoutine] =
      await Promise.all([
        prisma.projetPonctuel.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            responsableResponsable: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        }),
        prisma.projetPonctuelActivite.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            projetPonctuel: { select: { id: true, titre: true } },
            responsableResponsable: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        }),
        prisma.activiteProjetRoutine.findMany({
          orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
          include: {
            roleMissionProjetRoutine: {
              include: {
                responsableProjetRoutine: {
                  include: {
                    user: {
                      select: { id: true, firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.tacheActiviteProjetRoutine.findMany({
          orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
          include: {
            activiteProjetRoutine: {
              select: {
                libelle: true,
                roleMissionProjetRoutine: { select: { libelle: true } },
              },
            },
            responsableTacheResponsable: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        }),
      ]);

    const projetsMap = new Map<string, IndicateurProjetPonctuelItem>();
    for (const projet of projets) {
      const responsablesByUser = new Map<string, IndicateurPerson>();
      for (const row of projet.responsableResponsable) {
        responsablesByUser.set(row.user.id, toPerson(row.user));
      }
      projetsMap.set(projet.id, {
        id: projet.id,
        titre: projet.titre,
        description: projet.description,
        dateDebut: projet.dateDebut.toISOString(),
        dateCloture: projet.dateCloture?.toISOString() ?? null,
        statutProjet: projet.statutProjet,
        responsables: Array.from(responsablesByUser.values()),
      });
    }

    const data: CommunicationIndicateursData = {
      projetsPonctuels: Array.from(projetsMap.values()),
      activitesPonctuelles: activitesPonctuelles.map((activite) => {
        const responsablesByUser = new Map<string, IndicateurPerson>();
        for (const row of activite.responsableResponsable) {
          responsablesByUser.set(row.user.id, toPerson(row.user));
        }
        return {
          id: activite.id,
          titre: activite.titre,
          description: activite.description,
          dateDebut: activite.dateDebut.toISOString(),
          dateCloture: activite.dateCloture?.toISOString() ?? null,
          statutActivite: activite.statutActivite as StatutProjetPonctuelActivite,
          projetId: activite.projetPonctuel.id,
          projetTitre: activite.projetPonctuel.titre,
          responsables: Array.from(responsablesByUser.values()),
        };
      }),
      activitesRoutine: activitesRoutine.map((activite) => {
        const roleResponsable =
          activite.roleMissionProjetRoutine.responsableProjetRoutine.find(
            isRoleLevelResponsable
          );
        return {
          id: activite.id,
          libelle: activite.libelle,
          description: activite.description,
          dateDebut: activite.dateDebut.toISOString(),
          dateCloture: activite.dateCloture?.toISOString() ?? null,
          mois: activite.mois,
          statutActivite: activite.statutActivite,
          roleMissionLibelle: activite.roleMissionProjetRoutine.libelle,
          responsable: roleResponsable ? toPerson(roleResponsable.user) : null,
        };
      }),
      tachesRoutine: tachesRoutine.map((tache) => {
        const responsablesByUser = new Map<string, IndicateurPerson>();
        for (const row of tache.responsableTacheResponsable) {
          responsablesByUser.set(row.user.id, toPerson(row.user));
        }
        return {
          id: tache.id,
          libelle: tache.libelle,
          description: tache.description,
          dateDebut: tache.dateDebut.toISOString(),
          dateCloture: tache.dateCloture?.toISOString() ?? null,
          statutTache: tache.statutTache,
          activiteLibelle: tache.activiteProjetRoutine.libelle,
          roleMissionLibelle:
            tache.activiteProjetRoutine.roleMissionProjetRoutine.libelle,
          responsables: Array.from(responsablesByUser.values()),
        };
      }),
    };

    return { success: true, data };
  } catch (error) {
    console.error("getCommunicationIndicateurs error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des indicateurs.",
      data: empty,
    };
  }
}
