"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "../prisma";

const PATH = "/commercial/visite-en-clientele";
const arr = z.array(z.string().trim().min(1)).default([]);

const schema = z.object({
  date: z.string().min(1, "La date est requise"),
  prospectId: z.string().min(1, "Le prospect est requis"),
  prospectType: z.enum(["CLIENT", "ENTREPRISE"]),
  activites: arr,
  typesVehicules: arr,
  modelesPresentes: arr,
  modelesRetenus: arr,
  lieuRencontre: z.string().trim().optional(),
  testDrivePropose: z.boolean({ message: "Indiquez si un test drive a été proposé" }),
  modesAcquisition: arr,
  barrieresDecision: arr,
  conclusion: z.object({
    besoinIdentifie: z.boolean(),
    budgetConnu: z.boolean(),
    vehiculeAdapte: z.boolean(),
    modePaiementDefini: z.boolean(),
    objectionsIdentifiees: z.boolean(),
    intentionAchat: z.boolean(),
    prochaineRencontre: z.boolean(),
  }),
});

export type RapportVisiteInput = z.input<typeof schema>;

export async function getProspectsOptions() {
  const { userId } = await auth();
  if (!userId) return [];
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return [];
  const where = { status_client: "PROSPECT" as const, userId: user.id };
  const [clients, entreprises] = await Promise.all([
    prisma.client.findMany({ where, select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.client_entreprise.findMany({ where, select: { id: true, nom_entreprise: true }, orderBy: { nom_entreprise: "asc" } }),
  ]);
  return [
    ...clients.map((c) => ({ id: c.id, type: "CLIENT" as const, nom: c.nom })),
    ...entreprises.map((e) => ({ id: e.id, type: "ENTREPRISE" as const, nom: e.nom_entreprise })),
  ].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export type ModeleOption = { id: string; model: string };

export async function getModelesOptions(): Promise<ModeleOption[]> {
  return prisma.voitureModel.findMany({ select: { id: true, model: true }, orderBy: { model: "asc" } });
}

export async function createRapportVisite(input: RapportVisiteInput) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Non authentifié" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message };
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return { success: false as const, error: "Utilisateur introuvable" };
  const d = parsed.data;
  const owned = { id: d.prospectId, userId: user.id, status_client: "PROSPECT" as const };
  const prospect =
    d.prospectType === "CLIENT"
      ? await prisma.client.findFirst({ where: owned, select: { nom: true } }).then((c) => c?.nom)
      : await prisma.client_entreprise.findFirst({ where: owned, select: { nom_entreprise: true } }).then((c) => c?.nom_entreprise);
  if (!prospect) return { success: false as const, error: "Prospect introuvable" };
  await prisma.rapportVisiteClientele.create({
    data: {
      date: new Date(d.date),
      prospectId: d.prospectId,
      prospectType: d.prospectType,
      prospectNom: prospect,
      activites: d.activites,
      typesVehicules: d.typesVehicules,
      modelesPresentes: d.modelesPresentes,
      modelesRetenus: d.modelesRetenus,
      lieuRencontre: d.lieuRencontre || null,
      testDrivePropose: d.testDrivePropose,
      modesAcquisition: d.modesAcquisition,
      barrieresDecision: d.barrieresDecision,
      conclusion: d.conclusion,
      userId: user.id,
    },
  });
  revalidatePath(PATH);
  return { success: true as const };
}

export type RapportVisiteRow = {
  id: string;
  date: Date;
  prospectId: string;
  prospectType: string;
  prospectNom: string;
  activites: unknown;
  typesVehicules: unknown;
  modelesPresentes: unknown;
  modelesRetenus: unknown;
  lieuRencontre: string | null;
  testDrivePropose: boolean | null;
  modesAcquisition: unknown;
  barrieresDecision: unknown;
  conclusion: unknown;
  User: { firstName: string; lastName: string };
};

export async function getRapportsVisite(): Promise<RapportVisiteRow[]> {
  const { userId } = await auth();
  if (!userId) return [];
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return [];
  return prisma.rapportVisiteClientele.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    include: { User: { select: { firstName: true, lastName: true } } },
  });
}

export async function deleteRapportVisite(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false as const, error: "Non authentifié" };
  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return { success: false as const, error: "Utilisateur introuvable" };
  const deleted = await prisma.rapportVisiteClientele.deleteMany({ where: { id, userId: user.id } });
  if (deleted.count === 0) return { success: false as const, error: "Rapport introuvable" };
  revalidatePath(PATH);
  return { success: true as const };
}
