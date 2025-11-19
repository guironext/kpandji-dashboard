"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";

const createAccessoireSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  image: z.string().optional(),
});

export type CreateAccessoireInput = z.infer<typeof createAccessoireSchema>;

const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});

export async function createAccessoire(
  data: CreateAccessoireInput,
  file?: File
): Promise<{ success: boolean; message: string; accessoireId?: string }> {
  try {
    createAccessoireSchema.parse(data);

    const isProduction = process.env.NODE_ENV === 'production';
    let imagePath = "";

    if (file) {
      fileUploadSchema.parse({
        name: file.name,
        type: file.type,
        size: file.size,
      });

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      if (isProduction) {
        // Use Vercel Blob in production
        const filename = `accessoires/${timestamp}_${sanitizedName}`;
        
        const blob = await put(filename, file, {
          access: 'public',
        });
        
        imagePath = blob.url;
      } else {
        // Use local filesystem in development
        const externesDir = join(process.cwd(), "public", "externes");
        await mkdir(externesDir, { recursive: true });
        
        const filename = `${timestamp}_${sanitizedName}`;
        const filepath = join(externesDir, filename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        imagePath = `/externes/${filename}`;
      }
    }

    const accessoire = await prisma.accessoire.create({
      data: {
        nom: data.nom,
        image: imagePath || null,
      },
    });

    revalidatePath("/commercial/ajouter-accessoires");

    return {
      success: true,
      message: "Accessoire créé avec succès",
      accessoireId: accessoire.id,
    };
  } catch (error) {
    console.error("Error creating accessoire:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      message: `Échec de la création: ${errorMessage}`,
    };
  }
}

export async function getAllAccessoires() {
  try {
    const accessoires = await prisma.accessoire.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers for client components
    const serializedAccessoires = accessoires.map(acc => ({
      id: acc.id,
      nom: acc.nom,
      description: acc.description,
      prix: acc.prix ? Number(acc.prix) : null,
      quantity: acc.quantity ? Number(acc.quantity) : null,
      image: acc.image,
      voitureId: acc.voitureId,
      factureId: acc.factureId,
      commandeId: acc.commandeId,
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt,
    }));

    return {
      success: true,
      data: serializedAccessoires,
    };
  } catch (error) {
    console.error("Error fetching accessoires:", error);
    return {
      success: false,
      data: [],
    };
  }
}

export async function deleteAccessoire(id: string) {
  try {
    await prisma.accessoire.delete({
      where: { id },
    });

    revalidatePath("/commercial/ajouter-accessoires");
    return {
      success: true,
      message: "Accessoire supprimé avec succès",
    };
  } catch (error) {
    console.error("Error deleting accessoire:", error);
    return {
      success: false,
      message: "Erreur lors de la suppression",
    };
  }
}

