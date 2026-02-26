import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non autorisé", data: [] }, { status: 401 });
    }

    const objectifs = await executeWithRetry(() =>
      prisma.objectifsvehicules.findMany({
        orderBy: [{ createdAt: "desc" }],
        include: {
          User: { select: { id: true, firstName: true, lastName: true } },
          ObjectifPeriod: { select: { id: true, objectif_start: true, objectif_end: true } },
        },
      })
    );

    const data = objectifs.map((o) => ({
      id: o.id,
      userId: o.userId,
      objectifPeriodId: o.objectifPeriodId,
      objectifCible: o.objectif_cible,
      commercialName: o.User ? `${o.User.firstName} ${o.User.lastName}`.trim() : "",
      periodStart: o.ObjectifPeriod?.objectif_start,
      periodEnd: o.ObjectifPeriod?.objectif_end,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching Objectifsvehicules:", error);
    return NextResponse.json(
      { success: false, error: "Échec du chargement", data: [] },
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }

    const { objectifPeriodId, userId: targetUserId, volumeDeVente } = body as {
      objectifPeriodId?: string;
      userId?: string;
      volumeDeVente?: string | number;
    };

    if (!objectifPeriodId || !targetUserId || volumeDeVente == null || volumeDeVente === "") {
      return NextResponse.json(
        { success: false, error: "objectifPeriodId, userId et volumeDeVente sont requis" },
        { status: 400 }
      );
    }

    const periodExists = await executeWithRetry(() =>
      prisma.objectifPeriod.findUnique({ where: { id: objectifPeriodId }, select: { id: true } })
    );
    if (!periodExists) {
      return NextResponse.json(
        { success: false, error: "Période introuvable. Veuillez sélectionner une période valide." },
        { status: 400 }
      );
    }

    const userExists = await executeWithRetry(() =>
      prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } })
    );
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: "Commercial introuvable." },
        { status: 400 }
      );
    }

    const volumeStr = String(volumeDeVente).trim();
    if (!volumeStr) {
      return NextResponse.json(
        { success: false, error: "Le volume de vente est requis" },
        { status: 400 }
      );
    }

    await executeWithRetry(() =>
      prisma.objectifsvehicules.create({
        data: {
          objectifPeriodId,
          userId: targetUserId,
          objectif_cible: volumeStr,
        },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating Objectifsvehicules:", error);
    const msg = error instanceof Error ? error.message : "Échec de la création";
    const isDbError =
      msg.includes("P1001") ||
      msg.includes("Can't reach") ||
      msg.includes("P2003") ||
      msg.includes("foreign key");
    return NextResponse.json(
      {
        success: false,
        error: isDbError
          ? "Base de données inaccessible ou référence invalide. Vérifiez votre connexion."
          : msg,
      },
      { status: 500 }
    );
  }
}
