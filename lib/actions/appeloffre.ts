"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { TypeDocumentation } from "@prisma/client";
import {
  DOCUMENTATION_CATEGORIES,
  DOCUMENTATION_TYPE_LABELS,
  TYPE_TO_UI_CATEGORY,
  fileNameFromDocumentationPath,
} from "@/lib/documentation-categories";

export async function generateNextNumeroAppelOffre(factureId: string) {
  try {
    const existing = await prisma.appelOffre.findUnique({
      where: { factureId },
    });

    if (existing) {
      return {
        success: true,
        data: { numero: existing.numero_appel_offre },
      };
    }

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const fullPrefix = `AOF - ${month}${year}`;

    const latestInPeriod = await prisma.appelOffre.findFirst({
      where: {
        numero_appel_offre: {
          startsWith: fullPrefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextSequence = "0001";
    if (latestInPeriod?.numero_appel_offre) {
      const match = latestInPeriod.numero_appel_offre.match(/(\d{4})$/);
      const lastNumero = match ? parseInt(match[1], 10) : 0;
      nextSequence = (lastNumero + 1).toString().padStart(4, "0");
    }

    const fullNumero = `${fullPrefix}${nextSequence}`;

    await prisma.appelOffre.create({
      data: {
        id: crypto.randomUUID(),
        numero_appel_offre: fullNumero,
        factureId,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: { numero: fullNumero },
    };
  } catch (error) {
    console.error("Error generating Appel d'offre numero:", error);
    return {
      success: false,
      error: "Failed to generate numero",
    };
  }
}

export async function getAppelOffreByFactureId(factureId: string) {
  try {
    const appelOffre = await prisma.appelOffre.findUnique({
      where: { factureId },
    });

    return {
      success: true,
      data: appelOffre
        ? {
            id: appelOffre.id,
            numero: appelOffre.numero_appel_offre,
            validite_appel_offre: appelOffre.validite_appel_offre,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching Appel d'offre:", error);
    return {
      success: false,
      error: "Failed to fetch Appel d'offre",
    };
  }
}

export type EvolutionAppelOffreStep = {
  id?: string;
  etape_actuelle: string;
  etape_suivante: string;
};

export async function getEvolutionAppelOffreByFactureId(factureId: string) {
  try {
    const appelOffre = await prisma.appelOffre.findUnique({
      where: { factureId },
      include: {
        Evolution_Appel_Offre: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!appelOffre) {
      return {
        success: true,
        data: { steps: [] as EvolutionAppelOffreStep[] },
      };
    }

    return {
      success: true,
      data: {
        steps: appelOffre.Evolution_Appel_Offre.map((step) => ({
          id: step.id,
          etape_actuelle: step.etape_actuelle,
          etape_suivante: step.etape_suivante,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching evolution appel offre:", error);
    return {
      success: false,
      error: "Impossible de charger l'évolution",
    };
  }
}

export async function saveEvolutionAppelOffre(
  factureId: string,
  steps: EvolutionAppelOffreStep[]
) {
  try {
    const appelOffre = await prisma.appelOffre.findUnique({
      where: { factureId },
    });

    if (!appelOffre) {
      return {
        success: false,
        error:
          "Générez d'abord le numéro de l'appel d'offre avant de définir l'évolution",
      };
    }

    const validSteps = steps.filter(
      (s) => s.etape_actuelle.trim() !== "" && s.etape_suivante.trim() !== ""
    );

    if (validSteps.length === 0) {
      return {
        success: false,
        error: "Ajoutez au moins une étape avec étape actuelle et étape suivante",
      };
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.evolution_Appel_Offre.deleteMany({
        where: { appel_offreId: appelOffre.id },
      }),
      ...validSteps.map((step) =>
        prisma.evolution_Appel_Offre.create({
          data: {
            id: step.id ?? crypto.randomUUID(),
            etape_actuelle: step.etape_actuelle.trim(),
            etape_suivante: step.etape_suivante.trim(),
            appel_offreId: appelOffre.id,
            updatedAt: now,
          },
        })
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error saving evolution appel offre:", error);
    return {
      success: false,
      error: "Impossible d'enregistrer l'évolution",
    };
  }
}

export type InformationAppelOffreFormData = {
  id?: string;
  nomStrctureEmettrice: string;
  domaineActivite: string;
  telephone: string;
  email: string;
  numeroAppelOffre: string;
};

export async function getInformationAppelOffreByFactureId(factureId: string) {
  try {
    const appelOffre = await prisma.appelOffre.findUnique({
      where: { factureId },
      include: {
        Information_Appel_Offre: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!appelOffre) {
      return {
        success: true,
        data: null as InformationAppelOffreFormData | null,
      };
    }

    const latest = appelOffre.Information_Appel_Offre[0];

    return {
      success: true,
      data: latest
        ? {
            id: latest.id,
            nomStrctureEmettrice: latest.nomStrctureEmettrice,
            domaineActivite: latest.domaineActivite,
            telephone: latest.telephone,
            email: latest.email,
            numeroAppelOffre: latest.numeroAppelOffre,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching information appel offre:", error);
    return {
      success: false,
      error: "Impossible de charger les informations",
    };
  }
}

export async function saveInformationAppelOffre(
  factureId: string,
  data: InformationAppelOffreFormData
) {
  try {
    const appelOffre = await prisma.appelOffre.findUnique({
      where: { factureId },
    });

    if (!appelOffre) {
      return {
        success: false,
        error:
          "Générez d'abord le numéro de l'appel d'offre avant d'ajouter les informations",
      };
    }

    const trimmed = {
      nomStrctureEmettrice: data.nomStrctureEmettrice.trim(),
      domaineActivite: data.domaineActivite.trim(),
      telephone: data.telephone.trim(),
      email: data.email.trim(),
      numeroAppelOffre: data.numeroAppelOffre.trim(),
    };

    if (
      !trimmed.nomStrctureEmettrice ||
      !trimmed.domaineActivite ||
      !trimmed.telephone ||
      !trimmed.email ||
      !trimmed.numeroAppelOffre
    ) {
      return {
        success: false,
        error: "Tous les champs sont obligatoires",
      };
    }

    const now = new Date();

    if (data.id) {
      await prisma.information_Appel_Offre.update({
        where: { id: data.id },
        data: {
          ...trimmed,
          updatedAt: now,
        },
      });
    } else {
      await prisma.information_Appel_Offre.create({
        data: {
          id: crypto.randomUUID(),
          ...trimmed,
          appel_offreId: appelOffre.id,
          updatedAt: now,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving information appel offre:", error);
    return {
      success: false,
      error: "Impossible d'enregistrer les informations",
    };
  }
}

export type AppelOffreDocumentOption = {
  id: string;
  nom: string;
  type: TypeDocumentation;
  categoryLabel: string;
  categoryId: string;
  fichier: string;
  fileName: string;
  createdAt: string;
};

export type AppelOffreDocumentCategoryGroup = {
  categoryId: string;
  label: string;
  documents: AppelOffreDocumentOption[];
};

export async function getAppelOffreDocumentsSelectionData(factureId: string) {
  try {
    const [appelOffre, availableDocuments] = await Promise.all([
      prisma.appelOffre.findUnique({
        where: { factureId },
        include: {
          Information_Appel_Offre: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              listeDocuments: true,
            },
          },
        },
      }),
      prisma.documentation.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!appelOffre) {
      return {
        success: false,
        error:
          "Générez d'abord le numéro de l'appel d'offre avant d'ajouter des documents",
      };
    }

    const information = appelOffre.Information_Appel_Offre[0] ?? null;
    const selectedUrls = new Set(
      information?.listeDocuments.map((doc) => doc.urlDocument) ?? []
    );

    const documents: AppelOffreDocumentOption[] = availableDocuments.map(
      (doc) => {
        const categoryId = TYPE_TO_UI_CATEGORY[doc.type];
        return {
          id: doc.id,
          nom: doc.nom,
          type: doc.type,
          categoryId,
          categoryLabel: DOCUMENTATION_TYPE_LABELS[doc.type] ?? doc.type,
          fichier: doc.fichier,
          fileName: fileNameFromDocumentationPath(doc.fichier),
          createdAt: doc.createdAt.toISOString(),
        };
      }
    );

    const documentsByCategoryId = new Map<string, AppelOffreDocumentOption[]>();
    for (const doc of documents) {
      const list = documentsByCategoryId.get(doc.categoryId) ?? [];
      list.push(doc);
      documentsByCategoryId.set(doc.categoryId, list);
    }

    const categories: AppelOffreDocumentCategoryGroup[] =
      DOCUMENTATION_CATEGORIES.map(({ id, label }) => ({
        categoryId: id,
        label,
        documents: documentsByCategoryId.get(id) ?? [],
      }));

    const selectedDocumentationIds = documents
      .filter((doc) => selectedUrls.has(doc.fichier))
      .map((doc) => doc.id);

    return {
      success: true,
      data: {
        hasInformation: !!information,
        categories,
        documents,
        selectedDocumentationIds,
      },
    };
  } catch (error) {
    console.error("Error fetching appel offre documents selection:", error);
    return {
      success: false,
      error: "Impossible de charger les documents",
    };
  }
}

export async function saveAppelOffreDocuments(
  factureId: string,
  documentationIds: string[]
) {
  try {
    if (documentationIds.length === 0) {
      return {
        success: false,
        error: "Sélectionnez au moins un document",
      };
    }

    const appelOffre = await prisma.appelOffre.findUnique({
      where: { factureId },
      include: {
        Information_Appel_Offre: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!appelOffre) {
      return {
        success: false,
        error:
          "Générez d'abord le numéro de l'appel d'offre avant d'ajouter des documents",
      };
    }

    const information = appelOffre.Information_Appel_Offre[0];

    if (!information) {
      return {
        success: false,
        error:
          "Enregistrez d'abord les informations de l'appel d'offre avant d'ajouter des documents",
      };
    }

    const uniqueIds = [...new Set(documentationIds)];
    const documentationRows = await prisma.documentation.findMany({
      where: { id: { in: uniqueIds } },
    });

    if (documentationRows.length !== uniqueIds.length) {
      return {
        success: false,
        error: "Certains documents sélectionnés sont introuvables",
      };
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.document.deleteMany({
        where: { information_appel_offreId: information.id },
      }),
      ...documentationRows.map((doc) =>
        prisma.document.create({
          data: {
            id: crypto.randomUUID(),
            nomDocument: doc.nom,
            urlDocument: doc.fichier,
            information_appel_offreId: information.id,
            updatedAt: now,
          },
        })
      ),
    ]);

    revalidatePath("/commercial/appel-offre");

    return { success: true };
  } catch (error) {
    console.error("Error saving appel offre documents:", error);
    return {
      success: false,
      error: "Impossible d'enregistrer les documents",
    };
  }
}

export async function validateAppelOffre(factureId: string) {
  try {
    const appelOffre = await prisma.appelOffre.findUnique({
      where: { factureId },
    });

    if (!appelOffre) {
      return {
        success: false,
        error:
          "Générez d'abord le numéro de l'appel d'offre avant de le valider",
      };
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.appelOffre.update({
        where: { id: appelOffre.id },
        data: {
          validite_appel_offre: true,
          updatedAt: now,
        },
      }),
      prisma.evolution_Appel_Offre.create({
        data: {
          id: crypto.randomUUID(),
          etape_actuelle: "valide",
          etape_suivante: "",
          appel_offreId: appelOffre.id,
          updatedAt: now,
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error validating appel offre:", error);
    return {
      success: false,
      error: "Impossible de valider l'appel d'offre",
    };
  }
}
