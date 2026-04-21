"use server";

import { prisma, executeWithRetry } from "../prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

// Deep-convert Prisma Decimal instances anywhere in the data tree to plain numbers
function deepStripDecimals<T>(value: T): T {
  if (value == null) return value;
  if (value instanceof Date) return value;
  if (value instanceof Decimal) return Number(value) as unknown as T;
  // Handle decimal-like objects that may leak from Prisma runtime without instanceof match
  if (
    typeof value === "object" &&
    (value as { constructor?: { name?: string } }).constructor?.name === "Decimal"
  ) {
    return Number(value as unknown as Decimal) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepStripDecimals(item)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepStripDecimals(v);
    }
    return out as unknown as T;
  }
  return value;
}

// Helper function to convert Decimal fields to numbers
function serializeFacture(facture: unknown) {
  const f = facture as Record<string, unknown> & {
    FactureLigne?: unknown[];
    Accessoire?: unknown[];
    Voiture?: Record<string, unknown> & { VoitureModel?: unknown };
    Commande?: unknown[];
    Paiement?: unknown[];
  };
  const lignes = (f.FactureLigne || []) as Array<Record<string, unknown> & { VoitureModel?: unknown }>;
  const accessoires = (f.Accessoire || []) as Array<Record<string, unknown>>;

  return {
    id: f.id as string,
    date_facture: f.date_facture as Date,
    date_echeance: f.date_echeance as Date,
    status_facture: f.status_facture as string,
    nbr_voiture_commande: f.nbr_voiture_commande as number,
    accessoire_nom: f.accessoire_nom as string | null,
    accessoire_description: f.accessoire_description as string | null,
    accessoire_nbr: f.accessoire_nbr as number | null,
    client: f.Client,
    clientEntreprise: f.Client_entreprise,
    voiture: f.Voiture ? {
      ...f.Voiture,
      voitureModel: f.Voiture.VoitureModel,
    } : null,
    user: f.User,
    prix_unitaire: f.prix_unitaire ? Number(f.prix_unitaire) : 0,
    montant_ht: f.montant_ht ? Number(f.montant_ht) : 0,
    total_ht: f.total_ht ? Number(f.total_ht) : 0,
    remise: f.remise ? Number(f.remise) : 0,
    montant_remise: f.montant_remise ? Number(f.montant_remise) : 0,
    montant_net_ht: f.montant_net_ht ? Number(f.montant_net_ht) : 0,
    tva: f.tva ? Number(f.tva) : 0,
    montant_tva: f.montant_tva ? Number(f.montant_tva) : 0,
    total_ttc: f.total_ttc ? Number(f.total_ttc) : 0,
    avance_payee: f.avance_payee ? Number(f.avance_payee) : 0,
    reste_payer: f.reste_payer ? Number(f.reste_payer) : 0,
    accessoire_prix: f.accessoire_prix
      ? Number(f.accessoire_prix)
      : null,
    accessoire_subtotal: f.accessoire_subtotal
      ? Number(f.accessoire_subtotal)
      : null,
    bon_pour_acquis: (f.bon_pour_acquis as boolean) ?? false,
    notes_proforma: (f.notes_proforma as string) || null,
    lignes: lignes.map((ligne) => ({
      ...ligne,
      prix_unitaire: ligne.prix_unitaire ? Number(ligne.prix_unitaire) : 0,
      montant_ligne: ligne.montant_ligne ? Number(ligne.montant_ligne) : 0,
      voitureModel: ligne.VoitureModel,
    })),
    accessoires: accessoires.map((accessoire) => ({
      id: (accessoire.id as string) || "",
      nom: (accessoire.nom as string) || "",
      description: (accessoire.description as string) || null,
      prix: accessoire.prix ? Number(accessoire.prix) : 0,
      quantity: accessoire.quantity ? Number(accessoire.quantity) : 1,
      image: (accessoire.image as string) || null,
    })),
    clientId: (f.clientId as string) || null,
    clientEntrepriseId: (f.clientEntrepriseId as string) || null,
    userId: (f.userId as string) || "",
    commandes: ((f.Commande || []) as Array<Record<string, unknown>>).map(
      (c) => ({
        ...c,
        prix_unitaire:
          c.prix_unitaire != null ? Number(c.prix_unitaire) : null,
      }),
    ),
    paiements: ((f.Paiement || []) as Array<Record<string, unknown>>).map(
      (p) => ({
        ...p,
        avance_payee:
          p.avance_payee != null ? Number(p.avance_payee) : 0,
        reste_payer:
          p.reste_payer != null ? Number(p.reste_payer) : 0,
      }),
    ),
    bonPourAccord: f.BonPourAccord
      ? {
          numero: (f.BonPourAccord as { numero_bon_pour_accord: string }).numero_bon_pour_accord,
          status: (f.BonPourAccord as { status_bon_pour_accord?: string }).status_bon_pour_accord ?? "EN_ATTENTE",
        }
      : null,
    bonDeCommande: f.BonDeCommande
      ? {
          numero: (f.BonDeCommande as { numero: string }).numero,
          prefix_numero: (f.BonDeCommande as { prefix_numero?: string }).prefix_numero,
          status: (f.BonDeCommande as { status_bon_de_commande?: string }).status_bon_de_commande ?? "EN_ATTENTE",
        }
      : null,
  };
}

export async function getAllFactures() {
  try {
    const factures = await prisma.facture.findMany({
      include: {
        Client: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers
    const serializedFactures = (factures as unknown[]).map(serializeFacture);

    return { success: true, data: serializedFactures };
  } catch (error) {
    console.error("Error fetching factures:", error);
    return { success: false, error: "Failed to fetch factures" };
  }
}

export async function getAllFacturesForBonPourAccord() {
  try {
    const factures = await prisma.facture.findMany({
      where: {
        clientEntrepriseId: { not: null },
      },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
        BonPourAccord: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedFactures = (factures as unknown[]).map(serializeFacture);

    return { success: true, data: serializedFactures };
  } catch (error) {
    console.error("Error fetching factures for bon pour accord:", error);
    return { success: false, error: "Failed to fetch factures" };
  }
}

export async function getAllFacturesForResponsableCommercial() {
  try {
    const factures = await prisma.facture.findMany({
      where: {
        BonDeCommande: { isNot: null },
      },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedFactures = (factures as unknown[]).map(serializeFacture);

    return { success: true, data: serializedFactures };
  } catch (error) {
    console.error("Error fetching all factures for responsable commercial:", error);
    return { success: false, error: "Failed to fetch factures" };
  }
}

export async function getAllFacturesForComptableValideApportInitial() {
  try {
    const factures = await prisma.facture.findMany({
      where: {
        BonDeCommande: {
          is: {
            status_bon_de_commande: "VALIDE_APPORT_INITIAL",
          },
        },
      },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedFactures = (factures as unknown[]).map((f) =>
      deepStripDecimals(serializeFacture(f)),
    );

    return { success: true, data: serializedFactures };
  } catch (error) {
    console.error(
      "Error fetching factures with VALIDE_APPORT_INITIAL bon de commande:",
      error,
    );
    return { success: false, error: "Failed to fetch factures" };
  }
}

export async function getFacturesByBonValideApportInitial() {
  try {
    const factures = await prisma.facture.findMany({
      where: {
        OR: [
          {
            BonDeCommande: {
              is: {
                status_bon_de_commande: "VALIDE_APPORT_INITIAL",
              },
            },
          },
          {
            BonPourAccord: {
              is: {
                status_bon_pour_accord: "VALIDE_APPORT_INITIAL",
              },
            },
          },
        ],
      },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
        BonDeCommande: true,
        BonPourAccord: true,
        Commande: {
          select: {
            id: true,
            etapeCommande: true,
            createdAt: true,
          },
        },
        Paiement: {
          select: {
            avance_payee: true,
          },
        },
      },
      orderBy: [
        { date_facture: "desc" },
        { User: { firstName: "asc" } },
        { User: { lastName: "asc" } },
      ],
    });

    // Recalculate reste_payer based on actual payments
    const facturesWithRecalculatedReste = (factures as unknown[]).map(
      (facture: unknown) => {
        const f = facture as Record<string, unknown> & {
          Paiement?: Array<{ avance_payee: Decimal | number }>;
          total_ttc: Decimal | number;
        };
        const totalPaid = (f.Paiement || []).reduce(
          (sum: number, paiement) => sum + Number(paiement.avance_payee),
          0,
        );
        const totalTtc = Number(f.total_ttc);
        const recalculatedRestePayer = Math.max(0, totalTtc - totalPaid);

        return {
          ...f,
          reste_payer: new Decimal(recalculatedRestePayer),
          avance_payee: new Decimal(totalPaid),
        };
      },
    );

    const serializedFactures = facturesWithRecalculatedReste.map((f) =>
      deepStripDecimals(serializeFacture(f)),
    );

    return { success: true, data: serializedFactures };
  } catch (error) {
    console.error(
      "Error fetching factures with VALIDE_APPORT_INITIAL bon:",
      error,
    );
    return { success: false, error: "Failed to fetch factures" };
  }
}

export async function getFacturesByUser(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const factures = await prisma.facture.findMany({
      where: { userId: user.id },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const serializedFactures = (factures as unknown[]).map(serializeFacture);

    return { success: true, data: serializedFactures };
  } catch (error) {
    console.error("Error fetching user factures:", error);
    return { success: false, error: "Failed to fetch factures" };
  }
}

export async function getProformas() {
  try {
    const proformas = await prisma.facture.findMany({
      where: { status_facture: "PROFORMA" },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers
    const serializedProformas = (proformas as unknown[]).map(serializeFacture);

    return { success: true, data: serializedProformas };
  } catch (error) {
    console.error("Error fetching proformas:", error);
    return { success: false, error: "Failed to fetch proformas" };
  }
}

export async function getProformasWithoutBonDeCommande() {
  try {
    const proformas = await prisma.facture.findMany({
      where: {
        status_facture: "PROFORMA",
        BonDeCommande: null,
      },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
        BonDeCommande: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers
    const serializedProformas = (proformas as unknown[]).map(serializeFacture);

    return { success: true, data: serializedProformas };
  } catch (error) {
    console.error("Error fetching proformas without bon de commande:", error);
    return { success: false, error: "Failed to fetch proformas" };
  }
}

export async function getProformasWithoutBonDeCommandeByUser(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const proformas = await prisma.facture.findMany({
      where: {
        status_facture: "PROFORMA",
        BonDeCommande: null,
        userId: user.id,
      },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
        BonDeCommande: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers
    const serializedProformas = (proformas as unknown[]).map(serializeFacture);

    return { success: true, data: serializedProformas };
  } catch (error) {
    console.error(
      "Error fetching proformas without bon de commande by user:",
      error,
    );
    return { success: false, error: "Failed to fetch proformas" };
  }
}

export async function getFacturesWithBonPourAcquis() {
  try {
    const factures = await prisma.facture.findMany({
      where: {
        bon_pour_acquis: true,
      },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers
    const serializedFactures = (factures as unknown[]).map(serializeFacture);

    return { success: true, data: serializedFactures };
  } catch (error) {
    console.error("Error fetching factures with bon pour acquis:", error);
    return { success: false, error: "Failed to fetch factures" };
  }
}

export async function updateBonPourAcquis(
  factureId: string,
  bonPourAcquis: boolean,
) {
  try {
    const facture = await prisma.facture.update({
      where: { id: factureId },
      data: { bon_pour_acquis: bonPourAcquis },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
      },
    });

    revalidatePath("/commercial/bon-pour-acquis");
    return { success: true, data: serializeFacture(facture) };
  } catch (error: unknown) {
    console.error("Error updating bon pour acquis:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update bon pour acquis";
    return { success: false, error: errorMessage };
  }
}

export async function getFactures() {
  try {
    const factures = await prisma.facture.findMany({
      where: { status_facture: "FACTURE" },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
        Commande: {
          select: {
            id: true,
            etapeCommande: true,
            createdAt: true,
          },
        },
        Paiement: {
          select: {
            avance_payee: true,
          },
        },
      },
      orderBy: [
        { date_facture: "desc" },
        { User: { firstName: "asc" } },
        { User: { lastName: "asc" } },
      ],
    });

    // Recalculate reste_payer based on actual payments
    const facturesWithRecalculatedReste = (factures as unknown[]).map((facture: unknown) => {
      const f = facture as Record<string, unknown> & {
        Paiement?: Array<{ avance_payee: Decimal | number }>;
        total_ttc: Decimal | number;
      };
      const totalPaid = (f.Paiement || []).reduce(
        (sum: number, paiement) => sum + Number(paiement.avance_payee),
        0,
      );
      const totalTtc = Number(f.total_ttc);
      const recalculatedRestePayer = Math.max(0, totalTtc - totalPaid);

      return {
        ...f,
        reste_payer: new Decimal(recalculatedRestePayer),
        avance_payee: new Decimal(totalPaid),
      };
    });

    const serializedFactures =
      facturesWithRecalculatedReste.map(serializeFacture);

    return { success: true, data: serializedFactures };
  } catch (error) {
    console.error("Error fetching factures:", error);
    return { success: false, error: "Failed to fetch factures" };
  }
}

export async function createFacture(data: {
  clientId: string;
  userId: string;
  voitureId: string;
  date_facture: Date;
  date_echeance: Date;
  nbr_voiture_commande: number;
  prix_unitaire: number;
  remise: number;
  tva: number;
  avance_payee?: number;
  status_facture?: "EN_ATTENTE" | "PROFORMA" | "PAYEE" | "ANNULEE";
}) {
  try {
    const montant_ht = data.prix_unitaire * data.nbr_voiture_commande;
    const total_ht = montant_ht;
    const montant_remise = (montant_ht * data.remise) / 100;
    const montant_net_ht = montant_ht - montant_remise;
    const montant_tva = (montant_net_ht * data.tva) / 100;
    const total_ttc = montant_net_ht + montant_tva;
    const avance_payee = data.avance_payee || 0;
    const reste_payer = total_ttc - avance_payee;

    const facture = await prisma.facture.create({
      data: {
        id: crypto.randomUUID(),
        clientId: data.clientId,
        userId: data.userId,
        voitureId: data.voitureId,
        date_facture: data.date_facture,
        date_echeance: data.date_echeance,
        status_facture: data.status_facture || "PROFORMA",
        nbr_voiture_commande: data.nbr_voiture_commande,
        prix_unitaire: new Decimal(data.prix_unitaire),
        montant_ht: new Decimal(montant_ht),
        total_ht: new Decimal(total_ht),
        remise: new Decimal(data.remise),
        montant_remise: new Decimal(montant_remise),
        montant_net_ht: new Decimal(montant_net_ht),
        tva: new Decimal(data.tva),
        montant_tva: new Decimal(montant_tva),
        total_ttc: new Decimal(total_ttc),
        avance_payee: new Decimal(avance_payee),
        reste_payer: new Decimal(reste_payer),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/commercial/proformas");

    // Serialize before returning
    return { success: true, data: serializeFacture(facture) };
  } catch (error) {
    console.error("Error creating facture:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create facture";
    return { success: false, error: errorMessage };
  }
}

export async function createFactureWithVoiture(data: {
  clientId: string;
  userId: string;
  voitureModelId: string;
  couleur: string;
  date_facture: Date;
  date_echeance: Date;
  nbr_voiture_commande: number;
  prix_unitaire: number;
  remise: number;
  tva: number;
  avance_payee?: number;
  status_facture?: "EN_ATTENTE" | "PROFORMA" | "PAYEE" | "ANNULEE";
}) {
  try {
    // Create voiture first
    const voiture = await prisma.voiture.create({
      data: {
        id: crypto.randomUUID(),
        couleur: data.couleur,
        voitureModelId: data.voitureModelId,
        clientId: data.clientId,
        nbr_portes: "4",
        transmission: "AUTOMATIQUE",
        motorisation: "ESSENCE",
        etatVoiture: "VENTE",
        updatedAt: new Date(),
      },
    });

    // Then create facture
    return await createFacture({
      ...data,
      voitureId: voiture.id,
    });
  } catch (error) {
    console.error("Error creating facture with voiture:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create facture";
    return { success: false, error: errorMessage };
  }
}

export async function createFactureWithMultipleLines(data: {
  clientId?: string;
  clientEntrepriseId?: string;
  userId: string;
  date_facture: Date;
  date_echeance: Date;
  remise: number;
  tva: number;
  avance_payee?: number;
  status_facture?: "EN_ATTENTE" | "PROFORMA" | "PAYEE" | "ANNULEE";
  lignes: Array<{
    voitureModelId: string;
    couleur: string;
    nbr_voiture: number;
    prix_unitaire: number;
    transmission?: string;
    motorisation?: string;
  }>;
  accessoires?: Array<{
    nom: string;
    description: string;
    prix_unitaire: number;
    quantity: number;
  }>;
}) {
  try {
    // Calculate totals from all lines
    const montant_ht_articles = data.lignes.reduce(
      (sum, ligne) => sum + ligne.prix_unitaire * ligne.nbr_voiture,
      0,
    );

    // Calculate totals from accessories if provided
    const montant_ht_accessoires = (data.accessoires || []).reduce(
      (sum, acc) => sum + acc.prix_unitaire * acc.quantity,
      0,
    );

    const montant_ht = montant_ht_articles + montant_ht_accessoires;
    const total_ht = montant_ht;
    const montant_remise = (montant_ht * data.remise) / 100;
    const montant_net_ht = montant_ht - montant_remise;
    const montant_tva = (montant_net_ht * data.tva) / 100;
    const total_ttc = montant_net_ht + montant_tva;
    const avance_payee = data.avance_payee || 0;
    const reste_payer = total_ttc - avance_payee;

    // Get first line for backward compatibility fields
    const firstLine = data.lignes[0];

    // Calculate accessory aggregate data
    const accessoire_total_nbr = (data.accessoires || []).reduce(
      (sum, acc) => sum + acc.quantity,
      0,
    );
    const accessoire_nom_list = (data.accessoires || [])
      .map((acc) => `${acc.nom} (x${acc.quantity})`)
      .join(", ");
    const accessoire_description_list = (data.accessoires || [])
      .map((acc) => acc.description)
      .filter((desc) => desc)
      .join("; ");

    // Get existing accessoires from database to get their images
    const allAccessoires = await prisma.accessoire.findMany({
      where: {
        factureId: null, // Get standalone accessoires
        voitureId: null,
        commandeId: null,
      },
      select: {
        id: true,
        nom: true,
        image: true,
      },
    });

    const factureData = {
      id: crypto.randomUUID(),
      userId: data.userId,
      date_facture: data.date_facture,
      date_echeance: data.date_echeance,
      status_facture: data.status_facture || "PROFORMA",
      nbr_voiture_commande: firstLine.nbr_voiture,
      prix_unitaire: new Decimal(firstLine.prix_unitaire),
      montant_ht: new Decimal(montant_ht),
      total_ht: new Decimal(total_ht),
      remise: new Decimal(data.remise),
      montant_remise: new Decimal(montant_remise),
      montant_net_ht: new Decimal(montant_net_ht),
      tva: new Decimal(data.tva),
      montant_tva: new Decimal(montant_tva),
      total_ttc: new Decimal(total_ttc),
      avance_payee: new Decimal(avance_payee),
      reste_payer: new Decimal(reste_payer),
      accessoire_nom: accessoire_nom_list || null,
      accessoire_description: accessoire_description_list || null,
      accessoire_prix:
        montant_ht_accessoires > 0
          ? new Decimal((data.accessoires || [])[0].prix_unitaire)
          : null,
      accessoire_nbr: accessoire_total_nbr > 0 ? accessoire_total_nbr : null,
      accessoire_subtotal:
        montant_ht_accessoires > 0 ? new Decimal(montant_ht_accessoires) : null,
      updatedAt: new Date(),
      FactureLigne: {
        create: data.lignes.map((ligne) => ({
          id: crypto.randomUUID(),
          voitureModelId: ligne.voitureModelId,
          couleur: ligne.couleur,
          nbr_voiture: ligne.nbr_voiture,
          prix_unitaire: new Decimal(ligne.prix_unitaire),
          montant_ligne: new Decimal(ligne.prix_unitaire * ligne.nbr_voiture),
          transmission: ligne.transmission || null,
          motorisation: ligne.motorisation || null,
          updatedAt: new Date(),
        })),
      },
      Accessoire: {
        create: (data.accessoires || []).map((acc) => {
          const matchingAccessoire = allAccessoires.find(
            (a) => a.nom === acc.nom,
          );
          return {
            id: crypto.randomUUID(),
            nom: acc.nom,
            description: acc.description || null,
            prix: acc.prix_unitaire
              ? new Decimal(acc.prix_unitaire)
              : null,
            quantity: acc.quantity || 1,
            image: matchingAccessoire?.image || null,
            updatedAt: new Date(),
          };
        }),
      },
      ...(data.clientId && { clientId: data.clientId }),
      ...(data.clientEntrepriseId && {
        clientEntrepriseId: data.clientEntrepriseId,
      }),
    };

    const facture = await prisma.facture.create({
      data: factureData,
      include: {
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
        Client: true,
        Client_entreprise: true,
        User: true,
      },
    });

    revalidatePath("/commercial/proformas");
    revalidatePath("/commercial/factures");

    return { success: true, data: serializeFacture(facture) };
  } catch (error) {
    console.error("Error creating facture with multiple lines:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create facture";
    return { success: false, error: errorMessage };
  }
}

export async function convertProformaToFacture(factureId: string) {
  try {
    const facture = await prisma.facture.update({
      where: { id: factureId },
      data: { status_facture: "FACTURE" },
      include: {
        Client: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
      },
    });

    revalidatePath("/commercial/factures");
    revalidatePath("/commercial/proformas");
    revalidatePath("/comptable/suivi-bon-commande");

    return { success: true, data: serializeFacture(facture) };
  } catch (error) {
    console.error("Error converting proforma to facture:", error);
    return { success: false, error: "Failed to convert proforma to facture" };
  }
}

export async function convertToFactureWithClientStatus(factureId: string) {
  try {
    // First get the facture with client info
    const factureData = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        Client: true,
        Client_entreprise: true,
      },
    });

    if (!factureData) {
      return { success: false, error: "Facture not found" };
    }

    // Update facture status
    const facture = await prisma.facture.update({
      where: { id: factureId },
      data: { status_facture: "FACTURE" },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
      },
    });

    // Update client status to PROSPECT if it's a regular client
    if (factureData.clientId) {
      await prisma.client.update({
        where: { id: factureData.clientId },
        data: { status_client: "PROSPECT" },
      });
    }

    // Update clientEntreprise status to PROSPECT if it's an enterprise client
    if (factureData.clientEntrepriseId) {
      await prisma.client_entreprise.update({
        where: { id: factureData.clientEntrepriseId },
        data: { status_client: "PROSPECT" },
      });
    }

    revalidatePath("/commercial/factures");
    revalidatePath("/commercial/proformas");
    revalidatePath("/comptable/suivi-bon-commande");
    revalidatePath("/comptable/suivi-bon-pour-acquis");

    return { success: true, data: serializeFacture(facture) };
  } catch (error) {
    console.error("Error converting to facture with client status:", error);
    return { success: false, error: "Failed to convert to facture" };
  }
}

export async function getFactureById(factureId: string) {
  try {
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        Client: true,
        Client_entreprise: true,
        User: true,
        Voiture: {
          include: {
            VoitureModel: true,
          },
        },
        FactureLigne: {
          include: {
            VoitureModel: true,
          },
        },
        Accessoire: true,
        Paiement: {
          select: {
            avance_payee: true,
          },
        },
      },
    });

    if (!facture) {
      return { success: false, error: "Facture not found" };
    }

    // Recalculate reste_payer based on actual payments
    const totalPaid = (facture.Paiement || []).reduce(
      (sum, paiement) => sum + Number(paiement.avance_payee),
      0,
    );
    const totalTtc = Number(facture.total_ttc);
    const recalculatedRestePayer = Math.max(0, totalTtc - totalPaid);

    const factureWithRecalculatedReste = {
      ...facture,
      reste_payer: recalculatedRestePayer,
      avance_payee: totalPaid,
    };

    return {
      success: true,
      data: serializeFacture(factureWithRecalculatedReste),
    };
  } catch (error) {
    console.error("Error fetching facture:", error);
    return { success: false, error: "Failed to fetch facture" };
  }
}

export async function deleteFacture(factureId: string) {
  try {
    await prisma.facture.delete({
      where: { id: factureId },
    });

    revalidatePath("/commercial/factures");
    revalidatePath("/commercial/proformas");

    return { success: true };
  } catch (error) {
    console.error("Error deleting facture:", error);
    return { success: false, error: "Failed to delete facture" };
  }
}

export async function updateFacture(
  factureId: string,
  data: {
    clientId?: string;
    nbr_voiture_commande?: number;
    prix_unitaire?: number;
    remise?: number;
    tva?: number;
    avance_payee?: number;
    date_facture?: Date;
    date_echeance?: Date;
  },
) {
  try {
    const currentFacture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: { Voiture: true },
    });
    if (!currentFacture) throw new Error("Facture not found");

    const nbr =
      data.nbr_voiture_commande ?? currentFacture.nbr_voiture_commande;
    const prix = data.prix_unitaire ?? Number(currentFacture.prix_unitaire);
    const remise = data.remise ?? Number(currentFacture.remise);
    const tva = data.tva ?? Number(currentFacture.tva);
    const avance = data.avance_payee ?? Number(currentFacture.avance_payee);

    const montant_ht = prix * nbr;
    const montant_remise = (montant_ht * remise) / 100;
    const montant_net_ht = montant_ht - montant_remise;
    const montant_tva = (montant_net_ht * tva) / 100;
    const total_ttc = montant_net_ht + montant_tva;
    const reste_payer = total_ttc - avance;

    // Update voiture client if clientId changed (only for single-item factures)
    if (
      data.clientId &&
      data.clientId !== currentFacture.clientId &&
      currentFacture.voitureId
    ) {
      await prisma.voiture.update({
        where: { id: currentFacture.voitureId },
        data: { clientId: data.clientId },
      });
    }

    const facture = await prisma.facture.update({
      where: { id: factureId },
      data: {
        clientId: data.clientId,
        date_facture: data.date_facture,
        date_echeance: data.date_echeance,
        nbr_voiture_commande: nbr,
        prix_unitaire: new Decimal(prix),
        remise: new Decimal(remise),
        tva: new Decimal(tva),
        avance_payee: new Decimal(avance),
        montant_ht: new Decimal(montant_ht),
        total_ht: new Decimal(montant_ht),
        montant_remise: new Decimal(montant_remise),
        montant_net_ht: new Decimal(montant_net_ht),
        montant_tva: new Decimal(montant_tva),
        total_ttc: new Decimal(total_ttc),
        reste_payer: new Decimal(reste_payer),
      },
      include: {
        Client: true,
        User: true,
        Voiture: { include: { VoitureModel: true } },
      },
    });

    revalidatePath("/commercial/factures");
    revalidatePath("/commercial/proformas");
    return { success: true, data: serializeFacture(facture) };
  } catch (error) {
    console.error("Error updating facture:", error);
    return { success: false, error: "Failed to update facture" };
  }
}

export async function updateProformaNotes(factureId: string, notes: string) {
  try {
    await executeWithRetry(async () => {
      await prisma.$executeRaw`
        UPDATE "Facture" SET notes_proforma = ${notes || null}, "updatedAt" = NOW() WHERE id = ${factureId}
      `;
    });
    revalidatePath("/commercial/proformas");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating proforma notes:", error);
    return { success: false, error: message };
  }
}

export async function getClientsWithFacturesGroupedByYearMonth() {
  try {
    // Fetch factures with status FACTURE and (bon_pour_acquis === true OR BonDeCommande exists)
    // Use executeWithRetry to handle connection errors
    const factures = await executeWithRetry(async () => {
      return await prisma.facture.findMany({
        where: {
          status_facture: "FACTURE",
          OR: [
            { bon_pour_acquis: true },
            { BonDeCommande: { isNot: null } }
          ]
        },
        include: {
          Client: {
            select: {
              id: true,
              nom: true,
              telephone: true,
              localisation: true,
              commercial: true,
              status_client: true,
            }
          },
          Client_entreprise: {
            select: {
              id: true,
              nom_entreprise: true,
              sigle: true,
              telephone: true,
              localisation: true,
              commercial: true,
              status_client: true,
            }
          },
          FactureLigne: {
            include: {
              VoitureModel: {
                select: {
                  id: true,
                  model: true,
                  image: true,
                  description: true,
                }
              }
            }
          },
          BonDeCommande: {
            select: {
              id: true,
            }
          }
        },
        orderBy: {
          date_facture: "asc" // Oldest first
        },
        // Limit to prevent excessive data loading and connection issues
        take: 10000,
      });
    }, 3, 2000); // 3 retries with 2 second delay

    // Group factures by year and month
    const groupedData: Record<string, Record<string, Array<{
      client: unknown;
      facture: unknown;
    }>>> = {};

    factures.forEach((facture) => {
      const date = new Date(facture.date_facture);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');

      if (!groupedData[year]) {
        groupedData[year] = {};
      }
      if (!groupedData[year][month]) {
        groupedData[year][month] = [];
      }

      // Determine which client (Client or Client_entreprise)
      const client = facture.Client_entreprise 
        ? {
            id: facture.Client_entreprise.id,
            nom_entreprise: facture.Client_entreprise.nom_entreprise,
            nom: facture.Client_entreprise.nom_entreprise,
            sigle: facture.Client_entreprise.sigle || null,
            telephone: facture.Client_entreprise.telephone || null,
            localisation: facture.Client_entreprise.localisation || null,
            commercial: facture.Client_entreprise.commercial || null,
            status_client: facture.Client_entreprise.status_client || "",
            isEntreprise: true
          }
        : facture.Client
        ? {
            id: facture.Client.id,
            nom: facture.Client.nom,
            nom_entreprise: facture.Client.nom,
            sigle: null,
            telephone: facture.Client.telephone || null,
            localisation: facture.Client.localisation || null,
            commercial: facture.Client.commercial || null,
            status_client: facture.Client.status_client || "",
            isEntreprise: false
          }
        : null;

      if (!client) return; // Skip if no client

      // Serialize facture
      const serializedFacture = {
        id: facture.id,
        date_facture: facture.date_facture.toISOString(),
        date_echeance: facture.date_echeance.toISOString(),
        status_facture: facture.status_facture,
        nbr_voiture_commande: facture.nbr_voiture_commande,
        prix_unitaire: Number(facture.prix_unitaire),
        montant_ht: Number(facture.montant_ht),
        total_ht: Number(facture.total_ht),
        remise: Number(facture.remise),
        montant_remise: Number(facture.montant_remise),
        montant_net_ht: Number(facture.montant_net_ht),
        tva: Number(facture.tva),
        montant_tva: Number(facture.montant_tva),
        total_ttc: Number(facture.total_ttc),
        avance_payee: Number(facture.avance_payee),
        reste_payer: Number(facture.reste_payer),
        accessoire_description: facture.accessoire_description || null,
        accessoire_nbr: facture.accessoire_nbr || null,
        accessoire_nom: facture.accessoire_nom || null,
        accessoire_prix: facture.accessoire_prix ? Number(facture.accessoire_prix) : null,
        accessoire_subtotal: facture.accessoire_subtotal ? Number(facture.accessoire_subtotal) : null,
        bon_pour_acquis: facture.bon_pour_acquis,
        hasBonDeCommande: !!facture.BonDeCommande,
        FactureLigne: facture.FactureLigne.map((ligne) => ({
          id: ligne.id,
          voitureModelId: ligne.voitureModelId,
          couleur: ligne.couleur,
          nbr_voiture: ligne.nbr_voiture,
          prix_unitaire: Number(ligne.prix_unitaire),
          montant_ligne: Number(ligne.montant_ligne),
          transmission: ligne.transmission || null,
          motorisation: ligne.motorisation || null,
          voitureModel: ligne.VoitureModel
        }))
      };

      groupedData[year][month].push({
        client,
        facture: serializedFacture
      });
    });

    // Sort years and months in ascending order (oldest first)
    const sortedYears = Object.keys(groupedData).sort((a, b) => parseInt(a) - parseInt(b));
    const result: Record<string, Record<string, Array<{
      client: unknown;
      facture: unknown;
    }>>> = {};

    sortedYears.forEach((year) => {
      const sortedMonths = Object.keys(groupedData[year]).sort((a, b) => parseInt(a) - parseInt(b));
      result[year] = {};
      sortedMonths.forEach((month) => {
        // Sort factures within each month by date (oldest first)
        result[year][month] = groupedData[year][month].sort((a, b) => {
          const dateA = new Date((a.facture as { date_facture: string }).date_facture);
          const dateB = new Date((b.facture as { date_facture: string }).date_facture);
          return dateA.getTime() - dateB.getTime();
        });
      });
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching clients with factures grouped by year/month:", error);
    return { success: false, error: "Failed to fetch clients with factures" };
  }
}

export async function getClientsAndEntreprisesWithFactures() {
  try {
    const factures = await executeWithRetry(async () => {
      return await prisma.facture.findMany({
        where: {
          status_facture: "FACTURE",
        },
        include: {
          Client: {
            select: {
              id: true,
              nom: true,
              telephone: true,
              email: true,
              localisation: true,
              commercial: true,
              status_client: true,
              entreprise: true,
              secteur_activite: true,
            }
          },
          Client_entreprise: {
            select: {
              id: true,
              nom_entreprise: true,
              sigle: true,
              telephone: true,
              email: true,
              localisation: true,
              commercial: true,
              status_client: true,
              secteur_activite: true,
            }
          },
          FactureLigne: {
            include: {
              VoitureModel: {
                select: {
                  id: true,
                  model: true,
                  image: true,
                  description: true,
                }
              }
            }
          },
          Accessoire: true,
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          Paiement: {
            select: {
              id: true,
              avance_payee: true,
              date_paiement: true,
            }
          },
        },
        orderBy: {
          date_facture: "desc"
        },
      });
    }, 3, 2000);

    // Group factures by client/client_entreprise
    const clientsMap = new Map<string, {
      id: string;
      type: 'client' | 'entreprise';
      nom: string;
      telephone?: string | null;
      email?: string | null;
      localisation?: string | null;
      commercial?: string | null;
      status_client: string;
      entreprise?: string | null;
      secteur_activite?: string | null;
      sigle?: string | null;
      factures: Array<{
        id: string;
        date_facture: Date;
        date_echeance: Date;
        total_ttc: number;
        reste_payer: number;
        avance_payee: number;
        nbr_voiture_commande: number;
        lignes: Array<{
          id: string;
          voitureModelId: string;
          couleur: string;
          nbr_voiture: number;
          prix_unitaire: number;
          montant_ligne: number;
          transmission?: string | null;
          motorisation?: string | null;
          voitureModel: {
            id: string;
            model: string;
            image?: string | null;
            description?: string | null;
          };
        }>;
        accessoires: Array<{
          id: string;
          nom: string;
          description?: string | null;
          prix: number;
          quantity: number;
          image?: string | null;
        }>;
        user: {
          firstName: string;
          lastName: string;
          email: string;
        };
        paiements: Array<{
          avance_payee: number;
          date_paiement: Date | null;
        }>;
      }>;
    }>();

    factures.forEach((facture) => {
      const clientId = facture.clientId || facture.clientEntrepriseId;
      if (!clientId) return;

      const isEntreprise = !!facture.clientEntrepriseId;
      const clientData = isEntreprise
        ? facture.Client_entreprise
        : facture.Client;

      if (!clientData) return;

      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          id: clientId,
          type: isEntreprise ? 'entreprise' : 'client',
          nom: isEntreprise
            ? facture.Client_entreprise!.nom_entreprise
            : facture.Client!.nom,
          telephone: clientData.telephone || null,
          email: clientData.email || null,
          localisation: clientData.localisation || null,
          commercial: clientData.commercial || null,
          status_client: clientData.status_client,
          entreprise: isEntreprise ? null : (facture.Client as { entreprise?: string | null })?.entreprise || null,
          secteur_activite: clientData.secteur_activite || null,
          sigle: isEntreprise ? facture.Client_entreprise!.sigle || null : null,
          factures: [],
        });
      }

      const client = clientsMap.get(clientId)!;
      
      // Calculate total paid from payments
      const totalPaid = (facture.Paiement || []).reduce(
        (sum, paiement) => sum + Number(paiement.avance_payee),
        0
      );
      const totalTtc = Number(facture.total_ttc);
      const restePayer = Math.max(0, totalTtc - totalPaid);

      client.factures.push({
        id: facture.id,
        date_facture: facture.date_facture,
        date_echeance: facture.date_echeance,
        total_ttc: totalTtc,
        reste_payer: restePayer,
        avance_payee: totalPaid,
        nbr_voiture_commande: facture.nbr_voiture_commande,
        lignes: facture.FactureLigne.map((ligne) => ({
          id: ligne.id,
          voitureModelId: ligne.voitureModelId,
          couleur: ligne.couleur,
          nbr_voiture: ligne.nbr_voiture,
          prix_unitaire: Number(ligne.prix_unitaire),
          montant_ligne: Number(ligne.montant_ligne),
          transmission: ligne.transmission || null,
          motorisation: ligne.motorisation || null,
          voitureModel: ligne.VoitureModel,
        })),
        accessoires: facture.Accessoire.map((acc) => ({
          id: acc.id,
          nom: acc.nom,
          description: acc.description || null,
          prix: acc.prix ? Number(acc.prix) : 0,
          quantity: acc.quantity || 1,
          image: acc.image || null,
        })),
        user: {
          firstName: facture.User.firstName,
          lastName: facture.User.lastName,
          email: facture.User.email,
        },
        paiements: facture.Paiement.map((p) => ({
          avance_payee: Number(p.avance_payee),
          date_paiement: p.date_paiement,
        })),
      });
    });

    // Convert map to array and sort by client name
    const clientsArray = Array.from(clientsMap.values()).sort((a, b) => 
      a.nom.localeCompare(b.nom)
    );

    return { success: true, data: clientsArray };
  } catch (error) {
    console.error("Error fetching clients and entreprises with factures:", error);
    return { success: false, error: "Failed to fetch clients with factures" };
  }
}
