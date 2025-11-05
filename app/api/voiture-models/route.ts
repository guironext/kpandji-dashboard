import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const models = await prisma.voitureModel.findMany({
      orderBy: { model: 'asc' }
    });
    return NextResponse.json(models);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}