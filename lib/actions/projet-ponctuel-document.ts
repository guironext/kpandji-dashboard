"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { TypeDocumentProjetPonctuel } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";

const PROJETS_PONCTUELS_PATH = "/communication/projets-ponctuels";
const DESIGNER_PROJET_PONCTUEL_PATH = "/designer/projet-ponctuel";

const TYPE_DOCUMENT_VALUES = [
  "DOCUMENTATION",
  "MEMOIRE",
  "REPORT",
  "PRESENTATION",
  "AUTRE",
] as const;

const fileUploadSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  size: z.number().max(25 * 1024 * 1024, "La taille maximale est de 25 Mo."),
});

const typeDocumentField = z.enum(TYPE_DOCUMENT_VALUES);

export type ProjetPonctuelDocumentItem = {
  id: string;
  nom: string;
  typeDocument: TypeDocumentProjetPonctuel;
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

function revalidatePaths() {
  try {
    revalidatePath(PROJETS_PONCTUELS_PATH);
    revalidatePath(DESIGNER_PROJET_PONCTUEL_PATH);
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

async function assertResponsableCanUpload(activiteId: string, userId: string) {
  const activite = await prisma.projetPonctuelActivite.findUnique({
    where: { id: activiteId },
    select: {
      id: true,
      userId: true,
      statutActivite: true,
      responsableResponsable: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!activite) {
    return { error: "Activité introuvable." as const };
  }
  if (activite.statutActivite !== "EN_ATTENTE_VALIDATION") {
    return {
      error: "Les documents ne peuvent être chargés que pour une activité en attente de validation.",
    } as const;
  }
  if (activite.userId === userId) {
    return { error: "Seul le responsable peut charger un document." as const };
  }
  if (activite.responsableResponsable.length === 0) {
    return { error: "Vous n'êtes pas responsable de cette activité." as const };
  }

  return { activite };
}

async function assertCreatorCanViewDocuments(activiteId: string, userId: string) {
  const activite = await prisma.projetPonctuelActivite.findUnique({
    where: { id: activiteId },
    select: { id: true, userId: true, statutActivite: true },
  });

  if (!activite) {
    return { error: "Activité introuvable." as const };
  }
  if (activite.userId !== userId) {
    return { error: "Seul le créateur peut consulter ces documents." as const };
  }
  if (activite.statutActivite !== "EN_ATTENTE_VALIDATION") {
    return {
      error: "Les documents ne sont consultables que pour une activité en attente de validation.",
    } as const;
  }

  return { activite };
}

async function fetchActiviteDocuments(activiteId: string) {
  const rows = await prisma.projetPonctuelDocument.findMany({
    where: { projetPonctuelActiviteId: activiteId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  return rows.map(serializeDocument);
}

async function uploadActiviteFile(file: File) {
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
    const pathname = `projets-ponctuels/${timestamp}_${sanitizedName}`;
    const blob = await put(pathname, file, {
      access: "public",
      token: blobToken,
    });
    return { success: true as const, url: blob.url };
  }

  const dir = join(process.cwd(), "public", "externes", "projets-ponctuels");
  await mkdir(dir, { recursive: true });
  const filename = `${timestamp}_${sanitizedName}`;
  const filepath = join(dir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return { success: true as const, url: `/externes/projets-ponctuels/${filename}` };
}

function serializeDocument(row: {
  id: string;
  nom: string;
  typeDocument: TypeDocumentProjetPonctuel;
  url: string;
  createdAt: Date;
  user: { id: string; firstName: string; lastName: string; email: string };
}): ProjetPonctuelDocumentItem {
  return {
    id: row.id,
    nom: row.nom,
    typeDocument: row.typeDocument,
    url: row.url,
    createdAt: row.createdAt.toISOString(),
    user: row.user,
  };
}

export async function getActiviteDocuments(
  activiteId: string,
  clerkUserId?: string
): Promise<
  | { success: true; documents: ProjetPonctuelDocumentItem[] }
  | { success: false; error: string; documents: [] }
> {
  if (!activiteId) {
    return { success: false, error: "Activité introuvable.", documents: [] };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable.", documents: [] };
    }

    const access = await assertResponsableCanUpload(activiteId, current.user.id);
    if ("error" in access) {
      return { success: false, error: access.error ?? "Accès refusé.", documents: [] };
    }

    const rows = await fetchActiviteDocuments(activiteId);

    return { success: true, documents: rows };
  } catch (error) {
    console.error("getActiviteDocuments error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement des documents.",
      documents: [],
    };
  }
}

export async function getActiviteDocumentsForCreator(
  activiteId: string,
  clerkUserId?: string
): Promise<
  | { success: true; documents: ProjetPonctuelDocumentItem[] }
  | { success: false; error: string; documents: [] }
> {
  if (!activiteId) {
    return { success: false, error: "Activité introuvable.", documents: [] };
  }

  try {
    const current = await getCurrentDbUser(clerkUserId);
    if ("error" in current) {
      return { success: false, error: current.error ?? "Utilisateur introuvable.", documents: [] };
    }

    const access = await assertCreatorCanViewDocuments(activiteId, current.user.id);
    if ("error" in access) {
      return { success: false, error: access.error ?? "Accès refusé.", documents: [] };
    }

    const documents = await fetchActiviteDocuments(activiteId);

    return { success: true, documents };
  } catch (error) {
    console.error("getActiviteDocumentsForCreator error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement des documents.",
      documents: [],
    };
  }
}

export async function uploadActiviteDocument(
  formData: FormData,
  clerkUserId?: string
): Promise<
  | { success: true; document: ProjetPonctuelDocumentItem }
  | { success: false; error: string }
> {
  try {
    const activiteId = z.string().min(1).parse(formData.get("activiteId"));
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

    const access = await assertResponsableCanUpload(activiteId, current.user.id);
    if ("error" in access) {
      return { success: false, error: access.error ?? "Accès refusé." };
    }

    const upload = await uploadActiviteFile(file);
    if (!upload.success) {
      return { success: false, error: upload.error };
    }

    const row = await prisma.projetPonctuelDocument.create({
      data: {
        nom,
        typeDocument,
        url: upload.url,
        userId: current.user.id,
        projetPonctuelActiviteId: activiteId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    revalidatePaths();
    return { success: true, document: serializeDocument(row) };
  } catch (error) {
    console.error("uploadActiviteDocument error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement du document.",
    };
  }
}
