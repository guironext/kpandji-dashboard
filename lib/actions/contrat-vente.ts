"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assembleBonCommandeSource, getBonCommandeSource, type BonCommandeSource } from "@/lib/bon-commande-lecture";
import { parseContratVenteContenu, type ContratVenteContenu } from "@/lib/contrat-vente-document";

const ETAPES_VISIBLES = ["A_VALIDER", "EN_VALIDATION", "SOUS_RESERVE", "VALIDE"] as const;

async function currentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return prisma.user.findUnique({ where: { clerkId }, select: { id: true, role: true } });
}

function isResponsableCommercial(role: string | null | undefined) {
  return role === "RESPONSABLE_COMMERCIAL" || role === "ADMIN";
}

async function ownedFacture(factureId: string, userId: string) {
  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    select: { id: true, clientId: true, clientEntrepriseId: true, status_facture: true },
  });
  if (!facture || facture.status_facture === "ANNULEE") return null;
  const prospectId = facture.clientEntrepriseId ?? facture.clientId;
  if (!prospectId) return null;
  const dossier = await prisma.dossierClientele.findFirst({
    where: {
      userId,
      prospectId,
      prospectType: facture.clientEntrepriseId ? "ENTREPRISE" : "CLIENT",
    },
    select: { id: true },
  });
  return dossier ? facture : null;
}

function revalidateContrat() {
  revalidatePath("/commercial/contract-vente");
  revalidatePath("/commercial/contract-vente-deja-valide");
  revalidatePath("/commercial/dossier-clientele");
  revalidatePath("/responsablecommercial/contrat-de-vente");
  revalidatePath("/responsablecommercial/contrat-de-vente-deja-valide");
}

export async function saveContratDeVente(factureId: string, contenu: ContratVenteContenu) {
  try {
    const user = await currentUser();
    if (!user) return { success: false as const, error: "Non autorisé" };
    const facture = await ownedFacture(factureId, user.id);
    if (!facture) return { success: false as const, error: "Cette proforma ne peut pas recevoir de contrat de vente" };

    const existing = await prisma.contratDeVente.findUnique({ where: { factureId } });
    const previous = parseContratVenteContenu(existing?.contenu);
    const stored: ContratVenteContenu = {
      ...contenu,
      etabli: contenu.etabli || previous?.etabli || false,
      etapeValidation: previous?.etapeValidation || "",
    };

    await prisma.contratDeVente.upsert({
      where: { factureId },
      create: { factureId, contenu: stored as unknown as Prisma.InputJsonValue },
      update: { contenu: stored as unknown as Prisma.InputJsonValue },
    });

    revalidateContrat();
    return { success: true as const, etabli: stored.etabli, etapeValidation: stored.etapeValidation };
  } catch (error) {
    console.error("Error saving contrat de vente:", error);
    return { success: false as const, error: "L'enregistrement a échoué" };
  }
}

export async function etablirContratDeVente(factureId: string, contenu: ContratVenteContenu) {
  return saveContratDeVente(factureId, { ...contenu, etabli: true });
}

export async function soumettreContratDeVenteValidation(factureId: string, contenu: ContratVenteContenu) {
  const saved = await saveContratDeVente(factureId, { ...contenu, etabli: true });
  if (!saved.success) return saved;

  const existing = await prisma.contratDeVente.findUnique({ where: { factureId } });
  const stored = existing ? parseContratVenteContenu(existing.contenu) : null;
  if (!stored) return { success: false as const, error: "Le contrat de vente n'a pas pu être envoyé" };

  const closed = stored.etapeValidation === "EN_VALIDATION" || stored.etapeValidation === "SOUS_RESERVE" || stored.etapeValidation === "VALIDE";
  if (closed) return { success: false as const, error: "Ce contrat ne peut plus être envoyé en validation" };

  if (stored.etapeValidation !== "A_VALIDER") {
    stored.etapeValidation = "A_VALIDER";
    stored.etabli = true;
    await prisma.contratDeVente.update({
      where: { factureId },
      data: { contenu: stored as unknown as Prisma.InputJsonValue },
    });
  }

  revalidateContrat();
  return { success: true as const };
}

export type ContratAValider = {
  factureId: string;
  client: string;
  commercial: string;
  modele: string;
  totalTtc: number;
  statut: string;
};

const ETAPES_A_VALIDER = ["A_VALIDER", "EN_VALIDATION", "SOUS_RESERVE"] as const;

export async function countContratsAValider() {
  const user = await currentUser();
  if (!isResponsableCommercial(user?.role)) return 0;
  return prisma.contratDeVente.count({
    where: {
      OR: ETAPES_A_VALIDER.map((etape) => ({
        contenu: { path: ["etapeValidation"], equals: etape },
      })),
    },
  });
}

async function loadContrats(etapes: readonly string[], ownerId?: string): Promise<ContratAValider[]> {
  if (!ownerId) {
    const user = await currentUser();
    if (!isResponsableCommercial(user?.role)) return [];
  }

  const contrats = await prisma.contratDeVente.findMany({
    where: {
      AND: [
        {
          OR: etapes.map((etape) => ({
            contenu: { path: ["etapeValidation"], equals: etape },
          })),
        },
        ...(ownerId ? [{ Facture: { userId: ownerId, status_facture: { not: "ANNULEE" as const } } }] : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      Facture: {
        select: {
          total_ttc: true,
          Client: { select: { nom: true } },
          Client_entreprise: { select: { nom_entreprise: true } },
          User: { select: { firstName: true, lastName: true } },
          FactureLigne: { take: 1, include: { VoitureModel: { select: { model: true } } } },
          Voiture: { include: { VoitureModel: { select: { model: true } } } },
        },
      },
    },
  });

  const rank: Record<string, number> = { A_VALIDER: 0, EN_VALIDATION: 1, SOUS_RESERVE: 2, VALIDE: 3 };

  return contrats
    .map((contrat) => ({
      factureId: contrat.factureId,
      client: contrat.Facture.Client_entreprise?.nom_entreprise || contrat.Facture.Client?.nom || "Client",
      commercial: `${contrat.Facture.User.firstName} ${contrat.Facture.User.lastName}`.trim(),
      modele: contrat.Facture.FactureLigne[0]?.VoitureModel.model || contrat.Facture.Voiture?.VoitureModel?.model || "",
      totalTtc: Number(contrat.Facture.total_ttc) || 0,
      statut: parseContratVenteContenu(contrat.contenu)?.etapeValidation || "",
    }))
    .sort((a, b) => (rank[a.statut] ?? 9) - (rank[b.statut] ?? 9));
}

export async function listContratsAValider(): Promise<ContratAValider[]> {
  return loadContrats(ETAPES_A_VALIDER);
}

export async function listContratsDejaValides(): Promise<ContratAValider[]> {
  return loadContrats(["VALIDE"]);
}

export async function listMesContratsDejaValides(): Promise<ContratAValider[]> {
  const user = await currentUser();
  if (!user) return [];
  return loadContrats(["VALIDE"], user.id);
}

async function openContratSource(
  contrat: { factureId: string; Facture: { clientId: string | null; clientEntrepriseId: string | null } },
  userId?: string,
): Promise<BonCommandeSource | null> {
  const prospectId = contrat.Facture.clientEntrepriseId ?? contrat.Facture.clientId;
  if (!prospectId) return null;

  const prospectType = contrat.Facture.clientEntrepriseId ? "ENTREPRISE" : "CLIENT";
  const dossier = await prisma.dossierClientele.findFirst({
    where: { prospectId, prospectType, ...(userId ? { userId } : {}) },
    orderBy: { updatedAt: "desc" },
  });
  if (dossier) {
    return getBonCommandeSource(dossier.id, contrat.factureId, userId ? undefined : { unrestricted: true });
  }

  const profil = contrat.Facture.clientEntrepriseId
    ? await prisma.client_entreprise.findUnique({
        where: { id: prospectId },
        select: { nom_entreprise: true },
      })
    : await prisma.client.findUnique({
        where: { id: prospectId },
        select: { nom: true },
      });
  const nom = profil && "nom_entreprise" in profil ? profil.nom_entreprise : profil?.nom || "Client";

  return assembleBonCommandeSource(
    {
      id: contrat.factureId,
      numero: "Contrat",
      nomCourt: nom,
      prospectId,
      prospectType,
      prospectNom: nom,
    },
    contrat.factureId,
  );
}

export async function getContratPourValidation(factureId: string): Promise<BonCommandeSource | null> {
  const user = await currentUser();
  if (!isResponsableCommercial(user?.role)) return null;

  const contrat = await prisma.contratDeVente.findUnique({
    where: { factureId },
    include: { Facture: { select: { clientId: true, clientEntrepriseId: true } } },
  });
  const etape = contrat ? parseContratVenteContenu(contrat.contenu)?.etapeValidation || "" : "";
  if (!contrat || !ETAPES_VISIBLES.includes(etape as (typeof ETAPES_VISIBLES)[number])) return null;
  return openContratSource(contrat);
}

export async function getMonContratValide(factureId: string): Promise<BonCommandeSource | null> {
  const user = await currentUser();
  if (!user) return null;

  const contrat = await prisma.contratDeVente.findFirst({
    where: {
      factureId,
      contenu: { path: ["etapeValidation"], equals: "VALIDE" },
      Facture: { userId: user.id, status_facture: { not: "ANNULEE" } },
    },
    include: { Facture: { select: { clientId: true, clientEntrepriseId: true } } },
  });
  if (!contrat) return null;
  return openContratSource(contrat, user.id);
}

async function setEtapeValidation(
  factureId: string,
  etape: "EN_VALIDATION" | "SOUS_RESERVE" | "VALIDE",
  from: Array<"A_VALIDER" | "EN_VALIDATION" | "SOUS_RESERVE">,
) {
  const user = await currentUser();
  if (!isResponsableCommercial(user?.role)) return { success: false as const, error: "Non autorisé" };

  const existing = await prisma.contratDeVente.findUnique({ where: { factureId } });
  const contenu = existing ? parseContratVenteContenu(existing.contenu) : null;
  const current = contenu?.etapeValidation || "";
  if (!existing || !contenu || !from.includes(current as "A_VALIDER" | "EN_VALIDATION" | "SOUS_RESERVE")) {
    console.error("Contrat validation refusée", { factureId, current, etape });
    return { success: false as const, error: "Ce contrat n'est pas en attente de validation" };
  }

  const next = { ...contenu, etapeValidation: etape, etabli: true };
  await prisma.contratDeVente.update({
    where: { factureId },
    data: { contenu: next as unknown as Prisma.InputJsonValue },
  });

  revalidateContrat();
  return { success: true as const };
}

export async function commencerValidationContratDeVente(factureId: string) {
  return setEtapeValidation(factureId, "EN_VALIDATION", ["A_VALIDER"]);
}

export async function validerContratDeVente(factureId: string) {
  return setEtapeValidation(factureId, "VALIDE", ["A_VALIDER", "EN_VALIDATION", "SOUS_RESERVE"]);
}

export async function marquerContratSousReserve(factureId: string) {
  return setEtapeValidation(factureId, "SOUS_RESERVE", ["A_VALIDER", "EN_VALIDATION"]);
}
