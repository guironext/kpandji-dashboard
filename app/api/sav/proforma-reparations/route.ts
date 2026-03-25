import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Réparations avec diagnostics et pièces pour édition proforma SAV */
export async function GET() {
  try {
    const reparations = await prisma.reparation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        voitureSAV: {
          include: {
            ClientSAV: true,
          },
        },
        DetailDiagnostic: {
          orderBy: { createdAt: "asc" },
          include: {
            catergorieDiagnostic: true,
          },
        },
        PieceSAV: true,
      },
    });

    return NextResponse.json({ success: true, data: reparations });
  } catch (error) {
    console.error("API proforma-reparations GET error:", error);
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
