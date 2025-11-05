import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const voitures = await prisma.voiture.findMany({
      where: { clientId },
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
