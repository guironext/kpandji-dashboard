"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  STATUT_NON_CONFORMITE_VALUES,
  TYPE_NON_CONFORMITE_VALUES,
} from "@/lib/veille-juridique-display";

const PAGE_PATH = "/juridique/veille-juridique";

const dossierSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(500),
  description: z.string().min(1, "La description est requise"),
  dateOuverture: z.coerce.date(),
  dateCloture: z.coerce.date().optional().nullable(),
});

function revalidateVeilleJuridiquePath() {
  revalidatePath(PAGE_PATH);
}

export type DossierVeilleJuridiqueListItem = {
  id: string;
  titre: string;
  description: string;
  dateOuverture: Date;
  dateCloture: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    typeDossier: number;
    nouvellesLoi: number;
  };
};

export async function getDossiersVeilleJuridique(): Promise<
  | { success: true; data: DossierVeilleJuridiqueListItem[] }
  | { success: false; error: string; data: DossierVeilleJuridiqueListItem[] }
> {
  try {
    const dossiers = await prisma.dossierVeilleJuridique.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titre: true,
        description: true,
        dateOuverture: true,
        dateCloture: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            typeDossier: true,
            nouvellesLoi: true,
          },
        },
      },
    });
    return { success: true as const, data: dossiers };
  } catch (error) {
    console.error("getDossiersVeilleJuridique:", error);
    return {
      success: false as const,
      error: "Impossible de charger les dossiers de veille juridique.",
      data: [],
    };
  }
}

export async function createDossierVeilleJuridique(data: {
  titre: string;
  description: string;
  dateOuverture: Date;
  dateCloture?: Date | null;
}) {
  try {
    const parsed = dossierSchema.parse(data);

    const dossier = await prisma.dossierVeilleJuridique.create({
      data: {
        titre: parsed.titre.trim(),
        description: parsed.description.trim(),
        dateOuverture: parsed.dateOuverture,
        dateCloture: parsed.dateCloture ?? null,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: dossier };
  } catch (error) {
    console.error("createDossierVeilleJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de la création du dossier.",
    };
  }
}

export async function updateDossierVeilleJuridique(
  id: string,
  data: {
    titre: string;
    description: string;
    dateOuverture: Date;
    dateCloture?: Date | null;
  }
) {
  try {
    const parsed = dossierSchema.parse(data);

    const existing = await prisma.dossierVeilleJuridique.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Dossier introuvable." };
    }

    const dossier = await prisma.dossierVeilleJuridique.update({
      where: { id },
      data: {
        titre: parsed.titre.trim(),
        description: parsed.description.trim(),
        dateOuverture: parsed.dateOuverture,
        dateCloture: parsed.dateCloture ?? null,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: dossier };
  } catch (error) {
    console.error("updateDossierVeilleJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de la mise à jour du dossier.",
    };
  }
}

export async function deleteDossierVeilleJuridique(id: string) {
  try {
    const existing = await prisma.dossierVeilleJuridique.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Dossier introuvable." };
    }

    await prisma.dossierVeilleJuridique.delete({ where: { id } });

    revalidateVeilleJuridiquePath();
    return { success: true as const };
  } catch (error) {
    console.error("deleteDossierVeilleJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de la suppression du dossier.",
    };
  }
}


const nonConformiteSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(500),
  description: z.string().min(1, "La description est requise"),
  typeNonConformite: z.enum(TYPE_NON_CONFORMITE_VALUES),
  statutNonConformite: z.enum(STATUT_NON_CONFORMITE_VALUES),
  dateOuverture: z.coerce.date(),
  dateCloture: z.coerce.date().optional().nullable(),
  dossierVeilleJuridiqueId: z.string().min(1, "Le dossier parent est requis"),
});

export type NonConformiteJuridiqueListItem = {
  id: string;
  titre: string;
  description: string;
  typeNonConformite: string;
  statutNonConformite: string;
  dateOuverture: Date;
  dateCloture: Date | null;
  dossierVeilleJuridiqueId: string;
  createdAt: Date;
  updatedAt: Date;
  dossierVeilleJuridique: {
    id: string;
    titre: string;
  };
  _count: {
    ecartJuridique: number;
    actionCorrective: number;
  };
};

export async function getNonConformitesJuridiques(): Promise<
  | { success: true; data: NonConformiteJuridiqueListItem[] }
  | { success: false; error: string; data: NonConformiteJuridiqueListItem[] }
> {
  try {
    const items = await prisma.nonConformiteJuridique.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titre: true,
        description: true,
        typeNonConformite: true,
        statutNonConformite: true,
        dateOuverture: true,
        dateCloture: true,
        dossierVeilleJuridiqueId: true,
        createdAt: true,
        updatedAt: true,
        dossierVeilleJuridique: {
          select: { id: true, titre: true },
        },
        _count: {
          select: {
            ecartJuridique: true,
            actionCorrective: true,
          },
        },
      },
    });
    return { success: true as const, data: items };
  } catch (error) {
    console.error("getNonConformitesJuridiques:", error);
    return {
      success: false as const,
      error: "Impossible de charger les non-conformités.",
      data: [],
    };
  }
}

export async function createNonConformiteJuridique(data: {
  titre: string;
  description: string;
  typeNonConformite: string;
  statutNonConformite: string;
  dateOuverture: Date;
  dateCloture?: Date | null;
  dossierVeilleJuridiqueId: string;
}) {
  try {
    const parsed = nonConformiteSchema.parse(data);

    const dossier = await prisma.dossierVeilleJuridique.findUnique({
      where: { id: parsed.dossierVeilleJuridiqueId },
      select: { id: true },
    });
    if (!dossier) {
      return { success: false as const, error: "Dossier parent introuvable." };
    }

    const item = await prisma.nonConformiteJuridique.create({
      data: {
        titre: parsed.titre.trim(),
        description: parsed.description.trim(),
        typeNonConformite: parsed.typeNonConformite,
        statutNonConformite: parsed.statutNonConformite,
        dateOuverture: parsed.dateOuverture,
        dateCloture: parsed.dateCloture ?? null,
        dossierVeilleJuridiqueId: parsed.dossierVeilleJuridiqueId,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: item };
  } catch (error) {
    console.error("createNonConformiteJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de l'identification de la non-conformité.",
    };
  }
}

export async function updateNonConformiteJuridique(
  id: string,
  data: {
    titre: string;
    description: string;
    typeNonConformite: string;
    statutNonConformite: string;
    dateOuverture: Date;
    dateCloture?: Date | null;
    dossierVeilleJuridiqueId: string;
  }
) {
  try {
    const parsed = nonConformiteSchema.parse(data);

    const existing = await prisma.nonConformiteJuridique.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Non-conformité introuvable." };
    }

    const dossier = await prisma.dossierVeilleJuridique.findUnique({
      where: { id: parsed.dossierVeilleJuridiqueId },
      select: { id: true },
    });
    if (!dossier) {
      return { success: false as const, error: "Dossier parent introuvable." };
    }

    const item = await prisma.nonConformiteJuridique.update({
      where: { id },
      data: {
        titre: parsed.titre.trim(),
        description: parsed.description.trim(),
        typeNonConformite: parsed.typeNonConformite,
        statutNonConformite: parsed.statutNonConformite,
        dateOuverture: parsed.dateOuverture,
        dateCloture: parsed.dateCloture ?? null,
        dossierVeilleJuridiqueId: parsed.dossierVeilleJuridiqueId,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: item };
  } catch (error) {
    console.error("updateNonConformiteJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de la mise à jour de la non-conformité.",
    };
  }
}

export async function deleteNonConformiteJuridique(id: string) {
  try {
    const existing = await prisma.nonConformiteJuridique.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Non-conformité introuvable." };
    }

    await prisma.nonConformiteJuridique.delete({ where: { id } });

    revalidateVeilleJuridiquePath();
    return { success: true as const };
  } catch (error) {
    console.error("deleteNonConformiteJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de la suppression de la non-conformité.",
    };
  }
}
