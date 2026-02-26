import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

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

    await executeWithRetry(() => prisma.objectifPeriod.delete({ where: { id } }));

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ObjectifPeriod:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: msg.includes("P2025") || msg.includes("Record to delete")
          ? "Cette période n'existe plus."
          : msg || "Échec de la suppression",
      },
      { status: 500 }
    );
  }
}
