import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface WithCreatedUpdated {
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

interface CommandeWithRelations extends Record<string, unknown> {
  Client?: WithCreatedUpdated | null;
  Client_entreprise?: WithCreatedUpdated | null;
  VoitureModel?: WithCreatedUpdated | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const etape = searchParams.get("etape");

    let where = {};
    if (etape) {
      where = { etapeCommande: etape };
    }

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const serializedCommandes = (commandes as unknown[]).map((cmd: unknown) => {
      const item = cmd as CommandeWithRelations;
      return {
        ...item,
        prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
        date_livraison: (item.date_livraison as Date).toISOString(),
        createdAt: (item.createdAt as Date).toISOString(),
        updatedAt: (item.updatedAt as Date).toISOString(),
        client: item.Client
          ? {
              ...item.Client,
              createdAt: (item.Client.createdAt as Date).toISOString(),
              updatedAt: (item.Client.updatedAt as Date).toISOString(),
            }
          : null,
        clientEntreprise: item.Client_entreprise
          ? {
              ...item.Client_entreprise,
              createdAt: (item.Client_entreprise.createdAt as Date).toISOString(),
              updatedAt: (item.Client_entreprise.updatedAt as Date).toISOString(),
            }
          : null,
        voitureModel: item.VoitureModel
          ? {
              ...item.VoitureModel,
              createdAt: (item.VoitureModel.createdAt as Date).toISOString(),
              updatedAt: (item.VoitureModel.updatedAt as Date).toISOString(),
            }
          : null,
      };
    });

    return NextResponse.json(serializedCommandes);
  } catch (error) {
    console.error("Error fetching commandes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des commandes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      clientEntrepriseId,
      voitureModelId,
      couleur,
      motorisation,
      transmission,
      nbr_portes,
      date_livraison,
      prix_unitaire,
      etapeCommande,
      commandeFlag,
    } = body;

    // Validate required fields
    if (
      !voitureModelId ||
      !couleur ||
      !motorisation ||
      !transmission ||
      !nbr_portes ||
      !date_livraison
    ) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 },
      );
    }

    // Create the commande
    const commande = await prisma.commande.create({
      data: {
        id: crypto.randomUUID(),
        clientId: clientId || null,
        clientEntrepriseId: clientEntrepriseId || null,
        voitureModelId,
        couleur,
        motorisation,
        transmission,
        nbr_portes,
        date_livraison: new Date(date_livraison),
        prix_unitaire: prix_unitaire ? parseFloat(prix_unitaire) : null,
        etapeCommande: etapeCommande || "PROPOSITION",
        commandeFlag: commandeFlag || "DISPONIBLE",
        updatedAt: new Date(),
      },
      include: {
        Client: true,
        Client_entreprise: true,
        VoitureModel: true,
      },
    });

    const item = commande as CommandeWithRelations;
    const serializedCommande = {
      ...item,
      prix_unitaire: item.prix_unitaire ? Number(item.prix_unitaire) : null,
      date_livraison: (item.date_livraison as Date).toISOString(),
      createdAt: (item.createdAt as Date).toISOString(),
      updatedAt: (item.updatedAt as Date).toISOString(),
      client: item.Client
        ? {
            ...item.Client,
            createdAt: (item.Client.createdAt as Date).toISOString(),
            updatedAt: (item.Client.updatedAt as Date).toISOString(),
          }
        : null,
      clientEntreprise: item.Client_entreprise
        ? {
            ...item.Client_entreprise,
            createdAt: (item.Client_entreprise.createdAt as Date).toISOString(),
            updatedAt: (item.Client_entreprise.updatedAt as Date).toISOString(),
          }
        : null,
      voitureModel: item.VoitureModel
        ? {
            ...item.VoitureModel,
            createdAt: (item.VoitureModel.createdAt as Date).toISOString(),
            updatedAt: (item.VoitureModel.updatedAt as Date).toISOString(),
          }
        : null,
    };

    return NextResponse.json(serializedCommande, { status: 201 });
  } catch (error) {
    console.error("Error creating commande:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande" },
      { status: 500 },
    );
  }
}
