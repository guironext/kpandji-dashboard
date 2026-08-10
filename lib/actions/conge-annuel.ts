"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export type StatusCongeAnnuel =
  | "EN_ATTENTE"
  | "VALIDE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULE";

export async function createCongeAnnuel(data: {
  employeeId: string;
  datedebut: string; // ISO string
  datefin: string; // ISO string
  status?: StatusCongeAnnuel;
}) {
  try {
    const conge = await prisma.congeAnnuel.create({
      data: {
        id: crypto.randomUUID(),
        employeeId: data.employeeId,
        datedebut: new Date(data.datedebut),
        datefin: new Date(data.datefin),
        status: (data.status ?? "EN_ATTENTE") as "EN_ATTENTE" | "VALIDE" | "EN_COURS" | "TERMINEE" | "ANNULE",
        updatedAt: new Date(),
      },
      include: {
        Employee: { select: { nom: true, prenoms: true } },
      },
    });
    revalidatePath("/rh/programme-conge");
    return { success: true, data: conge };
  } catch (error) {
    console.error("Error creating CongeAnnuel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la création du congé",
    };
  }
}

export async function updateCongeAnnuel(
  id: string,
  data: {
    employeeId?: string;
    datedebut?: string;
    datefin?: string;
    status?: StatusCongeAnnuel;
  }
) {
  try {
    const conge = await prisma.congeAnnuel.update({
      where: { id },
      data: {
        ...(data.employeeId && { employeeId: data.employeeId }),
        ...(data.datedebut && { datedebut: new Date(data.datedebut) }),
        ...(data.datefin && { datefin: new Date(data.datefin) }),
        ...(data.status && {
          status: data.status as "EN_ATTENTE" | "VALIDE" | "EN_COURS" | "TERMINEE" | "ANNULE",
        }),
        updatedAt: new Date(),
      },
      include: {
        Employee: { select: { nom: true, prenoms: true } },
      },
    });
    revalidatePath("/rh/programme-conge");
    return { success: true, data: conge };
  } catch (error) {
    console.error("Error updating CongeAnnuel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors de la modification du congé",
    };
  }
}

export async function getCongesAnnuel() {
  try {
    const conges = await prisma.congeAnnuel.findMany({
      include: {
        Employee: { select: { id: true, nom: true, prenoms: true } },
      },
      orderBy: { datedebut: "asc" },
    });
    return {
      success: true,
      data: conges.map((c) => ({
        id: c.id,
        employeeId: c.employeeId,
        datedebut: c.datedebut.toISOString(),
        datefin: c.datefin.toISOString(),
        status: c.status,
        Employee: c.Employee,
      })),
    };
  } catch (error) {
    console.error("Error fetching CongesAnnuel:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur lors du chargement des congés",
      data: [] as never[],
    };
  }
}
