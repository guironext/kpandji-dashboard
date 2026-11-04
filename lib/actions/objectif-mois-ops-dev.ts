"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../prisma";

const schema = z
  .object({
    objectif: z.string().trim().min(1, "L'objectif est requis"),
    description: z.string().trim().optional(),
    startDate: z.string().min(1, "La date de début est requise"),
    endDate: z.string().min(1, "La date de fin est requise"),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["endDate"],
  });

export async function createObjectifMois(input: z.input<typeof schema>) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Non authentifié" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message };
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return { success: false as const, error: "Utilisateur introuvable" };
  const d = parsed.data;
  await prisma.objectifMoisOpsDev.create({
    data: {
      objectif: d.objectif,
      description: d.description || null,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      userId: user.id,
    },
  });
  revalidatePath("/operationsDeveCom/objectifs-mois");
  return { success: true as const };
}

export async function getObjectifsMois() {
  return prisma.objectifMoisOpsDev.findMany({
    orderBy: { createdAt: "desc" },
    include: { User: { select: { firstName: true, lastName: true } } },
  });
}

export async function updateObjectifMoisOpsDev(id: string, input: z.input<typeof schema>) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Non authentifié" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message };
  const d = parsed.data;
  try {
    await prisma.objectifMoisOpsDev.update({
      where: { id },
      data: {
        objectif: d.objectif,
        description: d.description || null,
        startDate: new Date(d.startDate),
        endDate: new Date(d.endDate),
      },
    });
  } catch {
    return { success: false as const, error: "Objectif introuvable" };
  }
  revalidatePath("/operationsDeveCom/objectifs-mois");
  return { success: true as const };
}

export async function deleteObjectifMoisOpsDev(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Non authentifié" };
  try {
    await prisma.objectifMoisOpsDev.delete({ where: { id } });
  } catch {
    return { success: false as const, error: "Suppression impossible" };
  }
  revalidatePath("/operationsDeveCom/objectifs-mois");
  return { success: true as const };
}
