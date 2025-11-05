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
          lignes: item.proforma.lignes?.map((ligne: Record<string, unknown>) => ({
            ...ligne,
            prix_unitaire: typeof ligne.prix_unitaire === 'number' || typeof ligne.prix_unitaire === 'object' ? Number(ligne.prix_unitaire) : 0,
            montant_ligne: typeof ligne.montant_ligne === 'number' || typeof ligne.montant_ligne === 'object' ? Number(ligne.montant_ligne) : 0,
          })),
          accessoires: item.proforma.accessoires?.map((accessoire: Record<string, unknown>) => ({
            id: typeof accessoire.id === 'string' ? accessoire.id : '',
            nom: typeof accessoire.nom === 'string' ? accessoire.nom : '',
            description: typeof accessoire.description === 'string' ? accessoire.description : null,
            prix: typeof accessoire.prix === 'number' || typeof accessoire.prix === 'object' ? Number(accessoire.prix) : 0,
            quantity: accessoire.quantity ? Number(accessoire.quantity) : 1,
            image: accessoire.image || null,
          })),
          clientId: item.proforma.clientId || null,
          clientEntrepriseId: item.proforma.clientEntrepriseId || null,
        },
        user: item.proforma.user
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
