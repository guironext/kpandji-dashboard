import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
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
    const body = await request.json();
    const { prospectCible } = body as { prospectCible?: number };

    if (prospectCible == null) {
      return NextResponse.json(
        { success: false, error: "prospectCible est requis" },
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

    await executeWithRetry(() =>
      prisma.objectifCible.update({
        where: { id },
        data: {
          prospectCible: prospectCibleNum,
          tauxAtteint: new Decimal(0),
        },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ObjectifCible:", error);
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
      prisma.objectifCible.delete({
        where: { id },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ObjectifCible:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Échec de la suppression",
      },
      { status: 500 }
    );
  }
}
