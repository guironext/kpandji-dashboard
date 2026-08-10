import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.catergorieDiagnostic.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("API getCatergorieDiagnostic error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, description } = body;

    if (!nom?.trim()) {
      return NextResponse.json(
        { success: false, error: "Le nom est requis" },
        { status: 400 }
      );
    }

    const category = await prisma.catergorieDiagnostic.create({
      data: {
        nom: nom.trim(),
        description: description?.trim() || null,
      },
    });
    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("API createCatergorieDiagnostic error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors de la création",
      },
      { status: 500 }
    );
  }
}
