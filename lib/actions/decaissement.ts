"use server";

import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { executeWithRetry, prisma } from "@/lib/prisma";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  COMMERCIAL: "Commercial",
  CHEFUSINE: "Chef Usine",
  CHEFEQUIPE: "Chef Équipe",
  MAGASINIER: "Magasinier",
  RH: "RH",
  JURIDIQUE: "Juridique",
  CHEFQUALITE: "Chef Qualité",
  EMPLOYEE: "Employé",
  SAV: "SAV",
  LOGISTIQUE: "Logistique",
  FINANCE: "Finance",
  DIRECTEUR_GENERAL: "Directeur Général",
  CLIENTELLE: "Clientèle",
  COMPTABLE: "Comptable",
  CONCESSIONAIRE: "Concessionnaire",
  SUPERVISEUR: "Superviseur",
  COMMUNICATION: "Communication",
  RESPONSABLE_COMMERCIAL: "Responsable Commercial",
  ASSISTANTE: "Assistante",
  INFOGRAPHIE: "Infographie",
  COMMUNITY_MANAGER: "Community Manager",
  MARKETING: "Marketing",
  DEVELOPPEUR: "Développeur",
  DESIGNER: "Designer",
};

function roleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export type DecaissementItem = {
  id: string;
  demandeur: string;
  service: string | null;
  departement: string;
  raison: string;
  montant: string;
  validationDepartement: boolean;
  decaissementEffectues: boolean;
  montantDecaisse: string | null;
  createdAt: string;
  updatedAt: string;
};

function toDecaissementItem(row: {
  id: string;
  demandeur: string;
  service: string | null;
  departement: string;
  raison: string;
  montant: string;
  validationDepartement: boolean;
  decaissementEffectues: boolean | null;
  montantDecaisse: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DecaissementItem {
  return {
    id: row.id,
    demandeur: row.demandeur,
    service: row.service,
    departement: row.departement,
    raison: row.raison,
    montant: row.montant,
    validationDepartement: row.validationDepartement,
    decaissementEffectues: row.decaissementEffectues ?? false,
    montantDecaisse: row.montantDecaisse,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const LIST_PATH = "/commercial/demande-de-decaissement";
const RESPO_LIST_PATH = "/responsablecommercial/demande-de-decaissement";
const COMPTABLE_LIST_PATH = "/comptable/demande-de-decaissement";
const BON_PATH = "/comptable/bon-de-decaissement";

function revalidateDecaissementPaths() {
  revalidatePath(LIST_PATH);
  revalidatePath(RESPO_LIST_PATH);
  revalidatePath(COMPTABLE_LIST_PATH);
  revalidatePath(BON_PATH);
}

function sameDemandeur(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function getCurrentDecaissementIdentity(): Promise<{
  success: boolean;
  demandeur: string;
  departement: string;
  error?: string;
}> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return {
        success: false,
        demandeur: "",
        departement: "",
        error: "Utilisateur non connecté",
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
      select: { firstName: true, lastName: true, role: true },
    });

    const demandeur = dbUser
      ? `${dbUser.firstName} ${dbUser.lastName}`.trim()
      : [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        clerkUser.fullName ||
        "";

    const role =
      dbUser?.role ??
      (typeof clerkUser.publicMetadata?.role === "string"
        ? clerkUser.publicMetadata.role
        : "");

    return {
      success: true,
      demandeur,
      departement: roleLabel(role),
    };
  } catch (error) {
    console.error("Error resolving decaissement identity:", error);
    return {
      success: false,
      demandeur: "",
      departement: "",
      error:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer l'utilisateur",
    };
  }
}

export async function getDecaissements(): Promise<{
  success: boolean;
  data: DecaissementItem[];
  error?: string;
}> {
  try {
    const rows = await prisma.decaissement.findMany({
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: rows.map(toDecaissementItem),
    };
  } catch (error) {
    console.error("Error fetching Decaissements:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des demandes",
    };
  }
}

export async function getCommercialDecaissements(): Promise<{
  success: boolean;
  data: DecaissementItem[];
  error?: string;
}> {
  try {
    const data = await executeWithRetry(async () => {
      const commercialUsers = await prisma.user.findMany({
        where: { role: UserRole.COMMERCIAL },
        select: { firstName: true, lastName: true },
      });

      const commercialNames = commercialUsers
        .map((user) => `${user.firstName} ${user.lastName}`.trim())
        .filter(Boolean);
      const commercialNameKeys = new Set(
        commercialNames.map((name) => name.toLowerCase())
      );
      const commercialDepartement = roleLabel(UserRole.COMMERCIAL);

      const rows = await prisma.decaissement.findMany({
        where: {
          OR: [
            {
              departement: {
                equals: commercialDepartement,
                mode: "insensitive",
              },
            },
            ...(commercialNames.length > 0
              ? [{ demandeur: { in: commercialNames } }]
              : []),
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      const commercialDepartementKey = commercialDepartement.toLowerCase();
      return rows
        .filter((row) => {
          const demandeur = row.demandeur.trim().toLowerCase();
          const departement = row.departement.trim().toLowerCase();
          return (
            commercialNameKeys.has(demandeur) ||
            departement === commercialDepartementKey
          );
        })
        .map(toDecaissementItem);
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching commercial Decaissements:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des demandes commerciales",
    };
  }
}

export async function createDecaissement(data: {
  demandeur: string;
  service?: string;
  departement: string;
  raison: string;
  montant: string;
}): Promise<{ success: boolean; data?: DecaissementItem; error?: string }> {
  const demandeur = data.demandeur.trim();
  const departement = data.departement.trim();
  const raison = data.raison.trim();
  const montant = data.montant.trim();
  const service = data.service?.trim() || null;

  if (!demandeur || !departement || !raison || !montant) {
    return {
      success: false,
      error: "Demandeur, département, raison et montant sont requis.",
    };
  }

  try {
    const row = await prisma.decaissement.create({
      data: {
        id: crypto.randomUUID(),
        demandeur,
        service,
        departement,
        raison,
        montant,
        updatedAt: new Date(),
      },
    });

    revalidateDecaissementPaths();

    return {
      success: true,
      data: toDecaissementItem(row),
    };
  } catch (error) {
    console.error("Error creating Decaissement:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement de la demande",
    };
  }
}

export async function updateDecaissement(
  id: string,
  data: {
    service?: string;
    raison: string;
    montant: string;
  }
): Promise<{ success: boolean; data?: DecaissementItem; error?: string }> {
  const raison = data.raison.trim();
  const montant = data.montant.trim();
  const service = data.service?.trim() || null;

  if (!raison || !montant) {
    return {
      success: false,
      error: "La raison et le montant sont requis.",
    };
  }

  try {
    const row = await prisma.decaissement.update({
      where: { id },
      data: {
        service,
        raison,
        montant,
        updatedAt: new Date(),
      },
    });

    revalidateDecaissementPaths();

    return {
      success: true,
      data: toDecaissementItem(row),
    };
  } catch (error) {
    console.error("Error updating Decaissement:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification de la demande",
    };
  }
}

export async function deleteDecaissement(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.decaissement.delete({ where: { id } });
    revalidateDecaissementPaths();
    return { success: true };
  } catch (error) {
    console.error("Error deleting Decaissement:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression de la demande",
    };
  }
}

export async function getBonsDeDecaissement(): Promise<{
  success: boolean;
  data: DecaissementItem[];
  error?: string;
}> {
  try {
    const rows = await prisma.decaissement.findMany({
      where: { decaissementEffectues: true },
      orderBy: { updatedAt: "desc" },
    });

    return {
      success: true,
      data: rows.map(toDecaissementItem),
    };
  } catch (error) {
    console.error("Error fetching bons de décaissement:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des bons de décaissement",
    };
  }
}

export async function getComptableDecaissements(): Promise<{
  success: boolean;
  data: DecaissementItem[];
  demandeur: string;
  error?: string;
}> {
  try {
    const identity = await getCurrentDecaissementIdentity();
    const demandeur = identity.demandeur.trim();

    const rows = await prisma.decaissement.findMany({
      where: {
        OR: [
          { validationDepartement: true },
          ...(demandeur
            ? [
                {
                  demandeur: {
                    equals: demandeur,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      demandeur,
      data: rows.map(toDecaissementItem),
    };
  } catch (error) {
    console.error("Error fetching comptable Decaissements:", error);
    return {
      success: false,
      data: [],
      demandeur: "",
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement des demandes",
    };
  }
}

async function assertOwnDecaissement(id: string): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const identity = await getCurrentDecaissementIdentity();
  if (!identity.success || !identity.demandeur.trim()) {
    return { ok: false, error: "Utilisateur non connecté" };
  }

  const row = await prisma.decaissement.findUnique({
    where: { id },
    select: { demandeur: true },
  });

  if (!row) {
    return { ok: false, error: "Demande introuvable" };
  }

  if (!sameDemandeur(row.demandeur, identity.demandeur)) {
    return {
      ok: false,
      error: "Vous ne pouvez agir que sur vos propres demandes.",
    };
  }

  return { ok: true };
}

export async function updateOwnDecaissement(
  id: string,
  data: {
    service?: string;
    raison: string;
    montant: string;
  }
): Promise<{ success: boolean; data?: DecaissementItem; error?: string }> {
  const ownership = await assertOwnDecaissement(id);
  if (!ownership.ok) {
    return { success: false, error: ownership.error };
  }
  return updateDecaissement(id, data);
}

export async function deleteOwnDecaissement(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const ownership = await assertOwnDecaissement(id);
  if (!ownership.ok) {
    return { success: false, error: ownership.error };
  }
  return deleteDecaissement(id);
}

export async function effectuerDecaissement(
  id: string,
  montantDecaisse?: string
): Promise<{ success: boolean; data?: DecaissementItem; error?: string }> {
  try {
    const existing = await prisma.decaissement.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Demande introuvable" };
    }

    const amount =
      montantDecaisse?.trim() || existing.montantDecaisse || existing.montant;

    const row = await prisma.decaissement.update({
      where: { id },
      data: {
        decaissementEffectues: true,
        montantDecaisse: amount,
        updatedAt: new Date(),
      },
    });

    revalidateDecaissementPaths();

    return {
      success: true,
      data: toDecaissementItem(row),
    };
  } catch (error) {
    console.error("Error marking Decaissement as done:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la validation du décaissement",
    };
  }
}

export async function validateDecaissement(
  id: string
): Promise<{ success: boolean; data?: DecaissementItem; error?: string }> {
  try {
    const row = await prisma.decaissement.update({
      where: { id },
      data: {
        validationDepartement: true,
        updatedAt: new Date(),
      },
    });

    revalidateDecaissementPaths();

    return {
      success: true,
      data: toDecaissementItem(row),
    };
  } catch (error) {
    console.error("Error validating Decaissement:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la validation de la demande",
    };
  }
}
