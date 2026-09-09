"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma, executeWithRetry } from "../prisma";
import { getOrCreateUser } from "./user";
import {
  FINANCE_PROJET_STATUTS,
  type StatutFinanceProjet,
} from "../finance-projet-statut";

export type { StatutFinanceProjet };

const FINANCE_PROJET_PATH = "/finance/projet";
const STATUTS: StatutFinanceProjet[] = [...FINANCE_PROJET_STATUTS];

export type FinanceProjetInput = {
  nom: string;
  description?: string | null;
  objectifVolumeAffaire?: number | string | null;
  dateDebut: string;
  dateFin?: string | null;
  statut?: StatutFinanceProjet;
  responsableIds?: string[];
  modeleIds?: string[];
  objectifs?: string[];
};

export type FinanceProjetListItem = {
  id: string;
  nom: string;
  description: string | null;
  objectifVolumeAffaire: number | null;
  dateDebut: string;
  dateFin: string | null;
  statut: StatutFinanceProjet;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; firstName: string; lastName: string };
  responsables: { id: string; firstName: string; lastName: string }[];
  modelesCibles: { id: string; model: string }[];
  objectifs: string[];
  objectifsCount: number;
  prospectsCount: number;
};

function decimalToNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    try {
      const n = (value as { toNumber: () => number }).toNumber();
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }
  const n = Number(String(value));
  return Number.isFinite(n) ? n : null;
}

function serializeProjet(row: {
  id: string;
  nom: string;
  description: string | null;
  objectifVolumeAffaire: unknown;
  dateDebut: Date;
  dateFin: Date | null;
  statut: StatutFinanceProjet;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { id: string; firstName: string; lastName: string };
  responsables: { user: { id: string; firstName: string; lastName: string } }[];
  modelesCibles: { voitureModel: { id: string; model: string } }[];
  objectifs: { titre: string }[];
  _count: { objectifs: number; prospects: number };
}): FinanceProjetListItem {
  const objectifs = (row.objectifs ?? []).map((o) => o.titre);
  return {
    id: row.id,
    nom: row.nom,
    description: row.description,
    objectifVolumeAffaire: decimalToNumber(row.objectifVolumeAffaire),
    dateDebut: row.dateDebut.toISOString(),
    dateFin: row.dateFin ? row.dateFin.toISOString() : null,
    statut: asStatutFinanceProjet(String(row.statut)),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy,
    responsables: (row.responsables ?? []).map((r) => r.user),
    modelesCibles: (row.modelesCibles ?? []).map((m) => m.voitureModel),
    objectifs,
    objectifsCount: row._count?.objectifs ?? objectifs.length,
    prospectsCount: row._count?.prospects ?? 0,
  };
}

const projetInclude = {
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  responsables: {
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  },
  modelesCibles: {
    include: { voitureModel: { select: { id: true, model: true } } },
  },
  objectifs: { select: { titre: true }, orderBy: { ordre: "asc" } },
  _count: { select: { objectifs: true, prospects: true } },
} satisfies Prisma.FinanceProjetInclude;

function asStatutFinanceProjet(value: string): StatutFinanceProjet {
  return FINANCE_PROJET_STATUTS.includes(value as StatutFinanceProjet)
    ? (value as StatutFinanceProjet)
    : "BROUILLON";
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

type FinanceProjetBaseRow = {
  id: string;
  nom: string;
  description: string | null;
  objectifVolumeAffaire: unknown;
  dateDebut: Date | string;
  dateFin: Date | string | null;
  statut: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdById: string;
};

async function queryFinanceProjetBaseRows(id?: string): Promise<FinanceProjetBaseRow[]> {
  if (id) {
    return executeWithRetry(() =>
      prisma.$queryRaw<FinanceProjetBaseRow[]>`
        SELECT id, nom, description, "objectifVolumeAffaire", "dateDebut", "dateFin",
               statut::text AS statut, "createdAt", "updatedAt", "createdById"
        FROM "FinanceProjet"
        WHERE id = ${id}
      `
    );
  }

  return executeWithRetry(() =>
    prisma.$queryRaw<FinanceProjetBaseRow[]>`
      SELECT id, nom, description, "objectifVolumeAffaire", "dateDebut", "dateFin",
             statut::text AS statut, "createdAt", "updatedAt", "createdById"
      FROM "FinanceProjet"
      ORDER BY "createdAt" DESC
    `
  );
}

async function hydrateFinanceProjetListItems(
  baseRows: FinanceProjetBaseRow[]
): Promise<FinanceProjetListItem[]> {
  if (baseRows.length === 0) return [];

  const ids = baseRows.map((row) => row.id);
  const createdByIds = Array.from(new Set(baseRows.map((row) => row.createdById)));

  const [createdByUsers, responsables, modelesCibles, objectifs, prospectGroups] =
    await executeWithRetry(() =>
      Promise.all([
        prisma.user.findMany({
          where: { id: { in: createdByIds } },
          select: { id: true, firstName: true, lastName: true },
        }),
        prisma.financeProjetResponsable.findMany({
          where: { projetId: { in: ids } },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        }),
        prisma.financeProjetModeleCible.findMany({
          where: { projetId: { in: ids } },
          include: { voitureModel: { select: { id: true, model: true } } },
        }),
        prisma.financeProjetObjectif.findMany({
          where: { projetId: { in: ids } },
          select: { projetId: true, titre: true },
          orderBy: { ordre: "asc" },
        }),
        prisma.financeProjetProspect.groupBy({
          by: ["projetId"],
          where: { projetId: { in: ids } },
          _count: { _all: true },
        }),
      ])
    );

  const createdByMap = new Map(createdByUsers.map((user) => [user.id, user]));
  const responsablesByProjet = new Map<string, { user: { id: string; firstName: string; lastName: string } }[]>();
  for (const row of responsables) {
    const list = responsablesByProjet.get(row.projetId) ?? [];
    list.push({ user: row.user });
    responsablesByProjet.set(row.projetId, list);
  }
  const modelesByProjet = new Map<string, { voitureModel: { id: string; model: string } }[]>();
  for (const row of modelesCibles) {
    const list = modelesByProjet.get(row.projetId) ?? [];
    list.push({ voitureModel: row.voitureModel });
    modelesByProjet.set(row.projetId, list);
  }
  const objectifsByProjet = new Map<string, { titre: string }[]>();
  for (const row of objectifs) {
    const list = objectifsByProjet.get(row.projetId) ?? [];
    list.push({ titre: row.titre });
    objectifsByProjet.set(row.projetId, list);
  }
  const prospectCountByProjet = new Map(
    prospectGroups.map((row) => [row.projetId, row._count._all])
  );

  return baseRows.map((row) => {
    const objectifsList = objectifsByProjet.get(row.id) ?? [];
    const createdBy = createdByMap.get(row.createdById) ?? {
      id: row.createdById,
      firstName: "",
      lastName: "",
    };
    return serializeProjet({
      id: row.id,
      nom: row.nom,
      description: row.description,
      objectifVolumeAffaire: row.objectifVolumeAffaire,
      dateDebut: asDate(row.dateDebut),
      dateFin: row.dateFin ? asDate(row.dateFin) : null,
      statut: asStatutFinanceProjet(row.statut),
      createdAt: asDate(row.createdAt),
      updatedAt: asDate(row.updatedAt),
      createdBy,
      responsables: responsablesByProjet.get(row.id) ?? [],
      modelesCibles: modelesByProjet.get(row.id) ?? [],
      objectifs: objectifsList,
      _count: {
        objectifs: objectifsList.length,
        prospects: prospectCountByProjet.get(row.id) ?? 0,
      },
    });
  });
}

export type FinanceProjetDetail = FinanceProjetListItem & {
  objectifsDetail: { titre: string; description: string | null }[];
  prospects: {
    nom: string;
    type: "CLIENT" | "ENTREPRISE";
    telephone: string | null;
    email: string | null;
  }[];
  plansActions: {
    id: string;
    titre: string;
    dateDebut: string;
    dateFin: string | null;
    etapeEnCours: string;
    resteAExecuter: string | null;
    responsable: { firstName: string; lastName: string };
    tachesCount: number;
    acteursCount: number;
  }[];
  rapports: {
    id: string;
    titre: string;
    synthese: string | null;
    avancement: number | null;
    createdAt: string;
    auteur: { firstName: string; lastName: string };
  }[];
};

function mapFinanceProjetProspects(
  prospects: Array<{
    client: { nom: string; telephone: string | null; email: string | null } | null;
    clientEntreprise: {
      nom_entreprise: string;
      telephone: string | null;
      email: string | null;
    } | null;
  }>,
): FinanceProjetDetail["prospects"] {
  const mapped: FinanceProjetDetail["prospects"] = [];
  for (const prospect of prospects) {
    if (prospect.client) {
      mapped.push({
        nom: prospect.client.nom,
        type: "CLIENT",
        telephone: prospect.client.telephone,
        email: prospect.client.email,
      });
      continue;
    }
    if (prospect.clientEntreprise) {
      mapped.push({
        nom: prospect.clientEntreprise.nom_entreprise,
        type: "ENTREPRISE",
        telephone: prospect.clientEntreprise.telephone,
        email: prospect.clientEntreprise.email,
      });
    }
  }
  return mapped;
}

function revalidateFinanceProjetPaths() {
  try {
    revalidatePath(FINANCE_PROJET_PATH);
    revalidatePath("/finance");
  } catch {
    // ignore
  }
}

async function resolveClerkUserId(clerkUserId?: string) {
  if (clerkUserId) return clerkUserId;

  const authResult = await auth();
  if (authResult?.userId) return authResult.userId;

  const clerkUser = await currentUser();
  return clerkUser?.id;
}

function parseDate(value: string, label: string): Date | { error: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { error: `${label} est invalide.` };
  }
  return date;
}

type ParsedProjetPayload =
  | { error: string }
  | {
      nom: string;
      description: string | null;
      objectifVolumeAffaire: number | null;
      dateDebut: Date;
      dateFin: Date | null;
      statut: StatutFinanceProjet;
      responsableIds: string[];
      modeleIds: string[];
      objectifs: string[];
    };

function parseProjetPayload(data: FinanceProjetInput): ParsedProjetPayload {
  const nom = data.nom?.trim();
  if (!nom) {
    return { error: "Le nom du projet est obligatoire." };
  }
  if (!data.dateDebut) {
    return { error: "La date de début est obligatoire." };
  }

  const dateDebut = parseDate(data.dateDebut, "La date de début");
  if ("error" in dateDebut) return dateDebut;

  let dateFin: Date | null = null;
  if (data.dateFin?.trim()) {
    const parsed = parseDate(data.dateFin, "La date de fin");
    if ("error" in parsed) return parsed;
    if (parsed < dateDebut) {
      return { error: "La date de fin doit être postérieure à la date de début." };
    }
    dateFin = parsed;
  }

  const statut: StatutFinanceProjet =
    data.statut && STATUTS.includes(data.statut) ? data.statut : "BROUILLON";

  let objectifVolumeAffaire: number | null = null;
  if (
    data.objectifVolumeAffaire !== null &&
    data.objectifVolumeAffaire !== undefined &&
    String(data.objectifVolumeAffaire).trim() !== ""
  ) {
    objectifVolumeAffaire = decimalToNumber(data.objectifVolumeAffaire);
    if (objectifVolumeAffaire == null || objectifVolumeAffaire < 0) {
      return { error: "L'objectif de volume d'affaires est invalide." };
    }
  }

  return {
    nom,
    description: data.description?.trim() ? data.description.trim() : null,
    objectifVolumeAffaire,
    dateDebut,
    dateFin,
    statut,
    responsableIds: Array.from(
      new Set((data.responsableIds ?? []).filter((id) => typeof id === "string" && id.trim()))
    ),
    modeleIds: Array.from(
      new Set((data.modeleIds ?? []).filter((id) => typeof id === "string" && id.trim()))
    ),
    objectifs: (data.objectifs ?? []).map((titre) => titre.trim()).filter(Boolean),
  };
}

async function assertRelatedIds(responsableIds: string[], modeleIds: string[]) {
  if (responsableIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: responsableIds } },
      select: { id: true },
    });
    if (users.length !== responsableIds.length) {
      return { error: "Un ou plusieurs responsables sont introuvables." };
    }
  }

  if (modeleIds.length > 0) {
    const modeles = await prisma.voitureModel.findMany({
      where: { id: { in: modeleIds } },
      select: { id: true },
    });
    if (modeles.length !== modeleIds.length) {
      return { error: "Un ou plusieurs modèles ciblés sont introuvables." };
    }
  }

  return null;
}

export async function getFinanceProjets(): Promise<
  | { success: true; projects: FinanceProjetListItem[] }
  | { success: false; error: string; projects: [] }
> {
  try {
    // Read statut as text so a stale Prisma client still accepts VALIDE.
    const baseRows = await queryFinanceProjetBaseRows();
    const projects = await hydrateFinanceProjetListItems(baseRows);
    return { success: true, projects };
  } catch (error) {
    console.error("getFinanceProjets error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des projets.",
      projects: [],
    };
  }
}

export async function getFinanceProjetById(
  id: string
): Promise<
  | { success: true; project: FinanceProjetDetail }
  | { success: false; error: string }
> {
  if (!id?.trim()) {
    return { success: false, error: "Le projet est introuvable." };
  }

  try {
    const baseRows = await queryFinanceProjetBaseRows(id);
    const [listItem] = await hydrateFinanceProjetListItems(baseRows);
    if (!listItem) {
      return { success: false, error: "Le projet est introuvable." };
    }

    const [objectifsDetail, prospects, plansActions, rapports] = await executeWithRetry(() =>
      Promise.all([
        prisma.financeProjetObjectif.findMany({
          where: { projetId: id },
          select: { titre: true, description: true },
          orderBy: { ordre: "asc" },
        }),
        prisma.financeProjetProspect.findMany({
          where: { projetId: id },
          include: {
            client: { select: { nom: true, telephone: true, email: true } },
            clientEntreprise: {
              select: { nom_entreprise: true, telephone: true, email: true },
            },
          },
        }),
        prisma.financePlanAction.findMany({
          where: { projetId: id },
          orderBy: { ordre: "asc" },
          include: {
            responsable: { select: { firstName: true, lastName: true } },
            _count: { select: { taches: true, acteurs: true } },
          },
        }),
        prisma.financeProjetRapport.findMany({
          where: { projetId: id },
          orderBy: { createdAt: "desc" },
          include: { auteur: { select: { firstName: true, lastName: true } } },
        }),
      ])
    );

    return {
      success: true,
      project: {
        ...listItem,
        objectifsDetail,
        prospects: mapFinanceProjetProspects(prospects),
        plansActions: plansActions.map((plan) => ({
          id: plan.id,
          titre: plan.titre,
          dateDebut: plan.dateDebut.toISOString(),
          dateFin: plan.dateFin ? plan.dateFin.toISOString() : null,
          etapeEnCours: plan.etapeEnCours,
          resteAExecuter: plan.resteAExecuter,
          responsable: plan.responsable,
          tachesCount: plan._count.taches,
          acteursCount: plan._count.acteurs,
        })),
        rapports: rapports.map((rapport) => ({
          id: rapport.id,
          titre: rapport.titre,
          synthese: rapport.synthese,
          avancement: rapport.avancement,
          createdAt: rapport.createdAt.toISOString(),
          auteur: rapport.auteur,
        })),
      },
    };
  } catch (error) {
    console.error("getFinanceProjetById error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement du projet.",
    };
  }
}

export async function createFinanceProjet(
  data: FinanceProjetInput,
  clerkUserId?: string
): Promise<
  | { success: true; project: FinanceProjetListItem }
  | { success: false; error: string }
> {
  const parsed = parseProjetPayload(data);
  if ("error" in parsed) {
    return { success: false, error: parsed.error };
  }

  try {
    const clerkId = await resolveClerkUserId(clerkUserId);
    if (!clerkId) {
      return { success: false, error: "Vous devez être connecté pour créer un projet." };
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return {
        success: false,
        error: userResult.error ?? "Utilisateur introuvable.",
      };
    }

    const relatedError = await assertRelatedIds(parsed.responsableIds, parsed.modeleIds);
    if (relatedError) {
      return { success: false, error: relatedError.error };
    }

    const row = await prisma.financeProjet.create({
      data: {
        nom: parsed.nom,
        description: parsed.description,
        objectifVolumeAffaire: parsed.objectifVolumeAffaire,
        dateDebut: parsed.dateDebut,
        dateFin: parsed.dateFin,
        statut: parsed.statut,
        createdById: userResult.data.id,
        responsables: parsed.responsableIds.length
          ? { create: parsed.responsableIds.map((userId) => ({ userId })) }
          : undefined,
        modelesCibles: parsed.modeleIds.length
          ? { create: parsed.modeleIds.map((voitureModelId) => ({ voitureModelId })) }
          : undefined,
        objectifs: parsed.objectifs.length
          ? {
              create: parsed.objectifs.map((titre, ordre) => ({ titre, ordre })),
            }
          : undefined,
      },
      include: projetInclude,
    });

    revalidateFinanceProjetPaths();
    return { success: true, project: serializeProjet(row) };
  } catch (error) {
    console.error("createFinanceProjet error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du projet.",
    };
  }
}

export async function updateFinanceProjet(
  id: string,
  data: FinanceProjetInput
): Promise<
  | { success: true; project: FinanceProjetListItem }
  | { success: false; error: string }
> {
  if (!id?.trim()) {
    return { success: false, error: "Le projet à modifier est introuvable." };
  }

  const parsed = parseProjetPayload(data);
  if ("error" in parsed) {
    return { success: false, error: parsed.error };
  }

  try {
    const existing = await prisma.financeProjet.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Le projet à modifier est introuvable." };
    }

    const relatedError = await assertRelatedIds(parsed.responsableIds, parsed.modeleIds);
    if (relatedError) {
      return { success: false, error: relatedError.error };
    }

    const row = await prisma.financeProjet.update({
      where: { id },
      data: {
        nom: parsed.nom,
        description: parsed.description,
        objectifVolumeAffaire: parsed.objectifVolumeAffaire,
        dateDebut: parsed.dateDebut,
        dateFin: parsed.dateFin,
        statut: parsed.statut,
        responsables: {
          deleteMany: {},
          create: parsed.responsableIds.map((userId) => ({ userId })),
        },
        modelesCibles: {
          deleteMany: {},
          create: parsed.modeleIds.map((voitureModelId) => ({ voitureModelId })),
        },
        objectifs: {
          deleteMany: {},
          create: parsed.objectifs.map((titre, ordre) => ({ titre, ordre })),
        },
      },
      include: projetInclude,
    });

    revalidateFinanceProjetPaths();
    return { success: true, project: serializeProjet(row) };
  } catch (error) {
    console.error("updateFinanceProjet error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour du projet.",
    };
  }
}

export async function validateFinanceProjet(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!id?.trim()) {
    return { success: false, error: "Le projet à valider est introuvable." };
  }

  try {
    const updated = await executeWithRetry(() =>
      prisma.$executeRaw(
        Prisma.sql`UPDATE "FinanceProjet" SET statut = 'VALIDE'::"StatutFinanceProjet", "updatedAt" = NOW() WHERE id = ${id}`
      )
    );

    if (Number(updated) < 1) {
      return { success: false, error: "Le projet à valider est introuvable." };
    }

    revalidateFinanceProjetPaths();
    return { success: true };
  } catch (error) {
    console.error("validateFinanceProjet error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la validation du projet.",
    };
  }
}

export async function deleteFinanceProjet(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!id?.trim()) {
    return { success: false, error: "Le projet à supprimer est introuvable." };
  }

  try {
    await executeWithRetry(() => prisma.financeProjet.delete({ where: { id } }));
    revalidateFinanceProjetPaths();
    return { success: true };
  } catch (error) {
    console.error("deleteFinanceProjet error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression du projet.",
    };
  }
}
