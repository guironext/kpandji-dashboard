"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "../prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

export async function updateObjectifFinanciere(
  id: string,
  data: {
    nomDuCommercial: string;
    pole: string;
    duree: string;
    chiffreAffaire: number;
    finObjectif?: string | null;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    const finObjectifDate = data.finObjectif ? new Date(data.finObjectif) : null;
    await executeWithRetry(() =>
      prisma.objectifsfinancieres.update({
      where: { id },
      data: {
        nomDuCommercial: data.nomDuCommercial,
        pole: data.pole,
        duree: data.duree,
        chiffreAffaire: new Decimal(data.chiffreAffaire),
        finObjectif: finObjectifDate,
      },
    })
    );
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true };
  } catch (error) {
    console.error("Error updating ObjectifFinanciere:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec de la modification",
    };
  }
}

export async function deleteObjectifFinanciere(id: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    await executeWithRetry(() => prisma.objectifsfinancieres.delete({ where: { id } }));
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true };
  } catch (error) {
    console.error("Error deleting ObjectifFinanciere:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Échec de la suppression",
    };
  }
}

export async function createObjectifFinanciere(data: {
  nomDuCommercial: string;
  pole: string;
  duree: string;
  chiffreAffaire: number;
  finObjectif?: string | null;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé" };

    const finObjectifDate = data.finObjectif ? new Date(data.finObjectif) : null;
    const objectif = await executeWithRetry(() =>
      prisma.objectifsfinancieres.create({
      data: {
        nomDuCommercial: data.nomDuCommercial,
        pole: data.pole,
        duree: data.duree,
        chiffreAffaire: new Decimal(data.chiffreAffaire),
        finObjectif: finObjectifDate,
        pourcentageAtteint: new Decimal(0),
      },
    })
    );
    revalidatePath("/responsablecommercial/objectifs");
    return { success: true, data: { id: objectif.id } };
  } catch (error) {
    console.error("Error creating ObjectifFinanciere:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Échec de la création" };
  }
}

export async function getObjectifsFinancieres() {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Non autorisé", data: [] };

    const objectifs = await executeWithRetry(() =>
      prisma.objectifsfinancieres.findMany({
      orderBy: [{ duree: "desc" }, { nomDuCommercial: "asc" }],
      select: {
        id: true,
        nomDuCommercial: true,
        pole: true,
        duree: true,
        chiffreAffaire: true,
        finObjectif: true,
        pourcentageAtteint: true,
        ecartCible: true,
      },
    })
    );
    return {
      success: true,
      data: objectifs.map((o) => ({
        id: o.id,
        nomDuCommercial: o.nomDuCommercial,
        pole: o.pole,
        duree: o.duree,
        chiffreAffaire: Number(o.chiffreAffaire),
        finObjectif: o.finObjectif ? o.finObjectif.toISOString() : null,
        pourcentageAtteint: Number(o.pourcentageAtteint),
        ecartCible: o.ecartCible != null ? Number(o.ecartCible) : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching ObjectifsFinancieres:", error);
    return { success: false, error: "Échec du chargement", data: [] };
  }
}
