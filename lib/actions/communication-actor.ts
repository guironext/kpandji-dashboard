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
