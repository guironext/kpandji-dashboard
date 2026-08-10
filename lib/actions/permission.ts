"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import type { StatusPermission as PrismaStatusPermission } from "@prisma/client";

export type StatusPermission =
  | "EN_ATTENTE"
  | "VALIDE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULE";

export async function createPermission(data: {
  employeeId: string;
  datedebut: string;
  datefin: string;
  titre: StatusPermission;
  description: string;
}) {
  try {
    const permission = await prisma.permission.create({
      data: {
        id: crypto.randomUUID(),
        employeeId: data.employeeId,
        datedebut: new Date(data.datedebut),
        datefin: new Date(data.datefin),
        titre: data.titre as unknown as PrismaStatusPermission,
        description: data.description,
      },
      include: {
        Employee: { select: { nom: true, prenoms: true } },
      },
    });
    revalidatePath("/rh/demande-permission");
    return { success: true, data: permission };
  } catch (error) {
    console.error("Error creating Permission:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création de la permission",
    };
  }
}

export async function updatePermission(
  id: string,
  data: {
    employeeId?: string;
    datedebut?: string;
    datefin?: string;
    titre?: StatusPermission;
    description?: string;
  }
) {
  try {
    const permission = await prisma.permission.update({
      where: { id },
      data: {
        ...(data.employeeId && { employeeId: data.employeeId }),
        ...(data.datedebut && { datedebut: new Date(data.datedebut) }),
        ...(data.datefin && { datefin: new Date(data.datefin) }),
        ...(data.titre && {
          titre: data.titre as unknown as PrismaStatusPermission,
        }),
        ...(data.description !== undefined && { description: data.description }),
        updatedAt: new Date(),
      },
      include: {
        Employee: { select: { nom: true, prenoms: true } },
      },
    });
    revalidatePath("/rh/demande-permission");
    return { success: true, data: permission };
  } catch (error) {
    console.error("Error updating Permission:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la modification de la permission",
    };
  }
}

export async function getPermissions() {
  try {
    const permissions = await prisma.permission.findMany({
      include: {
        Employee: { select: { id: true, nom: true, prenoms: true } },
      },
      orderBy: { datedebut: "asc" },
    });
    return {
      success: true,
      data: permissions.map((p) => ({
        id: p.id,
        employeeId: p.employeeId,
        datedebut: p.datedebut.toISOString(),
        datefin: p.datefin.toISOString(),
        titre: p.titre,
        description: p.description,
        Employee: p.Employee,
      })),
    };
  } catch (error) {
    console.error("Error fetching Permissions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement des permissions",
      data: [] as never[],
    };
  }
}
