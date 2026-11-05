"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type StatusBonDeCommande } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseBonCommandeContenu, type BonCommandeContenu } from "@/lib/bon-commande-document";
import {
  asNumber,
  countBonsAValider as countBonsAValiderQuery,
  currentUserId,
  currentUserRole,
  etapeOf,
  isResponsableCommercial,
} from "@/lib/bon-commande-lecture";

export type {
  BonAValider,
  BonCommandeDocumentData,
  BonCommandeOptionLine,
  BonCommandeProformaRef,
  BonCommandeSource,
  DossierBonOption,
} from "@/lib/bon-commande-lecture";

export async function countBonsAValider() {
  return countBonsAValiderQuery();
}

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
        id: crypto.randomUUID(),
        numero: fullNumero,
        prefix_numero: 'BC',
        factureId: factureId,
        updatedAt: new Date()
      }
    });

    revalidatePath("/commercial/bon-de-commande");
    revalidatePath("/commercial/dossier-clientele");

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

export async function saveBonCommandeDocument(factureId: string, contenu: BonCommandeContenu) {
  try {
    const userId = await currentUserId();
    if (!userId) return { success: false as const, error: "Non autorisé" };

    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      select: { id: true, clientId: true, clientEntrepriseId: true, status_facture: true },
    });
    if (!facture || facture.status_facture === "ANNULEE") {
      return { success: false as const, error: "Cette proforma ne peut pas recevoir de bon de commande" };
    }

    const prospectId = facture.clientEntrepriseId ?? facture.clientId;
    const dossier = prospectId
      ? await prisma.dossierClientele.findFirst({
          where: {
            userId,
            prospectId,
            prospectType: facture.clientEntrepriseId ? "ENTREPRISE" : "CLIENT",
          },
          select: { id: true },
        })
      : null;
    if (!dossier) return { success: false as const, error: "Dossier introuvable" };

    const existing = await prisma.bonDeCommande.findUnique({ where: { factureId } });
    let numero = contenu.numero.trim();

    if (!existing && !numero) {
      const created = await generateNextNumero(factureId);
      if (!created.success || !created.data) {
        return { success: false as const, error: "Le bon de commande n'a pas pu être créé" };
      }
      numero = created.data.numero;
    } else if (!existing) {
      await prisma.bonDeCommande.create({
        data: {
          id: crypto.randomUUID(),
          numero,
          prefix_numero: "BC",
          factureId,
          updatedAt: new Date(),
        },
      });
    }

    const previous = parseBonCommandeContenu(existing?.contenu);
    const stored: BonCommandeContenu = {
      ...contenu,
      numero: numero || existing?.numero || "",
      etapeValidation: contenu.etapeValidation || previous?.etapeValidation || "",
    };
    const documentKind = contenu.documentKind || previous?.documentKind;
    if (documentKind) stored.documentKind = documentKind;
    await prisma.bonDeCommande.update({
      where: { factureId },
      data: {
        numero: stored.numero,
        prefix_numero: "BC",
        contenu: stored as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/commercial/bon-de-commande");
    revalidatePath("/commercial/dossier-clientele");
    return { success: true as const, numero: stored.numero };
  } catch (error) {
    console.error("Error saving bon de commande:", error);
    return { success: false as const, error: "L'enregistrement a échoué" };
  }
}

export async function soumettreBonDeCommandeValidation(factureId: string, contenu: BonCommandeContenu) {
  const saved = await saveBonCommandeDocument(factureId, contenu);
  if (!saved.success) return saved;

  const existing = await prisma.bonDeCommande.findUnique({ where: { factureId } });
  if (!existing) return { success: false as const, error: "Le bon de commande n'a pas pu être envoyé" };

  const etape = etapeOf(existing.contenu);
  const column = existing.status_bon_de_commande;
  const closed =
    etape === "EN_VALIDATION" ||
    etape === "SOUS_RESERVE" ||
    etape === "VALIDE" ||
    column === "SOUS_RESERVE" ||
    column === "VALIDE" ||
    column === "VALIDE_APPORT_INITIAL" ||
    column === "ANNULE";
  if (closed) {
    return { success: false as const, error: "Ce bon ne peut plus être envoyé en validation" };
  }
  if (etape !== "A_VALIDER") {
    const contenu = parseBonCommandeContenu(existing.contenu);
    if (!contenu) return { success: false as const, error: "Le bon de commande n'a pas pu être envoyé" };
    contenu.etapeValidation = "A_VALIDER";
    await prisma.bonDeCommande.update({
      where: { factureId },
      data: { contenu: contenu as unknown as Prisma.InputJsonValue, updatedAt: new Date() },
    });
  }

  revalidatePath("/commercial/bon-de-commande");
  revalidatePath("/commercial/dossier-clientele");
  revalidatePath("/responsablecommercial/bon-de-commande");
  return { success: true as const, numero: saved.numero };
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

export async function updateBonDeCommandeStatus(
  factureId: string,
  status: StatusBonDeCommande
) {
  try {
    const existing = await prisma.bonDeCommande.findUnique({
      where: { factureId }
    });
    if (!existing) {
      return {
        success: false,
        error: "Aucun bon de commande pour cette facture"
      };
    }

    const bonDeCommande = await prisma.bonDeCommande.update({
      where: { factureId },
      data: {
        status_bon_de_commande: status,
        updatedAt: new Date()
      }
    });

    return { success: true, data: bonDeCommande };
  } catch (error) {
    console.error("Error updating BonDeCommande status:", error);
    return {
      success: false,
      error: "Échec de la mise à jour du statut"
    };
  }
}

export async function getAllBonDeCommandeGroupedByUser() {
  try {
    // Get all BonDeCommande with their related Factures

    const bonDeCommandes = await prisma.bonDeCommande.findMany({
      include: {
        Facture: {
          include: {
            Client: true,
            Client_entreprise: true,
            User: true,
            Voiture: {
              include: {
                VoitureModel: true
              }
            },
            FactureLigne: {
              include: {
                VoitureModel: true
              }
            },
            Accessoire: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Keep all bon de commandes (not filtering by status)
    const allBonDeCommandes = (bonDeCommandes as unknown[]).filter(
      (bdc: unknown) => (bdc as { Facture?: unknown }).Facture
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

    allBonDeCommandes.forEach((bdc: unknown) => {
      const b = bdc as { 
        id: string; 
        numero: string; 
        createdAt: Date; 
        updatedAt: Date; 
        Facture: { 
          userId: string; 
          User: UserData;
          Client?: unknown;
          Client_entreprise?: unknown;
          Voiture?: unknown;
          FactureLigne?: unknown[];
          Accessoire?: unknown[];
        } 
      };
      if (b.Facture && b.Facture.userId) {
        const userId = b.Facture.userId;
        if (!groupedByUser[userId]) {
          groupedByUser[userId] = {
            user: b.Facture.User as UserData,
            bonDeCommandes: []
          };
        }
        groupedByUser[userId].bonDeCommandes.push({
          bonDeCommande: {
            id: b.id,
            numero: b.numero,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt
          },
          facture: {
            ...b.Facture,
            client: b.Facture.Client,
            clientEntreprise: b.Facture.Client_entreprise,
            voiture: b.Facture.Voiture,
            lignes: b.Facture.FactureLigne,
            accessoires: b.Facture.Accessoire
          } as unknown as FactureData
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
        Facture: {
          include: {
            Client: true,
            Client_entreprise: true,
            User: true,
            Voiture: {
              include: {
                VoitureModel: true
              }
            },
            FactureLigne: {
              include: {
                VoitureModel: true
              }
            },
            Accessoire: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out bon de commandes that don't have proformas
    const bonDeCommandesWithProformas = (bonDeCommandes as unknown[]).filter(
      (bdc: unknown) => {
        const b = bdc as { Facture?: { status_facture: string } };
        return b.Facture && b.Facture.status_facture === "PROFORMA";
      }
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

    bonDeCommandesWithProformas.forEach((bdc: unknown) => {
      const b = bdc as {
        id: string;
        numero: string;
        createdAt: Date;
        updatedAt: Date;
        Facture: {
          userId: string;
          Client?: unknown;
          Client_entreprise?: unknown;
          Voiture?: unknown;
          FactureLigne?: unknown[];
          Accessoire?: unknown[];
        }
      };
      if (b.Facture && b.Facture.userId) {
        const userId = b.Facture.userId;
        if (!groupedByUser[userId]) {
          groupedByUser[userId] = [];
        }
        groupedByUser[userId].push({
          bonDeCommande: {
            id: b.id,
            numero: b.numero,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt
          },
          proforma: {
            ...b.Facture,
            client: b.Facture.Client,
            clientEntreprise: b.Facture.Client_entreprise,
            voiture: b.Facture.Voiture,
            lignes: b.Facture.FactureLigne,
            accessoires: b.Facture.Accessoire
          } as unknown as ProformaData
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
        user: (item.proforma as unknown as Record<string, unknown>).User
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


function parseMoney(value: string | undefined) {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function modePaiement(reglement: string): "CB" | "CHEQUE" | "VIREMENT" | "CASH" {
  if (reglement === "cheque") return "CHEQUE";
  if (reglement === "especes" || reglement === "mobile") return "CASH";
  if (reglement === "cb") return "CB";
  return "VIREMENT";
}

async function prochainNumeroRecu() {
  const latestReceipt = await prisma.numeroEntreeCaisse.findFirst({
    orderBy: { createdAt: "desc" },
    select: { numero: true },
  });
  const lastNumber = latestReceipt ? parseInt(latestReceipt.numero, 10) : 0;
  let nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  let numero = String(nextNumber).padStart(7, "0");
  while (await prisma.numeroEntreeCaisse.findUnique({ where: { numero }, select: { id: true } })) {
    nextNumber += 1;
    numero = String(nextNumber).padStart(7, "0");
  }
  return numero;
}

async function ecrireEcheancierVersements(factureId: string, contenu: BonCommandeContenu) {
  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    include: { Paiement: { include: { NumeroEntreeCaisse: true } } },
  });
  if (!facture) return;

  for (const item of facture.Paiement) {
    const prefix = item.NumeroEntreeCaisse?.prefix_numero;
    if ((prefix === "AC2" || prefix === "SLD") && item.status_paiement !== "PAYE") {
      if (item.NumeroEntreeCaisse) {
        await prisma.numeroEntreeCaisse.delete({ where: { id: item.NumeroEntreeCaisse.id } });
      }
      await prisma.paiement.delete({ where: { id: item.id } });
    }
  }

  const total = asNumber(facture.total_ttc);
  const acompte1 = parseMoney(contenu.acompte1) || Math.round(total * 0.3);
  const echeances = [{ prefix: "AC1", montant: acompte1, statut: "PAYE" as const }].filter((item) => item.montant > 0);

  let cumul = 0;
  for (const echeance of echeances) {
    cumul += echeance.montant;
    const reste = Math.max(0, total - cumul);
    const existing = facture.Paiement.find((item) => item.NumeroEntreeCaisse?.prefix_numero === echeance.prefix);
    if (existing) {
      if (echeance.prefix === "AC1" && existing.status_paiement !== "PAYE") {
        await prisma.paiement.update({
          where: { id: existing.id },
          data: { status_paiement: "PAYE", updatedAt: new Date() },
        });
      }
      continue;
    }
    const paiement = await prisma.paiement.create({
      data: {
        id: crypto.randomUUID(),
        factureId,
        clientId: facture.clientId,
        clientEntrepriseId: facture.clientEntrepriseId,
        userId: facture.userId,
        avance_payee: echeance.montant,
        reste_payer: reste,
        date_paiement: new Date(),
        mode_paiement: modePaiement(contenu.reglement),
        status_paiement: echeance.statut,
        updatedAt: new Date(),
      },
    });
    await prisma.numeroEntreeCaisse.create({
      data: {
        id: crypto.randomUUID(),
        numero: await prochainNumeroRecu(),
        prefix_numero: echeance.prefix,
        paiementId: paiement.id,
        updatedAt: new Date(),
      },
    });
  }

  const paiements = await prisma.paiement.findMany({
    where: { factureId, status_paiement: "PAYE" },
    select: { avance_payee: true },
  });
  const verse = paiements.reduce((sum, item) => sum + asNumber(item.avance_payee), 0);
  await prisma.facture.update({
    where: { id: factureId },
    data: {
      avance_payee: verse,
      reste_payer: Math.max(0, total - verse),
      updatedAt: new Date(),
    },
  });
}

export async function validerAutreVersement(paiementId: string) {
  const role = await currentUserRole();
  if (!isResponsableCommercial(role)) {
    return { success: false as const, error: "Seul le responsable commercial peut valider ce versement" };
  }
  const paiement = await prisma.paiement.findUnique({
    where: { id: paiementId },
    include: { NumeroEntreeCaisse: true, Facture: { select: { id: true, total_ttc: true } } },
  });
  if (!paiement) return { success: false as const, error: "Versement introuvable" };
  if (paiement.NumeroEntreeCaisse?.prefix_numero === "AC1") {
    return { success: false as const, error: "Le premier versement est déjà validé" };
  }
  if (paiement.status_paiement !== "PAYE") {
    await prisma.paiement.update({
      where: { id: paiementId },
      data: { status_paiement: "PAYE", updatedAt: new Date() },
    });
  }
  const payes = await prisma.paiement.findMany({
    where: { factureId: paiement.factureId, status_paiement: "PAYE" },
    select: { avance_payee: true },
  });
  const verse = payes.reduce((sum, item) => sum + asNumber(item.avance_payee), 0);
  const total = asNumber(paiement.Facture.total_ttc);
  await prisma.facture.update({
    where: { id: paiement.factureId },
    data: {
      avance_payee: verse,
      reste_payer: Math.max(0, total - verse),
      updatedAt: new Date(),
    },
  });
  revalidatePath("/commercial/dossier-clientele", "layout");
  return { success: true as const };
}

export async function peutValiderAutresVersements() {
  return isResponsableCommercial(await currentUserRole());
}

export async function soumettreNouveauVersement(input: { dossierId: string; date: string; montant: string }) {
  const userId = await currentUserId();
  const role = await currentUserRole();
  if (!userId) return { success: false as const, error: "Non autorisé" };
  const responsable = isResponsableCommercial(role);
  const dossier = await prisma.dossierClientele.findFirst({
    where: responsable ? { id: input.dossierId } : { id: input.dossierId, userId },
  });
  if (!dossier) return { success: false as const, error: "Dossier introuvable" };

  const montant = parseMoney(input.montant);
  if (montant <= 0) return { success: false as const, error: "Indiquez le montant versé" };
  const date = new Date(`${input.date}T12:00:00`);
  if (!input.date || Number.isNaN(date.getTime())) {
    return { success: false as const, error: "Indiquez la date du versement" };
  }

  const owner =
    dossier.prospectType === "ENTREPRISE"
      ? { clientEntrepriseId: dossier.prospectId }
      : { clientId: dossier.prospectId };
  const facture = await prisma.facture.findFirst({
    where: { ...owner, BonDeCommande: { status_bon_de_commande: "VALIDE" } },
    orderBy: { updatedAt: "desc" },
    include: { Paiement: { where: { status_paiement: "PAYE" }, select: { avance_payee: true } } },
  });
  if (!facture) return { success: false as const, error: "Aucun bon de commande validé pour ce dossier" };

  const total = asNumber(facture.total_ttc);
  const verse = facture.Paiement.reduce((sum, item) => sum + asNumber(item.avance_payee), 0);
  const paiement = await prisma.paiement.create({
    data: {
      id: crypto.randomUUID(),
      factureId: facture.id,
      clientId: facture.clientId,
      clientEntrepriseId: facture.clientEntrepriseId,
      userId: facture.userId,
      avance_payee: montant,
      reste_payer: Math.max(0, total - verse - montant),
      date_paiement: date,
      mode_paiement: "VIREMENT",
      status_paiement: "EN_ATTENTE",
      updatedAt: new Date(),
    },
  });
  await prisma.numeroEntreeCaisse.create({
    data: {
      id: crypto.randomUUID(),
      numero: await prochainNumeroRecu(),
      prefix_numero: "VS",
      paiementId: paiement.id,
      updatedAt: new Date(),
    },
  });
  revalidatePath("/commercial/dossier-clientele", "layout");
  return { success: true as const };
}

async function appliquerEffetsValidation(factureId: string, contenu: BonCommandeContenu) {
  try {
  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    include: {
      Paiement: { select: { id: true } },
      Client: { select: { status_client: true } },
      Client_entreprise: { select: { status_client: true } },
    },
  });
  if (!facture) return;

  if (facture.clientId && facture.Client?.status_client !== "CLIENT") {
    await prisma.client.update({
      where: { id: facture.clientId },
      data: { status_client: "CLIENT" },
    });
  }
  if (facture.clientEntrepriseId && facture.Client_entreprise?.status_client !== "CLIENT") {
    await prisma.client_entreprise.update({
      where: { id: facture.clientEntrepriseId },
      data: { status_client: "CLIENT" },
    });
  }

  const dejaVendu = facture.status_facture === "FACTURE" || facture.status_facture === "PAYEE";
  if (!dejaVendu) {
    await prisma.facture.update({
      where: { id: factureId },
      data: { status_facture: "FACTURE", updatedAt: new Date() },
    });
  }

  await ecrireEcheancierVersements(factureId, contenu);
  } catch (error) {
    console.error("Effets de validation du bon de commande:", error);
  }
}

export async function assurerEffetsBonValide(factureId: string) {
  try {
    const bon = await prisma.bonDeCommande.findUnique({ where: { factureId } });
    const contenu = bon ? parseBonCommandeContenu(bon.contenu) : null;
    if (!bon || bon.status_bon_de_commande !== "VALIDE" || !contenu) return;
    await appliquerEffetsValidation(factureId, contenu);
  } catch (error) {
    console.error("Effets de validation du bon de commande:", error);
  }
}

async function setEtapeValidation(
  factureId: string,
  etape: "EN_VALIDATION" | "SOUS_RESERVE" | "VALIDE",
  from: Array<"A_VALIDER" | "EN_VALIDATION">,
  column?: StatusBonDeCommande,
) {
  const role = await currentUserRole();
  if (!isResponsableCommercial(role)) return { success: false as const, error: "Non autorisé" };

  const existing = await prisma.bonDeCommande.findUnique({ where: { factureId } });
  const contenu = existing ? parseBonCommandeContenu(existing.contenu) : null;
  const current = contenu?.etapeValidation || "";
  if (!existing || !contenu || !from.includes(current as "A_VALIDER" | "EN_VALIDATION")) {
    return { success: false as const, error: "Ce bon n'est pas en attente de validation" };
  }

  contenu.etapeValidation = etape;
  await prisma.bonDeCommande.update({
    where: { factureId },
    data: {
      contenu: contenu as unknown as Prisma.InputJsonValue,
      ...(column ? { status_bon_de_commande: column } : {}),
      updatedAt: new Date(),
    },
  });

  if (etape === "VALIDE") await assurerEffetsBonValide(factureId);
  revalidatePath("/responsablecommercial/bon-de-commande");
  revalidatePath("/responsablecommercial/bon-de-commande-deja-valide");
  revalidatePath("/commercial/bon-de-commande-deja-valide");
  revalidatePath("/commercial/appel-offre-deja-valide");
  revalidatePath("/commercial/bon-de-commande");
  revalidatePath("/commercial/dossier-clientele");
  revalidatePath("/commercial");
  revalidatePath("/commercial/clients");
  revalidatePath("/commercial/prospects");
  revalidatePath("/commercial/objectifs");
  revalidatePath("/commercial/statistiques");
  return { success: true as const };
}

export async function commencerValidationBonDeCommande(factureId: string) {
  return setEtapeValidation(factureId, "EN_VALIDATION", ["A_VALIDER"]);
}

export async function validerBonDeCommande(factureId: string) {
  return setEtapeValidation(factureId, "VALIDE", ["EN_VALIDATION"], "VALIDE");
}

async function promouvoirProspectEnClient(factureId: string) {
  const facture = await prisma.facture.findUnique({
    where: { id: factureId },
    select: {
      Client: { select: { id: true, status_client: true } },
      Client_entreprise: { select: { id: true, status_client: true } },
    },
  });
  if (!facture) return;

  const now = new Date();
  if (facture.Client && facture.Client.status_client !== "CLIENT") {
    await prisma.client.update({
      where: { id: facture.Client.id },
      data: { status_client: "CLIENT" },
    });
  }
  if (facture.Client_entreprise && facture.Client_entreprise.status_client !== "CLIENT") {
    await prisma.client_entreprise.update({
      where: { id: facture.Client_entreprise.id },
      data: { status_client: "CLIENT", updatedAt: now },
    });
  }

  await prisma.bonPourAccord.updateMany({
    where: { factureId },
    data: { status_bon_pour_accord: "VALIDE", updatedAt: now },
  });
}

export async function validerBonPourAccord(factureId: string) {
  const result = await validerBonDeCommande(factureId);
  if (!result.success) return result;

  try {
    await promouvoirProspectEnClient(factureId);
  } catch (error) {
    console.error("Promotion du prospect après bon pour accord:", error);
    return { success: false as const, error: "Le bon est validé, mais le prospect n'a pas pu devenir client" };
  }

  revalidatePath("/responsablecommercial/bon-pour-accord");
  revalidatePath("/responsablecommercial/bon-pour-accord-deja-valide");
  revalidatePath("/commercial/bon-pour-accord-deja-valide");
  revalidatePath("/responsablecommercial/clients");
  revalidatePath("/responsablecommercial/prospects");
  revalidatePath("/responsablecommercial/performences");
  revalidatePath("/commercial/clients");
  revalidatePath("/commercial/prospects");
  revalidatePath("/commercial");
  return result;
}

export async function marquerBonSousReserve(factureId: string) {
  return setEtapeValidation(factureId, "SOUS_RESERVE", ["A_VALIDER", "EN_VALIDATION"], "SOUS_RESERVE");
}
