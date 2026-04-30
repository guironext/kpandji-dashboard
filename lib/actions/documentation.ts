"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { Documentation, TypeDocumentation } from "@prisma/client";

const categoryField = z.enum([
  "agrement",
  "arf",
  "rccm",
  "dfe",
  "cnps",
  "rib",
  "catalogue",
  "presentation",
  "fiche-technique",
]);

const UI_CATEGORY_TO_TYPE: Record<
  z.infer<typeof categoryField>,
  TypeDocumentation
> = {
  agrement: "AGREMENT",
  arf: "ARF",
  rccm: "RCCM",
  dfe: "DFE",
  cnps: "CNPS",
  rib: "RIB",
  catalogue: "CATALOGUE",
  presentation: "PRESENTATION",
  "fiche-technique": "FICHE_TECHNIQUE",
};

const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().max(25 * 1024 * 1024, "La taille maximale est de 25 Mo"),
});

export async function getCommercialDocumentationRecords(): Promise<{
  success: boolean;
  message?: string;
  data: Documentation[];
}> {
  try {
    const data = await prisma.documentation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data };
  } catch (error) {
    console.error("getCommercialDocumentationRecords:", error);
    return {
      success: false,
      message: "Impossible de charger les documents.",
      data: [],
    };
  }
}

export async function uploadCommercialDocumentation(
  formData: FormData
): Promise<{
  success: boolean;
  message: string;
  document?: Documentation;
}> {
  try {
    const rawCategory = formData.get("category");
    const rawNom = formData.get("nom");
    const file = formData.get("file");

    const category = categoryField.parse(rawCategory);
    const nom = z
      .string()
      .min(1, "Le nom est requis")
      .max(500)
      .parse(typeof rawNom === "string" ? rawNom.trim() : "");

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "Veuillez sélectionner un fichier." };
    }

    fileUploadSchema.parse({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    let fichier = "";

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    if (isProduction) {
      if (!blobToken) {
        return {
          success: false,
          message:
            "Stockage distant non configuré (BLOB_READ_WRITE_TOKEN manquant).",
        };
      }
      const pathname = `commercial-documentation/${timestamp}_${sanitizedName}`;
      const blob = await put(pathname, file, {
        access: "public",
        token: blobToken,
      });
      fichier = blob.url;
    } else {
      const dir = join(process.cwd(), "public", "externes", "commercial-documentation");
      await mkdir(dir, { recursive: true });
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(dir, filename);
      const bytes = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));
      fichier = `/externes/commercial-documentation/${filename}`;
    }

    const type = UI_CATEGORY_TO_TYPE[category];

    const document = await prisma.documentation.create({
      data: {
        nom,
        type,
        fichier,
      },
    });

    revalidatePath("/commercial/documentation");

    return {
      success: true,
      message: "Document enregistré.",
      document,
    };
  } catch (error) {
    console.error("uploadCommercialDocumentation:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues.map((i) => i.message).join(", "),
      };
    }
    const msg =
      error instanceof Error ? error.message : "Échec de l'enregistrement.";
    return { success: false, message: msg };
  }
}
