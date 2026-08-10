import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const voitures = await prisma.voiture.findMany({
      where: { clientId },
      include: { VoitureModel: true },
    });
    return NextResponse.json(voitures);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch voitures" },
      { status: 500 }
    );
  }
}
