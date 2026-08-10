"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  STATUT_NON_CONFORMITE_VALUES,
  TYPE_NON_CONFORMITE_VALUES,
} from "@/lib/veille-juridique-display";

const PAGE_PATH = "/juridique/veille-juridique";
const LISTE_PATH = "/juridique/veille-juridique/liste-veilles-juridiques";

const dossierSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(500),
  description: z.string().min(1, "La description est requise"),
  dateOuverture: z.coerce.date(),
  dateCloture: z.coerce.date().optional().nullable(),
});

function revalidateVeilleJuridiquePath() {
  revalidatePath(PAGE_PATH);
  revalidatePath(LISTE_PATH);
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

const ecartRisqueSchema = z.object({
  nonConformiteJuridiqueId: z.string().min(1, "La non-conformité parente est requise"),
  obligationJuridique: z.string().min(1, "L'obligation juridique est requise"),
  situationObservee: z.string().min(1, "La situation observée est requise"),
  descriptionEcart: z.string().optional(),
  dateDetection: z.coerce.date().optional().nullable(),
  serviceConcerne: z.string().optional(),
  descriptionRisque: z.string().min(1, "La description du risque est requise"),
  probabilite: z.enum(["FAIBLE", "MOYENNE", "ELEVEE"]).optional().nullable(),
  impact: z.enum(["FAIBLE", "MOYEN", "ELEVE", "CRITIQUE"]).optional().nullable(),
  niveauRisque: z.enum(["FAIBLE", "MODERE", "ELEVE", "CRITIQUE"]).optional().nullable(),
  mesurePreventive: z.string().optional(),
});

export type EcartRisqueJuridiqueListItem = {
  id: string;
  obligationJuridique: string;
  situationObservee: string;
  descriptionEcart: string | null;
  dateDetection: Date | null;
  serviceConcerne: string | null;
  nonConformiteJuridiqueId: string;
  createdAt: Date;
  updatedAt: Date;
  nonConformiteJuridique: {
    id: string;
    titre: string;
    dossierVeilleJuridique: {
      id: string;
      titre: string;
    };
  };
  risqueJuridique: {
    id: string;
    descriptionRisque: string;
    probabilite: string | null;
    impact: string | null;
    niveauRisque: string | null;
    mesurePreventive: string | null;
  } | null;
};

export async function getEcartsRisquesJuridiques(): Promise<
  | { success: true; data: EcartRisqueJuridiqueListItem[] }
  | { success: false; error: string; data: EcartRisqueJuridiqueListItem[] }
> {
  try {
    const items = await prisma.ecartJuridique.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        obligationJuridique: true,
        situationObservee: true,
        descriptionEcart: true,
        dateDetection: true,
        serviceConcerne: true,
        nonConformiteJuridiqueId: true,
        createdAt: true,
        updatedAt: true,
        nonConformiteJuridique: {
          select: {
            id: true,
            titre: true,
            dossierVeilleJuridique: {
              select: { id: true, titre: true },
            },
          },
        },
        risqueJuridique: {
          select: {
            id: true,
            descriptionRisque: true,
            probabilite: true,
            impact: true,
            niveauRisque: true,
            mesurePreventive: true,
          },
        },
      },
    });
    return { success: true as const, data: items };
  } catch (error) {
    console.error("getEcartsRisquesJuridiques:", error);
    return {
      success: false as const,
      error: "Impossible de charger les écarts et risques juridiques.",
      data: [],
    };
  }
}

export async function createEcartRisqueJuridique(data: {
  nonConformiteJuridiqueId: string;
  obligationJuridique: string;
  situationObservee: string;
  descriptionEcart?: string;
  dateDetection?: Date | null;
  serviceConcerne?: string;
  descriptionRisque: string;
  probabilite?: string | null;
  impact?: string | null;
  niveauRisque?: string | null;
  mesurePreventive?: string;
}) {
  try {
    const parsed = ecartRisqueSchema.parse(data);

    const nonConformite = await prisma.nonConformiteJuridique.findUnique({
      where: { id: parsed.nonConformiteJuridiqueId },
      select: { id: true },
    });
    if (!nonConformite) {
      return { success: false as const, error: "Non-conformité parente introuvable." };
    }

    const result = await prisma.$transaction(async (tx) => {
      const ecart = await tx.ecartJuridique.create({
        data: {
          obligationJuridique: parsed.obligationJuridique.trim(),
          situationObservee: parsed.situationObservee.trim(),
          descriptionEcart: parsed.descriptionEcart?.trim() || null,
          dateDetection: parsed.dateDetection ?? null,
          serviceConcerne: parsed.serviceConcerne?.trim() || null,
          nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
        },
      });

      const risque = await tx.risqueJuridique.create({
        data: {
          descriptionRisque: parsed.descriptionRisque.trim(),
          probabilite: parsed.probabilite ?? null,
          impact: parsed.impact ?? null,
          niveauRisque: parsed.niveauRisque ?? null,
          mesurePreventive: parsed.mesurePreventive?.trim() || null,
          nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
          ecartJuridiqueId: ecart.id,
        },
      });

      return { ecart, risque };
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: result };
  } catch (error) {
    console.error("createEcartRisqueJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de l'enregistrement de l'écart et du risque.",
    };
  }
}

export async function updateEcartRisqueJuridique(
  ecartId: string,
  data: {
    nonConformiteJuridiqueId: string;
    obligationJuridique: string;
    situationObservee: string;
    descriptionEcart?: string;
    dateDetection?: Date | null;
    serviceConcerne?: string;
    descriptionRisque: string;
    probabilite?: string | null;
    impact?: string | null;
    niveauRisque?: string | null;
    mesurePreventive?: string;
  }
) {
  try {
    const parsed = ecartRisqueSchema.parse(data);

    const existing = await prisma.ecartJuridique.findUnique({
      where: { id: ecartId },
      select: { id: true, risqueJuridique: { select: { id: true } } },
    });
    if (!existing) {
      return { success: false as const, error: "Écart juridique introuvable." };
    }

    const nonConformite = await prisma.nonConformiteJuridique.findUnique({
      where: { id: parsed.nonConformiteJuridiqueId },
      select: { id: true },
    });
    if (!nonConformite) {
      return { success: false as const, error: "Non-conformité parente introuvable." };
    }

    const result = await prisma.$transaction(async (tx) => {
      const ecart = await tx.ecartJuridique.update({
        where: { id: ecartId },
        data: {
          obligationJuridique: parsed.obligationJuridique.trim(),
          situationObservee: parsed.situationObservee.trim(),
          descriptionEcart: parsed.descriptionEcart?.trim() || null,
          dateDetection: parsed.dateDetection ?? null,
          serviceConcerne: parsed.serviceConcerne?.trim() || null,
          nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
        },
      });

      const risqueData = {
        descriptionRisque: parsed.descriptionRisque.trim(),
        probabilite: parsed.probabilite ?? null,
        impact: parsed.impact ?? null,
        niveauRisque: parsed.niveauRisque ?? null,
        mesurePreventive: parsed.mesurePreventive?.trim() || null,
        nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
        ecartJuridiqueId: ecartId,
      };

      const risque = existing.risqueJuridique
        ? await tx.risqueJuridique.update({
            where: { id: existing.risqueJuridique.id },
            data: risqueData,
          })
        : await tx.risqueJuridique.create({ data: risqueData });

      return { ecart, risque };
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: result };
  } catch (error) {
    console.error("updateEcartRisqueJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de la mise à jour de l'écart et du risque.",
    };
  }
}

export async function deleteEcartRisqueJuridique(ecartId: string) {
  try {
    const existing = await prisma.ecartJuridique.findUnique({
      where: { id: ecartId },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Écart juridique introuvable." };
    }

    await prisma.ecartJuridique.delete({ where: { id: ecartId } });

    revalidateVeilleJuridiquePath();
    return { success: true as const };
  } catch (error) {
    console.error("deleteEcartRisqueJuridique:", error);
    return {
      success: false as const,
      error: "Erreur lors de la suppression de l'écart et du risque.",
    };
  }
}

const nouvelleLoiSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(500),
  chapitre: z.string().min(1, "Le chapitre est requis"),
  article: z.string().min(1, "L'article est requis"),
  paragraphe: z.string().optional(),
  dateOuverture: z.coerce.date(),
  dateCloture: z.coerce.date().optional().nullable(),
  ecartJuridiqueId: z.string().min(1, "L'écart juridique est requis"),
  risqueJuridiqueId: z.string().optional().nullable(),
  dossierVeilleJuridiqueId: z.string().min(1, "Le dossier est requis"),
});

export type NouvelleLoiListItem = {
  id: string;
  titre: string;
  chapitre: string;
  article: string;
  paragraphe: string | null;
  dateOuverture: Date;
  dateCloture: Date | null;
  ecartJuridiqueId: string;
  risqueJuridiqueId: string | null;
  dossierVeilleJuridiqueId: string;
  createdAt: Date;
  updatedAt: Date;
  ecartJuridique: {
    id: string;
    obligationJuridique: string;
    situationObservee: string;
  };
  risqueJuridique: {
    id: string;
    descriptionRisque: string;
    niveauRisque: string | null;
  } | null;
  dossierVeilleJuridique: {
    id: string;
    titre: string;
  };
  _count: {
    actionCorrective: number;
  };
};

export async function getNouvellesLoi(): Promise<
  | { success: true; data: NouvelleLoiListItem[] }
  | { success: false; error: string; data: NouvelleLoiListItem[] }
> {
  try {
    const items = await prisma.nouvelleLoi.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titre: true,
        chapitre: true,
        article: true,
        paragraphe: true,
        dateOuverture: true,
        dateCloture: true,
        ecartJuridiqueId: true,
        risqueJuridiqueId: true,
        dossierVeilleJuridiqueId: true,
        createdAt: true,
        updatedAt: true,
        ecartJuridique: {
          select: {
            id: true,
            obligationJuridique: true,
            situationObservee: true,
          },
        },
        risqueJuridique: {
          select: {
            id: true,
            descriptionRisque: true,
            niveauRisque: true,
          },
        },
        dossierVeilleJuridique: {
          select: { id: true, titre: true },
        },
        _count: {
          select: { actionCorrective: true },
        },
      },
    });
    return { success: true as const, data: items };
  } catch (error) {
    console.error("getNouvellesLoi:", error);
    return {
      success: false as const,
      error: "Impossible de charger les nouvelles lois.",
      data: [],
    };
  }
}

export async function createNouvelleLoi(data: {
  titre: string;
  chapitre: string;
  article: string;
  paragraphe?: string;
  dateOuverture: Date;
  dateCloture?: Date | null;
  ecartJuridiqueId: string;
  risqueJuridiqueId?: string | null;
  dossierVeilleJuridiqueId: string;
}) {
  try {
    const parsed = nouvelleLoiSchema.parse(data);

    const [ecart, dossier] = await Promise.all([
      prisma.ecartJuridique.findUnique({
        where: { id: parsed.ecartJuridiqueId },
        select: { id: true },
      }),
      prisma.dossierVeilleJuridique.findUnique({
        where: { id: parsed.dossierVeilleJuridiqueId },
        select: { id: true },
      }),
    ]);

    if (!ecart) {
      return { success: false as const, error: "Écart juridique introuvable." };
    }
    if (!dossier) {
      return { success: false as const, error: "Dossier introuvable." };
    }

    if (parsed.risqueJuridiqueId) {
      const risque = await prisma.risqueJuridique.findFirst({
        where: {
          id: parsed.risqueJuridiqueId,
          ecartJuridiqueId: parsed.ecartJuridiqueId,
        },
        select: { id: true },
      });
      if (!risque) {
        return {
          success: false as const,
          error: "Le risque sélectionné n'est pas associé à cet écart.",
        };
      }
    }

    const item = await prisma.nouvelleLoi.create({
      data: {
        titre: parsed.titre.trim(),
        chapitre: parsed.chapitre.trim(),
        article: parsed.article.trim(),
        paragraphe: parsed.paragraphe?.trim() || null,
        dateOuverture: parsed.dateOuverture,
        dateCloture: parsed.dateCloture ?? null,
        ecartJuridiqueId: parsed.ecartJuridiqueId,
        risqueJuridiqueId: parsed.risqueJuridiqueId ?? null,
        dossierVeilleJuridiqueId: parsed.dossierVeilleJuridiqueId,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: item };
  } catch (error) {
    console.error("createNouvelleLoi:", error);
    return {
      success: false as const,
      error: "Erreur lors de l'enregistrement de la nouvelle loi.",
    };
  }
}

export async function updateNouvelleLoi(
  id: string,
  data: {
    titre: string;
    chapitre: string;
    article: string;
    paragraphe?: string;
    dateOuverture: Date;
    dateCloture?: Date | null;
    ecartJuridiqueId: string;
    risqueJuridiqueId?: string | null;
    dossierVeilleJuridiqueId: string;
  }
) {
  try {
    const parsed = nouvelleLoiSchema.parse(data);

    const existing = await prisma.nouvelleLoi.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Nouvelle loi introuvable." };
    }

    const [ecart, dossier] = await Promise.all([
      prisma.ecartJuridique.findUnique({
        where: { id: parsed.ecartJuridiqueId },
        select: { id: true },
      }),
      prisma.dossierVeilleJuridique.findUnique({
        where: { id: parsed.dossierVeilleJuridiqueId },
        select: { id: true },
      }),
    ]);

    if (!ecart) {
      return { success: false as const, error: "Écart juridique introuvable." };
    }
    if (!dossier) {
      return { success: false as const, error: "Dossier introuvable." };
    }

    if (parsed.risqueJuridiqueId) {
      const risque = await prisma.risqueJuridique.findFirst({
        where: {
          id: parsed.risqueJuridiqueId,
          ecartJuridiqueId: parsed.ecartJuridiqueId,
        },
        select: { id: true },
      });
      if (!risque) {
        return {
          success: false as const,
          error: "Le risque sélectionné n'est pas associé à cet écart.",
        };
      }
    }

    const item = await prisma.nouvelleLoi.update({
      where: { id },
      data: {
        titre: parsed.titre.trim(),
        chapitre: parsed.chapitre.trim(),
        article: parsed.article.trim(),
        paragraphe: parsed.paragraphe?.trim() || null,
        dateOuverture: parsed.dateOuverture,
        dateCloture: parsed.dateCloture ?? null,
        ecartJuridiqueId: parsed.ecartJuridiqueId,
        risqueJuridiqueId: parsed.risqueJuridiqueId ?? null,
        dossierVeilleJuridiqueId: parsed.dossierVeilleJuridiqueId,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: item };
  } catch (error) {
    console.error("updateNouvelleLoi:", error);
    return {
      success: false as const,
      error: "Erreur lors de la mise à jour de la nouvelle loi.",
    };
  }
}

export async function deleteNouvelleLoi(id: string) {
  try {
    const existing = await prisma.nouvelleLoi.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Nouvelle loi introuvable." };
    }

    await prisma.nouvelleLoi.delete({ where: { id } });

    revalidateVeilleJuridiquePath();
    return { success: true as const };
  } catch (error) {
    console.error("deleteNouvelleLoi:", error);
    return {
      success: false as const,
      error: "Erreur lors de la suppression de la nouvelle loi.",
    };
  }
}

const actionCorrectiveSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(500),
  description: z.string().min(1, "La description est requise"),
  actionCorrective: z.string().min(1, "L'action corrective est requise"),
  dateDebut: z.coerce.date(),
  dateCloture: z.coerce.date().optional().nullable(),
  nonConformiteJuridiqueId: z.string().min(1, "La non-conformité est requise"),
  ecartJuridiqueId: z.string().min(1, "L'écart juridique est requis"),
  risqueJuridiqueId: z.string().optional().nullable(),
  nouvelleLoiId: z.string().min(1, "La nouvelle loi est requise"),
});

export type ActionCorrectiveListItem = {
  id: string;
  titre: string;
  description: string;
  actionCorrective: string;
  dateDebut: Date;
  dateCloture: Date | null;
  nonConformiteJuridiqueId: string;
  ecartJuridiqueId: string;
  risqueJuridiqueId: string | null;
  nouvelleLoiId: string;
  createdAt: Date;
  updatedAt: Date;
  nonConformiteJuridique: {
    id: string;
    titre: string;
    statutNonConformite: string;
  };
  ecartJuridique: {
    id: string;
    obligationJuridique: string;
  };
  risqueJuridique: {
    id: string;
    descriptionRisque: string;
    niveauRisque: string | null;
  } | null;
  nouvelleLoi: {
    id: string;
    titre: string;
    chapitre: string;
    article: string;
  };
};

export async function getActionsCorrectives(): Promise<
  | { success: true; data: ActionCorrectiveListItem[] }
  | { success: false; error: string; data: ActionCorrectiveListItem[] }
> {
  try {
    const items = await prisma.actionCorrective.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titre: true,
        description: true,
        actionCorrective: true,
        dateDebut: true,
        dateCloture: true,
        nonConformiteJuridiqueId: true,
        ecartJuridiqueId: true,
        risqueJuridiqueId: true,
        nouvelleLoiId: true,
        createdAt: true,
        updatedAt: true,
        nonConformiteJuridique: {
          select: {
            id: true,
            titre: true,
            statutNonConformite: true,
          },
        },
        ecartJuridique: {
          select: {
            id: true,
            obligationJuridique: true,
          },
        },
        risqueJuridique: {
          select: {
            id: true,
            descriptionRisque: true,
            niveauRisque: true,
          },
        },
        nouvelleLoi: {
          select: {
            id: true,
            titre: true,
            chapitre: true,
            article: true,
          },
        },
      },
    });
    return { success: true as const, data: items };
  } catch (error) {
    console.error("getActionsCorrectives:", error);
    return {
      success: false as const,
      error: "Impossible de charger les actions correctives.",
      data: [],
    };
  }
}

async function validateActionCorrectiveRelations(parsed: z.infer<typeof actionCorrectiveSchema>) {
  const nonConformite = await prisma.nonConformiteJuridique.findUnique({
    where: { id: parsed.nonConformiteJuridiqueId },
    select: { id: true },
  });
  if (!nonConformite) {
    return { valid: false as const, error: "Non-conformité introuvable." };
  }

  const ecart = await prisma.ecartJuridique.findFirst({
    where: {
      id: parsed.ecartJuridiqueId,
      nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
    },
    select: { id: true, risqueJuridique: { select: { id: true } } },
  });
  if (!ecart) {
    return {
      valid: false as const,
      error: "L'écart sélectionné n'appartient pas à cette non-conformité.",
    };
  }

  const nouvelleLoi = await prisma.nouvelleLoi.findFirst({
    where: {
      id: parsed.nouvelleLoiId,
      ecartJuridiqueId: parsed.ecartJuridiqueId,
    },
    select: { id: true },
  });
  if (!nouvelleLoi) {
    return {
      valid: false as const,
      error: "La nouvelle loi sélectionnée n'est pas liée à cet écart.",
    };
  }

  if (parsed.risqueJuridiqueId) {
    const risque = await prisma.risqueJuridique.findFirst({
      where: {
        id: parsed.risqueJuridiqueId,
        ecartJuridiqueId: parsed.ecartJuridiqueId,
      },
      select: { id: true },
    });
    if (!risque) {
      return {
        valid: false as const,
        error: "Le risque sélectionné n'est pas associé à cet écart.",
      };
    }
  }

  return { valid: true as const };
}

export async function createActionCorrective(data: {
  titre: string;
  description: string;
  actionCorrective: string;
  dateDebut: Date;
  dateCloture?: Date | null;
  nonConformiteJuridiqueId: string;
  ecartJuridiqueId: string;
  risqueJuridiqueId?: string | null;
  nouvelleLoiId: string;
}) {
  try {
    const parsed = actionCorrectiveSchema.parse(data);
    const validation = await validateActionCorrectiveRelations(parsed);
    if (!validation.valid) {
      return { success: false as const, error: validation.error };
    }

    const item = await prisma.actionCorrective.create({
      data: {
        titre: parsed.titre.trim(),
        description: parsed.description.trim(),
        actionCorrective: parsed.actionCorrective.trim(),
        dateDebut: parsed.dateDebut,
        dateCloture: parsed.dateCloture ?? null,
        nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
        ecartJuridiqueId: parsed.ecartJuridiqueId,
        risqueJuridiqueId: parsed.risqueJuridiqueId ?? null,
        nouvelleLoiId: parsed.nouvelleLoiId,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: item };
  } catch (error) {
    console.error("createActionCorrective:", error);
    return {
      success: false as const,
      error: "Erreur lors de l'enregistrement de l'action corrective.",
    };
  }
}

export async function updateActionCorrective(
  id: string,
  data: {
    titre: string;
    description: string;
    actionCorrective: string;
    dateDebut: Date;
    dateCloture?: Date | null;
    nonConformiteJuridiqueId: string;
    ecartJuridiqueId: string;
    risqueJuridiqueId?: string | null;
    nouvelleLoiId: string;
  }
) {
  try {
    const parsed = actionCorrectiveSchema.parse(data);

    const existing = await prisma.actionCorrective.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Action corrective introuvable." };
    }

    const validation = await validateActionCorrectiveRelations(parsed);
    if (!validation.valid) {
      return { success: false as const, error: validation.error };
    }

    const item = await prisma.actionCorrective.update({
      where: { id },
      data: {
        titre: parsed.titre.trim(),
        description: parsed.description.trim(),
        actionCorrective: parsed.actionCorrective.trim(),
        dateDebut: parsed.dateDebut,
        dateCloture: parsed.dateCloture ?? null,
        nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
        ecartJuridiqueId: parsed.ecartJuridiqueId,
        risqueJuridiqueId: parsed.risqueJuridiqueId ?? null,
        nouvelleLoiId: parsed.nouvelleLoiId,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: item };
  } catch (error) {
    console.error("updateActionCorrective:", error);
    return {
      success: false as const,
      error: "Erreur lors de la mise à jour de l'action corrective.",
    };
  }
}

export async function deleteActionCorrective(id: string) {
  try {
    const existing = await prisma.actionCorrective.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Action corrective introuvable." };
    }

    await prisma.actionCorrective.delete({ where: { id } });

    revalidateVeilleJuridiquePath();
    return { success: true as const };
  } catch (error) {
    console.error("deleteActionCorrective:", error);
    return {
      success: false as const,
      error: "Erreur lors de la suppression de l'action corrective.",
    };
  }
}

const formationSchema = z.object({
  titre: z.string().min(1, "Le titre est requis").max(500),
  description: z.string().min(1, "La description est requise"),
  cible: z.string().min(1, "La cible est requise"),
  typeFormation: z
    .enum(["INTERNE", "EXTERNE", "E_LEARNING", "PRESENTIEL", "HYBRIDE"])
    .optional()
    .nullable(),
  dateDebut: z.coerce.date(),
  dateCloture: z.coerce.date().optional().nullable(),
  nonConformiteJuridiqueId: z.string().min(1, "La non-conformité est requise"),
});

export type FormationListItem = {
  id: string;
  titre: string;
  description: string;
  cible: string;
  typeFormation: string | null;
  dateDebut: Date;
  dateCloture: Date | null;
  nonConformiteJuridiqueId: string;
  createdAt: Date;
  updatedAt: Date;
  nonConformiteJuridique: {
    id: string;
    titre: string;
    statutNonConformite: string;
    typeNonConformite: string;
    dossierVeilleJuridique: {
      id: string;
      titre: string;
    };
  };
};

export async function getFormations(): Promise<
  | { success: true; data: FormationListItem[] }
  | { success: false; error: string; data: FormationListItem[] }
> {
  try {
    const items = await prisma.formation.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titre: true,
        description: true,
        cible: true,
        typeFormation: true,
        dateDebut: true,
        dateCloture: true,
        nonConformiteJuridiqueId: true,
        createdAt: true,
        updatedAt: true,
        nonConformiteJuridique: {
          select: {
            id: true,
            titre: true,
            statutNonConformite: true,
            typeNonConformite: true,
            dossierVeilleJuridique: {
              select: { id: true, titre: true },
            },
          },
        },
      },
    });
    return { success: true as const, data: items };
  } catch (error) {
    console.error("getFormations:", error);
    return {
      success: false as const,
      error: "Impossible de charger les formations.",
      data: [],
    };
  }
}

export async function createFormation(data: {
  titre: string;
  description: string;
  cible: string;
  typeFormation?: string | null;
  dateDebut: Date;
  dateCloture?: Date | null;
  nonConformiteJuridiqueId: string;
}) {
  try {
    const parsed = formationSchema.parse(data);

    const nonConformite = await prisma.nonConformiteJuridique.findUnique({
      where: { id: parsed.nonConformiteJuridiqueId },
      select: { id: true },
    });
    if (!nonConformite) {
      return { success: false as const, error: "Non-conformité introuvable." };
    }

    const item = await prisma.formation.create({
      data: {
        titre: parsed.titre.trim(),
        description: parsed.description.trim(),
        cible: parsed.cible.trim(),
        typeFormation: parsed.typeFormation ?? null,
        dateDebut: parsed.dateDebut,
        dateCloture: parsed.dateCloture ?? null,
        nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: item };
  } catch (error) {
    console.error("createFormation:", error);
    return {
      success: false as const,
      error: "Erreur lors de l'enregistrement de la formation.",
    };
  }
}

export async function updateFormation(
  id: string,
  data: {
    titre: string;
    description: string;
    cible: string;
    typeFormation?: string | null;
    dateDebut: Date;
    dateCloture?: Date | null;
    nonConformiteJuridiqueId: string;
  }
) {
  try {
    const parsed = formationSchema.parse(data);

    const existing = await prisma.formation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Formation introuvable." };
    }

    const nonConformite = await prisma.nonConformiteJuridique.findUnique({
      where: { id: parsed.nonConformiteJuridiqueId },
      select: { id: true },
    });
    if (!nonConformite) {
      return { success: false as const, error: "Non-conformité introuvable." };
    }

    const item = await prisma.formation.update({
      where: { id },
      data: {
        titre: parsed.titre.trim(),
        description: parsed.description.trim(),
        cible: parsed.cible.trim(),
        typeFormation: parsed.typeFormation ?? null,
        dateDebut: parsed.dateDebut,
        dateCloture: parsed.dateCloture ?? null,
        nonConformiteJuridiqueId: parsed.nonConformiteJuridiqueId,
      },
    });

    revalidateVeilleJuridiquePath();
    return { success: true as const, data: item };
  } catch (error) {
    console.error("updateFormation:", error);
    return {
      success: false as const,
      error: "Erreur lors de la mise à jour de la formation.",
    };
  }
}

export async function deleteFormation(id: string) {
  try {
    const existing = await prisma.formation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false as const, error: "Formation introuvable." };
    }

    await prisma.formation.delete({ where: { id } });

    revalidateVeilleJuridiquePath();
    return { success: true as const };
  } catch (error) {
    console.error("deleteFormation:", error);
    return {
      success: false as const,
      error: "Erreur lors de la suppression de la formation.",
    };
  }
}
