"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

// Guard: model may be missing until "npx prisma generate" is run after schema change
function getCommunicationProjectActorModel() {
  return (prisma as unknown as Record<string, unknown>).communicationProjectActor as
    | {
        findMany: (args: object) => Promise<unknown[]>;
        findUnique: (args: object) => Promise<unknown | null>;
        create: (args: object) => Promise<unknown>;
        delete: (args: object) => Promise<unknown>;
      }
    | undefined;
}

export type CommunicationProjectActor = {
  id: string;
  projectId: string;
  name: string;
  department: string;
  job: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserForActorOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name: string;
  department: string;
  job: string;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  COMMERCIAL: "Commercial",
  CHEFUSINE: "Chef d'usine",
  CHEFEQUIPE: "Chef d'équipe",
  MAGASINIER: "Magasinier",
  RH: "Ressources humaines",
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
};

function roleToJob(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").toLowerCase();
}

export type GetUsersForActorsResult =
  | { success: true; users: UserForActorOption[] }
  | { success: false; users: []; error: string };

export async function getUsersForProjectActors(): Promise<GetUsersForActorsResult> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        role: true,
        Employee: {
          select: { poste: true },
          take: 1,
        },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const options: UserForActorOption[] = users.map((user) => {
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
      };
    });

    return { success: true, users: options };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getUsersForProjectActors error:", error);
    return {
      success: false,
      users: [],
      error: message || "Erreur lors du chargement des utilisateurs",
    };
  }
}

export type CreateActorInput = {
  projectId: string;
  name: string;
  department: string;
  job: string;
};

export type CreateActorResult =
  | { success: true; actor: CommunicationProjectActor }
  | { success: false; error: string };

export async function createProjectActor(
  data: CreateActorInput
): Promise<CreateActorResult> {
  const model = getCommunicationProjectActorModel();
  if (!model) {
    return {
      success: false,
      error: "Modèle CommunicationProjectActor non disponible. Exécutez « npx prisma generate » puis « npx prisma migrate dev ».",
    };
  }

  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Le nom de l'acteur est obligatoire." };
  }

  if (!data.department || !data.department.trim()) {
    return { success: false, error: "Le département est obligatoire." };
  }

  if (!data.job || !data.job.trim()) {
    return { success: false, error: "Le poste est obligatoire." };
  }

  try {
    const actor = (await model.create({
      data: {
        projectId: data.projectId,
        name: data.name.trim(),
        department: data.department.trim(),
        job: data.job.trim(),
      },
    })) as CommunicationProjectActor;

    try {
      revalidatePath("/communication/acteurs-roles");
      revalidatePath(`/communication/acteurs-roles?projectId=${data.projectId}`);
    } catch {
      // ignore revalidate errors
    }

    return { success: true, actor };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("createProjectActor error:", error);
    return {
      success: false,
      error: message || "Erreur lors de la création de l'acteur",
    };
  }
}

export type GetActorsByProjectResult =
  | { success: true; actors: CommunicationProjectActor[] }
  | { success: false; actors: [] };

export async function getActorsByProject(
  projectId: string
): Promise<GetActorsByProjectResult> {
  const model = getCommunicationProjectActorModel();
  if (!model) {
    return { success: true, actors: [] };
  }
  try {
    const actors = (await model.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    })) as CommunicationProjectActor[];
    return { success: true, actors };
  } catch (error) {
    console.error("getActorsByProject error:", error);
    return { success: false, actors: [] };
  }
}

export type DeleteActorResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteProjectActor(
  actorId: string,
  projectId: string
): Promise<DeleteActorResult> {
  const model = getCommunicationProjectActorModel();
  if (!model) {
    return {
      success: false,
      error: "Modèle CommunicationProjectActor non disponible.",
    };
  }
  try {
    await model.delete({
      where: { id: actorId },
    });

    try {
      revalidatePath("/communication/acteurs-roles");
      revalidatePath(`/communication/acteurs-roles?projectId=${projectId}`);
    } catch {
      // ignore revalidate errors
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("deleteProjectActor error:", error);
    return {
      success: false,
      error: message || "Erreur lors de la suppression de l'acteur",
    };
  }
}
