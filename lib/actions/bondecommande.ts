"use server";

import { prisma } from "@/lib/prisma";

export async function generateNextNumero(factureId: string) {
  try {
    // Check if BonDeCommande already exists for this facture
    const existingBonDeCommande = await prisma.bonDeCommande.findUnique({
      where: { factureId }
    });

    if (existingBonDeCommande) {
      return {
        success: true,
        data: { numero: existingBonDeCommande.numero }
      };
    }

    // Get the latest BonDeCommande to determine next numero
    const latestBonDeCommande = await prisma.bonDeCommande.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let nextNumero: string;
    
    if (!latestBonDeCommande || latestBonDeCommande.numero === "") {
      // If no BonDeCommande exists or numero is empty, start with 000001
      nextNumero = "000001";
    } else {
      // Increment the last numero (extract last 6 digits if stored with prefix)
      const match = latestBonDeCommande.numero.match(/(\d{6})$/);
      const lastNumero = match ? parseInt(match[1], 10) : parseInt(latestBonDeCommande.numero, 10);
      const nextNum = lastNumero + 1;
      nextNumero = nextNum.toString().padStart(6, '0');
    }

    // Build full display numero with date prefix and create the record
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const fullNumero = `BC - ${day}${month}${year}${nextNumero}`;

    // Create new BonDeCommande with the generated numero
    const bonDeCommande = await prisma.bonDeCommande.create({
      data: {
        numero: fullNumero,
        prefix_numero: 'BC',
        factureId: factureId
      }
    });

    return {
      success: true,
      data: { numero: bonDeCommande.numero }
    };
  } catch (error) {
    console.error("Error generating next numero:", error);
    return {
      success: false,
      error: "Failed to generate numero"
    };
  }
}

export async function getBonDeCommandeByFactureId(factureId: string) {
  try {
    const bonDeCommande = await prisma.bonDeCommande.findUnique({
      where: { factureId }
    });

    return {
      success: true,
      data: bonDeCommande
    };
  } catch (error) {
    console.error("Error fetching BonDeCommande:", error);
    return {
      success: false,
      error: "Failed to fetch BonDeCommande"
    };
  }
}

export async function getAllBonDeCommandeGroupedByUser() {
  try {
    // Get all BonDeCommande with their related Factures
    const bonDeCommandes = await prisma.bonDeCommande.findMany({
      include: {
        facture: {
          include: {
            client: true,
            clientEntreprise: true,
            user: true,
            voiture: {
              include: {
                voitureModel: true
              }
            },
            lignes: {
              include: {
                voitureModel: true
              }
            },
            accessoires: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Keep all bon de commandes (not filtering by status)
    const allBonDeCommandes = bonDeCommandes.filter(
      (bdc) => bdc.facture
    );

    // Group by user
    type FactureData = {
      id: string;
      date_facture: Date | null;
      date_echeance: Date | null;
      status_facture: string | null;
      nbr_voiture_commande: number | null;
      accessoire_nom: string | null;
      accessoire_description: string | null;
      accessoire_nbr: number | null;
      client?: unknown;
      clientEntreprise?: unknown;
      voiture?: unknown;
      prix_unitaire?: number | null;
      montant_ht?: number | null;
      total_ht?: number | null;
      remise?: number | null;
      montant_remise?: number | null;
      montant_net_ht?: number | null;
      tva?: number | null;
      montant_tva?: number | null;
      total_ttc?: number | null;
      avance_payee?: number | null;
      reste_payer?: number | null;
      accessoire_prix?: number | null;
      accessoire_subtotal?: number | null;
      lignes?: unknown[];
      accessoires?: unknown[];
      userId: string;
    };

    interface UserData {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      telephone?: string | null;
    }

    const groupedByUser: Record<string, {
      user: UserData;
      bonDeCommandes: Array<{
        bonDeCommande: {
          id: string;
          numero: string;
          createdAt: Date;
          updatedAt: Date;
        };
        facture: FactureData;
      }>;
    }> = {};

    allBonDeCommandes.forEach((bdc) => {
      if (bdc.facture && bdc.facture.userId) {
        const userId = bdc.facture.userId;
        if (!groupedByUser[userId]) {
          groupedByUser[userId] = {
            user: bdc.facture.user as UserData,
            bonDeCommandes: []
          };
        }
        groupedByUser[userId].bonDeCommandes.push({
          bonDeCommande: {
            id: bdc.id,
            numero: bdc.numero,
            createdAt: bdc.createdAt,
            updatedAt: bdc.updatedAt,
          },
          facture: bdc.facture as unknown as FactureData
        });
      }
    });

    // Serialize the data (convert Decimal to numbers)
    const serializedData = Object.entries(groupedByUser).map(([userId, data]) => ({
      userId,
      user: data.user,
      bonDeCommandes: data.bonDeCommandes.map((item) => ({
        bonDeCommande: item.bonDeCommande,
        facture: {
          id: item.facture.id,
          date_facture: item.facture.date_facture,
          date_echeance: item.facture.date_echeance,
          status_facture: item.facture.status_facture,
          nbr_voiture_commande: item.facture.nbr_voiture_commande,
          accessoire_nom: item.facture.accessoire_nom,
          accessoire_description: item.facture.accessoire_description,
          accessoire_nbr: item.facture.accessoire_nbr,
          client: item.facture.client,
          clientEntreprise: item.facture.clientEntreprise,
          voiture: item.facture.voiture,
          prix_unitaire: item.facture.prix_unitaire ? Number(item.facture.prix_unitaire) : 0,
          montant_ht: item.facture.montant_ht ? Number(item.facture.montant_ht) : 0,
          total_ht: item.facture.total_ht ? Number(item.facture.total_ht) : 0,
          remise: item.facture.remise ? Number(item.facture.remise) : 0,
          montant_remise: item.facture.montant_remise ? Number(item.facture.montant_remise) : 0,
          montant_net_ht: item.facture.montant_net_ht ? Number(item.facture.montant_net_ht) : 0,
          tva: item.facture.tva ? Number(item.facture.tva) : 0,
          montant_tva: item.facture.montant_tva ? Number(item.facture.montant_tva) : 0,
          total_ttc: item.facture.total_ttc ? Number(item.facture.total_ttc) : 0,
          avance_payee: item.facture.avance_payee ? Number(item.facture.avance_payee) : 0,
          reste_payer: item.facture.reste_payer ? Number(item.facture.reste_payer) : 0,
          accessoire_prix: item.facture.accessoire_prix ? Number(item.facture.accessoire_prix) : null,
          accessoire_subtotal: item.facture.accessoire_subtotal ? Number(item.facture.accessoire_subtotal) : null,
          lignes: item.facture.lignes?.map((ligne: unknown) => {
            const l = ligne as Record<string, unknown>;
            return {
              ...l,
              prix_unitaire: typeof l.prix_unitaire === 'number' || typeof l.prix_unitaire === 'object' ? Number(l.prix_unitaire) : 0,
              montant_ligne: typeof l.montant_ligne === 'number' || typeof l.montant_ligne === 'object' ? Number(l.montant_ligne) : 0,
            };
          }),
          accessoires: item.facture.accessoires,
          userId: item.facture.userId,
        },
      })),
    }));

    return {
      success: true,
      data: serializedData
    };
  } catch (error) {
    console.error("Error fetching BonDeCommande grouped by user:", error);
    return {
      success: false,
      error: "Failed to fetch BonDeCommande grouped by user"
    };
  }
}

export async function getAllBonDeCommandeWithProformasByUser() {
  try {
    // Get all BonDeCommande with their related Factures
    const bonDeCommandes = await prisma.bonDeCommande.findMany({
      include: {
        facture: {
          include: {
            client: true,
            clientEntreprise: true,
            user: true,
            voiture: {
              include: {
                voitureModel: true
              }
            },
            lignes: {
              include: {
                voitureModel: true
              }
            },
            accessoires: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out bon de commandes that don't have proformas
    const bonDeCommandesWithProformas = bonDeCommandes.filter(
      (bdc) => bdc.facture && bdc.facture.status_facture === "PROFORMA"
    );

    // Group by user
    type ProformaData = {
      id: string;
      date_facture: Date | null;
      date_echeance: Date | null;
      status_facture: string | null;
      nbr_voiture_commande: number | null;
      accessoire_nom: string | null;
      accessoire_description: string | null;
      accessoire_nbr: number | null;
      client?: unknown;
      clientEntreprise?: unknown;
      voiture?: unknown;
      prix_unitaire?: number | null;
      montant_ht?: number | null;
      total_ht?: number | null;
      remise?: number | null;
      montant_remise?: number | null;
      montant_net_ht?: number | null;
      tva?: number | null;
      montant_tva?: number | null;
      total_ttc?: number | null;
      avance_payee?: number | null;
      reste_payer?: number | null;
      accessoire_prix?: number | null;
      accessoire_subtotal?: number | null;
      lignes?: unknown[];
      accessoires?: unknown[];
      userId: string;
    };

    const groupedByUser: Record<string, Array<{
      bonDeCommande: {
        id: string;
        numero: string;
        createdAt: Date;
        updatedAt: Date;
      };
      proforma: ProformaData;
    }>> = {};

    bonDeCommandesWithProformas.forEach((bdc) => {
      if (bdc.facture && bdc.facture.userId) {
        const userId = bdc.facture.userId;
        if (!groupedByUser[userId]) {
          groupedByUser[userId] = [];
        }
        groupedByUser[userId].push({
          bonDeCommande: {
            id: bdc.id,
            numero: bdc.numero,
            createdAt: bdc.createdAt,
            updatedAt: bdc.updatedAt,
          },
          proforma: bdc.facture as unknown as ProformaData
        });
      }
    });

    // Serialize the data (convert Decimal to numbers)
    type SerializedProforma = ProformaData & {
      prix_unitaire: number;
      montant_ht: number;
      total_ht: number;
      remise: number;
      montant_remise: number;
      montant_net_ht: number;
      tva: number;
      montant_tva: number;
      total_ttc: number;
      avance_payee: number;
      reste_payer: number;
    };

    const serializedData: Record<string, Array<{
      bonDeCommande: {
        id: string;
        numero: string;
        createdAt: Date;
        updatedAt: Date;
      };
      proforma: SerializedProforma;
      user: unknown;
    }>> = {};

    Object.keys(groupedByUser).forEach((userId) => {
      serializedData[userId] = groupedByUser[userId].map((item) => ({
        bonDeCommande: item.bonDeCommande,
        proforma: {
          id: item.proforma.id,
          date_facture: item.proforma.date_facture,
          date_echeance: item.proforma.date_echeance,
          status_facture: item.proforma.status_facture,
          nbr_voiture_commande: item.proforma.nbr_voiture_commande,
          accessoire_nom: item.proforma.accessoire_nom,
          accessoire_description: item.proforma.accessoire_description,
          accessoire_nbr: item.proforma.accessoire_nbr,
          client: item.proforma.client,
          clientEntreprise: item.proforma.clientEntreprise,
          voiture: item.proforma.voiture,
          prix_unitaire: item.proforma.prix_unitaire ? Number(item.proforma.prix_unitaire) : 0,
          montant_ht: item.proforma.montant_ht ? Number(item.proforma.montant_ht) : 0,
          total_ht: item.proforma.total_ht ? Number(item.proforma.total_ht) : 0,
          remise: item.proforma.remise ? Number(item.proforma.remise) : 0,
          montant_remise: item.proforma.montant_remise ? Number(item.proforma.montant_remise) : 0,
          montant_net_ht: item.proforma.montant_net_ht ? Number(item.proforma.montant_net_ht) : 0,
          tva: item.proforma.tva ? Number(item.proforma.tva) : 0,
          montant_tva: item.proforma.montant_tva ? Number(item.proforma.montant_tva) : 0,
          total_ttc: item.proforma.total_ttc ? Number(item.proforma.total_ttc) : 0,
          avance_payee: item.proforma.avance_payee ? Number(item.proforma.avance_payee) : 0,
          reste_payer: item.proforma.reste_payer ? Number(item.proforma.reste_payer) : 0,
          accessoire_prix: item.proforma.accessoire_prix ? Number(item.proforma.accessoire_prix) : null,
          accessoire_subtotal: item.proforma.accessoire_subtotal ? Number(item.proforma.accessoire_subtotal) : null,
          lignes: item.proforma.lignes?.map((ligne: unknown) => {
            const l = ligne as Record<string, unknown>;
            return {
              ...l,
              prix_unitaire: typeof l.prix_unitaire === 'number' || typeof l.prix_unitaire === 'object' ? Number(l.prix_unitaire) : 0,
              montant_ligne: typeof l.montant_ligne === 'number' || typeof l.montant_ligne === 'object' ? Number(l.montant_ligne) : 0,
            };
          }),
          accessoires: item.proforma.accessoires?.map((accessoire: unknown) => {
            const a = accessoire as Record<string, unknown>;
            return {
              id: typeof a.id === 'string' ? a.id : '',
              nom: typeof a.nom === 'string' ? a.nom : '',
              description: typeof a.description === 'string' ? a.description : null,
              prix: typeof a.prix === 'number' || typeof a.prix === 'object' ? Number(a.prix) : 0,
              quantity: a.quantity ? Number(a.quantity) : 1,
              image: a.image || null,
            };
          }),
          userId: item.proforma.userId,
        },
        user: (item.proforma as unknown as Record<string, unknown>).user
      }));
    });

    return {
      success: true,
      data: serializedData
    };
  } catch (error) {
    console.error("Error fetching BonDeCommande with Proformas:", error);
    return {
      success: false,
      error: "Failed to fetch BonDeCommande with Proformas"
    };
  }
}
