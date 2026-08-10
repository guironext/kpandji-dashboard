import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }
    const { userId: targetUserId, chiffreAffaire } = body;

    if (chiffreAffaire == null) {
      return NextResponse.json(
        { success: false, error: "chiffreAffaire est requis" },
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

    const updateData: {
      chiffreAffaire: Decimal;
      objectif_cible: string;
      nomDuCommercial?: string;
      userId?: string;
    } = {
      chiffreAffaire: new Decimal(ca),
      objectif_cible: String(ca),
    };

    if (targetUserId && typeof targetUserId === "string") {
      const user = await executeWithRetry(() =>
        prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, firstName: true, lastName: true },
        })
      );
      if (user) {
        updateData.userId = user.id;
        updateData.nomDuCommercial = `${user.firstName} ${user.lastName}`.trim();
      }
    }

    await executeWithRetry(() =>
      prisma.objectifsfinancieres.update({
        where: { id },
        data: updateData,
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating Objectifsfinancieres:", error);
    const msg = error instanceof Error ? error.message : "Échec de la mise à jour";
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    await executeWithRetry(() =>
      prisma.objectifsfinancieres.delete({
        where: { id },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Objectifsfinancieres:", error);
    const msg = error instanceof Error ? error.message : "Échec de la suppression";
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
