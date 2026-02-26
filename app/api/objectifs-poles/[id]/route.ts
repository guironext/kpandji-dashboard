import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }

    const { userId: targetUserId, objectifPoleCible } = body as {
      userId?: string;
      objectifPoleCible?: string;
    };

    if (!targetUserId || !objectifPoleCible) {
      return NextResponse.json(
        { success: false, error: "userId et objectifPoleCible sont requis" },
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

    await executeWithRetry(() =>
      prisma.objectifPole.update({
        where: { id },
        data: {
          userId: targetUserId,
          objectifPoleCible: String(objectifPoleCible).trim(),
        },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ObjectifPole:", error);
    const msg = error instanceof Error ? error.message : "Échec de la modification";
    const isDbError =
      msg.includes("P1001") ||
      msg.includes("Can't reach") ||
      msg.includes("P2003") ||
      msg.includes("P2025");
    return NextResponse.json(
      {
        success: false,
        error: isDbError
          ? "Base de données inaccessible ou enregistrement introuvable."
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
      prisma.objectifPole.delete({
        where: { id },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ObjectifPole:", error);
    const msg = error instanceof Error ? error.message : "Échec de la suppression";
    const isDbError =
      msg.includes("P1001") ||
      msg.includes("Can't reach") ||
      msg.includes("P2025");
    return NextResponse.json(
      {
        success: false,
        error: isDbError
          ? "Base de données inaccessible ou enregistrement introuvable."
          : msg,
      },
      { status: 500 }
    );
  }
}
