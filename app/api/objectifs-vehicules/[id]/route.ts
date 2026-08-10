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
    const body = await request.json();
    const { volumeDeVente } = body as { volumeDeVente?: string | number };

    if (volumeDeVente == null || volumeDeVente === "") {
      return NextResponse.json(
        { success: false, error: "volumeDeVente est requis" },
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
      prisma.objectifsvehicules.update({
        where: { id },
        data: { objectif_cible: volumeStr },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating Objectifsvehicules:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Échec de la modification",
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
      prisma.objectifsvehicules.delete({
        where: { id },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Objectifsvehicules:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Échec de la suppression",
      },
      { status: 500 }
    );
  }
}
