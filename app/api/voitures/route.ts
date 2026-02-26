import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const voitures = await prisma.voiture.findMany({
      include: { VoitureModel: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: voitures });
  } catch (error) {
    console.error("Error fetching voitures:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du chargement des véhicules" },
      { status: 500 }
    );
  }
}
