import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const objectifs = await executeWithRetry(() =>
      prisma.objectifFinanciere.findMany({
      orderBy: [{ duree: "desc" }, { nomDuCommercial: "asc" }],
      select: {
        id: true,
        nomDuCommercial: true,
        pole: true,
        duree: true,
        chiffreAffaire: true,
        finObjectif: true,
        pourcentageAtteint: true,
        ecartCible: true,
      },
    })
    );

    const data = objectifs.map((o) => ({
      id: o.id,
      nomDuCommercial: o.nomDuCommercial,
      pole: o.pole,
      duree: o.duree,
      chiffreAffaire: Number(o.chiffreAffaire),
      finObjectif: o.finObjectif ? o.finObjectif.toISOString() : null,
      pourcentageAtteint: Number(o.pourcentageAtteint),
      ecartCible: o.ecartCible != null ? Number(o.ecartCible) : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching ObjectifsFinancieres:", error);
    const msg = error instanceof Error ? error.message : "Échec du chargement";
    const isDbError = msg.includes("reach database") || msg.includes("connection");
    return NextResponse.json(
      {
        success: false,
        error: isDbError
          ? "Connexion base de données impossible. Vérifiez DATABASE_URL et que la base Neon est active."
          : msg,
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }
    const { nomDuCommercial, pole, duree, chiffreAffaire, finObjectif } = body;

    if (!nomDuCommercial || !pole || !duree || chiffreAffaire == null) {
      return NextResponse.json(
        { success: false, error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const ca = Number(chiffreAffaire);
    if (isNaN(ca) || ca <= 0) {
      return NextResponse.json(
        { success: false, error: "Chiffre d'affaires invalide" },
        { status: 400 }
      );
    }

    const finObjectifDate =
      finObjectif && (typeof finObjectif === "string" || typeof finObjectif === "number" || finObjectif instanceof Date)
        ? new Date(finObjectif)
        : null;

    const objectif = await executeWithRetry(() =>
      prisma.objectifFinanciere.create({
      data: {
        nomDuCommercial: String(nomDuCommercial),
        pole: String(pole),
        duree: String(duree),
        chiffreAffaire: new Decimal(ca),
        finObjectif: finObjectifDate,
        pourcentageAtteint: new Decimal(0),
      },
    })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true, data: { id: objectif.id } });
  } catch (error) {
    console.error("Error creating ObjectifFinanciere:", error);
    const msg = error instanceof Error ? error.message : "Échec de la création";
    const isDbError = msg.includes("reach database") || msg.includes("connection");
    return NextResponse.json(
      {
        success: false,
        error: isDbError
          ? "Connexion base de données impossible. Vérifiez DATABASE_URL et que la base Neon est active."
          : msg,
      },
      { status: 500 }
    );
  }
}
