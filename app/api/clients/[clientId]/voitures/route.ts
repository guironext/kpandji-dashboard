import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const voitures = await prisma.voiture.findMany({
      where: { clientId: params.clientId },
      include: { voitureModel: true },
    });
    return NextResponse.json(voitures);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch voitures" },
      { status: 500 }
    );
  }
}
