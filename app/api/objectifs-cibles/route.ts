import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non autorisé", data: [] }, { status: 401 });
    }

    const objectifs = await executeWithRetry(() =>
      prisma.objectifCible.findMany({
        where: { user: { role: "COMMERCIAL" } },
        orderBy: [{ period: { objectif_start: "desc" } }, { user: { firstName: "asc" } }],
        include: {
          period: { select: { id: true, objectif_start: true, objectif_end: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      })
    );

    const data = objectifs.map((o) => ({
      id: o.id,
      periodId: o.periodId,
      userId: o.userId,
      commercialName: `${o.user.firstName} ${o.user.lastName}`.trim(),
      periodStart: o.period.objectif_start,
      periodEnd: o.period.objectif_end,
      prospectCible: o.prospectCible,
      prospectReel: o.prospectReel,
      tauxAtteint: Number(o.tauxAtteint),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching ObjectifsCibles:", error);
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

    const body = await request.json();
    const { periodId, userId: targetUserId, prospectCible } = body as {
      periodId?: string;
      userId?: string;
      prospectCible?: number;
    };

    if (!periodId || !targetUserId || prospectCible == null) {
      return NextResponse.json(
        { success: false, error: "periodId, userId et prospectCible sont requis" },
        { status: 400 }
      );
    }

    const prospectCibleNum = Number(prospectCible);
    if (isNaN(prospectCibleNum) || prospectCibleNum < 0) {
      return NextResponse.json(
        { success: false, error: "prospectCible doit être un nombre positif" },
        { status: 400 }
      );
    }

    const existing = await executeWithRetry(() =>
      prisma.objectifCible.findUnique({
        where: { periodId_userId: { periodId, userId: targetUserId } },
      })
    );

    if (existing) {
      return NextResponse.json({
        success: false,
        error: "Un objectif existe déjà pour ce commercial sur cette période.",
      });
    }

    await executeWithRetry(() =>
      prisma.objectifCible.create({
        data: {
          periodId,
          userId: targetUserId,
          prospectCible: prospectCibleNum,
          prospectReel: 0,
          tauxAtteint: new Decimal(0),
        },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating ObjectifCible:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Échec de la création",
      },
      { status: 500 }
    );
  }
}
