import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";
import { UserRole, type Agenda } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const pad = (n: number) => n.toString().padStart(2, "0");

function combineDateTime(dateYMD: string, timeHM: string): Date {
  const [y, mo, d] = dateYMD.split("-").map(Number);
  const [h, mi] = timeHM.split(":").map(Number);
  return new Date(Date.UTC(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, 0, 0));
}

function serializeAgenda(a: Agenda) {
  const dateStr = `${a.date.getUTCFullYear()}-${pad(
    a.date.getUTCMonth() + 1
  )}-${pad(a.date.getUTCDate())}`;
  const startTime = `${pad(a.heureDebut.getUTCHours())}:${pad(
    a.heureDebut.getUTCMinutes()
  )}`;
  const endTime = `${pad(a.heureFin.getUTCHours())}:${pad(
    a.heureFin.getUTCMinutes()
  )}`;
  return {
    id: a.id,
    titre: a.titre,
    description: a.description,
    date: dateStr,
    startTime,
    endTime,
    color: a.color,
    lieu: a.lieu,
  };
}

function serializeAgendaWithOwner(
  a: Agenda & { user?: { firstName: string; lastName: string; email: string } }
) {
  const base = serializeAgenda(a);
  const owner =
    a.user?.firstName || a.user?.lastName
      ? `${a.user?.firstName ?? ""} ${a.user?.lastName ?? ""}`.trim()
      : a.user?.email ?? null;
  return { ...base, owner: owner || null };
}

function isValidYMD(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isValidHM(s: unknown): s is string {
  return typeof s === "string" && /^\d{2}:\d{2}$/.test(s);
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Non autorisé. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable." },
        { status: 401 }
      );
    }

    const wantsAll = req.nextUrl.searchParams.get("all") === "1";
    const canSeeAll =
      userResult.data.role === UserRole.MANAGER ||
      userResult.data.role === UserRole.ADMIN;

    const orderBy: Prisma.AgendaOrderByWithRelationInput[] = [
      { date: "asc" },
      { heureDebut: "asc" },
    ];
    const items =
      wantsAll && canSeeAll
        ? await executeWithRetry(() =>
            prisma.agenda.findMany({
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
              orderBy,
            })
          )
        : await executeWithRetry(() =>
            prisma.agenda.findMany({
              where: { userId: userResult.data.id },
              orderBy,
            })
          );

    return NextResponse.json({
      success: true,
      data:
        wantsAll && canSeeAll
          ? (items as Array<
              Agenda & { user: { firstName: string; lastName: string; email: string } }
            >).map(serializeAgendaWithOwner)
          : (items as Agenda[]).map(serializeAgenda),
    });
  } catch (error) {
    console.error("[GET /api/agenda]", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors du chargement";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { success: false, error: "Non autorisé. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable." },
        { status: 401 }
      );
    }

    let body: {
      titre?: string;
      description?: string | null;
      date?: string;
      startTime?: string;
      endTime?: string;
      color?: string;
      lieu?: string | null;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }

    const titre = (body.titre || "").trim();
    if (!titre) {
      return NextResponse.json(
        { success: false, error: "Le titre est requis" },
        { status: 400 }
      );
    }
    if (!isValidYMD(body.date)) {
      return NextResponse.json(
        { success: false, error: "La date est invalide (yyyy-MM-dd)" },
        { status: 400 }
      );
    }
    if (!isValidHM(body.startTime) || !isValidHM(body.endTime)) {
      return NextResponse.json(
        { success: false, error: "Les heures sont invalides (HH:mm)" },
        { status: 400 }
      );
    }
    if (body.endTime <= body.startTime) {
      return NextResponse.json(
        { success: false, error: "La fin doit être après le début" },
        { status: 400 }
      );
    }

    const dateOnly = combineDateTime(body.date, "00:00");
    const heureDebut = combineDateTime(body.date, body.startTime);
    const heureFin = combineDateTime(body.date, body.endTime);

    const created = await executeWithRetry(() =>
      prisma.agenda.create({
        data: {
          titre,
          description: body.description?.toString().trim() || null,
          date: dateOnly,
          heureDebut,
          heureFin,
          lieu: body.lieu?.toString().trim() || null,
          color: (body.color || "indigo").toString(),
          userId: userResult.data.id,
        },
      })
    );

    return NextResponse.json({
      success: true,
      data: serializeAgenda(created),
    });
  } catch (error) {
    console.error("[POST /api/agenda]", error);
    const msg =
      error instanceof Error ? error.message : "Erreur lors de la création";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
