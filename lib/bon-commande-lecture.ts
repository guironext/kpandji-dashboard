import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { parseBonCommandeContenu, type BonCommandeContenu } from "@/lib/bon-commande-document";
import { parseContratVenteContenu, type ContratVenteContenu } from "@/lib/contrat-vente-document";

export async function currentUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await executeWithRetry(() =>
    prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } }),
  );
  return user?.id ?? null;
}

export async function currentUserRole() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await executeWithRetry(() =>
    prisma.user.findUnique({ where: { clerkId: userId }, select: { role: true } }),
  );
  return user?.role ?? null;
}

export function isResponsableCommercial(role: string | null) {
  return role === "RESPONSABLE_COMMERCIAL" || role === "ADMIN";
}

export function asNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function etapeOf(contenu: unknown) {
  return parseBonCommandeContenu(contenu)?.etapeValidation || "";
}

function statutAffiche(bon: { status_bon_de_commande: string; contenu: unknown }) {
  const column = bon.status_bon_de_commande;
  if (column === "VALIDE" || column === "VALIDE_APPORT_INITIAL" || column === "SOUS_RESERVE" || column === "ANNULE") {
    return column;
  }
  return etapeOf(bon.contenu) || column;
}

export type DossierBonOption = {
  id: string;
  numero: string;
  nomCourt: string;
  prospectNom: string;
  prospectType: string;
  proformaCount: number;
  bonCount: number;
  derniereProforma: string | null;
  totalTtc: number | null;
};

export type BonCommandeOptionLine = {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
};

export type BonCommandeProformaRef = {
  id: string;
  date: string;
  statut: string;
  totalTtc: number;
  vehicule: string | null;
  hasBon: boolean;
};

export type BonCommandeDocumentData = {
  factureId: string;
  clientId: string | null;
  clientEntrepriseId: string | null;
  date: string;
  echeance: string;
  statut: string;
  bon: { numero: string; statut: string; date: string } | null;
  contenu: BonCommandeContenu | null;
  contrat: ContratVenteContenu | null;
  client: {
    kind: "CLIENT" | "ENTREPRISE";
    nom: string;
    email: string | null;
    telephone: string;
    adresse: string | null;
    representant: string | null;
  };
  commercial: { nom: string; telephone: string | null };
  vehicule: {
    modele: string;
    carrosserie: string | null;
    motorisation: string | null;
    transmission: string | null;
    couleur: string | null;
    quantite: number;
    chassis: string | null;
  } | null;
  options: BonCommandeOptionLine[];
  prix: {
    vehiculeHt: number;
    optionsHt: number;
    remisePct: number;
    remiseMontant: number;
    totalHt: number;
    tvaPct: number;
    tvaMontant: number;
    totalTtc: number;
  };
};

export type BonCommandeSource = {
  dossier: { id: string; numero: string; nomCourt: string; prospectNom: string };
  proformas: BonCommandeProformaRef[];
  selected: BonCommandeDocumentData | null;
};

export async function listDossiersPourBonDeCommande(): Promise<DossierBonOption[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const dossiers = await prisma.dossierClientele.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (dossiers.length === 0) return [];

  const clientIds = dossiers.filter((item) => item.prospectType !== "ENTREPRISE").map((item) => item.prospectId);
  const entrepriseIds = dossiers.filter((item) => item.prospectType === "ENTREPRISE").map((item) => item.prospectId);
  const filters = [
    clientIds.length > 0 ? { clientId: { in: clientIds } } : null,
    entrepriseIds.length > 0 ? { clientEntrepriseId: { in: entrepriseIds } } : null,
  ].filter((item): item is { clientId: { in: string[] } } | { clientEntrepriseId: { in: string[] } } => Boolean(item));

  const factures = filters.length
    ? await prisma.facture.findMany({
        where: { OR: filters, status_facture: { not: "ANNULEE" } },
        orderBy: { date_facture: "desc" },
        select: {
          clientId: true,
          clientEntrepriseId: true,
          date_facture: true,
          total_ttc: true,
          BonDeCommande: { select: { id: true } },
        },
      })
    : [];

  return dossiers.map((dossier) => {
    const related = factures.filter((facture) =>
      dossier.prospectType === "ENTREPRISE"
        ? facture.clientEntrepriseId === dossier.prospectId
        : facture.clientId === dossier.prospectId,
    );
    const latest = related[0];
    return {
      id: dossier.id,
      numero: dossier.numero,
      nomCourt: dossier.nomCourt,
      prospectNom: dossier.prospectNom,
      prospectType: dossier.prospectType,
      proformaCount: related.length,
      bonCount: related.filter((facture) => facture.BonDeCommande).length,
      derniereProforma: latest ? latest.date_facture.toISOString() : null,
      totalTtc: latest ? asNumber(latest.total_ttc) : null,
    };
  });
}

export async function getBonCommandeSource(
  dossierId: string,
  factureId?: string,
  options?: { unrestricted?: boolean },
): Promise<BonCommandeSource | null> {
  if (options?.unrestricted) {
    const role = await currentUserRole();
    if (!isResponsableCommercial(role)) return null;
  }
  const userId = await currentUserId();
  if (!options?.unrestricted && !userId) return null;

  const dossier = await prisma.dossierClientele.findFirst({
    where: options?.unrestricted ? { id: dossierId } : { id: dossierId, userId: userId! },
  });
  if (!dossier) return null;
  return assembleBonCommandeSource(dossier, factureId);
}

export async function assembleBonCommandeSource(
  dossier: {
    id: string;
    numero: string;
    nomCourt: string;
    prospectId: string;
    prospectType: string;
    prospectNom: string;
  },
  factureId?: string,
): Promise<BonCommandeSource> {
  const owner =
    dossier.prospectType === "ENTREPRISE"
      ? { clientEntrepriseId: dossier.prospectId }
      : { clientId: dossier.prospectId };

  const [profil, factures] = await Promise.all([
    dossier.prospectType === "ENTREPRISE"
      ? prisma.client_entreprise.findUnique({ where: { id: dossier.prospectId } })
      : prisma.client.findUnique({ where: { id: dossier.prospectId } }),
    prisma.facture.findMany({
      where: owner,
      orderBy: { date_facture: "desc" },
      include: {
        FactureLigne: { include: { VoitureModel: { select: { model: true } } } },
        Accessoire: true,
        BonDeCommande: true,
        ContratDeVente: true,
        User: { select: { firstName: true, lastName: true, telephone: true } },
        Voiture: { include: { VoitureModel: { select: { model: true } } } },
        Commande: { select: { numChassis: true, nbr_portes: true } },
      },
    }),
  ]);

  const proformas: BonCommandeProformaRef[] = factures.map((facture) => ({
    id: facture.id,
    date: facture.date_facture.toISOString(),
    statut: facture.status_facture,
    totalTtc: asNumber(facture.total_ttc),
    vehicule:
      facture.FactureLigne[0]?.VoitureModel.model ??
      facture.Voiture?.VoitureModel?.model ??
      null,
    hasBon: Boolean(facture.BonDeCommande),
  }));

  const active = factures.filter((facture) => facture.status_facture !== "ANNULEE");
  const chosen =
    factures.find((facture) => facture.id === factureId) ??
    active[0] ??
    factures[0] ??
    null;

  const client = !profil
    ? {
        kind: "CLIENT" as const,
        nom: dossier.prospectNom,
        email: null,
        telephone: "",
        adresse: null,
        representant: null,
      }
    : "nom_entreprise" in profil
      ? {
          kind: "ENTREPRISE" as const,
          nom: profil.nom_entreprise,
          email: profil.email_personne_contact || profil.email,
          telephone: profil.telephone_personne_contact || profil.telephone,
          adresse: profil.localisation,
          representant: [profil.nom_personne_contact, profil.fonction_personne_contact].filter(Boolean).join(", ") || null,
        }
      : {
          kind: "CLIENT" as const,
          nom: profil.nom,
          email: profil.email,
          telephone: profil.telephone,
          adresse: profil.localisation,
          representant: null,
        };

  const selected: BonCommandeDocumentData | null = chosen
    ? (() => {
        const lines = chosen.FactureLigne;
        const modeles = lines.map((ligne) => ligne.VoitureModel.model);
        const couleurs = [...new Set(lines.map((ligne) => ligne.couleur).filter(Boolean))];
        const motorisations = [...new Set(lines.map((ligne) => ligne.motorisation).filter((item): item is string => Boolean(item)))];
        const transmissions = [...new Set(lines.map((ligne) => ligne.transmission).filter((item): item is string => Boolean(item)))];
        const chassis = [...new Set(chosen.Commande.map((item) => item.numChassis).filter((item): item is string => Boolean(item)))];
        const portes = [...new Set(chosen.Commande.map((item) => item.nbr_portes).filter(Boolean))];
        const quantite = lines.length > 0 ? lines.reduce((sum, ligne) => sum + ligne.nbr_voiture, 0) : chosen.nbr_voiture_commande;
        const modele =
          modeles.length > 0
            ? [...new Set(modeles)].join(" · ")
            : chosen.Voiture?.VoitureModel?.model ?? "";

        const options: BonCommandeOptionLine[] =
          chosen.Accessoire.length > 0
            ? chosen.Accessoire.map((item) => {
                const quantiteOption = item.quantity ?? 1;
                const prix = asNumber(item.prix);
                return {
                  id: item.id,
                  designation: item.nom,
                  quantite: quantiteOption,
                  prixUnitaire: prix,
                  montant: prix * quantiteOption,
                };
              })
            : chosen.accessoire_nom
              ? [{
                  id: "accessoire",
                  designation: chosen.accessoire_nom,
                  quantite: chosen.accessoire_nbr ?? 1,
                  prixUnitaire: asNumber(chosen.accessoire_prix) / (chosen.accessoire_nbr || 1),
                  montant: asNumber(chosen.accessoire_subtotal ?? chosen.accessoire_prix),
                }]
              : [];

        const optionsHt = options.reduce((sum, item) => sum + item.montant, 0);
        const vehiculeHt = asNumber(chosen.montant_ht);
        const remiseMontant = asNumber(chosen.montant_remise);
        const totalHt = asNumber(chosen.montant_net_ht) || Math.max(0, asNumber(chosen.total_ht) - remiseMontant);

        return {
          factureId: chosen.id,
          clientId: chosen.clientId,
          clientEntrepriseId: chosen.clientEntrepriseId,
          date: chosen.date_facture.toISOString(),
          echeance: chosen.date_echeance.toISOString(),
          statut: chosen.status_facture,
          bon: chosen.BonDeCommande
            ? {
                numero: chosen.BonDeCommande.numero,
                statut: statutAffiche(chosen.BonDeCommande),
                date: chosen.BonDeCommande.createdAt.toISOString(),
              }
            : null,
          contenu: parseBonCommandeContenu(chosen.BonDeCommande?.contenu),
          contrat: parseContratVenteContenu(chosen.ContratDeVente?.contenu),
          client,
          commercial: {
            nom: `${chosen.User.firstName} ${chosen.User.lastName}`.trim(),
            telephone: chosen.User.telephone,
          },
          vehicule: modele
            ? {
                modele,
                carrosserie: portes.length > 0 ? portes.map((item) => `${item} portes`).join(" · ") : null,
                motorisation: motorisations.join(" · ") || chosen.Voiture?.motorisation || null,
                transmission: transmissions.join(" · ") || chosen.Voiture?.transmission || null,
                couleur: couleurs.join(" · ") || chosen.Voiture?.couleur || null,
                quantite,
                chassis: chassis.join(" · ") || null,
              }
            : null,
          options,
          prix: {
            vehiculeHt,
            optionsHt: optionsHt || Math.max(0, asNumber(chosen.total_ht) - vehiculeHt),
            remisePct: asNumber(chosen.remise),
            remiseMontant,
            totalHt,
            tvaPct: asNumber(chosen.tva),
            tvaMontant: asNumber(chosen.montant_tva),
            totalTtc: asNumber(chosen.total_ttc),
          },
        };
      })()
    : null;

  return {
    dossier: {
      id: dossier.id,
      numero: dossier.numero,
      nomCourt: dossier.nomCourt,
      prospectNom: dossier.prospectNom,
    },
    proformas,
    selected,
  };
}

export type BonAValider = {
  factureId: string;
  numero: string;
  client: string;
  commercial: string;
  modele: string;
  totalTtc: number;
  statut: string;
};

const ETAPES_VISIBLES = ["A_VALIDER", "EN_VALIDATION", "SOUS_RESERVE"] as const;
const ETAPES_OUVRABLES = ["A_VALIDER", "EN_VALIDATION", "SOUS_RESERVE", "VALIDE"] as const;

export async function countBonsAValider() {
  const role = await currentUserRole();
  if (!isResponsableCommercial(role)) return 0;
  return executeWithRetry(() => prisma.bonDeCommande.count({
    where: {
      status_bon_de_commande: { notIn: ["VALIDE", "VALIDE_APPORT_INITIAL", "ANNULE"] },
      Facture: {
        status_facture: { not: "ANNULEE" },
        User: { role: "COMMERCIAL" },
      },
      OR: ETAPES_VISIBLES.map((etape) => ({
        contenu: { path: ["etapeValidation"], equals: etape },
      })),
    },
  }));
}

const COMMERCIAUX = {
  status_facture: { not: "ANNULEE" as const },
  User: { role: "COMMERCIAL" as const },
};

async function loadBons(where: Prisma.BonDeCommandeWhereInput): Promise<BonAValider[]> {
  const role = await currentUserRole();
  if (!isResponsableCommercial(role)) return [];

  const bons = await executeWithRetry(() => prisma.bonDeCommande.findMany({
    where,
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
  }));

  const rank: Record<string, number> = {
    A_VALIDER: 0,
    EN_VALIDATION: 1,
    SOUS_RESERVE: 2,
    VALIDE: 3,
    VALIDE_APPORT_INITIAL: 4,
  };

  return bons
    .map((bon) => ({
      factureId: bon.factureId,
      numero: bon.numero,
      client: bon.Facture.Client_entreprise?.nom_entreprise || bon.Facture.Client?.nom || "Client",
      commercial: `${bon.Facture.User.firstName} ${bon.Facture.User.lastName}`.trim(),
      modele: bon.Facture.FactureLigne[0]?.VoitureModel.model || bon.Facture.Voiture?.VoitureModel?.model || "",
      totalTtc: asNumber(bon.Facture.total_ttc),
      statut: statutAffiche(bon),
    }))
    .sort((a, b) => (rank[a.statut] ?? 9) - (rank[b.statut] ?? 9));
}

export async function listBonsAValider(): Promise<BonAValider[]> {
  return loadBons({
    status_bon_de_commande: { notIn: ["VALIDE", "VALIDE_APPORT_INITIAL", "ANNULE"] },
    Facture: COMMERCIAUX,
    OR: ETAPES_VISIBLES.map((etape) => ({
      contenu: { path: ["etapeValidation"], equals: etape },
    })),
  });
}

export async function listBonsDejaValides(): Promise<BonAValider[]> {
  return loadBons({
    status_bon_de_commande: { in: ["VALIDE", "VALIDE_APPORT_INITIAL"] },
    Facture: COMMERCIAUX,
  });
}

export async function listBonsPourAccordDejaValides(): Promise<BonAValider[]> {
  return loadBons({
    status_bon_de_commande: { in: ["VALIDE", "VALIDE_APPORT_INITIAL"] },
    Facture: {
      ...COMMERCIAUX,
      BonPourAccord: {
        is: { status_bon_pour_accord: { in: ["VALIDE", "VALIDE_APPORT_INITIAL"] } },
      },
    },
  });
}

export async function getBonCommandePourValidation(factureId: string): Promise<BonCommandeSource | null> {
  const role = await currentUserRole();
  if (!isResponsableCommercial(role)) return null;

  const bon = await prisma.bonDeCommande.findUnique({
    where: { factureId },
    include: { Facture: { select: { clientId: true, clientEntrepriseId: true } } },
  });
  const etape = bon ? etapeOf(bon.contenu) : "";
  const ouvert =
    ETAPES_OUVRABLES.includes(etape as (typeof ETAPES_OUVRABLES)[number]) ||
    bon?.status_bon_de_commande === "VALIDE" ||
    bon?.status_bon_de_commande === "VALIDE_APPORT_INITIAL";
  if (!bon || !ouvert) return null;

  const prospectId = bon.Facture.clientEntrepriseId ?? bon.Facture.clientId;
  if (!prospectId) return null;

  const prospectType = bon.Facture.clientEntrepriseId ? "ENTREPRISE" : "CLIENT";
  const dossier = await prisma.dossierClientele.findFirst({
    where: { prospectId, prospectType },
    orderBy: { updatedAt: "desc" },
  });
  if (dossier) return getBonCommandeSource(dossier.id, factureId, { unrestricted: true });

  const profil = bon.Facture.clientEntrepriseId
    ? await prisma.client_entreprise.findUnique({
        where: { id: prospectId },
        select: { nom_entreprise: true },
      })
    : await prisma.client.findUnique({
        where: { id: prospectId },
        select: { nom: true },
      });
  const nom =
    profil && "nom_entreprise" in profil ? profil.nom_entreprise : profil?.nom || "Client";

  return assembleBonCommandeSource(
    {
      id: factureId,
      numero: bon.numero,
      nomCourt: nom,
      prospectId,
      prospectType,
      prospectNom: nom,
    },
    factureId,
  );
}
