import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const groupes = await prisma.groupePersonnelSAV.findMany({
      orderBy: { nom: "asc" },
      select: {
        id: true,
        nom: true,
        chefGroupeId: true,
        _count: { select: { personnelSAVs: true } },
      },
    });
    return NextResponse.json({ success: true, data: groupes });
  } catch (error) {
    console.error("API groupe-personnel GET:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nom = typeof body.nom === "string" ? body.nom.trim() : "";

    if (!nom) {
      return NextResponse.json(
        { success: false, error: "Le nom du groupe est requis" },
        { status: 400 },
      );
    }

    const groupe = await prisma.groupePersonnelSAV.create({
      data: { nom },
    });
    return NextResponse.json({ success: true, data: groupe });
  } catch (error) {
    console.error("API groupe-personnel POST:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 },
    );
  }
}
