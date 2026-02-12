"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { Qualite } from "@prisma/client";

export async function createEquipe(data: {
  nomEquipe: string;
  mission: string;
  taches_accomplies: string;
  chefEquipeId: string;
  activite: string;
  montageId?: string;
}) {
  try {
    const equipe = await prisma.equipe.create({
      data: {
        nomEquipe: data.nomEquipe,
        mission: data.mission,
        taches_accomplies: data.taches_accomplies,
        chefEquipeId: data.chefEquipeId,
        activite: data.activite,
        montageId: data.montageId || null,
      },
      include: {
        Employee: true,
        EquipeMembre: {
          include: {
            Employee: true,
          },
        },
      },
    });

    // Remap for frontend compatibility
    const serializedEquipe = {
      ...equipe,
      chefEquipe: ((equipe as unknown) as { Employee: unknown }).Employee,
      membres: ((equipe as unknown) as { EquipeMembre: Array<{ Employee: unknown }> }).EquipeMembre?.map((m) => ({
        ...m,
        employee: m.Employee,
      })),
    };

    revalidatePath("/chefusine/equipe");
    return { success: true, data: serializedEquipe };
  } catch (error) {
    console.error("Error creating equipe:", error);
    return { success: false, error: "Failed to create equipe" };
  }
}

export async function getAllEquipes() {
  try {
    const equipes = await prisma.equipe.findMany({
      include: {
        Employee: true,
        EquipeMembre: {
          include: {
            Employee: true,
          },
        },
        Montage: {
          include: {
            Commande_Montage_commandeIdToCommande: {
              include: {
                Client: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Remap for frontend compatibility
    const serializedEquipes = (equipes as unknown[]).map((equipe: unknown) => {
      const e = equipe as Record<string, unknown> & {
        Employee?: unknown;
        EquipeMembre?: Array<{ Employee: unknown }>;
        Montage?: Record<string, unknown> & {
          Commande_Montage_commandeIdToCommande?: Record<string, unknown> & {
            Client?: unknown;
          };
        };
      };
      return {
        ...e,
        chefEquipe: e.Employee,
        membres: (e.EquipeMembre || []).map((m) => ({
          ...m,
          employee: m.Employee,
        })),
        montage: e.Montage ? {
          ...e.Montage,
          commande: e.Montage.Commande_Montage_commandeIdToCommande ? {
            ...e.Montage.Commande_Montage_commandeIdToCommande,
            client: e.Montage.Commande_Montage_commandeIdToCommande.Client,
          } : null,
        } : null,
      };
    });

    return { success: true, data: serializedEquipes };
  } catch (error) {
    console.error("Error fetching equipes:", error);
    return { success: false, error: "Failed to fetch equipes" };
  }
}

export async function addMemberToEquipe(
  equipeId: string,
  employeeId: string,
  qualite: Qualite,
  fonction: string,
) {
  try {
    const membre = await prisma.equipeMembre.create({
      data: {
        id: crypto.randomUUID(),
        equipeId,
        employeeId,
        qualite,
        fonction,
        updatedAt: new Date(),
      },
      include: {
        Employee: true,
      },
    });

    // Remap for frontend compatibility
    const serializedMembre = {
      ...membre,
      employee: ((membre as unknown) as { Employee: unknown }).Employee,
    };

    revalidatePath("/chefusine/equipe");
    return { success: true, data: serializedMembre };
  } catch (error) {
    console.error("Error adding member to equipe:", error);
    return { success: false, error: "Failed to add member to equipe" };
  }
}

export async function removeMemberFromEquipe(membreId: string) {
  try {
    await prisma.equipeMembre.delete({
      where: { id: membreId },
    });

    revalidatePath("/chefusine/equipe");
    return { success: true };
  } catch (error) {
    console.error("Error removing member from equipe:", error);
    return { success: false, error: "Failed to remove member from equipe" };
  }
}

export async function updateEquipe(
  id: string,
  data: {
    nomEquipe?: string;
    mission?: string;
    taches_accomplies?: string;
    activite?: string;
    chefEquipeId?: string;
  },
) {
  try {
    const equipe = await prisma.equipe.update({
      where: { id },
      data,
      include: {
        Employee: true,
        EquipeMembre: {
          include: {
            Employee: true,
          },
        },
      },
    });

    // Remap for frontend compatibility
    const serializedEquipe = {
      ...equipe,
      chefEquipe: ((equipe as unknown) as { Employee: unknown }).Employee,
      membres: ((equipe as unknown) as { EquipeMembre: Array<{ Employee: unknown }> }).EquipeMembre?.map((m) => ({
        ...m,
        employee: m.Employee,
      })),
    };

    revalidatePath("/chefusine/equipe");
    return { success: true, data: serializedEquipe };
  } catch (error) {
    console.error("Error updating equipe:", error);
    return { success: false, error: "Failed to update equipe" };
  }
}

export async function deleteEquipe(id: string) {
  try {
    await prisma.equipe.delete({
      where: { id },
    });

    revalidatePath("/chefusine/equipe");
    return { success: true };
  } catch (error) {
    console.error("Error deleting equipe:", error);
    return { success: false, error: "Failed to delete equipe" };
  }
}

export async function getMontagesWithExecutionStatus() {
  try {
    const montages = await prisma.montage.findMany({
      where: {
        etapeMontage: "EXECUTION",
      },
      include: {
        OrdreMontage: {
          where: {
            ordreMontageFlag: "EXECUTION",
          },
          include: {
            Commande: {
              include: {
                Client: true,
                VoitureModel: true,
              },
            },
            Voiture: {
              include: {
                VoitureModel: true,
              },
            },
            NumeroChassis: true,
          },
        },
        Equipe: {
          where: {
            stautsEquipe: "ACTIVE",
          },
          include: {
            Employee: true,
            EquipeMembre: {
              include: {
                Employee: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter to only include montages that have at least one equipe with ACTIVE status
    const filteredMontages = (montages as unknown[])
      .map((montage: unknown) => {
        const m = montage as Record<string, unknown> & {
          createdAt: Date;
          updatedAt: Date;
          OrdreMontage?: Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
            Commande?: Record<string, unknown> & {
              createdAt: Date;
              updatedAt: Date;
              Client?: unknown;
              VoitureModel?: unknown;
            };
            Voiture?: Record<string, unknown> & {
              createdAt: Date;
              updatedAt: Date;
              VoitureModel?: unknown;
            };
            NumeroChassis?: unknown;
          };
          Equipe?: Array<Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
            Employee?: unknown;
            EquipeMembre?: Array<{
              createdAt: Date;
              updatedAt: Date;
              Employee?: unknown;
            }>;
          }>;
        };
        return {
          ...m,
          createdAt: (m.createdAt as Date).toISOString(),
          updatedAt: (m.updatedAt as Date).toISOString(),
          ordreMontage: m.OrdreMontage
            ? {
                ...m.OrdreMontage,
                createdAt: (m.OrdreMontage.createdAt as Date).toISOString(),
                updatedAt: (m.OrdreMontage.updatedAt as Date).toISOString(),
                commande: m.OrdreMontage.Commande
                  ? {
                      ...m.OrdreMontage.Commande,
                      createdAt:
                        (m.OrdreMontage.Commande.createdAt as Date).toISOString(),
                      updatedAt:
                        (m.OrdreMontage.Commande.updatedAt as Date).toISOString(),
                      client: m.OrdreMontage.Commande.Client,
                      voitureModel: m.OrdreMontage.Commande.VoitureModel,
                    }
                  : null,
                voiture: m.OrdreMontage.Voiture
                  ? {
                      ...m.OrdreMontage.Voiture,
                      createdAt:
                        (m.OrdreMontage.Voiture.createdAt as Date).toISOString(),
                      updatedAt:
                        (m.OrdreMontage.Voiture.updatedAt as Date).toISOString(),
                      voitureModel: m.OrdreMontage.Voiture.VoitureModel,
                    }
                  : null,
                numeroChassis: m.OrdreMontage.NumeroChassis,
              }
            : null,
          equipes: (m.Equipe || []).map((equipe) => ({
            ...equipe,
            createdAt: (equipe.createdAt as Date).toISOString(),
            updatedAt: (equipe.updatedAt as Date).toISOString(),
            chefEquipe: equipe.Employee
              ? {
                  ...equipe.Employee,
                }
              : null,
            membres: (equipe.EquipeMembre || []).map((membre) => ({
              ...membre,
              createdAt: (membre.createdAt as Date).toISOString(),
              updatedAt: (membre.updatedAt as Date).toISOString(),
              employee: {
                ...(membre.Employee as Record<string, unknown>),
              },
            })),
          })),
        };
      })
      .filter((montage) => (montage.equipes as unknown[]).length > 0);

    return { success: true, data: filteredMontages };
  } catch (error) {
    console.error("Error fetching montages with execution status:", error);
    return { success: false, error: "Failed to fetch montages" };
  }
}

export async function getSparePartsForAttribution() {
  try {
    const spareParts = await prisma.sparePart.findMany({
      where: {
        etapeSparePart: "RANGE",
        quantity: {
          gt: 0,
        },
      },
      include: {
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        Storage: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedSpareParts = (spareParts as unknown[]).map((sp: unknown) => {
      const spare = sp as Record<string, unknown> & {
        createdAt: Date;
        updatedAt: Date;
        Voiture?: Record<string, unknown> & {
          createdAt: Date;
          updatedAt: Date;
          VoitureModel?: Record<string, unknown> & {
            createdAt: Date;
            updatedAt: Date;
          };
        };
        Storage?: Record<string, unknown> & {
          createdAt: Date;
          updatedAt: Date;
        };
      };
      return {
        ...spare,
        createdAt: (spare.createdAt as Date).toISOString(),
        updatedAt: (spare.updatedAt as Date).toISOString(),
        voiture: spare.Voiture
          ? {
              ...spare.Voiture,
              createdAt: (spare.Voiture.createdAt as Date).toISOString(),
              updatedAt: (spare.Voiture.updatedAt as Date).toISOString(),
              voitureModel: spare.Voiture.VoitureModel
                ? {
                    ...spare.Voiture.VoitureModel,
                    createdAt: (spare.Voiture.VoitureModel.createdAt as Date).toISOString(),
                    updatedAt: (spare.Voiture.VoitureModel.updatedAt as Date).toISOString(),
                  }
                : null,
            }
          : null,
        Storage: spare.Storage
          ? {
              ...spare.Storage,
              createdAt: (spare.Storage.createdAt as Date).toISOString(),
              updatedAt: (spare.Storage.updatedAt as Date).toISOString(),
            }
          : null,
      };
    });

    return { success: true, data: serializedSpareParts };
  } catch (error) {
    console.error("Error fetching spare parts for attribution:", error);
    return { success: false, error: "Failed to fetch spare parts" };
  }
}
