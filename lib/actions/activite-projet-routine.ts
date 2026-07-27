"use server";

import { revalidatePath } from "next/cache";
import type { StatutActiviteProjetRoutine, UserRole } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "../prisma";

const ACTIVITES_ROUTINEES_PATH = "/communication/activites-routinees";

function isRoleLevelResponsable(responsable: {
  activiteProjetRoutineId?: string | null;
  tacheActiviteProjetRoutineId?: string | null;
}) {
  return responsable.activiteProjetRoutineId == null && responsable.tacheActiviteProjetRoutineId == null;
}

export type ActiviteResponsableItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
};

export type ActiviteProjetRoutineListItem = {
  id: string;
  libelle: string;
  description: string | null;
  dateDebut: string;
  dateCloture: string | null;
  mois: string | null;
  statutActivite: StatutActiviteProjetRoutine;
  roleMissionProjetRoutineId: string;
  roleMissionLibelle: string;
  responsable: ActiviteResponsableItem | null;
  tachesCount: number;
};

function revalidateActivitesRoutineesPath() {
  try {
    revalidatePath(ACTIVITES_ROUTINEES_PATH);
  } catch {
    // ignore
  }
}

function mapResponsableFromRole(
  responsables: Array<{
    activiteProjetRoutineId?: string | null;
    tacheActiviteProjetRoutineId?: string | null;
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: UserRole;
    };
  }>
): ActiviteResponsableItem | null {
  const responsable = responsables.find(isRoleLevelResponsable);
  if (!responsable) return null;

  return {
    id: responsable.id,
    userId: responsable.user.id,
    userName: `${responsable.user.firstName} ${responsable.user.lastName}`.trim(),
    userEmail: responsable.user.email,
    userRole: responsable.user.role,
  };
}

function serializeActivite(row: {
  id: string;
  libelle: string;
  description: string | null;
  dateDebut: Date;
  dateCloture: Date | null;
  mois: string | null;
  statutActivite: StatutActiviteProjetRoutine;
  roleMissionProjetRoutineId: string;
  roleMissionProjetRoutine: {
    libelle: string;
    responsableProjetRoutine: Array<{
      activiteProjetRoutineId?: string | null;
      tacheActiviteProjetRoutineId?: string | null;
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
      };
    }>;
  };
  _count?: { tacheActiviteProjetRoutine: number };
}): ActiviteProjetRoutineListItem {
  return {
    id: row.id,
    libelle: row.libelle,
    description: row.description,
    dateDebut: row.dateDebut.toISOString(),
    dateCloture: row.dateCloture ? row.dateCloture.toISOString() : null,
    mois: row.mois,
    statutActivite: row.statutActivite,
    roleMissionProjetRoutineId: row.roleMissionProjetRoutineId,
    roleMissionLibelle: row.roleMissionProjetRoutine.libelle,
    responsable: mapResponsableFromRole(row.roleMissionProjetRoutine.responsableProjetRoutine),
    tachesCount: row._count?.tacheActiviteProjetRoutine ?? 0,
  };
}

export async function getActivitesProjetRoutine(): Promise<
  | { success: true; activites: ActiviteProjetRoutineListItem[] }
  | { success: false; activites: []; error: string }
> {
  try {
    const rows = await prisma.activiteProjetRoutine.findMany({
      orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
      include: {
        roleMissionProjetRoutine: {
          include: {
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
        _count: { select: { tacheActiviteProjetRoutine: true } },
      },
    });

    return {
      success: true,
      activites: rows.map(serializeActivite),
    };
  } catch (error) {
    console.error("getActivitesProjetRoutine error:", error);
    return {
      success: false,
      activites: [],
      error: error instanceof Error ? error.message : "Erreur lors du chargement des activités.",
    };
  }
}

export type CreateActiviteProjetRoutineInput = {
  libelle: string;
  description?: string;
  dateDebut: string;
  dateCloture?: string | null;
  mois?: string | null;
  statutActivite?: StatutActiviteProjetRoutine;
};

export type CreateActiviteProjetRoutineBatchInput = {
  roleMissionProjetRoutineId: string;
  activites: CreateActiviteProjetRoutineInput[];
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

function moisFromDate(date: Date): string {
  return format(date, "MMMM yyyy", { locale: fr });
}

export async function createActiviteProjetRoutineBatch(
  input: CreateActiviteProjetRoutineBatchInput
): Promise<
  | { success: true; activites: ActiviteProjetRoutineListItem[]; createdCount: number }
  | { success: false; error: string }
> {
  const roleMissionProjetRoutineId = input.roleMissionProjetRoutineId?.trim();
  if (!roleMissionProjetRoutineId) {
    return { success: false, error: "Sélectionnez un rôle et mission." };
  }
  if (!input.activites?.length) {
    return { success: false, error: "Ajoutez au moins une activité." };
  }

  try {
    const roleMission = await prisma.roleMissionProjetRoutine.findUnique({
      where: { id: roleMissionProjetRoutineId },
      include: {
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
    });

    if (!roleMission) {
      return { success: false, error: "Rôle et mission introuvable." };
    }

    const payloads = input.activites.map((item, index) => {
      const libelle = item.libelle?.trim();
      if (!libelle) {
        throw new Error(`Activité ${index + 1} : le libellé est obligatoire.`);
      }

      const dateDebut = parseDate(item.dateDebut, `Activité ${index + 1} — date de début`);
      if (!dateDebut) {
        throw new Error(`Activité ${index + 1} : la date de début est obligatoire.`);
      }

      let dateCloture: Date | null = null;
      if (item.dateCloture?.trim()) {
        dateCloture = parseDate(item.dateCloture, `Activité ${index + 1} — date de clôture`);
      }

      if (dateCloture && dateCloture < dateDebut) {
        throw new Error(
          `Activité ${index + 1} : la date de clôture doit être postérieure à la date de début.`
        );
      }

      const mois = item.mois?.trim() || moisFromDate(dateDebut);

      return {
        libelle,
        description: item.description?.trim() || null,
        dateDebut,
        dateCloture,
        mois,
        statutActivite: item.statutActivite ?? ("NOUVEAU" as StatutActiviteProjetRoutine),
        roleMissionProjetRoutine: { connect: { id: roleMissionProjetRoutineId } },
      };
    });

    const createdRows = await prisma.$transaction(
      payloads.map((data) =>
        prisma.activiteProjetRoutine.create({
          data,
          include: {
            roleMissionProjetRoutine: {
              include: {
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
            _count: { select: { tacheActiviteProjetRoutine: true } },
          },
        })
      )
    );

    revalidateActivitesRoutineesPath();

    return {
      success: true,
      createdCount: createdRows.length,
      activites: createdRows.map(serializeActivite),
    };
  } catch (error) {
    console.error("createActiviteProjetRoutineBatch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création des activités.",
    };
  }
}

export async function deleteActiviteProjetRoutine(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.activiteProjetRoutine.delete({ where: { id } });
    revalidateActivitesRoutineesPath();
    return { success: true };
  } catch (error) {
    console.error("deleteActiviteProjetRoutine error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la suppression.",
    };
  }
}
