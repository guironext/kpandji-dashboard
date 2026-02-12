import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { EtapeMontage } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const etape = searchParams.get("etape") as EtapeMontage | null;

    console.log("Fetching montages with etape:", etape);

    const montages = await prisma.montage.findMany({
      where: etape
        ? {
            etapeMontage: {
              equals: etape,
            },
          }
        : undefined,
      include: {
        Commande_Montage_commandeIdToCommande: {
          include: {
            Client: true,
            Client_entreprise: true,
            VoitureModel: true,
          },
        },
        OrdreMontage: {
          include: {
            NumeroChassis: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Found montages:", montages.length);
    console.log("Montages data:", montages);

    return NextResponse.json(montages);
  } catch (error) {
    console.error("Error fetching montages:", error);
    return NextResponse.json(
      { error: "Failed to fetch montages" },
      { status: 500 },
    );
  }
}
