"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir, readdir, unlink, stat } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

// Schema for model creation - matches VoitureModel from Prisma schema
const createModelSchema = z.object({
  model: z.string().min(1, "Le nom du modèle est requis"),
  fiche_technique: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
});

export type CreateModelInput = z.infer<typeof createModelSchema>;

// File upload schema
const fileUploadSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});

export async function createModel(
  data: CreateModelInput,
  files: File[],
  hasFicheTechnique = false  // Add this parameter
): Promise<{ success: boolean; message: string; modelId?: string }> {
  try {
    // Validate input data
    createModelSchema.parse(data);
    
    const isProduction = process.env.NODE_ENV === 'production';
    let imagePath = "";
    let ficheTechniquePath = "";
    
    // Process file uploads
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file
      fileUploadSchema.parse({
        name: file.name,
        type: file.type,
        size: file.size,
      });
      
      let uploadedPath: string;
      
      if (isProduction) {
        // Use Vercel Blob in production
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `modeles/${timestamp}_${sanitizedName}`;
        
        const blob = await put(filename, file, {
          access: 'public',
        });
        
        uploadedPath = blob.url;
      } else {
        // Use local filesystem in development
        const externesDir = join(process.cwd(), "public", "externes");
        await mkdir(externesDir, { recursive: true });
        
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${timestamp}_${sanitizedName}`;
        const filepath = join(externesDir, filename);
        
        // Convert File to Buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);
        
        uploadedPath = `/externes/${filename}`;
      }
      
      // If hasFicheTechnique, last file is fiche technique
      if (hasFicheTechnique && i === files.length - 1) {
        ficheTechniquePath = uploadedPath;
      } else if (!imagePath) {
        imagePath = uploadedPath;
      }
    }
    
    // Save model to database with file paths
    const modele = await prisma.voitureModel.create({
      data: {
        model: data.model,
        fiche_technique: ficheTechniquePath || data.fiche_technique || null,
        description: data.description,
        image: imagePath || null,
      },
    });
    
    // Revalidate relevant paths
    revalidatePath("/manager/ajouter-modele");
    
    return {
      success: true,
      message: "Modèle créé avec succès",
      modelId: modele.id,
    };
    
  } catch (error) {
    console.error("Erreur lors de la création du modèle:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Données invalides: ${(error as z.ZodError).issues.map(e => e.message).join(", ")}`,
      };
    }
    
    // Return more detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return {
      success: false,
      message: `Erreur lors de la création du modèle: ${errorMessage}. Note: L'upload de fichiers ne fonctionne pas sur Vercel (système de fichiers en lecture seule). Utilisez un service cloud comme Cloudinary, AWS S3, ou Vercel Blob.`,
    };
  }
}

// Helper function to get uploaded files
export async function getModelFiles(): Promise<string[]> {
  try {
    const externesDir = join(process.cwd(), "public", "externes");
    
    // Check if directory exists
    try {
      await mkdir(externesDir, { recursive: true });
    } catch {
      // Directory already exists or can't be created
    }
    
    // Get all files in the externes directory
    const files = await readdir(externesDir);
    
    // Filter out directories and return only file paths
    const filePaths: string[] = [];
    
    for (const file of files) {
      const filePath = join(externesDir, file);
      try {
        // Check if it's a file (not a directory)
        const stats = await stat(filePath);
        if (stats.isFile()) {
          filePaths.push(`/externes/${file}`);
        }
      } catch (error) {
        console.warn(`Could not stat file ${file}:`, error);
        // Continue with other files
      }
    }
    
    return filePaths;
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return [];
  }
}

// Define a proper type for the model data - matches VoitureModel
type ModeleData = {
  id: string;
  model: string;
  fiche_technique: string | null;
  description?: string | null;  // Add this
  image?: string | null;         // Add this
  createdAt: Date;
  updatedAt: Date;
};

// Get a single model by ID from database
export async function getModele(modelId: string): Promise<{ success: boolean; data?: ModeleData; message: string }> {
  try {
    const modele = await prisma.voitureModel.findUnique({ 
      where: { id: modelId } 
    });
    
    if (!modele) {
      return {
        success: false,
        message: "Modèle non trouvé",
      };
    }
    
    const modeleData: ModeleData = {
      id: modele.id,
      model: modele.model,
      fiche_technique: modele.fiche_technique,
      description: modele.description,  // Add this
      image: modele.image,              // Add this
      createdAt: modele.createdAt,
      updatedAt: modele.updatedAt,
    };
    
    return {
      success: true,
      data: modeleData,
      message: "Modèle récupéré avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du modèle:", error);
    return {
      success: false,
      message: "Erreur lors de la récupération du modèle",
    };
  }
}

// Get all models from database
export async function getAllModele(): Promise<{ success: boolean; data?: ModeleData[]; message: string }> {
  try {
    const modeles = await prisma.voitureModel.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const modeleData: ModeleData[] = modeles.map(modele => ({
      id: modele.id,
      model: modele.model,
      fiche_technique: modele.fiche_technique,
      description: modele.description,  // Add this
      image: modele.image,              // Add this
      createdAt: modele.createdAt,
      updatedAt: modele.updatedAt,
    }));
    
    return {
      success: true,
      data: modeleData,
      message: "Modèles récupérés avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des modèles:", error);
    return {
      success: false,
      message: "Erreur lors de la récupération des modèles",
    };
  }
}

// Update a model in database
export async function updateModele(
  modelId: string,
  data: Partial<CreateModelInput>,
  files?: File[],
  hasFicheTechnique = false
): Promise<{ success: boolean; message: string }> {
  try {
    createModelSchema.partial().parse(data);
    
    const isProduction = process.env.NODE_ENV === 'production';
    let imagePath: string | undefined;
    let ficheTechniquePath: string | undefined;
    
    // Process file uploads if provided
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileUploadSchema.parse({
          name: file.name,
          type: file.type,
          size: file.size,
        });
        
        let uploadedPath: string;
        
        if (isProduction) {
          // Use Vercel Blob in production
          const timestamp = Date.now();
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const filename = `modeles/${timestamp}_${sanitizedName}`;
          
          const blob = await put(filename, file, {
            access: 'public',
          });
          
          uploadedPath = blob.url;
        } else {
          // Use local filesystem in development
          const externesDir = join(process.cwd(), "public", "externes");
          await mkdir(externesDir, { recursive: true });
          
          const timestamp = Date.now();
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
          const filename = `${timestamp}_${sanitizedName}`;
          const filepath = join(externesDir, filename);
          
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filepath, buffer);
          
          uploadedPath = `/externes/${filename}`;
        }
        
        if (hasFicheTechnique && i === files.length - 1) {
          ficheTechniquePath = uploadedPath;
        } else if (!imagePath) {
          imagePath = uploadedPath;
        }
      }
    }
    
    const updateData: {
      model?: string;
      description?: string;
      fiche_technique?: string;
      image?: string;
    } = {};

    if (data.model !== undefined) updateData.model = data.model;
    if (data.description !== undefined) updateData.description = data.description;
    if (ficheTechniquePath) updateData.fiche_technique = ficheTechniquePath;
    if (imagePath) updateData.image = imagePath;

    await prisma.voitureModel.update({
      where: { id: modelId },
      data: updateData,
    });
    
    revalidatePath("/manager/ajouter-modele");
    revalidatePath("/commercial/ajouter-modele");
    
    return {
      success: true,
      message: "Modèle mis à jour avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du modèle:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Données invalides: ${error.issues.map(e => e.message).join(", ")}`,
      };
    }
    return {
      success: false,
      message: "Erreur lors de la mise à jour du modèle",
    };
  }
}

// Delete a model from database
export async function deleteModele(modelId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get the model first to check if it has associated files
    const modele = await prisma.voitureModel.findUnique({
      where: { id: modelId }
    });

    if (!modele) {
      return {
        success: false,
        message: "Modèle non trouvé",
      };
    }

    // Delete model from database
    await prisma.voitureModel.delete({ 
      where: { id: modelId } 
    });
    
    // Delete associated files from the externes directory
    try {
      const externesDir = join(process.cwd(), "public", "externes");
      
      // Get all files in the externes directory
      const files = await readdir(externesDir);
      
      // Filter files that might be associated with this model
      // This assumes files are named with timestamps or model IDs
      const modelFiles = files.filter(file => {
        // You can customize this logic based on your file naming convention
        // For example, if files are named like "modelId_filename.ext"
        return file.includes(modelId) || file.includes(modele.model);
      });
      
      // Delete each associated file
      for (const file of modelFiles) {
        const filePath = join(externesDir, file);
        try {
          await unlink(filePath);
          console.log(`Deleted file: ${file}`);
        } catch (fileError) {
          console.warn(`Could not delete file ${file}:`, fileError);
          // Continue with other files even if one fails
        }
      }
      
      console.log(`Deleted ${modelFiles.length} associated files for model ${modelId}`);
      
    } catch (fileError) {
      console.warn("Error deleting associated files:", fileError);
      // Don't fail the entire operation if file deletion fails
    }
    
    // Revalidate relevant paths
    revalidatePath("/manager/ajouter-modele");
    
    return {
      success: true,
      message: "Modèle et fichiers associés supprimés avec succès",
    };
  } catch (error) {
    console.error("Erreur lors de la suppression du modèle:", error);
    return {
      success: false,
      message: "Erreur lors de la suppression du modèle",
    };
  }
}


