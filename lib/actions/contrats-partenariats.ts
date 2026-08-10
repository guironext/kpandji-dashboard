"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import type { TypeContrat } from "@prisma/client";

const PAGE_PATHS = [
  "/juridique/contrats-et-partenariats",
  "/juridique/contrats-et-partenariats/liste-contrats",
];

const typeContratField = z.enum([
  "CONTRAT",
  "PARTENARIAT",
  "DELEGATION",
  "AGREMENT",
  "CONVENTION",
  "CONTRAT_DE_LOCATION",
  "CONTRAT_DE_LOCATION_VENTE",
  "CONTRAT_DE_LOCATION_VENTE_MISE_EN_LOCATION",
  "CONTRAT_DE_LOCATION_VENTE_MISE_EN_LOCATION_VENTE",
]);

const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().max(25 * 1024 * 1024, "La taille maximale est de 25 Mo"),
});

function revalidateContratsPath() {
  for (const path of PAGE_PATHS) {
    revalidatePath(path);
  }
}

async function uploadContratFile(file: File) {
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
    const pathname = `contrats/${timestamp}_${sanitizedName}`;
    const blob = await put(pathname, file, {
      access: "public",
      token: blobToken,
    });
    return {
      success: true as const,
      url: blob.url,
      nomFichier: file.name,
    };
  }

  const dir = join(process.cwd(), "public", "externes", "contrats");
  await mkdir(dir, { recursive: true });
  const filename = `${timestamp}_${sanitizedName}`;
  const filepath = join(dir, filename);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return {
    success: true as const,
    url: `/externes/contrats/${filename}`,
    nomFichier: file.name,
  };
}

export type ContratListItem = {
  id: string;
  titre: string;
  typeContrat: string;
  description: string;
  nomFichier: string | null;
  url: string | null;
  dateUpload: Date | null;
  createdAt: Date;
  _count: { partenaireSignataire: number };
};

export type PartenaireListItem = {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  fonction: string | null;
  entreprise: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
  pays: string | null;
  dateSignature: Date;
  dateCloture: Date | null;
  createdAt: Date;
  contratEtPartenariats: {
    id: string;
    titre: string;
    typeContrat: string;
  };
};

export async function getContratsEtPartenariats(): Promise<{
  success: true;
  data: ContratListItem[];
} | {
  success: false;
  error: string;
  data: ContratListItem[];
}> {
  try {
    const contrats = await prisma.contratsEtPartenariats.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titre: true,
        typeContrat: true,
        description: true,
        nomFichier: true,
        url: true,
        dateUpload: true,
        createdAt: true,
        _count: { select: { partenaireSignataire: true } },
      },
    });
    return { success: true as const, data: contrats as ContratListItem[] };
  } catch (error) {
    console.error("getContratsEtPartenariats:", error);
    return {
      success: false as const,
      error: "Impossible de charger les contrats.",
      data: [],
    };
  }
}

export async function getPartenairesSignataires(): Promise<{
  success: true;
  data: PartenaireListItem[];
} | {
  success: false;
  error: string;
  data: PartenaireListItem[];
}> {
  try {
    const partenaires = await prisma.partenaireSignataire.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        fonction: true,
        entreprise: true,
        adresse: true,
        ville: true,
        codePostal: true,
        pays: true,
        dateSignature: true,
        dateCloture: true,
        createdAt: true,
        contratEtPartenariats: {
          select: { id: true, titre: true, typeContrat: true },
        },
      },
    });
    return { success: true as const, data: partenaires as PartenaireListItem[] };
  } catch (error) {
    console.error("getPartenairesSignataires:", error);
    return {
      success: false as const,
      error: "Impossible de charger les partenariats.",
      data: [],
    };
  }
}

export async function createContratEtPartenariat(formData: FormData) {
  try {
    const titreValue = formData.get("titre");
    const titre = z
      .string()
      .min(1, "Le titre est requis")
      .max(500)
      .parse(typeof titreValue === "string" ? titreValue.trim() : "");
    const typeContrat = typeContratField.parse(formData.get("typeContrat"));
    const descriptionValue = formData.get("description");
    const description = z
      .string()
      .min(1, "La description est requise")
      .parse(typeof descriptionValue === "string" ? descriptionValue.trim() : "");
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Veuillez sélectionner un fichier à téléverser." };
    }

    const upload = await uploadContratFile(file);
    if (!upload.success) {
      return { success: false, error: upload.error };
    }

    const contrat = await prisma.contratsEtPartenariats.create({
      data: {
        titre,
        typeContrat: typeContrat as TypeContrat,
        description,
        nomFichier: upload.nomFichier,
        url: upload.url,
        dateUpload: new Date(),
      },
    });

    revalidateContratsPath();
    return { success: true, data: contrat };
  } catch (error) {
    console.error("createContratEtPartenariat:", error);
    return {
      success: false,
      error: "Erreur lors de la création du contrat.",
    };
  }
}

const partenaireSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
  fonction: z.string().optional(),
  entreprise: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  codePostal: z.string().optional(),
  pays: z.string().optional(),
  dateSignature: z.coerce.date(),
  dateCloture: z.coerce.date().optional().nullable(),
  contratEtPartenariatsId: z.string().min(1, "Le contrat signé est requis"),
});

export async function createPartenaireSignataire(data: {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  fonction?: string;
  entreprise?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  dateSignature: Date;
  dateCloture?: Date | null;
  contratEtPartenariatsId: string;
}) {
  try {
    const parsed = partenaireSchema.parse(data);

    const contrat = await prisma.contratsEtPartenariats.findUnique({
      where: { id: parsed.contratEtPartenariatsId },
      select: { id: true },
    });
    if (!contrat) {
      return { success: false, error: "Contrat introuvable." };
    }

    const partenaire = await prisma.partenaireSignataire.create({
      data: {
        nom: parsed.nom.trim(),
        prenom: parsed.prenom.trim(),
        email: parsed.email?.trim() || null,
        telephone: parsed.telephone?.trim() || null,
        fonction: parsed.fonction?.trim() || null,
        entreprise: parsed.entreprise?.trim() || null,
        adresse: parsed.adresse?.trim() || null,
        ville: parsed.ville?.trim() || null,
        codePostal: parsed.codePostal?.trim() || null,
        pays: parsed.pays?.trim() || null,
        dateSignature: parsed.dateSignature,
        dateCloture: parsed.dateCloture ?? null,
        contratEtPartenariatsId: parsed.contratEtPartenariatsId,
      },
      include: {
        contratEtPartenariats: {
          select: { id: true, titre: true, typeContrat: true },
        },
      },
    });

    revalidateContratsPath();
    return { success: true, data: partenaire };
  } catch (error) {
    console.error("createPartenaireSignataire:", error);
    return {
      success: false,
      error: "Erreur lors de la création du partenariat.",
    };
  }
}
