"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { currentUser } from "@clerk/nextjs/server";

export async function createPaiement(data: {
  factureId: string;
  clientId?: string;
  clientEntrepriseId?: string;
  avance_payee: number;
  date_paiement: Date;
  mode_paiement: "CB" | "CHEQUE" | "VIREMENT" | "CASH";
  status_paiement?: "EN_ATTENTE" | "PAYE" | "ANNULE";
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Utilisateur non authentifié" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
    });

    if (!dbUser) {
      return { success: false, error: "Utilisateur non trouvé" };
    }

    // Get the facture to calculate remaining amount
    const facture = await prisma.facture.findUnique({
      where: { id: data.factureId },
      include: {
        Paiement: true,
      },
    });

    if (!facture) {
      return { success: false, error: "Facture non trouvée" };
    }

    // Calculate total paid so far
    const totalPaidSoFar = (facture.Paiement || []).reduce(
      (sum, paiement) => sum + Number(paiement.avance_payee),
      0,
    );

    // Calculate remaining amount
    const totalTtc = Number(facture.total_ttc);
    const newTotalPaid = totalPaidSoFar + data.avance_payee;
    const reste_payer = Math.max(0, totalTtc - newTotalPaid);

    // Create the paiement
    const paiement = await prisma.paiement.create({
      data: {
        id: crypto.randomUUID(),
        factureId: data.factureId,
        clientId: data.clientId || undefined,
        clientEntrepriseId: data.clientEntrepriseId || undefined,
        userId: dbUser.id,
        avance_payee: new Decimal(data.avance_payee),
        reste_payer: new Decimal(reste_payer),
        date_paiement: data.date_paiement,
        mode_paiement: data.mode_paiement,
        status_paiement: data.status_paiement || "EN_ATTENTE",
        updatedAt: new Date(),
      },
    });

    // Update facture's avance_payee and reste_payer
    await prisma.facture.update({
      where: { id: data.factureId },
      data: {
        avance_payee: new Decimal(newTotalPaid),
        reste_payer: new Decimal(reste_payer),
        status_facture: reste_payer === 0 ? "PAYEE" : facture.status_facture,
      },
    });

    revalidatePath("/comptable/facture");
    revalidatePath(`/comptable/facture/${data.factureId}/paiement`);

    return {
      success: true,
      data: {
        ...paiement,
        avance_payee: Number(paiement.avance_payee),
        reste_payer: Number(paiement.reste_payer),
      },
    };
  } catch (error) {
    console.error("Error creating paiement:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erreur lors de la création du paiement";
    return { success: false, error: errorMessage };
  }
}

export async function getPaiementsByFactureId(factureId: string) {
  try {
    const paiements = await prisma.paiement.findMany({
      where: { factureId },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: (paiements as unknown[]).map((paiement: unknown) => {
        const p = paiement as Record<string, unknown> & {
          avance_payee: Decimal | number;
          reste_payer: Decimal | number;
          User?: unknown;
        };
        return {
          ...p,
          avance_payee: Number(p.avance_payee),
          reste_payer: Number(p.reste_payer),
          user: p.User,
        };
      }),
    };
  } catch (error) {
    console.error("Error fetching paiements:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des paiements",
      data: [],
    };
  }
}

export async function getFactureWithPaiements(factureId: string) {
  try {
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        Client: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            email: true,
            entreprise: true,
            localisation: true,
            commercial: true,
          },
        },
        Client_entreprise: {
          select: {
            id: true,
            nom_entreprise: true,
            telephone: true,
            email: true,
            localisation: true,
            commercial: true,
          },
        },
        Paiement: {
          include: {
            User: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            NumeroEntreeCaisse: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!facture) {
      return { success: false, error: "Facture non trouvée" };
    }

    // Calculate total paid
    const totalPaid = (facture.Paiement || []).reduce(
      (sum, paiement) => sum + Number(paiement.avance_payee),
      0,
    );

    // Serialize all Decimal fields to numbers
    return {
      success: true,
      data: {
        id: facture.id,
        createdAt: facture.createdAt,
        updatedAt: facture.updatedAt,
        clientId: facture.clientId,
        clientEntrepriseId: facture.clientEntrepriseId,
        userId: facture.userId,
        date_facture: facture.date_facture,
        date_echeance: facture.date_echeance,
        status_facture: facture.status_facture,
        voitureId: facture.voitureId,
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
        accessoire_description: facture.accessoire_description,
        accessoire_nbr: facture.accessoire_nbr,
        accessoire_nom: facture.accessoire_nom,
        accessoire_prix: facture.accessoire_prix
          ? Number(facture.accessoire_prix)
          : null,
        accessoire_subtotal: facture.accessoire_subtotal
          ? Number(facture.accessoire_subtotal)
          : null,
        bon_pour_acquis: facture.bon_pour_acquis,
        client: facture.Client,
        clientEntreprise: facture.Client_entreprise,
        totalPaid,
        paiements: (facture.Paiement || []).map((p: unknown) => {
          const paiement = p as Record<string, unknown> & {
            avance_payee: Decimal | number;
            reste_payer: Decimal | number;
            User?: unknown;
            NumeroEntreeCaisse?: unknown;
          };
          return {
            ...paiement,
            avance_payee: Number(paiement.avance_payee),
            reste_payer: Number(paiement.reste_payer),
            user: paiement.User,
            numeroEntreeCaisse: paiement.NumeroEntreeCaisse,
          };
        }),
      },
    };
  } catch (error) {
    console.error("Error fetching facture:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération de la facture",
    };
  }
}

export async function getAllPaiementsGroupedByClient() {
  try {
    const paiements = await prisma.paiement.findMany({
      include: {
        Client: {
          select: {
            id: true,
            nom: true,
            telephone: true,
            email: true,
            entreprise: true,
            localisation: true,
            commercial: true,
          },
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
          },
        },
        Facture: {
          select: {
            id: true,
            date_facture: true,
            total_ttc: true,
          },
        },
        User: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        NumeroEntreeCaisse: true,
      },
      orderBy: {
        date_paiement: "desc",
      },
    });

    // Group payments by client/clientEntreprise
    const groupedByClient: Record<string, unknown[]> = {};
    const groupedByClientEntreprise: Record<string, unknown[]> = {};

    (paiements as unknown[]).forEach((paiement: unknown) => {
      const p = paiement as Record<string, unknown> & {
        clientId?: string;
        clientEntrepriseId?: string;
        Client?: unknown;
        Client_entreprise?: unknown;
      };
      if (p.clientId && p.Client) {
        const clientId = p.clientId;
        if (!groupedByClient[clientId]) {
          groupedByClient[clientId] = [];
        }
        groupedByClient[clientId].push(p);
      } else if (p.clientEntrepriseId && p.Client_entreprise) {
        const clientEntrepriseId = p.clientEntrepriseId;
        if (!groupedByClientEntreprise[clientEntrepriseId]) {
          groupedByClientEntreprise[clientEntrepriseId] = [];
        }
        groupedByClientEntreprise[clientEntrepriseId].push(p);
      }
    });

    const serializePaiement = (p: unknown) => {
      const paiement = p as Record<string, unknown> & {
        avance_payee: Decimal | number;
        reste_payer: Decimal | number;
        Facture: { id: string; date_facture: Date; total_ttc: Decimal | number };
        User?: unknown;
        NumeroEntreeCaisse?: unknown;
      };
      const {
        Facture,
        User,
        NumeroEntreeCaisse,
        Client: _Client,
        Client_entreprise: _ClientEntreprise,
        avance_payee,
        reste_payer,
        ...rest
      } = paiement as Record<string, unknown> & {
        Facture: { id: string; date_facture: Date; total_ttc: Decimal | number };
        User?: unknown;
        NumeroEntreeCaisse?: unknown;
        Client?: unknown;
        Client_entreprise?: unknown;
        avance_payee: Decimal | number;
        reste_payer: Decimal | number;
      };
      void _Client;
      void _ClientEntreprise;
      return {
        ...rest,
        avance_payee: Number(avance_payee),
        reste_payer: Number(reste_payer),
        facture: {
          id: Facture.id,
          date_facture: Facture.date_facture,
          total_ttc: Number(Facture.total_ttc),
        },
        user: User,
        numeroEntreeCaisse: NumeroEntreeCaisse,
      };
    };

    // Transform the data
    const clientsData = Object.entries(groupedByClient).map(
      ([clientId, paiements]) => {
        const firstP = paiements[0] as Record<string, unknown> & { Client: unknown };
        const client = firstP.Client!;
        const totalAmount = (paiements as Array<{ avance_payee: Decimal | number }>).reduce(
          (sum, p) => sum + Number(p.avance_payee),
          0,
        );
        return {
          clientId,
          client,
          paiements: paiements.map(serializePaiement),
          totalAmount,
        };
      },
    );

    const clientEntreprisesData = Object.entries(groupedByClientEntreprise).map(
      ([clientEntrepriseId, paiements]) => {
        const firstP = paiements[0] as Record<string, unknown> & { Client_entreprise: unknown };
        const clientEntreprise = firstP.Client_entreprise!;
        const totalAmount = (paiements as Array<{ avance_payee: Decimal | number }>).reduce(
          (sum, p) => sum + Number(p.avance_payee),
          0,
        );
        return {
          clientEntrepriseId,
          clientEntreprise,
          paiements: paiements.map(serializePaiement),
          totalAmount,
        };
      },
    );

    return {
      success: true,
      data: {
        clients: clientsData,
        clientEntreprises: clientEntreprisesData,
      },
    };
  } catch (error) {
    console.error("Error fetching paiements grouped by client:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des paiements",
      data: { clients: [], clientEntreprises: [] },
    };
  }
}

export async function generateNumeroEntreeCaisse(paiementId: string) {
  try {
    // Check if NumeroEntreeCaisse already exists for this paiement
    const existing = await prisma.numeroEntreeCaisse.findUnique({
      where: { paiementId },
    });

    if (existing) {
      return {
        success: true,
        data: {
          numero: existing.numero,
          prefix_numero: existing.prefix_numero,
        },
      };
    }

    // Get the latest NumeroEntreeCaisse to determine the next number
    // Order by numero descending to get the highest number (works with zero-padded strings)
    const latest = await prisma.numeroEntreeCaisse.findFirst({
      orderBy: {
        numero: "desc",
      },
    });

    // Generate the next number (7 digits)
    let nextNumber: number;
    if (latest) {
      const lastNumber = parseInt(latest.numero, 10);
      nextNumber = lastNumber + 1;
    } else {
      // Start from 0000001 if no records exist
      nextNumber = 1;
    }

    // Ensure the number is 7 digits (pad with zeros)
    const numero = nextNumber.toString().padStart(7, "0");

    // Generate prefix_numero (format: EC-YYYY where YYYY is the current year)
    const currentYear = new Date().getFullYear();
    const prefix_numero = `EC-${currentYear}`;

    // Create the NumeroEntreeCaisse
    const numeroEntreeCaisse = await prisma.numeroEntreeCaisse.create({
      data: {
        id: crypto.randomUUID(),
        numero,
        prefix_numero,
        paiementId,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/comptable/facture");
    revalidatePath(`/comptable/facture/*/paiement`);

    return {
      success: true,
      data: {
        numero: numeroEntreeCaisse.numero,
        prefix_numero: numeroEntreeCaisse.prefix_numero,
      },
    };
  } catch (error) {
    console.error("Error generating NumeroEntreeCaisse:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erreur lors de la génération du numéro d'entrée de caisse";
    return { success: false, error: errorMessage };
  }
}
