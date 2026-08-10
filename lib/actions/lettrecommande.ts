"use server";

import { prisma } from "@/lib/prisma";

export async function generateNextNumeroLettreCommande(factureId: string) {
  try {
    const existing = await prisma.lettreCommande.findUnique({
      where: { factureId },
    });

    if (existing) {
      return {
        success: true,
        data: { numero: existing.numero_lettre_commande },
      };
    }

    const latest = await prisma.lettreCommande.findFirst({
      orderBy: { createdAt: "desc" },
    });

    let nextNumero: string;

    if (!latest || latest.numero_lettre_commande === "") {
      nextNumero = "000001";
    } else {
      const match = latest.numero_lettre_commande.match(/(\d{6})$/);
      const lastNumero = match
        ? parseInt(match[1], 10)
        : parseInt(latest.numero_lettre_commande, 10);
      const nextNum = lastNumero + 1;
      nextNumero = nextNum.toString().padStart(6, "0");
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const fullNumero = `LCVM - ${day}${month}${year}${nextNumero}`;

    await prisma.lettreCommande.create({
      data: {
        id: crypto.randomUUID(),
        numero_lettre_commande: fullNumero,
        factureId,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: { numero: fullNumero },
    };
  } catch (error) {
    console.error("Error generating Lettre de commande numero:", error);
    return {
      success: false,
      error: "Failed to generate numero",
    };
  }
}

export async function getLettreCommandeByFactureId(factureId: string) {
  try {
    const lettreCommande = await prisma.lettreCommande.findUnique({
      where: { factureId },
    });

    return {
      success: true,
      data: lettreCommande
        ? {
            id: lettreCommande.id,
            numero: lettreCommande.numero_lettre_commande,
            validite_lettre_commande: lettreCommande.validite_lettre_commande,
          }
        : null,
    };
  } catch (error) {
    console.error("Error fetching Lettre de commande:", error);
    return {
      success: false,
      error: "Failed to fetch Lettre de commande",
    };
  }
}

export type EvolutionLettreCommandeStep = {
  id?: string;
  etape_actuelle: string;
  etape_suivante: string;
};

export async function getEvolutionLettreCommandeByFactureId(
  factureId: string
) {
  try {
    const lettreCommande = await prisma.lettreCommande.findUnique({
      where: { factureId },
      include: {
        Evolution_Lettre_Commande: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!lettreCommande) {
      return {
        success: true,
        data: { steps: [] as EvolutionLettreCommandeStep[] },
      };
    }

    return {
      success: true,
      data: {
        steps: lettreCommande.Evolution_Lettre_Commande.map((step) => ({
          id: step.id,
          etape_actuelle: step.etape_actuelle,
          etape_suivante: step.etape_suivante,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching evolution lettre commande:", error);
    return {
      success: false,
      error: "Impossible de charger l'évolution",
    };
  }
}

export async function saveEvolutionLettreCommande(
  factureId: string,
  steps: EvolutionLettreCommandeStep[]
) {
  try {
    const lettreCommande = await prisma.lettreCommande.findUnique({
      where: { factureId },
    });

    if (!lettreCommande) {
      return {
        success: false,
        error:
          "Générez d'abord le numéro de la lettre de commande avant de définir l'évolution",
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
      prisma.evolution_Lettre_Commande.deleteMany({
        where: { lettre_commandeId: lettreCommande.id },
      }),
      ...validSteps.map((step) =>
        prisma.evolution_Lettre_Commande.create({
          data: {
            id: step.id ?? crypto.randomUUID(),
            etape_actuelle: step.etape_actuelle.trim(),
            etape_suivante: step.etape_suivante.trim(),
            lettre_commandeId: lettreCommande.id,
            updatedAt: now,
          },
        })
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error saving evolution lettre commande:", error);
    return {
      success: false,
      error: "Impossible d'enregistrer l'évolution",
    };
  }
}

export async function validateLettreCommande(factureId: string) {
  try {
    const lettreCommande = await prisma.lettreCommande.findUnique({
      where: { factureId },
    });

    if (!lettreCommande) {
      return {
        success: false,
        error:
          "Générez d'abord le numéro de la lettre de commande avant de la valider",
      };
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.lettreCommande.update({
        where: { id: lettreCommande.id },
        data: {
          validite_lettre_commande: true,
          updatedAt: now,
        },
      }),
      prisma.evolution_Lettre_Commande.create({
        data: {
          id: crypto.randomUUID(),
          etape_actuelle: "valide",
          etape_suivante: "",
          lettre_commandeId: lettreCommande.id,
          updatedAt: now,
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error validating lettre commande:", error);
    return {
      success: false,
      error: "Impossible de valider la lettre de commande",
    };
  }
}
