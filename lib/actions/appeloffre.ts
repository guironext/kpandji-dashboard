"use server";

import { prisma } from "@/lib/prisma";

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
