import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
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

    await prisma.objectifFinanciere.update({
      where: { id },
      data: {
        nomDuCommercial: String(nomDuCommercial),
        pole: String(pole),
        duree: String(duree),
        chiffreAffaire: new Decimal(ca),
        finObjectif: finObjectifDate,
      },
    });

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ObjectifFinanciere:", error);
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
    await prisma.objectifFinanciere.delete({
      where: { id },
    });

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ObjectifFinanciere:", error);
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
