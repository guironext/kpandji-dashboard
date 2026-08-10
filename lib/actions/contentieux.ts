"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import type {
  StatutAudience,
  StatutDecisionDeJustice,
  StatutDossierContentieux,
  TypeDossierContentieux,
  TypePartie,
} from "@prisma/client";

const CONTENTIEUX_PATHS = [
  "/juridique/contentieux",
  "/juridique/contentieux/nouveau-dossier",
  "/juridique/contentieux/liste-contentieux",
] as const;

const typeDocumentField = z.enum([
  "CONTRATS",
  "FACTURES",
  "COURRIERS",
  "JUGEMENTS",
  "PROCES_VERBAUX",
  "PHOTOS",
]);

const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().max(25 * 1024 * 1024, "La taille maximale est de 25 Mo"),
});

function revalidateContentieuxPaths() {
  for (const path of CONTENTIEUX_PATHS) {
    revalidatePath(path);
  }
}

async function getDbUserId() {
  const user = await currentUser();
  if (!user) return { error: "Utilisateur non authentifié" as const };

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true },
  });

  if (!dbUser) return { error: "Utilisateur non trouvé" as const };
  return { userId: dbUser.id };
}

export async function getDossiersContentieux() {
  try {
    const dossiers = await prisma.dossierContentieux.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        numeroDossier: true,
        typeDossier: true,
        statutDossier: true,
        objet: true,
        dateOuverture: true,
      },
    });
    return { success: true as const, data: dossiers };
  } catch (error) {
    console.error("getDossiersContentieux:", error);
    return {
      success: false as const,
      error: "Impossible de charger les dossiers contentieux.",
      data: [],
    };
  }
}

export async function getDossiersContentieuxListe() {
  try {
    const dossiers = await prisma.dossierContentieux.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        numeroDossier: true,
        typeDossier: true,
        statutDossier: true,
        objet: true,
        description: true,
        dateOuverture: true,
        dateCloture: true,
        createdAt: true,
        gestionDesDecisionsDeJustice: {
          orderBy: { dateDecision: "desc" },
          select: {
            id: true,
            dateDecision: true,
            heureDecision: true,
            lieuDecision: true,
            statutDecision: true,
          },
        },
        _count: {
          select: {
            partiesPrenantes: true,
            documentsContentieux: true,
            gestionAudiences: true,
            gestionDesDecisionsDeJustice: true,
          },
        },
      },
    });
    return { success: true as const, data: dossiers };
  } catch (error) {
    console.error("getDossiersContentieuxListe:", error);
    return {
      success: false as const,
      error: "Impossible de charger les dossiers contentieux.",
      data: [],
    };
  }
}

export async function getDossierContentieuxById(id: string) {
  try {
    const dossier = await prisma.dossierContentieux.findUnique({
      where: { id },
      select: {
        id: true,
        numeroDossier: true,
        typeDossier: true,
        statutDossier: true,
        objet: true,
        description: true,
        dateOuverture: true,
        dateCloture: true,
      },
    });

    if (!dossier) {
      return {
        success: false as const,
        error: "Dossier contentieux introuvable.",
        data: null,
      };
    }

    return { success: true as const, data: dossier };
  } catch (error) {
    console.error("getDossierContentieuxById:", error);
    return {
      success: false as const,
      error: "Impossible de charger le dossier contentieux.",
      data: null,
    };
  }
}

export async function updateDossierContentieux(data: {
  id: string;
  typeDossier: TypeDossierContentieux;
  statutDossier: StatutDossierContentieux;
  description: string;
  objet: string;
  dateOuverture: Date;
  dateCloture?: Date | null;
}) {
  try {
    const existing = await prisma.dossierContentieux.findUnique({
      where: { id: data.id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Dossier contentieux introuvable." };
    }

    const dossier = await prisma.dossierContentieux.update({
      where: { id: data.id },
      data: {
        typeDossier: data.typeDossier,
        statutDossier: data.statutDossier,
        description: data.description.trim(),
        objet: data.objet.trim(),
        dateOuverture: data.dateOuverture,
        dateCloture: data.dateCloture ?? null,
      },
    });

    revalidateContentieuxPaths();
    return { success: true, data: dossier };
  } catch (error) {
    console.error("updateDossierContentieux:", error);
    return {
      success: false,
      error: "Erreur lors de la mise à jour du dossier contentieux.",
    };
  }
}

export async function deleteDossierContentieux(id: string) {
  try {
    const auth = await getDbUserId();
    if ("error" in auth) return { success: false, error: auth.error };

    const existing = await prisma.dossierContentieux.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Dossier contentieux introuvable." };
    }

    await prisma.dossierContentieux.delete({ where: { id } });

    revalidateContentieuxPaths();
    return { success: true };
  } catch (error) {
    console.error("deleteDossierContentieux:", error);
    return {
      success: false,
      error: "Erreur lors de la suppression du dossier contentieux.",
    };
  }
}

export async function createDossierContentieux(data: {
  numeroDossier: string;
  typeDossier: TypeDossierContentieux;
  statutDossier: StatutDossierContentieux;
  description: string;
  objet: string;
  dateOuverture: Date;
  dateCloture?: Date | null;
}) {
  try {
    const auth = await getDbUserId();
    if ("error" in auth) return { success: false, error: auth.error };

    const dossier = await prisma.dossierContentieux.create({
      data: {
        numeroDossier: data.numeroDossier.trim(),
        typeDossier: data.typeDossier,
        statutDossier: data.statutDossier,
        description: data.description.trim(),
        objet: data.objet.trim(),
        dateOuverture: data.dateOuverture,
        dateCloture: data.dateCloture ?? null,
        userId: auth.userId,
      },
    });

    revalidateContentieuxPaths();
    return { success: true, data: dossier };
  } catch (error) {
    console.error("createDossierContentieux:", error);
    return {
      success: false,
      error: "Erreur lors de la création du dossier contentieux.",
    };
  }
}

export async function getPartiesPrenantesByDossier(dossierContentieuxId: string) {
  try {
    const parties = await prisma.partiesPrenantes.findMany({
      where: { dossierContentieuxId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        typePartie: true,
        createdAt: true,
      },
    });
    return { success: true as const, data: parties };
  } catch (error) {
    console.error("getPartiesPrenantesByDossier:", error);
    return {
      success: false as const,
      error: "Impossible de charger les parties prenantes.",
      data: [],
    };
  }
}

export async function getDocumentsContentieuxByDossier(dossierContentieuxId: string) {
  try {
    const documents = await prisma.documentsContentieux.findMany({
      where: { dossierContentieuxId },
      orderBy: { dateUpload: "desc" },
      select: {
        id: true,
        nom: true,
        typeDocument: true,
        nomFichier: true,
        dateUpload: true,
        url: true,
        createdAt: true,
      },
    });
    return { success: true as const, data: documents };
  } catch (error) {
    console.error("getDocumentsContentieuxByDossier:", error);
    return {
      success: false as const,
      error: "Impossible de charger les documents.",
      data: [],
    };
  }
}

export type GestionAudienceItem = {
  id: string;
  dateAudience: Date;
  heureAudience: string;
  rjAudience: string;
  statutAudience: StatutAudience;
  salleAudience: string;
  tribunalAudience: string;
  resultatAudience: string;
  createdAt: Date;
};

type GestionAudienceRecord = {
  id: string;
  dateAudience: Date;
  heureAudience: string;
  statutAudience: StatutAudience;
  salleAudience: string;
  tribunalAudience: string;
  resultatAudience: string;
  createdAt: Date;
} & Partial<{ rjAudience: string; lieuAudience: string }>;

function toGestionAudienceItem(audience: GestionAudienceRecord): GestionAudienceItem {
  return {
    id: audience.id,
    dateAudience: audience.dateAudience,
    heureAudience: audience.heureAudience,
    rjAudience: audience.rjAudience ?? audience.lieuAudience ?? "",
    statutAudience: audience.statutAudience,
    salleAudience: audience.salleAudience,
    tribunalAudience: audience.tribunalAudience,
    resultatAudience: audience.resultatAudience,
    createdAt: audience.createdAt,
  };
}

export async function getGestionAudiencesByDossier(dossierContentieuxId: string) {
  try {
    const audiences = await prisma.gestionAudiences.findMany({
      where: { dossierContentieuxId },
      orderBy: { dateAudience: "desc" },
      select: {
        id: true,
        dateAudience: true,
        heureAudience: true,
        rjAudience: true,
        statutAudience: true,
        salleAudience: true,
        tribunalAudience: true,
        resultatAudience: true,
        createdAt: true,
      },
    });
    return { success: true as const, data: audiences.map(toGestionAudienceItem) };
  } catch (error) {
    console.error("getGestionAudiencesByDossier:", error);
    return {
      success: false as const,
      error: "Impossible de charger les audiences.",
      data: [] as GestionAudienceItem[],
    };
  }
}

export async function createPartiesPrenantes(data: {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  typePartie: TypePartie;
  dossierContentieuxId: string;
}) {
  try {
    const dossier = await prisma.dossierContentieux.findUnique({
      where: { id: data.dossierContentieuxId },
      select: { id: true },
    });
    if (!dossier) {
      return { success: false, error: "Dossier contentieux introuvable." };
    }

    const partie = await prisma.partiesPrenantes.create({
      data: {
        nom: data.nom.trim(),
        prenom: data.prenom.trim(),
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        typePartie: data.typePartie,
        dossierContentieuxId: data.dossierContentieuxId,
      },
    });

    revalidateContentieuxPaths();
    return { success: true, data: partie };
  } catch (error) {
    console.error("createPartiesPrenantes:", error);
    return {
      success: false,
      error: "Erreur lors de l'ajout de la partie prenante.",
    };
  }
}

export async function createDocumentsContentieux(formData: FormData) {
  try {
    const dossierContentieuxId = z
      .string()
      .min(1)
      .parse(formData.get("dossierContentieuxId"));
    const nomValue = formData.get("nom");
    const nom = z
      .string()
      .min(1, "Le nom du document est requis")
      .max(500)
      .parse(typeof nomValue === "string" ? nomValue.trim() : "");
    const typeDocument = typeDocumentField.parse(formData.get("typeDocument"));
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Veuillez sélectionner un fichier à téléverser." };
    }

    fileUploadSchema.parse({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });

    const dossier = await prisma.dossierContentieux.findUnique({
      where: { id: dossierContentieuxId },
      select: { id: true },
    });
    if (!dossier) {
      return { success: false, error: "Dossier contentieux introuvable." };
    }

    const isProduction = process.env.NODE_ENV === "production";
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    let url = "";

    if (isProduction) {
      if (!blobToken) {
        return {
          success: false,
          error: "Stockage distant non configuré (BLOB_READ_WRITE_TOKEN manquant).",
        };
      }
      const pathname = `contentieux/${timestamp}_${sanitizedName}`;
      const blob = await put(pathname, file, {
        access: "public",
        token: blobToken,
      });
      url = blob.url;
    } else {
      const dir = join(process.cwd(), "public", "externes", "contentieux");
      await mkdir(dir, { recursive: true });
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(dir, filename);
      const bytes = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));
      url = `/externes/contentieux/${filename}`;
    }

    const document = await prisma.documentsContentieux.create({
      data: {
        nom,
        typeDocument,
        dossierContentieuxId,
        nomFichier: file.name,
        dateUpload: new Date(),
        url,
      },
    });

    revalidateContentieuxPaths();
    return { success: true, data: document };
  } catch (error) {
    console.error("createDocumentsContentieux:", error);
    return {
      success: false,
      error: "Erreur lors de l'ajout du document.",
    };
  }
}

export async function createGestionAudiences(data: {
  dateAudience: Date;
  heureAudience: string;
  rjAudience: string;
  statutAudience: StatutAudience;
  salleAudience: string;
  tribunalAudience: string;
  resultatAudience: string;
  dossierContentieuxId: string;
}) {
  try {
    const dossier = await prisma.dossierContentieux.findUnique({
      where: { id: data.dossierContentieuxId },
      select: { id: true },
    });
    if (!dossier) {
      return { success: false, error: "Dossier contentieux introuvable." };
    }

    const audience = await prisma.gestionAudiences.create({
      data: {
        dateAudience: data.dateAudience,
        heureAudience: data.heureAudience.trim(),
        rjAudience: data.rjAudience.trim(),
        statutAudience: data.statutAudience,
        salleAudience: data.salleAudience.trim(),
        tribunalAudience: data.tribunalAudience.trim(),
        resultatAudience: data.resultatAudience.trim(),
        dossierContentieuxId: data.dossierContentieuxId,
      },
    });

    revalidateContentieuxPaths();
    return { success: true, data: toGestionAudienceItem(audience) };
  } catch (error) {
    console.error("createGestionAudiences:", error);
    return {
      success: false,
      error: "Erreur lors de l'enregistrement de l'audience.",
    };
  }
}

export async function getGestionDesDecisionsDeJusticeByDossier(dossierContentieuxId: string) {
  try {
    const decisions = await prisma.gestionDesDecisionsDeJustice.findMany({
      where: { dossierContentieuxId },
      orderBy: { dateDecision: "desc" },
      select: {
        id: true,
        dateDecision: true,
        heureDecision: true,
        lieuDecision: true,
        statutDecision: true,
        createdAt: true,
      },
    });
    return { success: true as const, data: decisions };
  } catch (error) {
    console.error("getGestionDesDecisionsDeJusticeByDossier:", error);
    return {
      success: false as const,
      error: "Impossible de charger les décisions.",
      data: [],
    };
  }
}

export async function createGestionDesDecisionsDeJustice(data: {
  dateDecision: Date;
  heureDecision: string;
  lieuDecision: string;
  statutDecision: StatutDecisionDeJustice;
  dossierContentieuxId: string;
}) {
  try {
    const dossier = await prisma.dossierContentieux.findUnique({
      where: { id: data.dossierContentieuxId },
      select: { id: true },
    });
    if (!dossier) {
      return { success: false, error: "Dossier contentieux introuvable." };
    }

    const decision = await prisma.gestionDesDecisionsDeJustice.create({
      data: {
        dateDecision: data.dateDecision,
        heureDecision: data.heureDecision.trim(),
        lieuDecision: data.lieuDecision.trim(),
        statutDecision: data.statutDecision,
        dossierContentieuxId: data.dossierContentieuxId,
      },
    });

    revalidateContentieuxPaths();
    return { success: true, data: decision };
  } catch (error) {
    console.error("createGestionDesDecisionsDeJustice:", error);
    return {
      success: false,
      error: "Erreur lors de l'enregistrement de la décision.",
    };
  }
}
