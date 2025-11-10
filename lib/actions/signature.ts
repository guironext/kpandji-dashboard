"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { currentUser } from "@clerk/nextjs/server";

const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string().refine((type) => type.startsWith("image/"), {
    message: "Le fichier doit être une image",
  }),
  size: z.number().max(5 * 1024 * 1024, "La taille maximale est de 5MB"),
});

export async function uploadSignature(
  file: File
): Promise<{ success: boolean; message: string; signatureId?: string }> {
  try {
    // Get current user
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        message: "Utilisateur non authentifié",
      };
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { signatures: true },
    });

    if (!dbUser) {
      return {
        success: false,
        message: "Utilisateur non trouvé dans la base de données",
      };
    }

    // Validate file
    fileUploadSchema.parse({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const isProduction = process.env.NODE_ENV === "production";
    let imagePath = "";

    // Upload file
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    if (isProduction) {
      // Use Vercel Blob in production
      const filename = `signatures/${timestamp}_${sanitizedName}`;

      const blob = await put(filename, file, {
        access: "public",
      });

      imagePath = blob.url;
    } else {
      // Use local filesystem in development
      const externesDir = join(process.cwd(), "public", "externes");
      await mkdir(externesDir, { recursive: true });

      const filename = `signature_${timestamp}_${sanitizedName}`;
      const filepath = join(externesDir, filename);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      imagePath = `/externes/${filename}`;
    }

    // Update or create signature
    let signature;
    if (dbUser.signatures) {
      // Update existing signature
      signature = await prisma.signature.update({
        where: { userId: dbUser.id },
        data: { image: imagePath },
      });
    } else {
      // Create new signature
      signature = await prisma.signature.create({
        data: {
          image: imagePath,
          userId: dbUser.id,
        },
      });
    }

    revalidatePath("/commercial/signature");

    return {
      success: true,
      message: "Signature uploadée avec succès",
      signatureId: signature.id,
    };
  } catch (error) {
    console.error("Error uploading signature:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Fichier invalide: ${error.issues.map((e) => e.message).join(", ")}`,
      };
    }

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      message: `Échec de l'upload: ${errorMessage}`,
    };
  }
}

export async function getUserSignature(): Promise<{
  success: boolean;
  data?: { id: string; image: string; createdAt: Date; updatedAt: Date } | null;
  message: string;
}> {
  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        message: "Utilisateur non authentifié",
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { signatures: true },
    });

    if (!dbUser) {
      return {
        success: false,
        message: "Utilisateur non trouvé",
      };
    }

    return {
      success: true,
      data: dbUser.signatures,
      message: "Signature récupérée avec succès",
    };
  } catch (error) {
    console.error("Error fetching signature:", error);
    return {
      success: false,
      message: "Erreur lors de la récupération de la signature",
    };
  }
}

export async function deleteSignature(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        message: "Utilisateur non authentifié",
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { signatures: true },
    });

    if (!dbUser || !dbUser.signatures) {
      return {
        success: false,
        message: "Aucune signature à supprimer",
      };
    }

    await prisma.signature.delete({
      where: { id: dbUser.signatures.id },
    });

    revalidatePath("/commercial/signature");

    return {
      success: true,
      message: "Signature supprimée avec succès",
    };
  } catch (error) {
    console.error("Error deleting signature:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      message: `Échec de la suppression: ${errorMessage}`,
    };
  }
}

