"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { prisma } from "../prisma";

const ACTIVITES_ROUTINEES_PATH = "/communication/activites-routinees";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COMMERCIAL: "Commercial",
  CHEFUSINE: "Chef d'usine",
  CHEFEQUIPE: "Chef d'équipe",
  MAGASINIER: "Magasinier",
  RH: "Ressources humaines",
  JURIDIQUE: "Juridique",
  CHEFQUALITE: "Chef qualité",
  EMPLOYEE: "Employé",
  SAV: "SAV",
  LOGISTIQUE: "Logistique",
  FINANCE: "Finance",
  DIRECTEUR_GENERAL: "Directeur général",
  CLIENTELLE: "Clientèle",
  COMPTABLE: "Comptable",
  CONCESSIONAIRE: "Concessionnaire",
  SUPERVISEUR: "Superviseur",
  COMMUNICATION: "Communication",
  RESPONSABLE_COMMERCIAL: "Responsable commercial",
  ASSISTANTE: "Assistante",
  INFOGRAPHIE: "Infographie",
  COMMUNITY_MANAGER: "Community manager",
  MARKETING: "Marketing",
  DEVELOPPEUR: "Développeur",
  DESIGNER: "Designer",
};

function roleToLibelle(role: string, poste?: string | null): string {
  const trimmedPoste = poste?.trim();
  if (trimmedPoste) return trimmedPoste;
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").toLowerCase();
}

export type UserForRoleMissionOption = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department: string;
};

export type RoleMissionResponsableItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
};

export type RoleMissionProjetRoutineListItem = {
  id: string;
  libelle: string;
  description: string | null;
  createdAt: string;
  responsables: RoleMissionResponsableItem[];
};

function revalidateActivitesRoutineesPath() {
  try {
    revalidatePath(ACTIVITES_ROUTINEES_PATH);
  } catch {
    // ignore
  }
}

export async function getUsersForRoleMission(): Promise<
  | { success: true; users: UserForRoleMissionOption[] }
  | { success: false; users: []; error: string }
> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        department: true,
        Employee: {
          select: { poste: true },
          take: 1,
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return {
      success: true,
      users: users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role,
        roleLabel: roleToLibelle(user.role, user.Employee[0]?.poste),
        department: user.department?.trim() || "Non renseigné",
      })),
    };
  } catch (error) {
    console.error("getUsersForRoleMission error:", error);
    return {
      success: false,
      users: [],
      error: error instanceof Error ? error.message : "Erreur lors du chargement des utilisateurs.",
    };
  }
}

function isRoleLevelResponsable(responsable: {
  activiteProjetRoutineId?: string | null;
  tacheActiviteProjetRoutineId?: string | null;
}) {
  return responsable.activiteProjetRoutineId == null && responsable.tacheActiviteProjetRoutineId == null;
}

export async function getRoleMissionsProjetRoutine(): Promise<
  | { success: true; roles: RoleMissionProjetRoutineListItem[] }
  | { success: false; roles: []; error: string }
> {
  try {
    const rows = await prisma.roleMissionProjetRoutine.findMany({
      orderBy: { createdAt: "desc" },
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

    return {
      success: true,
      roles: rows.map((row) => ({
        id: row.id,
        libelle: row.libelle,
        description: row.description,
        createdAt: row.createdAt.toISOString(),
        responsables: row.responsableProjetRoutine
          .filter(isRoleLevelResponsable)
          .map((r) => ({
          id: r.id,
          userId: r.user.id,
          userName: `${r.user.firstName} ${r.user.lastName}`.trim(),
          userEmail: r.user.email,
          userRole: r.user.role,
        })),
      })),
    };
  } catch (error) {
    console.error("getRoleMissionsProjetRoutine error:", error);
    return {
      success: false,
      roles: [],
      error: error instanceof Error ? error.message : "Erreur lors du chargement des rôles.",
    };
  }
}

export type CreateRoleMissionInput = {
  userId: string;
  description?: string;
};

export async function createRoleMissionProjetRoutine(
  input: CreateRoleMissionInput
): Promise<
  | { success: true; role: RoleMissionProjetRoutineListItem }
  | { success: false; error: string }
> {
  const userId = input.userId?.trim();
  if (!userId) {
    return { success: false, error: "Sélectionnez un responsable." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        Employee: {
          select: { poste: true },
          take: 1,
        },
      },
    });

    if (!user) {
      return { success: false, error: "Utilisateur introuvable." };
    }

    const libelle = roleToLibelle(user.role, user.Employee[0]?.poste);
    const description = input.description?.trim() || null;

    const existingLinks = await prisma.responsableProjetRoutine.findMany({
      where: {
        userId: user.id,
        roleMissionProjetRoutine: { libelle },
      },
      select: {
        id: true,
        activiteProjetRoutineId: true,
        tacheActiviteProjetRoutineId: true,
      },
    });

    const existing = existingLinks.find(isRoleLevelResponsable);

    if (existing) {
      return {
        success: false,
        error: "Ce responsable est déjà associé à un rôle avec ce libellé.",
      };
    }

    const created = await prisma.$transaction(async (tx) => {
      const roleMission = await tx.roleMissionProjetRoutine.create({
        data: {
          libelle,
          description,
        },
      });

      const responsable = await tx.responsableProjetRoutine.create({
        data: {
          user: { connect: { id: user.id } },
          roleMissionProjetRoutine: { connect: { id: roleMission.id } },
        },
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
      });

      return { roleMission, responsable };
    });

    revalidateActivitesRoutineesPath();

    return {
      success: true,
      role: {
        id: created.roleMission.id,
        libelle: created.roleMission.libelle,
        description: created.roleMission.description,
        createdAt: created.roleMission.createdAt.toISOString(),
        responsables: [
          {
            id: created.responsable.id,
            userId: created.responsable.user.id,
            userName: `${created.responsable.user.firstName} ${created.responsable.user.lastName}`.trim(),
            userEmail: created.responsable.user.email,
            userRole: created.responsable.user.role,
          },
        ],
      },
    };
  } catch (error) {
    console.error("createRoleMissionProjetRoutine error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création du rôle.",
    };
  }
}

export async function deleteRoleMissionProjetRoutine(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await prisma.roleMissionProjetRoutine.delete({ where: { id } });
    revalidateActivitesRoutineesPath();
    return { success: true };
  } catch (error) {
    console.error("deleteRoleMissionProjetRoutine error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la suppression.",
    };
  }
}
