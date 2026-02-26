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
      prisma.objectifsfinancieres.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          nomDuCommercial: true,
          pole: true,
          duree: true,
          chiffreAffaire: true,
          finObjectif: true,
          pourcentageAtteint: true,
          ecartCible: true,
          objectifPeriodId: true,
          userId: true,
        } as Record<string, boolean>,
      })
    );

    type ObjectifRow = {
      id: string;
      nomDuCommercial: string;
      pole: string;
      duree: string;
      chiffreAffaire: { toNumber?: () => number } | number;
      finObjectif: Date | null;
      pourcentageAtteint: { toNumber?: () => number } | number;
      ecartCible: { toNumber?: () => number } | number | null;
      objectifPeriodId: string | null;
      userId: string | null;
    };
    const rows = objectifs as unknown as ObjectifRow[];

    const data = rows.map((o) => ({
      id: o.id,
      nomDuCommercial: o.nomDuCommercial,
      pole: o.pole,
      duree: o.duree,
      chiffreAffaire: Number(o.chiffreAffaire),
      finObjectif: o.finObjectif ? o.finObjectif.toISOString() : null,
      pourcentageAtteint: Number(o.pourcentageAtteint),
      ecartCible: o.ecartCible != null ? Number(o.ecartCible) : null,
      objectifPeriodId: o.objectifPeriodId,
      userId: o.userId,
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
    const { userId: targetUserId, objectifPeriodId, chiffreAffaire } = body;

    if (!targetUserId || !chiffreAffaire) {
      return NextResponse.json(
        { success: false, error: "Commercial et chiffre d'affaires sont requis" },
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

    const user = await executeWithRetry(() =>
      prisma.user.findUnique({
        where: { id: String(targetUserId) },
        select: { id: true, firstName: true, lastName: true },
      })
    );
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Commercial introuvable" },
        { status: 400 }
      );
    }
    const nomDuCommercial = `${user.firstName} ${user.lastName}`.trim();

    const objectif = await executeWithRetry(() =>
      prisma.objectifsfinancieres.create({
        data: {
          nomDuCommercial,
          pole: "",
          duree: "",
          chiffreAffaire: new Decimal(ca),
          pourcentageAtteint: new Decimal(0),
          userId: user.id,
          objectifPeriodId: objectifPeriodId || null,
          objectif_cible: String(ca),
        } as unknown as Parameters<typeof prisma.objectifsfinancieres.create>[0]["data"],
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
