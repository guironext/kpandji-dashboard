"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createGoodiesBrochuresSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  categorie: z.string().optional(),
  quantite: z.union([z.string(), z.number()]).optional().transform((v) => (v === "" || v === undefined ? 0 : Number(v))),
  prix_achat: z.union([z.string(), z.number()]).optional().transform((v) => (v === "" || v === undefined ? null : Number(v))),
  origine_artisan: z.string().optional(),
  contact_artisan: z.string().optional(),
});

export type CreateGoodiesBrochuresInput = z.infer<typeof createGoodiesBrochuresSchema>;

export async function createGoodiesBrochures(
  data: CreateGoodiesBrochuresInput
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    const parsed = createGoodiesBrochuresSchema.parse(data);
    const quantite = parsed.quantite ?? 0;

    await prisma.goodiesBrochures.create({
      data: {
        nom: parsed.nom,
        description: parsed.description || null,
        categorie: parsed.categorie || null,
        quantite,
        prix_achat: parsed.prix_achat != null ? parsed.prix_achat : null,
        origine_artisan: parsed.origine_artisan || null,
        contact_artisan: parsed.contact_artisan || null,
        quantite_restante: quantite,
      },
    });

    revalidatePath("/responsablecommercial/goodies-brochures");
    return { success: true, message: "Goodies / Brochures créé avec succès" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, message: firstError?.message ?? "Données invalides" };
    }
    console.error("createGoodiesBrochures error:", error);
    return { success: false, message: "Erreur lors de la création" };
  }
}

export type UpdateGoodiesBrochuresInput = CreateGoodiesBrochuresInput;

export async function updateGoodiesBrochures(
  id: string,
  data: UpdateGoodiesBrochuresInput
): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = createGoodiesBrochuresSchema.parse(data);
    const quantite = parsed.quantite ?? 0;

    const existing = await prisma.goodiesBrochures.findUnique({
      where: { id },
      select: { quantite_attribuee: true },
    });

    if (!existing) {
      return { success: false, message: "Article introuvable" };
    }

    // When reducing quantite, cap quantite_attribuee so it never exceeds quantite
    const quantite_attribuee = Math.min(existing.quantite_attribuee, quantite);
    const quantite_restante = quantite - quantite_attribuee;

    await prisma.goodiesBrochures.update({
      where: { id },
      data: {
        nom: parsed.nom,
        description: parsed.description || null,
        categorie: parsed.categorie || null,
        quantite,
        prix_achat: parsed.prix_achat != null ? parsed.prix_achat : null,
        origine_artisan: parsed.origine_artisan || null,
        contact_artisan: parsed.contact_artisan || null,
        quantite_attribuee,
        quantite_restante,
      },
    });

    revalidatePath("/responsablecommercial/goodies-brochures");
    return { success: true, message: "Article modifié avec succès" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, message: firstError?.message ?? "Données invalides" };
    }
    console.error("updateGoodiesBrochures error:", error);
    return { success: false, message: "Erreur lors de la modification" };
  }
}

const attributionSchema = z.object({
  attribution_commercial: z.string().optional(),
  quantite_attribuee: z.union([z.string(), z.number()]).optional().transform((v) => (v === "" || v === undefined ? 0 : Number(v))),
  destination: z.string().optional(),
});

export type AttributionInput = z.infer<typeof attributionSchema>;

export async function updateGoodiesBrochuresAttribution(
  id: string,
  data: AttributionInput
): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = attributionSchema.parse(data);
    let quantite_attribuee = parsed.quantite_attribuee ?? 0;

    const existing = await prisma.goodiesBrochures.findUnique({
      where: { id },
      select: { quantite: true },
    });

    if (!existing) {
      return { success: false, message: "Article introuvable" };
    }

    // Cap quantite_attribuee to never exceed quantite
    quantite_attribuee = Math.min(Math.max(0, quantite_attribuee), existing.quantite);
    const quantite_restante = existing.quantite - quantite_attribuee;

    await prisma.goodiesBrochures.update({
      where: { id },
      data: {
        attribution_commercial: parsed.attribution_commercial || null,
        quantite_attribuee,
        destination: parsed.destination || null,
        quantite_restante,
      },
    });

    revalidatePath("/responsablecommercial/goodies-brochures");
    return { success: true, message: "Attribution enregistrée avec succès" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { success: false, message: firstError?.message ?? "Données invalides" };
    }
    console.error("updateGoodiesBrochuresAttribution error:", error);
    return { success: false, message: "Erreur lors de l'attribution" };
  }
}

export async function deleteGoodiesBrochures(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.goodiesBrochures.delete({
      where: { id },
    });

    revalidatePath("/responsablecommercial/goodies-brochures");
    return { success: true, message: "Article supprimé avec succès" };
  } catch (error) {
    console.error("deleteGoodiesBrochures error:", error);
    return { success: false, message: "Erreur lors de la suppression" };
  }
}

export type GoodiesBrochuresItem = {
  id: string;
  nom: string;
  description: string | null;
  categorie: string | null;
  quantite: number;
  prix_achat: number | null;
  origine_artisan: string | null;
  contact_artisan: string | null;
  attribution_commercial: string | null;
  quantite_attribuee: number;
  quantite_restante: number;
  destination: string | null;
  createdAt: Date;
};

export async function getAllGoodiesBrochures(): Promise<{
  success: boolean;
  data?: GoodiesBrochuresItem[];
  message?: string;
}> {
  try {
    const items = await prisma.goodiesBrochures.findMany({
      orderBy: { createdAt: "desc" },
    });

    const data: GoodiesBrochuresItem[] = items.map((item) => ({
      id: item.id,
      nom: item.nom,
      description: item.description,
      categorie: item.categorie,
      quantite: item.quantite,
      prix_achat: item.prix_achat != null ? Number(item.prix_achat) : null,
      origine_artisan: item.origine_artisan,
      contact_artisan: item.contact_artisan,
      attribution_commercial: item.attribution_commercial,
      quantite_attribuee: item.quantite_attribuee,
      quantite_restante: item.quantite_restante,
      destination: item.destination,
      createdAt: item.createdAt,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("getAllGoodiesBrochures error:", error);
    return { success: false, message: "Erreur lors du chargement" };
  }
}
