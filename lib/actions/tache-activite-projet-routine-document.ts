"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import type { TypeDocumentTacheActiviteProjetRoutine } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";

const ACTIVITES_ROUTINEES_PATH = "/communication/activites-routinees";
const DESIGNER_PROJET_PERMANENT_PATH = "/designer/projet-permanent";

const TYPE_DOCUMENT_VALUES = [
  "DOCUMENTATION",
  "MEMOIRE",
  "AVIS_TECHNIQUE",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "AUTRE",
] as const;

const fileUploadSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  size: z.number().max(25 * 1024 * 1024, "La taille maximale est de 25 Mo."),
});

const typeDocumentField = z.enum(TYPE_DOCUMENT_VALUES);

export type TacheDocumentItem = {
  id: string;
  nom: string;
  typeDocument: TypeDocumentTacheActiviteProjetRoutine;
  url: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
};


async function resolveClerkUserId(clerkUserId?: string) {
  if (clerkUserId) return clerkUserId;
  const authResult = await auth();
  if (authResult?.userId) return authResult.userId;
  const clerkUser = await currentUser();
  return clerkUser?.id;
}

function revalidateTacheDocumentPaths() {
  try {
    revalidatePath(ACTIVITES_ROUTINEES_PATH);
    revalidatePath(DESIGNER_PROJET_PERMANENT_PATH);
  } catch {
    // ignore
  }
}

async function getCurrentDbUser(clerkUserId?: string) {
  const clerkId = await resolveClerkUserId(clerkUserId);
  if (!clerkId) return { error: "Vous devez être connecté." as const };

  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { error: userResult.error ?? "Utilisateur introuvable." as const };
  }

  return { user: userResult.data };
}

async function assertResponsableCanUpload(tacheId: string, userId: string) {
  const tache = await prisma.tacheActiviteProjetRoutine.findUnique({
    where: { id: tacheId },
    select: {
      id: true,
      statutTache: true,
      activiteProjetRoutine: {
        select: {
          roleMissionProjetRoutine: {
            select: {
              responsableProjetRoutine: {
                where: {
                  activiteProjetRoutineId: null,
                  tacheActiviteProjetRoutineId: null,
                },
                select: { userId: true },
              },
            },
          },
        },
      },
      responsableTacheResponsable: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!tache) {
    return { error: "Tâche introuvable." as const };
  }
  if (tache.statutTache !== "EN_ATTENTE_VALIDATION") {
    return {
      error: "Les documents ne peuvent être chargés que pour une tâche en attente de validation.",
    } as const;
  }

  const creatorId =
    tache.activiteProjetRoutine.roleMissionProjetRoutine.responsableProjetRoutine[0]?.userId ?? null;
  if (creatorId === userId) {
    return { error: "Seul le responsable de la tâche peut charger un document." as const };
  }
  if (tache.responsableTacheResponsable.length === 0) {
    return { error: "Vous n'êtes pas responsable de cette tâche." as const };
  }

  return { tache, responsableTacheResponsableId: tache.responsableTacheResponsable[0]!.id };
}

async function assertCreatorCanViewDocuments(tacheId: string, userId: string) {
  const tache = await prisma.tacheActiviteProjetRoutine.findUnique({
    where: { id: tacheId },
    select: {
      id: true,
      statutTache: true,
      activiteProjetRoutine: {
        select: {
          roleMissionProjetRoutine: {
            select: {
              responsableProjetRoutine: {
                where: {
                  activiteProjetRoutineId: null,
                  tacheActiviteProjetRoutineId: null,
                },
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!tache) {
    return { error: "Tâche introuvable." as const };
  }

  const creatorId =
    tache.activiteProjetRoutine.roleMissionProjetRoutine.responsableProjetRoutine[0]?.userId ?? null;
  if (creatorId !== userId) {
    return { error: "Seul le responsable de l'activité peut consulter ces documents." as const };
  }
  if (tache.statutTache !== "EN_ATTENTE_VALIDATION") {
    return {
      error: "Les documents ne sont consultables que pour une tâche en attente de validation.",
    } as const;
  }

  return { tache };
}

async function fetchTacheDocuments(tacheId: string) {
  const rows = await prisma.tacheActiviteProjetRoutineDocument.findMany({
    where: { tacheActiviteProjetRoutineId: tacheId },
    orderBy: { createdAt: "desc" },
    include: {
      responsableTacheResponsable: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });

  return rows.map(serializeDocument);
}

async function uploadTacheFile(file: File) {
  fileUploadSchema.parse({
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

  if (isProduction) {
    if (!blobToken) {
      return {
        success: false as const,
        error: "Stockage distant non configuré (BLOB_READ_WRITE_TOKEN manquant).",
      };
    }
    const pathname = `projets-permanents/${timestamp}_${sanitizedName}`;
    const blob = await put(pathname, file, {
      access: "public",
      token: blobToken,
    });
    return { success: true as const, url: blob.url };
  }

  const dir = join(process.cwd(), "public", "externes", "projets-permanents");
  await mkdir(dir, { recursive: true });
  const filename = `${timestamp}_${sanitizedName}`;
  const filepath = join(dir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return { success: true as const, url: `/externes/projets-permanents/${filename}` };
}

function serializeDocument(row: {
  id: string;
  nom: string;
  typeDocument: TypeDocumentTacheActiviteProjetRoutine;
  url: string;
  createdAt: Date;
  responsableTacheResponsable: {
    user: { id: string; firstName: string; lastName: string; email: string };
  };
}): TacheDocumentItem {
  return {
    id: row.id,
    nom: row.nom,
    typeDocument: row.typeDocument,
    url: row.url,
    createdAt: row.createdAt.toISOString(),
    user: row.responsableTacheResponsable.user,
  };
}

export async function getTacheDocuments(
  tacheId: string,
  clerkUserId?: string
): Promise<
  | { success: true; documents: TacheDocumentItem[] }
  | { success: false; error: string; documents: [] }
> {
  if (!tacheId) {
    return { success: false, error: "Tâche introuvable.", documents: [] };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable.", documents: [] };
    }

    const access = await assertResponsableCanUpload(tacheId, current.user.id);
    if ("error" in access) {
      return { success: false, error: access.error ?? "Accès refusé.", documents: [] };
    }

    const documents = await fetchTacheDocuments(tacheId);
    return { success: true, documents };
  } catch (error) {
    console.error("getTacheDocuments error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement des documents.",
      documents: [],
    };
  }
}

export async function getTacheDocumentsForCreator(
  tacheId: string,
  clerkUserId?: string
): Promise<
  | { success: true; documents: TacheDocumentItem[] }
  | { success: false; error: string; documents: [] }
> {
  if (!tacheId) {
    return { success: false, error: "Tâche introuvable.", documents: [] };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable.", documents: [] };
    }

    const access = await assertCreatorCanViewDocuments(tacheId, current.user.id);
    if ("error" in access) {
      return { success: false, error: access.error ?? "Accès refusé.", documents: [] };
    }

    const documents = await fetchTacheDocuments(tacheId);
    return { success: true, documents };
  } catch (error) {
    console.error("getTacheDocumentsForCreator error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement des documents.",
      documents: [],
    };
  }
}

export async function uploadTacheDocument(
  formData: FormData,
  clerkUserId?: string
): Promise<
  | { success: true; document: TacheDocumentItem }
  | { success: false; error: string }
> {
  try {
    const tacheId = z.string().min(1).parse(formData.get("tacheId"));
    const nomValue = formData.get("nom");
    const nom = z
      .string()
      .min(1, "Le nom du document est requis")
      .max(500)
      .parse(typeof nomValue === "string" ? nomValue.trim() : "");
    const typeDocument = typeDocumentField.parse(formData.get("typeDocument"));
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Veuillez sélectionner un fichier à charger." };
    }

    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable." };
    }

    const access = await assertResponsableCanUpload(tacheId, current.user.id);
    if ("error" in access) {
      return { success: false, error: access.error ?? "Accès refusé." };
    }

    const upload = await uploadTacheFile(file);
    if (!upload.success) {
      return { success: false, error: upload.error };
    }

    const row = await prisma.tacheActiviteProjetRoutineDocument.create({
      data: {
        nom,
        typeDocument,
        url: upload.url,
        responsableTacheResponsableId: access.responsableTacheResponsableId,
        tacheActiviteProjetRoutineId: tacheId,
      },
      include: {
        responsableTacheResponsable: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    revalidateTacheDocumentPaths();
    return { success: true, document: serializeDocument(row) };
  } catch (error) {
    console.error("uploadTacheDocument error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement du document.",
    };
  }
}
