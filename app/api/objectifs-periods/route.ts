import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function formatDuree(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 31) return `${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  const months = Math.round(diffDays / 30);
  return `${months} mois`;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Non autorisé", data: [] }, { status: 401 });
    }

    const periods = await executeWithRetry(() =>
      prisma.objectifPeriod.findMany({
        orderBy: { objectif_start: "desc" },
        select: {
          id: true,
          objectif_start: true,
          objectif_end: true,
          User: { select: { id: true, firstName: true, lastName: true } },
        },
      })
    );

    const data = periods.map((p) => ({
      id: p.id,
      start: p.objectif_start,
      end: p.objectif_end,
      commercialName: p.User
        ? `${p.User.firstName} ${p.User.lastName}`.trim()
        : "",
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching ObjectifPeriods:", error);
    return NextResponse.json(
      { success: false, error: "Échec du chargement", data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      start,
      end,
      duree,
      objectifFinanciere,
      objectifClients,
      volumeVehicule,
      userId: commercialUserId,
    } = body;

    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: "start et end sont requis" },
        { status: 400 }
      );
    }

    let userId: string;
    if (commercialUserId) {
      userId = commercialUserId;
    } else {
      const userResult = await getOrCreateUser(clerkId);
      if (!userResult.success || !userResult.data) {
        return NextResponse.json(
          { success: false, error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }
      userId = userResult.data.id;
    }

    const startDate = typeof start === "string" ? new Date(start) : new Date(start);
    const endDate = typeof end === "string" ? new Date(end) : new Date(end);

    const objectif_duree =
      typeof duree === "string" && duree.trim()
        ? duree.trim()
        : formatDuree(startDate, endDate);

    const period = await executeWithRetry(() =>
      prisma.objectifPeriod.create({
        data: {
          objectif_start: startDate,
          objectif_end: endDate,
          objectif_duree,
          objectifs_financieres: typeof objectifFinanciere === "string" ? objectifFinanciere : "",
          objectifs_vehicules: typeof volumeVehicule === "string" ? volumeVehicule : "",
          objectifs_clients: typeof objectifClients === "string" ? objectifClients : "",
          userId,
        },
      })
    );

    revalidatePath("/responsablecommercial/objectifs");
    return NextResponse.json({
      success: true,
      data: {
        id: period.id,
        start: period.objectif_start,
        end: period.objectif_end,
      },
    });
  } catch (error) {
    console.error("Error creating ObjectifPeriod:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isDbError =
      msg.includes("P1001") ||
      msg.includes("Can't reach") ||
      msg.includes("E57P01") ||
      msg.includes("administrator command") ||
      msg.includes("terminating connection");
    return NextResponse.json(
      {
        success: false,
        error: isDbError
          ? "Base de données inaccessible. Vérifiez votre connexion et réessayez."
          : msg || "Échec de la création",
      },
      { status: 500 }
    );
  }
}
