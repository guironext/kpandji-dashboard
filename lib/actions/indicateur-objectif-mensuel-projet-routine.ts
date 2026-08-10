"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { prisma } from "../prisma";

const ACTIVITES_ROUTINEES_PATH = "/communication/activites-routinees";

function isRoleLevelResponsable(responsable: {
  activiteProjetRoutineId?: string | null;
  tacheActiviteProjetRoutineId?: string | null;
}) {
  return responsable.activiteProjetRoutineId == null && responsable.tacheActiviteProjetRoutineId == null;
}

export type ObjectifMensuelResponsableItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
};

export type IndicateurObjectifMensuelListItem = {
  id: string;
  libelle: string;
  description: string | null;
  objectifMensuel: string;
  nombreObjectifsMensuels: number;
  nombreObjectifsMensuelsAtteints: number;
  nombreObjectifsMensuelsNonAtteints: number;
  roleMissionProjetRoutineId: string;
  roleMissionLibelle: string;
  responsable: ObjectifMensuelResponsableItem | null;
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
): ObjectifMensuelResponsableItem | null {
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

export async function getIndicateursObjectifMensuelProjetRoutine(): Promise<
  | { success: true; objectifs: IndicateurObjectifMensuelListItem[] }
  | { success: false; objectifs: []; error: string }
> {
  try {
    const rows = await prisma.indicateurObjectifMensuelProjetRoutine.findMany({
      orderBy: { id: "desc" },
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
      },
    });

    return {
      success: true,
      objectifs: rows.map((row) => ({
        id: row.id,
        libelle: row.libelle,
        description: row.description,
        objectifMensuel: row.objectifMensuel,
        nombreObjectifsMensuels: row.nombreObjectifsMensuels,
        nombreObjectifsMensuelsAtteints: row.nombreObjectifsMensuelsAtteints,
        nombreObjectifsMensuelsNonAtteints: row.nombreObjectifsMensuelsNonAtteints,
        roleMissionProjetRoutineId: row.roleMissionProjetRoutineId,
        roleMissionLibelle: row.roleMissionProjetRoutine.libelle,
        responsable: mapResponsableFromRole(row.roleMissionProjetRoutine.responsableProjetRoutine),
      })),
    };
  } catch (error) {
    console.error("getIndicateursObjectifMensuelProjetRoutine error:", error);
    return {
      success: false,
      objectifs: [],
      error:
        error instanceof Error ? error.message : "Erreur lors du chargement des objectifs mensuels.",
    };
  }
}

export type CreateIndicateurObjectifMensuelInput = {
  roleMissionProjetRoutineId: string;
  libelle: string;
  description?: string;
  objectifMensuel: string;
  nombreObjectifsMensuels: number;
  nombreObjectifsMensuelsAtteints?: number;
  nombreObjectifsMensuelsNonAtteints?: number;
};

export type CreateIndicateurObjectifMensuelBatchInput = {
  roleMissionProjetRoutineId: string;
  objectifs: Omit<CreateIndicateurObjectifMensuelInput, "roleMissionProjetRoutineId">[];
};

export async function createIndicateurObjectifMensuelProjetRoutineBatch(
  input: CreateIndicateurObjectifMensuelBatchInput
): Promise<
  | { success: true; objectifs: IndicateurObjectifMensuelListItem[]; createdCount: number }
  | { success: false; error: string }
> {
  const roleMissionProjetRoutineId = input.roleMissionProjetRoutineId?.trim();
  if (!roleMissionProjetRoutineId) {
    return { success: false, error: "Sélectionnez un rôle et mission." };
  }
  if (!input.objectifs?.length) {
    return { success: false, error: "Ajoutez au moins un objectif mensuel." };
  }

  for (let i = 0; i < input.objectifs.length; i++) {
    const item = input.objectifs[i];
    if (!item.libelle?.trim()) {
      return { success: false, error: `Objectif ${i + 1} : le libellé est obligatoire.` };
    }
    if (!item.objectifMensuel?.trim()) {
      return { success: false, error: `Objectif ${i + 1} : l'objectif mensuel est obligatoire.` };
    }
    if (!Number.isFinite(item.nombreObjectifsMensuels) || item.nombreObjectifsMensuels < 0) {
      return {
        success: false,
        error: `Objectif ${i + 1} : le nombre d'objectifs doit être un entier positif.`,
      };
    }
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

    const responsable = mapResponsableFromRole(roleMission.responsableProjetRoutine);

    const createdRows = await prisma.$transaction(
      input.objectifs.map((item) =>
        prisma.indicateurObjectifMensuelProjetRoutine.create({
          data: {
            libelle: item.libelle.trim(),
            description: item.description?.trim() || null,
            objectifMensuel: item.objectifMensuel.trim(),
            nombreObjectifsMensuels: Math.round(item.nombreObjectifsMensuels),
            nombreObjectifsMensuelsAtteints: Math.round(item.nombreObjectifsMensuelsAtteints ?? 0),
            nombreObjectifsMensuelsNonAtteints: Math.round(
              item.nombreObjectifsMensuelsNonAtteints ?? 0
            ),
            roleMissionProjetRoutine: { connect: { id: roleMissionProjetRoutineId } },
          },
        })
      )
    );

    revalidateActivitesRoutineesPath();

    return {
      success: true,
      createdCount: createdRows.length,
      objectifs: createdRows.map((created) => ({
        id: created.id,
        libelle: created.libelle,
        description: created.description,
        objectifMensuel: created.objectifMensuel,
        nombreObjectifsMensuels: created.nombreObjectifsMensuels,
        nombreObjectifsMensuelsAtteints: created.nombreObjectifsMensuelsAtteints,
        nombreObjectifsMensuelsNonAtteints: created.nombreObjectifsMensuelsNonAtteints,
        roleMissionProjetRoutineId: created.roleMissionProjetRoutineId,
        roleMissionLibelle: roleMission.libelle,
        responsable,
      })),
    };
  } catch (error) {
    console.error("createIndicateurObjectifMensuelProjetRoutineBatch error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erreur lors de la création des objectifs mensuels.",
    };
  }
}

export async function createIndicateurObjectifMensuelProjetRoutine(
  input: CreateIndicateurObjectifMensuelInput
): Promise<
  | { success: true; objectif: IndicateurObjectifMensuelListItem }
  | { success: false; error: string }
> {
  const roleMissionProjetRoutineId = input.roleMissionProjetRoutineId?.trim();
  const libelle = input.libelle?.trim();
  const objectifMensuel = input.objectifMensuel?.trim();

  if (!roleMissionProjetRoutineId) {
    return { success: false, error: "Sélectionnez un rôle et mission." };
  }
  if (!libelle) {
    return { success: false, error: "Le libellé est obligatoire." };
  }
  if (!objectifMensuel) {
    return { success: false, error: "L'objectif mensuel est obligatoire." };
  }
  if (!Number.isFinite(input.nombreObjectifsMensuels) || input.nombreObjectifsMensuels < 0) {
    return { success: false, error: "Le nombre d'objectifs mensuels doit être un entier positif." };
  }

  const nombreObjectifsMensuelsAtteints = input.nombreObjectifsMensuelsAtteints ?? 0;
  const nombreObjectifsMensuelsNonAtteints = input.nombreObjectifsMensuelsNonAtteints ?? 0;

  if (nombreObjectifsMensuelsAtteints < 0 || nombreObjectifsMensuelsNonAtteints < 0) {
    return { success: false, error: "Les compteurs atteints / non atteints doivent être positifs." };
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

    const created = await prisma.indicateurObjectifMensuelProjetRoutine.create({
      data: {
        libelle,
        description: input.description?.trim() || null,
        objectifMensuel,
        nombreObjectifsMensuels: Math.round(input.nombreObjectifsMensuels),
        nombreObjectifsMensuelsAtteints: Math.round(nombreObjectifsMensuelsAtteints),
        nombreObjectifsMensuelsNonAtteints: Math.round(nombreObjectifsMensuelsNonAtteints),
        roleMissionProjetRoutine: { connect: { id: roleMissionProjetRoutineId } },
      },
    });

    revalidateActivitesRoutineesPath();

    return {
      success: true,
      objectif: {
        id: created.id,
        libelle: created.libelle,
        description: created.description,
        objectifMensuel: created.objectifMensuel,
        nombreObjectifsMensuels: created.nombreObjectifsMensuels,
        nombreObjectifsMensuelsAtteints: created.nombreObjectifsMensuelsAtteints,
        nombreObjectifsMensuelsNonAtteints: created.nombreObjectifsMensuelsNonAtteints,
        roleMissionProjetRoutineId: created.roleMissionProjetRoutineId,
        roleMissionLibelle: roleMission.libelle,
        responsable: mapResponsableFromRole(roleMission.responsableProjetRoutine),
      },
    };
  } catch (error) {
    console.error("createIndicateurObjectifMensuelProjetRoutine error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création de l'objectif mensuel.",
    };
  }
}

export async function deleteIndicateurObjectifMensuelProjetRoutine(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.indicateurObjectifMensuelProjetRoutine.delete({ where: { id } });
    revalidateActivitesRoutineesPath();
    return { success: true };
  } catch (error) {
    console.error("deleteIndicateurObjectifMensuelProjetRoutine error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la suppression.",
    };
  }
}
